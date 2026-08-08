import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Card, CardHeader, CardBody, Button, Row, Col, Input, FormGroup, Label,
  Modal, ModalHeader, ModalBody, ModalFooter, Alert, Badge,
} from 'reactstrap'
import { Plus, Edit2, Eye, X, Trash2, Info } from 'react-feather'
import { toast } from 'react-toastify'
import {
  approachApi, lookupsApi, staffMemberApi, facilityApi, minorApi, apiError,
} from '../../services/api'
import type {
  Approach, ApproachWrite, ApproachType, ApproachParticipantWrite,
  ApproachStaffParticipantWrite, Facility, Minor, LookupItem, StaffMember,
  ReactionLevel,
} from '../../types'
import InfoDrawer from '../../components/common/InfoDrawer'

// ─── helpers ────────────────────────────────────────────────────────────────

function toInputDt(s?: string | null) { return s ? s.slice(0, 16) : '' }
function toInputDate(s?: string | null) { return s ? s.slice(0, 10) : '' }
function fmtDt(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}
function fmtDate(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('it-IT')
}

const STATUS_LABEL: Record<string, string> = {
  planned: 'Pianificato', in_progress: 'In corso', completed: 'Completato',
  cancelled: 'Annullato', suspended: 'Sospeso',
}
const STATUS_BADGE: Record<string, string> = {
  planned: 'badge-light-primary', in_progress: 'badge-light-warning',
  completed: 'badge-light-success', cancelled: 'badge-light-secondary',
  suspended: 'badge-light-danger',
}
const AUTH_BADGE: Record<string, string> = {
  active: 'badge-light-success', expiring: 'badge-light-warning', expired: 'badge-light-danger',
}
const AUTH_LABEL: Record<string, string> = {
  active: 'Attivo', expiring: 'In scadenza', expired: 'Scaduto',
}
const REACTION_LABEL: Record<string, string> = {
  very_negative: 'Molto negativa', negative: 'Negativa', neutral: 'Neutra',
  positive: 'Positiva', very_positive: 'Molto positiva',
}

// ─── Tipi form interni ────────────────────────────────────────────────────────

const EMPTY_FORM: ApproachWrite = {
  minor_id: 0, approach_type_id: 0,
  participants: [], staff_participants: [],
  minor_contact_ids: [], minor_contact_id: null,
  supervising_staff_member_id: null,
  title: '', objective: null, location: null,
  planned_start_at: '', planned_end_at: null,
  actual_start_at: null, actual_end_at: null,
  status: 'planned', outcome_notes: null, next_steps: null,
  authorization_minor_document_id: null,
  authorization_reference: null, authorization_issued_at: null,
  authorization_expires_at: null, authorization_renewal_alert_days: null,
  pre_reaction_level: null, pre_reaction_notes: null,
  during_reaction_level: null, during_reaction_notes: null,
  post_reaction_level: null, post_reaction_notes: null,
  reserved_psychologist_notes: null, reserved_coordinator_notes: null,
  suspension_reason: null, suspended_at: null, suspension_signed_at: null,
}

// ─── Render compatto partecipanti ────────────────────────────────────────────

function renderParticipants(item: Approach): string {
  if (item.participants && item.participants.length > 0) {
    return item.participants.map((p) => {
      const name = p.contact ? `${p.contact.last_name} ${p.contact.first_name}` : `#${p.minor_contact_id}`
      const role = p.contact_type?.name ?? ''
      return role ? `${name} (${role})` : name
    }).join(', ')
  }
  if (item.minor_contacts && item.minor_contacts.length > 0) {
    return item.minor_contacts.map((c) => `${c.last_name} ${c.first_name}`).join(', ')
  }
  if (item.minor_contact) {
    return `${item.minor_contact.last_name} ${item.minor_contact.first_name}`
  }
  return '—'
}

function renderStaffParticipants(item: Approach): string {
  if (!item.staff_participants || item.staff_participants.length === 0) return '—'
  return item.staff_participants.map((p) => {
    const name = p.staff_member
      ? (p.staff_member.display_name ?? `${p.staff_member.last_name} ${p.staff_member.first_name}`)
      : `#${p.staff_member_id}`
    const role = p.qualification?.name ?? p.qualification_code ?? ''
    return role ? `${name} (${role})` : name
  }).join(', ')
}

// ─── ParticipantsRepeater ────────────────────────────────────────────────────

function ParticipantsRepeater({
  rows, contactOptions, contactTypeOptions, onChange,
}: {
  rows: ApproachParticipantWrite[]
  contactOptions: { id: number; first_name: string; last_name: string }[]
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
              <Trash2 size={12} />
            </Button>
          </Col>
        </Row>
      ))}
      <Button size='sm' color='outline-primary' className='d-flex align-items-center gap-1' onClick={add}>
        <Plus size={12} /> Aggiungi partecipante familiare
      </Button>
    </div>
  )
}

