import mammoth from 'mammoth'
import type { DocumentType } from '@/types'

export interface ProcessedFileInfo {
  name: string
  originalName: string
  size: number
  sizeFormatted: string
  mimeType: string
  type: DocumentType
  file: File
  rawFile: File
  dataUrl?: string
  textContent?: string
  docxHtml?: string
  pageCount?: number
  previewUrl?: string
  thumbnailUrl?: string
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function detectDocumentType(fileName: string, mimeType?: string): DocumentType {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf' || mimeType === 'application/pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext) || mimeType?.startsWith('image/')) return 'image'
  if (['doc', 'docx', 'rtf', 'odt'].includes(ext)) return 'word'
  if (['xls', 'xlsx', 'csv', 'tsv', 'ods'].includes(ext)) return 'excel'
  if (['ppt', 'pptx', 'odp'].includes(ext)) return 'powerpoint'
  return 'other'
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export async function processUploadedFile(file: File): Promise<ProcessedFileInfo> {
  const name = file.name
  const originalName = file.name
  const size = file.size
  const sizeFormatted = formatBytes(size)
  const mimeType = file.type || 'application/octet-stream'
  const docType = detectDocumentType(name, mimeType)

  let dataUrl: string | undefined = undefined
  let textContent: string | undefined = undefined
  let docxHtml: string | undefined = undefined
  let pageCount: number | undefined = undefined
  let previewUrl: string | undefined = undefined
  let thumbnailUrl: string | undefined = undefined

  // Handle specific document formats
  if (docType === 'image') {
    // Generate an instant, zero-memory-bloat blob URL for local modal display
    try {
      previewUrl = URL.createObjectURL(file)
      thumbnailUrl = previewUrl
    } catch {
      // fallback
    }
    // Only read small data URLs (< 40KB) for lightweight fallback
    if (size < 40000) {
      try {
        dataUrl = await readFileAsDataURL(file)
      } catch (err) {
        console.warn('Failed to read file as DataURL', err)
      }
    }
  } else if (docType === 'pdf') {
    try {
      previewUrl = URL.createObjectURL(file)
    } catch {
      // fallback
    }
    if (size < 100000) {
      try {
        dataUrl = await readFileAsDataURL(file)
      } catch {
        // ignore
      }
    }
    // Attempt to inspect PDF page count via pdfjs-dist if available
    try {
      const pdfjs = await import('pdfjs-dist')
      const arrayBuffer = await readFileAsArrayBuffer(file)
      // Set worker src or load document directly
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
      const pdfDoc = await loadingTask.promise
      pageCount = pdfDoc.numPages

      // Extract text snippet from first few pages for search & preview fallback
      let extracted = ''
      const maxPagesToExtract = Math.min(pdfDoc.numPages, 3)
      for (let i = 1; i <= maxPagesToExtract; i++) {
        const page = await pdfDoc.getPage(i)
        const textContentObj = await page.getTextContent()
        const pageText = textContentObj.items
          .map((item: any) => item.str || '')
          .join(' ')
        if (pageText.trim()) {
          extracted += `--- Page ${i} ---\n${pageText}\n\n`
        }
      }
      if (extracted.trim()) {
        textContent = extracted.trim()
      }
    } catch (e) {
      console.warn('PDF parsing helper note:', e)
      pageCount = 1
    }
  } else if (docType === 'word') {
    // Check if DOCX
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'docx') {
      try {
        const arrayBuffer = await readFileAsArrayBuffer(file)
        const result = await mammoth.convertToHtml({ arrayBuffer })
        docxHtml = result.value
        const textRes = await mammoth.extractRawText({ arrayBuffer })
        textContent = textRes.value
      } catch (err) {
        console.warn('DOCX parsing error', err)
      }
    }
  } else if (docType === 'excel') {
    const ext = name.split('.').pop()?.toLowerCase()
    if (ext === 'csv' || ext === 'tsv') {
      try {
        textContent = await readFileAsText(file)
      } catch (e) {
        console.warn('CSV read error', e)
      }
    }
  } else {
    // If text / code / json / log file
    const textExtensions = ['txt', 'md', 'json', 'log', 'xml', 'html', 'css', 'js', 'ts', 'yaml', 'yml', 'ini', 'sql']
    const ext = name.split('.').pop()?.toLowerCase() || ''
    if (textExtensions.includes(ext) || mimeType.startsWith('text/')) {
      try {
        textContent = await readFileAsText(file)
      } catch (e) {
        console.warn('Text file read error', e)
      }
    }
  }

  return {
    name,
    originalName,
    size,
    sizeFormatted,
    mimeType,
    type: docType,
    file,
    rawFile: file,
    dataUrl,
    textContent,
    docxHtml,
    pageCount,
    previewUrl,
    thumbnailUrl,
  }
}
