import { useEffect, useState } from 'react'

import TextField from '@src/primitives/TextField'

export default function ImageFileField({
  currentUrl,
  label,
  onChange,
}: {
  currentUrl?: string | null
  label: string
  onChange: (file: File | undefined) => void
}) {
  const [previewUrl, setPreviewUrl] = useState<string>()

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <div className="mt-4">
      <TextField
        accept="image/jpeg,image/png,image/webp"
        hint="JPG, PNG, or WebP up to 5 MB."
        label={label}
        name={`${label.toLowerCase().replace(/\s+/g, '-')}-image`}
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (previewUrl) URL.revokeObjectURL(previewUrl)
          let nextPreviewUrl: string | undefined
          if (file) {
            try {
              nextPreviewUrl = URL.createObjectURL(file)
            } catch {
              nextPreviewUrl = undefined
            }
          }
          setPreviewUrl(nextPreviewUrl)
          onChange(file)
        }}
      />
      {previewUrl || currentUrl ? (
        <img
          alt="Selected preview"
          className="mt-3 h-32 w-full rounded-lg object-cover"
          src={previewUrl ?? currentUrl ?? ''}
        />
      ) : null}
    </div>
  )
}
