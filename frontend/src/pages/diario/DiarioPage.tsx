import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button,
} from 'reactstrap'
import { Home, Plus, Edit2, Trash2, Info, Clock, CheckSquare } from 'react-feather'
import InfoDrawer from '../../components/common/InfoDrawer'
import { toast } from 'react-toastify'
import { journalApi, facilityApi, minorApi, lookupsApi, apiError } from '../../services/api'
import type { JournalEntry, JournalEntryType, JournalEntryWrite, Facility, Minor, PriorityLevel, MoodLevel, JournalSummary, JournalShift, JournalShiftWrite, JournalShiftClosePayload } from '../../types'

// ─── Costanti ────────────────────────────────────────────────────────────────

const PRIORITY_BADGE: Record<string, string> = {
  green: 'badge-light-success', yellow: 'badge-light-warning', red: 'badge-light-danger',
}
const PRIORITY_LABEL: Record<string, string> = {
  green: 'Ordinaria', yellow: 'Attenzione', red: 'Urgente',
}
const MOOD_LABEL: Record<string, string> = {
  very_negative: 'Molto negativo', negative: 'Negativo', neutral: 'Neutro',
  positive: 'Positivo', very_positive: 'Molto positivo',
}
const MOOD_COLOR: Record<string, string> = {
  very_negative: 'danger', negative: 'warning', neutral: 'secondary',
  positive: 'info', very_positive: 'success',
}

const EMPTY_FORM: JournalEntryWrite = {
  minor_id: 0, journal_entry_type_id: 0, observed_at: '', title: '', content: '',
  follow_up_required: false, follow_up_notes: null,
  priority_level: null, mood_level: null,
  nutrition_summary: null, hygiene_summary: null, sleep_summary: null,
  handover_required: false, handover_notes: null,
  minor_journal_shift_id: null,
}

const EMPTY_SHIFT_FORM: JournalShiftWrite = { facility_id: 0, started_at: '', title: null }
const EMPTY_CLOSE_FORM = { ended_at: '', closing_notes: '' }

