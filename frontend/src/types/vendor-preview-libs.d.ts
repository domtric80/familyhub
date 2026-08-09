declare module 'mammoth' {
  export interface ConvertToHtmlResult {
    value: string
    messages?: Array<{ type?: string; message?: string }>
  }

  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<ConvertToHtmlResult>
}
