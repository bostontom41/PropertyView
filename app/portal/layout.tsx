import { redirect } from 'next/navigation'
import { getCurrentUser, canAccessPortal } from '@/lib/auth'
import Sidebar from './sidebar'
import { DrawerProvider } from './drawer-context'

export const dynamic = 'force-dynamic'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!canAccessPortal(user.role)) redirect('/submit')

  return (
    <div className="flex min-h-screen">
      <Sidebar email={user.email} role={user.role} name={user.fullName} />
      <div className="flex-1"><DrawerProvider>{children}</DrawerProvider></div>
    </div>
  )
}