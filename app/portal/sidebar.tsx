'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/actions'

const OPERATIONS = [
  { href: '/portal', label: 'Dashboard', exact: true },
  { href: '/portal/submissions', label: 'Submissions' },
  { href: '/portal/properties', label: 'Properties' },
]

export default function Sidebar({ email, role }: { email: string | null; role: string }) {
  const pathname = usePathname()
  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const initials = (email ?? '?').slice(0, 2).toUpperCase()

  const navItem = (href: string, label: string, exact?: boolean) => (
    <Link
      key={href}
      href={href}
      className={`relative block rounded-lg px-3 py-2 text-sm transition-colors ${
        active(href, exact) ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
      }`}
    >
      {active(href, exact) && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-accent" />
      )}
      {label}
    </Link>
  )

  const placeholder = (label: string) => (
    <div
      key={label}
      title="Coming soon"
      className="flex cursor-default select-none items-center justify-between rounded-lg px-3 py-2 text-sm text-white/35"
    >
      <span>{label}</span>
      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
        Soon
      </span>
    </div>
  )

  return (
    <aside className="sticky top-0 flex h-screen w-60 flex-col bg-brand text-white">
      <div className="px-5 py-5">
        <div className="font-bold leading-tight">
          Homeside <span className="text-accent">PropertyView</span>
        </div>
        <div className="mt-0.5 text-xs text-white/50">HQ Console</div>
      </div>

      <nav className="flex-1 space-y-6 px-3">
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-white/40">Operations</div>
          {OPERATIONS.map((i) => navItem(i.href, i.label, i.exact))}
          {placeholder('Map View')}
        </div>
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-white/40">Configure</div>
          {placeholder('Routing Rules')}
          {placeholder('Team & Roles')}
          {placeholder('Reports')}
          {placeholder('Settings')}
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xs font-medium">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm">{email}</div>
            <div className="text-xs capitalize text-white/50">{role}</div>
          </div>
        </div>
        <form action={signOut}>
          <button className="mt-3 w-full rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/10">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}