function toInputDt(s?: string | null) { return s ? s.slice(0, 16) : '' }
function fmtDt(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function DiarioPage() {
  const [infoOpen, setInfoOpen]     = useState(false)
  const [items, setItems]           = useState<JournalEntry[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [apiMissing, setApiMissing] = useState(false)

  const [facilities, setFacilities]   = useState<Facility[]>([])
  const [minors, setMinors]           = useState<Minor[]>([])
  const [entryTypes, setEntryTypes]   = useState<JournalEntryType[]>([])

  // Filtri
  const [filterFacilityId, setFilterFacilityId]   = useState(0)
  const [filterMinorId, setFilterMinorId]         = useState(0)
  const [filterTypeId, setFilterTypeId]           = useState(0)
  const [filterPriority, setFilterPriority]       = useState('')
  const [filterMood, setFilterMood]               = useState('')
  const [filterHandover, setFilterHandover]       = useState('')
  const [filterSearch, setFilterSearch]           = useState('')
  const [filterHandoverPending, setFilterHandoverPending] = useState(false)
  const [filterDateFrom, setFilterDateFrom]       = useState('')
  const [filterDateTo, setFilterDateTo]           = useState('')
  const [limit, setLimit]                         = useState(50)

  // Modali
  const [modalOpen, setModalOpen]       = useState(false)
  const [editTarget, setEditTarget]     = useState<JournalEntry | null>(null)
  const [form, setForm]                 = useState<JournalEntryWrite>(EMPTY_FORM)
  const [saving, setSaving]             = useState(false)
  const [formMsg, setFormMsg]           = useState<string | null>(null)
  const [fieldErrors, setFieldErrors]   = useState<Record<string, string[]>>({})

  const [detailTarget, setDetailTarget] = useState<JournalEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null)
  const [deleting, setDeleting]         = useState(false)
  const [summary, setSummary]           = useState<JournalSummary | null>(null)

  // Turni diario
  const [shiftsVisible, setShiftsVisible]         = useState(false)
  const [journalShifts, setJournalShifts]         = useState<JournalShift[]>([])
  const [shiftsLoading, setShiftsLoading]         = useState(false)
  const [openShiftModal, setOpenShiftModal]       = useState(false)
  const [shiftForm, setShiftForm]                 = useState<JournalShiftWrite>(EMPTY_SHIFT_FORM)
  const [shiftSaving, setShiftSaving]             = useState(false)
  const [shiftMsg, setShiftMsg]                   = useState<string | null>(null)
  const [closeShiftTarget, setCloseShiftTarget]   = useState<JournalShift | null>(null)
  const [closeShiftForm, setCloseShiftForm]       = useState(EMPTY_CLOSE_FORM)
  const [closeShiftSaving, setCloseShiftSaving]   = useState(false)
  const [closeShiftMsg, setCloseShiftMsg]         = useState<string | null>(null)
  const [formShifts, setFormShifts]               = useState<JournalShift[]>([])
  const [acknowledgingId, setAcknowledgingId]     = useState<number | null>(null)

  // ── Caricamento ────────────────────────────────────────────────
  const load = async () => {
    setLoading(true); setError(null)
    try {
      const params: Record<string, number | string | undefined> = {}
      if (filterFacilityId) params.facility_id = filterFacilityId
      if (filterMinorId) params.minor_id = filterMinorId
      if (filterTypeId) params.journal_entry_type_id = filterTypeId
      if (filterPriority) params.priority_level = filterPriority
      if (filterMood) params.mood_level = filterMood
      if (filterHandover) params.handover_required = filterHandover
      if (filterSearch) params.search = filterSearch
      if (filterHandoverPending) params.handover_pending = 'true'
      const loadedItems = await journalApi.list(params as Parameters<typeof journalApi.list>[0])
      setItems(loadedItems)
      setApiMissing(false)
      // Calcola summary client-side dai dati caricati (fallback se endpoint non disponibile)
      const computedSummary = {
        total: loadedItems.length,
        green: loadedItems.filter((i) => i.priority_level === 'green').length,
        yellow: loadedItems.filter((i) => i.priority_level === 'yellow').length,
        red: loadedItems.filter((i) => i.priority_level === 'red').length,
        follow_up_required: loadedItems.filter((i) => i.follow_up_required && !i.follow_up_notes?.trim()).length,
        handover_required: loadedItems.filter((i) => i.handover_required).length,
        handover_pending: loadedItems.filter((i) => i.handover_required && !i.handover_read_at).length,
        daily_series: [],
      }
      setSummary(computedSummary)
      // Prova anche l'endpoint dedicato (sovrascrive se disponibile)
      const summaryParams: { facility_id?: number; minor_id?: number } = {}
      if (filterFacilityId) summaryParams.facility_id = filterFacilityId
      if (filterMinorId) summaryParams.minor_id = filterMinorId
      journalApi.summary(summaryParams).then(setSummary).catch(() => { /* usa computedSummary */ })
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 404) { setApiMissing(true); setItems([]) }
      else if (ae.status === 403) setError('Il tuo profilo non è abilitato a consultare il Diario educativo. Contatta un amministratore per verificare il ruolo assegnato.')
      else setError(ae.message ?? 'Errore caricamento')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    Promise.all([facilityApi.list(), minorApi.list(), lookupsApi.journalEntryTypes()])
      .then(([facs, mins, types]) => { setFacilities(facs); setMinors(mins); setEntryTypes(types) })
      .catch(() => {})
  }, [])
  useEffect(() => { load() }, [filterFacilityId, filterMinorId, filterTypeId, filterPriority, filterMood, filterHandover, filterSearch, filterHandoverPending]) // eslint-disable-line

  const filteredMinors = filterFacilityId ? minors.filter((m) => m.facility_id === filterFacilityId) : minors

  const displayItems = useMemo(() => {
    let r = [...items]
    if (filterDateFrom) r = r.filter((x) => x.observed_at >= filterDateFrom)
    if (filterDateTo)   r = r.filter((x) => x.observed_at <= filterDateTo + 'T23:59:59')
    r.sort((a, b) => b.observed_at.localeCompare(a.observed_at))
    return r.slice(0, limit)
  }, [items, filterDateFrom, filterDateTo, limit])

  // ── CRUD ───────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null); setForm({ ...EMPTY_FORM }); setFormMsg(null); setFieldErrors({}); setModalOpen(true)
  }
  const openEdit = (item: JournalEntry) => {
    setDetailTarget(null); setEditTarget(item)
    setForm({
      minor_id: item.minor_id, journal_entry_type_id: item.journal_entry_type_id,
      observed_at: toInputDt(item.observed_at), title: item.title, content: item.content,
      follow_up_required: item.follow_up_required, follow_up_notes: item.follow_up_notes ?? null,
      priority_level: item.priority_level ?? null, mood_level: item.mood_level ?? null,
      nutrition_summary: item.nutrition_summary ?? null,
      hygiene_summary: item.hygiene_summary ?? null,
      sleep_summary: item.sleep_summary ?? null,
      handover_required: item.handover_required ?? false,
      handover_notes: item.handover_notes ?? null,
      minor_journal_shift_id: item.minor_journal_shift_id ?? null,
    })
    setFormMsg(null); setFieldErrors({}); setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true); setFormMsg(null); setFieldErrors({})
    try {
      const payload: JournalEntryWrite = {
        ...form,
        follow_up_notes: form.follow_up_required ? form.follow_up_notes : null,
        handover_notes: form.handover_required ? form.handover_notes : null,
        nutrition_summary: form.nutrition_summary || null,
        hygiene_summary: form.hygiene_summary || null,
        sleep_summary: form.sleep_summary || null,
      }
      if (editTarget) { await journalApi.update(editTarget.id, payload); toast.success('Voce aggiornata.') }
      else { await journalApi.create(payload); toast.success('Voce registrata.') }
      setModalOpen(false); load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setFormMsg('Operazione non consentita: verifica permessi e assegnazione al minore.')
      else if (ae.status === 422) { setFieldErrors(ae.errors ?? {}); setFormMsg(ae.message ?? 'Dati non validi.') }
      else setFormMsg(ae.message ?? 'Errore salvataggio')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try { await journalApi.delete(deleteTarget.id); toast.success('Voce eliminata.'); setDeleteTarget(null); load() }
    catch (e) { toast.error(apiError(e).message ?? 'Errore eliminazione') }
    finally { setDeleting(false) }
  }

  const fErr = (f: string) => fieldErrors[f]?.[0]
  const setF = <K extends keyof JournalEntryWrite>(k: K, v: JournalEntryWrite[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  // ── Turni diario ───────────────────────────────────────────────
  const loadShifts = async () => {
    setShiftsLoading(true)
    try {
      const shifts = await journalApi.listShifts(filterFacilityId ? { facility_id: filterFacilityId } : undefined)
      setJournalShifts(shifts)
    } catch { /* silent */ }
    finally { setShiftsLoading(false) }
  }

  const handleOpenShift = async () => {
    if (!shiftForm.facility_id || !shiftForm.started_at) { setShiftMsg('Struttura e orario inizio sono obbligatori.'); return }
    setShiftSaving(true); setShiftMsg(null)
    try {
      await journalApi.openShift(shiftForm)
      toast.success('Turno aperto.')
      setOpenShiftModal(false)
      setShiftForm(EMPTY_SHIFT_FORM)
      loadShifts()
    } catch (e) { setShiftMsg(apiError(e).message ?? 'Errore apertura turno') }
    finally { setShiftSaving(false) }
  }

  const handleCloseShift = async () => {
    if (!closeShiftTarget || !closeShiftForm.ended_at) { setCloseShiftMsg('Orario di chiusura obbligatorio.'); return }
    setCloseShiftSaving(true); setCloseShiftMsg(null)
    const payload: JournalShiftClosePayload = {
      ended_at: closeShiftForm.ended_at,
      closing_notes: closeShiftForm.closing_notes || null,
    }
    try {
      await journalApi.closeShift(closeShiftTarget.id, payload)
      toast.success('Turno chiuso e firmato con firma applicativa.')
      setCloseShiftTarget(null)
      setCloseShiftForm(EMPTY_CLOSE_FORM)
      loadShifts(); load()
    } catch (e) { setCloseShiftMsg(apiError(e).message ?? 'Errore chiusura turno') }
    finally { setCloseShiftSaving(false) }
  }

  const handleAcknowledge = async (journalId: number) => {
    setAcknowledgingId(journalId)
    try {
      await journalApi.acknowledgeHandover(journalId)
      toast.success('Presa visione registrata.')
      load()
    } catch (e) { toast.error(apiError(e).message ?? 'Errore presa visione') }
    finally { setAcknowledgingId(null) }
  }

  // Carica turni quando il pannello viene mostrato o la struttura cambia
  useEffect(() => { if (shiftsVisible) loadShifts() }, [shiftsVisible, filterFacilityId]) // eslint-disable-line

  // Carica turni aperti per il form (basati sul minore selezionato)
  useEffect(() => {
    if (!form.minor_id || !modalOpen) { setFormShifts([]); return }
    const m = minors.find((x) => x.id === form.minor_id)
    if (!m?.facility_id) { setFormShifts([]); return }
    journalApi.listShifts({ facility_id: m.facility_id, status: 'open' }).then(setFormShifts).catch(() => setFormShifts([]))
  }, [form.minor_id, modalOpen]) // eslint-disable-line

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <div className='d-flex align-items-center gap-2'>
                <h3 className='mb-0'>Diario educativo</h3>
                <button className='btn btn-light btn-sm d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
                  <Info size={13} /> Informazioni
                </button>
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item active'>Diario educativo</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        {apiMissing && (
          <Alert color='warning' className='mb-3'>Il modulo Diario non è ancora disponibile sul backend.</Alert>
        )}
        {summary && (
          <Row className='mb-3'>
            {[
              { label: 'Totale voci', value: summary.total, color: 'primary' },
              { label: 'Priorità ordinaria', value: summary.green, color: 'success' },
              { label: 'Priorità attenzione', value: summary.yellow, color: 'warning' },
              { label: 'Priorità urgente', value: summary.red, color: 'danger' },
              { label: 'Follow-up aperti', value: summary.follow_up_required, color: 'info' },
              { label: 'Handover richiesti', value: summary.handover_required, color: 'secondary' },
              { label: 'Handover in attesa', value: summary.handover_pending, color: summary.handover_pending > 0 ? 'danger' : 'secondary' },
            ].map((k) => (
              <Col key={k.label} xs='6' sm='4' md='3' lg='auto' className='mb-2' style={{ minWidth: 130 }}>
                <Card className='h-100 text-center'>
                  <CardBody className='p-2'>
                    <div className={`h4 mb-0 text-${k.color}`}>{k.value}</div>
                    <small className='text-muted'>{k.label}</small>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        )}
        <Row><Col sm='12'>
          <Card>
            <CardHeader className='d-flex justify-content-between align-items-center'>
              <h5 className='mb-0'>Registro diario</h5>
              <div className='d-flex align-items-center gap-2'>
                <small className='text-muted'>{displayItems.length}/{items.length} record</small>
                <Button color={shiftsVisible ? 'secondary' : 'light'} size='sm' className='d-flex align-items-center gap-1' onClick={() => setShiftsVisible((v) => !v)}>
                  <Clock size={13} /> Turni
                </Button>
                <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
                  <Plus size={13} /> Nuova voce
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
                    <Label className='mb-1 small'>Tipologia</Label>
                    <Input type='select' bsSize='sm' value={filterTypeId} onChange={(e) => setFilterTypeId(Number(e.target.value))}>
                      <option value={0}>Tutte le tipologie</option>
                      {entryTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Input>
                  </Col>
                  <Col md='3'>
                    <Label className='mb-1 small'>Priorità</Label>
                    <Input type='select' bsSize='sm' value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                      <option value=''>Tutte</option>
                      <option value='green'>Ordinaria</option>
                      <option value='yellow'>Attenzione</option>
                      <option value='red'>Urgente</option>
                    </Input>
                  </Col>
                </Row>
                <Row className='g-2 align-items-end mt-1'>
                  <Col md='3'>
                    <Label className='mb-1 small'>Umore</Label>
                    <Input type='select' bsSize='sm' value={filterMood} onChange={(e) => setFilterMood(e.target.value)}>
                      <option value=''>Tutti</option>
                      <option value='very_negative'>Molto negativo</option>
                      <option value='negative'>Negativo</option>
                      <option value='neutral'>Neutro</option>
                      <option value='positive'>Positivo</option>
                      <option value='very_positive'>Molto positivo</option>
                    </Input>
                  </Col>
                  <Col md='3'>
                    <Label className='mb-1 small'>Handover</Label>
                    <Input type='select' bsSize='sm' value={filterHandover} onChange={(e) => setFilterHandover(e.target.value)}>
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
                <Row className='g-2 align-items-end mt-1'>
                  <Col md='6'>
                    <Label className='mb-1 small'>Ricerca testo</Label>
                    <Input bsSize='sm' placeholder='Cerca per titolo o contenuto…' value={filterSearch}
                      onChange={(e) => setFilterSearch(e.target.value)} />
                  </Col>
                  <Col md='3' className='d-flex align-items-center gap-2' style={{ paddingTop: 22 }}>
                    <Input type='checkbox' id='filterHandoverPending' checked={filterHandoverPending}
                      onChange={(e) => setFilterHandoverPending(e.target.checked)}
                      style={{ width: 15, height: 15 }} />
                    <Label for='filterHandoverPending' className='mb-0 small'>Solo handover in attesa</Label>
                  </Col>
                  <Col md='3' className='d-flex align-items-end'>
                    <Button size='sm' color='light' onClick={() => { setFilterSearch(''); setFilterHandoverPending(false) }}>Azzera ricerca</Button>
                  </Col>
                </Row>
              </div>

              {/* ── Pannello turni ── */}
              {shiftsVisible && (
                <div className='mb-3 p-3 border rounded bg-light'>
                  <div className='d-flex justify-content-between align-items-center mb-2'>
                    <strong><Clock size={14} className='me-1' />Turni diario operativi</strong>
                    <Button size='sm' color='primary' className='d-flex align-items-center gap-1' onClick={() => { setShiftForm({ ...EMPTY_SHIFT_FORM, facility_id: filterFacilityId || 0 }); setShiftMsg(null); setOpenShiftModal(true) }}>
                      <Plus size={12} /> Apri turno
                    </Button>
                  </div>
                  {shiftsLoading ? <div className='text-center py-2'><div className='loader' /></div> : (
                    journalShifts.length === 0
                      ? <p className='text-muted small mb-0'>Nessun turno trovato. Usa il filtro struttura per vedere i turni di una struttura specifica.</p>
                      : <div className='table-responsive'>
                          <table className='table table-sm table-hover mb-0'>
                            <thead className='table-light'>
                              <tr>
                                <th>Struttura</th><th>Titolo</th><th>Inizio</th><th>Fine</th><th>Voci</th><th>Stato</th><th>Azioni</th>
                              </tr>
                            </thead>
                            <tbody>
                              {journalShifts.map((s) => (
                                <tr key={s.id}>
                                  <td className='small'>{s.facility?.name ?? '—'}</td>
                                  <td className='small'>{s.title ?? `Turno #${s.id}`}</td>
                                  <td className='small'>{fmtDt(s.started_at)}</td>
                                  <td className='small'>{s.closed_at ? fmtDt(s.closed_at) : '—'}</td>
                                  <td className='small'>{s.entries_count ?? 0}</td>
                                  <td>
                                    {s.closed_at
                                      ? <span className='badge badge-light-success'>Chiuso e firmato</span>
                                      : <span className='badge badge-light-warning'>Aperto</span>}
                                  </td>
                                  <td>
                                    {!s.closed_at && (
                                      <Button size='sm' color='danger' className='d-flex align-items-center gap-1'
                                        onClick={() => { setCloseShiftTarget(s); setCloseShiftForm(EMPTY_CLOSE_FORM); setCloseShiftMsg(null) }}>
                                        <CheckSquare size={12} /> Chiudi
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                  )}
                </div>
              )}

              {error && <Alert color='danger'>{error}</Alert>}
              {loading ? <div className='text-center py-5'><div className='loader' /></div> : (
                <div className='table-responsive'>
                  <table className='table table-hover'>
                    <thead className='table-light'>
                      <tr>
                        <th>Data/ora obs.</th><th>Minore</th><th>Tipologia</th><th>Titolo</th>
                        <th>Priorità</th><th>Umore</th><th>Follow-up</th><th>Handover</th><th>Autore</th><th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayItems.length === 0 && (
                        <tr><td colSpan={10} className='text-center text-muted py-4'>
                          Non risultano ancora voci diario per i filtri selezionati.
                        </td></tr>
                      )}
                      {displayItems.map((item) => (
                        <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setDetailTarget(item)}>
                          <td className='small'>{fmtDt(item.observed_at)}</td>
                          <td className='small'>
                            <div className='fw-semibold'>{item.minor?.last_name} {item.minor?.first_name}</div>
                            <small className='text-muted'>{item.minor?.internal_code}</small>
                          </td>
                          <td className='small'>{item.journal_entry_type?.name ?? '—'}</td>
                          <td className='small'>
                            {item.title}
                            {item.journal_shift?.closed_at && (
                              <span className='badge badge-light-success ms-1' style={{ fontSize: 10 }}>Turno chiuso</span>
                            )}
                          </td>
                          <td>
                            {item.priority_level
                              ? <span className={`badge ${PRIORITY_BADGE[item.priority_level]}`}>{PRIORITY_LABEL[item.priority_level]}</span>
                              : <span className='text-muted small'>—</span>}
                          </td>
                          <td>
                            {item.mood_level
                              ? <span className={`badge badge-light-${MOOD_COLOR[item.mood_level]}`}>{MOOD_LABEL[item.mood_level]}</span>
                              : <span className='text-muted small'>—</span>}
                          </td>
                          <td>
                            {item.follow_up_required
                              ? <span className='badge badge-light-warning'>Sì</span>
                              : <span className='text-muted small'>No</span>}
                          </td>
                          <td>
                            {item.handover_required
                              ? item.handover_read_at
                                ? <span className='badge badge-light-success'>Letto</span>
                                : <span className='badge badge-light-danger'>In attesa</span>
                              : <span className='text-muted small'>—</span>}
                          </td>
                          <td className='small text-muted'>{item.created_by?.display_name ?? '—'}</td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className='d-flex gap-1 align-items-center flex-wrap'>
                              {item.handover_required && !item.handover_read_at && (
                                <Button color='info' size='sm' className='d-flex align-items-center gap-1'
                                  disabled={acknowledgingId === item.id}
                                  onClick={() => handleAcknowledge(item.id)}
                                  title='Registra presa visione'>
                                  <CheckSquare size={12} />
                                </Button>
                              )}
                              <Button color='light' size='sm'
                                disabled={!!item.journal_shift?.closed_at}
                                title={item.journal_shift?.closed_at ? 'Turno chiuso — voce non modificabile' : 'Modifica'}
                                onClick={() => openEdit(item)}>
                                <Edit2 size={12} />
                              </Button>
                              <Button color='light' size='sm'
                                disabled={!!item.journal_shift?.closed_at}
                                title={item.journal_shift?.closed_at ? 'Turno chiuso — voce non eliminabile' : 'Elimina'}
                                onClick={() => setDeleteTarget(item)}>
                                <Trash2 size={12} />
                              </Button>
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

      {/* ── Modale dettaglio ── */}
      {detailTarget && (
        <Modal isOpen={!!detailTarget} toggle={() => setDetailTarget(null)} size='lg'>
          <ModalHeader toggle={() => setDetailTarget(null)}>
            Voce diario — {detailTarget.minor?.last_name} {detailTarget.minor?.first_name}
          </ModalHeader>
          <ModalBody>
            <Row>
              <Col md='6'><strong>Data/ora:</strong> {fmtDt(detailTarget.observed_at)}</Col>
              <Col md='6'><strong>Tipologia:</strong> {detailTarget.journal_entry_type?.name ?? '—'}</Col>
            </Row>
            <Row className='mt-2'>
              <Col md='6'>
                {detailTarget.priority_level && (
                  <><strong>Priorità:</strong> <span className={`badge ms-1 ${PRIORITY_BADGE[detailTarget.priority_level]}`}>{PRIORITY_LABEL[detailTarget.priority_level]}</span></>
                )}
              </Col>
              <Col md='6'>
                {detailTarget.mood_level && (
                  <><strong>Umore:</strong> <span className={`badge ms-1 badge-light-${MOOD_COLOR[detailTarget.mood_level]}`}>{MOOD_LABEL[detailTarget.mood_level]}</span></>
                )}
              </Col>
            </Row>
            <p className='mt-2'><strong>Titolo:</strong> {detailTarget.title}</p>
            <div className='mt-2 p-2 bg-light rounded' style={{ whiteSpace: 'pre-wrap', fontSize: 14, color: '#7366ff' }}>{detailTarget.content}</div>

            {/* Registro turno */}
            {(detailTarget.nutrition_summary || detailTarget.hygiene_summary || detailTarget.sleep_summary) && (
              <div className='mt-3'>
                <strong>Registro turno</strong>
                <Row className='mt-1'>
                  {detailTarget.nutrition_summary && <Col md='4'><small><strong>Alimentazione:</strong></small><p className='small'>{detailTarget.nutrition_summary}</p></Col>}
                  {detailTarget.hygiene_summary && <Col md='4'><small><strong>Igiene:</strong></small><p className='small'>{detailTarget.hygiene_summary}</p></Col>}
                  {detailTarget.sleep_summary && <Col md='4'><small><strong>Sonno:</strong></small><p className='small'>{detailTarget.sleep_summary}</p></Col>}
                </Row>
              </div>
            )}

            {/* Follow-up */}
            {detailTarget.follow_up_required && (
              <div className='mt-3 p-2 border-start border-warning border-3 ps-3'>
                <strong>Follow-up richiesto</strong>
                {detailTarget.follow_up_notes && <p className='small mt-1'>{detailTarget.follow_up_notes}</p>}
              </div>
            )}

            {/* Turno diario */}
            {detailTarget.journal_shift && (
              <div className='mt-3 p-2 border-start border-secondary border-3 ps-3'>
                <strong><Clock size={13} className='me-1' />Turno diario</strong>
                {detailTarget.journal_shift.closed_at
                  ? <span className='badge badge-light-success ms-2'>Turno chiuso e firmato</span>
                  : <span className='badge badge-light-warning ms-2'>Turno aperto</span>}
                {detailTarget.journal_shift.title && <p className='small mt-1 mb-0'>{detailTarget.journal_shift.title}</p>}
                <div className='small text-muted mt-1'>Inizio: {fmtDt(detailTarget.journal_shift.started_at)}</div>
                {detailTarget.journal_shift.closed_at && <div className='small text-muted'>Fine: {fmtDt(detailTarget.journal_shift.closed_at)}</div>}
              </div>
            )}

            {/* Handover */}
            {detailTarget.handover_required && (
              <div className='mt-3 p-2 border-start border-info border-3 ps-3'>
                <strong>Passaggio consegne</strong>
                {detailTarget.handover_read_at
                  ? <span className='badge badge-light-success ms-2'>Presa visione registrata</span>
                  : <span className='badge badge-light-danger ms-2'>Presa visione in attesa</span>}
                {detailTarget.handover_notes && <p className='small mt-1'>{detailTarget.handover_notes}</p>}
                {detailTarget.handover_read_at && <div className='small text-muted'>Letto il: {fmtDt(detailTarget.handover_read_at)}</div>}
                {detailTarget.handover_read_by && <div className='small text-muted'>Da: {detailTarget.handover_read_by.display_name}</div>}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {detailTarget.handover_required && !detailTarget.handover_read_at && (
              <Button color='info' className='d-flex align-items-center gap-1 me-auto'
                disabled={acknowledgingId === detailTarget.id}
                onClick={() => { handleAcknowledge(detailTarget.id); setDetailTarget(null) }}>
                <CheckSquare size={13} /> Prendi visione
              </Button>
            )}
            <Button color='primary' disabled={!!detailTarget.journal_shift?.closed_at} onClick={() => openEdit(detailTarget)}>
              <Edit2 size={13} className='me-1' />Modifica
            </Button>
            <Button color='light' onClick={() => setDetailTarget(null)}>Chiudi</Button>
          </ModalFooter>
        </Modal>
      )}

      {/* ── Modale form ── */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size='xl'>
        <ModalHeader toggle={() => setModalOpen(false)}>
          {editTarget ? 'Modifica voce diario' : 'Nuova voce diario'}
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
                  {(filterFacilityId ? filteredMinors : minors).map((m) => (
                    <option key={m.id} value={m.id}>{m.last_name} {m.first_name} ({m.internal_code})</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Tipologia <span className='text-danger'>*</span></Label>
                <Input type='select' value={form.journal_entry_type_id} invalid={!!fErr('journal_entry_type_id')}
                  onChange={(e) => setF('journal_entry_type_id', Number(e.target.value))}>
                  <option value={0}>Seleziona tipologia…</option>
                  {entryTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Data/ora osservazione <span className='text-danger'>*</span></Label>
                <Input type='datetime-local' lang='it' value={form.observed_at} invalid={!!fErr('observed_at')}
                  onChange={(e) => setF('observed_at', e.target.value)} />
                {fErr('observed_at') && <div className='invalid-feedback d-block'>{fErr('observed_at')}</div>}
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Titolo <span className='text-danger'>*</span></Label>
                <Input value={form.title} invalid={!!fErr('title')}
                  onChange={(e) => setF('title', e.target.value)} placeholder='Es. Osservazione pomeridiana' />
                {fErr('title') && <div className='invalid-feedback d-block'>{fErr('title')}</div>}
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label>Contenuto <span className='text-danger'>*</span></Label>
            <Input type='textarea' rows={5} value={form.content} invalid={!!fErr('content')}
              onChange={(e) => setF('content', e.target.value)}
              placeholder="Descrivi l'osservazione o l'evento registrato…" />
            {fErr('content') && <div className='invalid-feedback d-block'>{fErr('content')}</div>}
          </FormGroup>

          {/* ── Blocco 2: Priorità e contesto ── */}
          <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-3'>Priorità e contesto</h6>
          <Alert color='info' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
            Seleziona la priorità operativa della voce e l'umore osservato nel minore.
          </Alert>
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Priorità operativa</Label>
                <Input type='select' value={form.priority_level ?? ''} onChange={(e) => setF('priority_level', e.target.value as PriorityLevel || null)}>
                  <option value=''>Non specificata</option>
                  <option value='green'>Ordinaria</option>
                  <option value='yellow'>Attenzione</option>
                  <option value='red'>Urgente</option>
                </Input>
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Umore osservato</Label>
                <Input type='select' value={form.mood_level ?? ''} onChange={(e) => setF('mood_level', e.target.value as MoodLevel || null)}>
                  <option value=''>Non rilevato</option>
                  <option value='very_negative'>Molto negativo</option>
                  <option value='negative'>Negativo</option>
                  <option value='neutral'>Neutro</option>
                  <option value='positive'>Positivo</option>
                  <option value='very_positive'>Molto positivo</option>
                </Input>
              </FormGroup>
            </Col>
          </Row>

          {/* ── Blocco 3: Registro turno ── */}
          <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-3'>Registro turno</h6>
          <Alert color='info' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
            Compila questi campi quando vuoi trasformare la voce in una registrazione più strutturata del turno educativo.
          </Alert>
          <FormGroup>
            <Label>Turno diario <small className='text-muted'>(opzionale)</small></Label>
            <Input type='select' value={form.minor_journal_shift_id ?? ''} onChange={(e) => setF('minor_journal_shift_id', e.target.value ? Number(e.target.value) : null)}>
              <option value=''>Nessun turno associato</option>
              {formShifts.map((s) => (
                <option key={s.id} value={s.id}>{s.title ?? `Turno #${s.id}`} — aperto {fmtDt(s.started_at)}</option>
              ))}
            </Input>
            {formShifts.length === 0 && form.minor_id > 0 && (
              <small className='text-muted'>Nessun turno aperto per la struttura di questo minore.</small>
            )}
            {form.minor_id === 0 && (
              <small className='text-muted'>Seleziona prima il minore per vedere i turni disponibili.</small>
            )}
          </FormGroup>
          <Row>
            <Col md='4'>
              <FormGroup>
                <Label>Alimentazione</Label>
                <Input type='textarea' rows={2} value={form.nutrition_summary ?? ''} onChange={(e) => setF('nutrition_summary', e.target.value || null)} placeholder='Note pasto…' />
              </FormGroup>
            </Col>
            <Col md='4'>
              <FormGroup>
                <Label>Igiene</Label>
                <Input type='textarea' rows={2} value={form.hygiene_summary ?? ''} onChange={(e) => setF('hygiene_summary', e.target.value || null)} placeholder='Note igiene…' />
              </FormGroup>
            </Col>
            <Col md='4'>
              <FormGroup>
                <Label>Sonno</Label>
                <Input type='textarea' rows={2} value={form.sleep_summary ?? ''} onChange={(e) => setF('sleep_summary', e.target.value || null)} placeholder='Note sonno…' />
              </FormGroup>
            </Col>
          </Row>

          {/* ── Blocco 4: Follow-up ── */}
          <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-3'>Follow-up</h6>
          <Alert color='info' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
            Se richiedi un follow-up, devi spiegare cosa dovrà essere verificato o ripreso.
          </Alert>
          <FormGroup>
            <div className='d-flex align-items-center gap-2 mb-2'>
              <Input type='checkbox' id='follow_up_required' checked={form.follow_up_required}
                onChange={(e) => setF('follow_up_required', e.target.checked)}
                style={{ width: 16, height: 16 }} />
              <Label for='follow_up_required' className='mb-0 fw-semibold'>Follow-up richiesto</Label>
            </div>
            {form.follow_up_required && (
              <Input type='textarea' rows={2} value={form.follow_up_notes ?? ''} placeholder='Descrivi cosa dovrà essere verificato o ripreso…'
                onChange={(e) => setF('follow_up_notes', e.target.value || null)} />
            )}
          </FormGroup>

          {/* ── Blocco 5: Handover ── */}
          <h6 className='fw-bold text-muted border-bottom pb-1 mb-2 mt-3'>Passaggio consegne</h6>
          <Alert color='info' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
            Usa questa area per formalizzare il passaggio di consegne e l'eventuale presa visione.
          </Alert>
          <FormGroup>
            <div className='d-flex align-items-center gap-2 mb-2'>
              <Input type='checkbox' id='handover_required' checked={form.handover_required ?? false}
                onChange={(e) => setF('handover_required', e.target.checked)}
                style={{ width: 16, height: 16 }} />
              <Label for='handover_required' className='mb-0 fw-semibold'>Passaggio consegne richiesto</Label>
            </div>
            {form.handover_required && (
              <FormGroup>
                <Label>Note handover <span className='text-danger'>*</span></Label>
                <Input type='textarea' rows={2} value={form.handover_notes ?? ''} placeholder='Indica cosa deve essere passato al turno successivo…'
                  onChange={(e) => setF('handover_notes', e.target.value || null)} />
              </FormGroup>
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
        <ModalHeader toggle={() => setDeleteTarget(null)}>Elimina voce diario</ModalHeader>
        <ModalBody><p>Eliminare la voce <strong>{deleteTarget?.title}</strong>? L'operazione non è reversibile.</p></ModalBody>
        <ModalFooter>
          <Button color='danger' onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminazione…' : 'Elimina'}</Button>
          <Button color='light' onClick={() => setDeleteTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modale apri turno ── */}
      <Modal isOpen={openShiftModal} toggle={() => setOpenShiftModal(false)} size='md'>
        <ModalHeader toggle={() => setOpenShiftModal(false)}>Apri turno diario</ModalHeader>
        <ModalBody>
          {shiftMsg && <Alert color='danger'>{shiftMsg}</Alert>}
          <FormGroup>
            <Label>Struttura <span className='text-danger'>*</span></Label>
            <Input type='select' value={shiftForm.facility_id}
              onChange={(e) => setShiftForm((f) => ({ ...f, facility_id: Number(e.target.value) }))}>
              <option value={0}>Seleziona struttura…</option>
              {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Titolo turno <small className='text-muted'>(opzionale)</small></Label>
            <Input value={shiftForm.title ?? ''} placeholder='Es. Turno mattino, Turno notte…'
              onChange={(e) => setShiftForm((f) => ({ ...f, title: e.target.value || null }))} />
          </FormGroup>
          <FormGroup>
            <Label>Orario inizio <span className='text-danger'>*</span></Label>
            <Input type='datetime-local' lang='it' value={shiftForm.started_at}
              onChange={(e) => setShiftForm((f) => ({ ...f, started_at: e.target.value }))} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleOpenShift} disabled={shiftSaving}>{shiftSaving ? 'Apertura…' : 'Apri turno'}</Button>
          <Button color='light' onClick={() => setOpenShiftModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modale chiudi turno ── */}
      <Modal isOpen={!!closeShiftTarget} toggle={() => setCloseShiftTarget(null)} size='md'>
        <ModalHeader toggle={() => setCloseShiftTarget(null)}>Chiudi turno — firma applicativa</ModalHeader>
        <ModalBody>
          {closeShiftMsg && <Alert color='danger'>{closeShiftMsg}</Alert>}
          <Alert color='info' className='py-2 px-3' style={{ fontSize: 13 }}>
            La chiusura turno applica una <strong>firma applicativa</strong> (authenticated_application_signature). Dopo la chiusura, le voci collegate non saranno più modificabili o eliminabili.
          </Alert>
          <FormGroup>
            <Label>Orario di chiusura <span className='text-danger'>*</span></Label>
            <Input type='datetime-local' lang='it' value={closeShiftForm.ended_at}
              onChange={(e) => setCloseShiftForm((f) => ({ ...f, ended_at: e.target.value }))} />
          </FormGroup>
          <FormGroup>
            <Label>Note di chiusura <small className='text-muted'>(opzionale)</small></Label>
            <Input type='textarea' rows={3} value={closeShiftForm.closing_notes}
              placeholder='Situazione al termine del turno, indicazioni per il turno successivo…'
              onChange={(e) => setCloseShiftForm((f) => ({ ...f, closing_notes: e.target.value }))} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='danger' onClick={handleCloseShift} disabled={closeShiftSaving}>{closeShiftSaving ? 'Chiusura…' : 'Chiudi e firma'}</Button>
          <Button color='light' onClick={() => setCloseShiftTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── InfoDrawer ── */}
      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Guida — Diario educativo'>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>A cosa serve questa sezione</h6>
          <p style={{ fontSize: 14, color: '#444' }}>Questa sezione raccoglie osservazioni educative, eventi del turno, segnalazioni di attenzione e passaggi di consegne relativi al minore.</p>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Quali dati vengono gestiti</h6>
          <ul style={{ fontSize: 14, color: '#444' }}>
            <li>Data e ora dell'osservazione, titolo e contenuto</li>
            <li>Priorità operativa e umore osservato</li>
            <li>Alimentazione, igiene, sonno (registro turno)</li>
            <li>Follow-up e passaggio consegne</li>
          </ul>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Come usare la priorità</h6>
          <ul style={{ fontSize: 14, color: '#444' }}>
            <li><strong>Ordinaria</strong>: nessuna urgenza</li>
            <li><strong>Attenzione</strong>: richiede monitoraggio</li>
            <li><strong>Urgente</strong>: richiede intervento tempestivo</li>
          </ul>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Follow-up e handover</h6>
          <p style={{ fontSize: 14, color: '#444' }}>Attiva il follow-up quando la voce richiede un controllo successivo. Usa il passaggio consegne per informare formalmente il turno successivo.</p>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Turni diario</h6>
          <p style={{ fontSize: 14, color: '#444' }}>Usa il pannello "Turni" per aprire e chiudere turni operativi. Alla chiusura viene applicata una firma applicativa automatica. Le voci collegate a un turno chiuso non sono più modificabili o eliminabili.</p>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Stato funzionale</h6>
          <div className='alert alert-info py-2 px-3' style={{ fontSize: 13 }}>
            <strong>Modulo v3 funzionale.</strong> Funzioni supportate: voci strutturate, priorità, umore, follow-up, passaggio consegne con presa visione, turni diario con firma applicativa, ricerca full-text, filtro handover in attesa.
          </div>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Permessi</h6>
          <table className='table table-sm table-bordered' style={{ fontSize: 13 }}>
            <thead className='table-light'><tr><th>Permesso</th><th>Descrizione</th></tr></thead>
            <tbody>
              <tr><td><code>minor_journals.read</code></td><td>Visualizza le voci diario</td></tr>
              <tr><td><code>minor_journals.create</code></td><td>Crea nuove voci</td></tr>
              <tr><td><code>minor_journals.update</code></td><td>Modifica voci esistenti</td></tr>
              <tr><td><code>minor_journals.delete</code></td><td>Elimina voci</td></tr>
            </tbody>
          </table>
        </section>
      </InfoDrawer>
    </>
  )
}
