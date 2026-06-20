import { createClient } from '@/lib/supabase/client'

export type DeviceCheckResult =
  | { allowed: true }
  | { allowed: false; reason: 'device_mismatch'; supportWhatsApp: string }

export async function checkAndRegisterDevice(
  userId: string,
  fingerprint: string
): Promise<DeviceCheckResult> {
  const supabase = createClient()

  // Get all active devices for this user
  const { data: existingDevices } = await supabase
    .from('devices')
    .select('id, device_fingerprint, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)

  // No devices registered yet — register this one as primary
  if (!existingDevices || existingDevices.length === 0) {
    await supabase.from('devices').insert({
      user_id: userId,
      device_fingerprint: fingerprint,
      device_name: navigator.userAgent.slice(0, 100),
      is_active: true,
      last_login_at: new Date().toISOString(),
    })
    return { allowed: true }
  }

  // Check if this fingerprint matches any registered device
  const matchingDevice = existingDevices.find(
    (d) => d.device_fingerprint === fingerprint
  )

  if (matchingDevice) {
    // Update last login time
    await supabase
      .from('devices')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', matchingDevice.id)
    return { allowed: true }
  }

  // Device does not match — get support WhatsApp from platform settings
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('whatsapp_url')
    .single()

  const supportWhatsApp = settings?.whatsapp_url ?? '0791993470'

  return {
    allowed: false,
    reason: 'device_mismatch',
    supportWhatsApp,
  }
}