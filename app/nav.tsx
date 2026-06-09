import Link from 'next/link'
import { getCurrentUser, canAccessPortal } from '@/lib/auth'
import { signOut } from '@/lib/actions'

export default async function Nav() {
  const user = await getCurrentUser()
  if (!user) return null
  if (canAccessPortal(user.role)) return null
  const isPortal = canAccessPortal(user.role)

  const linkClass = 'text-sm text-white/70 hover:text-white transition-colors'

  return (
    <header className="bg-brand text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-bold">
            Homeside <span className="text-accent">PropertyView</span>
          </span>
          <nav className="flex gap-5">
            {isPortal ? (
              <>
                <Link href="/portal" className={linkClass}>Dashboard</Link>
                <Link href="/submissions" className={linkClass}>Submissions</Link>
                <Link href="/portal/properties" className={linkClass}>Properties</Link>
              </>
            ) : (
              <>
                <Link href="/submissions" className={linkClass}>My Tickets</Link>
                <Link href="/submit" className={linkClass}>New Submission</Link>
              </>
            )}
          </nav>
        </div>
        <form action={signOut} className="flex items-center gap-3">
          <span className="text-xs text-white/60">{user.email}</span>
          <button className="rounded-lg border border-white/25 px-3 py-1 text-sm text-white hover:bg-white/10 transition-colors">
            Sign out
          </button>
        </form>
      </div>
    </header>
  )
}