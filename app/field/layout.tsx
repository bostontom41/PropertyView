import { redirect } from 'next/navigation'
import { getCurrentUser, canAccessPortal } from '@/lib/auth'
import { signOut } from '@/lib/actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function FieldLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const canPortal = canAccessPortal(user.role)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-brand text-white">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div>
            <div className="text-sm font-bold leading-tight">
              Homeside <span className="text-accent">PropertyView</span>
            </div>
            <div className="text-[11px] text-white/60">Field Capture</div>
          </div>
          <div className="flex items-center gap-3">
            {canPortal && (
              <Link href="/portal" className="text-xs text-white/80 underline">
                Portal →
              </Link>
            )}
            <form action={signOut}>
              <button className="rounded-lg border border-white/25 px-2.5 py-1 text-xs text-white hover:bg-white/10">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-5">{children}</main>
    </div>
  )
}