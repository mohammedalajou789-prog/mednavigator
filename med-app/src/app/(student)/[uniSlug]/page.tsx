import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/services/user';
import { checkUserAccess } from '@/lib/services/subscriptions';
import PinSubjectButton from '@/components/student/PinSubjectButton';

// ─── Types ───────────────────────────────────────────────────────────────────

interface University {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  description: string | null;
  logo_url: string | null;
  logo_media_id: string | null;
  founded_year: number | null;
}

interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  subject_type: string;
  access_mode: string | null;
  is_free: boolean | null;
  category: string | null;
  lecture_count: number;
  chapter_count: number;
}

interface SubjectWithAccess extends Subject {
  accessAllowed: boolean;
  progressCount: number;
  totalLectures: number;
  isPinned: boolean;
}

interface PageProps {
  params: Promise<{ uniSlug: string }>;
}

// ─── Group metadata ───────────────────────────────────────────────────────────

const GROUP_META: Record<string, { label: string; barColor: string; order: number }> = {
  'pre-clinical': {
    label: 'PRE-CLINICAL',
    barColor: 'linear-gradient(180deg,#16A34A,#059669)',
    order: 0,
  },
  clinical_major: {
    label: 'CLINICAL – MAJOR',
    barColor: 'linear-gradient(180deg,#2563EB,#7C3AED)',
    order: 1,
  },
  clinical_minor: {
    label: 'CLINICAL – MINOR',
    barColor: 'linear-gradient(180deg,#D97706,#EA580C)',
    order: 2,
  },
};

function getCategoryGroup(category: string | null): string {
  if (!category) return 'clinical_major';
  const c = category.toLowerCase();
  if (c.includes('pre') || c.includes('preclinical')) return 'pre-clinical';
  if (c.includes('minor')) return 'clinical_minor';
  return 'clinical_major';
}

