declare module 'mammoth' {
  export interface MammothResult {
    value: string
    messages: Array<{
      type: string
      message: string
    }>
  }

  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer } | { buffer: Buffer } | { path: string },
    options?: any
  ): Promise<MammothResult>

  export function extractRawText(
    input: { arrayBuffer: ArrayBuffer } | { buffer: Buffer } | { path: string },
    options?: any
  ): Promise<MammothResult>

  const mammoth: {
    convertToHtml: typeof convertToHtml
    extractRawText: typeof extractRawText
  }

  export default mammoth
}

declare module 'mammoth/mammoth.browser' {
  export * from 'mammoth'
  import mammoth from 'mammoth'
  export default mammoth
}
