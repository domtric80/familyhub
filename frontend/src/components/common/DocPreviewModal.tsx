import { useEffect, useRef, useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Alert } from 'reactstrap'
import { Download, X } from 'react-feather'
import type { SpreadsheetPreviewPayload } from '../../types'

export interface DocPreviewProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  mimeType: string
  fetchBlob: () => Promise<Blob>
  fetchSpreadsheetPreview?: () => Promise<SpreadsheetPreviewPayload>
  onDownload?: () => void
  canDownload?: boolean
}

function isImage(mime: string) {
  return /^image\/(jpeg|png|gif|webp|svg\+xml|bmp|tiff)/.test(mime)
}

function isPdf(mime: string) {
  return mime === 'application/pdf'
}

function isText(mime: string, name: string) {
  if (/^text\//.test(mime)) return true
  return /\.(txt|csv|xml|json|md|log)$/i.test(name)
}

function isDocx(mime: string, name: string) {
  return (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    /\.docx$/i.test(name)
  )
}

function isSpreadsheet(mime: string, name: string) {
  return (
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime === 'application/vnd.ms-excel' ||
    /\.(xlsx|xls)$/i.test(name)
  )
}

/** Solo .xlsx (formato moderno con preview strutturata server-side) */
function isXlsx(mime: string, name: string) {
  return (
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    /\.xlsx$/i.test(name)
  )
}

function humanSize(blob: Blob) {
  const bytes = blob.size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type PreviewState = 'idle' | 'loading' | 'ready' | 'error'

export default function DocPreviewModal({
  isOpen,
  onClose,
  fileName,
  mimeType,
  fetchBlob,
  fetchSpreadsheetPreview,
  onDownload,
  canDownload = true,
}: DocPreviewProps) {
  const [state, setState] = useState<PreviewState>('idle')
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [spreadsheetPreview, setSpreadsheetPreview] = useState<SpreadsheetPreviewPayload | null>(null)
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [downloadBlockedMsg, setDownloadBlockedMsg] = useState<string | null>(null)
  const [blobRef, setBlobRef] = useState<Blob | null>(null)
  const prevOpen = useRef(false)

  useEffect(() => {
    if (isOpen && !prevOpen.current) {
      prevOpen.current = true
      void load()
    }

    if (!isOpen) {
      prevOpen.current = false
      if (blobUrl) URL.revokeObjectURL(blobUrl)
      setBlobUrl(null)
      setTextContent(null)
      setHtmlContent(null)
      setSpreadsheetPreview(null)
      setActiveSheetIndex(0)
      setErrorMsg(null)
      setDownloadBlockedMsg(null)
      setState('idle')
      setBlobRef(null)
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setState('loading')
    setErrorMsg(null)

    try {
      if (isSpreadsheet(mimeType, fileName)) {
        // Solo .xlsx supporta la preview strutturata server-side
        if (!isXlsx(mimeType, fileName)) {
          setErrorMsg('Questo file non supporta l\'anteprima strutturata. I file .xls legacy non sono visualizzabili in anteprima.')
          setState('error')
          return
        }

        if (!fetchSpreadsheetPreview) {
          setErrorMsg('Questo file non supporta l\'anteprima strutturata.')
          setState('error')
          return
        }

        const preview = await fetchSpreadsheetPreview()
        setSpreadsheetPreview(preview)
        setActiveSheetIndex(0)
        setState('ready')
        return
      }

      const blob = await fetchBlob()
      setBlobRef(blob)

      if (isPdf(mimeType) || isImage(mimeType)) {
        const url = URL.createObjectURL(blob)
        setBlobUrl(url)
        setState('ready')
        return
      }

      if (isText(mimeType, fileName)) {
        const text = await blob.text()
        setTextContent(text)
        setState('ready')
        return
      }

      if (isDocx(mimeType, fileName)) {
        try {
          const mammoth = await import('mammoth')
          const arrayBuffer = await blob.arrayBuffer()
          const result = await mammoth.convertToHtml({ arrayBuffer })
          setHtmlContent(result.value)
          setState('ready')
        } catch {
          setErrorMsg('Anteprima DOCX non disponibile: libreria di conversione non caricata correttamente.')
          setState('error')
        }
        return
      }

      setState('error')
      setErrorMsg(`Anteprima non disponibile per il tipo "${mimeType || fileName}". Usa il pulsante Scarica.`)
    } catch (error) {
      console.error(error)
      setState('error')
      setErrorMsg('Errore durante il caricamento del documento.')
    }
  }

  const handleDownload = async () => {
    setDownloadBlockedMsg(null)
    try {
      if (onDownload) {
        await onDownload()
        return
      }

      if (!blobRef) return

      const url = URL.createObjectURL(blobRef)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setDownloadBlockedMsg('Download non consentito per il tuo ruolo o per la classificazione del documento.')
      }
    }
  }

  const activeSheet = spreadsheetPreview?.sheets[activeSheetIndex] ?? null

  return (
    <Modal isOpen={isOpen} toggle={onClose} size='xl' centered scrollable>
      <ModalHeader toggle={onClose}>
        <span style={{ fontSize: 14 }}>{fileName}</span>
        {blobRef && (
          <span className='text-muted ms-2' style={{ fontSize: 12, fontWeight: 400 }}>
            ({humanSize(blobRef)})
          </span>
        )}
      </ModalHeader>

      <ModalBody style={{ minHeight: 400, padding: 0 }}>
        {state === 'loading' && (
          <div className='d-flex align-items-center justify-content-center' style={{ height: 400 }}>
            <span className='spinner-border text-primary' />
            <span className='ms-3 text-muted'>Caricamento documento…</span>
          </div>
        )}

        {state === 'error' && (
          <div className='p-4'>
            <Alert color='warning'>{errorMsg}</Alert>
          </div>
        )}

        {state === 'ready' && isPdf(mimeType) && blobUrl && (
          <embed
            src={blobUrl}
            type='application/pdf'
            width='100%'
            style={{ height: '75vh', display: 'block' }}
          />
        )}

        {state === 'ready' && isImage(mimeType) && blobUrl && (
          <div
            className='d-flex align-items-center justify-content-center p-3'
            style={{ background: '#f8f9fa', minHeight: 400 }}
          >
            <img
              src={blobUrl}
              alt={fileName}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 4 }}
            />
          </div>
        )}

        {state === 'ready' && isText(mimeType, fileName) && textContent !== null && (
          <pre
            style={{
              margin: 0,
              padding: 16,
              fontSize: 12,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: '#1e1e1e',
              color: '#d4d4d4',
              minHeight: 400,
              maxHeight: '75vh',
              overflow: 'auto',
            }}
          >
            {textContent}
          </pre>
        )}

        {state === 'ready' && isDocx(mimeType, fileName) && htmlContent && (
          <div
            className='p-3'
            style={{ maxHeight: '75vh', overflow: 'auto', fontSize: 13 }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}

        {state === 'ready' && isSpreadsheet(mimeType, fileName) && spreadsheetPreview && activeSheet && (
          <div className='p-3' style={{ maxHeight: '75vh', overflow: 'auto', fontSize: 13 }}>
            <div className='alert alert-info py-2 px-3 mb-3' style={{ fontSize: 12 }}>
              Preview strutturata server-side del file Excel. Il file originale non viene inviato al browser per la sola consultazione.
            </div>

            <div className='d-flex flex-wrap gap-2 mb-3'>
              {spreadsheetPreview.sheets.map((sheet, index) => (
                <Button
                  key={`${sheet.name}-${index}`}
                  size='sm'
                  color={index === activeSheetIndex ? 'primary' : 'light'}
                  onClick={() => setActiveSheetIndex(index)}
                >
                  {sheet.name}
                </Button>
              ))}
            </div>

            <div className='small text-muted mb-2'>
              Righe mostrate: {activeSheet.preview_row_count} · Colonne massime: {activeSheet.max_column_count}
              {activeSheet.truncated_rows && ` · limite righe ${spreadsheetPreview.limits.max_rows_per_sheet}`}
              {activeSheet.truncated_columns && ` · limite colonne ${spreadsheetPreview.limits.max_columns_per_sheet}`}
            </div>

            <div className='table-responsive border rounded'>
              <table className='table table-sm table-bordered mb-0 align-middle'>
                <tbody>
                  {activeSheet.rows.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`}>
                      <th className='table-light text-muted' style={{ minWidth: 56, fontSize: 11 }}>{rowIndex + 1}</th>
                      {Array.from({ length: Math.max(activeSheet.max_column_count, row.length) }).map((_, cellIndex) => (
                        <td key={`cell-${rowIndex}-${cellIndex}`} style={{ whiteSpace: 'pre-wrap', minWidth: 120 }}>
                          {row[cellIndex] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {spreadsheetPreview.truncated_sheets && (
              <div className='small text-muted mt-2'>
                Il file contiene altri fogli oltre al limite di preview ({spreadsheetPreview.limits.max_sheets}).
              </div>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter className='flex-column align-items-stretch gap-2'>
        {downloadBlockedMsg && (
          <Alert color='warning' className='mb-0 py-2 small'>
            {downloadBlockedMsg}
          </Alert>
        )}
        {!canDownload && state === 'ready' && (
          <div className='text-muted small fst-italic'>
            Puoi consultare il documento, ma il download non è consentito per il tuo ruolo o per questa classificazione.
          </div>
        )}
        <div className='d-flex gap-2 justify-content-end w-100'>
          {canDownload && (
            <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={handleDownload}>
              <Download size={13} /> Scarica
            </Button>
          )}
          <Button color='secondary' size='sm' className='d-flex align-items-center gap-1' onClick={onClose}>
            <X size={13} /> Chiudi
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  )
}
