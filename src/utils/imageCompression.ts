import { IMAGE_COMPRESSION, FILE_SIZE_LIMITS } from '@/constants/media'

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  outputType?: string
}

/**
 * Compress an image file by resizing it to fit within a bounding box and
 * re-encoding as JPEG. Returns the original file unchanged if it already
 * fits within the size and dimension limits.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {},
): Promise<File> {
  const maxWidth = options.maxWidth ?? IMAGE_COMPRESSION.MAX_WIDTH
  const maxHeight = options.maxHeight ?? IMAGE_COMPRESSION.MAX_HEIGHT
  const quality = options.quality ?? IMAGE_COMPRESSION.QUALITY
  const outputType = options.outputType ?? IMAGE_COMPRESSION.OUTPUT_TYPE

  // Load the image to check dimensions
  const img = await loadImage(file)
  const { naturalWidth: width, naturalHeight: height } = img

  // Skip compression if already within limits
  if (width <= maxWidth && height <= maxHeight && file.size <= FILE_SIZE_LIMITS.IMAGE) {
    URL.revokeObjectURL(img.src)
    return file
  }

  // Calculate scaled dimensions preserving aspect ratio
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
  const newWidth = Math.floor(width * ratio)
  const newHeight = Math.floor(height * ratio)

  // Draw onto canvas at new dimensions
  const canvas = document.createElement('canvas')
  canvas.width = newWidth
  canvas.height = newHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    URL.revokeObjectURL(img.src)
    return file
  }

  ctx.drawImage(img, 0, 0, newWidth, newHeight)
  URL.revokeObjectURL(img.src)

  // Export as blob
  const blob = await canvasToBlob(canvas, outputType, quality)
  if (!blob) {
    return file
  }

  // If compressed is larger than original (rare, e.g. small PNGs), return original
  if (blob.size >= file.size) {
    return file
  }

  // Build new filename with .jpg extension
  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.jpg`, { type: outputType })
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}
