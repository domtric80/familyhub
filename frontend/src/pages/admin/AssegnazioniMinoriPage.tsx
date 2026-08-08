import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardHeader, CardBody,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Badge,
} from 'reactstrap'
import { Home, Plus, UserX, Info, ChevronRight } from 'react-feather'
import InfoDrawer from '../../components/common/InfoDrawer'
import { toast } from 'react-toastify'
import {
  adminUserApi, assignmentApi, facilityApi, minorApi,
  minorAssignmentApi, apiError,
} from '../../services/api'
import type {
  AdminUser, Assignment, Facility, Minor,
  MinorAssignment, MinorAssignmentWrite,
} from '../../types'

const today = () => new Date().toISOString().slice(0, 10)

const EMPTY_FORM: MinorAssignmentWrite = {
  facility_id: 0, minor_id: 0, user_id: 0,
  valid_from: today(), valid_to: null, is_active: true, notes: null,
}

function fmtDate(s?: string | null) {
  if (!s) return '∞'
  return new Date(s).toLocaleDateString('it-IT')
}

export default function AssegnazioniMinoriPage() {
  const [infoOpen, setInfoOpen] = useState(false)

  // lookup
  const [facilities,          setFacilities]          = useState<Facility[]>([])
  const [minors,              setMinors]              = useState<Minor[]>([])
  const [users,               setUsers]               = useState<AdminUser[]>([])
  const [facilityAssignments, setFacilityAssignments] = useState<Assignment[]>([])
  const [items,               setItems]               = useState<MinorAssignment[]>([])

  // UI
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [apiMissing, setApiMissing] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [revoking,   setRevoking]   = useState(false)

  // selezione minore
  const [selectedMinorId, setSelectedMinorId] = useState<number | null>(null)

  // modale crea/modifica
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editTarget, setEditTarget] = useState<MinorAssignment | null>(null)
  const [form,       setForm]       = useState<MinorAssignmentWrite>({ ...EMPTY_FORM })
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({})
  const [formMsg,    setFormMsg]    = useState<string | null>(null)

  // modale revoca
  const [revokeTarget, setRevokeTarget] = useState<MinorAssignment | null>(null)
  const [revokeDate,   setRevokeDate]   = useState(today())
  const [revokeMsg,    setRevokeMsg]    = useState<string | null>(null)

  // ── Caricamento ───────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [facs, mins, usrs, fasgn, itms] = await Promise.all([
        facilityApi.list(),
        minorApi.list(),
        adminUserApi.list(),
        assignmentApi.list({ is_active: true }),
        minorAssignmentApi.list({}),   // tutti, attivi e revocati
      ])
      setFacilities(facs); setMinors(mins); setUsers(usrs)
      setFacilityAssignments(fasgn); setItems(itms)
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 404) setApiMissing(true)
      else setError(apiError(e).message ?? 'Errore caricamento')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  // ── Dati derivati ─────────────────────────────────────────────────────────

  // Minori che hanno almeno una assegnazione
  const minorsWithAssignments = minors.filter((m) =>
    items.some((i) => i.minor_id === m.id)
  )

  const selectedMinor = minors.find((m) => m.id === selectedMinorId) ?? null
  const minorItems = selectedMinorId
    ? items.filter((i) => i.minor_id === selectedMinorId)
    : []
  const activeItems  = minorItems.filter((i) => i.is_active)
  const revokedItems = minorItems.filter((i) => !i.is_active)

  const usersForFacility = useMemo(() => (facilityId: number): AdminUser[] => {
    if (!facilityId) return users
    const ids = new Set(
      facilityAssignments
        .filter((a) => a.facility_id === facilityId && a.is_active)
        .map((a) => a.user_id),
    )
    return users.filter((u) => ids.has(u.id))
  }, [facilityAssignments, users])

  const minorsForFacility = (facilityId: number) =>
    facilityId ? minors.filter((m) => m.facility_id === facilityId) : minors

  // ── Modal crea/modifica ───────────────────────────────────────────────────

  const openCreate = (preMinorId?: number) => {
    const minor = preMinorId ? minors.find((m) => m.id === preMinorId) : undefined
    setEditTarget(null)
    setForm({ ...EMPTY_FORM, minor_id: preMinorId ?? 0, facility_id: minor?.facility_id ?? 0 })
    setFormErrors({}); setFormMsg(null); setModalOpen(true)
  }

  const openEdit = (item: MinorAssignment) => {
    setEditTarget(item)
    setForm({
      facility_id: item.facility_id, minor_id: item.minor_id,
      user_id: item.user_id, valid_from: item.valid_from.slice(0, 10),
      valid_to: item.valid_to?.slice(0, 10) ?? null,
      is_active: item.is_active, notes: item.notes ?? null,
    })
    setFormErrors({}); setFormMsg(null); setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true); setFormErrors({}); setFormMsg(null)
    try {
      if (editTarget) {
        await minorAssignmentApi.update(editTarget.id, form)
        toast.success('Assegnazione aggiornata')
      } else {
        await minorAssignmentApi.create(form)
        toast.success('Assegnazione creata')
      }
      setModalOpen(false); load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.errors) setFormErrors(ae.errors)
      else setFormMsg(ae.message ?? 'Errore salvataggio')
    } finally { setSaving(false) }
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    setRevoking(true); setRevokeMsg(null)
    try {
      await minorAssignmentApi.revoke(revokeTarget.id, revokeDate || null)
      toast.success('Autorizzazione revocata')
      setRevokeTarget(null); load()
    } catch (e) { setRevokeMsg(apiError(e).message ?? 'Errore revoca') }
    finally { setRevoking(false) }
  }

  const fErr = (f: string) => formErrors[f]?.[0]

  const userLabel = (item: MinorAssignment) =>
    item.user ? `${item.user.last_name} ${item.user.first_name}` : `#${item.user_id}`

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <div className='d-flex align-items-center gap-2'>
                <h3 className='mb-0'>Assegnazioni minori</h3>
                <Button color='light' size='sm' className='d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
                  <Info size={13} /> Informazioni
                </Button>
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'>Amministrazione</li>
                <li className='breadcrumb-item active'>Assegnazioni minori</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        {apiMissing && <Alert color='warning'>Il modulo assegnazioni minori non è disponibile sul backend.</Alert>}
        {error && <Alert color='danger'>{error}</Alert>}
        {loading && <div className='text-center py-5'><span className='spinner-border text-primary' /></div>}

        {!loading && !apiMissing && (
          <Row className='g-3'>
            {/* ── Colonna sinistra: lista minori ── */}
            <Col lg='4'>
              <Card className='h-100'>
                <CardHeader className='d-flex justify-content-between align-items-center'>
                  <h6 className='mb-0'>Minori ({minorsWithAssignments.length})</h6>
                  <Button color='primary' size='sm' className='d-flex align-items-center gap-1'
                    onClick={() => openCreate()}>
                    <Plus size={13} /> Nuova
                  </Button>
                </CardHeader>
                <CardBody className='p-0' style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {minorsWithAssignments.length === 0 ? (
                    <p className='text-muted small p-3'>Nessun minore con autorizzazioni.</p>
                  ) : (
                    <ul className='list-group list-group-flush'>
                      {minorsWithAssignments.map((m) => {
                        const active = items.filter((i) => i.minor_id === m.id && i.is_active).length
                        const isSelected = selectedMinorId === m.id
                        return (
                          <li
                            key={m.id}
                            className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-2 px-3 ${isSelected ? 'active' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedMinorId(isSelected ? null : m.id)}
                          >
                            <div>
                              <div className='fw-semibold' style={{ fontSize: 13 }}>
                                {m.last_name} {m.first_name}
                              </div>
                              <div className='text-muted' style={{ fontSize: 11 }}>
                                {m.internal_code} · {m.facility?.name ?? ''}
                              </div>
                            </div>
                            <div className='d-flex align-items-center gap-2'>
                              {active > 0 && (
                                <Badge color='success' pill>{active}</Badge>
                              )}
                              <ChevronRight size={14} className={isSelected ? 'text-white' : 'text-muted'} />
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </Col>

            {/* ── Colonna destra: chi ha accesso al minore ── */}
            <Col lg='8'>
              {!selectedMinor ? (
                <Card className='h-100'>
                  <CardBody className='d-flex align-items-center justify-content-center text-muted'>
                    <span>Seleziona un minore per vedere chi è autorizzato</span>
                  </CardBody>
                </Card>
              ) : (
                <Card>
                  <CardHeader className='d-flex justify-content-between align-items-center'>
                    <div>
                      <h6 className='mb-0'>{selectedMinor.last_name} {selectedMinor.first_name}</h6>
                      <small className='text-muted'>{selectedMinor.internal_code}</small>
                    </div>
                    <Button color='primary' size='sm' className='d-flex align-items-center gap-1'
                      onClick={() => openCreate(selectedMinorId ?? undefined)}>
                      <Plus size={13} /> Autorizza utente
                    </Button>
                  </CardHeader>
                  <CardBody>
                    {/* Autorizzazioni attive */}
                    <h6 className='fw-semibold mb-2' style={{ fontSize: 13, color: '#198754' }}>
                      Autorizzati ({activeItems.length})
                    </h6>
                    {activeItems.length === 0 ? (
                      <p className='text-muted small'>Nessun utente autorizzato.</p>
                    ) : (
                      <div className='table-responsive mb-3'>
                        <table className='table table-sm table-hover'>
                          <thead className='table-light'>
                            <tr><th>Utente</th><th>Struttura</th><th>Dal</th><th>Al</th><th>Note</th><th></th></tr>
                          </thead>
                          <tbody>
                            {activeItems.map((item) => (
                              <tr key={item.id}>
                                <td className='fw-semibold small'>{userLabel(item)}</td>
                                <td className='small'>{item.facility?.name ?? `#${item.facility_id}`}</td>
                                <td className='small'>{fmtDate(item.valid_from)}</td>
                                <td className='small'>{fmtDate(item.valid_to)}</td>
                                <td className='small text-muted'>{item.notes ?? '—'}</td>
                                <td>
                                  <button
                                    className='btn btn-sm btn-outline-danger d-flex align-items-center gap-1'
                                    onClick={() => { setRevokeTarget(item); setRevokeDate(today()); setRevokeMsg(null) }}
                                    title='Revoca autorizzazione'
                                  >
                                    <UserX size={12} /> Revoca
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Storico revoche */}
                    {revokedItems.length > 0 && (
                      <>
                        <h6 className='fw-semibold mb-2' style={{ fontSize: 13, color: '#6c757d' }}>
                          Storico revoche ({revokedItems.length})
                        </h6>
                        <div className='table-responsive'>
                          <table className='table table-sm'>
                            <thead className='table-light'>
                              <tr><th>Utente</th><th>Struttura</th><th>Dal</th><th>Al</th></tr>
                            </thead>
                            <tbody>
                              {revokedItems.map((item) => (
                                <tr key={item.id} className='text-muted'>
                                  <td className='small'>{userLabel(item)}</td>
                                  <td className='small'>{item.facility?.name ?? `#${item.facility_id}`}</td>
                                  <td className='small'>{fmtDate(item.valid_from)}</td>
                                  <td className='small'>{fmtDate(item.valid_to)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </CardBody>
                </Card>
              )}
            </Col>
          </Row>
        )}
      </Container>

      {/* Modal crea/modifica */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered size='lg'>
        <ModalHeader toggle={() => setModalOpen(false)}>
          {editTarget ? 'Modifica autorizzazione' : 'Nuova autorizzazione minore'}
        </ModalHeader>
        <ModalBody>
          {formMsg && <Alert color='danger'>{formMsg}</Alert>}
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Struttura <span className='text-danger'>*</span></Label>
                <Input type='select' value={form.facility_id} invalid={!!fErr('facility_id')}
                  onChange={(e) => setForm((p) => ({ ...p, facility_id: Number(e.target.value), user_id: 0, minor_id: 0 }))}>
                  <option value={0}>— Struttura —</option>
                  {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </Input>
                {fErr('facility_id') && <div className='invalid-feedback d-block'>{fErr('facility_id')}</div>}
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Minore <span className='text-danger'>*</span></Label>
                <Input type='select' value={form.minor_id} invalid={!!fErr('minor_id')}
                  onChange={(e) => setForm((p) => ({ ...p, minor_id: Number(e.target.value) }))}>
                  <option value={0}>— Minore —</option>
                  {minorsForFacility(form.facility_id).map((m) => (
                    <option key={m.id} value={m.id}>{m.last_name} {m.first_name} ({m.internal_code})</option>
                  ))}
                </Input>
                {fErr('minor_id') && <div className='invalid-feedback d-block'>{fErr('minor_id')}</div>}
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label>Utente <span className='text-danger'>*</span></Label>
            <Input type='select' value={form.user_id} invalid={!!fErr('user_id')}
              onChange={(e) => setForm((p) => ({ ...p, user_id: Number(e.target.value) }))}>
              <option value={0}>— Utente —</option>
              {usersForFacility(form.facility_id).map((u) => (
                <option key={u.id} value={u.id}>{u.last_name} {u.first_name} ({u.email})</option>
              ))}
            </Input>
            {fErr('user_id') && <div className='invalid-feedback d-block'>{fErr('user_id')}</div>}
          </FormGroup>
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Dal <span className='text-danger'>*</span></Label>
                <Input type='date' value={form.valid_from} invalid={!!fErr('valid_from')}
                  onChange={(e) => setForm((p) => ({ ...p, valid_from: e.target.value }))} />
                {fErr('valid_from') && <div className='invalid-feedback d-block'>{fErr('valid_from')}</div>}
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Al <small className='text-muted'>(vuoto = illimitato)</small></Label>
                <Input type='date' value={form.valid_to ?? ''} invalid={!!fErr('valid_to')}
                  onChange={(e) => setForm((p) => ({ ...p, valid_to: e.target.value || null }))} />
                {fErr('valid_to') && <div className='invalid-feedback d-block'>{fErr('valid_to')}</div>}
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label>Note</Label>
            <Input type='textarea' rows={2} value={form.notes ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value || null }))} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='light' onClick={() => setModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal revoca */}
      <Modal isOpen={!!revokeTarget} toggle={() => setRevokeTarget(null)} centered>
        <ModalHeader toggle={() => setRevokeTarget(null)}>Revoca autorizzazione</ModalHeader>
        <ModalBody>
          {revokeMsg && <Alert color='danger'>{revokeMsg}</Alert>}
          <p>Revocare l'accesso di <strong>{revokeTarget ? userLabel(revokeTarget) : ''}</strong> al minore?</p>
          <FormGroup>
            <Label>Data revoca</Label>
            <Input type='date' value={revokeDate} onChange={(e) => setRevokeDate(e.target.value)} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='danger' onClick={handleRevoke} disabled={revoking}>
            <UserX size={13} className='me-1' />{revoking ? 'Revoca…' : 'Revoca'}
          </Button>
          <Button color='light' onClick={() => setRevokeTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Assegnazioni minori'>
        <p>Questa sezione gestisce chi può accedere alla scheda di ogni minore.</p>
        <h6 className='mt-3'>Come funziona</h6>
        <p>Un utente deve avere sia un'assegnazione struttura attiva (ruolo) sia un'autorizzazione esplicita al minore per poter operare sulla scheda completa.</p>
        <h6 className='mt-3'>Eccezioni</h6>
        <p>SUPER_ADMIN, DIRETTORE e COORDINATORE hanno accesso ai minori della propria struttura senza assegnazione puntuale.</p>
        <h6 className='mt-3'>Revoca</h6>
        <p>La revoca non elimina l'accesso immediatamente: imposta la data di fine validità. Le attività già registrate rimangono tracciate.</p>
      </InfoDrawer>
    </>
  )
}
