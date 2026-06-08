import { redirect } from 'next/navigation'
import { getCurrentUser, canAccessPortal } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Not logged in → send to login
  if (!user) redirect('/login')

  // Logged in but not allowed in the portal (i.e. Field) → bounce to mobile area
  if (!canAccessPortal(user.role)) redirect('/submit')

  return <>{children}</>
}