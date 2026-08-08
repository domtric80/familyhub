import { useCallback, useEffect, useState } from 'react'
import {
  Card, CardBody, Button, Table, Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Badge, Row, Col, FormText,
} from 'reactstrap'
import { Plus, Edit2, Trash2, Wifi, Zap, AlertTriangle, Eye, EyeOff } from 'react-feather'
import { toast } from 'react-toastify'
import {
  systemStorageApi,
} from '../../services/api'
import type {
  StorageConfigItem, StorageConfigListResponse, StorageConfigWrite,
  StorageProviderType, StorageCurrentSource,
} from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

// ─── Labels ───────────────────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<StorageProviderType, string> = {
  minio: 'MinIO',
  aws_s3: 'AWS S3',
  s3_compatible: 'S3 compatibile',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TestBadge({ status }: { status: string | null }) {
  if (!status) return <span className='text-muted small'>—</span>
  if (status === 'ok') return <Badge color='success'>OK</Badge>
  return <Badge color='danger'>Errore</Badge>
}

function CurrentSourceBanner({ source }: { source: StorageCurrentSource | null }) {
  if (!source) return null
  if (source === 'ENV') {
    return (
      <Alert color='info' className='small mb-3'>
        Lo storage attivo è letto dal file ambiente (<code>.env</code>).
        Le configurazioni DB aggiunte da questo pannello non sono ancora attive come sorgente runtime.
      </Alert>
    )
  }
  return (
    <Alert color='primary' className='small mb-3'>
      Lo storage attivo è gestito da configurazione amministrativa (DB).
    </Alert>
  )
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  code: string
  name: string
  provider_type: StorageProviderType
  bucket: string
  region: string
  endpoint: string
  use_path_style_endpoint: boolean
  access_key: string
  secret_key: string
  prefix: string
  is_active: boolean
  is_default: boolean
}

