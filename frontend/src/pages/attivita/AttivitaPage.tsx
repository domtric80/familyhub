import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button,
} from 'reactstrap'
import { Home, Plus, Edit2, Trash2, Info, Bell, CheckCircle, Clock } from 'react-feather'
import InfoDrawer from '../../components/common/InfoDrawer'
import { toast } from 'react-toastify'
import { activityApi, activityReminderApi, activityMediaApi, adminUserApi, facilityApi, minorApi, lookupsApi, staffMemberApi, apiError } from '../../services/api'
import type { Activity, ActivityWrite, ActivityType, AttendanceStatus, SupportLevel, Facility, Minor, MinorActivityReminder, MinorActivityReminderWrite, MinorActivityMedia, MinorActivityMediaWrite, MinorDocument } from '../../types'
import type { StaffMember } from '../../types'

// ─── Costanti ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  planned: 'badge-light-info', in_progress: 'badge-light-warning',
  completed: 'badge-light-success', cancelled: 'badge-light-secondary',
}
const STATUS_LABEL: Record<string, string> = {
  planned: 'Pianificata', in_progress: 'In corso',
  completed: 'Completata', cancelled: 'Annullata',
}
const ATTENDANCE_BADGE: Record<string, string> = {
  present: 'badge-light-success', partial: 'badge-light-warning', absent: 'badge-light-danger',
}
const ATTENDANCE_LABEL: Record<string, string> = {
  present: 'Presenza completa', partial: 'Presenza parziale', absent: 'Assente',
}
const SUPPORT_LABEL: Record<string, string> = {
  autonomous: 'Autonomia piena', light: 'Supporto leggero',
  medium: 'Supporto medio', high: 'Supporto elevato',
}
const SUPPORT_BADGE: Record<string, string> = {
  autonomous: 'badge-light-success', light: 'badge-light-info',
  medium: 'badge-light-warning', high: 'badge-light-danger',
}

const EMPTY_FORM: ActivityWrite = {
  minor_id: 0, activity_type_id: 0, title: '', description: null,
  location: null, planned_start_at: '', planned_end_at: null,
  actual_start_at: null, actual_end_at: null, status: 'planned',
  pei_objective_ref: null, outcome_notes: null,
  responsible_staff_member_id: null, attendance_status: null,
  support_level: null, requires_transport: false,
  materials_needed: null, follow_up_required: false, follow_up_notes: null,
}

function toInputDt(s?: string | null) { return s ? s.slice(0, 16) : '' }
function fmtDt(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}

function staffDisplayName(staff?: StaffMember | null) {
  if (!staff) return '—'
  return staff.display_name ?? `${staff.last_name} ${staff.first_name}`.trim()
}

function documentDisplayName(document?: MinorDocument | null) {
  if (!document) return '—'
  return document.label ?? document.attachment?.original_name ?? `Doc #${document.id}`
}

