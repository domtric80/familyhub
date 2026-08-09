import { useEffect, useState } from 'react'
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Row, Col, Badge,
} from 'reactstrap'
import { Plus, Edit2, Eye, X } from 'react-feather'
import { toast } from 'react-toastify'
import { approachApi, lookupsApi, minorApi, staffMemberApi, apiError } from '../../../services/api'
import type {
  Approach, ApproachWrite, ApproachType, MinorContact, ApproachParticipant,
  ApproachParticipantWrite, ApproachStaffParticipantWrite, StaffMember, LookupItem, MinorDocument,
} from '../../../types'
import DocPreviewModal from '../../../components/common/DocPreviewModal'
import { useAuth } from '../../../contexts/AuthContext'

const STATUS_BADGE: Record<string, string> = {
  planned: 'badge-light-primary', in_progress: 'badge-light-warning',
  completed: 'badge-light-success', cancelled: 'badge-light-secondary', suspended: 'badge-light-danger',
}
const STATUS_LABEL: Record<string, string> = {
  planned: 'Pianificato', in_progress: 'In corso',
  completed: 'Completato', cancelled: 'Annullato', suspended: 'Sospeso',
}
const REACTION_LABEL: Record<string, string> = {
  very_negative: 'Molto negativa', negative: 'Negativa', neutral: 'Neutra',
  positive: 'Positiva', very_positive: 'Molto positiva',
}
const AUTH_BADGE: Record<string, string> = {
  active: 'badge-light-success', expiring: 'badge-light-warning', expired: 'badge-light-danger',
}
const AUTH_LABEL: Record<string, string> = {
  active: 'Attivo', expiring: 'In scadenza', expired: 'Scaduto',
}

type DisplayApproachContact = ApproachParticipant | (MinorContact & { minor_contact_id?: number; contact_type?: { id: number; name: string } | null })

function extractDisplayContactName(contact: DisplayApproachContact): string {
  if ('contact' in contact && contact.contact) {
    return `${contact.contact.last_name} ${contact.contact.first_name}`
  }

  if ('last_name' in contact) {
    return `${contact.last_name} ${contact.first_name}`
  }

  return `#${(contact as ApproachParticipant).minor_contact_id ?? (contact as unknown as MinorContact).id}`
}

function fmtDt(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}
function fmtDate(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('it-IT')
}

function normalizeApproachContacts(detail: Approach): DisplayApproachContact[] {
  if (detail.participants?.length) return detail.participants
  if (detail.minor_contacts?.length) return detail.minor_contacts
  if (detail.minor_contact) return [detail.minor_contact]
  return []
}

const EMPTY_FORM: ApproachWrite = {
  minor_id: 0,
  approach_type_id: 0,
  participants: [],
  staff_participants: [],
  minor_contact_ids: [],
  title: '',
  planned_start_at: '',
  status: 'planned',
  location: null,
  objective: null,
  pre_reaction_level: null,
  during_reaction_level: null,
  post_reaction_level: null,
  pre_reaction_notes: null,
  during_reaction_notes: null,
  post_reaction_notes: null,
  outcome_notes: null,
  next_steps: null,
  authorization_reference: null,
  authorization_issued_at: null,
  authorization_expires_at: null,
  reserved_psychologist_notes: null,
  reserved_coordinator_notes: null,
}

const REACTION_OPTIONS = ['very_negative', 'negative', 'neutral', 'positive', 'very_positive']

// ─── Repeater partecipanti familiari ─────────────────────────────────────────
function ParticipantsRepeater({
  rows, contactOptions, contactTypeOptions, onChange,
}: {
  rows: ApproachParticipantWrite[]
  contactOptions: MinorContact[]
  contactTypeOptions: LookupItem[]
  onChange: (rows: ApproachParticipantWrite[]) => void
}) {
  const add = () => onChange([...rows, { minor_contact_id: 0, contact_type_id: null }])
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
  const set = (i: number, patch: Partial<ApproachParticipantWrite>) =>
    onChange(rows.map((r, idx) => idx === i ? { ...r, ...patch } : r))

  return (
    <div>
      {rows.map((row, i) => (
        <Row key={i} className='mb-2 align-items-center'>
          <Col md='5'>
            <Input type='select' bsSize='sm' value={row.minor_contact_id || ''}
              onChange={(e) => set(i, { minor_contact_id: Number(e.target.value) })}>
              <option value=''>— Contatto —</option>
              {contactOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.last_name} {c.first_name}</option>
              ))}
            </Input>
          </Col>
          <Col md='5'>
            <Input type='select' bsSize='sm' value={row.contact_type_id ?? ''}
              onChange={(e) => set(i, { contact_type_id: Number(e.target.value) || null })}>
              <option value=''>— Ruolo (opzionale) —</option>
              {contactTypeOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Input>
          </Col>
          <Col md='2'>
            <Button size='sm' color='outline-danger' onClick={() => remove(i)}>
              <X size={12} />
            </Button>
          </Col>
        </Row>
      ))}
      <Button size='sm' color='outline-primary' className='d-flex align-items-center gap-1' onClick={add}>
        <Plus size={12} /> Aggiungi partecipante
      </Button>
    </div>
  )
}

