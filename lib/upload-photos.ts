import { createClient } from '@/lib/supabase/client'

// Convert a File to JPEG if needed (handles iPhone HEIC), preserving full resolution.
async function toJpeg(file: File): Promise<Blob> {
  const isHeic = /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name)

  if (isHeic) {
    // Browsers can't decode HEIC natively — use heic2any
    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 })
    return Array.isArray(converted) ? converted[0] : (converted as Blob)
  }

  // Already a web image (jpeg/png/etc). If it's already JPEG, pass through as-is (full res).
  if (file.type === 'image/jpeg') return file

  // Otherwise re-encode to JPEG via canvas at full resolution, max quality.
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95)
  )
}

// Upload an array of photo Files directly to storage under the report_id folder.
// Returns { uploaded, errors }.
export async function uploadSubmissionPhotos(reportId: string, files: File[]) {
  const supabase = createClient()
  let uploaded = 0
  const errors: string[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      const jpeg = await toJpeg(files[i])
      const path = `${reportId}/${Date.now()}-${i}.jpg`
      const { error } = await supabase.storage
        .from('submission-photos')
        .upload(path, jpeg, { contentType: 'image/jpeg' })
      if (error) errors.push(error.message)
      else uploaded++
    } catch (e: any) {
      errors.push(e?.message ?? 'conversion/upload failed')
    }
  }

  return { uploaded, errors }
}