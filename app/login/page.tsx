'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function sendMagicLink() {
    setStatus('sending')
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    })
    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('sent')
      setMessage(`Check ${email} for your sign-in link.`)
    }
  }

  async function signInWithPassword() {
    setStatus('sending')
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      router.push('/')
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
          {status === 'sending' ? 'Working…' : 'Send magic link'}
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
          <span className="h-px flex-1 bg-gray-200" /> or password <span className="h-px flex-1 bg-gray-200" />
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
        />
        <button
          type="button"
          onClick={signInWithPassword}
          disabled={status === 'sending' || email.length === 0 || password.length === 0}
          className="mt-3 w-full rounded-lg border border-gray-900 px-4 py-2 font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
        >
          Sign in with password
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