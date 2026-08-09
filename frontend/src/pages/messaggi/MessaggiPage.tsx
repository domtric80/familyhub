import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Badge,
} from 'reactstrap'
import { Home, Plus, Info, MessageSquare, Users, X, Archive } from 'react-feather'
import InfoDrawer from '../../components/common/InfoDrawer'
import { toast } from 'react-toastify'
import { internalMessageApi, facilityApi, minorApi, apiError } from '../../services/api'
import type {
  InternalMessageThread, InternalMessageThreadWrite,
  MessageParticipantOption, Facility, Minor,
} from '../../types'
import { useNavigate } from 'react-router-dom'
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDt(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}

const THREAD_TYPE_LABEL: Record<string, string> = {
  facility: 'Di struttura',
  minor: 'Sul minore',
}
const THREAD_TYPE_COLOR: Record<string, string> = {
  facility: 'primary',
  minor: 'info',
}

const CLASSIFICATIONS = [
  { code: 'internal',   label: 'Interno',      cls: 'badge-light-secondary' },
  { code: 'restricted', label: 'Riservato',     cls: 'badge-light-warning'   },
  { code: 'clinical',   label: 'Clinico',       cls: 'badge-light-danger'    },
  { code: 'judicial',   label: 'Giudiziario',   cls: 'badge-light-primary'   },
]

function classificationBadge(code?: string | null) {
  const c = CLASSIFICATIONS.find((x) => x.code === code) ?? CLASSIFICATIONS[0]
  return <span className={`badge ${c.cls}`} style={{ fontSize: 10 }}>{c.label}</span>
}

const EMPTY_FORM: InternalMessageThreadWrite = {
  facility_id: 0,
  minor_id: null,
  thread_type: 'facility',
  subject: '',
  topic: '',
  classification_code: 'internal',
  participant_user_ids: [],
  message_body: '',
}

// ─── Pagina ──────────────────────────────────────────────────────────────────

