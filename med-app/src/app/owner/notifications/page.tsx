import { createClient } from '@/lib/supabase/server'
import NotificationsForm from './NotificationsForm'

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: universities } = await supabase
    .from('universities')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, university_id')
    .eq('is_published', true)
    .order('name')

  const { data: recentNotifications } = await supabase
    .from('notifications')
    .select('id, title, message, target_type, priority, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Notifications Center</h1>
        <p className="text-[#64748B] mt-1">Send announcements to users, universities, or subjects</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Notification Form */}
        <NotificationsForm
          universities={universities ?? []}
          subjects={subjects ?? []}
        />

        {/* Recent Notifications */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="font-semibold text-[#0F172A] mb-4">Recent Notifications</h2>
          {!recentNotifications || recentNotifications.length === 0 ? (
            <p className="text-sm text-[#64748B]">No notifications sent yet.</p>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((n) => (
                <div key={n.id} className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-[#0F172A]">{n.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      n.priority === 'critical' ? 'bg-red-50 text-red-700 border border-red-200'
                      : n.priority === 'important' ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-gray-100 text-gray-500'
                    }`}>{n.priority}</span>
                  </div>
                  <p className="text-xs text-[#64748B] mb-1">{n.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#64748B]">To: {n.target_type}</span>
                    <span className="text-xs text-[#64748B]">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}