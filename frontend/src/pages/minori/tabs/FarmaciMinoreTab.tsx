import { useEffect, useState } from 'react'
import {
  Alert, Badge, Button, Col, FormGroup, Input, Label, Modal,
  ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink,
  Row, TabContent, TabPane,
} from 'reactstrap'
import { Plus, AlertTriangle, Clock, CheckCircle } from 'react-feather'
import { toast } from 'react-toastify'
import { medicationOptionsApi, medicationPlanApi, minorApi, apiError } from '../../../services/api'
import type {
  MedicationOptions, MedicationPlan, MedicationPlanWrite, MedicationPlanUpdate,
  MedicationAdministration, MedicationAdministrationWrite,
  MedicationScheduleWrite, MinorDocument,
} from '../../../types'

interface Props {
  minorId: number
  facilityId: number
}

const STATUS_COLOR: Record<string, string> = {
  active: 'success',
  suspended: 'warning',
  ended: 'secondary',
  draft: 'info',
}

const DOW = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

function fmtDate(v?: string | null) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('it-IT')
}
function fmtDateTime(v?: string | null) {
  if (!v) return '—'
  return new Date(v).toLocaleString('it-IT')
}

export default function FarmaciMinoreTab({ minorId, facilityId }: Props) {
  const [options, setOptions] = useState<MedicationOptions | null>(null)
  const [plans, setPlans] = useState<MedicationPlan[]>([])
  const [alerts, setAlerts] = useState<import('../../../types').MedicationPlanAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  // modal nuovo piano
  const [planModal, setPlanModal] = useState(false)
  const [planForm, setPlanForm] = useState<Partial<MedicationPlanWrite>>({})
  const [planMsg, setPlanMsg] = useState<string | null>(null)
  const [savingPlan, setSavingPlan] = useState(false)
  const [minorDocs, setMinorDocs] = useState<MinorDocument[]>([])

  // dettaglio piano
  const [selectedPlan, setSelectedPlan] = useState<MedicationPlan | null>(null)
  const [administrations, setAdministrations] = useState<MedicationAdministration[]>([])
  const [loadingAdmin, setLoadingAdmin] = useState(false)
  const [adminModal, setAdminModal] = useState(false)
  const [adminForm, setAdminForm] = useState<Partial<MedicationAdministrationWrite>>({})
  const [adminMsg, setAdminMsg] = useState<string | null>(null)
  const [savingAdmin, setSavingAdmin] = useState(false)

  // modal orario
  const [scheduleModal, setScheduleModal] = useState(false)
  const [scheduleForm, setScheduleForm] = useState<Partial<MedicationScheduleWrite>>({})
  const [scheduleMsg, setScheduleMsg] = useState<string | null>(null)
  const [savingSchedule, setSavingSchedule] = useState(false)

  // modal aggiorna stato piano
  const [updateModal, setUpdateModal] = useState(false)
  const [updateForm, setUpdateForm] = useState<Partial<MedicationPlanUpdate>>({})
  const [updateMsg, setUpdateMsg] = useState<string | null>(null)
  const [savingUpdate, setSavingUpdate] = useState(false)

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      medicationOptionsApi.get(facilityId),
      medicationPlanApi.list({ minor_id: minorId }),
      medicationPlanApi.alerts({ minor_id: minorId }),
      minorApi.listDocuments(minorId),
    ])
      .then(([opts, ps, als, docs]) => {
        setOptions(opts)
        setPlans(ps)
        setAlerts(als)
        setMinorDocs(docs)
      })
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [minorId, facilityId])

  const loadAdministrations = (plan: MedicationPlan) => {
    setSelectedPlan(plan)
    setLoadingAdmin(true)
    medicationPlanApi.listAdministrations(plan.id)
      .then(setAdministrations)
      .catch((e) => toast.error(apiError(e).message ?? 'Errore caricamento somministrazioni'))
      .finally(() => setLoadingAdmin(false))
  }

  const handleCreatePlan = async () => {
    const f = planForm
    if (!f.medication_id || !f.unit || !f.route || !f.frequency || !f.dose || !f.start_date) {
      setPlanMsg('Compila tutti i campi obbligatori.')
      return
    }
    setSavingPlan(true); setPlanMsg(null)
    try {
      await medicationPlanApi.create({
        minor_id: minorId,
        facility_id: facilityId,
        medication_id: Number(f.medication_id),
        unit: f.unit,
        route: f.route,
        frequency: f.frequency,
        dose: Number(f.dose),
        prescriber_id: f.prescriber_id ? Number(f.prescriber_id) : undefined,
        prescription_document_id: f.prescription_document_id ? Number(f.prescription_document_id) : undefined,
        start_date: f.start_date,
        end_date: f.end_date || undefined,
        notes: f.notes || undefined,
      })
      toast.success('Piano farmacologico creato.')
      setPlanModal(false); setPlanForm({})
      loadAll()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 409) setPlanMsg('Piano già esistente per questo farmaco nel periodo indicato.')
      else setPlanMsg(ae.message ?? 'Errore salvataggio.')
    } finally { setSavingPlan(false) }
  }

  const handleAddAdministration = async () => {
    if (!selectedPlan) return
    const f = adminForm
    if (!f.administered_at || !f.dose_given || !f.outcome) {
      setAdminMsg('Compila tutti i campi obbligatori.')
      return
    }
    setSavingAdmin(true); setAdminMsg(null)
    try {
      await medicationPlanApi.addAdministration(selectedPlan.id, {
        administered_at: f.administered_at,
        dose_given: Number(f.dose_given),
        outcome: f.outcome,
        notes: f.notes || undefined,
      })
      toast.success('Somministrazione registrata. Firma applicativa autenticata.')
      setAdminModal(false); setAdminForm({})
      loadAdministrations(selectedPlan)
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 409) setAdminMsg('Somministrazione già registrata per questo orario.')
      else setAdminMsg(ae.message ?? 'Errore registrazione.')
    } finally { setSavingAdmin(false) }
  }

  const handleAddSchedule = async () => {
    if (!selectedPlan) return
    const f = scheduleForm
    if (f.day_of_week === undefined || !f.time_of_day || !f.dose) {
      setScheduleMsg('Compila tutti i campi.')
      return
    }
    setSavingSchedule(true); setScheduleMsg(null)
    try {
      await medicationPlanApi.addSchedule(selectedPlan.id, {
        day_of_week: Number(f.day_of_week),
        time_of_day: f.time_of_day,
        dose: Number(f.dose),
        notes: f.notes || undefined,
      })
      toast.success('Orario aggiunto.')
      setScheduleModal(false); setScheduleForm({})
      // reload plan detail
      medicationPlanApi.get(selectedPlan.id).then(setSelectedPlan).catch(() => {})
    } catch (e) {
      setScheduleMsg(apiError(e).message ?? 'Errore salvataggio orario.')
    } finally { setSavingSchedule(false) }
  }

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return
    setSavingUpdate(true); setUpdateMsg(null)
    try {
      await medicationPlanApi.update(selectedPlan.id, updateForm)
      toast.success('Piano aggiornato.')
      setUpdateModal(false); setUpdateForm({})
      loadAll()
      medicationPlanApi.get(selectedPlan.id).then(setSelectedPlan).catch(() => {})
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 409) setUpdateMsg('Stato non compatibile con la transizione richiesta.')
      else setUpdateMsg(ae.message ?? 'Errore aggiornamento.')
    } finally { setSavingUpdate(false) }
  }

  const activePlans = plans.filter((p) => p.status === 'active' || p.status === 'draft' || p.status === 'suspended')
  const historyPlans = plans.filter((p) => p.status === 'ended')

  if (loading) return <div className='text-center py-5'><div className='loader' /></div>
  if (error) return <Alert color='danger'>{error}</Alert>

  return (
    <div>
      {/* Box informativo */}
      <Alert color='info' className='d-flex gap-2 align-items-start mb-3' style={{ fontSize: 13 }}>
        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          La scheda farmacologica deriva da una prescrizione. Ogni somministrazione viene registrata una sola volta,
          firmata dall'utente autenticato e conservata nello storico. In caso di dubbio non correggere il registro:
          segnala l'evento al coordinatore o al personale sanitario.
        </span>
      </Alert>

      {/* Alert scadenze */}
      {alerts.length > 0 && (
        <div className='mb-3'>
          {alerts.map((a, i) => (
            <Alert key={i} color={a.type === 'expired' ? 'danger' : 'warning'} className='py-2 px-3 mb-1 d-flex gap-2 align-items-center' style={{ fontSize: 13 }}>
              <Clock size={13} />
              <span><strong>{a.type === 'expired' ? 'Scaduto' : a.type === 'expiring_soon' ? 'In scadenza' : 'Ricetta mancante'}:</strong> {a.message}</span>
            </Alert>
          ))}
        </div>
      )}

      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h6 className='mb-0'>Piani farmacologici</h6>
        <Button color='primary' size='sm' onClick={() => { setPlanForm({}); setPlanMsg(null); setPlanModal(true) }}>
          <Plus size={13} className='me-1' />Nuovo piano
        </Button>
      </div>

      <Nav tabs className='border-tab nav-primary mb-3'>
        {(['active', 'history'] as const).map((tab) => (
          <NavItem key={tab}>
            <NavLink className={activeTab === tab ? 'active' : ''} href='#' onClick={(e) => { e.preventDefault(); setActiveTab(tab) }}>
              {tab === 'active' ? `Attivi (${activePlans.length})` : `Storico (${historyPlans.length})`}
            </NavLink>
            <div className='material-border' />
          </NavItem>
        ))}
      </Nav>

      <TabContent activeTab={activeTab}>
        <TabPane tabId='active'>
          <PlanList plans={activePlans} onSelect={loadAdministrations} selectedId={selectedPlan?.id} />
        </TabPane>
        <TabPane tabId='history'>
          <PlanList plans={historyPlans} onSelect={loadAdministrations} selectedId={selectedPlan?.id} />
        </TabPane>
      </TabContent>

      {/* Dettaglio piano selezionato */}
      {selectedPlan && (
        <div className='card mt-3'>
          <div className='card-header py-2 d-flex justify-content-between align-items-center'>
            <strong>{selectedPlan.medication?.name ?? `Piano #${selectedPlan.id}`}</strong>
            <div className='d-flex gap-2'>
              {selectedPlan.can_update && (
                <>
                  <Button size='sm' color='light' onClick={() => { setScheduleForm({}); setScheduleMsg(null); setScheduleModal(true) }}>
                    + Orario
                  </Button>
                  <Button size='sm' color='light' onClick={() => { setUpdateForm({}); setUpdateMsg(null); setUpdateModal(true) }}>
                    Modifica piano
                  </Button>
                </>
              )}
              {selectedPlan.can_add_administration && (
                <Button size='sm' color='primary' onClick={() => { setAdminForm({}); setAdminMsg(null); setAdminModal(true) }}>
                  + Somministrazione
                </Button>
              )}
            </div>
          </div>
          <div className='card-body'>
            <Row className='mb-3'>
              <Col md={6}>
                <small className='text-muted d-block'>Farmaco</small>
                <strong>{selectedPlan.medication?.name}</strong>
              </Col>
              <Col md={3}>
                <small className='text-muted d-block'>Dose</small>
                {selectedPlan.dose} {selectedPlan.unit}
              </Col>
              <Col md={3}>
                <small className='text-muted d-block'>Via</small>
                {selectedPlan.route}
              </Col>
              <Col md={3} className='mt-2'>
                <small className='text-muted d-block'>Frequenza</small>
                {selectedPlan.frequency}
              </Col>
              <Col md={3} className='mt-2'>
                <small className='text-muted d-block'>Inizio</small>
                {fmtDate(selectedPlan.start_date)}
              </Col>
              <Col md={3} className='mt-2'>
                <small className='text-muted d-block'>Fine</small>
                {fmtDate(selectedPlan.end_date)}
              </Col>
              <Col md={3} className='mt-2'>
                <small className='text-muted d-block'>Stato</small>
                <Badge color={STATUS_COLOR[selectedPlan.status] ?? 'secondary'}>{selectedPlan.status}</Badge>
              </Col>
            </Row>

            {/* Orari settimanali */}
            {selectedPlan.schedules && selectedPlan.schedules.length > 0 && (
              <div className='mb-3'>
                <small className='text-muted d-block mb-1'>Orari settimanali</small>
                <div className='d-flex flex-wrap gap-2'>
                  {selectedPlan.schedules.map((s) => (
                    <Badge key={s.id} color='light' className='text-dark border' style={{ fontSize: 12 }}>
                      {DOW[s.day_of_week]} {s.time_of_day} — {s.dose} {selectedPlan.unit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Registro somministrazioni */}
            <div>
              <strong className='small d-block mb-2'>Registro somministrazioni</strong>
              {loadingAdmin
                ? <div className='text-center py-2'><div className='loader' /></div>
                : administrations.length === 0
                  ? <p className='text-muted small'>Nessuna somministrazione registrata.</p>
                  : (
                    <table className='table table-sm table-hover'>
                      <thead className='table-light'>
                        <tr>
                          <th>Data/Ora</th>
                          <th>Dose</th>
                          <th>Esito</th>
                          <th>Operatore</th>
                          <th>Note</th>
                          <th>Firma</th>
                        </tr>
                      </thead>
                      <tbody>
                        {administrations.map((a) => (
                          <tr key={a.id}>
                            <td>{fmtDateTime(a.administered_at)}</td>
                            <td>{a.dose_given} {selectedPlan.unit}</td>
                            <td>{a.outcome}</td>
                            <td>{a.administered_by ? `${a.administered_by.first_name} ${a.administered_by.last_name}` : '—'}</td>
                            <td className='text-muted small'>{a.notes ?? '—'}</td>
                            <td>
                              <span className='badge bg-success-light text-success d-flex align-items-center gap-1' style={{ fontSize: 11 }}>
                                <CheckCircle size={10} /> Firma applicativa autenticata
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
            </div>
          </div>
        </div>
      )}

      {/* Modal nuovo piano */}
      <Modal isOpen={planModal} toggle={() => setPlanModal(false)} size='lg'>
        <ModalHeader toggle={() => setPlanModal(false)}>Nuovo piano farmacologico</ModalHeader>
        <ModalBody>
          {planMsg && <Alert color='danger'>{planMsg}</Alert>}
          {!options
            ? <p className='text-muted'>Caricamento opzioni…</p>
            : (
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label>Farmaco <span className='text-danger'>*</span></Label>
                    <Input type='select' value={planForm.medication_id ?? ''} onChange={(e) => setPlanForm((p) => ({ ...p, medication_id: Number(e.target.value) || undefined }))}>
                      <option value=''>Seleziona farmaco…</option>
                      {options.medications.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={3}>
                  <FormGroup>
                    <Label>Unità <span className='text-danger'>*</span></Label>
                    <Input type='select' value={planForm.unit ?? ''} onChange={(e) => setPlanForm((p) => ({ ...p, unit: e.target.value || undefined }))}>
                      <option value=''>Seleziona…</option>
                      {options.units.map((u) => <option key={u.code} value={u.code}>{u.label}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={3}>
                  <FormGroup>
                    <Label>Via di somministrazione <span className='text-danger'>*</span></Label>
                    <Input type='select' value={planForm.route ?? ''} onChange={(e) => setPlanForm((p) => ({ ...p, route: e.target.value || undefined }))}>
                      <option value=''>Seleziona…</option>
                      {options.routes.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={3}>
                  <FormGroup>
                    <Label>Frequenza <span className='text-danger'>*</span></Label>
                    <Input type='select' value={planForm.frequency ?? ''} onChange={(e) => setPlanForm((p) => ({ ...p, frequency: e.target.value || undefined }))}>
                      <option value=''>Seleziona…</option>
                      {options.frequencies.map((f) => <option key={f.code} value={f.code}>{f.label}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={3}>
                  <FormGroup>
                    <Label>Dose <span className='text-danger'>*</span></Label>
                    <Input type='number' min={0} step={0.1} value={planForm.dose ?? ''} onChange={(e) => setPlanForm((p) => ({ ...p, dose: parseFloat(e.target.value) || undefined }))} />
                  </FormGroup>
                </Col>
                <Col md={3}>
                  <FormGroup>
                    <Label>Data inizio <span className='text-danger'>*</span></Label>
                    <Input type='date' value={planForm.start_date ?? ''} onChange={(e) => setPlanForm((p) => ({ ...p, start_date: e.target.value || undefined }))} />
                  </FormGroup>
                </Col>
                <Col md={3}>
                  <FormGroup>
                    <Label>Data fine</Label>
                    <Input type='date' value={planForm.end_date ?? ''} onChange={(e) => setPlanForm((p) => ({ ...p, end_date: e.target.value || undefined }))} />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Prescrittore</Label>
                    <Input type='select' value={planForm.prescriber_id ?? ''} onChange={(e) => setPlanForm((p) => ({ ...p, prescriber_id: Number(e.target.value) || undefined }))}>
                      <option value=''>Nessuno</option>
                      {options.prescribers.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Documento ricetta</Label>
                    <Input type='select' value={planForm.prescription_document_id ?? ''} onChange={(e) => setPlanForm((p) => ({ ...p, prescription_document_id: Number(e.target.value) || undefined }))}>
                      <option value=''>Nessuno</option>
                      {minorDocs.map((d) => <option key={d.id} value={d.id}>{d.label ?? d.attachment?.original_name ?? `Doc #${d.id}`}</option>)}
                    </Input>
                    <small className='text-muted'>Documento caricato nella sezione Documenti del minore.</small>
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label>Note</Label>
                    <Input type='textarea' rows={2} value={planForm.notes ?? ''} onChange={(e) => setPlanForm((p) => ({ ...p, notes: e.target.value || undefined }))} />
                  </FormGroup>
                </Col>
              </Row>
            )}
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleCreatePlan} disabled={savingPlan}>{savingPlan ? 'Salvataggio…' : 'Crea piano'}</Button>
          <Button color='light' onClick={() => setPlanModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal aggiungi somministrazione */}
      <Modal isOpen={adminModal} toggle={() => setAdminModal(false)}>
        <ModalHeader toggle={() => setAdminModal(false)}>Registra somministrazione</ModalHeader>
        <ModalBody>
          {adminMsg && <Alert color='danger'>{adminMsg}</Alert>}
          <Alert color='warning' className='py-2 px-3' style={{ fontSize: 13 }}>
            La somministrazione una volta registrata non è modificabile né cancellabile. Verificare i dati prima di salvare.
          </Alert>
          <FormGroup>
            <Label>Data e ora <span className='text-danger'>*</span></Label>
            <Input type='datetime-local' value={adminForm.administered_at ?? ''} onChange={(e) => setAdminForm((p) => ({ ...p, administered_at: e.target.value }))} />
          </FormGroup>
          <FormGroup>
            <Label>Dose somministrata <span className='text-danger'>*</span></Label>
            <Input type='number' min={0} step={0.1} value={adminForm.dose_given ?? ''} onChange={(e) => setAdminForm((p) => ({ ...p, dose_given: parseFloat(e.target.value) || undefined }))} />
          </FormGroup>
          <FormGroup>
            <Label>Esito <span className='text-danger'>*</span></Label>
            <Input type='select' value={adminForm.outcome ?? ''} onChange={(e) => setAdminForm((p) => ({ ...p, outcome: e.target.value }))}>
              <option value=''>Seleziona…</option>
              <option value='ok'>Somministrato correttamente</option>
              <option value='refused'>Rifiutato dal paziente</option>
              <option value='vomited'>Vomitato</option>
              <option value='partial'>Parzialmente assunto</option>
              <option value='skipped'>Saltato su indicazione medica</option>
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Note</Label>
            <Input type='textarea' rows={2} value={adminForm.notes ?? ''} onChange={(e) => setAdminForm((p) => ({ ...p, notes: e.target.value || undefined }))} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleAddAdministration} disabled={savingAdmin}>{savingAdmin ? 'Registrazione…' : 'Registra'}</Button>
          <Button color='light' onClick={() => setAdminModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal aggiungi orario */}
      <Modal isOpen={scheduleModal} toggle={() => setScheduleModal(false)}>
        <ModalHeader toggle={() => setScheduleModal(false)}>Aggiungi orario settimanale</ModalHeader>
        <ModalBody>
          {scheduleMsg && <Alert color='danger'>{scheduleMsg}</Alert>}
          <FormGroup>
            <Label>Giorno della settimana <span className='text-danger'>*</span></Label>
            <Input type='select' value={scheduleForm.day_of_week ?? ''} onChange={(e) => setScheduleForm((p) => ({ ...p, day_of_week: Number(e.target.value) }))}>
              <option value=''>Seleziona…</option>
              {DOW.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Orario <span className='text-danger'>*</span></Label>
            <Input type='time' value={scheduleForm.time_of_day ?? ''} onChange={(e) => setScheduleForm((p) => ({ ...p, time_of_day: e.target.value }))} />
          </FormGroup>
          <FormGroup>
            <Label>Dose <span className='text-danger'>*</span></Label>
            <Input type='number' min={0} step={0.1} value={scheduleForm.dose ?? ''} onChange={(e) => setScheduleForm((p) => ({ ...p, dose: parseFloat(e.target.value) || undefined }))} />
          </FormGroup>
          <FormGroup>
            <Label>Note</Label>
            <Input type='textarea' rows={2} value={scheduleForm.notes ?? ''} onChange={(e) => setScheduleForm((p) => ({ ...p, notes: e.target.value || undefined }))} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleAddSchedule} disabled={savingSchedule}>{savingSchedule ? 'Salvataggio…' : 'Aggiungi'}</Button>
          <Button color='light' onClick={() => setScheduleModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal modifica piano */}
      <Modal isOpen={updateModal} toggle={() => setUpdateModal(false)}>
        <ModalHeader toggle={() => setUpdateModal(false)}>Modifica piano farmacologico</ModalHeader>
        <ModalBody>
          {updateMsg && <Alert color='danger'>{updateMsg}</Alert>}
          <FormGroup>
            <Label>Stato</Label>
            <Input type='select' value={updateForm.status ?? ''} onChange={(e) => setUpdateForm((p) => ({ ...p, status: e.target.value || undefined }))}>
              <option value=''>Nessuna modifica</option>
              <option value='active'>Attivo</option>
              <option value='suspended'>Sospeso</option>
              <option value='ended'>Concluso</option>
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Data fine</Label>
            <Input type='date' value={updateForm.end_date ?? ''} onChange={(e) => setUpdateForm((p) => ({ ...p, end_date: e.target.value || null }))} />
          </FormGroup>
          <FormGroup>
            <Label>Note</Label>
            <Input type='textarea' rows={2} value={updateForm.notes ?? ''} onChange={(e) => setUpdateForm((p) => ({ ...p, notes: e.target.value || undefined }))} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleUpdatePlan} disabled={savingUpdate}>{savingUpdate ? 'Salvataggio…' : 'Aggiorna'}</Button>
          <Button color='light' onClick={() => setUpdateModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

function PlanList({ plans, onSelect, selectedId }: { plans: MedicationPlan[]; onSelect: (p: MedicationPlan) => void; selectedId?: number }) {
  if (plans.length === 0) return <p className='text-muted text-center py-3'>Nessun piano.</p>
  return (
    <table className='table table-hover table-sm'>
      <thead className='table-light'>
        <tr><th>Farmaco</th><th>Dose</th><th>Frequenza</th><th>Inizio</th><th>Fine</th><th>Stato</th></tr>
      </thead>
      <tbody>
        {plans.map((p) => (
          <tr key={p.id} onClick={() => onSelect(p)} style={{ cursor: 'pointer', background: selectedId === p.id ? '#f3f2ff' : undefined }}>
            <td><strong>{p.medication?.name ?? `#${p.id}`}</strong></td>
            <td>{p.dose} {p.unit}</td>
            <td>{p.frequency}</td>
            <td>{p.start_date ? new Date(p.start_date).toLocaleDateString('it-IT') : '—'}</td>
            <td>{p.end_date ? new Date(p.end_date).toLocaleDateString('it-IT') : '—'}</td>
            <td><Badge color={STATUS_COLOR[p.status] ?? 'secondary'}>{p.status}</Badge></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
