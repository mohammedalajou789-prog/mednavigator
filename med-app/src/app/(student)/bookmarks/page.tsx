import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function BookmarksPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('id, bookmark_type, created_at, subjects(id, name, university_id), lectures(id, title, subject_id)')
    .eq('user_id', profile?.id)
    .order('created_at', { ascending: false })

  const TYPE_ICON: Record<string, string> = {
    subject: '📚',
    lecture: '📖',
    question: '❓',
    flashcard: '🃏',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Bookmarks</h1>
        <p className="text-[#64748B] mt-1">{bookmarks?.length ?? 0} saved items</p>
      </div>

      {!bookmarks || bookmarks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-[#E2E8F0]">
          <p className="text-4xl mb-3">🔖</p>
          <p className="text-lg font-medium text-[#0F172A]">No bookmarks yet</p>
          <p className="text-[#64748B] mt-1 text-sm">Save subjects and lectures to find them quickly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map(bm => {
            const subject = bm.subjects as Record<string, unknown> | null
            const lecture = bm.lectures as Record<string, unknown> | null
            const label = bm.bookmark_type === 'subject'
              ? String(subject?.name ?? 'Unknown Subject')
              : String(lecture?.title ?? 'Unknown Lecture')
            const href = bm.bookmark_type === 'subject' && subject
              ? `/${subject.university_id}/${subject.id}`
              : lecture && subject
              ? `/${subject.university_id}/${subject.id}/${lecture.id}`
              : '#'

            return (
              <Link
                key={bm.id}
                href={href}
                className="flex items-center gap-4 bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm hover:border-[#2563EB] hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
                  {TYPE_ICON[bm.bookmark_type] ?? '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">{label}</p>
                  <p className="text-xs text-[#64748B] mt-0.5 capitalize">{bm.bookmark_type}</p>
                </div>
                <p className="text-xs text-[#64748B] flex-shrink-0">{new Date(bm.created_at).toLocaleDateString()}</p>
                <svg className="w-4 h-4 text-[#64748B] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}