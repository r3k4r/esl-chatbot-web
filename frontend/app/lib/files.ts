import type { SvgBasedIconName } from '~/common/types/iconsax-types'

// Mirrors the backend's task-file rules (config/storage.ts TASK_FILE_EXT, middlewares/upload.ts).
export const TASK_FILE_MAX_BYTES = 15 * 1024 * 1024
export const TASK_FILES_PER_UPLOAD = 5
export const TASK_FILE_ACCEPT = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/plain',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg',
  'video/mp4', 'video/webm', 'video/quicktime',
].join(',')

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileIcon(mimeType: string): SvgBasedIconName {
  if (mimeType.startsWith('image/')) return 'Gallery'
  if (mimeType.startsWith('audio/')) return 'Microphone2'
  if (mimeType.startsWith('video/')) return 'VideoPlay'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'Grid5'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PresentionChart'
  return 'DocumentText'
}

/** Splits picked files into ones the server will take and a message for the rest. */
export function checkTaskFiles(picked: File[], room: number): { ok: File[]; error: string } {
  const allowed = TASK_FILE_ACCEPT.split(',')
  const typeOk = picked.filter(f => allowed.includes(f.type))
  const sizeOk = typeOk.filter(f => f.size <= TASK_FILE_MAX_BYTES)
  const ok = sizeOk.slice(0, Math.max(0, room))
  let error = ''
  if (typeOk.length < picked.length) error = 'Some files were skipped. Use PDF, Word, PowerPoint, Excel, text, image, audio or video.'
  else if (sizeOk.length < typeOk.length) error = 'Files can be up to 15 MB each.'
  else if (ok.length < sizeOk.length) error = `You can attach up to ${TASK_FILES_PER_UPLOAD} files.`
  return { ok, error }
}

export const isImageFile = (mimeType: string) => mimeType.startsWith('image/')

/** Short type label shown under a file name, e.g. "PDF", "DOCX", "MP3". */
export function fileTypeLabel(name: string): string {
  const ext = name.includes('.') ? name.split('.').pop()! : ''
  return ext ? ext.toUpperCase().slice(0, 5) : 'FILE'
}
