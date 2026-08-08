import { useState, useEffect, useRef } from 'react'
import {
  Card, CardBody, Button, Table, Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Row, Col, Spinner,
} from 'reactstrap'
import { Download, Database, Upload, AlertTriangle, RefreshCw, CheckCircle } from 'react-feather'
import { toast } from 'react-toastify'
import { backupApi, apiError } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import type { DatabaseBackup, DatabaseRestoreResponse } from '../../types'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('it-IT')
}

export default function BackupPage() {
  const { hasPermission } = useAuth()
  const canCreate  = hasPermission('database_backups.create')
  const canRestore = hasPermission('database_backups.restore')

  const [backups, setBackups]                   = useState<DatabaseBackup[]>([])
  const [confirmRequired, setConfirmRequired]   = useState('RIPRISTINA DATABASE')
  const [loading, setLoading]                   = useState(true)
  const [exporting, setExporting]               = useState(false)
  const [exportLabel, setExportLabel]           = useState('')
  const [downloading, setDownloading]           = useState<string | null>(null)

  // Restore modal
  const [restoreOpen, setRestoreOpen]           = useState(false)
  const [restoreMode, setRestoreMode]           = useState<'existing' | 'upload'>('existing')
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null)
  const [uploadFile, setUploadFile]             = useState<File | null>(null)
  const [preRestore, setPreRestore]             = useState(true)
  const [confirmText, setConfirmText]           = useState('')
  const [restoring, setRestoring]               = useState(false)
  const [restoreResult, setRestoreResult]       = useState<DatabaseRestoreResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const resp = await backupApi.list()
      setBackups(resp.items)
      setConfirmRequired(resp.restore_confirm_text)
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore caricamento backup')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const item = await backupApi.export(exportLabel || undefined)
      toast.success(`Backup creato: ${item.filename}`)
      setExportLabel('')
      await load()
    } catch (e) {
      toast.error(apiError(e).message ?? "Errore durante l'export")
    } finally {
      setExporting(false)
    }
  }

  const handleDownload = async (filename: string) => {
    setDownloading(filename)
    try {
      const blob = await backupApi.download(filename)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = filename
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore download')
    } finally {
      setDownloading(null)
    }
  }

  const openRestore = (filename?: string) => {
    setRestoreMode('existing')
    setSelectedFilename(filename ?? (backups[0]?.filename ?? null))
    setUploadFile(null)
    setPreRestore(true)
    setConfirmText('')
    setRestoreResult(null)
    setRestoreOpen(true)
  }

  const handleRestore = async () => {
    if (confirmText !== confirmRequired) return
    setRestoring(true)
    try {
      let result: DatabaseRestoreResponse
      if (restoreMode === 'existing' && selectedFilename) {
        result = await backupApi.restore({
          backup_filename: selectedFilename,
          confirm_text: confirmText,
          create_pre_restore_backup: preRestore,
        })
      } else if (restoreMode === 'upload' && uploadFile) {
        const fd = new FormData()
        fd.append('sql_file', uploadFile)
        fd.append('confirm_text', confirmText)
        fd.append('create_pre_restore_backup', String(preRestore))
        result = await backupApi.restoreUpload(fd)
      } else {
        toast.error('Seleziona un backup o carica un file SQL.')
        setRestoring(false)
        return
      }
      setRestoreResult(result)
      toast.success('Database ripristinato con successo.')
      await load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 422) {
        toast.error('Testo di conferma non corretto o parametri non validi.')
      } else {
        toast.error(ae.message ?? 'Errore durante il restore')
      }
    } finally {
      setRestoring(false)
    }
  }

  const isConfirmValid = confirmText === confirmRequired
  const canSubmitRestore =
    isConfirmValid &&
    !restoring &&
    (restoreMode === 'existing' ? !!selectedFilename : !!uploadFile)

  return (
    <div className='container-fluid py-3'>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h5 className='fw-bold mb-0' style={{ color: '#7366ff' }}>Backup database</h5>
        <Button size='sm' color='outline-secondary' onClick={load} disabled={loading}>
          <RefreshCw size={13} className='me-1' />Aggiorna
        </Button>
      </div>

      {/* Export */}
      {canCreate && (
        <Card className='mb-3'>
          <CardBody>
            <h6 className='fw-semibold mb-3 d-flex align-items-center gap-2'>
              <Database size={15} style={{ color: '#7366ff' }} />
              Crea backup
            </h6>
            <Row className='align-items-end g-2'>
              <Col md='4'>
                <FormGroup className='mb-0'>
                  <Label className='small mb-1'>Etichetta (opzionale)</Label>
                  <Input
                    type='text'
                    bsSize='sm'
                    placeholder='es. pre-aggiornamento'
                    value={exportLabel}
                    onChange={(e) => setExportLabel(e.target.value)}
                    disabled={exporting}
                  />
                </FormGroup>
              </Col>
              <Col xs='auto'>
                <Button color='primary' size='sm' disabled={exporting} onClick={handleExport}>
                  {exporting
                    ? <><Spinner size='sm' className='me-1' />Creazione…</>
                    : <><Database size={13} className='me-1' />Crea backup adesso</>
                  }
                </Button>
              </Col>
            </Row>
          </CardBody>
        </Card>
      )}

      {/* Lista backup */}
      <Card>
        <CardBody>
          <h6 className='fw-semibold mb-3'>Backup disponibili</h6>
          {loading ? (
            <div className='text-center py-4'><Spinner color='primary' /></div>
          ) : backups.length === 0 ? (
            <div className='text-muted small text-center py-3'>Nessun backup disponibile.</div>
          ) : (
            <div className='table-responsive'>
              <Table className='table-hover align-middle' size='sm'>
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Data creazione</th>
                    <th>Dimensione</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((b) => (
                    <tr key={b.filename}>
                      <td>
                        <span className='font-monospace small text-muted'>{b.filename}</span>
                      </td>
                      <td className='small'>{fmtDate(b.created_at)}</td>
                      <td className='small'>{formatBytes(b.size_bytes)}</td>
                      <td>
                        <div className='d-flex gap-2'>
                          <Button
                            size='sm'
                            color='outline-secondary'
                            disabled={downloading === b.filename}
                            onClick={() => handleDownload(b.filename)}
                          >
                            {downloading === b.filename
                              ? <Spinner size='sm' />
                              : <><Download size={12} className='me-1' />Scarica</>
                            }
                          </Button>
                          {canRestore && (
                            <Button
                              size='sm'
                              color='outline-danger'
                              onClick={() => openRestore(b.filename)}
                            >
                              <Upload size={12} className='me-1' />Ripristina
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal restore */}
      <Modal isOpen={restoreOpen} toggle={() => !restoring && setRestoreOpen(false)} size='lg'>
        <ModalHeader toggle={() => !restoring && setRestoreOpen(false)}>
          Ripristino database
        </ModalHeader>
        <ModalBody>
          {restoreResult ? (
            /* Vista post-restore */
            <div>
              <Alert color='success' className='d-flex align-items-center gap-2'>
                <CheckCircle size={18} className='flex-shrink-0' />
                <strong>Database ripristinato con successo.</strong>
              </Alert>

              {restoreResult.pre_restore_backup && (
                <Alert color='info' className='small'>
                  Backup pre-restore salvato automaticamente:{' '}
                  <span className='font-monospace'>{restoreResult.pre_restore_backup.filename}</span>
                </Alert>
              )}

              <h6 className='fw-semibold mb-2'>Conteggi post-ripristino</h6>
              <Table size='sm' bordered>
                <tbody>
                  {Object.entries(restoreResult.post_restore_counts).map(([k, v]) => (
                    <tr key={k}>
                      <td className='text-muted small' style={{ textTransform: 'capitalize' }}>
                        {k.replace(/_/g, ' ')}
                      </td>
                      <td className='fw-semibold'>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <Alert color='warning' className='small mt-3 d-flex align-items-start gap-2'>
                <AlertTriangle size={14} className='flex-shrink-0 mt-1' />
                <span>
                  Si consiglia di ricaricare l'applicazione e accedere nuovamente per
                  riflettere le modifiche al database.
                </span>
              </Alert>
            </div>
          ) : (
            /* Form restore */
            <div>
              <Alert color='danger' className='d-flex align-items-start gap-2'>
                <AlertTriangle size={18} className='flex-shrink-0 mt-1' />
                <div>
                  <strong>Il restore sostituisce il contenuto attuale del database.</strong>
                  <br />
                  <span className='small'>
                    Tutti i dati esistenti verranno sovrascritti dal backup selezionato.
                    L'operazione non può essere annullata.
                  </span>
                </div>
              </Alert>

              {/* Selezione modalità */}
              <FormGroup tag='fieldset' className='mb-3'>
                <legend className='small fw-semibold mb-2'>Sorgente backup</legend>
                <FormGroup check inline>
                  <Input
                    type='radio' name='restoreMode' id='mode-existing'
                    checked={restoreMode === 'existing'}
                    onChange={() => setRestoreMode('existing')}
                  />
                  <Label check for='mode-existing'>Usa backup esistente</Label>
                </FormGroup>
                <FormGroup check inline>
                  <Input
                    type='radio' name='restoreMode' id='mode-upload'
                    checked={restoreMode === 'upload'}
                    onChange={() => setRestoreMode('upload')}
                  />
                  <Label check for='mode-upload'>Carica file SQL</Label>
                </FormGroup>
              </FormGroup>

              {restoreMode === 'existing' ? (
                <FormGroup>
                  <Label>Seleziona backup</Label>
                  <Input
                    type='select'
                    value={selectedFilename ?? ''}
                    onChange={(e) => setSelectedFilename(e.target.value)}
                  >
                    {backups.map((b) => (
                      <option key={b.filename} value={b.filename}>
                        {b.filename} — {fmtDate(b.created_at)} ({formatBytes(b.size_bytes)})
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              ) : (
                <FormGroup>
                  <Label>File SQL</Label>
                  <Input
                    type='file'
                    accept='.sql'
                    innerRef={fileInputRef}
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  />
                  {uploadFile && (
                    <div className='small text-muted mt-1'>
                      <span className='font-monospace'>{uploadFile.name}</span>{' '}
                      ({formatBytes(uploadFile.size)})
                    </div>
                  )}
                </FormGroup>
              )}

              <FormGroup check className='mb-3'>
                <Input
                  type='checkbox'
                  id='pre-restore-cb'
                  checked={preRestore}
                  onChange={(e) => setPreRestore(e.target.checked)}
                />
                <Label check for='pre-restore-cb'>
                  Crea backup automatico prima del restore
                </Label>
              </FormGroup>

              <FormGroup>
                <Label>
                  Scrivi{' '}
                  <strong className='text-danger'>"{confirmRequired}"</strong>{' '}
                  per confermare
                </Label>
                <Input
                  type='text'
                  placeholder={confirmRequired}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  invalid={confirmText.length > 0 && !isConfirmValid}
                  valid={isConfirmValid}
                />
              </FormGroup>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {restoreResult ? (
            <Button color='primary' onClick={() => { setRestoreOpen(false); setRestoreResult(null) }}>
              Chiudi
            </Button>
          ) : (
            <>
              <Button color='secondary' outline onClick={() => setRestoreOpen(false)} disabled={restoring}>
                Annulla
              </Button>
              <Button color='danger' disabled={!canSubmitRestore} onClick={handleRestore}>
                {restoring
                  ? <><Spinner size='sm' className='me-1' />Ripristino in corso…</>
                  : 'Esegui ripristino'
                }
              </Button>
            </>
          )}
        </ModalFooter>
      </Modal>
    </div>
  )
}
