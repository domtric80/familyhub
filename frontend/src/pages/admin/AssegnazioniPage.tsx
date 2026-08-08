import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardHeader, CardBody, Button,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Badge, Alert,
} from 'reactstrap'
import { toast } from 'react-toastify'
import { Plus, Edit2, Trash2, Home, ChevronRight } from 'react-feather'
import { assignmentApi, adminUserApi, facilityApi, lookupsApi, apiError, errorMessage } from '../../services/api'
import type { Assignment, AssignmentWrite, AdminUser, Facility, Role } from '../../types'

const today = new Date().toISOString().split('T')[0]
const EMPTY_FORM = {
  user_id: 0, facility_id: 0, role_id: 0,
  valid_from: today, valid_to: '', is_active: true,
}

function fmtDate(s?: string | null) {
  if (!s) return '∞'
  return new Date(s).toLocaleDateString('it-IT')
}

export default function AssegnazioniPage() {
  const [assignments, setAssignments]   = useState<Assignment[]>([])
  const [users, setUsers]               = useState<AdminUser[]>([])
  const [facilities, setFacilities]     = useState<Facility[]>([])
  const [roles, setRoles]               = useState<Role[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  // selezione utente
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  // modale crea/modifica
  const [modalOpen, setModalOpen]       = useState(false)
  const [editTarget, setEditTarget]     = useState<Assignment | null>(null)
  const [form, setForm]                 = useState({ ...EMPTY_FORM })
  const [fieldErrors, setFieldErrors]   = useState<Record<string, string[]>>({})
  const [formMessage, setFormMessage]   = useState<string | null>(null)
  const [saving, setSaving]             = useState(false)

  // modale revoca
  const [revokeTarget, setRevokeTarget] = useState<Assignment | null>(null)
  const [revokeDate, setRevokeDate]     = useState(today)
  const [revokeMessage, setRevokeMessage] = useState<string | null>(null)
  const [revoking, setRevoking]         = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [aList, uList, fList, rList] = await Promise.all([
        assignmentApi.list(), adminUserApi.list(), facilityApi.list(), lookupsApi.roles(),
      ])
      setAssignments(aList); setUsers(uList); setFacilities(fList); setRoles(rList)
    } catch (e) { setError(apiError(e).message ?? 'Errore caricamento') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // ── Utenti con almeno una assegnazione (o tutti)
  const usersWithAssignments = users.filter((u) =>
    assignments.some((a) => a.user_id === u.id)
  )

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null
  const userAssignments = selectedUserId
    ? assignments.filter((a) => a.user_id === selectedUserId)
    : []
  const activeCount = userAssignments.filter((a) => a.is_active).length
  const revokedCount = userAssignments.filter((a) => !a.is_active).length

  // ── Form helpers
  const openCreate = (preUserId?: number) => {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM, user_id: preUserId ?? 0 })
    setFieldErrors({}); setFormMessage(null); setModalOpen(true)
  }
  const openEdit = (a: Assignment) => {
    setEditTarget(a)
    setForm({
      user_id:     a.user_id,
      facility_id: a.facility_id,
      role_id:     a.role_id,
      valid_from:  a.valid_from?.slice(0, 10) ?? today,
      valid_to:    a.valid_to?.slice(0, 10) ?? '',
      is_active:   a.is_active,
    })
    setFieldErrors({}); setFormMessage(null); setModalOpen(true)
  }
  const handleSave = async () => {
    setSaving(true); setFieldErrors({}); setFormMessage(null)
    const payload: AssignmentWrite = {
      user_id: Number(form.user_id), facility_id: Number(form.facility_id),
      role_id: Number(form.role_id), valid_from: form.valid_from,
      valid_to: form.valid_to || null, is_active: form.is_active,
    }
    try {
      if (editTarget) { await assignmentApi.update(editTarget.id, payload); toast.success('Assegnazione aggiornata') }
      else             { await assignmentApi.create(payload); toast.success('Assegnazione creata') }
      setModalOpen(false); await load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.errors) setFieldErrors(ae.errors)
      else if (ae.status === 403) setFormMessage(errorMessage(ae))
      else setFormMessage(ae.message ?? 'Errore salvataggio')
    } finally { setSaving(false) }
  }
  const handleRevoke = async () => {
    if (!revokeTarget) return
    setRevoking(true); setRevokeMessage(null)
    try {
      await assignmentApi.revoke(revokeTarget.id, revokeDate)
      toast.success('Assegnazione revocata'); setRevokeTarget(null); await load()
    } catch (e) {
      const ae = apiError(e)
      setRevokeMessage(ae.errors?.valid_to?.[0] ?? ae.message ?? 'Errore revoca')
    } finally { setRevoking(false) }
  }
  const fErr = (f: string) => fieldErrors[f]?.[0]

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Assegnazioni ruolo-struttura</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'>Admin</li>
                <li className='breadcrumb-item active'>Assegnazioni</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        {error && <Alert color='danger'>{error}</Alert>}
        {loading && <div className='text-center py-5'><span className='spinner-border text-primary' /></div>}

        {!loading && (
          <Row className='g-3'>
            {/* ── Colonna sinistra: lista utenti ── */}
            <Col lg='4'>
              <Card className='h-100'>
                <CardHeader className='d-flex justify-content-between align-items-center'>
                  <h6 className='mb-0'>Utenti ({usersWithAssignments.length})</h6>
                  <Button color='primary' size='sm' className='d-flex align-items-center gap-1'
                    onClick={() => openCreate()}>
                    <Plus size={13} /> Nuova
                  </Button>
                </CardHeader>
                <CardBody className='p-0' style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {usersWithAssignments.length === 0 ? (
                    <p className='text-muted small p-3'>Nessuna assegnazione registrata.</p>
                  ) : (
                    <ul className='list-group list-group-flush'>
                      {usersWithAssignments.map((u) => {
                        const active = assignments.filter((a) => a.user_id === u.id && a.is_active).length
                        const isSelected = selectedUserId === u.id
                        return (
                          <li
                            key={u.id}
                            className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-2 px-3 ${isSelected ? 'active' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedUserId(isSelected ? null : u.id)}
                          >
                            <div>
                              <div className='fw-semibold' style={{ fontSize: 13 }}>
                                {u.first_name} {u.last_name}
                              </div>
                              <div className='text-muted' style={{ fontSize: 11 }}>{u.email}</div>
                            </div>
                            <div className='d-flex align-items-center gap-2'>
                              {active > 0 && (
                                <Badge color='success' pill>{active} attiv{active === 1 ? 'a' : 'e'}</Badge>
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

            {/* ── Colonna destra: dettaglio assegnazioni utente ── */}
            <Col lg='8'>
              {!selectedUser ? (
                <Card className='h-100'>
                  <CardBody className='d-flex align-items-center justify-content-center text-muted'>
                    <span>Seleziona un utente per vedere le sue assegnazioni</span>
                  </CardBody>
                </Card>
              ) : (
                <Card>
                  <CardHeader className='d-flex justify-content-between align-items-center'>
                    <div>
                      <h6 className='mb-0'>{selectedUser.first_name} {selectedUser.last_name}</h6>
                      <small className='text-muted'>{selectedUser.email}</small>
                    </div>
                    <Button color='primary' size='sm' className='d-flex align-items-center gap-1'
                      onClick={() => openCreate(selectedUserId ?? undefined)}>
                      <Plus size={13} /> Nuova assegnazione
                    </Button>
                  </CardHeader>
                  <CardBody>
                    {/* Assegnazioni attive */}
                    <h6 className='fw-semibold mb-2' style={{ fontSize: 13, color: '#198754' }}>
                      Attive ({activeCount})
                    </h6>
                    {activeCount === 0 ? (
                      <p className='text-muted small'>Nessuna assegnazione attiva.</p>
                    ) : (
                      <div className='table-responsive mb-3'>
                        <table className='table table-sm table-hover'>
                          <thead className='table-light'>
                            <tr>
                              <th>Struttura</th><th>Ruolo</th><th>Dal</th><th>Al</th><th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {userAssignments.filter((a) => a.is_active).map((a) => (
                              <tr key={a.id}>
                                <td className='small'>{a.facility?.name ?? `#${a.facility_id}`}</td>
                                <td>
                                  <Badge color='light' className='text-primary'>
                                    {a.role?.name ?? `#${a.role_id}`}
                                  </Badge>
                                </td>
                                <td className='small'>{fmtDate(a.valid_from)}</td>
                                <td className='small'>{fmtDate(a.valid_to)}</td>
                                <td>
                                  <div className='d-flex gap-1'>
                                    <button className='btn btn-sm btn-outline-primary' onClick={() => openEdit(a)} title='Modifica'>
                                      <Edit2 size={12} />
                                    </button>
                                    <button className='btn btn-sm btn-outline-danger' title='Revoca'
                                      onClick={() => { setRevokeTarget(a); setRevokeDate(a.valid_to?.slice(0, 10) ?? today); setRevokeMessage(null) }}>
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Assegnazioni revocate */}
                    {revokedCount > 0 && (
                      <>
                        <h6 className='fw-semibold mb-2' style={{ fontSize: 13, color: '#6c757d' }}>
                          Storico revoche ({revokedCount})
                        </h6>
                        <div className='table-responsive'>
                          <table className='table table-sm'>
                            <thead className='table-light'>
                              <tr><th>Struttura</th><th>Ruolo</th><th>Dal</th><th>Al</th></tr>
                            </thead>
                            <tbody>
                              {userAssignments.filter((a) => !a.is_active).map((a) => (
                                <tr key={a.id} className='text-muted'>
                                  <td className='small'>{a.facility?.name ?? `#${a.facility_id}`}</td>
                                  <td className='small'>{a.role?.name ?? `#${a.role_id}`}</td>
                                  <td className='small'>{fmtDate(a.valid_from)}</td>
                                  <td className='small'>{fmtDate(a.valid_to)}</td>
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
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered>
        <ModalHeader toggle={() => setModalOpen(false)}>
          {editTarget ? 'Modifica assegnazione' : 'Nuova assegnazione'}
        </ModalHeader>
        <ModalBody>
          {formMessage && <Alert color='danger'>{formMessage}</Alert>}
          <FormGroup>
            <Label>Utente <span className='text-danger'>*</span></Label>
            <Input type='select' value={form.user_id} invalid={!!fErr('user_id')}
              onChange={(e) => setForm((p) => ({ ...p, user_id: Number(e.target.value) }))}>
              <option value={0}>Seleziona utente…</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name} — {u.email}</option>)}
            </Input>
            {fErr('user_id') && <div className='invalid-feedback d-block'>{fErr('user_id')}</div>}
          </FormGroup>
          <FormGroup>
            <Label>Struttura <span className='text-danger'>*</span></Label>
            <Input type='select' value={form.facility_id} invalid={!!fErr('facility_id')}
              onChange={(e) => setForm((p) => ({ ...p, facility_id: Number(e.target.value) }))}>
              <option value={0}>Seleziona struttura…</option>
              {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </Input>
            {fErr('facility_id') && <div className='invalid-feedback d-block'>{fErr('facility_id')}</div>}
          </FormGroup>
          <FormGroup>
            <Label>Ruolo <span className='text-danger'>*</span></Label>
            <Input type='select' value={form.role_id} invalid={!!fErr('role_id')}
              onChange={(e) => setForm((p) => ({ ...p, role_id: Number(e.target.value) }))}>
              <option value={0}>Seleziona ruolo…</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Input>
            {fErr('role_id') && <div className='invalid-feedback d-block'>{fErr('role_id')}</div>}
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
                <Input type='date' value={form.valid_to} invalid={!!fErr('valid_to')}
                  onChange={(e) => setForm((p) => ({ ...p, valid_to: e.target.value }))} />
                {fErr('valid_to') && <div className='invalid-feedback d-block'>{fErr('valid_to')}</div>}
              </FormGroup>
            </Col>
          </Row>
          <FormGroup check>
            <Input type='checkbox' id='assign-active' checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
            <Label check htmlFor='assign-active'>Attiva</Label>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='light' onClick={() => setModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal revoca */}
      <Modal isOpen={!!revokeTarget} toggle={() => setRevokeTarget(null)} centered>
        <ModalHeader toggle={() => setRevokeTarget(null)}>Revoca assegnazione</ModalHeader>
        <ModalBody>
          {revokeMessage && <Alert color='danger'>{revokeMessage}</Alert>}
          <p>Revocare l'assegnazione di <strong>
            {revokeTarget?.user ? `${revokeTarget.user.first_name} ${revokeTarget.user.last_name}` : `#${revokeTarget?.user_id}`}
          </strong> alla struttura <strong>{revokeTarget?.facility?.name ?? `#${revokeTarget?.facility_id}`}</strong>?</p>
          <FormGroup>
            <Label>Data fine validità</Label>
            <Input type='date' value={revokeDate} onChange={(e) => setRevokeDate(e.target.value)} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='danger' onClick={handleRevoke} disabled={revoking}>{revoking ? 'Revoca…' : 'Revoca'}</Button>
          <Button color='light' onClick={() => setRevokeTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
