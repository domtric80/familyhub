import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Badge,
} from 'reactstrap'
import { AlertCircle, CheckCircle, Edit2, Home, Info, LogOut, Plus, Trash2, UserPlus, X, XCircle, Clock } from 'react-feather'
import InfoDrawer from '../../components/common/InfoDrawer'
import { toast } from 'react-toastify'
import { apiError, facilityApi, lookupsApi, minorApi, minorExitApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import type {
  ExitAccompanierOptions, ExitAccompanierWrite, ExitAccompanier,
  ExitSummary, Facility, LookupItem, Minor,
  MinorExit, MinorExitStatus, MinorExitUpdate, MinorExitWrite, MinorExitTransition,
  ReturnCondition,
} from '../../types'

// ─── Costanti ────────────────────────────────────────────────────────────────

const PERSON_TYPE_LABEL: Record<string, string> = {
  staff_member: 'Personale struttura', minor_contact: 'Contatto minore', external: 'Esterno',
}
const PERSON_TYPE_BADGE: Record<string, string> = {
  staff_member: 'badge-light-primary', minor_contact: 'badge-light-info', external: 'badge-light-secondary',
}
const RETURN_CONDITION_LABEL: Record<string, string> = {
  regular: 'Regolare', delayed: 'In ritardo', critical: 'Critico',
}
const RETURN_CONDITION_BADGE: Record<string, string> = {
  regular: 'badge-light-success', delayed: 'badge-light-warning', critical: 'badge-light-danger',
}

function accompanierDisplayName(a: ExitAccompanierWrite, options: ExitAccompanierOptions | null): string {
  if (a.person_type === 'staff_member') {
    const s = options?.staff_members.find((m) => m.id === a.staff_member_id)
    return s ? `${s.last_name} ${s.first_name}` : `Staff #${a.staff_member_id ?? '?'}`
  }
  if (a.person_type === 'minor_contact') {
    const c = options?.minor_contacts.find((m) => m.id === a.minor_contact_id)
    return c ? `${c.last_name} ${c.first_name}` : `Contatto #${a.minor_contact_id ?? '?'}`
  }
  return a.external_name ?? ''
}

function accompanierFromResponse(a: ExitAccompanier): string {
  if (a.person_type === 'staff_member' && a.staff_member)
    return `${a.staff_member.last_name} ${a.staff_member.first_name}`
  if (a.person_type === 'minor_contact' && a.minor_contact)
    return `${a.minor_contact.last_name} ${a.minor_contact.first_name}`
  if (a.person_type === 'external') return a.external_name ?? ''
  return a.display_name ?? '—'
}

const EMPTY_FORM: MinorExitWrite = {
  facility_id: 0, minor_id: 0, exit_type_id: 0,
  destination: '', reason: '', authorized_by_user_id: null,
  planned_exit_at: '', expected_return_at: '', outcome_notes: '',
}

const EMPTY_RETURN: MinorExitTransition = {
  actual_return_at: '', return_condition: null,
  follow_up_required: false, follow_up_notes: null, outcome_notes: null,
}

function toDateTimeLocal(v?: string | null) {
  if (!v) return ''
  const d = new Date(v)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
function toApiDateTime(v?: string | null) {
  if (!v) return null
  return new Date(v).toISOString().slice(0, 19).replace('T', ' ')
}
function fmtDt(v?: string | null) {
  if (!v) return '—'
  return new Date(v).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}
function statusBadge(status: MinorExitStatus) {
  const map: Record<MinorExitStatus, { label: string; cls: string }> = {
    planned: { label: 'Pianificata', cls: 'badge-light-primary' },
    out: { label: 'Fuori struttura', cls: 'badge-light-warning' },
    returned: { label: 'Rientrata', cls: 'badge-light-success' },
    cancelled: { label: 'Annullata', cls: 'badge-light-secondary' },
  }
  const item = map[status] ?? { label: status, cls: 'badge-light-secondary' }
  return <Badge color='' className={item.cls}>{item.label}</Badge>
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function UscitePage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('minor_exits.create')
  const canUpdate = hasPermission('minor_exits.update')
  const canDelete = hasPermission('minor_exits.delete')

  const [infoOpen, setInfoOpen] = useState(false)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [items, setItems] = useState<MinorExit[]>([])
  const [minors, setMinors] = useState<Minor[]>([])
  const [exitTypes, setExitTypes] = useState<LookupItem[]>([])
  const [summary, setSummary] = useState<ExitSummary | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // Filtri
  const [filterFacilityId, setFilterFacilityId] = useState(0)
  const [filterMinorId, setFilterMinorId] = useState(0)
  const [filterStatus, setFilterStatus] = useState<MinorExitStatus | ''>('')
  const [filterReturnCondition, setFilterReturnCondition] = useState('')
  const [filterFollowUp, setFilterFollowUp] = useState('')

  // Modal form
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editing, setEditing] = useState<MinorExit | null>(null)
  const [form, setForm] = useState<MinorExitWrite>(EMPTY_FORM)

  // Modal dettaglio
  const [detailItem, setDetailItem] = useState<MinorExit | null>(null)

  // Modal delete
  const [deleteTarget, setDeleteTarget] = useState<MinorExit | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Modal mark-returned
  const [returnTarget, setReturnTarget] = useState<MinorExit | null>(null)
  const [returnForm, setReturnForm] = useState<MinorExitTransition>({ ...EMPTY_RETURN })
  const [returnSaving, setReturnSaving] = useState(false)
  const [returnError, setReturnError] = useState<string | null>(null)

  // Accompagnatori
  const [formAccompaniers, setFormAccompaniers] = useState<ExitAccompanierWrite[]>([])
  const [accompanierOptions, setAccompanierOptions] = useState<ExitAccompanierOptions | null>(null)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [newPersonType, setNewPersonType] = useState<'staff_member' | 'minor_contact' | 'external'>('staff_member')
  const [newStaffId, setNewStaffId] = useState(0)
  const [newContactId, setNewContactId] = useState(0)
  const [newExternalName, setNewExternalName] = useState('')

  // ── Load ────────────────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [loadedFacilities, loadedMinors, loadedExitTypes] = await Promise.all([
        facilityApi.list(), minorApi.list(), lookupsApi.exitTypes(),
      ])
      setFacilities(loadedFacilities); setMinors(loadedMinors); setExitTypes(loadedExitTypes)
      const params: Record<string, number | string | undefined> = {}
      if (filterFacilityId) params.facility_id = filterFacilityId
      if (filterMinorId) params.minor_id = filterMinorId
      if (filterStatus) params.status = filterStatus
      if (filterReturnCondition) params.return_condition = filterReturnCondition
      if (filterFollowUp) params.follow_up_required = filterFollowUp
      setItems(await minorExitApi.list(params as Parameters<typeof minorExitApi.list>[0]))
      // Summary asincrono (non blocca la lista)
      minorExitApi.summary({
        facility_id: filterFacilityId || undefined,
        minor_id: filterMinorId || undefined,
      }).then((r) => setSummary(r.summary)).catch(() => setSummary(null))
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403)
        setError('Il tuo profilo non è abilitato a consultare le Uscite. Contatta un amministratore per verificare il ruolo assegnato.')
      else
        setError(ae.message ?? 'Errore caricamento uscite')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filterFacilityId, filterMinorId, filterStatus, filterReturnCondition, filterFollowUp]) // eslint-disable-line

  useEffect(() => {
    if (!form.minor_id) { setAccompanierOptions(null); return }
    setLoadingOptions(true)
    minorExitApi.getAccompanierOptions(form.minor_id)
      .then(setAccompanierOptions).catch(() => setAccompanierOptions(null))
      .finally(() => setLoadingOptions(false))
  }, [form.minor_id])

  useEffect(() => { setNewStaffId(0); setNewContactId(0); setNewExternalName('') }, [newPersonType])

  const minorsForFacility = useMemo(
    () => minors.filter((m) => !form.facility_id || m.facility_id === form.facility_id),
    [minors, form.facility_id],
  )
  const minorsForFilter = useMemo(
    () => minors.filter((m) => !filterFacilityId || m.facility_id === filterFacilityId),
    [minors, filterFacilityId],
  )

  // ── Accompagnatori ──────────────────────────────────────────────────────────

  const addAccompaniere = () => {
    if (newPersonType === 'staff_member' && !newStaffId) return
    if (newPersonType === 'minor_contact' && !newContactId) return
    if (newPersonType === 'external' && !newExternalName.trim()) return
    const entry: ExitAccompanierWrite = { person_type: newPersonType }
    if (newPersonType === 'staff_member') entry.staff_member_id = newStaffId
    if (newPersonType === 'minor_contact') entry.minor_contact_id = newContactId
    if (newPersonType === 'external') entry.external_name = newExternalName.trim()
    setFormAccompaniers((prev) => [...prev, entry])
    setNewStaffId(0); setNewContactId(0); setNewExternalName('')
  }
  const removeAccompaniere = (idx: number) =>
    setFormAccompaniers((prev) => prev.filter((_, i) => i !== idx))

  // ── Modal handlers ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null); setSaveError(null); setFieldErrors({})
    setFormAccompaniers([]); setAccompanierOptions(null)
    setNewPersonType('staff_member'); setNewStaffId(0); setNewContactId(0); setNewExternalName('')
    setForm({ ...EMPTY_FORM, facility_id: filterFacilityId || facilities[0]?.id || 0 })
    setFormModalOpen(true)
  }
  const openEdit = (item: MinorExit) => {
    setDetailItem(null); setEditing(item); setSaveError(null); setFieldErrors({})
    setNewPersonType('staff_member'); setNewStaffId(0); setNewContactId(0); setNewExternalName('')
    setFormAccompaniers((item.accompaniers ?? []).map((a) => ({
      person_type: a.person_type,
      staff_member_id: a.staff_member_id ?? undefined,
      minor_contact_id: a.minor_contact_id ?? undefined,
      external_name: a.external_name ?? undefined,
    })))
    setForm({
      facility_id: item.facility_id, minor_id: item.minor_id,
      exit_type_id: item.exit_type_id, destination: item.destination,
      reason: item.reason ?? '', authorized_by_user_id: item.authorized_by_user_id ?? null,
      planned_exit_at: toDateTimeLocal(item.planned_exit_at),
      expected_return_at: toDateTimeLocal(item.expected_return_at),
      outcome_notes: item.outcome_notes ?? '',
    })
    setFormModalOpen(true)
  }
  const openReturn = (item: MinorExit) => {
    setDetailItem(null); setReturnTarget(item)
    setReturnForm({ ...EMPTY_RETURN, actual_return_at: toDateTimeLocal(new Date().toISOString()) })
    setReturnError(null); setReturnSaving(false)
  }

  const handleSave = async () => {
    setSaving(true); setSaveError(null); setFieldErrors({})
    try {
      if (editing) {
        const payload: MinorExitUpdate = {
          exit_type_id: form.exit_type_id, destination: form.destination,
          reason: form.reason || null, authorized_by_user_id: form.authorized_by_user_id || null,
          planned_exit_at: toApiDateTime(form.planned_exit_at) ?? '',
          expected_return_at: toApiDateTime(form.expected_return_at),
          outcome_notes: form.outcome_notes || null,
          status: editing.status, accompaniers: formAccompaniers,
        }
        await minorExitApi.update(editing.id, payload)
        toast.success('Uscita aggiornata.')
      } else {
        await minorExitApi.create({
          ...form,
          reason: form.reason || null, authorized_by_user_id: form.authorized_by_user_id || null,
          planned_exit_at: toApiDateTime(form.planned_exit_at) ?? '',
          expected_return_at: toApiDateTime(form.expected_return_at),
          outcome_notes: form.outcome_notes || null, accompaniers: formAccompaniers,
        })
        toast.success('Uscita registrata.')
      }
      setFormModalOpen(false); load()
    } catch (e) {
      const err = apiError(e)
      setSaveError(err.status === 403
        ? 'Operazione non consentita: verifica permessi di ruolo e assegnazione attiva al minore.'
        : (err.message ?? 'Errore salvataggio uscita'))
      setFieldErrors(err.errors ?? {})
    } finally { setSaving(false) }
  }

  const handleMarkOut = async (item: MinorExit) => {
    try {
      await minorExitApi.markOut(item.id)
      toast.success('Uscita marcata come fuori struttura.')
      load()
    } catch (e) { toast.error(apiError(e).message ?? 'Errore aggiornamento stato') }
  }

  const handleMarkReturned = async () => {
    if (!returnTarget) return
    setReturnSaving(true); setReturnError(null)
    try {
      const payload: MinorExitTransition = {
        actual_return_at: toApiDateTime(returnForm.actual_return_at),
        return_condition: returnForm.return_condition || null,
        follow_up_required: returnForm.follow_up_required,
        follow_up_notes: returnForm.follow_up_required ? returnForm.follow_up_notes : null,
        outcome_notes: returnForm.outcome_notes || null,
      }
      await minorExitApi.markReturned(returnTarget.id, payload)
      toast.success('Rientro registrato.')
      setReturnTarget(null); load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 422) setReturnError(ae.message ?? 'Dati non validi. Verifica i campi obbligatori.')
      else setReturnError(ae.message ?? 'Errore registrazione rientro')
    } finally { setReturnSaving(false) }
  }

  const handleCancel = async (item: MinorExit) => {
    const reason = window.prompt('Motivo annullamento uscita:')
    try {
      await minorExitApi.cancel(item.id, { cancellation_reason: reason || null })
      toast.success('Uscita annullata.')
      load()
    } catch (e) { toast.error(apiError(e).message ?? 'Errore annullamento') }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await minorExitApi.delete(deleteTarget.id)
      toast.success('Uscita eliminata.')
      setDeleteTarget(null); load()
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore eliminazione')
    } finally { setDeleting(false) }
  }

  const fieldError = (f: string) => fieldErrors[f]?.[0]
  const canAddAccompaniere =
    (newPersonType === 'staff_member' && newStaffId > 0) ||
    (newPersonType === 'minor_contact' && newContactId > 0) ||
    (newPersonType === 'external' && newExternalName.trim().length > 0)

  const renderAccForm = () => {
    if (newPersonType === 'staff_member') return (
      <select className='form-control form-control-sm' value={newStaffId} onChange={(e) => setNewStaffId(Number(e.target.value))} disabled={loadingOptions || !form.minor_id}>
        <option value={0}>{loadingOptions ? 'Caricamento…' : 'Seleziona personale…'}</option>
        {!form.minor_id && <option disabled>Seleziona prima il minore</option>}
        {(accompanierOptions?.staff_members ?? []).map((s) => (
          <option key={s.id} value={s.id}>{s.last_name} {s.first_name}{s.employee_code ? ` (${s.employee_code})` : ''}</option>
        ))}
      </select>
    )
    if (newPersonType === 'minor_contact') return (
      <select className='form-control form-control-sm' value={newContactId} onChange={(e) => setNewContactId(Number(e.target.value))} disabled={loadingOptions || !form.minor_id}>
        <option value={0}>{loadingOptions ? 'Caricamento…' : 'Seleziona contatto…'}</option>
        {!form.minor_id && <option disabled>Seleziona prima il minore</option>}
        {(accompanierOptions?.minor_contacts ?? []).map((c) => (
          <option key={c.id} value={c.id}>{c.last_name} {c.first_name}{c.contact_type?.name ? ` (${c.contact_type.name})` : ''}</option>
        ))}
      </select>
    )
    return <input className='form-control form-control-sm' placeholder='Nome e cognome…' value={newExternalName} onChange={(e) => setNewExternalName(e.target.value)} />
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <div className='d-flex align-items-center gap-2'>
                <h3 className='mb-0'>Uscite</h3>
                <button className='btn btn-light btn-sm d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
                  <Info size={13} /> Informazioni
                </button>
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item active'>Uscite</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        {/* ── KPI Summary ── */}
        {summary && (
          <Row className='mb-3'>
            {[
              { label: 'Totale', value: summary.total, cls: 'text-primary' },
              { label: 'Pianificate', value: summary.planned, cls: 'text-info' },
              { label: 'Fuori struttura', value: summary.out, cls: 'text-warning' },
              { label: 'Rientrate', value: summary.returned, cls: 'text-success' },
              { label: 'In ritardo', value: summary.overdue_open, cls: summary.overdue_open > 0 ? 'text-danger fw-bold' : 'text-muted', title: 'Uscite ancora aperte oltre il rientro previsto' },
              { label: 'Follow-up', value: summary.follow_up_required, cls: summary.follow_up_required > 0 ? 'text-warning fw-bold' : 'text-muted', title: 'Uscite che richiedono un\'azione successiva' },
              { label: 'Rientri critici', value: summary.critical_returns, cls: summary.critical_returns > 0 ? 'text-danger fw-bold' : 'text-muted', title: 'Rientri classificati come critici' },
            ].map((k) => (
              <Col key={k.label} xs='6' md='3' lg='auto' className='mb-2'>
                <Card className='h-100 text-center py-2 px-3' style={{ minWidth: 110 }}>
                  <div className={`h4 mb-0 ${k.cls}`} title={k.title}>{k.value}</div>
                  <small className='text-muted'>{k.label}</small>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        <Row>
          <Col sm='12'>
            <Card>
              <CardHeader className='d-flex justify-content-between align-items-center'>
                <h5 className='mb-0'>Registro uscite</h5>
                <div className='d-flex align-items-center gap-2'>
                  <small className='text-muted'>{items.length} record</small>
                  {canCreate && (
                    <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
                      <Plus size={13} /> Nuova uscita
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                {/* ── Filtri ── */}
                <div className='py-2 border-bottom mb-3'>
                  <Row className='g-2 align-items-end'>
                    <Col md='3'>
                      <Label className='mb-1 small'>Struttura</Label>
                      <Input type='select' bsSize='sm' value={filterFacilityId}
                        onChange={(e) => { setFilterFacilityId(Number(e.target.value)); setFilterMinorId(0) }}>
                        <option value={0}>Tutte le strutture</option>
                        {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </Input>
                    </Col>
                    <Col md='3'>
                      <Label className='mb-1 small'>Minore</Label>
                      <Input type='select' bsSize='sm' value={filterMinorId}
                        onChange={(e) => setFilterMinorId(Number(e.target.value))}>
                        <option value={0}>Tutti i minori</option>
                        {minorsForFilter.map((m) => (
                          <option key={m.id} value={m.id}>{m.last_name} {m.first_name} ({m.internal_code})</option>
                        ))}
                      </Input>
                    </Col>
                    <Col md='2'>
                      <Label className='mb-1 small'>Stato</Label>
                      <Input type='select' bsSize='sm' value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as MinorExitStatus | '')}>
                        <option value=''>Tutti gli stati</option>
                        <option value='planned'>Pianificata</option>
                        <option value='out'>Fuori struttura</option>
                        <option value='returned'>Rientrata</option>
                        <option value='cancelled'>Annullata</option>
                      </Input>
                    </Col>
                    <Col md='2'>
                      <Label className='mb-1 small'>Esito rientro</Label>
                      <Input type='select' bsSize='sm' value={filterReturnCondition}
                        onChange={(e) => setFilterReturnCondition(e.target.value)}>
                        <option value=''>Tutti</option>
                        <option value='regular'>Regolare</option>
                        <option value='delayed'>In ritardo</option>
                        <option value='critical'>Critico</option>
                      </Input>
                    </Col>
                    <Col md='2'>
                      <Label className='mb-1 small'>Follow-up</Label>
                      <Input type='select' bsSize='sm' value={filterFollowUp}
                        onChange={(e) => setFilterFollowUp(e.target.value)}>
                        <option value=''>Tutti</option>
                        <option value='1'>Richiesto</option>
                        <option value='0'>Non richiesto</option>
                      </Input>
                    </Col>
                  </Row>
                </div>

                {error && <Alert color='danger'>{error}</Alert>}
                {loading ? <div className='text-center py-5'><div className='loader' /></div> : (
                  <div className='table-responsive'>
                    <table className='table table-hover'>
                      <thead className='table-light'>
                        <tr>
                          <th>Minore</th><th>Tipo</th><th>Destinazione</th><th>Accompagnatori</th>
                          <th>Partenza pianif.</th><th>Stato</th><th>Esito rientro</th><th>Follow-up</th><th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 && (
                          <tr><td colSpan={9} className='text-center text-muted py-4'>
                            Nessuna uscita trovata con i filtri selezionati.
                          </td></tr>
                        )}
                        {items.map((item) => (
                          <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setDetailItem(item)}>
                            <td>
                              <div className='fw-semibold small'>{item.minor?.last_name} {item.minor?.first_name}</div>
                              <small className='text-muted'>{item.minor?.internal_code ?? `#${item.minor_id}`}</small>
                            </td>
                            <td className='small'>{item.exit_type?.name ?? `#${item.exit_type_id}`}</td>
                            <td className='small'>{item.destination}</td>
                            <td>
                              {item.accompaniers && item.accompaniers.length > 0 ? (
                                <div className='d-flex flex-column gap-1'>
                                  {item.accompaniers.map((a, i) => (
                                    <div key={i} style={{ fontSize: 12 }}>
                                      <span className={`badge ${PERSON_TYPE_BADGE[a.person_type] ?? 'badge-light-secondary'} me-1`} style={{ fontSize: 10 }}>
                                        {PERSON_TYPE_LABEL[a.person_type] ?? a.person_type}
                                      </span>
                                      {accompanierFromResponse(a)}
                                    </div>
                                  ))}
                                </div>
                              ) : item.accompanied_by ? (
                                <span className='text-muted small'>{item.accompanied_by}</span>
                              ) : <span className='text-muted'>—</span>}
                            </td>
                            <td className='small'>{fmtDt(item.planned_exit_at)}</td>
                            <td>
                              {statusBadge(item.status)}
                              {item.is_overdue && (
                                <div className='mt-1'>
                                  <span className='badge badge-light-danger d-flex align-items-center gap-1' style={{ fontSize: 11 }}>
                                    <Clock size={10} /> In ritardo{item.delay_minutes ? ` (${item.delay_minutes}min)` : ''}
                                  </span>
                                </div>
                              )}
                            </td>
                            <td>
                              {item.return_condition
                                ? <span className={`badge ${RETURN_CONDITION_BADGE[item.return_condition]}`}>{RETURN_CONDITION_LABEL[item.return_condition]}</span>
                                : <span className='text-muted small'>—</span>}
                            </td>
                            <td>
                              {item.follow_up_required
                                ? <span className='badge badge-light-warning'>Sì</span>
                                : <span className='text-muted small'>No</span>}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className='d-flex flex-wrap gap-1'>
                                {canUpdate && (
                                  <button className='btn btn-sm btn-outline-primary' onClick={() => openEdit(item)} title='Modifica'><Edit2 size={12} /></button>
                                )}
                                {canUpdate && item.status === 'planned' && (
                                  <button className='btn btn-sm btn-outline-warning' onClick={() => handleMarkOut(item)} title='Segna partenza'><LogOut size={12} /></button>
                                )}
                                {canUpdate && item.status === 'out' && (
                                  <button className='btn btn-sm btn-outline-success' onClick={() => openReturn(item)} title='Segna rientro'><CheckCircle size={12} /></button>
                                )}
                                {canUpdate && item.status === 'planned' && (
                                  <button className='btn btn-sm btn-outline-secondary' onClick={() => handleCancel(item)} title='Annulla'><XCircle size={12} /></button>
                                )}
                                {canDelete && (
                                  <button className='btn btn-sm btn-outline-danger' onClick={() => setDeleteTarget(item)} title='Elimina'><Trash2 size={12} /></button>
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
          </Col>
        </Row>
      </Container>

      {/* ── Modal dettaglio ── */}
      <Modal isOpen={!!detailItem} toggle={() => setDetailItem(null)} size='lg'>
        <ModalHeader toggle={() => setDetailItem(null)}>Dettaglio uscita #{detailItem?.id}</ModalHeader>
        <ModalBody>
          {detailItem && (
            <Row>
              <Col md='6'>
                <table className='table table-sm table-bordered' style={{ fontSize: 14 }}>
                  <tbody>
                    <tr><th>Minore</th><td>{detailItem.minor?.last_name} {detailItem.minor?.first_name} <small className='text-muted'>({detailItem.minor?.internal_code})</small></td></tr>
                    <tr><th>Struttura</th><td>{detailItem.facility?.name ?? `#${detailItem.facility_id}`}</td></tr>
                    <tr><th>Tipo uscita</th><td>{detailItem.exit_type?.name ?? `#${detailItem.exit_type_id}`}</td></tr>
                    <tr><th>Destinazione</th><td>{detailItem.destination}</td></tr>
                    <tr><th>Partenza pianificata</th><td>{fmtDt(detailItem.planned_exit_at)}</td></tr>
                    <tr><th>Rientro previsto</th><td>{fmtDt(detailItem.expected_return_at)}</td></tr>
                    <tr><th>Partenza effettiva</th><td>{fmtDt(detailItem.actual_exit_at)}</td></tr>
                    <tr><th>Rientro effettivo</th><td>{fmtDt(detailItem.actual_return_at)}</td></tr>
                    <tr><th>Stato</th><td>
                      {statusBadge(detailItem.status)}
                      {detailItem.is_overdue && <span className='badge badge-light-danger ms-1'>In ritardo</span>}
                    </td></tr>
                    {detailItem.return_condition && (
                      <tr><th>Esito rientro</th><td><span className={`badge ${RETURN_CONDITION_BADGE[detailItem.return_condition]}`}>{RETURN_CONDITION_LABEL[detailItem.return_condition]}</span></td></tr>
                    )}
                    {detailItem.status === 'cancelled' && detailItem.cancellation_reason && (
                      <tr><th>Motivo annullamento</th><td className='text-muted'>{detailItem.cancellation_reason}</td></tr>
                    )}
                  </tbody>
                </table>
              </Col>
              <Col md='6'>
                <table className='table table-sm table-bordered' style={{ fontSize: 14 }}>
                  <tbody>
                    <tr><th>Accompagnatori</th><td>
                      {(detailItem.accompaniers && detailItem.accompaniers.length > 0)
                        ? <div className='d-flex flex-column gap-1'>
                            {detailItem.accompaniers.map((a, i) => (
                              <div key={i}>
                                <span className={`badge ${PERSON_TYPE_BADGE[a.person_type] ?? 'badge-light-secondary'} me-1`} style={{ fontSize: 10 }}>
                                  {PERSON_TYPE_LABEL[a.person_type] ?? a.person_type}
                                </span>
                                {accompanierFromResponse(a)}
                              </div>
                            ))}
                          </div>
                        : detailItem.accompanied_by ? <span className='text-muted'>{detailItem.accompanied_by}</span> : '—'}
                    </td></tr>
                    <tr><th>Motivazione</th><td style={{ whiteSpace: 'pre-wrap' }}>{detailItem.reason ?? '—'}</td></tr>
                    <tr><th>Note esito</th><td style={{ whiteSpace: 'pre-wrap' }}>{detailItem.outcome_notes ?? '—'}</td></tr>
                    <tr><th>Follow-up</th><td>
                      {detailItem.follow_up_required
                        ? <><span className='badge badge-light-warning'>Sì</span>{detailItem.follow_up_notes && <p className='small mt-1'>{detailItem.follow_up_notes}</p>}</>
                        : 'No'}
                    </td></tr>
                    {detailItem.delay_minutes != null && (
                      <tr><th>Ritardo</th><td>{detailItem.delay_minutes} minuti</td></tr>
                    )}
                  </tbody>
                </table>
              </Col>
            </Row>
          )}
        </ModalBody>
        <ModalFooter>
          {canUpdate && detailItem && detailItem.status === 'out' && (
            <Button color='success' size='sm' onClick={() => openReturn(detailItem)}><CheckCircle size={13} className='me-1' />Segna rientro</Button>
          )}
          {canUpdate && detailItem && (
            <Button color='primary' size='sm' onClick={() => openEdit(detailItem)}><Edit2 size={12} className='me-1' />Modifica</Button>
          )}
          <Button color='light' onClick={() => setDetailItem(null)}>Chiudi</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal mark-returned ── */}
      <Modal isOpen={!!returnTarget} toggle={() => setReturnTarget(null)} size='md'>
        <ModalHeader toggle={() => setReturnTarget(null)}>
          Registra rientro — {returnTarget?.minor?.last_name} {returnTarget?.minor?.first_name}
        </ModalHeader>
        <ModalBody>
          <Alert color='info' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
            Usa questa finestra per registrare il rientro reale del minore, classificare l'esito del rientro e indicare se servono azioni successive da parte dell'equipe.
          </Alert>
          {returnError && <Alert color='danger'>{returnError}</Alert>}
          <FormGroup>
            <Label>Data/ora rientro effettivo <span className='text-danger'>*</span></Label>
            <Input type='datetime-local' lang='it' value={returnForm.actual_return_at ?? ''}
              onChange={(e) => setReturnForm((p) => ({ ...p, actual_return_at: e.target.value }))} />
          </FormGroup>
          <FormGroup>
            <Label>Esito rientro</Label>
            <Input type='select' value={returnForm.return_condition ?? ''}
              onChange={(e) => setReturnForm((p) => ({ ...p, return_condition: e.target.value as ReturnCondition || null }))}>
              <option value=''>Non classificato</option>
              <option value='regular'>Regolare</option>
              <option value='delayed'>In ritardo</option>
              <option value='critical'>Critico</option>
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Note esito</Label>
            <Input type='textarea' rows={2} value={returnForm.outcome_notes ?? ''}
              onChange={(e) => setReturnForm((p) => ({ ...p, outcome_notes: e.target.value || null }))}
              placeholder="Note sull'esito del rientro…" />
          </FormGroup>
          <FormGroup>
            <div className='d-flex align-items-center gap-2 mb-2'>
              <Input type='checkbox' id='follow_up_return' checked={returnForm.follow_up_required ?? false}
                onChange={(e) => setReturnForm((p) => ({ ...p, follow_up_required: e.target.checked }))}
                style={{ width: 16, height: 16 }} />
              <Label for='follow_up_return' className='mb-0 fw-semibold'>Follow-up richiesto</Label>
            </div>
            {returnForm.follow_up_required && (
              <Input type='textarea' rows={2} value={returnForm.follow_up_notes ?? ''}
                placeholder="Descrivi l'azione richiesta dopo il rientro..."
                onChange={(e) => setReturnForm((p) => ({ ...p, follow_up_notes: e.target.value || null }))} />
            )}
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='success' onClick={handleMarkReturned} disabled={returnSaving}>
            {returnSaving ? 'Registrazione…' : 'Conferma rientro'}
          </Button>
          <Button color='light' onClick={() => setReturnTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal form crea/modifica ── */}
      <Modal isOpen={formModalOpen} toggle={() => setFormModalOpen(false)} size='lg'>
        <ModalHeader toggle={() => setFormModalOpen(false)}>
          {editing ? `Modifica uscita #${editing.id}` : 'Nuova uscita'}
        </ModalHeader>
        <ModalBody>
          {!canCreate && !editing && (
            <Alert color='warning' className='d-flex align-items-center gap-2'>
              <AlertCircle size={16} /> Permessi insufficienti per creare nuove uscite.
            </Alert>
          )}
          {saveError && <Alert color='danger'>{saveError}</Alert>}
          {!editing && (
            <Row>
              <Col md='6'>
                <FormGroup>
                  <Label>Struttura <span className='text-danger'>*</span></Label>
                  <Input type='select' value={form.facility_id} invalid={!!fieldError('facility_id')}
                    onChange={(e) => {
                      const fid = Number(e.target.value)
                      setForm((c) => ({ ...c, facility_id: fid, minor_id: 0 }))
                      setFormAccompaniers([]); setAccompanierOptions(null)
                    }}>
                    <option value={0}>Seleziona struttura…</option>
                    {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </Input>
                  {fieldError('facility_id') && <div className='invalid-feedback d-block'>{fieldError('facility_id')}</div>}
                </FormGroup>
              </Col>
              <Col md='6'>
                <FormGroup>
                  <Label>Minore <span className='text-danger'>*</span></Label>
                  <Input type='select' value={form.minor_id} invalid={!!fieldError('minor_id')}
                    onChange={(e) => { setForm((c) => ({ ...c, minor_id: Number(e.target.value) })); setFormAccompaniers([]) }}>
                    <option value={0}>Seleziona minore…</option>
                    {minorsForFacility.map((m) => (
                      <option key={m.id} value={m.id}>{m.last_name} {m.first_name} ({m.internal_code})</option>
                    ))}
                  </Input>
                  {fieldError('minor_id') && <div className='invalid-feedback d-block'>{fieldError('minor_id')}</div>}
                </FormGroup>
              </Col>
            </Row>
          )}
          {editing && (
            <Alert color='light' className='border mb-3'>
              <strong>Minore:</strong> {editing.minor?.last_name} {editing.minor?.first_name} &nbsp;|&nbsp;
              <strong>Struttura:</strong> {editing.facility?.name ?? `#${editing.facility_id}`}
            </Alert>
          )}
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Tipo uscita <span className='text-danger'>*</span></Label>
                <Input type='select' value={form.exit_type_id} invalid={!!fieldError('exit_type_id')}
                  onChange={(e) => setForm((c) => ({ ...c, exit_type_id: Number(e.target.value) }))}>
                  <option value={0}>Seleziona tipo…</option>
                  {exitTypes.map((et) => <option key={et.id} value={et.id}>{et.name}</option>)}
                </Input>
                {fieldError('exit_type_id') && <div className='invalid-feedback d-block'>{fieldError('exit_type_id')}</div>}
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Destinazione <span className='text-danger'>*</span></Label>
                <Input value={form.destination} invalid={!!fieldError('destination')}
                  onChange={(e) => setForm((c) => ({ ...c, destination: e.target.value }))}
                  placeholder='Es. Scuola, visita medica…' />
                {fieldError('destination') && <div className='invalid-feedback d-block'>{fieldError('destination')}</div>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Partenza pianificata <span className='text-danger'>*</span></Label>
                <Input type='datetime-local' lang='it' value={form.planned_exit_at}
                  invalid={!!fieldError('planned_exit_at')}
                  onChange={(e) => setForm((c) => ({ ...c, planned_exit_at: e.target.value }))} />
                {fieldError('planned_exit_at') && <div className='invalid-feedback d-block'>{fieldError('planned_exit_at')}</div>}
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Rientro previsto</Label>
                <Input type='datetime-local' lang='it' value={form.expected_return_at ?? ''}
                  onChange={(e) => setForm((c) => ({ ...c, expected_return_at: e.target.value }))} />
              </FormGroup>
            </Col>
          </Row>
          {/* Accompagnatori */}
          <FormGroup>
            <Label className='d-flex align-items-center gap-1'><UserPlus size={14} /> Accompagnatori</Label>
            {formAccompaniers.length > 0 && (
              <div className='mb-2 d-flex flex-column gap-1'>
                {formAccompaniers.map((a, idx) => (
                  <div key={idx} className='d-flex align-items-center justify-content-between border rounded px-2 py-1' style={{ background: '#f8f9fa', fontSize: '0.85rem' }}>
                    <div>
                      <span className={`badge ${PERSON_TYPE_BADGE[a.person_type] ?? 'badge-light-secondary'} me-2`} style={{ fontSize: '0.7rem' }}>
                        {PERSON_TYPE_LABEL[a.person_type]}
                      </span>
                      {accompanierDisplayName(a, accompanierOptions)}
                    </div>
                    <button type='button' className='btn btn-link btn-sm p-0 text-danger' onClick={() => removeAccompaniere(idx)}><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className='border rounded p-2'>
              <Row className='g-2 mb-2'>
                <Col md='4'>
                  <Input type='select' bsSize='sm' value={newPersonType}
                    onChange={(e) => setNewPersonType(e.target.value as 'staff_member' | 'minor_contact' | 'external')}>
                    <option value='staff_member'>Personale struttura</option>
                    <option value='minor_contact'>Contatto minore</option>
                    <option value='external'>Soggetto esterno</option>
                  </Input>
                </Col>
                <Col md='8'>{renderAccForm()}</Col>
              </Row>
              <button type='button' className='btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-1'
                onClick={addAccompaniere} disabled={!canAddAccompaniere}>
                <Plus size={14} /> Aggiungi accompagnatore
              </button>
            </div>
          </FormGroup>
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Motivazione</Label>
                <Input type='textarea' rows={3} value={form.reason ?? ''}
                  onChange={(e) => setForm((c) => ({ ...c, reason: e.target.value }))} />
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Note esito</Label>
                <Input type='textarea' rows={3} value={form.outcome_notes ?? ''}
                  onChange={(e) => setForm((c) => ({ ...c, outcome_notes: e.target.value }))} />
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving || (!canCreate && !editing)}>
            {saving ? 'Salvataggio…' : editing ? 'Aggiorna uscita' : 'Registra uscita'}
          </Button>
          <Button color='light' onClick={() => setFormModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal elimina ── */}
      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)} size='sm'>
        <ModalHeader toggle={() => setDeleteTarget(null)}>Elimina uscita</ModalHeader>
        <ModalBody>
          <p>Eliminare l'uscita <strong>#{deleteTarget?.id}</strong> di <strong>{deleteTarget?.minor?.last_name} {deleteTarget?.minor?.first_name}</strong>?</p>
          <small className='text-muted'>L'operazione non è reversibile.</small>
        </ModalBody>
        <ModalFooter>
          <Button color='danger' onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminazione…' : 'Elimina'}</Button>
          <Button color='light' onClick={() => setDeleteTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── InfoDrawer ── */}
      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Guida — Uscite'>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>A cosa serve questa sezione</h6>
          <p style={{ fontSize: 14, color: '#444' }}>La sezione Uscite registra gli spostamenti del minore fuori struttura. Ogni uscita può essere pianificata, segnata come partita, chiusa al rientro oppure annullata. Il sistema evidenzia i ritardi di rientro e consente di marcare eventuali follow-up operativi da completare.</p>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Flusso degli stati</h6>
          <ul style={{ fontSize: 14, color: '#444' }}>
            <li><strong>Pianificata</strong>: uscita registrata, il minore non è ancora partito</li>
            <li><strong>Fuori struttura</strong>: partenza segnata, il minore è fuori</li>
            <li><strong>Rientrata</strong>: rientro registrato con esito</li>
            <li><strong>Annullata</strong>: uscita non effettuata</li>
          </ul>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Ritardi e KPI</h6>
          <ul style={{ fontSize: 14, color: '#444' }}>
            <li><strong>In ritardo</strong>: uscite ancora aperte oltre il rientro previsto</li>
            <li><strong>Follow-up</strong>: uscite che richiedono un'azione successiva</li>
            <li><strong>Rientri critici</strong>: rientri classificati come critici dall'operatore</li>
          </ul>
          <p style={{ fontSize: 13, color: '#666' }}>I KPI sono calcolati dal backend e non dalla UI.</p>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Segna rientro</h6>
          <p style={{ fontSize: 14, color: '#444' }}>La finestra di rientro strutturato permette di registrare ora di rientro, esito (regolare / in ritardo / critico), e attivare il follow-up con note. Se il follow-up è attivo e le note sono vuote, il backend restituisce un errore di validazione.</p>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Permessi</h6>
          <table className='table table-sm table-bordered' style={{ fontSize: 13 }}>
            <thead className='table-light'><tr><th>Permesso</th><th>Descrizione</th></tr></thead>
            <tbody>
              <tr><td><code>minor_exits.view</code></td><td>Visualizza le uscite</td></tr>
              <tr><td><code>minor_exits.create</code></td><td>Registra nuove uscite</td></tr>
              <tr><td><code>minor_exits.update</code></td><td>Modifica uscite e transizioni</td></tr>
              <tr><td><code>minor_exits.delete</code></td><td>Elimina uscite</td></tr>
            </tbody>
          </table>
        </section>
      </InfoDrawer>
    </>
  )
}
