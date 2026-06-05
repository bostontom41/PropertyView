import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const email = data?.claims?.email

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Hello Homeside 👋</h1>
      {email ? (
        <p className="text-green-600">Signed in as {email}</p>
      ) : (
        <p className="text-gray-500">Not signed in</p>
      )}
    </main>
  )
}