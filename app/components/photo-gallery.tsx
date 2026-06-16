'use client'

import { useState } from 'react'

export default function PhotoGallery({ photos }: { photos: string[] }) {
  const [open, setOpen] = useState<string | null>(null)

  if (!photos || photos.length === 0) {
    return <p className="text-sm text-gray-400">No photos.</p>
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(url)}
            className="flex-shrink-0"
          >
            <img
              src={url}
              alt={`Photo ${i + 1}`}
              className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
            />
          </button>
        ))}
      </div>

      {open && (
        <div
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <img src={open} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  )
}