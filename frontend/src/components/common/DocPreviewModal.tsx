/**
 * DocPreviewModal
 * Apre un documento in una modale con anteprima inline.
 *
 * Tipi supportati senza librerie esterne:
 *   - PDF     → <embed> con blob URL
 *   - Immagini (jpg, png, gif, webp, svg) → <img> con blob URL
 *   - Testo (txt, csv, xml, json) → <pre> con testo estratto da blob
 *
 * Tipi supportati con librerie npm (mammoth, xlsx):
 *   - DOCX    → mammoth → HTML inline
 *   - XLSX    → xlsx → tabella HTML
 *
 * Per tutti gli altri tipi: messaggio "anteprima non disponibile" + pulsante Scarica.
 */

import { useEffect, useRef, useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Alert } from 'reactstrap'
import { Download, X } from 'react-feather'

// ─── Tipi ────────────────────────────────────────────────────────────────────

export interface DocPreviewProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  mimeType: string
  /** Funzione che restituisce il blob del documento (es. da API download) */
  fetchBlob: () => Promise<Blob>
  /** Callback opzionale per attivare il download diretto */
  onDownload?: () => void
  /** Se false, nasconde il pulsante Scarica (ABAC) — default true */
  canDownload?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
function isXlsx(mime: string, name: string) {
  return (
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime === 'application/vnd.ms-excel' ||
    /\.(xlsx|xls)$/i.test(name)
  )
}

function humanSize(blob: Blob) {
  const bytes = blob.size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Componente ──────────────────────────────────────────────────────────────

type PreviewState = 'idle' | 'loading' | 'ready' | 'error'

export default function DocPreviewModal({
  isOpen,
  onClose,
  fileName,
  mimeType,
  fetchBlob,
  onDownload,
  canDownload = true,
}: DocPreviewProps) {
  const [state, setState]       = useState<PreviewState>('idle')
  const [blobUrl, setBlobUrl]   = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [blobRef, setBlobRef]   = useState<Blob | null>(null)
  const prevOpen = useRef(false)

  // Carica il documento quando si apre la modale
  useEffect(() => {
    if (isOpen && !prevOpen.current) {
      prevOpen.current = true
      load()
    }
    if (!isOpen) {
      prevOpen.current = false
      // Cleanup blob URL
      if (blobUrl) URL.revokeObjectURL(blobUrl)
      setBlobUrl(null); setTextContent(null); setHtmlContent(null)
      setErrorMsg(null); setState('idle'); setBlobRef(null)
    }
  }, [isOpen]) // eslint-disable-line

  const load = async () => {
    setState('loading')
    setErrorMsg(null)
    try {
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
          // Dynamic import — richiede npm install mammoth
          const mammoth = await import('mammoth')
          const arrayBuffer = await blob.arrayBuffer()
          const result = await mammoth.convertToHtml({ arrayBuffer })
          setHtmlContent(result.value)
          setState('ready')
        } catch {
          setErrorMsg('Libreria mammoth non installata. Esegui "npm install" nella cartella frontend.')
          setState('error')
        }
        return
      }

      if (isXlsx(mimeType, fileName)) {
        try {
          // Dynamic import — richiede npm install xlsx
          const XLSX = await import('xlsx')
          const arrayBuffer = await blob.arrayBuffer()
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const html = XLSX.utils.sheet_to_html(sheet, { editable: false })
          setHtmlContent(html)
          setState('ready')
        } catch {
          setErrorMsg('Libreria xlsx non installata. Esegui "npm install" nella cartella frontend.')
          setState('error')
        }
        return
      }

      // Tipo non supportato
      setState('error')
      setErrorMsg(`Anteprima non disponibile per il tipo "${mimeType || fileName}". Usa il pulsante Scarica.`)
    } catch (e) {
      console.error(e)
      setState('error')
      setErrorMsg('Errore durante il caricamento del documento.')
    }
  }

  const handleDownload = () => {
    if (onDownload) { onDownload(); return }
    if (!blobRef) return
    const url = URL.createObjectURL(blobRef)
    const a = document.createElement('a')
    a.href = url; a.download = fileName; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

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
          <div className='d-flex align-items-center justify-content-center p-3' style={{ background: '#f8f9fa', minHeight: 400 }}>
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
              margin: 0, padding: 16,
              fontSize: 12, lineHeight: 1.6,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              background: '#1e1e1e', color: '#d4d4d4',
              minHeight: 400, maxHeight: '75vh', overflow: 'auto',
            }}
          >
            {textContent}
          </pre>
        )}

        {state === 'ready' && (isDocx(mimeType, fileName) || isXlsx(mimeType, fileName)) && htmlContent && (
          <div
            className='p-3'
            style={{ maxHeight: '75vh', overflow: 'auto', fontSize: 13 }}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </ModalBody>

      <ModalFooter>
        {canDownload && (
          <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={handleDownload}>
            <Download size={13} /> Scarica
          </Button>
        )}
        <Button color='secondary' size='sm' className='d-flex align-items-center gap-1' onClick={onClose}>
          <X size={13} /> Chiudi
        </Button>
      </ModalFooter>
    </Modal>
  )
}
