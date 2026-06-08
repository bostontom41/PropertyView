import Link from 'next/link'
import { getCurrentUser, canAccessPortal } from '@/lib/auth'
import { signOut } from '@/lib/actions'

export default async function Nav() {
  const user = await getCurrentUser()
  if (!user) return null // no nav on login/logged-out pages

  const isPortal = canAccessPortal(user.role)

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-bold text-gray-900">Homeside PropertyView</span>
          <nav className="flex gap-4 text-sm">
            {isPortal ? (
              <>
                <Link href="/portal/properties" className="text-gray-600 hover:text-gray-900">Properties</Link>
                <Link href="/submissions" className="text-gray-600 hover:text-gray-900">Submissions</Link>
                <Link href="/submit" className="text-gray-600 hover:text-gray-900">New</Link>
              </>
            ) : (
              <>
                <Link href="/submissions" className="text-gray-600 hover:text-gray-900">My Tickets</Link>
                <Link href="/submit" className="text-gray-600 hover:text-gray-900">New Submission</Link>
              </>
            )}
          </nav>
        </div>
        <form action={signOut}>
          <span className="mr-3 text-xs text-gray-500">{user.email}</span>
          <button className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
            Sign out
          </button>
        </form>
      </div>
    </header>
  )
}