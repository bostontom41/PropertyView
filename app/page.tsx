import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getCurrentUser, canAccessPortal } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function isMobile(userAgent: string): boolean {
  // Phones only — deliberately NOT matching iPad/tablet (they get the portal)
  return /Android.+Mobile|iPhone|iPod|Windows Phone|BlackBerry|Opera Mini|IEMobile/i.test(userAgent)
}

export default async function Home() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const headersList = await headers()
  const userAgent = headersList.get('user-agent') ?? ''
  const mobile = isMobile(userAgent)

  // On a phone, everyone goes to the streamlined field surface
  if (mobile) {
    redirect('/field')
  }

  // On desktop, portal-capable users get the console; field users get field
  if (canAccessPortal(user.role)) {
    redirect('/portal')
  } else {
    redirect('/field')
  }
}