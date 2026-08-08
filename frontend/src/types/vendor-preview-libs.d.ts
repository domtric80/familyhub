declare module 'mammoth' {
  export interface ConvertToHtmlResult {
    value: string
    messages?: Array<{ type?: string; message?: string }>
  }

  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<ConvertToHtmlResult>
}

declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[]
    Sheets: Record<string, unknown>
  }

  export const utils: {
    sheet_to_html(sheet: unknown, options?: Record<string, unknown>): string
  }

  export function read(data: ArrayBuffer, options?: Record<string, unknown>): WorkBook
}
