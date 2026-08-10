import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button,
} from 'reactstrap'
import InfoDrawer from '../../components/common/InfoDrawer'
import { Home, Plus, Edit2, Trash2, Info } from 'react-feather'
import { toast } from 'react-toastify'
import { adminUserApi, apiError, errorMessage, facilityApi, lookupsApi, staffMemberApi } from '../../services/api'
import type { AdminUser, City, Facility, StaffMember, StaffMemberWrite, StaffQualification, StaffStatus } from '../../types'

const EMPTY_FORM: StaffMemberWrite = {
  facility_id: 0,
  user_id: null,
  employee_code: '',
  first_name: '',
  last_name: '',
  birth_date: '',
  birth_city_id: null,
  tax_code: '',
  email: '',
  phone: '',
  qualification_code: '',
  status_code: '',
}

export default function EducatoriPage() {
  const [infoOpen, setInfoOpen] = useState(false)
  const [items, setItems] = useState<StaffMember[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [citySearch, setCitySearch] = useState('')
  const [cityLoading, setCityLoading] = useState(false)
  const [qualifications, setQualifications] = useState<StaffQualification[]>([])
  const [statuses, setStatuses] = useState<StaffStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filterFacilityId, setFilterFacilityId] = useState<number>(0)
  const [filterStatus, setFilterStatus] = useState<string>('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null)
  const [form, setForm] = useState<StaffMemberWrite>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const [conflictMsg, setConflictMsg] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null)
  const [deleteConflict, setDeleteConflict] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [loadedFacilities, loadedUsers, loadedQuals, loadedStatuses, loadedStaff] = await Promise.all([
        facilityApi.list(),
        adminUserApi.list(),
        lookupsApi.staffQualifications(),
        lookupsApi.staffStatuses(),
        staffMemberApi.list({
          facility_id: filterFacilityId || undefined,
          status: filterStatus || undefined,
        }),
      ])

      setFacilities(loadedFacilities)
      setUsers(loadedUsers)
      setQualifications(loadedQuals)
      setStatuses(loadedStatuses)
      setItems(loadedStaff)
    } catch (e) {
      setError(apiError(e).message ?? 'Errore caricamento educatori')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filterFacilityId, filterStatus])

  useEffect(() => {
    if (!modalOpen) return

    const normalizedSearch = citySearch.trim()
    const selectedCityId = form.birth_city_id ?? undefined

    if (!selectedCityId && normalizedSearch.length < 2) {
      setCities([])
      return
    }

    const timeoutId = window.setTimeout(async () => {
      setCityLoading(true)
      try {
        const loadedCities = await lookupsApi.cities({
          id: selectedCityId,
          q: normalizedSearch.length >= 2 ? normalizedSearch : undefined,
          limit: 25,
        })

        setCities(loadedCities)
      } catch {
        setCities([])
      } finally {
        setCityLoading(false)
      }
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [modalOpen, citySearch, form.birth_city_id])

  const availableUsers = useMemo(
    () => users.filter((user) => !items.some((item) => item.user_id === user.id && item.id !== editTarget?.id)),
    [users, items, editTarget]
  )

  const selectedCity = useMemo(
    () => cities.find((city) => city.id === form.birth_city_id) ?? editTarget?.birth_city ?? null,
    [cities, form.birth_city_id, editTarget]
  )

  const openCreate = () => {
    setEditTarget(null)
    setForm({
      ...EMPTY_FORM,
      facility_id: filterFacilityId || facilities[0]?.id || 0,
    })
    setCitySearch('')
    setCities([])
    setFieldErrors({})
    setConflictMsg(null)
    setModalOpen(true)
  }

  const openEdit = (item: StaffMember) => {
    setEditTarget(item)
    setForm({
      facility_id: item.facility_id,
      user_id: item.user_id ?? null,
      employee_code: item.employee_code,
      first_name: item.first_name,
      last_name: item.last_name,
      birth_date: item.birth_date ?? '',
      birth_city_id: item.birth_city_id ?? null,
      tax_code: item.tax_code ?? '',
      email: item.email ?? '',
      phone: item.phone ?? '',
      qualification_code: item.qualification_code ?? '',
      status_code: item.status_code ?? '',
    })
    setCitySearch(item.birth_city?.name ?? '')
    setCities(item.birth_city ? [item.birth_city] : [])
    setFieldErrors({})
    setConflictMsg(null)
    setModalOpen(true)
  }

  const formatCityOption = (city: City) => {
    const provinceName = city.province?.name
    const regionName = city.province?.region?.name
    const countryName = city.province?.region?.country?.name

    return [city.name, provinceName, regionName, countryName].filter(Boolean).join(' — ')
  }

  const handleSave = async () => {
    setSaving(true)
    setFieldErrors({})
    setConflictMsg(null)
    try {
      const payload: StaffMemberWrite = {
        ...form,
        user_id: form.user_id || null,
        birth_city_id: form.birth_city_id || null,
        birth_date: form.birth_date || null,
        tax_code: form.tax_code || null,
        email: form.email || null,
        phone: form.phone || null,
        qualification_code: form.qualification_code || null,
        status_code: form.status_code || null,
      }

      if (editTarget) {
        await staffMemberApi.update(editTarget.id, payload)
        toast.success('Educatore aggiornato')
      } else {
        await staffMemberApi.create(payload)
        toast.success('Educatore creato')
      }

      setModalOpen(false)
      load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) {
        setConflictMsg(errorMessage(ae))
      } else if (ae.status === 409) {
        setConflictMsg(ae.message ?? 'Record in uso')
      } else if (ae.errors) {
        setFieldErrors(ae.errors)
      } else {
        setConflictMsg(ae.message ?? 'Errore salvataggio')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteConflict(null)
    try {
      await staffMemberApi.delete(deleteTarget.id)
      toast.success('Educatore eliminato')
      setDeleteTarget(null)
      load()
    } catch (e) {
      const ae = apiError(e)
      setDeleteConflict(
        ae.status === 403 ? errorMessage(ae)
          : ae.status === 409 ? (ae.message ?? 'Record in uso: impossibile eliminare')
            : (ae.message ?? 'Errore eliminazione'))
    } finally {
      setDeleting(false)
    }
  }

  const fErr = (field: string) => fieldErrors[field]?.[0]

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0 }}>Educatori</h3>
                <button className='btn btn-light btn-sm d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
                  <Info size={13} /> Informazioni
                </button>
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item active'>Educatori</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Row>
          <Col sm='12'>
            <Card>
              <CardHeader className='d-flex justify-content-between align-items-center'>
                <div>
                  <h5 className='mb-0'>Anagrafica educatori</h5>
                  <small className='text-muted'>
                    Gli altri attori applicativi usano utenti + ruoli + assegnazioni; qui gestiamo solo l&apos;anagrafica del personale educativo.
                  </small>
                </div>
                <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
                  <Plus size={13} /> Nuovo educatore
                </Button>
              </CardHeader>
              <CardBody>
                <Alert color='info' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
                  Se serve accesso al software, collega l&apos;educatore a un <strong>utente applicativo</strong> già esistente.
                  I permessi non si gestiscono qui: si gestiscono in <strong>Utenti / Assegnazioni / Ruoli</strong>.
                </Alert>

                <div className='row g-3 mb-4'>
                  <div className='col-md-6'>
                    <Label>Filtra per struttura</Label>
                    <Input type='select' value={filterFacilityId} onChange={(e) => setFilterFacilityId(Number(e.target.value))}>
                      <option value={0}>Tutte le strutture</option>
                      {facilities.map((facility) => (
                        <option key={facility.id} value={facility.id}>{facility.name}</option>
                      ))}
                    </Input>
                  </div>
                  <div className='col-md-6'>
                    <Label>Filtra per stato</Label>
                    <Input type='select' value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value=''>Tutti</option>
                      <option value='active'>Attivo</option>
                      <option value='inactive'>Inattivo</option>
                      <option value='suspended'>Sospeso</option>
                    </Input>
                  </div>
                </div>

                {error && <Alert color='danger'>{error}</Alert>}
                {loading
                  ? <div className='text-center py-5'><div className='loader' /></div>
                  : (
                    <div className='table-responsive'>
                      <table className='table table-hover'>
                        <thead>
                          <tr>
                            <th>Codice</th>
                            <th>Nome</th>
                            <th>Struttura</th>
                            <th>Account</th>
                            <th>Accesso software</th>
                            <th>Qualifica professionale</th>
                            <th>Stato</th>
                            <th>Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.length === 0
                            ? <tr><td colSpan={8} className='text-muted text-center'>Nessun educatore registrato.</td></tr>
                            : items.map((item) => {
                              const linkedUser = item.user_id ? users.find((u) => u.id === item.user_id) : null
                              const hasAccess = !!linkedUser && linkedUser.is_active
                              return (
                                <tr key={item.id}>
                                  <td><code>{item.employee_code}</code></td>
                                  <td>
                                    <div style={{ fontWeight: 600 }}>{item.first_name} {item.last_name}</div>
                                    <small className='text-muted'>{item.email || 'Nessuna email'}</small>
                                  </td>
                                  <td>{item.facility?.name ?? `#${item.facility_id}`}</td>
                                  <td>
                                    {linkedUser
                                      ? (
                                        <span>
                                          <span className='badge bg-success me-1'>Collegato</span>
                                          <small className='text-muted d-block'>{linkedUser.first_name} {linkedUser.last_name}</small>
                                        </span>
                                      )
                                      : <span className='badge bg-warning text-dark'>Non collegato</span>}
                                  </td>
                                  <td>
                                    {hasAccess
                                      ? <span className='badge bg-success'>Sì</span>
                                      : <span className='badge bg-secondary'>No</span>}
                                  </td>
                                  <td>{item.qualification_label ?? item.qualification_lookup?.name ?? item.qualification ?? '—'}</td>
                                  <td>
                                    <span className={`badge ${item.status_code === 'ACTIVE' || item.status === 'active' ? 'badge-light-success' : 'badge-light-secondary'}`}>
                                      {item.status_label ?? item.status_lookup?.name ?? item.status ?? '—'}
                                    </span>
                                  </td>
                                  <td>
                                    <div className='d-flex gap-1'>
                                      <button className='btn btn-sm btn-outline-primary' onClick={() => openEdit(item)}><Edit2 size={12} /></button>
                                      <button className='btn btn-sm btn-outline-danger' onClick={() => { setDeleteTarget(item); setDeleteConflict(null) }}><Trash2 size={12} /></button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    </div>
                    )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size='lg'>
        <ModalHeader toggle={() => setModalOpen(false)}>
          {editTarget ? 'Modifica educatore' : 'Nuovo educatore'}
        </ModalHeader>
        <ModalBody>
          {conflictMsg && <Alert color='danger'>{conflictMsg}</Alert>}
          <div className='row'>
            <div className='col-md-6'>
              <FormGroup>
                <Label>Struttura <span className='text-danger'>*</span></Label>
                <Input type='select' value={form.facility_id} onChange={(e) => setForm((prev) => ({ ...prev, facility_id: Number(e.target.value) }))} invalid={!!fErr('facility_id')}>
                  <option value={0}>Seleziona struttura…</option>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>{facility.name}</option>
                  ))}
                </Input>
                {fErr('facility_id') && <div className='invalid-feedback d-block'>{fErr('facility_id')}</div>}
              </FormGroup>
            </div>
            <div className='col-md-6'>
              <FormGroup>
                <Label>Utente applicativo collegato</Label>
                <Input type='select' value={form.user_id ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, user_id: e.target.value ? Number(e.target.value) : null }))}>
                  <option value=''>Nessun collegamento</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.first_name} {user.last_name} ({user.email})</option>
                  ))}
                </Input>
              </FormGroup>
            </div>
            <div className='col-md-4'>
              <FormGroup>
                <Label>Codice <span className='text-danger'>*</span></Label>
                <Input value={form.employee_code} onChange={(e) => setForm((prev) => ({ ...prev, employee_code: e.target.value }))} invalid={!!fErr('employee_code')} />
                {fErr('employee_code') && <div className='invalid-feedback d-block'>{fErr('employee_code')}</div>}
              </FormGroup>
            </div>
            <div className='col-md-4'>
              <FormGroup>
                <Label>Nome <span className='text-danger'>*</span></Label>
                <Input value={form.first_name} onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))} invalid={!!fErr('first_name')} />
                {fErr('first_name') && <div className='invalid-feedback d-block'>{fErr('first_name')}</div>}
              </FormGroup>
            </div>
            <div className='col-md-4'>
              <FormGroup>
                <Label>Cognome <span className='text-danger'>*</span></Label>
                <Input value={form.last_name} onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))} invalid={!!fErr('last_name')} />
                {fErr('last_name') && <div className='invalid-feedback d-block'>{fErr('last_name')}</div>}
              </FormGroup>
            </div>
            <div className='col-md-4'>
              <FormGroup>
                <Label>Data nascita</Label>
                <Input type='date' value={form.birth_date ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, birth_date: e.target.value }))} />
              </FormGroup>
            </div>
            <div className='col-md-8'>
              <FormGroup>
                <Label>Citta nascita</Label>
                <Input
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value)
                    if (!e.target.value.trim()) {
                      setForm((prev) => ({ ...prev, birth_city_id: null }))
                    }
                  }}
                  placeholder='Scrivi almeno 2 caratteri per cercare la citta'
                />
                <small className='text-muted d-block mt-1'>
                  Ricerca dinamica sul database geografico.
                </small>
                <Input
                  type='select'
                  className='mt-2'
                  value={form.birth_city_id ?? ''}
                  onChange={(e) => {
                    const cityId = e.target.value ? Number(e.target.value) : null
                    const city = cities.find((item) => item.id === cityId) ?? null
                    setForm((prev) => ({ ...prev, birth_city_id: cityId }))
                    setCitySearch(city?.name ?? '')
                  }}
                >
                  <option value=''>
                    {cityLoading ? 'Ricerca citta in corso...' : selectedCity ? 'Mantieni citta selezionata' : 'Non specificata'}
                  </option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>{formatCityOption(city)}</option>
                  ))}
                </Input>
                {selectedCity && (
                  <small className='text-muted d-block mt-1'>
                    Selezionata: {formatCityOption(selectedCity)}
                  </small>
                )}
              </FormGroup>
            </div>
            <div className='col-md-4'>
              <FormGroup>
                <Label>Codice fiscale</Label>
                <Input value={form.tax_code ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, tax_code: e.target.value }))} />
              </FormGroup>
            </div>
            <div className='col-md-4'>
              <FormGroup>
                <Label>Email</Label>
                <Input type='email' value={form.email ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} invalid={!!fErr('email')} />
                {fErr('email') && <div className='invalid-feedback d-block'>{fErr('email')}</div>}
              </FormGroup>
            </div>
            <div className='col-md-4'>
              <FormGroup>
                <Label>Telefono</Label>
                <Input value={form.phone ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
              </FormGroup>
            </div>
            <div className='col-md-4'>
              <FormGroup>
                <Label>Stato</Label>
                <Input
                  type='select'
                  value={form.status_code ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, status_code: e.target.value }))}
                >
                  <option value=''>Seleziona stato…</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.code}>{s.name}</option>
                  ))}
                </Input>
              </FormGroup>
            </div>
            <div className='col-md-12'>
              <FormGroup>
                <Label>Qualifica professionale</Label>
                <Input
                  type='select'
                  value={form.qualification_code ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, qualification_code: e.target.value }))}
                >
                  <option value=''>Nessuna qualifica…</option>
                  {qualifications.map((q) => (
                    <option key={q.id} value={q.code}>{q.name}</option>
                  ))}
                </Input>
              </FormGroup>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>
            {saving ? 'Salvataggio…' : 'Salva'}
          </Button>
          <Button color='light' onClick={() => setModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)}>
        <ModalHeader toggle={() => setDeleteTarget(null)}>Conferma eliminazione</ModalHeader>
        <ModalBody>
          {deleteConflict
            ? <Alert color='danger'>{deleteConflict}</Alert>
            : <p>Eliminare <strong>{deleteTarget?.first_name} {deleteTarget?.last_name}</strong>? L&apos;operazione non è reversibile.</p>}
        </ModalBody>
        <ModalFooter>
          {!deleteConflict && (
            <Button color='danger' onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminazione…' : 'Elimina'}
            </Button>
          )}
          <Button color='light' onClick={() => setDeleteTarget(null)}>
            {deleteConflict ? 'Chiudi' : 'Annulla'}
          </Button>
        </ModalFooter>
      </Modal>

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Guida — Educatori'>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>A cosa serve</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            La sezione <strong>Educatori</strong> gestisce le figure educative come risorse
            organizzative della struttura. Descrive la persona come professionista,
            non come identità di accesso al software.
          </p>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Educatore vs Utente</h6>
          <div className='alert alert-info py-2 px-3 mb-2' style={{ fontSize: 13 }}>
            <strong>Educatore</strong> = figura professionale nella struttura.<br />
            <strong>Utente</strong> = identità digitale per accedere al software.<br />
            Le due entità possono essere collegate, ma non sono la stessa cosa.
          </div>
          <p style={{ fontSize: 14, color: '#444' }}>
            Un educatore può esistere anagraficamente senza avere credenziali applicative.
            Creare un educatore <strong>non</strong> crea automaticamente un account di accesso.
          </p>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Quando serve un account</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            Il collegamento con un account utente è necessario solo quando l'educatore deve:
          </p>
          <ul style={{ fontSize: 14, color: '#444', paddingLeft: 20 }}>
            <li>Accedere al software con credenziali proprie</li>
            <li>Vedere i minori a lui assegnati</li>
            <li>Operare su attività, uscite o documenti</li>
          </ul>
        </section>
        <section className='mb-3'>
          <h6 className='fw-bold mb-2'>Relazione con ruoli e minori</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            I permessi applicativi derivano dall'account utente collegato, dal ruolo assegnato
            e dalla struttura di riferimento. L'anagrafica educatore da sola non conferisce permessi.
          </p>
        </section>
      </InfoDrawer>
    </>
  )
}
