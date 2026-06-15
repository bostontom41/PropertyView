'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRole, setUserProperties } from './actions'

type User = { id: string; email: string | null; full_name: string | null; role: string }
type Property = { id: string; name: string }

const ROLES = ['field', 'manager', 'regional', 'admin']
const GLOBAL_ROLES = ['regional', 'admin'] // see all properties; no assignment needed

export default function TeamList({
  users,
  properties,
  assignmentMap,
  currentUserId,
}: {
  users: User[]
  properties: Property[]
  assignmentMap: Record<string, string[]>
  currentUserId: string
}) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  async function changeRole(userId: string, role: string) {
    setBusyId(userId)
    await updateUserRole(userId, role)
    setBusyId(null)
    router.refresh()
  }

  async function toggleProperty(userId: string, propertyId: string, currentIds: string[]) {
    const next = currentIds.includes(propertyId)
      ? currentIds.filter((id) => id !== propertyId)
      : [...currentIds, propertyId]
    setBusyId(userId)
    await setUserProperties(userId, next)
    setBusyId(null)
    router.refresh()
  }

  const filteredProps = (q: string) =>
    q.trim() === '' ? properties : properties.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="mt-6 space-y-3">
      {users.map((u) => {
        const isSelf = u.id === currentUserId
        const assigned = assignmentMap[u.id] ?? []
        const isGlobal = GLOBAL_ROLES.includes(u.role)
        const expanded = expandedId === u.id

        return (
          <div key={u.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium text-gray-900">{u.full_name || u.email}</div>
                <div className="text-sm text-gray-500">{u.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  disabled={isSelf || busyId === u.id}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm capitalize disabled:opacity-50"
                  title={isSelf ? "You can't change your own role" : undefined}
                >
                  {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
              </div>
            </div>

            {!isGlobal && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <button
                  onClick={() => { setExpandedId(expanded ? null : u.id); setSearch('') }}
                  className="text-sm text-brand hover:underline"
                >
                  {assigned.length} {assigned.length === 1 ? 'property' : 'properties'} assigned — {expanded ? 'hide' : 'manage'}
                </button>

                {expanded && (
                  <div className="mt-3">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search properties…"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                    />
                    <div className="mt-2 max-h-60 space-y-1 overflow-y-auto">
                      {filteredProps(search).map((p) => (
                        <label key={p.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={assigned.includes(p.id)}
                            disabled={busyId === u.id}
                            onChange={() => toggleProperty(u.id, p.id, assigned)}
                          />
                          {p.name}
                        </label>
                      ))}
                      {filteredProps(search).length === 0 && (
                        <p className="px-2 py-1.5 text-sm text-gray-400">No matching properties.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isGlobal && (
              <div className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-400">
                {u.role === 'admin' ? 'Admin' : 'Regional'} — sees all properties, no assignment needed.
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}