function getCategoryLabel(subject: Subject): string {
  const g = getCategoryGroup(subject.category);
  if (g === 'pre-clinical') return 'Pre-Clinical';
  if (g === 'clinical_minor') return 'Minor';
  return 'Clinical';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLogoUrl(university: University): string | null {
  // Prefer media library URL if set; fall back to legacy logo_url
  return university.logo_url ?? null;
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default async function UniversityPage({ params }: PageProps) {
  const { uniSlug } = await params;

  const supabase = await createServerClient();
  const profile = await getUserProfile();

  // ── 1. Fetch university ────────────────────────────────────────────────────
  const { data: university, error: uniError } = await supabase
    .from('universities')
    .select('id, name, slug, country, description, logo_url, logo_media_id, founded_year')
    .eq('slug', uniSlug as any)
    .eq('is_active', true)
    .maybeSingle();

  if (uniError || !university) {
    redirect('/home');
  }

  // ── 2. Fetch subjects ──────────────────────────────────────────────────────
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, slug, description, subject_type, access_mode, is_free, category')
    .eq('university_id', (university as any).id)
    .eq('is_active', true)
    .eq('is_published', true)
    .order('name');

  const subjectList: Subject[] = (subjects ?? []) as Subject[];

  // ── 3. Fetch lecture counts per subject ────────────────────────────────────
  const subjectIds = subjectList.map((s) => s.id);

  let lectureCountMap: Record<string, number> = {};
  let chapterCountMap: Record<string, number> = {};

  if (subjectIds.length > 0) {
    const { data: lectureCounts } = await supabase
      .from('lectures')
      .select('subject_id')
      .in('subject_id', subjectIds)
      .eq('status', 'published');

    if (lectureCounts) {
      for (const row of lectureCounts) {
        lectureCountMap[row.subject_id] = (lectureCountMap[row.subject_id] ?? 0) + 1;
      }
    }

    const { data: chapterCounts } = await supabase
      .from('chapters')
      .select('subject_id')
      .in('subject_id', subjectIds)
      .is('archived_at', null);

    if (chapterCounts) {
      for (const row of chapterCounts) {
        chapterCountMap[row.subject_id] = (chapterCountMap[row.subject_id] ?? 0) + 1;
      }
    }
  }

  // ── 4. Access check + progress + pinned for each subject ──────────────────
  let pinnedSet = new Set<string>();
  let progressMap: Record<string, number> = {};

  if (profile) {
    const { data: pinned } = await supabase
      .from('pinned_subjects')
      .select('subject_id')
      .eq('user_id', profile.id)
      .in('subject_id', subjectIds);

    if (pinned) pinnedSet = new Set(pinned.map((p) => p.subject_id));

    const { data: progress } = await supabase
      .from('user_progress')
      .select('lecture_id')
      .eq('user_id', profile.id)
      .eq('completed', true);

    if (progress) {
      for (const p of progress) {
        progressMap[p.lecture_id] = (progressMap[p.lecture_id] ?? 0) + 1;
      }
    }
  }

  // ── 5. Build enriched subject list ────────────────────────────────────────
  const enrichedSubjects: SubjectWithAccess[] = await Promise.all(
    subjectList.map(async (s) => {
      const isFree = s.is_free === true || s.access_mode === 'free';
      let accessAllowed = isFree;

      if (!accessAllowed && profile) {
        const access = await checkUserAccess(s.id, profile.id);
        accessAllowed = access.allowed;
      }

      const totalLectures = lectureCountMap[s.id] ?? 0;

      return {
        ...s,
        accessAllowed,
        progressCount: 0, // simplified: would need lecture IDs per subject to compute
        totalLectures,
        lecture_count: totalLectures,
        chapter_count: chapterCountMap[s.id] ?? 0,
        isPinned: pinnedSet.has(s.id),
      };
    })
  );

  // ── 6. Group subjects ──────────────────────────────────────────────────────
  const groups: Array<{
    id: string;
    label: string;
    barColor: string;
    subjects: SubjectWithAccess[];
  }> = [];

  const groupOrder = ['pre-clinical', 'clinical_major', 'clinical_minor'];
  for (const gid of groupOrder) {
    const groupSubjects = enrichedSubjects.filter(
      (s) => getCategoryGroup(s.category) === gid
    );
    if (groupSubjects.length > 0) {
      const meta = GROUP_META[gid];
      groups.push({
        id: gid,
        label: meta.label,
        barColor: meta.barColor,
        subjects: groupSubjects,
      });
    }
  }

  const logoUrl = getLogoUrl(university as any);
  const uni = university as any;
  const totalSubjects = enrichedSubjects.length;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: 'var(--bg-page, #F8FAFC)', color: '#0F172A', minHeight: '100vh' }}>
      <main
        style={{
          padding: 'clamp(16px, 4vw, 28px) clamp(16px, 4vw, 28px) 64px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {/* ── Breadcrumb ── */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#94A3B8',
            marginBottom: '20px',
            animation: 'mn-fadeUp .45s ease backwards',
          }}
        >
          <Link href="/home" style={{ fontWeight: 600, color: '#64748B' }}>
            Home
          </Link>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span style={{ fontWeight: 600, color: '#0F172A' }}>{uni.name}</span>
        </nav>

        {/* ── University Header Card ── */}
        <div
          style={{
            position: 'relative',
            borderRadius: '22px',
            overflow: 'hidden',
            padding: 'clamp(20px, 4vw, 32px)',
            marginBottom: '32px',
            background: 'linear-gradient(120deg,#EFF4FF,#F5F1FF 60%,#EEFCF3)',
            animation: 'mn-fadeUp .5s ease .05s backwards',
          }}
        >
          {/* Decorative circle — responsive, not absolute-positioned with hardcoded px */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: 'rgba(37,99,235,0.06)',
              pointerEvents: 'none',
            }}
          />

          {/* Content row — stacks vertically on mobile */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '20px',
              flexWrap: 'wrap',
            }}
          >
            {/* Logo */}
            <div
              style={{
                width: 'clamp(80px, 15vw, 128px)',
                height: 'clamp(80px, 15vw, 128px)',
                borderRadius: '50%',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                flexShrink: 0,
                background: '#fff',
                boxShadow: '0 10px 26px -8px rgba(15,23,42,0.2)',
                animation: 'mn-logoPop .6s cubic-bezier(.34,1.56,.64,1) .15s backwards',
                position: 'relative',
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={uni.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                /* Fallback initials */
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(37,99,235,0.1)',
                    fontSize: 'clamp(18px, 4vw, 28px)',
                    fontWeight: 800,
                    color: '#2563EB',
                  }}
                >
                  {uni.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info block */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              {/* Name */}
              <h1
                style={{
                  fontSize: 'clamp(18px, 5vw, 30px)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#0F172A',
                  lineHeight: 1.2,
                }}
              >
                {uni.name}
              </h1>

              {/* Subject count badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#2563EB',
                  background: 'rgba(37,99,235,0.1)',
                  padding: '3px 10px',
                  borderRadius: '99px',
                  marginTop: '8px',
                }}
              >
                <span>{totalSubjects}</span>
                <span>subjects available</span>
              </span>

              {/* Description */}
              {uni.description && (
                <p
                  style={{
                    fontSize: '13.5px',
                    lineHeight: 1.6,
                    color: '#94A3B8',
                    marginTop: '10px',
                    maxWidth: '520px',
                  }}
                >
                  {uni.description}
                </p>
              )}

              {/* Country + Founded chip — RESPONSIVE: inline flex, NOT absolute */}
              {(uni.country || uni.founded_year) && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 14px',
                    borderRadius: '12px',
                    background: '#fff',
                    border: '1px solid rgba(37,99,235,0.15)',
                    boxShadow: '0 4px 12px -4px rgba(15,23,42,.1)',
                    marginTop: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(37,99,235,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                    {uni.country && (
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                        {uni.country}
                      </span>
                    )}
                    {uni.founded_year && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                        Est. {uni.founded_year}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Category Filter Tabs ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap',
            animation: 'mn-fadeUp .5s ease .06s backwards',
          }}
        >
          {/* Tabs — horizontal scroll on mobile */}
          <div
            style={{
              display: 'inline-flex',
              gap: '3px',
              background: '#EEF2F7',
              borderRadius: '12px',
              padding: '4px',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              maxWidth: '100%',
            }}
          >
            {/* Client component for tab interaction is needed; for now render all as links */}
            {/* This section should be wrapped in a Client Component in the real implementation */}
            {/* See UniversityFilterTabs component below */}
          </div>
        </div>

        {/* ── Subject Groups ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          {groups.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#94A3B8',
                fontSize: '15px',
              }}
            >
              No subjects available yet.
            </div>
          ) : (
            groups.map((group, groupIdx) => (
              <div key={group.id}>
                {/* Group header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                    animation: 'mn-fadeUp .5s ease .1s backwards',
                  }}
                >
                  <div
                    style={{
                      width: '4px',
                      height: '18px',
                      borderRadius: '99px',
                      background: group.barColor,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: '#64748B' }}
                  >
                    {group.label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                    · {group.subjects.length} subject{group.subjects.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Subject cards grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                    gap: '16px',
                  }}
                >
                  {group.subjects.map((subject, subIdx) => (
                    <SubjectCard
                      key={subject.id}
                      subject={subject}
                      uniSlug={uniSlug}
                      categoryLabel={getCategoryLabel(subject)}
                      userId={profile?.id ?? null}
                      animationDelay={`${0.05 * (subIdx % 6)}s`}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* ── Keyframe animations ── */}
      <style>{`
        @keyframes mn-fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mn-logoPop {
          from { opacity: 0; transform: scale(.7) rotate(-8deg); }
          to   { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes mn-shine {
          0%   { transform: translateX(-120%) rotate(20deg); }
          100% { transform: translateX(220%) rotate(20deg); }
        }
        .mn-subject-card {
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .mn-subject-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px -14px rgba(37,99,235,.28);
        }
        /* Mobile: single col for very small screens */
        @media (max-width: 480px) {
          .mn-header-row { flex-direction: column !important; }
          .mn-stat-row   { gap: 12px !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Subject Card (Server Component) ─────────────────────────────────────────

function SubjectCard({
  subject,
  uniSlug,
  categoryLabel,
  userId,
  animationDelay,
}: {
  subject: SubjectWithAccess;
  uniSlug: string;
  categoryLabel: string;
  userId: string | null;
  animationDelay: string;
}) {
  const isFree = subject.is_free === true || subject.access_mode === 'free';
  const progressPct = subject.totalLectures > 0
    ? Math.round((subject.progressCount / subject.totalLectures) * 100)
    : 0;

  const href = `/${uniSlug}/${subject.slug}`;

  return (
    <Link
      href={href}
      className="mn-subject-card"
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #EFF4FF, #F5F1FF)',
        border: '1px solid #E2E8F0',
        borderRadius: '18px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(15,23,42,.04), 0 10px 24px -16px rgba(15,23,42,.10)',
        textDecoration: 'none',
        color: 'inherit',
        animation: `mn-fadeUp .5s ease ${animationDelay} backwards`,
      }}
    >
      <div
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {/* Top row: badges + pin */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '10px',
          }}
        >
          {/* Category + access badges */}
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 9px',
                borderRadius: '7px',
                background: 'rgba(22,163,74,0.11)',
                color: '#16A34A',
              }}
            >
              {categoryLabel}
            </span>

            {isFree ? (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 9px',
                  borderRadius: '7px',
                  background: 'rgba(217,119,6,0.11)',
                  color: '#D97706',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Free
              </span>
            ) : (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 9px',
                  borderRadius: '7px',
                  background: 'rgba(124,58,237,0.10)',
                  color: '#7C3AED',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Premium
              </span>
            )}
          </div>

          {/* Pin button — client component */}
          {userId && (
            <PinSubjectButton
              subjectId={subject.id}
              userId={userId}
              initialPinned={subject.isPinned}
            />
          )}
        </div>

        {/* Subject name */}
        <h3
          style={{
            margin: '14px 0 6px',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: '#0F172A',
          }}
        >
          {subject.name}
        </h3>

        {/* Description */}
        <p
          style={{
            margin: 0,
            fontSize: '13.5px',
            lineHeight: 1.55,
            color: '#64748B',
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {subject.description ?? 'No description available.'}
        </p>

        {/* Stats row */}
        <div
          className="mn-stat-row"
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '16px',
            flexWrap: 'wrap',
          }}
        >
          {/* Lectures stat */}
          <StatPill
            icon={
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="8" y1="7" x2="16" y2="7" />
                <line x1="8" y1="11" x2="16" y2="11" />
              </svg>
            }
            value={subject.lecture_count}
            label="Lectures"
          />
          {/* Chapters stat */}
          <StatPill
            icon={
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
            value={subject.chapter_count}
            label="Chapters"
          />
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(37,99,235,0.12)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>
              Overall Progress
            </span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#2563EB' }}>
              {progressPct}%
            </span>
          </div>

          <div
            style={{
              height: '7px',
              borderRadius: '99px',
              background: '#E2E8F0',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                borderRadius: '99px',
                background: 'linear-gradient(90deg,#2563EB,#7C3AED)',
                transition: 'width 1.1s cubic-bezier(.22,1,.36,1)',
              }}
            />
          </div>

          <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '6px' }}>
            {subject.progressCount} of {subject.lecture_count} lectures completed
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '8px',
          background: 'rgba(37,99,235,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{value}</div>
        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{label}</div>
      </div>
    </div>
  );
}