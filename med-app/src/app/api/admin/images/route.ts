import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role')
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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, GIF allowed.' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
    const filePath = entityId ? `${entityId}/${fileName}` : fileName

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('sheet-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('sheet-images')
      .getPublicUrl(filePath)

    const publicUrl = urlData.public_url

    // Save to media_library
    const { data: mediaRecord, error: mediaError } = await supabase
      .from('media_library')
      .insert({
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        uploaded_by: profile ? undefined : undefined,
      })
      .select()
      .single()

    // If entity info provided, link to image_slots
    if (entityType && entityId && slotNumber && mediaRecord) {
      await supabase
        .from('image_slots')
        .upsert({
          entity_type: entityType,
          entity_id: entityId,
          slot_number: parseInt(slotNumber),
          media_id: mediaRecord.id,
        }, {
          onConflict: 'entity_type,entity_id,slot_number',
        })
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      media_id: mediaRecord?.id ?? null,
    })
  } catch (err) {
    console.error('Image upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}