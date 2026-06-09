export function formatFiled(timestamp: string): string {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
    })
  }
  export function propertyPhotoUrl(photoPath: string | null | undefined): string | null {
    if (!photoPath) return null
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    return `${base}/storage/v1/object/public/property-photos/${photoPath}`
  }