export default function MessaggiPage() {
  const navigate = useNavigate()
  const { getUserName } = useUnreadMessages()

  const [infoOpen, setInfoOpen]   = useState(false)
  const [threads, setThreads]     = useState<InternalMessageThread[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [apiMissing, setApiMissing] = useState(false)

  // lookup
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [minors, setMinors]         = useState<Minor[]>([])
  const [participants, setParticipants] = useState<MessageParticipantOption[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [participantsError, setParticipantsError] = useState<string | null>(null)

  // filtri
  const [filterFacilityId, setFilterFacilityId] = useState(0)
  const [filterThreadType, setFilterThreadType] = useState('')
  const [filterMinorId, setFilterMinorId]       = useState(0)
  const [filterTopic, setFilterTopic]               = useState('')
  const [filterArchived, setFilterArchived]         = useState<'false' | 'true'>('false')
  const [filterClassification, setFilterClassification] = useState('')

  // azione archiviazione
  const [archiving, setArchiving] = useState<number | null>(null)

  // form nuova conversazione
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm]           = useState<InternalMessageThreadWrite>(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [formMsg, setFormMsg]     = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // ── Caricamento ────────────────────────────────────────────────
  const load = async () => {
    setLoading(true); setError(null)
    try {
      const params: {
        facility_id?: number
        thread_type?: string
        minor_id?: number
        topic?: string
        archived?: boolean
        classification_code?: string
      } = {}
      if (filterFacilityId) params.facility_id = filterFacilityId
      if (filterThreadType) params.thread_type = filterThreadType
      if (filterMinorId)    params.minor_id    = filterMinorId
      if (filterTopic.trim())       params.topic               = filterTopic.trim()
      if (filterClassification)     params.classification_code = filterClassification
      params.archived = filterArchived === 'true'
      const data = await internalMessageApi.listThreads(params)
      setThreads(Array.isArray(data) ? data : [])
      setApiMissing(false)
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 404) { setApiMissing(true); setThreads([]) }
      else if (ae.status === 403) setError('Non hai i permessi per accedere alla messaggistica interna.')
      else setError(ae.message ?? 'Errore caricamento')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    Promise.all([facilityApi.list(), minorApi.list()])
      .then(([facs, mins]) => { setFacilities(facs); setMinors(mins) })
      .catch(() => {})
  }, [])

  useEffect(() => { load() }, [filterFacilityId, filterThreadType, filterMinorId, filterTopic, filterArchived, filterClassification]) // eslint-disable-line

  // ── Caricamento partecipanti (quando cambia struttura/minore nel form) ──
  useEffect(() => {
    if (!form.facility_id) { setParticipants([]); setParticipantsError(null); return }
    setLoadingParticipants(true)
    setParticipantsError(null)
    setForm((prev) => ({ ...prev, participant_user_ids: [] }))
    const params: { facility_id: number; minor_id?: number; classification_code?: string } = { facility_id: form.facility_id }
    if (form.thread_type === 'minor' && form.minor_id) params.minor_id = form.minor_id
    if (form.classification_code) params.classification_code = form.classification_code
    internalMessageApi.participantOptions(params)
      .then((data) => {
        const source = Array.isArray(data) ? data : []

        const normalized = source.map((p: MessageParticipantOption & {
          user_id?: number
          first_name?: string | null
          last_name?: string | null
          name?: string | null
          full_name?: string | null
        }) => {
          const resolvedId = p.id ?? p.user_id ?? 0
          const resolvedName =
            p.display_name?.trim() ||
            p.full_name?.trim() ||
            p.name?.trim() ||
            [p.last_name, p.first_name].filter(Boolean).join(' ') ||
            getUserName(resolvedId)
          return { ...p, id: resolvedId, display_name: resolvedName }
        })
        setParticipants(normalized)
      })
      .catch((e) => {
        const ae = apiError(e)
        if (ae.status === 404) {
          setParticipantsError('Servizio partecipanti non disponibile o backend non aggiornato.')
        } else {
          setParticipantsError(ae.message ?? 'Errore caricamento partecipanti.')
        }
        setParticipants([])
      })
      .finally(() => setLoadingParticipants(false))
  }, [form.facility_id, form.minor_id, form.thread_type, form.classification_code])

  // ── Form helpers ────────────────────────────────────────────────
  const setF = <K extends keyof InternalMessageThreadWrite>(k: K, v: InternalMessageThreadWrite[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const toggleParticipant = (userId: number) => {
    setForm((prev) => {
      const ids = prev.participant_user_ids
      return {
        ...prev,
        participant_user_ids: ids.includes(userId)
          ? ids.filter((id) => id !== userId)
          : [...ids, userId],
      }
    })
  }

  const openCreate = () => {
    setForm(EMPTY_FORM); setFormMsg(null); setFieldErrors({})
    setModalOpen(true)
  }

  const handleSave = async () => {
    setFormMsg(null); setFieldErrors({})
    if (!form.facility_id)         { setFormMsg('Seleziona una struttura.'); return }
    if (!form.subject.trim())      { setFormMsg('Inserisci un oggetto.'); return }
    if (!form.message_body.trim()) { setFormMsg('Inserisci il primo messaggio.'); return }
    if (form.thread_type === 'minor' && !form.minor_id) {
      setFormMsg('Seleziona un minore per conversazione di tipo "Sul minore".'); return
    }
    if (form.participant_user_ids.length === 0) {
      setFormMsg('Seleziona almeno un partecipante.'); return
    }
    setSaving(true)
    try {
      const payload: InternalMessageThreadWrite = {
        ...form,
        topic: form.topic || undefined,
        minor_id: form.thread_type === 'minor' ? form.minor_id : null,
      }
      const created = await internalMessageApi.createThread(payload)
      toast.success('Conversazione creata.')
      setModalOpen(false)
      await load()
      navigate(`/messaggi/${created.id}`)
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 422 && ae.errors) {
        setFieldErrors(ae.errors as Record<string, string[]>)
        setFormMsg('Correggi i campi evidenziati.')
      } else if (ae.status === 403) {
        setFormMsg('Non hai i permessi per creare questa conversazione.')
      } else {
        setFormMsg(ae.message ?? 'Errore durante il salvataggio.')
      }
    } finally { setSaving(false) }
  }

  const fe = (k: string) => fieldErrors[k]?.[0]

  const handleArchive = async (t: InternalMessageThread, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`Archiviare la conversazione "${t.subject}"?`)) return
    setArchiving(t.id)
    try {
      await internalMessageApi.archiveThread(t.id)
      toast.success('Conversazione archiviata.')
      load()
    } catch (err) {
      const ae = apiError(err)
      toast.error(ae.message ?? 'Errore durante l\'archiviazione.')
    } finally { setArchiving(null) }
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <div className='d-flex align-items-center gap-2'>
                <h3 className='mb-0'>Messaggistica interna</h3>
                <button className='btn btn-light btn-sm d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
                  <Info size={13} /> Informazioni
                </button>
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item active'>Messaggistica</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        {apiMissing && (
          <Alert color='warning' className='mb-3'>Il modulo messaggistica non è ancora disponibile sul backend.</Alert>
        )}

        <Row><Col sm='12'>
          <Card>
            <CardHeader className='d-flex justify-content-between align-items-center'>
              <h5 className='mb-0'>Conversazioni</h5>
              <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
                <Plus size={13} /> Nuova conversazione
              </Button>
            </CardHeader>
            <CardBody>
              {/* ── Filtri ── */}
              <Row className='g-2 mb-3 align-items-end'>
                <Col sm='3'>
                  <Label className='small mb-1'>Struttura</Label>
                  <Input type='select' bsSize='sm' value={filterFacilityId}
                    onChange={(e) => { setFilterFacilityId(Number(e.target.value)); setFilterMinorId(0) }}>
                    <option value={0}>Tutte le strutture</option>
                    {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </Input>
                </Col>
                <Col sm='2'>
                  <Label className='small mb-1'>Tipo</Label>
                  <Input type='select' bsSize='sm' value={filterThreadType}
                    onChange={(e) => setFilterThreadType(e.target.value)}>
                    <option value=''>Tutti i tipi</option>
                    <option value='facility'>Di struttura</option>
                    <option value='minor'>Sul minore</option>
                  </Input>
                </Col>
                <Col sm='2'>
                  <Label className='small mb-1'>Minore</Label>
                  <Input type='select' bsSize='sm' value={filterMinorId}
                    onChange={(e) => setFilterMinorId(Number(e.target.value))}>
                    <option value={0}>Tutti i minori</option>
                    {minors.map((m) => (
                      <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.internal_code})</option>
                    ))}
                  </Input>
                </Col>
                <Col sm='2'>
                  <Label className='small mb-1'>Topic</Label>
                  <Input bsSize='sm' placeholder='Filtra per topic…' value={filterTopic}
                    onChange={(e) => setFilterTopic(e.target.value)} />
                </Col>
                <Col sm='2'>
                  <Label className='small mb-1'>Classificazione</Label>
                  <Input type='select' bsSize='sm' value={filterClassification}
                    onChange={(e) => setFilterClassification(e.target.value)}>
                    <option value=''>Tutte</option>
                    {CLASSIFICATIONS.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </Input>
                </Col>
                <Col sm='2'>
                  <Label className='small mb-1'>Stato</Label>
                  <Input type='select' bsSize='sm' value={filterArchived}
                    onChange={(e) => setFilterArchived(e.target.value as 'false' | 'true')}>
                    <option value='false'>Solo attive</option>
                    <option value='true'>Solo archiviate</option>
                  </Input>
                </Col>
                <Col sm='auto'>
                  <Button size='sm' color='light' onClick={() => {
                    setFilterFacilityId(0); setFilterThreadType('');
                    setFilterMinorId(0); setFilterTopic(''); setFilterArchived('false'); setFilterClassification('')
                  }}>
                    Reset
                  </Button>
                </Col>
              </Row>

              {/* ── Stato ── */}
              {error && <Alert color='warning'>{error}</Alert>}
              {loading && <div className='text-center py-4'><span className='spinner-border spinner-border-sm' /></div>}

              {/* ── Lista thread ── */}
              {!loading && !error && threads.length === 0 && (
                <p className='text-muted py-3'>Non risultano ancora conversazioni per i filtri selezionati.</p>
              )}

              {!loading && !error && threads.length > 0 && (
                <div className='table-responsive'>
                  <table className='table table-hover table-sm'>
                    <thead className='table-light'>
                      <tr>
                        <th>Oggetto</th>
                        <th>Tipo</th>
                        <th>Struttura</th>
                        <th>Minore</th>
                        <th>Partecipanti</th>
                        <th>Ultimo messaggio</th>
                        <th>Non letti</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {threads.map((t) => (
                        <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/messaggi/${t.id}`)}>
                          <td>
                            <strong>{t.subject}</strong>
                            {t.topic && <div className='text-muted' style={{ fontSize: 11 }}>{t.topic}</div>}
                            {t.archived_at && <Badge color='' className='badge-light-secondary ms-1' style={{ fontSize: 10 }}>Archiviata</Badge>}
                          </td>
                          <td>
                            <div className='d-flex flex-column gap-1'>
                              <span className={`badge badge-light-${THREAD_TYPE_COLOR[t.thread_type] ?? 'secondary'}`}>
                                {THREAD_TYPE_LABEL[t.thread_type] ?? t.thread_type}
                              </span>
                              {classificationBadge(t.classification_code)}
                            </div>
                          </td>
                          <td className='small'>{t.facility?.name ?? '—'}</td>
                          <td className='small'>
                            {t.minor
                              ? `${t.minor.first_name} ${t.minor.last_name}`
                              : <span className='text-muted'>—</span>}
                          </td>
                          <td>
                            <span className='d-flex align-items-center gap-1'>
                              <Users size={12} className='text-muted' />
                              <span className='small'>{t.participants?.length ?? 0}</span>
                            </span>
                          </td>
                          <td className='small'>{fmtDt(t.last_message_at)}</td>
                          <td>
                            {t.unread_count > 0
                              ? <Badge color='danger' pill>{t.unread_count}</Badge>
                              : <span className='text-muted small'>—</span>}
                          </td>
                          <td>
                            <div className='d-flex gap-1 text-nowrap'>
                              <Button size='sm' color='outline-primary' className='d-flex align-items-center gap-1'
                                onClick={(e) => { e.stopPropagation(); navigate(`/messaggi/${t.id}`) }}>
                                <MessageSquare size={12} /> Apri
                              </Button>
                              {!t.archived_at && (
                                <Button size='sm' color='outline-secondary' className='d-flex align-items-center gap-1'
                                  disabled={archiving === t.id}
                                  onClick={(e) => handleArchive(t, e)}
                                  title='Archivia conversazione'>
                                  <Archive size={12} />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </Col></Row>
      </Container>

      {/* ── Modale nuova conversazione ── */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setModalOpen(false)}>Nuova conversazione</ModalHeader>
        <ModalBody>
          {formMsg && <Alert color='warning' className='mb-3'>{formMsg}</Alert>}

          {/* Box tipo conversazione */}
          <Alert color='info' className='d-flex gap-2 align-items-start mb-3' style={{ fontSize: 13 }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Scegli <strong>"Di struttura"</strong> per comunicazioni interne generali del team, oppure <strong>"Sul minore"</strong> per una conversazione collegata a uno specifico caso.</span>
          </Alert>

          {/* Blocco 1: Dati base */}
          <h6 className='text-muted mb-2' style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Dati base</h6>
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label className='col-form-label'>Struttura <span className='text-danger'>*</span></Label>
                <Input type='select' value={form.facility_id || ''} invalid={!!fe('facility_id')}
                  onChange={(e) => { setF('facility_id', Number(e.target.value)); setF('participant_user_ids', []) }}>
                  <option value=''>— Seleziona struttura —</option>
                  {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </Input>
                {fe('facility_id') && <div className='invalid-feedback d-block'>{fe('facility_id')}</div>}
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label className='col-form-label'>Tipo conversazione <span className='text-danger'>*</span></Label>
                <Input type='select' value={form.thread_type}
                  onChange={(e) => { setF('thread_type', e.target.value as 'facility' | 'minor'); setF('minor_id', null); setF('participant_user_ids', []) }}>
                  <option value='facility'>Di struttura</option>
                  <option value='minor'>Sul minore</option>
                </Input>
              </FormGroup>
            </Col>
          </Row>

          <FormGroup>
            <Label className='col-form-label'>Classificazione</Label>
            <Input type='select' value={form.classification_code ?? 'internal'} invalid={!!fe('classification_code')}
              onChange={(e) => { setF('classification_code', e.target.value); setF('participant_user_ids', []) }}>
              {CLASSIFICATIONS.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </Input>
            {fe('classification_code') && <div className='invalid-feedback d-block'>{fe('classification_code')}</div>}
            <div className='form-text'>Cambiando classificazione i partecipanti verranno rifiltrati automaticamente.</div>
          </FormGroup>

          {form.thread_type === 'minor' && (
            <FormGroup>
              <Label className='col-form-label'>Minore <span className='text-danger'>*</span></Label>
              <Input type='select' value={form.minor_id ?? ''} invalid={!!fe('minor_id')}
                onChange={(e) => { setF('minor_id', e.target.value ? Number(e.target.value) : null); setF('participant_user_ids', []) }}>
                <option value=''>— Seleziona minore —</option>
                {minors
                  .filter((m) => !filterFacilityId || m.facility_id === form.facility_id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.internal_code})</option>
                  ))}
              </Input>
              {fe('minor_id') && <div className='invalid-feedback d-block'>{fe('minor_id')}</div>}
            </FormGroup>
          )}

          <Row>
            <Col md='8'>
              <FormGroup>
                <Label className='col-form-label'>Oggetto <span className='text-danger'>*</span></Label>
                <Input value={form.subject} invalid={!!fe('subject')}
                  onChange={(e) => setF('subject', e.target.value)}
                  placeholder='Es. Confronto equipe su rientro famigliare' />
                {fe('subject') && <div className='invalid-feedback d-block'>{fe('subject')}</div>}
              </FormGroup>
            </Col>
            <Col md='4'>
              <FormGroup>
                <Label className='col-form-label'>Topic</Label>
                <Input value={form.topic ?? ''} onChange={(e) => setF('topic', e.target.value || null)}
                  placeholder='Es. Allineamento operativo' />
              </FormGroup>
            </Col>
          </Row>

          {/* Blocco 2: Partecipanti */}
          <hr />
          <h6 className='text-muted mb-2' style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Partecipanti</h6>
          <Alert color='info' className='d-flex gap-2 align-items-start mb-3' style={{ fontSize: 13 }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>L'elenco cambia in base alla struttura selezionata{form.thread_type === 'minor' ? ' e al minore collegato' : ''}. Seleziona almeno un partecipante oltre a te.</span>
          </Alert>

          {!form.facility_id && (
            <p className='text-muted small'>Seleziona prima una struttura per vedere i partecipanti disponibili.</p>
          )}

          {form.facility_id && loadingParticipants && (
            <div className='text-center py-2'><span className='spinner-border spinner-border-sm' /></div>
          )}

          {form.facility_id && !loadingParticipants && participantsError && (
            <Alert color='warning' className='mb-2' style={{ fontSize: 13 }}>{participantsError}</Alert>
          )}
          {form.facility_id && !loadingParticipants && !participantsError && participants.length === 0 && (
            <p className='text-muted small'>Non ci sono utenti selezionabili con i criteri correnti.</p>
          )}

          {form.facility_id && !loadingParticipants && participants.length > 0 && (
            <>
              <div className='border rounded p-2 mb-1' style={{ maxHeight: 220, overflowY: 'auto' }}>
                {participants.map((p) => (
                  <div key={p.id} className='form-check mb-1'>
                    <input type='checkbox' className='form-check-input' id={`p-${p.id}`}
                      checked={form.participant_user_ids.includes(p.id)}
                      onChange={() => toggleParticipant(p.id)} />
                    <label className='form-check-label small' htmlFor={`p-${p.id}`}>
                      <span className='fw-semibold'>{p.display_name}</span>
                      {p.role_name && <span className='text-muted ms-1'>— {p.role_name}</span>}
                      {(p as any).email && <span className='text-muted ms-1'>— {(p as any).email}</span>}
                    </label>
                  </div>
                ))}
              </div>
              {fe('participant_user_ids') && (
                <div className='text-danger small mb-2'>{fe('participant_user_ids')}</div>
              )}
            </>
          )}

          {form.participant_user_ids.length > 0 && (
            <p className='small text-muted mb-3'>
              {form.participant_user_ids.length} partecipante{form.participant_user_ids.length > 1 ? 'i' : ''} selezionato{form.participant_user_ids.length > 1 ? 'i' : ''}.
            </p>
          )}

          {/* Blocco 3: Primo messaggio */}
          <hr />
          <h6 className='text-muted mb-2' style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Primo messaggio</h6>
          <Alert color='warning' className='d-flex gap-2 align-items-start mb-3' style={{ fontSize: 13 }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Evita di condividere informazioni non pertinenti. Tutte le operazioni rilevanti su questa sezione sono tracciate.</span>
          </Alert>
          <FormGroup>
            <Input type='textarea' rows={4} value={form.message_body} invalid={!!fe('message_body')}
              onChange={(e) => setF('message_body', e.target.value)}
              placeholder='Scrivi il primo messaggio della conversazione...' />
            {fe('message_body') && <div className='invalid-feedback d-block'>{fe('message_body')}</div>}
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' size='sm' onClick={handleSave} disabled={saving}>
            {saving ? 'Salvataggio…' : 'Crea conversazione'}
          </Button>
          <Button color='secondary' size='sm' className='d-flex align-items-center gap-1' onClick={() => setModalOpen(false)}>
            <X size={13} /> Annulla
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── InfoDrawer ── */}
      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Messaggistica interna'>
        <p>Questa sezione consente al team di condividere comunicazioni interne operative in modo riservato, tracciato e coerente con la struttura o con uno specifico minore.</p>

        <h6 className='mt-3'>Tipi di conversazione</h6>
        <p><strong>Di struttura</strong> — per il coordinamento generale del team della struttura.</p>
        <p><strong>Sul minore</strong> — riservata agli utenti autorizzati ad operare su quel minore.</p>

        <h6 className='mt-3'>Partecipanti</h6>
        <p>Puoi selezionare solo utenti compatibili con la struttura scelta. Nelle conversazioni sul minore, la lista può restringersi ulteriormente in base alle assegnazioni attive.</p>

        <h6 className='mt-3'>Riservatezza</h6>
        <p>I messaggi vengono salvati in forma cifrata e sono accessibili solo agli utenti autorizzati.</p>

        <h6 className='mt-3'>Perché potresti non vedere alcune azioni</h6>
        <p>Le azioni disponibili dipendono dal tuo ruolo, dalla struttura in cui operi e, quando presente, dall'assegnazione al minore.</p>
      </InfoDrawer>
    </>
  )
}
