import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const entityType = formData.get('entity_type') as string | null
    const entityId = formData.get('entity_id') as string | null
    const slotNumber = formData.get('slot_number') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type.' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
    const filePath = entityId ? `${entityId}/${fileName}` : fileName

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    console.log('Uploading to storage:', filePath)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('sheet-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 })
    }

    console.log('Upload success:', uploadData)

    const { data: urlData } = supabase.storage
      .from('sheet-images')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    console.log('Public URL:', publicUrl)

    const { data: mediaRecord, error: mediaError } = await supabase
      .from('media_library')
      .insert({
        file_name: file.name,
        file_url: publicUrl,
        file_type: 'image',
        uploaded_by: profile.id,
      })
      .select()
      .single()

    if (mediaError) {
      console.error('Media library error:', mediaError)
      return NextResponse.json({ error: `Media library error: ${mediaError.message}` }, { status: 500 })
    }

    console.log('Media record created:', mediaRecord?.id)

    if (entityType && entityId && slotNumber && mediaRecord) {
      console.log('Attempting image_slots upsert:', { entityType, entityId, slotNumber, mediaId: mediaRecord.id })
      const { data: slotData, error: slotError } = await supabase
        .from('image_slots')
        .upsert({
          entity_type: entityType,
          entity_id: entityId,
          slot_number: parseInt(slotNumber),
          media_id: mediaRecord.id,
        }, {
          onConflict: 'entity_type,entity_id,slot_number',
        })
        .select()

      if (slotError) {
        console.error('Image slot error:', slotError)
        return NextResponse.json({ error: `Slot error: ${slotError.message}` }, { status: 500 })
      }
      console.log('Slot saved:', slotData)
    } else {
      console.log('Missing params for slot:', { entityType, entityId, slotNumber, mediaRecord: !!mediaRecord })
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      media_id: mediaRecord?.id ?? null,
      slot_saved: !!(entityType && entityId && slotNumber && mediaRecord),
      debug: { entityType, entityId, slotNumber, mediaId: mediaRecord?.id },
    })

  } catch (err) {
    console.error('Unexpected image upload error:', err)
    return NextResponse.json({ error: `Unexpected error: ${String(err)}` }, { status: 500 })
  }
}