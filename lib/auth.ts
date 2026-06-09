import { createClient } from '@/lib/supabase/server'

export type CurrentUser = {
  id: string
  email: string | null
  role: 'field' | 'manager' | 'regional' | 'admin'
  propertyId: string | null
  fullName: string | null
}

/**
 * Returns the logged-in user's profile, or null if not signed in.
 * Use this anywhere you need to know who the user is or what they can do.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()

  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims?.sub
  if (!userId) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role, property_id, full_name')
    .eq('id', userId)
    .single()

  if (!profile) return null
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    propertyId: profile.property_id,
    fullName: profile.full_name,
  }
}

/** Roles allowed into the web portal (Property Manager and above). */
export function canAccessPortal(role: CurrentUser['role']): boolean {
  return role === 'manager' || role === 'regional' || role === 'admin'
}