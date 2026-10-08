import { useRef } from 'react'

import Button from '@src/primitives/Button'
import { useImageRemoval, useImageUpload } from '@src/hooks/useImageUpload'

export type ImageUploadFieldProps = {
  currentUrl?: string | null
  label: string
  path: string
  onChange: (url: string | null) => void
}

function ImageUploadField({
  currentUrl,
  label,
  onChange,
  path,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useImageUpload()
  const removalMutation = useImageRemoval()
  const isPending = uploadMutation.isPending || removalMutation.isPending

  async function handleFileChange(file: File | undefined) {
    if (!file) return

    try {
      const url = await uploadMutation.mutateAsync({ file, path })
      onChange(url)
    } catch {
      // The shared mutation state exposes a recoverable error below.
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove() {
    try {
      await removalMutation.mutateAsync(path)
      onChange(null)
    } catch {
      // The shared mutation state exposes a recoverable error below.
    }
  }

  const error = uploadMutation.error || removalMutation.error

  return (
    <div className="rounded-lg border border-border bg-surface-subtle p-4">
      <div className="flex items-center gap-4">
        {currentUrl ? (
          <img
            alt=""
            className="size-16 rounded-full object-cover"
            src={currentUrl}
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-on-primary"
          >
            {label.trim().charAt(0).toLocaleUpperCase() || 'F'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="m-0 font-bold text-text">{label}</p>
          <p className="mt-1 mb-0 text-sm leading-5 text-text-muted">
            JPG, PNG, or WebP up to 5 MB.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          disabled={isPending}
          isPending={uploadMutation.isPending}
          pendingLabel="Uploading"
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
        >
          {currentUrl ? 'Replace photo' : 'Upload photo'}
        </Button>
        {currentUrl ? (
          <Button
            disabled={isPending}
            isPending={removalMutation.isPending}
            pendingLabel="Removing"
            type="button"
            variant="secondary"
            onClick={() => void handleRemove()}
          >
            Remove photo
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        type="file"
        onChange={(event) => void handleFileChange(event.target.files?.[0])}
      />
      {error ? (
        <p className="mt-3 mb-0 text-sm leading-5 text-danger" role="alert">
          Could not update this photo. Try again.
        </p>
      ) : null}
    </div>
  )
}

export default ImageUploadField
