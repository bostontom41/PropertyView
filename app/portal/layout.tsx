import { redirect } from 'next/navigation'
import { getCurrentUser, canAccessPortal } from '@/lib/auth'
import Sidebar from './sidebar'

export const dynamic = 'force-dynamic'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!canAccessPortal(user.role)) redirect('/submit')

  return (
    <div className="flex min-h-screen">
      <Sidebar email={user.email} role={user.role} />
      <div className="flex-1">{children}</div>
    </div>
  )
}