// ─── Repeater partecipanti staff ──────────────────────────────────────────────
function StaffRepeater({
  rows, staffOptions, qualificationOptions, onChange,
}: {
  rows: ApproachStaffParticipantWrite[]
  staffOptions: StaffMember[]
  qualificationOptions: { code: string; name: string }[]
  onChange: (rows: ApproachStaffParticipantWrite[]) => void
}) {
  const add = () => onChange([...rows, { staff_member_id: 0, qualification_code: null }])
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
  const set = (i: number, patch: Partial<ApproachStaffParticipantWrite>) =>
    onChange(rows.map((r, idx) => idx === i ? { ...r, ...patch } : r))

  return (
    <div>
      {rows.map((row, i) => (
        <Row key={i} className='mb-2 align-items-center'>
          <Col md='5'>
            <Input type='select' bsSize='sm' value={row.staff_member_id || ''}
              onChange={(e) => set(i, { staff_member_id: Number(e.target.value) })}>
              <option value=''>— Operatore —</option>
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.last_name} {s.first_name}</option>
              ))}
            </Input>
          </Col>
          <Col md='5'>
            <Input type='select' bsSize='sm' value={row.qualification_code ?? ''}
              onChange={(e) => set(i, { qualification_code: e.target.value || null })}>
              <option value=''>— Ruolo prof. (opzionale) —</option>
              {qualificationOptions.map((q) => (
                <option key={q.code} value={q.code}>{q.name}</option>
              ))}
            </Input>
          </Col>
          <Col md='2'>
            <Button size='sm' color='outline-danger' onClick={() => remove(i)}>
              <X size={12} />
            </Button>
          </Col>
        </Row>
      ))}
      <Button size='sm' color='outline-primary' className='d-flex align-items-center gap-1' onClick={add}>
        <Plus size={12} /> Aggiungi professionista
      </Button>
    </div>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────
