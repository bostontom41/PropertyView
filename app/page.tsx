import { redirect } from 'next/navigation'
import { getCurrentUser, canAccessPortal } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const user = await getCurrentUser()

  // Not logged in → login page
  if (!user) redirect('/login')

  // Manager and above → web portal; Field → mobile submissions list
  if (canAccessPortal(user.role)) {
    redirect('/portal')
  } else {
    redirect('/submissions')
  }
}