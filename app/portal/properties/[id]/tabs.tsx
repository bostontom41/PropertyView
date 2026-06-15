'use client'

import { useState, ReactNode } from 'react'

export default function PropertyTabs({
  overview,
  tickets,
  contacts,
}: {
  overview: ReactNode
  tickets: ReactNode
  contacts: ReactNode
}) {
  const [tab, setTab] = useState<'overview' | 'tickets' | 'contacts' | 'attachments'>('overview')

  const TABS = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'tickets' as const, label: 'Tickets' },
    { id: 'contacts' as const, label: 'Contacts' },
    { id: 'attachments' as const, label: 'Attachments' },
  ]

  return (
    <div className="mt-6">
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? 'text-brand' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
            {tab === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand" />}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'overview' && overview}
        {tab === 'tickets' && tickets}
        {tab === 'contacts' && contacts}
        {tab === 'attachments' && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
            Attachments — coming soon
          </div>
        )}
      </div>
    </div>
  )
}