function documentMimeType(document: MinorDocument) {
  return document.attachment?.mime_type ?? ''
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function AttivitaPage() {
  const [infoOpen, setInfoOpen]     = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [apiMissing, setApiMissing] = useState(false)

  const [facilities, setFacilities]     = useState<Facility[]>([])
  const [minors, setMinors]             = useState<Minor[]>([])
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])

  // Filtri
  const [filterFacilityId, setFilterFacilityId]   = useState(0)
  const [filterMinorId, setFilterMinorId]         = useState(0)
  const [filterTypeId, setFilterTypeId]           = useState(0)
  const [filterStatus, setFilterStatus]           = useState('')
  const [filterAttendance, setFilterAttendance]   = useState('')
  const [filterSupport, setFilterSupport]         = useState('')
  const [filterFollowUp, setFilterFollowUp]       = useState('')
  const [filterDateFrom, setFilterDateFrom]       = useState('')
  const [filterDateTo, setFilterDateTo]           = useState('')
  const [limit, setLimit]                         = useState(50)

  // Modali
  const [modalOpen, setModalOpen]       = useState(false)
  const [editTarget, setEditTarget]     = useState<Activity | null>(null)
  const [form, setForm]                 = useState<ActivityWrite>(EMPTY_FORM)
  const [saving, setSaving]             = useState(false)
  const [formMsg, setFormMsg]           = useState<string | null>(null)
  const [fieldErrors, setFieldErrors]   = useState<Record<string, string[]>>({})

  const [detailTarget, setDetailTarget] = useState<Activity | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null)
  const [deleting, setDeleting]         = useState(false)

  // Media (nel modal dettaglio)
  const [media, setMedia]               = useState<MinorActivityMedia[]>([])
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [minorDocs, setMinorDocs]       = useState<MinorDocument[]>([])
  const [mediaForm, setMediaForm]       = useState<MinorActivityMediaWrite>({ media_document_id: 0, consent_document_id: 0, captured_at: null })
  const [mediaMsg, setMediaMsg]         = useState<string | null>(null)
  const [savingMedia, setSavingMedia]   = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<MinorActivityMedia | null>(null)
  const [revokeMotivazione, setRevokeMotivazione] = useState('')
  const [revoking, setRevoking]         = useState(false)
  const [previewBlob, setPreviewBlob]   = useState<string | null>(null)
  const [previewName, setPreviewName]   = useState<string>('')

  // Promemoria (nel modal dettaglio)
  const [reminders, setReminders]         = useState<MinorActivityReminder[]>([])
  const [loadingReminders, setLoadingReminders] = useState(false)
  const [reminderUsers, setReminderUsers] = useState<{ id: number; full_name: string }[]>([])
  const [reminderForm, setReminderForm]   = useState<MinorActivityReminderWrite>({ recipient_user_id: 0, remind_at: '' })
  const [reminderMsg, setReminderMsg]     = useState<string | null>(null)
  const [savingReminder, setSavingReminder] = useState(false)

  // ── Caricamento ────────────────────────────────────────────────
  const load = async () => {
    setLoading(true); setError(null)
    try {
      const params: Record<string, number | string | undefined> = {}
      if (filterFacilityId) params.facility_id = filterFacilityId
      if (filterMinorId) params.minor_id = filterMinorId
      if (filterTypeId) params.activity_type_id = filterTypeId
      if (filterStatus) params.status = filterStatus
      if (filterAttendance) params.attendance_status = filterAttendance
      if (filterSupport) params.support_level = filterSupport
      if (filterFollowUp) params.follow_up_required = filterFollowUp
      setActivities(await activityApi.list(params as Parameters<typeof activityApi.list>[0]))
      setApiMissing(false)
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 404) { setApiMissing(true); setActivities([]) }
      else if (ae.status === 403) setError('Il tuo profilo non è abilitato a consultare le Attività. Contatta un amministratore per verificare il ruolo assegnato.')
      else setError(ae.message ?? 'Errore caricamento')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    Promise.all([facilityApi.list(), lookupsApi.activityTypes(), minorApi.list(), staffMemberApi.list()])
      .then(([facs, types, mins, staff]) => {
        setFacilities(facs); setActivityTypes(types); setMinors(mins); setStaffMembers(staff)
      }).catch(() => {})
  }, [])
  useEffect(() => { load() }, [filterFacilityId, filterMinorId, filterTypeId, filterStatus, filterAttendance, filterSupport, filterFollowUp]) // eslint-disable-line

  useEffect(() => {
    if (!detailTarget) { setMedia([]); setMinorDocs([]); return }
    setLoadingMedia(true); setMediaMsg(null)
    setMediaForm({ media_document_id: 0, consent_document_id: 0, captured_at: null })
    setRevokeTarget(null); setRevokeMotivazione(''); setPreviewBlob(null)
    Promise.all([
      activityMediaApi.list(detailTarget.id),
      minorApi.listDocuments(detailTarget.minor_id).catch(() => []),
    ]).then(([m, docs]) => {
      setMedia(m); setMinorDocs(docs as MinorDocument[])
    }).catch(() => {})
      .finally(() => setLoadingMedia(false))
  }, [detailTarget?.id]) // eslint-disable-line

  useEffect(() => {
    if (!detailTarget) { setReminders([]); return }
    setLoadingReminders(true); setReminderMsg(null)
    setReminderForm({ recipient_user_id: 0, remind_at: '' })
    Promise.all([
      activityReminderApi.list(detailTarget.id),
      adminUserApi.list().catch(() => []),
    ]).then(([rems, users]) => {
      setReminders(rems)
      setReminderUsers((users as any[]).map((u: any) => ({ id: u.id, full_name: `${u.first_name} ${u.last_name}`.trim() })))
    }).catch(() => {})
      .finally(() => setLoadingReminders(false))
  }, [detailTarget?.id]) // eslint-disable-line

  const filteredMinors = filterFacilityId ? minors.filter((m) => m.facility_id === filterFacilityId) : minors
  const filteredStaff = filterFacilityId ? staffMembers.filter((s) => s.facility_id === filterFacilityId) : staffMembers

  const displayItems = useMemo(() => {
    let r = [...activities]
    if (filterDateFrom) r = r.filter((x) => x.planned_start_at >= filterDateFrom)
    if (filterDateTo)   r = r.filter((x) => x.planned_start_at <= filterDateTo + 'T23:59:59')
    r.sort((a, b) => b.planned_start_at.localeCompare(a.planned_start_at))
    return r.slice(0, limit)
  }, [activities, filterDateFrom, filterDateTo, limit])

  // ── CRUD ───────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null); setForm({ ...EMPTY_FORM }); setFormMsg(null); setFieldErrors({}); setModalOpen(true)
  }
  const openEdit = (item: Activity) => {
    setDetailTarget(null); setEditTarget(item)
    setForm({
      minor_id: item.minor_id, activity_type_id: item.activity_type_id,
      title: item.title, description: item.description ?? null,
      location: item.location ?? null,
      planned_start_at: toInputDt(item.planned_start_at), planned_end_at: toInputDt(item.planned_end_at),
      actual_start_at: toInputDt(item.actual_start_at), actual_end_at: toInputDt(item.actual_end_at),
      status: item.status, pei_objective_ref: item.pei_objective_ref ?? null,
      outcome_notes: item.outcome_notes ?? null,
      responsible_staff_member_id: item.responsible_staff_member_id ?? null,
      attendance_status: item.attendance_status ?? null, support_level: item.support_level ?? null,
      requires_transport: item.requires_transport ?? false,
      materials_needed: item.materials_needed ?? null,
      follow_up_required: item.follow_up_required ?? false,
      follow_up_notes: item.follow_up_notes ?? null,
    })
    setFormMsg(null); setFieldErrors({}); setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true); setFormMsg(null); setFieldErrors({})
    try {
      const payload: ActivityWrite = {
        ...form,
        planned_end_at: form.planned_end_at || null,
        actual_start_at: form.actual_start_at || null,
        actual_end_at: form.actual_end_at || null,
        materials_needed: form.materials_needed || null,
        follow_up_notes: form.follow_up_required ? form.follow_up_notes : null,
      }
      if (editTarget) { await activityApi.update(editTarget.id, payload); toast.success('Attività aggiornata.') }
      else { await activityApi.create(payload); toast.success('Attività registrata.') }
      setModalOpen(false); load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setFormMsg('Operazione non consentita: verifica permessi di ruolo e assegnazione attiva al minore.')
      else if (ae.status === 422) { setFieldErrors(ae.errors ?? {}); setFormMsg(ae.message ?? 'Dati non validi.') }
      else setFormMsg(ae.message ?? 'Errore salvataggio')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try { await activityApi.delete(deleteTarget.id); toast.success('Attività eliminata.'); setDeleteTarget(null); load() }
    catch (e) { toast.error(apiError(e).message ?? 'Errore eliminazione') }
    finally { setDeleting(false) }
  }

  const fErr = (f: string) => fieldErrors[f]?.[0]
  const setF = (k: keyof ActivityWrite, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const handleAddReminder = async () => {
    if (!detailTarget) return
    if (!reminderForm.recipient_user_id) { setReminderMsg('Seleziona il destinatario.'); return }
    if (!reminderForm.remind_at) { setReminderMsg('Inserisci la data/ora promemoria.'); return }
    setSavingReminder(true); setReminderMsg(null)
    try {
      const r = await activityReminderApi.create(detailTarget.id, reminderForm)
      setReminders((prev) => [...prev, r])
      setReminderForm({ recipient_user_id: 0, remind_at: '' })
      toast.success('Promemoria aggiunto.')
    } catch (e) { setReminderMsg(apiError(e).message ?? 'Errore aggiunta promemoria.') }
    finally { setSavingReminder(false) }
  }

  const handleDeleteReminder = async (r: MinorActivityReminder) => {
    if (!detailTarget) return
    try {
      await activityReminderApi.delete(detailTarget.id, r.id)
      setReminders((prev) => prev.filter((x) => x.id !== r.id))
      toast.success('Promemoria rimosso.')
    } catch (e) { toast.error(apiError(e).message ?? 'Errore rimozione.') }
  }

  const handleAcknowledgeReminder = async (r: MinorActivityReminder) => {
    if (!detailTarget) return
    try {
      const updated = await activityReminderApi.acknowledge(detailTarget.id, r.id)
      setReminders((prev) => prev.map((x) => x.id === updated.id ? updated : x))
      toast.success('Presa visione registrata.')
    } catch (e) { toast.error(apiError(e).message ?? 'Errore presa visione.') }
  }

  const handleAddMedia = async () => {
    if (!detailTarget) return
    if (!mediaForm.media_document_id) { setMediaMsg('Seleziona il documento media.'); return }
    if (!mediaForm.consent_document_id) { setMediaMsg('Seleziona il documento di consenso.'); return }
    setSavingMedia(true); setMediaMsg(null)
    try {
      const m = await activityMediaApi.create(detailTarget.id, mediaForm)
      setMedia((prev) => [...prev, m])
      setMediaForm({ media_document_id: 0, consent_document_id: 0, captured_at: null })
      toast.success('Media collegato.')
    } catch (e) {
      const ae = apiError(e)
      setMediaMsg(ae.message ?? 'Errore collegamento media.')
    } finally { setSavingMedia(false) }
  }

  const handleDeleteMedia = async (m: MinorActivityMedia) => {
    if (!detailTarget) return
    try {
      await activityMediaApi.delete(detailTarget.id, m.id)
      setMedia((prev) => prev.filter((x) => x.id !== m.id))
      toast.success('Media rimosso.')
    } catch (e) { toast.error(apiError(e).message ?? 'Errore rimozione.') }
  }

  const handleRevokeConsent = async () => {
    if (!detailTarget || !revokeTarget) return
    if (!revokeMotivazione.trim()) return
    setRevoking(true)
    try {
      const updated = await activityMediaApi.revokeConsent(detailTarget.id, revokeTarget.id, revokeMotivazione)
      setMedia((prev) => prev.map((x) => x.id === updated.id ? updated : x))
      setRevokeTarget(null); setRevokeMotivazione('')
      toast.success('Consenso revocato.')
    } catch (e) { toast.error(apiError(e).message ?? 'Errore revoca consenso.') }
    finally { setRevoking(false) }
  }

  const handlePreviewMedia = async (m: MinorActivityMedia) => {
    if (!m.can_preview || !detailTarget) return
    try {
      const blob = await minorApi.previewDocument(detailTarget.minor_id, m.media_document_id)
      const url = URL.createObjectURL(blob)
      setPreviewBlob(url)
      setPreviewName(documentDisplayName(m.media_document) ?? `documento-${m.media_document_id}`)
    } catch (e) { toast.error(apiError(e).message ?? 'Anteprima non disponibile.') }
  }

  const minorLabel = (a: Activity) => {
    if (a.minor) return `${a.minor.last_name} ${a.minor.first_name}`
    const m = minors.find((x) => x.id === a.minor_id)
    return m ? `${m.last_name} ${m.first_name}` : `#${a.minor_id}`
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <div className='d-flex align-items-center gap-2'>
                <h3 className='mb-0'>Attività</h3>
                <button className='btn btn-light btn-sm d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
                  <Info size={13} /> Informazioni
                </button>
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item active'>Attività</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        {apiMissing && (
          <Alert color='warning' className='mb-3'>Il modulo Attività non è ancora disponibile sul backend.</Alert>
        )}
        <Row><Col sm='12'>
          <Card>
            <CardHeader className='d-flex justify-content-between align-items-center'>
              <h5 className='mb-0'>Elenco attività</h5>
              <div className='d-flex align-items-center gap-2'>
                <small className='text-muted'>{displayItems.length}/{activities.length} record</small>
                <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
                  <Plus size={13} /> Nuova attività
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {/* ── Filtri ── */}
              <div className='py-2 border-bottom mb-3'>
                <Row className='g-2 align-items-end'>
                  <Col md='3'>
                    <Label className='mb-1 small'>Struttura</Label>
                    <Input type='select' bsSize='sm' value={filterFacilityId} onChange={(e) => { setFilterFacilityId(Number(e.target.value)); setFilterMinorId(0) }}>
                      <option value={0}>Tutte le strutture</option>
                      {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </Input>
                  </Col>
                  <Col md='3'>
                    <Label className='mb-1 small'>Minore</Label>
                    <Input type='select' bsSize='sm' value={filterMinorId} onChange={(e) => setFilterMinorId(Number(e.target.value))}>
                      <option value={0}>Tutti i minori</option>
                      {filteredMinors.map((m) => <option key={m.id} value={m.id}>{m.last_name} {m.first_name}</option>)}
                    </Input>
                  </Col>
                  <Col md='3'>
                    <Label className='mb-1 small'>Tipo</Label>
                    <Input type='select' bsSize='sm' value={filterTypeId} onChange={(e) => setFilterTypeId(Number(e.target.value))}>
                      <option value={0}>Tutti i tipi</option>
                      {activityTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Input>
                  </Col>
                  <Col md='3'>
                    <Label className='mb-1 small'>Stato</Label>
                    <Input type='select' bsSize='sm' value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value=''>Tutti gli stati</option>
                      <option value='planned'>Pianificata</option>
                      <option value='in_progress'>In corso</option>
                      <option value='completed'>Completata</option>
                      <option value='cancelled'>Annullata</option>
                    </Input>
                  </Col>
                </Row>
                <Row className='g-2 align-items-end mt-1'>
                  <Col md='2'>
                    <Label className='mb-1 small'>Presenza</Label>
                    <Input type='select' bsSize='sm' value={filterAttendance} onChange={(e) => setFilterAttendance(e.target.value)}>
                      <option value=''>Tutte</option>
                      <option value='present'>Presenza completa</option>
                      <option value='partial'>Presenza parziale</option>
                      <option value='absent'>Assente</option>
                    </Input>
                  </Col>
                  <Col md='2'>
                    <Label className='mb-1 small'>Supporto</Label>
                    <Input type='select' bsSize='sm' value={filterSupport} onChange={(e) => setFilterSupport(e.target.value)}>
                      <option value=''>Tutti</option>
                      <option value='autonomous'>Autonomia piena</option>
                      <option value='light'>Leggero</option>
                      <option value='medium'>Medio</option>
                      <option value='high'>Elevato</option>
                    </Input>
                  </Col>
                  <Col md='2'>
                    <Label className='mb-1 small'>Follow-up</Label>
                    <Input type='select' bsSize='sm' value={filterFollowUp} onChange={(e) => setFilterFollowUp(e.target.value)}>
                      <option value=''>Tutti</option>
                      <option value='1'>Richiesto</option>
                      <option value='0'>Non richiesto</option>
                    </Input>
                  </Col>
                  <Col md='2'>
                    <Label className='mb-1 small'>Da</Label>
                    <Input type='date' bsSize='sm' value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
                  </Col>
                  <Col md='2'>
                    <Label className='mb-1 small'>A</Label>
                    <Input type='date' bsSize='sm' value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
                  </Col>
                  <Col md='1'>
                    <Label className='mb-1 small'>Ris.</Label>
                    <Input type='select' bsSize='sm' value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={9999}>Tutti</option>
                    </Input>
                  </Col>
                  <Col md='1' className='d-flex align-items-end'>
                    <Button size='sm' color='light' onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); setLimit(50) }}>Az.</Button>
                  </Col>
                </Row>
              </div>

              {error && <Alert color='danger'>{error}</Alert>}
              {loading ? <div className='text-center py-5'><div className='loader' /></div> : (
                <div className='table-responsive'>
                  <table className='table table-hover table-sm'>
                    <thead className='table-light'>
                      <tr>
                        <th>Minore</th><th>Tipo</th><th>Titolo</th><th>Inizio pianificato</th>
                        <th>Stato</th><th>Responsabile</th><th>Presenza</th><th>Supporto</th>
                        <th>Trasporto</th><th>Follow-up</th><th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayItems.length === 0 && (
                        <tr><td colSpan={11} className='text-center text-muted py-4'>
                          Non risultano attività per i filtri selezionati.
                        </td></tr>
                      )}
                      {displayItems.map((a) => (
                        <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setDetailTarget(a)}>
                          <td className='small'>
                            <div className='fw-semibold'>{minorLabel(a)}</div>
                            <small className='text-muted'>{a.minor?.internal_code}</small>
                          </td>
                          <td className='small'>{a.activity_type?.name ?? '—'}</td>
                          <td className='small'>{a.title}</td>
                          <td className='small'>{fmtDt(a.planned_start_at)}</td>
                          <td><span className={`badge ${STATUS_BADGE[a.status] ?? 'badge-light-secondary'}`}>{STATUS_LABEL[a.status] ?? a.status}</span></td>
                          <td className='small text-muted'>
                            {a.responsible_staff_member?.display_name ?? (
                              a.responsible_staff_member_id
                                ? staffDisplayName(staffMembers.find((s) => s.id === a.responsible_staff_member_id) ?? null)
                                : '—'
                            )}
                          </td>
                          <td>
                            {a.attendance_status
                              ? <span className={`badge ${ATTENDANCE_BADGE[a.attendance_status]}`}>{ATTENDANCE_LABEL[a.attendance_status]}</span>
                              : <span className='text-muted small'>—</span>}
                          </td>
                          <td>
                            {a.support_level
                              ? <span className={`badge ${SUPPORT_BADGE[a.support_level]}`}>{SUPPORT_LABEL[a.support_level]}</span>
                              : <span className='text-muted small'>—</span>}
                          </td>
                          <td>
                            {a.requires_transport
                              ? <span className='badge badge-light-info'>Sì</span>
                              : <span className='text-muted small'>No</span>}
                          </td>
                          <td>
                            {a.follow_up_required
                              ? <span className='badge badge-light-warning'>Sì</span>
                              : <span className='text-muted small'>No</span>}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <Button color='light' size='sm' className='me-1' onClick={() => openEdit(a)}><Edit2 size={12} /></Button>
                            <Button color='light' size='sm' onClick={() => setDeleteTarget(a)}><Trash2 size={12} /></Button>
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

      {/* ── Modale dettaglio ── */}
      {detailTarget && (
        <Modal isOpen={!!detailTarget} toggle={() => setDetailTarget(null)} size='lg'>
          <ModalHeader toggle={() => setDetailTarget(null)}>
            Attività — {detailTarget.title}
          </ModalHeader>
          <ModalBody>
            <Row>
              <Col md='6'>
                <p><strong>Minore:</strong> {minorLabel(detailTarget)}</p>
                <p><strong>Tipo:</strong> {detailTarget.activity_type?.name ?? '—'}</p>
                <p><strong>Stato:</strong> <span className={`badge ms-1 ${STATUS_BADGE[detailTarget.status]}`}>{STATUS_LABEL[detailTarget.status]}</span></p>
                <p><strong>Luogo:</strong> {detailTarget.location ?? '—'}</p>
                <p><strong>Rif. PEI:</strong> {detailTarget.pei_objective_ref ?? '—'}</p>
              </Col>
              <Col md='6'>
                <p><strong>Inizio pianificato:</strong> {fmtDt(detailTarget.planned_start_at)}</p>
                <p><strong>Fine pianificata:</strong> {fmtDt(detailTarget.planned_end_at)}</p>
                <p><strong>Inizio effettivo:</strong> {fmtDt(detailTarget.actual_start_at)}</p>
                <p><strong>Fine effettiva:</strong> {fmtDt(detailTarget.actual_end_at)}</p>
              </Col>
            </Row>
            {detailTarget.description && (
              <div className='mt-2 p-2 bg-light rounded' style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{detailTarget.description}</div>
            )}
            <Row className='mt-3'>
              <Col md='4'>
                <p><strong>Responsabile:</strong> {detailTarget.responsible_staff_member?.display_name ?? '—'}</p>
                <p><strong>Presenza:</strong> {detailTarget.attendance_status ? <span className={`badge ms-1 ${ATTENDANCE_BADGE[detailTarget.attendance_status]}`}>{ATTENDANCE_LABEL[detailTarget.attendance_status]}</span> : '—'}</p>
                <p><strong>Supporto:</strong> {detailTarget.support_level ? <span className={`badge ms-1 ${SUPPORT_BADGE[detailTarget.support_level]}`}>{SUPPORT_LABEL[detailTarget.support_level]}</span> : '—'}</p>
              </Col>
              <Col md='4'>
                <p><strong>Trasporto:</strong> {detailTarget.requires_transport ? 'Sì' : 'No'}</p>
                {detailTarget.materials_needed && <p><strong>Materiali:</strong> {detailTarget.materials_needed}</p>}
              </Col>
              <Col md='4'>
                {detailTarget.follow_up_required && (
                  <div className='p-2 border-start border-warning border-3 ps-3'>
                    <strong>Follow-up richiesto</strong>
                    {detailTarget.follow_up_notes && <p className='small mt-1'>{detailTarget.follow_up_notes}</p>}
                  </div>
                )}
              </Col>
            </Row>
            {detailTarget.outcome_notes && (
              <div className='mt-2'>
                <strong>Note esito:</strong>
                <div className='p-2 bg-light rounded mt-1' style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{detailTarget.outcome_notes}</div>
              </div>
            )}

            {/* ── Media ── */}
            <hr className='mt-3' />
            <h6 className='fw-bold mb-2'><span className='me-1'>🖼</span>Media</h6>
            <div className='alert alert-info py-2 px-3 mb-3' style={{ fontSize: 12 }}>
              I media restano documenti protetti del minore. La galleria li rende visibili solo quando il consenso è valido, il file ha superato i controlli di sicurezza e il tuo profilo possiede gli accessi documentali necessari. La revoca interrompe la fruizione senza cancellare la prova storica.
            </div>
            {loadingMedia ? <div className='text-center py-2'><div className='loader' /></div> : (
              <>
                {media.length === 0
                  ? <p className='text-muted small'>Nessun media collegato.</p>
                  : (
                    <table className='table table-sm table-borderless mb-2' style={{ fontSize: 12 }}>
                      <thead className='table-light'><tr><th>File media</th><th>Consenso</th><th>Catturato il</th><th>Stato consenso</th><th></th></tr></thead>
                      <tbody>
                        {media.map((m) => {
                          const statusBadge = m.consent_status === 'valid' ? 'badge-light-success' : m.consent_status === 'expired' ? 'badge-light-warning' : 'badge-light-danger'
                          const statusLabel = m.consent_status === 'valid' ? 'Valido' : m.consent_status === 'expired' ? 'Scaduto' : 'Revocato'
                          return (
                            <tr key={m.id}>
                              <td>{documentDisplayName(m.media_document)}</td>
                              <td>{documentDisplayName(m.consent_document)}</td>
                              <td>{m.captured_at ? new Date(m.captured_at).toLocaleDateString('it-IT') : '—'}</td>
                              <td><span className={`badge ${statusBadge}`}>{statusLabel}</span></td>
                              <td>
                                <div className='d-flex gap-1'>
                                  {m.can_preview && m.consent_status === 'valid' && (
                                    <Button size='sm' color='light' onClick={() => handlePreviewMedia(m)} title='Anteprima'>👁</Button>
                                  )}
                                  {m.consent_status === 'valid' && (
                                    <Button size='sm' color='warning' outline onClick={() => { setRevokeTarget(m); setRevokeMotivazione('') }} title='Revoca consenso'>🚫</Button>
                                  )}
                                  {m.consent_status !== 'valid' && (
                                    <Button size='sm' color='light' onClick={() => handleDeleteMedia(m)} title='Rimuovi'>✕</Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )
                }

                {/* Form collegamento media */}
                <div className='border rounded p-3 mb-2' style={{ background: '#f8f9fa' }}>
                  <div className='small fw-bold mb-2'>Collega nuovo media</div>
                  {mediaMsg && <Alert color='danger' className='py-1 px-2' style={{ fontSize: 12 }}>{mediaMsg}</Alert>}
                  <Row>
                    <Col md='4'>
                      <FormGroup className='mb-2'>
                        <Label className='small'>Documento media <span className='text-danger'>*</span></Label>
                        <Input type='select' bsSize='sm' value={mediaForm.media_document_id}
                          onChange={(e) => setMediaForm((f) => ({ ...f, media_document_id: Number(e.target.value) }))}>
                          <option value={0}>Seleziona…</option>
                          {minorDocs.filter((d) => documentMimeType(d).startsWith('image/') || documentMimeType(d).startsWith('video/')).map((d) => (
                            <option key={d.id} value={d.id}>{documentDisplayName(d)}</option>
                          ))}
                          {minorDocs.filter((d) => !documentMimeType(d).startsWith('image/') && !documentMimeType(d).startsWith('video/')).length > 0 && (
                            <optgroup label='Altri documenti'>
                              {minorDocs.filter((d) => !documentMimeType(d).startsWith('image/') && !documentMimeType(d).startsWith('video/')).map((d) => (
                                <option key={d.id} value={d.id}>{documentDisplayName(d)}</option>
                              ))}
                            </optgroup>
                          )}
                        </Input>
                        <small className='text-muted'>Il backend rivalida il MIME type.</small>
                      </FormGroup>
                    </Col>
                    <Col md='4'>
                      <FormGroup className='mb-2'>
                        <Label className='small'>Documento consenso <span className='text-danger'>*</span></Label>
                        <Input type='select' bsSize='sm' value={mediaForm.consent_document_id}
                          onChange={(e) => setMediaForm((f) => ({ ...f, consent_document_id: Number(e.target.value) }))}>
                          <option value={0}>Seleziona…</option>
                          {minorDocs.map((d) => <option key={d.id} value={d.id}>{documentDisplayName(d)}</option>)}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md='3'>
                      <FormGroup className='mb-2'>
                        <Label className='small'>Data cattura</Label>
                        <Input type='date' bsSize='sm' value={mediaForm.captured_at ?? ''}
                          onChange={(e) => setMediaForm((f) => ({ ...f, captured_at: e.target.value || null }))} />
                      </FormGroup>
                    </Col>
                    <Col md='1' className='d-flex align-items-end pb-2'>
                      <Button size='sm' color='primary' onClick={handleAddMedia} disabled={savingMedia}>
                        {savingMedia ? '…' : '+'}
                      </Button>
                    </Col>
                  </Row>
                </div>
              </>
            )}

            {/* Modal revoca consenso */}
            <Modal isOpen={!!revokeTarget} toggle={() => setRevokeTarget(null)} size='sm'>
              <ModalHeader toggle={() => setRevokeTarget(null)}>Revoca consenso</ModalHeader>
              <ModalBody>
                <Alert color='warning' className='py-2 px-3' style={{ fontSize: 13 }}>
                  La revoca interrompe immediatamente l'accesso alla preview. Il record storico rimane visibile senza possibilità di preview.
                </Alert>
                <FormGroup>
                  <Label>Motivazione <span className='text-danger'>*</span></Label>
                  <Input type='textarea' rows={3} value={revokeMotivazione}
                    onChange={(e) => setRevokeMotivazione(e.target.value)}
                    placeholder='Descrivi il motivo della revoca…' />
                </FormGroup>
              </ModalBody>
              <ModalFooter>
                <Button color='danger' onClick={handleRevokeConsent} disabled={revoking || !revokeMotivazione.trim()}>
                  {revoking ? 'Revoca in corso…' : 'Conferma revoca'}
                </Button>
                <Button color='light' onClick={() => setRevokeTarget(null)}>Annulla</Button>
              </ModalFooter>
            </Modal>

            {/* Modal anteprima */}
            <Modal isOpen={!!previewBlob} toggle={() => { setPreviewBlob(null); setPreviewName('') }} size='xl'>
              <ModalHeader toggle={() => { setPreviewBlob(null); setPreviewName('') }}>{previewName}</ModalHeader>
              <ModalBody className='text-center'>
                {previewBlob && <img src={previewBlob} alt={previewName} style={{ maxWidth: '100%', maxHeight: '70vh' }} onError={() => { toast.error('Formato non visualizzabile come immagine.'); setPreviewBlob(null) }} />}
              </ModalBody>
              <ModalFooter><Button color='light' onClick={() => { setPreviewBlob(null); setPreviewName('') }}>Chiudi</Button></ModalFooter>
            </Modal>

            {/* ── Promemoria ── */}
            <hr className='mt-3' />
            <h6 className='fw-bold mb-2'><Bell size={14} className='me-1' />Promemoria</h6>
            <div className='alert alert-info py-2 px-3 mb-3' style={{ fontSize: 12 }}>
              Il destinatario riceve il promemoria solo se possiede accesso all'attività. Nessun testo dell'attività viene incluso nelle notifiche browser. La presa visione è idempotente.
            </div>
            {loadingReminders ? <div className='text-center py-2'><div className='loader' /></div> : (
              <>
                {reminders.length === 0
                  ? <p className='text-muted small'>Nessun promemoria.</p>
                  : reminders.map((r) => {
                    const uName = reminderUsers.find((u) => u.id === r.recipient_user_id)?.full_name ?? `Utente #${r.recipient_user_id}`
                    return (
                      <div key={r.id} className={`d-flex align-items-center justify-content-between border rounded px-3 py-2 mb-1 ${r.is_due && !r.acknowledged_at ? 'border-warning bg-warning bg-opacity-10' : ''}`}>
                        <div>
                          <span className='small fw-semibold'>{uName}</span>
                          <span className='ms-2 small text-muted'>{new Date(r.remind_at).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          {r.acknowledged_at
                            ? <span className='ms-2 badge badge-light-success'><CheckCircle size={10} /> {new Date(r.acknowledged_at).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            : r.is_due ? <span className='ms-2 badge badge-light-warning'><Clock size={10} /> Scaduto</span> : null}
                        </div>
                        <div className='d-flex gap-1'>
                          {!r.acknowledged_at && <Button size='sm' color='light' onClick={() => handleAcknowledgeReminder(r)} title='Prendi visione'><CheckCircle size={12} /></Button>}
                          {!r.acknowledged_at && <Button size='sm' color='light' onClick={() => handleDeleteReminder(r)} title='Elimina'>✕</Button>}
                        </div>
                      </div>
                    )
                  })}
                <div className='border rounded p-3 mt-2' style={{ background: '#f8f9fa' }}>
                  <div className='small fw-bold mb-2'>Aggiungi promemoria</div>
                  {reminderMsg && <Alert color='danger' className='py-1 px-2' style={{ fontSize: 12 }}>{reminderMsg}</Alert>}
                  <Row>
                    <Col md='5'>
                      <FormGroup className='mb-2'>
                        <Label className='small'>Destinatario <span className='text-danger'>*</span></Label>
                        <Input type='select' bsSize='sm' value={reminderForm.recipient_user_id}
                          onChange={(e) => setReminderForm((f) => ({ ...f, recipient_user_id: Number(e.target.value) }))}>
                          <option value={0}>Seleziona utente…</option>
                          {reminderUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                        </Input>
                      </FormGroup>
                    </Col>
                    <Col md='5'>
                      <FormGroup className='mb-2'>
                        <Label className='small'>Data/ora <span className='text-danger'>*</span></Label>
                        <Input type='datetime-local' bsSize='sm' value={reminderForm.remind_at}
                          onChange={(e) => setReminderForm((f) => ({ ...f, remind_at: e.target.value }))} />
                      </FormGroup>
                    </Col>
                    <Col md='2' className='d-flex align-items-end pb-2'>
                      <Button size='sm' color='primary' onClick={handleAddReminder} disabled={savingReminder}>
                        {savingReminder ? '…' : <Bell size={13} />}
                      </Button>
                    </Col>
                  </Row>
                </div>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color='primary' onClick={() => openEdit(detailTarget)}><Edit2 size={13} className='me-1' />Modifica</Button>
            <Button color='light' onClick={() => setDetailTarget(null)}>Chiudi</Button>
          </ModalFooter>
        </Modal>
      )}

      {/* ── Modale form ── */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size='xl'>
        <ModalHeader toggle={() => setModalOpen(false)}>
          {editTarget ? 'Modifica attività' : 'Nuova attività'}
        </ModalHeader>
        <ModalBody style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {formMsg && <Alert color='danger'>{formMsg}</Alert>}

          {/* ── Blocco 1: Dati base ── */}
          <h6 className='fw-bold text-muted border-bottom pb-1 mb-3'>Dati base</h6>
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Minore <span className='text-danger'>*</span></Label>
                <Input type='select' value={form.minor_id} invalid={!!fErr('minor_id')}
                  onChange={(e) => setF('minor_id', Number(e.target.value))} disabled={!!editTarget}>
                  <option value={0}>Seleziona minore…</option>
                  {filteredMinors.map((m) => <option key={m.id} value={m.id}>{m.last_name} {m.first_name} ({m.internal_code})</option>)}
                </Input>
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Tipo attività <span className='text-danger'>*</span></Label>
                <Input type='select' value={form.activity_type_id} invalid={!!fErr('activity_type_id')}
                  onChange={(e) => setF('activity_type_id', Number(e.target.value))}>
                  <option value={0}>Seleziona tipo…</option>
                  {activityTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label>Titolo <span className='text-danger'>*</span></Label>
            <Input value={form.title} invalid={!!fErr('title')}
              onChange={(e) => setF('title', e.target.value)} placeholder="Titolo dell'attività" />
            {fErr('title') && <div className='invalid-feedback d-block'>{fErr('title')}</div>}
          </FormGroup>
          <FormGroup>
            <Label>Descrizione</Label>
            <Input type='textarea' rows={2} value={form.description ?? ''}
              onChange={(e) => setF('description', e.target.value || null)} />
          </FormGroup>

          {/* ── Blocco 2: Pianificazione ── */}
          <h6 className='fw-bold text-muted border-bottom pb-1 mb-3 mt-3'>Pianificazione</h6>
          <Row>
            <Col md='3'>
              <FormGroup>
                <Label>Inizio pianificato <span className='text-danger'>*</span></Label>
                <Input type='datetime-local' lang='it' value={form.planned_start_at} invalid={!!fErr('planned_start_at')}
                  onChange={(e) => setF('planned_start_at', e.target.value)} />
                {fErr('planned_start_at') && <div className='invalid-feedback d-block'>{fErr('planned_start_at')}</div>}
              </FormGroup>
            </Col>
            <Col md='3'>
              <FormGroup>
                <Label>Fine pianificata</Label>
                <Input type='datetime-local' lang='it' value={form.planned_end_at ?? ''}
                  onChange={(e) => setF('planned_end_at', e.target.value || null)} />
              </FormGroup>
            </Col>
            <Col md='3'>
              <FormGroup>
                <Label>Inizio effettivo</Label>
                <Input type='datetime-local' lang='it' value={form.actual_start_at ?? ''}
                  onChange={(e) => setF('actual_start_at', e.target.value || null)} />
              </FormGroup>
            </Col>
            <Col md='3'>
              <FormGroup>
                <Label>Fine effettiva</Label>
                <Input type='datetime-local' lang='it' value={form.actual_end_at ?? ''}
                  onChange={(e) => setF('actual_end_at', e.target.value || null)} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Luogo</Label>
                <Input value={form.location ?? ''} onChange={(e) => setF('location', e.target.value || null)}
                  placeholder='es. Sala polivalente, Palestra…' />
              </FormGroup>
            </Col>
            <Col md='3'>
              <FormGroup>
                <Label>Stato</Label>
                <Input type='select' value={form.status} onChange={(e) => setF('status', e.target.value)}>
                  <option value='planned'>Pianificata</option>
                  <option value='in_progress'>In corso</option>
                  <option value='completed'>Completata</option>
                  <option value='cancelled'>Annullata</option>
                </Input>
              </FormGroup>
            </Col>
            <Col md='3'>
              <FormGroup>
                <Label>Riferimento PEI</Label>
                <Input value={form.pei_objective_ref ?? ''} onChange={(e) => setF('pei_objective_ref', e.target.value || null)}
                  placeholder='es. Obiettivo 3.2' />
              </FormGroup>
            </Col>
          </Row>

          {/* ── Blocco 3: Responsabilità e supporto ── */}
          <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-3'>Responsabilità e supporto</h6>
          <Alert color='info' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
            Indica chi segue operativamente l'attività e quale intensità di supporto è necessaria.
          </Alert>
          <Row>
            <Col md='4'>
              <FormGroup>
                <Label>Operatore responsabile</Label>
                <Input type='select' value={form.responsible_staff_member_id ?? ''} onChange={(e) => setF('responsible_staff_member_id', e.target.value ? Number(e.target.value) : null)}>
                  <option value=''>Nessuno</option>
                  {filteredStaff.map((s) => <option key={s.id} value={s.id}>{staffDisplayName(s)}</option>)}
                </Input>
                {filterFacilityId === 0 && <small className='text-muted'>Seleziona prima una struttura per filtrare il personale</small>}
              </FormGroup>
            </Col>
            <Col md='4'>
              <FormGroup>
                <Label>Presenza</Label>
                <Input type='select' value={form.attendance_status ?? ''} onChange={(e) => setF('attendance_status', e.target.value as AttendanceStatus || null)}>
                  <option value=''>Non registrata</option>
                  <option value='present'>Presenza completa</option>
                  <option value='partial'>Presenza parziale</option>
                  <option value='absent'>Assente</option>
                </Input>
              </FormGroup>
            </Col>
            <Col md='4'>
              <FormGroup>
                <Label>Livello di supporto</Label>
                <Input type='select' value={form.support_level ?? ''} onChange={(e) => setF('support_level', e.target.value as SupportLevel || null)}>
                  <option value=''>Non specificato</option>
                  <option value='autonomous'>Autonomia piena</option>
                  <option value='light'>Supporto leggero</option>
                  <option value='medium'>Supporto medio</option>
                  <option value='high'>Supporto elevato</option>
                </Input>
              </FormGroup>
            </Col>
          </Row>

          {/* ── Blocco 4: Logistica ── */}
          <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-3'>Logistica</h6>
          <Alert color='info' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
            Usa questi campi per indicare se l'attività richiede trasporto o materiali da predisporre.
          </Alert>
          <Row>
            <Col md='3'>
              <FormGroup>
                <div className='d-flex align-items-center gap-2'>
                  <Input type='checkbox' id='requires_transport' checked={form.requires_transport ?? false}
                    onChange={(e) => setF('requires_transport', e.target.checked)}
                    style={{ width: 16, height: 16 }} />
                  <Label for='requires_transport' className='mb-0 fw-semibold'>Trasporto richiesto</Label>
                </div>
              </FormGroup>
            </Col>
            <Col md='9'>
              <FormGroup>
                <Label>Materiali necessari</Label>
                <Input value={form.materials_needed ?? ''} onChange={(e) => setF('materials_needed', e.target.value || null)}
                  placeholder='es. Materiale artistico, abbigliamento sportivo…' />
              </FormGroup>
            </Col>
          </Row>

          {/* ── Blocco 5: Esito e follow-up ── */}
          <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-3'>Esito e follow-up</h6>
          <Alert color='info' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
            Se l'attività richiede continuità o verifica successiva, attiva il follow-up e descrivi cosa dovrà essere ripreso.
          </Alert>
          <FormGroup>
            <Label>Note esito</Label>
            <Input type='textarea' rows={2} value={form.outcome_notes ?? ''}
              onChange={(e) => setF('outcome_notes', e.target.value || null)}
              placeholder="Note sull'esito dell'attività (compilare al termine)" />
          </FormGroup>
          <FormGroup>
            <div className='d-flex align-items-center gap-2 mb-2'>
              <Input type='checkbox' id='follow_up_required' checked={form.follow_up_required ?? false}
                onChange={(e) => setF('follow_up_required', e.target.checked)}
                style={{ width: 16, height: 16 }} />
              <Label for='follow_up_required' className='mb-0 fw-semibold'>Follow-up richiesto</Label>
            </div>
            {form.follow_up_required && (
              <Input type='textarea' rows={2} value={form.follow_up_notes ?? ''}
                placeholder='Descrivi cosa dovrà essere verificato o ripreso…'
                onChange={(e) => setF('follow_up_notes', e.target.value || null)} />
            )}
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : editTarget ? 'Aggiorna' : 'Registra'}</Button>
          <Button color='light' onClick={() => setModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modale elimina ── */}
      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)} size='sm'>
        <ModalHeader toggle={() => setDeleteTarget(null)}>Elimina attività</ModalHeader>
        <ModalBody><p>Eliminare <strong>{deleteTarget?.title}</strong>? L'operazione non è reversibile.</p></ModalBody>
        <ModalFooter>
          <Button color='danger' onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminazione…' : 'Elimina'}</Button>
          <Button color='light' onClick={() => setDeleteTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── InfoDrawer ── */}
      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Guida — Attività'>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>A cosa serve questa sezione</h6>
          <p style={{ fontSize: 14, color: '#444' }}>La sezione Attività registra, pianifica e consuntiva le attività educative, ricreative, terapeutiche o organizzative riferite al minore.</p>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Quali dati vengono gestiti</h6>
          <ul style={{ fontSize: 14, color: '#444' }}>
            <li>Tipo attività e minore</li>
            <li>Operatore responsabile</li>
            <li>Date pianificate ed effettive</li>
            <li>Presenza e livello di supporto</li>
            <li>Trasporto e materiali</li>
            <li>Esito e follow-up</li>
          </ul>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Come leggere presenza e supporto</h6>
          <ul style={{ fontSize: 14, color: '#444' }}>
            <li><strong>Presenza completa</strong>: minore ha partecipato per l'intera durata</li>
            <li><strong>Presenza parziale</strong>: partecipazione parziale</li>
            <li><strong>Assente</strong>: il minore non ha partecipato</li>
          </ul>
          <ul style={{ fontSize: 14, color: '#444' }}>
            <li><strong>Autonomia piena</strong>: nessun supporto operativo necessario</li>
            <li><strong>Supporto leggero</strong>: presenza educativa minima</li>
            <li><strong>Supporto medio</strong>: affiancamento attivo</li>
            <li><strong>Supporto elevato</strong>: presenza costante dell'operatore</li>
          </ul>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Quando alcune azioni possono essere bloccate</h6>
          <p style={{ fontSize: 14, color: '#444' }}>L'accesso dipende sia dai permessi di ruolo sia dall'assegnazione al minore, salvo ruoli privilegiati.</p>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Permessi</h6>
          <table className='table table-sm table-bordered' style={{ fontSize: 13 }}>
            <thead className='table-light'><tr><th>Permesso</th><th>Descrizione</th></tr></thead>
            <tbody>
              <tr><td><code>activities.view</code></td><td>Visualizza le attività</td></tr>
              <tr><td><code>activities.create</code></td><td>Crea nuove attività</td></tr>
              <tr><td><code>activities.update</code></td><td>Modifica attività esistenti</td></tr>
                       <tr><td><code>activities.delete</code></td><td>Elimina attività</td></tr>
            </tbody>
          </table>
        </section>
      </InfoDrawer>
    </>
  )
}