export default function AvvicinamentiMinoreTab({ minorId }: { minorId: number }) {
  const { hasPermission } = useAuth()
  const [items, setItems]                 = useState<Approach[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [approachTypes, setApproachTypes] = useState<ApproachType[]>([])
  const [minorContacts, setMinorContacts] = useState<MinorContact[]>([])
  const [facilityStaff, setFacilityStaff] = useState<StaffMember[]>([])
  const [contactTypes, setContactTypes]   = useState<LookupItem[]>([])
  const [staffQuals, setStaffQuals]       = useState<{ code: string; name: string }[]>([])

  const [minorDocs, setMinorDocs]         = useState<MinorDocument[]>([])
  const [docTypes, setDocTypes]           = useState<LookupItem[]>([])
  const [authMode, setAuthMode]           = useState<'existing' | 'upload' | 'manual'>('existing')
  const [uploadFile, setUploadFile]       = useState<File | null>(null)
  const [uploadDocTypeId, setUploadDocTypeId] = useState(0)
  const [uploadLabel, setUploadLabel]     = useState('')
  const [uploadingDoc, setUploadingDoc]   = useState(false)
  const [uploadedDocId, setUploadedDocId] = useState<number | null>(null)

  const [detailTarget, setDetailTarget]     = useState<Approach | null>(null)
  const [editTarget, setEditTarget]         = useState<Approach | null>(null)
  const [previewDocId, setPreviewDocId]     = useState<number | null>(null)
  const [previewDocName, setPreviewDocName] = useState('')
  const [form, setForm]                 = useState<ApproachWrite>({ ...EMPTY_FORM, minor_id: minorId })
  const [saving, setSaving]             = useState(false)
  const [formMsg, setFormMsg]           = useState<string | null>(null)
  const [createOpen, setCreateOpen]     = useState(false)

  const load = () => {
    setLoading(true); setError(null)
    approachApi.list({ minor_id: minorId })
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => {
        const ae = apiError(e)
        if (ae.status === 403) setError('Permessi insufficienti per visualizzare gli avvicinamenti.')
        else setError(ae.message ?? 'Errore caricamento')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    lookupsApi.approachTypes().then(setApproachTypes).catch(() => {})
    lookupsApi.contactTypes().then(setContactTypes).catch(() => {})
    lookupsApi.staffQualifications()
      .then((qs) => setStaffQuals(qs.map((q) => ({ code: q.code, name: q.name }))))
      .catch(() => {})
    minorApi.listContacts(minorId)
      .then(setMinorContacts).catch(() => {})
    minorApi.listDocuments(minorId)
      .then(setMinorDocs).catch(() => {})
    lookupsApi.documentTypes().then(setDocTypes).catch(() => {})
    // staff della struttura del minore
    minorApi.get(minorId)
      .then((m) => { if (m.facility_id) staffMemberApi.list({ facility_id: m.facility_id }).then(setFacilityStaff).catch(() => {}) })
      .catch(() => {})
  }, [minorId]) // eslint-disable-line

  const setF = (k: keyof ApproachWrite, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, minor_id: minorId })
    setAuthMode('existing'); setUploadFile(null); setUploadDocTypeId(0); setUploadLabel(''); setUploadedDocId(null)
    setFormMsg(null); setCreateOpen(true)
  }

  const openEdit = (item: Approach) => {
    setDetailTarget(null)
    setForm({
      minor_id: minorId,
      approach_type_id: item.approach_type_id,
      participants: item.participants?.map((p) => ({
        minor_contact_id: p.minor_contact_id,
        contact_type_id: p.contact_type_id ?? null,
      })) ?? (item.minor_contact_ids?.map((id) => ({ minor_contact_id: id, contact_type_id: null })) ?? []),
      staff_participants: item.staff_participants?.map((p) => ({
        staff_member_id: p.staff_member_id,
        qualification_code: p.qualification_code ?? null,
      })) ?? [],
      minor_contact_ids: item.minor_contact_ids ?? [],
      title: item.title,
      planned_start_at: item.planned_start_at?.slice(0, 16) ?? '',
      planned_end_at: item.planned_end_at?.slice(0, 16) ?? '',
      actual_start_at: item.actual_start_at?.slice(0, 16) ?? '',
      actual_end_at: item.actual_end_at?.slice(0, 16) ?? '',
      status: item.status,
      location: item.location ?? null,
      objective: item.objective ?? null,
      pre_reaction_level: item.pre_reaction_level ?? null,
      during_reaction_level: item.during_reaction_level ?? null,
      post_reaction_level: item.post_reaction_level ?? null,
      pre_reaction_notes: item.pre_reaction_notes ?? null,
      during_reaction_notes: item.during_reaction_notes ?? null,
      post_reaction_notes: item.post_reaction_notes ?? null,
      outcome_notes: item.outcome_notes ?? null,
      next_steps: item.next_steps ?? null,
      authorization_minor_document_id: item.authorization_minor_document_id ?? null,
      authorization_reference: item.authorization_reference ?? null,
      authorization_issued_at: item.authorization_issued_at?.slice(0, 10) ?? null,
      authorization_expires_at: item.authorization_expires_at?.slice(0, 10) ?? null,
      reserved_psychologist_notes: item.reserved_psychologist_notes ?? null,
      reserved_coordinator_notes: item.reserved_coordinator_notes ?? null,
    })
    setAuthMode(item.authorization_minor_document_id ? 'existing' : item.authorization_reference ? 'manual' : 'existing')
    setUploadFile(null); setUploadDocTypeId(0); setUploadLabel(''); setUploadedDocId(item.authorization_minor_document_id ?? null)
    setFormMsg(null); setEditTarget(item)
  }

  const handleSave = async () => {
    setFormMsg(null)
    if (!form.approach_type_id) { setFormMsg('Seleziona il tipo di avvicinamento.'); return }
    if (!form.title.trim())     { setFormMsg('Inserisci un titolo.'); return }
    if (!form.planned_start_at) { setFormMsg('Inserisci la data/ora pianificata.'); return }
    setSaving(true)
    try {
      const payload: ApproachWrite = {
        ...form,
        participants: (form.participants ?? []).filter((p) => p.minor_contact_id > 0),
        staff_participants: (form.staff_participants ?? []).filter((p) => p.staff_member_id > 0),
        minor_contact_id: form.participants?.[0]?.minor_contact_id ?? null,
      }
      if (editTarget) {
        await approachApi.update(editTarget.id, payload)
        toast.success('Avvicinamento aggiornato.')
        setEditTarget(null)
      } else {
        await approachApi.create(payload)
        toast.success('Avvicinamento registrato.')
        setCreateOpen(false)
      }
      load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setFormMsg('Non hai i permessi per questa operazione.')
      else setFormMsg(ae.message ?? 'Errore durante il salvataggio.')
    } finally { setSaving(false) }
  }

  // ── Form body ─────────────────────────────────────────────────────
  const FormBody = () => (
    <>
      {formMsg && <Alert color='warning'>{formMsg}</Alert>}

      {/* Dati generali */}
      <h6 className='fw-bold text-muted border-bottom pb-1 mb-3'>Dati generali</h6>
      <Row>
        <Col md='6'>
          <FormGroup>
            <Label>Tipo <span className='text-danger'>*</span></Label>
            <Input type='select' value={form.approach_type_id || ''}
              onChange={(e) => setF('approach_type_id', Number(e.target.value))}>
              <option value=''>— Seleziona —</option>
              {approachTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Input>
          </FormGroup>
        </Col>
        <Col md='6'>
          <FormGroup>
            <Label>Stato</Label>
            <Input type='select' value={form.status}
              onChange={(e) => setF('status', e.target.value)}>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Input>
          </FormGroup>
        </Col>
      </Row>
      <FormGroup>
        <Label>Titolo <span className='text-danger'>*</span></Label>
        <Input value={form.title} onChange={(e) => setF('title', e.target.value)} />
      </FormGroup>
      <FormGroup>
        <Label>Obiettivo</Label>
        <Input type='textarea' rows={2} value={form.objective ?? ''}
          onChange={(e) => setF('objective', e.target.value || null)} />
      </FormGroup>
      <Row>
        <Col md='4'>
          <FormGroup>
            <Label>Luogo</Label>
            <Input value={form.location ?? ''} onChange={(e) => setF('location', e.target.value || null)} />
          </FormGroup>
        </Col>
        <Col md='4'>
          <FormGroup>
            <Label>Inizio pianificato <span className='text-danger'>*</span></Label>
            <Input type='datetime-local' value={form.planned_start_at}
              onChange={(e) => setF('planned_start_at', e.target.value)} />
          </FormGroup>
        </Col>
        <Col md='4'>
          <FormGroup>
            <Label>Fine pianificata</Label>
            <Input type='datetime-local' value={form.planned_end_at ?? ''}
              onChange={(e) => setF('planned_end_at', e.target.value || null)} />
          </FormGroup>
        </Col>
      </Row>

      {/* Partecipanti familiari */}
      <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-3'>Partecipanti familiari</h6>
      <ParticipantsRepeater
        rows={form.participants ?? []}
        contactOptions={minorContacts}
        contactTypeOptions={contactTypes}
        onChange={(rows) => setF('participants', rows)}
      />

      {/* Partecipanti staff */}
      <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-3'>Professionisti presenti</h6>
      <StaffRepeater
        rows={form.staff_participants ?? []}
        staffOptions={facilityStaff}
        qualificationOptions={staffQuals}
        onChange={(rows) => setF('staff_participants', rows)}
      />

      {/* Provvedimento */}
      <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-3'>Provvedimento autorizzativo</h6>

      <div className='mb-3 d-flex' style={{ gap: 8 }}>
        {(['existing', 'upload', 'manual'] as const).map((mode) => {
          const labels = { existing: '📎 Documento esistente', upload: '⬆️ Carica nuovo', manual: '✏️ Inserimento manuale' }
          const isActive = authMode === mode
          return (
            <button key={mode} type='button'
              onClick={() => setAuthMode(mode)}
              style={{
                background: isActive ? '#7366ff' : '#f4f3ff',
                color: isActive ? '#fff' : '#7366ff',
                border: `1.5px solid ${isActive ? '#7366ff' : '#c9c4ff'}`,
                borderRadius: 8,
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                boxShadow: isActive ? '0 4px 12px rgba(115,102,255,0.3)' : 'none',
              }}>
              {labels[mode]}
            </button>
          )
        })}
      </div>

      {authMode === 'existing' && (
        <FormGroup>
          <Label>Documento del minore</Label>
          {minorDocs.length === 0
            ? <Alert color='warning' className='py-2 px-3 mb-0' style={{ fontSize: 13 }}>Nessun documento disponibile per questo minore. Carica un nuovo documento o usa l'inserimento manuale.</Alert>
            : (
              <Input type='select' value={form.authorization_minor_document_id ?? ''}
                onChange={(e) => setF('authorization_minor_document_id', Number(e.target.value) || null)}>
                <option value=''>— Nessun documento collegato —</option>
                {minorDocs.map((doc) => {
                  const label = doc.label ?? doc.attachment?.original_name?.replace(/\.[^.]+$/, '') ?? `Doc #${doc.id}`
                  const type = doc.document_type?.name ?? ''
                  return <option key={doc.id} value={doc.id}>{type ? `${type} — ${label}` : label}</option>
                })}
              </Input>
            )
          }
        </FormGroup>
      )}

      {authMode === 'upload' && (
        <>
          {uploadedDocId && (
            <Alert color='success' className='py-2 px-3 mb-2' style={{ fontSize: 13 }}>
              Documento caricato e collegato (ID {uploadedDocId}).
            </Alert>
          )}
          <Row>
            <Col md='4'>
              <FormGroup>
                <Label>Tipo documento <span className='text-danger'>*</span></Label>
                <Input type='select' bsSize='sm' value={uploadDocTypeId || ''}
                  onChange={(e) => setUploadDocTypeId(Number(e.target.value))}>
                  <option value=''>— Seleziona —</option>
                  {docTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Input>
              </FormGroup>
            </Col>
            <Col md='5'>
              <FormGroup>
                <Label>File</Label>
                <Input type='file' bsSize='sm'
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setUploadFile(file)
                    if (file) setUploadLabel(file.name.replace(/\.[^.]+$/, ''))
                  }} />
              </FormGroup>
            </Col>
            <Col md='3' className='d-flex align-items-end'>
              <FormGroup className='w-100'>
                <Button size='sm' color='primary' className='w-100'
                  disabled={uploadingDoc || !uploadFile || !uploadDocTypeId}
                  onClick={async () => {
                    if (!uploadFile || !uploadDocTypeId) return
                    setUploadingDoc(true)
                    try {
                      const fd = new FormData()
                      fd.append('file', uploadFile)
                      fd.append('document_type_id', String(uploadDocTypeId))
                      if (uploadLabel) fd.append('label', uploadLabel)
                      const doc = await minorApi.uploadDocument(minorId, fd)
                      setUploadedDocId(doc.id)
                      setF('authorization_minor_document_id', doc.id)
                      minorApi.listDocuments(minorId).then(setMinorDocs).catch(() => {})
                      toast.success('Documento caricato e collegato all\'avvicinamento.')
                    } catch (e) {
                      const ae = apiError(e)
                      setFormMsg(ae.message ?? 'Errore upload documento.')
                    } finally { setUploadingDoc(false) }
                  }}>
                  {uploadingDoc ? 'Caricamento…' : 'Carica e collega'}
                </Button>
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label>Nome documento <small className='text-muted'>(pre-compilato dal nome file)</small></Label>
            <Input bsSize='sm' value={uploadLabel}
              onChange={(e) => setUploadLabel(e.target.value)}
              placeholder='Es. Decreto autorizzativo 2026' />
          </FormGroup>
        </>
      )}

      {authMode === 'manual' && (
        <Row>
          <Col md='5'>
            <FormGroup>
              <Label>Riferimento</Label>
              <Input value={form.authorization_reference ?? ''}
                onChange={(e) => setF('authorization_reference', e.target.value || null)}
                placeholder='Es. Decreto n. 123/2026' />
            </FormGroup>
          </Col>
          <Col md='3'>
            <FormGroup>
              <Label>Data emissione</Label>
              <Input type='date' value={form.authorization_issued_at ?? ''}
                onChange={(e) => setF('authorization_issued_at', e.target.value || null)} />
            </FormGroup>
          </Col>
          <Col md='4'>
            <FormGroup>
              <Label>Data scadenza</Label>
              <Input type='date' value={form.authorization_expires_at ?? ''}
                onChange={(e) => setF('authorization_expires_at', e.target.value || null)} />
            </FormGroup>
          </Col>
        </Row>
      )}

      {/* Valutazione */}
      <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-3'>Valutazione qualitativa</h6>
      {(['pre', 'during', 'post'] as const).map((phase) => {
        const label = phase === 'pre' ? 'Prima' : phase === 'during' ? 'Durante' : 'Dopo'
        const lk = `${phase}_reaction_level` as keyof ApproachWrite
        const nk = `${phase}_reaction_notes` as keyof ApproachWrite
        return (
          <Row key={phase} className='mb-2'>
            <Col md='4'>
              <FormGroup className='mb-0'>
                <Label className='small'>{label}</Label>
                <Input type='select' bsSize='sm' value={(form[lk] as string) ?? ''}
                  onChange={(e) => setF(lk, e.target.value || null)}>
                  <option value=''>Non rilevata</option>
                  {REACTION_OPTIONS.map((r) => <option key={r} value={r}>{REACTION_LABEL[r]}</option>)}
                </Input>
              </FormGroup>
            </Col>
            <Col md='8'>
              <FormGroup className='mb-0'>
                <Label className='small'>Note {label.toLowerCase()}</Label>
                <Input bsSize='sm' value={(form[nk] as string) ?? ''}
                  onChange={(e) => setF(nk, e.target.value || null)} />
              </FormGroup>
            </Col>
          </Row>
        )
      })}
      <Row className='mt-2'>
        <Col md='6'>
          <FormGroup>
            <Label>Note esito</Label>
            <Input type='textarea' rows={2} value={form.outcome_notes ?? ''}
              onChange={(e) => setF('outcome_notes', e.target.value || null)} />
          </FormGroup>
        </Col>
        <Col md='6'>
          <FormGroup>
            <Label>Prossimi passi</Label>
            <Input type='textarea' rows={2} value={form.next_steps ?? ''}
              onChange={(e) => setF('next_steps', e.target.value || null)} />
          </FormGroup>
        </Col>
      </Row>
    </>
  )

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div>
      <div className='d-flex justify-content-end mb-3'>
        <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
          <Plus size={13} /> Nuovo avvicinamento
        </Button>
      </div>

      {loading && <div className='text-center py-3'><span className='spinner-border spinner-border-sm' /></div>}
      {error && <Alert color='warning'>{error}</Alert>}
      {!loading && !error && items.length === 0 && (
        <p className='text-muted py-2'>Nessun avvicinamento registrato per questo minore.</p>
      )}
      {!loading && !error && items.length > 0 && (
        <div className='table-responsive'>
          <table className='table table-hover table-sm'>
            <thead className='table-light'>
              <tr>
                <th>Data/ora</th><th>Tipo</th><th>Titolo</th>
                <th>Partecipanti</th><th>Stato</th><th>Autorizzazione</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const contacts: DisplayApproachContact[] = item.participants?.length
                  ? item.participants
                  : (item.minor_contacts ?? (item.minor_contact ? [item.minor_contact] : []))
                const first = contacts[0]
                const firstName = first
                  ? extractDisplayContactName(first)
                  : null
                const rest = contacts.length - 1
                return (
                  <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setDetailTarget(item)}>
                    <td className='small'>{fmtDt(item.planned_start_at)}</td>
                    <td className='small'>{item.approach_type?.name ?? '—'}</td>
                    <td className='small'>{item.title}</td>
                    <td className='small'>
                      {firstName
                        ? <>{firstName}{rest > 0 && <span className='badge badge-light-secondary ms-1'>+{rest}</span>}</>
                        : <span className='text-muted'>—</span>}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[item.status] ?? 'badge-light-secondary'}`}>
                        {STATUS_LABEL[item.status] ?? item.status}
                      </span>
                    </td>
                    <td>
                      {item.authorization_status
                        ? <span className={`badge ${AUTH_BADGE[item.authorization_status]}`}>{AUTH_LABEL[item.authorization_status]}</span>
                        : <span className='text-muted'>—</span>}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className='d-flex gap-1'>
                        <Button size='sm' color='outline-secondary' onClick={() => setDetailTarget(item)}><Eye size={12} /></Button>
                        <Button size='sm' color='outline-primary' onClick={() => openEdit(item)}><Edit2 size={12} /></Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal Crea ─────────────────────────────────────────────── */}
      <Modal isOpen={createOpen} toggle={() => setCreateOpen(false)} size='xl' centered scrollable>
        <ModalHeader toggle={() => setCreateOpen(false)}>Nuovo avvicinamento</ModalHeader>
        <ModalBody>{FormBody()}</ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='secondary' className='d-flex align-items-center gap-1' onClick={() => setCreateOpen(false)}><X size={13} /> Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal Modifica ──────────────────────────────────────────── */}
      <Modal isOpen={!!editTarget} toggle={() => setEditTarget(null)} size='xl' centered scrollable>
        <ModalHeader toggle={() => setEditTarget(null)}>Modifica avvicinamento</ModalHeader>
        <ModalBody>{FormBody()}</ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='secondary' className='d-flex align-items-center gap-1' onClick={() => setEditTarget(null)}><X size={13} /> Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal Dettaglio ─────────────────────────────────────────── */}
      {detailTarget && (
        <Modal isOpen={!!detailTarget} toggle={() => setDetailTarget(null)} size='lg' centered scrollable>
          <ModalHeader toggle={() => setDetailTarget(null)}>
            Avvicinamento — {detailTarget.approach_type?.name ?? 'Dettaglio'}
          </ModalHeader>
          <ModalBody>
            {/* Dati generali */}
            <Row className='mb-2'>
              <Col md='6'>
                <small className='text-muted d-block'>Tipo</small>
                <span>{detailTarget.approach_type?.name ?? '—'}</span>
              </Col>
              <Col md='6'>
                <small className='text-muted d-block'>Stato</small>
                <span className={`badge ${STATUS_BADGE[detailTarget.status]}`}>{STATUS_LABEL[detailTarget.status]}</span>
              </Col>
            </Row>
            <div className='mb-2'>
              <small className='text-muted d-block'>Titolo</small>
              <strong>{detailTarget.title}</strong>
            </div>
            {detailTarget.objective && (
              <div className='mb-2'>
                <small className='text-muted d-block'>Obiettivo</small>
                <span>{detailTarget.objective}</span>
              </div>
            )}
            <Row className='mb-3'>
              <Col md='4'>
                <small className='text-muted d-block'>Luogo</small>
                <span>{detailTarget.location ?? '—'}</span>
              </Col>
              <Col md='4'>
                <small className='text-muted d-block'>Inizio pianificato</small>
                <span>{fmtDt(detailTarget.planned_start_at)}</span>
              </Col>
              <Col md='4'>
                <small className='text-muted d-block'>Fine pianificata</small>
                <span>{fmtDt(detailTarget.planned_end_at)}</span>
              </Col>
            </Row>

            {/* Partecipanti familiari */}
            <div className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
              <strong style={{ color: '#333' }}>Partecipanti familiari / tutori</strong>
              {(() => {
                const contacts = normalizeApproachContacts(detailTarget)
                if (contacts.length === 0) {
                  return <p className='mb-0 mt-1 small' style={{ color: '#555' }}>Nessun partecipante familiare registrato.</p>
                }
                return (
                  <ul className='mb-0 mt-2 ps-3' style={{ fontSize: 14 }}>
                    {contacts.map((p, i) => {
                      const name = extractDisplayContactName(p)
                      const typeName = 'contact_type' in p ? p.contact_type?.name : null
                      return (
                        <li key={i} style={{ color: '#333', marginBottom: 4 }}>
                          {name}
                          {typeName && <Badge color='secondary' pill className='ms-2' style={{ fontSize: 11, fontWeight: 400 }}>{typeName}</Badge>}
                        </li>
                      )
                    })}
                  </ul>
                )
              })()}
            </div>

            {/* Partecipanti professionali */}
            <div className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
              <strong style={{ color: '#333' }}>Professionisti presenti</strong>
              {(!detailTarget.staff_participants || detailTarget.staff_participants.length === 0)
                ? <p className='mb-0 mt-1 small' style={{ color: '#555' }}>Nessun professionista registrato.</p>
                : (
                  <ul className='mb-0 mt-2 ps-3' style={{ fontSize: 14 }}>
                    {detailTarget.staff_participants.map((p, i) => {
                      const name = p.staff_member
                        ? (p.staff_member.display_name ?? `${p.staff_member.last_name} ${p.staff_member.first_name}`)
                        : `#${p.staff_member_id}`
                      const qual = p.qualification?.name ?? p.qualification_code
                      return (
                        <li key={i} style={{ color: '#333', marginBottom: 4 }}>
                          {name}
                          {qual && <Badge color='secondary' pill className='ms-2' style={{ fontSize: 11, fontWeight: 400 }}>{qual}</Badge>}
                        </li>
                      )
                    })}
                  </ul>
                )
              }
            </div>

            {/* Provvedimento */}
            {(detailTarget.authorization_reference || detailTarget.authorization_status || detailTarget.authorization_minor_document_id) && (
              <div className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
                <strong style={{ color: '#333' }}>Provvedimento autorizzativo</strong>
                {detailTarget.authorization_status && (
                  <span className={`badge ms-2 ${AUTH_BADGE[detailTarget.authorization_status]}`}>
                    {AUTH_LABEL[detailTarget.authorization_status]}
                  </span>
                )}
                <div className='mt-1 small' style={{ color: '#444' }}>
                  {detailTarget.authorization_reference && <div>Rif.: {detailTarget.authorization_reference}</div>}
                  {detailTarget.authorization_issued_at && <div>Emesso il: {fmtDate(detailTarget.authorization_issued_at)}</div>}
                  {detailTarget.authorization_expires_at && <div>Scade il: {fmtDate(detailTarget.authorization_expires_at)}</div>}
                  {detailTarget.authorization_minor_document_id && (() => {
                    const doc = detailTarget.authorization_minor_document
                    const docFromList = minorDocs.find((d) => d.id === detailTarget.authorization_minor_document_id)
                    const fileName =
                      doc?.original_name ??
                      docFromList?.label ??
                      docFromList?.attachment?.original_name ??
                      `documento-${detailTarget.authorization_minor_document_id}`
                    const docId = detailTarget.authorization_minor_document_id
                    return (
                      <div className='mt-2'>
                        <button
                          type='button'
                          className='btn btn-link p-0 text-start d-flex align-items-center gap-1'
                          style={{ fontSize: 13 }}
                          onClick={() => { setPreviewDocId(docId); setPreviewDocName(fileName) }}
                        >
                          📎 {fileName}
                        </button>
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Valutazione */}
            {(detailTarget.pre_reaction_level || detailTarget.during_reaction_level || detailTarget.post_reaction_level) && (
              <div className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
                <strong style={{ color: '#333' }}>Valutazione qualitativa</strong>
                <div className='mt-1 small' style={{ color: '#444' }}>
                  {detailTarget.pre_reaction_level && <div>Prima: <strong>{REACTION_LABEL[detailTarget.pre_reaction_level]}</strong>{detailTarget.pre_reaction_notes && ` — ${detailTarget.pre_reaction_notes}`}</div>}
                  {detailTarget.during_reaction_level && <div>Durante: <strong>{REACTION_LABEL[detailTarget.during_reaction_level]}</strong>{detailTarget.during_reaction_notes && ` — ${detailTarget.during_reaction_notes}`}</div>}
                  {detailTarget.post_reaction_level && <div>Dopo: <strong>{REACTION_LABEL[detailTarget.post_reaction_level]}</strong>{detailTarget.post_reaction_notes && ` — ${detailTarget.post_reaction_notes}`}</div>}
                </div>
              </div>
            )}

            {/* Note esito / prossimi passi */}
            {(detailTarget.outcome_notes || detailTarget.next_steps) && (
              <Row className='mt-2'>
                {detailTarget.outcome_notes && (
                  <Col md='6'>
                    <small className='text-muted d-block'>Note esito</small>
                    <p className='mb-1'>{detailTarget.outcome_notes}</p>
                  </Col>
                )}
                {detailTarget.next_steps && (
                  <Col md='6'>
                    <small className='text-muted d-block'>Prossimi passi</small>
                    <p className='mb-1'>{detailTarget.next_steps}</p>
                  </Col>
                )}
              </Row>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color='primary' size='sm' onClick={() => openEdit(detailTarget)}>Modifica</Button>
            <Button color='secondary' size='sm' onClick={() => setDetailTarget(null)}>Chiudi</Button>
          </ModalFooter>
        </Modal>
      )}

      {/* ── Anteprima documento ──────────────────────────────────────── */}
      {previewDocId !== null && (
        <DocPreviewModal
          isOpen={previewDocId !== null}
          onClose={() => { setPreviewDocId(null); setPreviewDocName('') }}
          fileName={previewDocName}
          mimeType={minorDocs.find((d) => d.id === previewDocId)?.attachment?.mime_type ?? ''}
          fetchBlob={async () => minorApi.previewDocument(minorId, previewDocId)}
          fetchSpreadsheetPreview={async () => minorApi.previewDocumentStructured(minorId, previewDocId)}
          canDownload={hasPermission('attachments.download')}
        />
      )}
    </div>
  )
}
