'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function sendMagicLink() {
    setStatus('sending')
    setMessage('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })
      if (error) {
        setStatus('error')
        setMessage(error.message)
      } else {
        setStatus('sent')
        setMessage(`Check ${email} for your sign-in link.`)
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Something went wrong.')
      console.error('Magic link error:', err)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Homeside PropertyView</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sign in to submit and track maintenance issues.
        </p>

        <div className="mt-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@property.com"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <button
          type="button"
          onClick={sendMagicLink}
          disabled={status === 'sending' || email.length === 0}
          className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {status === 'sending' ? 'Sending…' : 'Send magic link'}
        </button>

        {message && (
          <p className={`mt-3 text-sm ${status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
            {message}
          </p>
        )}
      </div>
    </main>
  )
}