// ─── StaffParticipantsRepeater ───────────────────────────────────────────────

function StaffParticipantsRepeater({
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
              <option value=''>— Ruolo professionale (opzionale) —</option>
              {qualificationOptions.map((q) => (
                <option key={q.code} value={q.code}>{q.name}</option>
              ))}
            </Input>
          </Col>
          <Col md='2'>
            <Button size='sm' color='outline-danger' onClick={() => remove(i)}>
              <Trash2 size={12} />
            </Button>
          </Col>
        </Row>
      ))}
      <Button size='sm' color='outline-primary' className='d-flex align-items-center gap-1' onClick={add}>
        <Plus size={12} /> Aggiungi professionista presente
      </Button>
    </div>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function AvvicinamentiPage() {
  const [infoOpen, setInfoOpen]       = useState(false)
  const [items, setItems]             = useState<Approach[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  // Lookup options
  const [facilities, setFacilities]             = useState<Facility[]>([])
  const [minors, setMinors]                     = useState<Minor[]>([])
  const [approachTypes, setApproachTypes]       = useState<ApproachType[]>([])
  const [contactTypes, setContactTypes]         = useState<LookupItem[]>([])
  const [staffQualifications, setStaffQualifications] = useState<{ code: string; name: string }[]>([])
  const [minorContacts, setMinorContacts]       = useState<{ id: number; first_name: string; last_name: string }[]>([])
  const [facilityStaff, setFacilityStaff]       = useState<StaffMember[]>([])
  const [loadingOptions, setLoadingOptions]     = useState(false)
  const [minorDocuments, setMinorDocuments]     = useState<import('../../types').MinorDocument[]>([])
  const [docTypes, setDocTypes]                 = useState<import('../../types').LookupItem[]>([])
  const [authMode, setAuthMode]                 = useState<'existing' | 'upload' | 'manual'>('existing')
  const [uploadFile, setUploadFile]             = useState<File | null>(null)
  const [uploadDocTypeId, setUploadDocTypeId]   = useState(0)
  const [uploadLabel, setUploadLabel]           = useState('')
  const [uploadingDoc, setUploadingDoc]         = useState(false)
  const [uploadedDocId, setUploadedDocId]       = useState<number | null>(null)

  // Filtri
  const [filterFacilityId, setFilterFacilityId] = useState(0)
  const [filterMinorId, setFilterMinorId]       = useState(0)
  const [filterStatus, setFilterStatus]         = useState('')
  const [filterTypeId, setFilterTypeId]         = useState(0)
  const [filterDateFrom, setFilterDateFrom]     = useState('')
  const [filterDateTo, setFilterDateTo]         = useState('')
  const [limit, setLimit]                       = useState(50)

  // CRUD
  const [modalOpen, setModalOpen]       = useState(false)
  const [editTarget, setEditTarget]     = useState<Approach | null>(null)
  const [detailTarget, setDetailTarget] = useState<Approach | null>(null)
  const [form, setForm]                 = useState<ApproachWrite>({ ...EMPTY_FORM })
  const [saving, setSaving]             = useState(false)
  const [formMsg, setFormMsg]           = useState<string | null>(null)

  // ── Caricamento dati ────────────────────────────────────────────
  const load = () => {
    setLoading(true); setError(null)
    const params: Record<string, number | string | undefined> = {}
    if (filterFacilityId) params.facility_id = filterFacilityId
    if (filterMinorId) params.minor_id = filterMinorId
    if (filterStatus) params.status = filterStatus
    if (filterTypeId) params.approach_type_id = filterTypeId
    approachApi.list(params)
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    facilityApi.list().then(setFacilities).catch(() => {})
    minorApi.list().then((d) => setMinors(Array.isArray(d) ? d : [])).catch(() => {})
    lookupsApi.approachTypes().then(setApproachTypes).catch(() => {})
    lookupsApi.contactTypes().then(setContactTypes).catch(() => {})
    lookupsApi.staffQualifications().then((qs) =>
      setStaffQualifications(qs.map((q) => ({ code: q.code, name: q.name })))
    ).catch(() => {})
    lookupsApi.documentTypes().then(setDocTypes).catch(() => {})
  }, []) // eslint-disable-line

  // Carica contatti minore e staff struttura quando cambiano nel form
  useEffect(() => {
    if (!form.minor_id) { setMinorContacts([]); setMinorDocuments([]); return }
    setLoadingOptions(true)
    Promise.all([
      minorApi.listContacts(form.minor_id).then((cs) => setMinorContacts(cs.map((c) => ({ id: c.id, first_name: c.first_name, last_name: c.last_name })))).catch(() => setMinorContacts([])),
      minorApi.listDocuments(form.minor_id).then(setMinorDocuments).catch(() => setMinorDocuments([])),
    ]).finally(() => setLoadingOptions(false))
  }, [form.minor_id])

  useEffect(() => {
    const minor = minors.find((m) => m.id === form.minor_id)
    if (!minor?.facility_id) { setFacilityStaff([]); return }
    staffMemberApi.list({ facility_id: minor.facility_id })
      .then(setFacilityStaff).catch(() => setFacilityStaff([]))
  }, [form.minor_id, minors])

  const displayItems = useMemo(() => {
    let r = [...items]
    if (filterDateFrom) r = r.filter((x) => x.planned_start_at >= filterDateFrom)
    if (filterDateTo)   r = r.filter((x) => x.planned_start_at <= filterDateTo + 'T23:59:59')
    r.sort((a, b) => b.planned_start_at.localeCompare(a.planned_start_at))
    return r.slice(0, limit)
  }, [items, filterDateFrom, filterDateTo, limit])

  // ── CRUD helpers ─────────────────────────────────────────────────
  const setF = (k: keyof ApproachWrite, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const openCreate = () => {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM })
    setMinorContacts([]); setFacilityStaff([]); setMinorDocuments([])
    setAuthMode('existing'); setUploadFile(null); setUploadDocTypeId(0); setUploadLabel(''); setUploadedDocId(null)
    setFormMsg(null); setModalOpen(true)
  }

  const openEdit = (item: Approach) => {
    setDetailTarget(null); setEditTarget(item)
    setForm({
      minor_id: item.minor_id,
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
      minor_contact_id: item.minor_contact_id ?? null,
      supervising_staff_member_id: item.supervising_staff_member_id ?? null,
      title: item.title,
      objective: item.objective ?? null,
      location: item.location ?? null,
      planned_start_at: toInputDt(item.planned_start_at),
      planned_end_at: toInputDt(item.planned_end_at),
      actual_start_at: toInputDt(item.actual_start_at),
      actual_end_at: toInputDt(item.actual_end_at),
      status: item.status,
      outcome_notes: item.outcome_notes ?? null,
      next_steps: item.next_steps ?? null,
      authorization_minor_document_id: item.authorization_minor_document_id ?? null,
      authorization_reference: item.authorization_reference ?? null,
      authorization_issued_at: toInputDate(item.authorization_issued_at),
      authorization_expires_at: toInputDate(item.authorization_expires_at),
      authorization_renewal_alert_days: item.authorization_renewal_alert_days ?? null,
      pre_reaction_level: item.pre_reaction_level ?? null,
      pre_reaction_notes: item.pre_reaction_notes ?? null,
      during_reaction_level: item.during_reaction_level ?? null,
      during_reaction_notes: item.during_reaction_notes ?? null,
      post_reaction_level: item.post_reaction_level ?? null,
      post_reaction_notes: item.post_reaction_notes ?? null,
      reserved_psychologist_notes: item.reserved_psychologist_notes ?? null,
      reserved_coordinator_notes: item.reserved_coordinator_notes ?? null,
      suspension_reason: item.suspension_reason ?? null,
      suspended_at: toInputDt(item.suspended_at),
      suspension_signed_at: toInputDt(item.suspension_signed_at),
    })
    // Detect auth mode
    setAuthMode(item.authorization_minor_document_id ? 'existing' : item.authorization_reference ? 'manual' : 'existing')
    setUploadFile(null); setUploadDocTypeId(0); setUploadLabel(''); setUploadedDocId(item.authorization_minor_document_id ?? null)
    setFormMsg(null); setModalOpen(true)
  }

  const handleSave = async () => {
    setFormMsg(null)
    if (!form.minor_id)         { setFormMsg('Seleziona il minore.'); return }
    if (!form.approach_type_id) { setFormMsg('Seleziona la tipologia contatto.'); return }
    if (!form.title.trim())     { setFormMsg('Inserisci un titolo.'); return }
    if (!form.planned_start_at) { setFormMsg('Inserisci la data/ora pianificata.'); return }
    setSaving(true)
    try {
      const payload: ApproachWrite = {
        ...form,
        participants: (form.participants ?? []).filter((p) => p.minor_contact_id > 0),
        staff_participants: (form.staff_participants ?? []).filter((p) => p.staff_member_id > 0),
        // Retrocompatibilità: primo contatto come minor_contact_id
        minor_contact_id: form.participants?.[0]?.minor_contact_id ?? form.minor_contact_id ?? null,
        supervising_staff_member_id: form.staff_participants?.[0]?.staff_member_id ?? form.supervising_staff_member_id ?? null,
        objective: form.objective || null,
        location: form.location || null,
        planned_end_at: form.planned_end_at || null,
        actual_start_at: form.actual_start_at || null,
        actual_end_at: form.actual_end_at || null,
        outcome_notes: form.outcome_notes || null,
        next_steps: form.next_steps || null,
        authorization_minor_document_id: form.authorization_minor_document_id || null,
        authorization_reference: form.authorization_reference || null,
        authorization_issued_at: form.authorization_issued_at || null,
        authorization_expires_at: form.authorization_expires_at || null,
        suspension_reason: form.suspension_reason || null,
        suspended_at: form.suspended_at || null,
        suspension_signed_at: form.suspension_signed_at || null,
      }
      if (editTarget) {
        await approachApi.update(editTarget.id, payload)
        toast.success('Avvicinamento aggiornato.')
      } else {
        await approachApi.create(payload)
        toast.success('Avvicinamento registrato.')
      }
      setModalOpen(false); setEditTarget(null); load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setFormMsg('Non hai i permessi per questa operazione.')
      else setFormMsg(ae.message ?? 'Errore durante il salvataggio.')
    } finally { setSaving(false) }
  }

  return (
    <div className='container-fluid'>
      <div className='page-title'>
        <div className='row'>
          <div className='col-sm-6'><h3>Avvicinamenti</h3></div>
          <div className='col-sm-6'>
            <ol className='breadcrumb'>
              <li className='breadcrumb-item'><Link to='/dashboard'>Home</Link></li>
              <li className='breadcrumb-item active'>Avvicinamenti</li>
            </ol>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className='d-flex justify-content-between align-items-center flex-wrap gap-2'>
          <div className='d-flex gap-2 flex-wrap'>
            <Input type='select' bsSize='sm' style={{ width: 160 }} value={filterFacilityId}
              onChange={(e) => setFilterFacilityId(Number(e.target.value))}>
              <option value={0}>Tutte le strutture</option>
              {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Input>
            <Input type='select' bsSize='sm' style={{ width: 160 }} value={filterMinorId}
              onChange={(e) => setFilterMinorId(Number(e.target.value))}>
              <option value={0}>Tutti i minori</option>
              {minors.map((m) => <option key={m.id} value={m.id}>{m.last_name} {m.first_name}</option>)}
            </Input>
            <Input type='select' bsSize='sm' style={{ width: 140 }} value={filterTypeId}
              onChange={(e) => setFilterTypeId(Number(e.target.value))}>
              <option value={0}>Tutte le tipologie</option>
              {approachTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Input>
            <Input type='select' bsSize='sm' style={{ width: 130 }} value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}>
              <option value=''>Tutti gli stati</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Input>
            <Input type='date' bsSize='sm' style={{ width: 140 }} value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)} placeholder='Dal' />
            <Input type='date' bsSize='sm' style={{ width: 140 }} value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)} placeholder='Al' />
            <Input type='select' bsSize='sm' style={{ width: 90 }} value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}>
              {[25, 50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}
            </Input>
            <Button size='sm' color='outline-secondary' onClick={load}>Aggiorna</Button>
          </div>
          <div className='d-flex gap-2'>
            <Button size='sm' color='outline-info' onClick={() => setInfoOpen(true)}>
              <Info size={13} />
            </Button>
            <Button size='sm' color='primary' className='d-flex align-items-center gap-1' onClick={openCreate}>
              <Plus size={13} /> Nuovo avvicinamento
            </Button>
          </div>
        </CardHeader>
        <CardBody className='p-0'>
          {loading && <div className='text-center py-4'><span className='spinner-border spinner-border-sm' /></div>}
          {error && <Alert color='warning' className='m-3'>{error}</Alert>}
          {!loading && !error && (
            <div className='table-responsive'>
              <table className='table table-hover table-sm mb-0'>
                <thead className='table-light'>
                  <tr>
                    <th>Minore</th>
                    <th>Tipologia</th>
                    <th>Titolo</th>
                    <th>Partecipanti familiari</th>
                    <th>Professionisti presenti</th>
                    <th>Data pianificata</th>
                    <th>Stato</th>
                    <th>Provvedimento</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.length === 0 && (
                    <tr><td colSpan={9} className='text-center text-muted py-4'>
                      Nessun avvicinamento per i filtri selezionati.
                    </td></tr>
                  )}
                  {displayItems.map((item) => (
                    <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setDetailTarget(item)}>
                      <td className='small'>
                        <div className='fw-semibold'>{item.minor?.last_name} {item.minor?.first_name}</div>
                        <small className='text-muted'>{item.minor?.internal_code}</small>
                      </td>
                      <td className='small'>{item.approach_type?.name ?? '—'}</td>
                      <td className='small'>{item.title}</td>
                      <td className='small text-muted'>{renderParticipants(item)}</td>
                      <td className='small text-muted'>{renderStaffParticipants(item)}</td>
                      <td className='small'>{fmtDt(item.planned_start_at)}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Modal form ──────────────────────────────────────────────────── */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size='xl' centered scrollable>
        <ModalHeader toggle={() => setModalOpen(false)}>
          {editTarget ? 'Modifica avvicinamento' : 'Nuovo avvicinamento'}
        </ModalHeader>
        <ModalBody>
          {formMsg && <Alert color='warning'>{formMsg}</Alert>}

          {/* A — Dati generali */}
          <h6 className='fw-bold text-muted border-bottom pb-1 mb-3'>A. Dati generali</h6>
          <Row>
            <Col md='4'>
              <FormGroup>
                <Label>Minore <span className='text-danger'>*</span></Label>
                <Input type='select' value={form.minor_id || ''}
                  onChange={(e) => setF('minor_id', Number(e.target.value))}>
                  <option value=''>— Seleziona minore —</option>
                  {minors.map((m) => <option key={m.id} value={m.id}>{m.last_name} {m.first_name} ({m.internal_code})</option>)}
                </Input>
              </FormGroup>
            </Col>
            <Col md='4'>
              <FormGroup>
                <Label>Tipologia contatto <span className='text-danger'>*</span></Label>
                <Input type='select' value={form.approach_type_id || ''}
                  onChange={(e) => setF('approach_type_id', Number(e.target.value))}>
                  <option value=''>— Seleziona —</option>
                  {approachTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Input>
              </FormGroup>
            </Col>
            <Col md='4'>
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
            <Input type='textarea' rows={2} value={form.objective ?? ''} onChange={(e) => setF('objective', e.target.value || null)} />
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
                <Input type='datetime-local' value={form.planned_start_at} onChange={(e) => setF('planned_start_at', e.target.value)} />
              </FormGroup>
            </Col>
            <Col md='4'>
              <FormGroup>
                <Label>Fine pianificata</Label>
                <Input type='datetime-local' value={form.planned_end_at ?? ''} onChange={(e) => setF('planned_end_at', e.target.value || null)} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md='4'>
              <FormGroup>
                <Label>Inizio effettivo</Label>
                <Input type='datetime-local' value={form.actual_start_at ?? ''} onChange={(e) => setF('actual_start_at', e.target.value || null)} />
              </FormGroup>
            </Col>
            <Col md='4'>
              <FormGroup>
                <Label>Fine effettiva</Label>
                <Input type='datetime-local' value={form.actual_end_at ?? ''} onChange={(e) => setF('actual_end_at', e.target.value || null)} />
              </FormGroup>
            </Col>
          </Row>

          {/* B — Partecipanti familiari */}
          <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-4'>B. Partecipanti familiari / tutori</h6>
          <Alert color='info' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
            {form.minor_id ? (loadingOptions ? 'Caricamento contatti…' : `${minorContacts.length} contatti disponibili per questo minore.`) : 'Seleziona prima il minore per caricare i contatti.'}
          </Alert>
          <ParticipantsRepeater
            rows={form.participants ?? []}
            contactOptions={minorContacts}
            contactTypeOptions={contactTypes}
            onChange={(rows) => setF('participants', rows)}
          />

          {/* C — Partecipanti professionali */}
          <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-4'>C. Partecipanti professionali</h6>
          <Alert color='info' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
            Operatori della struttura presenti durante l'avvicinamento (psicologo, assistente sociale, educatore…).
            {!form.minor_id && ' Seleziona prima il minore.'}
          </Alert>
          <StaffParticipantsRepeater
            rows={form.staff_participants ?? []}
            staffOptions={facilityStaff}
            qualificationOptions={staffQualifications}
            onChange={(rows) => setF('staff_participants', rows)}
          />

          {/* D — Provvedimento autorizzativo */}
          <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-4'>D. Provvedimento autorizzativo</h6>

          {/* Selettore modalità */}
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

          {/* Modo 1: documento esistente del minore */}
          {authMode === 'existing' && (
            <FormGroup>
              <Label>Documento del minore</Label>
              {!form.minor_id
                ? <Alert color='info' className='py-2 px-3 mb-0' style={{ fontSize: 13 }}>Seleziona prima il minore per caricare i documenti disponibili.</Alert>
                : minorDocuments.length === 0
                  ? <Alert color='warning' className='py-2 px-3 mb-0' style={{ fontSize: 13 }}>Nessun documento disponibile per questo minore. Carica un nuovo documento o usa l'inserimento manuale.</Alert>
                  : (
                    <Input type='select' value={form.authorization_minor_document_id ?? ''}
                      onChange={(e) => setF('authorization_minor_document_id', Number(e.target.value) || null)}>
                      <option value=''>— Nessun documento collegato —</option>
                      {minorDocuments.map((doc) => {
                        const label = doc.label ?? doc.attachment?.original_name?.replace(/\.[^.]+$/, '') ?? `Doc #${doc.id}`
                        const type = doc.document_type?.name ?? ''
                        return <option key={doc.id} value={doc.id}>{type ? `${type} — ${label}` : label}</option>
                      })}
                    </Input>
                  )
              }
            </FormGroup>
          )}

          {/* Modo 2: carica nuovo documento */}
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
                      disabled={uploadingDoc || !uploadFile || !uploadDocTypeId || !form.minor_id}
                      onClick={async () => {
                        if (!uploadFile || !uploadDocTypeId || !form.minor_id) return
                        setUploadingDoc(true)
                        try {
                          const fd = new FormData()
                          fd.append('file', uploadFile)
                          fd.append('document_type_id', String(uploadDocTypeId))
                          // label = nome file senza estensione (campo futuro backend)
                          if (uploadLabel) fd.append('label', uploadLabel)
                          const doc = await minorApi.uploadDocument(form.minor_id, fd)
                          setUploadedDocId(doc.id)
                          setF('authorization_minor_document_id', doc.id)
                          // Aggiorna lista documenti
                          minorApi.listDocuments(form.minor_id).then(setMinorDocuments).catch(() => {})
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

          {/* Modo 3: inserimento manuale */}
          {authMode === 'manual' && (
            <Row>
              <Col md='4'>
                <FormGroup>
                  <Label>Riferimento</Label>
                  <Input value={form.authorization_reference ?? ''} onChange={(e) => setF('authorization_reference', e.target.value || null)} placeholder='Es. Decreto n. 123/2026' />
                </FormGroup>
              </Col>
              <Col md='3'>
                <FormGroup>
                  <Label>Data emissione</Label>
                  <Input type='date' value={form.authorization_issued_at ?? ''} onChange={(e) => setF('authorization_issued_at', e.target.value || null)} />
                </FormGroup>
              </Col>
              <Col md='3'>
                <FormGroup>
                  <Label>Data scadenza</Label>
                  <Input type='date' value={form.authorization_expires_at ?? ''} onChange={(e) => setF('authorization_expires_at', e.target.value || null)} />
                </FormGroup>
              </Col>
              <Col md='2'>
                <FormGroup>
                  <Label>Gg alert rinnovo</Label>
                  <Input type='number' min={1} value={form.authorization_renewal_alert_days ?? ''} onChange={(e) => setF('authorization_renewal_alert_days', e.target.value ? Number(e.target.value) : null)} />
                </FormGroup>
              </Col>
            </Row>
          )}

          {/* E — Valutazione qualitativa */}
          <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-4'>E. Valutazione qualitativa</h6>
          {(['pre', 'during', 'post'] as const).map((phase) => {
            const label = phase === 'pre' ? "Prima dell'incontro" : phase === 'during' ? "Durante l'incontro" : "Dopo l'incontro"
            const lk = `${phase}_reaction_level` as keyof ApproachWrite
            const nk = `${phase}_reaction_notes` as keyof ApproachWrite
            return (
              <Row key={phase} className='mb-2'>
                <Col md='3'>
                  <FormGroup className='mb-0'>
                    <Label className='small'>{label}</Label>
                    <Input type='select' bsSize='sm' value={(form[lk] as string) ?? ''} onChange={(e) => setF(lk, e.target.value as ReactionLevel || null)}>
                      <option value=''>Non rilevato</option>
                      {Object.entries(REACTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md='9'>
                  <FormGroup className='mb-0'>
                    <Label className='small'>Note {label.toLowerCase()}</Label>
                    <Input bsSize='sm' value={(form[nk] as string) ?? ''} onChange={(e) => setF(nk, e.target.value || null)} />
                  </FormGroup>
                </Col>
              </Row>
            )
          })}
          <Row className='mt-2'>
            <Col md='6'>
              <FormGroup>
                <Label>Note esito</Label>
                <Input type='textarea' rows={2} value={form.outcome_notes ?? ''} onChange={(e) => setF('outcome_notes', e.target.value || null)} />
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Prossimi passi</Label>
                <Input type='textarea' rows={2} value={form.next_steps ?? ''} onChange={(e) => setF('next_steps', e.target.value || null)} />
              </FormGroup>
            </Col>
          </Row>

          {/* F — Note riservate */}
          <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-4'>F. Note riservate</h6>
          <Alert color='warning' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
            Visibili solo a profili autorizzati (psicologo, coordinatore).
          </Alert>
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Note psicologo</Label>
                <Input type='textarea' rows={2} value={form.reserved_psychologist_notes ?? ''} onChange={(e) => setF('reserved_psychologist_notes', e.target.value || null)} />
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Note coordinatore</Label>
                <Input type='textarea' rows={2} value={form.reserved_coordinator_notes ?? ''} onChange={(e) => setF('reserved_coordinator_notes', e.target.value || null)} />
              </FormGroup>
            </Col>
          </Row>

          {/* G — Sospensione */}
          {(form.status === 'suspended' || editTarget?.status === 'suspended') && (
            <>
              <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-4'>G. Sospensione</h6>
              <Row>
                <Col md='6'>
                  <FormGroup>
                    <Label>Motivazione sospensione</Label>
                    <Input type='textarea' rows={2} value={form.suspension_reason ?? ''} onChange={(e) => setF('suspension_reason', e.target.value || null)} />
                  </FormGroup>
                </Col>
                <Col md='3'>
                  <FormGroup>
                    <Label>Data/ora sospensione</Label>
                    <Input type='datetime-local' value={form.suspended_at ?? ''} onChange={(e) => setF('suspended_at', e.target.value || null)} />
                  </FormGroup>
                </Col>
                <Col md='3'>
                  <FormGroup>
                    <Label>Firma/responsabile</Label>
                    <Input type='datetime-local' value={form.suspension_signed_at ?? ''} onChange={(e) => setF('suspension_signed_at', e.target.value || null)} />
                  </FormGroup>
                </Col>
              </Row>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='secondary' className='d-flex align-items-center gap-1' onClick={() => setModalOpen(false)}><X size={13} /> Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal dettaglio ──────────────────────────────────────────────── */}
      {detailTarget && (
        <Modal isOpen={!!detailTarget} toggle={() => setDetailTarget(null)} size='lg' centered scrollable>
          <ModalHeader toggle={() => setDetailTarget(null)}>
            Avvicinamento — {detailTarget.minor?.last_name} {detailTarget.minor?.first_name}
          </ModalHeader>
          <ModalBody>
            <Row>
              <Col md='6'><small className='text-muted'>Tipologia contatto</small><p className='mb-1'>{detailTarget.approach_type?.name ?? '—'}</p></Col>
              <Col md='6'><small className='text-muted'>Stato</small><p className='mb-1'><span className={`badge ${STATUS_BADGE[detailTarget.status]}`}>{STATUS_LABEL[detailTarget.status]}</span></p></Col>
              <Col md='12'><small className='text-muted'>Titolo</small><p className='mb-1'>{detailTarget.title}</p></Col>
              {detailTarget.objective && <Col md='12'><small className='text-muted'>Obiettivo</small><p className='mb-1'>{detailTarget.objective}</p></Col>}
              <Col md='4'><small className='text-muted'>Luogo</small><p className='mb-1'>{detailTarget.location ?? '—'}</p></Col>
              <Col md='4'><small className='text-muted'>Inizio pianificato</small><p className='mb-1'>{fmtDt(detailTarget.planned_start_at)}</p></Col>
              <Col md='4'><small className='text-muted'>Fine pianificata</small><p className='mb-1'>{fmtDt(detailTarget.planned_end_at)}</p></Col>
            </Row>

            {/* Partecipanti familiari */}
            <div className='mt-3 p-3 rounded' style={{ background: '#f4f5f7' }}>
              <strong>Partecipanti familiari / tutori</strong>
              {(() => {
                const contacts = detailTarget.participants?.length
                  ? detailTarget.participants
                  : (detailTarget.minor_contacts ?? (detailTarget.minor_contact ? [{ minor_contact_id: detailTarget.minor_contact.id, contact: detailTarget.minor_contact, contact_type: null }] : []))
                if (contacts.length === 0) return <p className='mb-0 mt-1 small' style={{ color: '#555' }}>Nessun partecipante familiare registrato.</p>
                return (
                  <ul className='mb-0 mt-2 ps-3' style={{ fontSize: 14, color: '#333' }}>
                    {contacts.map((p: { minor_contact_id?: number; contact?: { id?: number; first_name?: string; last_name?: string } | null; contact_type?: { name?: string } | null }, i: number) => (
                      <li key={i}>
                        {p.contact ? `${p.contact.last_name} ${p.contact.first_name}` : `#${p.minor_contact_id}`}
                        {p.contact_type?.name && <Badge color='secondary' pill className='ms-2' style={{ fontSize: 11, fontWeight: 400 }}>{p.contact_type.name}</Badge>}
                      </li>
                    ))}
                  </ul>
                )
              })()}
            </div>

            {/* Partecipanti professionali */}
            <div className='mt-2 p-3 rounded' style={{ background: '#f4f5f7' }}>
              <strong>Professionisti presenti</strong>
              {(!detailTarget.staff_participants || detailTarget.staff_participants.length === 0)
                ? <p className='mb-0 mt-1 small' style={{ color: '#555' }}>Nessun professionista registrato.</p>
                : (
                  <ul className='mb-0 mt-2 ps-3' style={{ fontSize: 14, color: '#333' }}>
                    {detailTarget.staff_participants.map((p, i) => (
                      <li key={i} style={{ color: '#333', marginBottom: 4 }}>
                        {p.staff_member
                          ? (p.staff_member.display_name ?? `${p.staff_member.last_name} ${p.staff_member.first_name}`)
                          : `#${p.staff_member_id}`}
                        {(p.qualification?.name ?? p.qualification_code) && (
                          <Badge color='secondary' pill className='ms-2' style={{ fontSize: 11, fontWeight: 400 }}>{p.qualification?.name ?? p.qualification_code}</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )
              }
            </div>

            {/* Provvedimento */}
            {(detailTarget.authorization_reference || detailTarget.authorization_status) && (
              <div className='mt-2 p-3 rounded' style={{ background: '#f4f5f7' }}>
                <strong>Provvedimento autorizzativo</strong>
                {detailTarget.authorization_status && (
                  <span className={`badge ms-2 ${AUTH_BADGE[detailTarget.authorization_status]}`}>
                    {AUTH_LABEL[detailTarget.authorization_status]}
                  </span>
                )}
                <div className='mt-1 small'>
                  {detailTarget.authorization_reference && <div>Rif.: {detailTarget.authorization_reference}</div>}
                  {detailTarget.authorization_issued_at && <div>Emesso il: {fmtDate(detailTarget.authorization_issued_at)}</div>}
                  {detailTarget.authorization_expires_at && <div>Scade il: {fmtDate(detailTarget.authorization_expires_at)}</div>}
                </div>
              </div>
            )}

            {/* Valutazione qualitativa */}
            {(detailTarget.pre_reaction_level || detailTarget.during_reaction_level || detailTarget.post_reaction_level) && (
              <div className='mt-2 p-3 rounded' style={{ background: '#f4f5f7' }}>
                <strong>Valutazione qualitativa</strong>
                <div className='mt-1 small'>
                  {detailTarget.pre_reaction_level && <div>Prima: {REACTION_LABEL[detailTarget.pre_reaction_level]}{detailTarget.pre_reaction_notes && ` — ${detailTarget.pre_reaction_notes}`}</div>}
                  {detailTarget.during_reaction_level && <div>Durante: {REACTION_LABEL[detailTarget.during_reaction_level]}{detailTarget.during_reaction_notes && ` — ${detailTarget.during_reaction_notes}`}</div>}
                  {detailTarget.post_reaction_level && <div>Dopo: {REACTION_LABEL[detailTarget.post_reaction_level]}{detailTarget.post_reaction_notes && ` — ${detailTarget.post_reaction_notes}`}</div>}
                </div>
              </div>
            )}

            {(detailTarget.outcome_notes || detailTarget.next_steps) && (
              <Row className='mt-2'>
                {detailTarget.outcome_notes && <Col md='6'><small className='text-muted'>Note esito</small><p className='mb-1'>{detailTarget.outcome_notes}</p></Col>}
                {detailTarget.next_steps && <Col md='6'><small className='text-muted'>Prossimi passi</small><p className='mb-1'>{detailTarget.next_steps}</p></Col>}
              </Row>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color='primary' size='sm' onClick={() => openEdit(detailTarget)}>Modifica</Button>
            <Button color='secondary' size='sm' onClick={() => setDetailTarget(null)}>Chiudi</Button>
          </ModalFooter>
        </Modal>
      )}

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Guida avvicinamenti'>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Tipologie di avvicinamento</h6>
          <ul style={{ fontSize: 14 }}>
            <li><strong>Avvicinamento familiare</strong> — incontro fisico con famiglia</li>
            <li><strong>Visita in struttura</strong> — famiglia viene in struttura</li>
            <li><strong>Uscita autorizzata</strong> — minore esce con famiglia</li>
            <li><strong>Telefonata / Videochiamata</strong> — contatto remoto</li>
            <li><strong>Lettera</strong> — comunicazione scritta</li>
            <li><strong>Incontro con tutore / Incontro protetto</strong></li>
            <li><strong>Step reintegrazione</strong> — fase del percorso di rientro</li>
          </ul>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Partecipanti</h6>
          <p style={{ fontSize: 14 }}>Distingui familiari/tutori (blocco B) da professionisti (blocco C). I ruoli vengono precompilati dall'anagrafica ma puoi modificarli per il singolo evento.</p>
        </section>
        <section>
          <h6 className='fw-bold mb-2'>Provvedimento autorizzativo</h6>
          <p style={{ fontSize: 14 }}>Inserisci gli estremi del decreto o provvedimento che autorizza l'avvicinamento. La data di scadenza genera alert automatici.</p>
        </section>
      </InfoDrawer>
    </div>
  )
}