const EMPTY_FORM: FormState = {
  code: '',
  name: '',
  provider_type: 'minio',
  bucket: '',
  region: '',
  endpoint: '',
  use_path_style_endpoint: false,
  access_key: '',
  secret_key: '',
  prefix: '',
  is_active: true,
  is_default: false,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SistemaStoragePage() {
  const { hasPermission } = useAuth()

  const canCreate   = hasPermission('system_storage.create')
  const canUpdate   = hasPermission('system_storage.update')
  const canTest     = hasPermission('system_storage.test')
  const canActivate = hasPermission('system_storage.activate')
  const canDelete   = hasPermission('system_storage.delete')

  const [listData, setListData] = useState<StorageConfigListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<StorageConfigItem | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)

  const [testingId, setTestingId] = useState<number | null>(null)
  const [activatingId, setActivatingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // ── Load ────────────────────────────────────────────────────────────────────

  const loadList = useCallback(() => {
    setLoading(true)
    systemStorageApi.list()
      .then(setListData)
      .catch((err) => {
        if (err?.response?.status === 403) setForbidden(true)
        else toast.error('Errore nel caricamento delle configurazioni storage.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadList() }, [loadList])

  // ── Modal helpers ────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setShowSecret(false)
    setModalOpen(true)
  }

  const openEdit = (item: StorageConfigItem) => {
    setEditItem(item)
    setForm({
      code:                    item.code,
      name:                    item.name,
      provider_type:           item.provider_type,
      bucket:                  item.bucket,
      region:                  item.region ?? '',
      endpoint:                item.endpoint ?? '',
      use_path_style_endpoint: item.use_path_style_endpoint,
      access_key:              '',  // mai precompilare
      secret_key:              '',  // mai precompilare
      prefix:                  item.prefix ?? '',
      is_active:               item.is_active,
      is_default:              item.is_default,
    })
    setShowSecret(false)
    setModalOpen(true)
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: StorageConfigWrite = {
        code:                    form.code,
        name:                    form.name,
        provider_type:           form.provider_type,
        bucket:                  form.bucket,
        region:                  form.region || undefined,
        endpoint:                form.endpoint || undefined,
        use_path_style_endpoint: form.use_path_style_endpoint,
        prefix:                  form.prefix || undefined,
        is_active:               form.is_active,
        is_default:              form.is_default,
      }
      // Includi le chiavi SOLO se l'utente ha inserito un valore
      if (form.access_key) payload.access_key = form.access_key
      if (form.secret_key) payload.secret_key = form.secret_key

      if (editItem) {
        await systemStorageApi.update(editItem.id, payload)
        toast.success('Configurazione aggiornata.')
      } else {
        await systemStorageApi.create(payload)
        toast.success('Configurazione creata.')
      }
      setModalOpen(false)
      loadList()
    } catch (err: any) {
      if (err?.response?.status === 422) {
        const msgs = Object.values(err.response.data?.errors ?? {}).flat().join(' ')
        toast.error(`Errore di validazione: ${msgs || 'dati non validi.'}`)
      } else {
        toast.error('Errore durante il salvataggio.')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Test ──────────────────────────────────────────────────────────────────────

  const handleTest = async (item: StorageConfigItem) => {
    setTestingId(item.id)
    try {
      const result = await systemStorageApi.test(item.id)
      if (result.status === 'ok') {
        toast.success(`Test riuscito: ${result.message}`)
      } else {
        toast.warning(`Test fallito: ${result.message}`)
      }
      loadList()
    } catch {
      toast.error('Errore durante il test di connessione.')
    } finally {
      setTestingId(null)
    }
  }

  // ── Activate ──────────────────────────────────────────────────────────────────

  const handleActivate = async (item: StorageConfigItem) => {
    setActivatingId(item.id)
    try {
      await systemStorageApi.activate(item.id)
      toast.success('Configurazione storage attivata.')
      loadList()
    } catch {
      toast.error('Errore durante l\'attivazione.')
    } finally {
      setActivatingId(null)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────

  const handleDelete = async (item: StorageConfigItem) => {
    if (!confirm(`Eliminare la configurazione "${item.name}"? L'operazione non può essere annullata.`)) return
    setDeletingId(item.id)
    try {
      await systemStorageApi.delete(item.id)
      toast.success('Configurazione eliminata.')
      loadList()
    } catch {
      toast.error('Errore durante l\'eliminazione.')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (forbidden) {
    return (
      <div className='container-fluid py-3'>
        <Alert color='danger'>
          <strong>Accesso negato.</strong> Non hai il permesso <code>system_storage.read</code> per visualizzare questa pagina.
        </Alert>
      </div>
    )
  }

  const items = listData?.items ?? []
  const envFallback = listData?.env_fallback ?? null
  const currentSource = listData?.current_source ?? null
  const isEditing = editItem !== null

  return (
    <div className='container-fluid py-3'>
      {/* Header */}
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h5 className='fw-bold mb-0' style={{ color: '#7366ff' }}>Configurazione Storage</h5>
        {canCreate && (
          <Button size='sm' color='primary' className='d-flex align-items-center gap-1' onClick={openAdd}>
            <Plus size={14} /> Nuova configurazione
          </Button>
        )}
      </div>

      {/* Banner stato runtime */}
      <CurrentSourceBanner source={currentSource} />

      {/* ENV fallback (read-only) */}
      {envFallback && (
        <Card className='mb-3'>
          <CardBody className='py-2 px-3'>
            <div className='d-flex align-items-center gap-2 mb-2'>
              <Badge color='secondary'>ENV</Badge>
              <span className='fw-semibold small'>Configurazione da file ambiente (read-only)</span>
            </div>
            <div className='d-flex flex-wrap gap-3 small text-muted'>
              <span><strong>Provider:</strong> {envFallback.provider_type}</span>
              <span><strong>Bucket:</strong> {envFallback.bucket}</span>
              <span><strong>Endpoint:</strong> {envFallback.endpoint}</span>
              <span><strong>Region:</strong> {envFallback.region || '—'}</span>
              <span><strong>Path style:</strong> {envFallback.use_path_style_endpoint ? 'Sì' : 'No'}</span>
              <span><strong>Access key:</strong> <code>{envFallback.access_key_masked}</code></span>
              <span><strong>Secret key:</strong> <code>{envFallback.secret_key_masked}</code></span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tabella configurazioni DB */}
      <Card>
        <CardBody className='p-0'>
          <div className='table-responsive'>
            <Table hover className='mb-0 table-sm align-middle'>
              <thead className='table-light'>
                <tr>
                  <th>Nome</th>
                  <th>Provider</th>
                  <th>Bucket</th>
                  <th>Endpoint</th>
                  <th>Region</th>
                  <th className='text-center'>Path style</th>
                  <th className='text-center'>Attiva</th>
                  <th className='text-center'>Default</th>
                  <th>Ultimo test</th>
                  <th className='text-center'>Esito</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className='text-center text-muted py-4 small'>Caricamento…</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={11} className='text-center text-muted py-4 small'>
                      Nessuna configurazione DB registrata.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className='fw-semibold small'>{item.name}</span>
                        <br />
                        <code style={{ fontSize: 11 }}>{item.code}</code>
                      </td>
                      <td className='small'>{PROVIDER_LABELS[item.provider_type] ?? item.provider_type}</td>
                      <td className='small font-monospace'>{item.bucket}</td>
                      <td className='small text-muted' style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.endpoint || '—'}
                      </td>
                      <td className='small text-muted'>{item.region || '—'}</td>
                      <td className='text-center small'>{item.use_path_style_endpoint ? '✓' : '—'}</td>
                      <td className='text-center'>
                        {item.is_active
                          ? <Badge color='success' pill>Sì</Badge>
                          : <Badge color='secondary' pill>No</Badge>}
                      </td>
                      <td className='text-center'>
                        {item.is_default ? <Badge color='warning' pill>Default</Badge> : <span className='text-muted'>—</span>}
                      </td>
                      <td className='small text-muted'>
                        {item.last_tested_at ? new Date(item.last_tested_at).toLocaleString('it-IT') : '—'}
                      </td>
                      <td className='text-center'>
                        <TestBadge status={item.last_test_status} />
                      </td>
                      <td>
                        <div className='d-flex gap-1 flex-nowrap'>
                          {canUpdate && (
                            <Button size='sm' color='outline-primary' className='py-0 px-2' title='Modifica'
                              onClick={() => openEdit(item)}>
                              <Edit2 size={12} />
                            </Button>
                          )}
                          {canTest && (
                            <Button
                              size='sm' color='outline-secondary' className='py-0 px-2'
                              title='Test connessione'
                              disabled={testingId === item.id}
                              onClick={() => handleTest(item)}
                            >
                              <Wifi size={12} />
                            </Button>
                          )}
                          {canActivate && !item.is_default && (
                            <Button
                              size='sm' color='outline-success' className='py-0 px-2'
                              title='Attiva come sorgente runtime'
                              disabled={activatingId === item.id}
                              onClick={() => handleActivate(item)}
                            >
                              <Zap size={12} />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size='sm' color='outline-danger' className='py-0 px-2'
                              title='Elimina'
                              disabled={deletingId === item.id}
                              onClick={() => handleDelete(item)}
                            >
                              <Trash2 size={12} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </CardBody>
      </Card>

      {/* Modal add/edit */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size='lg'>
        <ModalHeader toggle={() => setModalOpen(false)}>
          {isEditing ? 'Modifica configurazione storage' : 'Nuova configurazione storage'}
        </ModalHeader>
        <ModalBody>
          {isEditing && (
            <Alert color='warning' className='small d-flex align-items-center gap-2 py-2 mb-3'>
              <AlertTriangle size={14} className='flex-shrink-0' />
              Le modifiche a una configurazione attiva avranno effetto immediato sul sistema.
            </Alert>
          )}

          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Nome configurazione</Label>
                <Input bsSize='sm' value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder='es. MinIO produzione' />
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Codice</Label>
                <Input bsSize='sm' value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder='es. MINIO_PROD' />
              </FormGroup>
            </Col>
          </Row>

          <FormGroup>
            <Label>Provider</Label>
            <Input type='select' bsSize='sm' value={form.provider_type}
              onChange={(e) => setForm({ ...form, provider_type: e.target.value as StorageProviderType })}>
              <option value='minio'>MinIO</option>
              <option value='aws_s3'>AWS S3</option>
              <option value='s3_compatible'>S3 compatibile</option>
            </Input>
          </FormGroup>

          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Bucket</Label>
                <Input bsSize='sm' value={form.bucket}
                  onChange={(e) => setForm({ ...form, bucket: e.target.value })} />
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Regione</Label>
                <Input bsSize='sm' value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  placeholder='es. eu-south-1' />
              </FormGroup>
            </Col>
          </Row>

          <FormGroup>
            <Label>Endpoint</Label>
            <Input bsSize='sm' value={form.endpoint}
              onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
              placeholder='es. https://minio.example.com' />
          </FormGroup>

          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Access Key</Label>
                <Input
                  bsSize='sm'
                  value={form.access_key}
                  onChange={(e) => setForm({ ...form, access_key: e.target.value })}
                  placeholder={isEditing && editItem?.has_access_key ? 'Chiave presente — lascia vuoto per mantenerla' : ''}
                />
                {isEditing && editItem?.has_access_key && (
                  <FormText>Chiave presente. Lascia vuoto per mantenerla invariata.</FormText>
                )}
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Secret Key</Label>
                <div className='input-group input-group-sm'>
                  <Input
                    type={showSecret ? 'text' : 'password'}
                    value={form.secret_key}
                    onChange={(e) => setForm({ ...form, secret_key: e.target.value })}
                    placeholder={isEditing && editItem?.has_secret_key ? 'Secret presente — lascia vuoto per mantenerlo' : ''}
                  />
                  <Button color='outline-secondary' size='sm'
                    onClick={() => setShowSecret((p) => !p)} type='button'>
                    {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                  </Button>
                </div>
                {isEditing && editItem?.has_secret_key && (
                  <FormText>Secret presente. Il valore salvato non viene mai mostrato in chiaro.</FormText>
                )}
              </FormGroup>
            </Col>
          </Row>

          <FormGroup>
            <Label>Prefisso path (opzionale)</Label>
            <Input bsSize='sm' value={form.prefix}
              onChange={(e) => setForm({ ...form, prefix: e.target.value })}
              placeholder='es. familyhub/' />
          </FormGroup>

          <Row>
            <Col xs='auto'>
              <FormGroup check>
                <Input type='checkbox' checked={form.use_path_style_endpoint}
                  onChange={(e) => setForm({ ...form, use_path_style_endpoint: e.target.checked })} />
                <Label check>Usa path style endpoint</Label>
              </FormGroup>
            </Col>
            <Col xs='auto'>
              <FormGroup check>
                <Input type='checkbox' checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <Label check>Attiva</Label>
              </FormGroup>
            </Col>
            <Col xs='auto'>
              <FormGroup check>
                <Input type='checkbox' checked={form.is_default}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
                <Label check>Predefinita</Label>
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color='secondary' outline onClick={() => setModalOpen(false)} disabled={saving}>
            Annulla
          </Button>
          <Button color='primary' onClick={handleSave} disabled={saving}>
            {saving ? 'Salvataggio…' : 'Salva configurazione'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
