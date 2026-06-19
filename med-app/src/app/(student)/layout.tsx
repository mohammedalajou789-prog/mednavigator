import StudentLayout from '@/components/student/StudentLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <StudentLayout>{children}</StudentLayout>
}