/** A stored file as the image viewer (Block/ImagePreviewDialog) shows it. */
export interface PreviewFile {
  name: string
  url: string
  mimeType: string
  /** bytes */
  size: number
}
