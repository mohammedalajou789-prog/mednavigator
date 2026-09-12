import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { entity_id, entity_type, renumber_map, present_slots } = await req.json()

    if (!entity_id || !entity_type) {
      return NextResponse.json({ error: 'entity_id and entity_type are required' }, { status: 400 })
    }

    // ── Step 1: Fetch all existing slots for this entity ──────────────────
    const { data: existingSlots, error: fetchError } = await supabase
      .from('image_slots')
      .select('id, slot_number, media_id')
      .eq('entity_id', entity_id)
      .eq('entity_type', entity_type)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!existingSlots || existingSlots.length === 0) {
      return NextResponse.json({ success: true, message: 'No slots to process' })
    }

    // ── Step 2: Delete slots that are no longer in content ─────────────────
    const presentSet = new Set((present_slots as number[]).map(Number))
    const slotsToDelete = existingSlots.filter(s => !presentSet.has(s.slot_number))

    if (slotsToDelete.length > 0) {
      const deleteIds = slotsToDelete.map(s => s.id)
      const { error: deleteError } = await supabase
        .from('image_slots')
        .delete()
        .in('id', deleteIds)

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }
    }

    // ── Step 3: Renumber remaining slots ───────────────────────────────────
    const map = renumber_map as Record<string, number>
    const slotsToRenumber = existingSlots.filter(s => presentSet.has(s.slot_number))

    for (const slot of slotsToRenumber) {
      const newNum = map[String(slot.slot_number)]
      if (newNum && newNum !== slot.slot_number) {
        const { error: updateError } = await supabase
          .from('image_slots')
          .update({ slot_number: newNum })
          .eq('id', slot.id)

        if (updateError) {
          console.error(`Failed to renumber slot ${slot.slot_number} -> ${newNum}:`, updateError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      deleted: slotsToDelete.length,
      renumbered: slotsToRenumber.length,
    })
  } catch (err) {
    console.error('renumber error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
