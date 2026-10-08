import { useMutation } from '@tanstack/react-query'

import { removeImage, uploadImage } from '@src/data/media'

export function useImageUpload() {
  return useMutation({
    mutationFn: async ({ file, path }: { file: File; path: string }) =>
      uploadImage(path, file),
  })
}

export function useImageRemoval() {
  return useMutation({
    mutationFn: removeImage,
  })
}
