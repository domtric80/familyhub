import { useEffect, useState } from 'react'
import {
  Container, Row, Col, Card, CardHeader, CardBody, Table,
  Button, Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Badge, Spinner, FormFeedback,
} from 'reactstrap'
import { Link } from 'react-router-dom'
import InfoDrawer from '../../components/common/InfoDrawer'
import { Home, Plus, Edit2, Trash2, Info } from 'react-feather'
import { toast } from 'react-toastify'
import {
  facilityApi, orgApi, lookupsApi,
  adminCountryApi, adminRegionApi, adminProvinceApi, adminCityApi,
  apiError, errorMessage,
} from '../../services/api'
import type {
  Facility, FacilityWrite, FacilityStatus, Organization,
  Country, Region, Province, City,
} from '../../types'

// ── Tipi form ─────────────────────────────────────────────────────────────────

type FacilityForm = {
  organization_id: string
  code: string; name: string; address_line: string
  country_id: string; region_id: string; province_id: string; city_id: string
  postal_code: string; capacity: string; status_code: string
}

const emptyForm = (): FacilityForm => ({
  organization_id: '', code: '', name: '', address_line: '',
  country_id: '', region_id: '', province_id: '', city_id: '',
  postal_code: '', capacity: '', status_code: '',
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function SelectLoader({ label, value, onChange, disabled, loading, options, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void
  disabled: boolean; loading: boolean
  options: { id: string | number; label: string }[]
  placeholder: string; required?: boolean
}) {
  return (
    <FormGroup>
      <Label>{label}{required && <span className='text-danger ms-1'>*</span>}</Label>
      <Input type='select' value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled || loading}>
        <option value=''>{loading ? 'Caricamento…' : placeholder}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </Input>
    </FormGroup>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function StrutturePage() {
  const [infoOpen, setInfoOpen] = useState(false)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [orgs, setOrgs]             = useState<Organization[]>([])
  const [loading, setLoading]       = useState(true)
  const [pageErr, setPageErr]       = useState<string | null>(null)

  // Cascata geografica form
  const [allCountries, setAllCountries]   = useState<Country[]>([])
  const [regions, setRegions]             = useState<Region[]>([])
  const [provinces, setProvinces]         = useState<Province[]>([])
  const [cities, setCities]               = useState<City[]>([])
  const [loadingRegions, setLoadingRegions]     = useState(false)
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities]       = useState(false)
  const [hydratingEditGeo, setHydratingEditGeo] = useState(false)
  const [facilityStatuses, setFacilityStatuses] = useState<FacilityStatus[]>([])

  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState<Facility | null>(null)
  const [form, setForm]       = useState<FacilityForm>(emptyForm())
  const [saving, setSaving]   = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)

  const [deleteModal, setDeleteModal]   = useState(false)
  const [deletingFac, setDeletingFac]   = useState<Facility | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── Load base ─────────────────────────────────────────────────────────────
  const loadFacilities = () => {
    setLoading(true)
    Promise.all([facilityApi.list(), orgApi.list(), adminCountryApi.list(), lookupsApi.facilityStatuses()])
      .then(([f, o, c, fs]) => { setFacilities(f); setOrgs(o); setAllCountries(c); setFacilityStatuses(fs) })
      .catch((e) => setPageErr(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoading(false))
  }

  useEffect(loadFacilities, [])

  // ── Cascata geografica ────────────────────────────────────────────────────
  useEffect(() => {
    if (hydratingEditGeo || !modal) return
    setRegions([]); setProvinces([]); setCities([])
    setForm((p) => ({ ...p, region_id: '', province_id: '', city_id: '' }))
    if (!form.country_id) return
    setLoadingRegions(true)
    adminRegionApi.list(Number(form.country_id))
      .then(setRegions).catch(() => setRegions([]))
      .finally(() => setLoadingRegions(false))
  }, [form.country_id, hydratingEditGeo, modal]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hydratingEditGeo || !modal) return
    setProvinces([]); setCities([])
    setForm((p) => ({ ...p, province_id: '', city_id: '' }))
    if (!form.region_id) return
    setLoadingProvinces(true)
    adminProvinceApi.list(Number(form.region_id))
      .then(setProvinces).catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false))
  }, [form.region_id, hydratingEditGeo, modal]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hydratingEditGeo || !modal) return
    setCities([])
    setForm((p) => ({ ...p, city_id: '' }))
    if (!form.province_id) return
    setLoadingCities(true)
    adminCityApi.list(Number(form.province_id))
      .then(setCities).catch(() => setCities([]))
      .finally(() => setLoadingCities(false))
  }, [form.province_id, hydratingEditGeo, modal]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Modal ─────────────────────────────────────────────────────────────────
  const openNew = () => {
    setHydratingEditGeo(false)
    setRegions([]); setProvinces([]); setCities([])
    setEditing(null); setForm(emptyForm()); setFormErr(null); setModal(true)
  }

  const openEdit = async (f: Facility) => {
    setEditing(f)
    const city = f.city
    const province = city?.province
    const region = province?.region
    const country = region?.country
    setHydratingEditGeo(true)
    setRegions([]); setProvinces([]); setCities([])
    setForm({
      organization_id: f.organization_id.toString(),
      code: f.code, name: f.name, address_line: f.address_line,
      country_id: country?.id?.toString() ?? '',
      region_id: region?.id?.toString() ?? '',
      province_id: province?.id?.toString() ?? '',
      city_id: f.city_id.toString(),
      postal_code: f.postal_code ?? '',
      capacity: f.capacity?.toString() ?? '',
      status_code: f.status_code ?? f.status ?? '',
    })
    setFormErr(null); setModal(true)

    try {
      if (country?.id) {
        setRegions(await adminRegionApi.list(country.id))
      }

      if (region?.id) {
        setProvinces(await adminProvinceApi.list(region.id))
      }

      if (province?.id) {
        setCities(await adminCityApi.list(province.id))
      }
    } finally {
      setHydratingEditGeo(false)
    }
  }

  const closeModal = () => {
    setModal(false); setEditing(null); setHydratingEditGeo(false)
    setRegions([]); setProvinces([]); setCities([])
  }

  const confirmDelete = (f: Facility) => { setDeletingFac(f); setDeleteModal(true) }
  const handleDelete = async () => {
    if (!deletingFac) return
    setDeleteLoading(true)
    try {
      await facilityApi.delete(deletingFac.id)
      toast.success('Struttura eliminata')
      setDeleteModal(false); loadFacilities()
    } catch (e) {
      const ae = apiError(e)
      // 409: vincolo integrità — mostrare messaggio backend verbatim
      toast.error(ae.message ?? 'Errore eliminazione')
      setDeleteModal(false)
    } finally { setDeleteLoading(false) }
  }

  const handleSubmit = async () => {
    if (!form.organization_id) { setFormErr('Seleziona un\'organizzazione'); return }
    if (!form.code.trim())     { setFormErr('Il codice è obbligatorio'); return }
    if (!form.name.trim())     { setFormErr('Il nome è obbligatorio'); return }
    if (!form.city_id)         { setFormErr('Seleziona una città'); return }

    setSaving(true); setFormErr(null)
    const payload: FacilityWrite = {
      organization_id: Number(form.organization_id),
      code: form.code.trim(),
      name: form.name.trim(),
      address_line: form.address_line.trim(),
      city_id: Number(form.city_id),
      postal_code: form.postal_code || null,
      capacity: form.capacity ? Number(form.capacity) : null,
      status_code: form.status_code || null,
    }
    try {
      if (editing) {
        await facilityApi.update(editing.id, payload)
        toast.success('Struttura aggiornata')
      } else {
        await facilityApi.create(payload)
        toast.success('Struttura creata')
      }
      closeModal(); loadFacilities()
    } catch (e) {
      const ae = apiError(e)
      setFormErr(ae.status === 403 ? errorMessage(ae) : (ae.message ?? 'Errore salvataggio'))
    } finally { setSaving(false) }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0 }}>Strutture</h3>
                <button className='btn btn-light btn-sm d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
                  <Info size={13} /> Informazioni
                </button>
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'>Admin</li>
                <li className='breadcrumb-item active'>Strutture</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Card>
          <CardHeader className='d-flex justify-content-between align-items-center'>
            <h5 className='mb-0'>Case-famiglia gestite</h5>
            <Button color='primary' size='sm' onClick={openNew}>
              <Plus size={14} className='me-1' /> Nuova struttura
            </Button>
          </CardHeader>
          <CardBody>
            {pageErr && <Alert color='danger'>{pageErr}</Alert>}

            {loading
              ? <div className='text-center py-5'><Spinner /></div>
              : facilities.length === 0
                ? <div className='text-center py-5 text-muted'>Nessuna struttura registrata</div>
                : (
                  <div className='table-responsive'>
                    <Table hover className='table-border-horizontal mb-0'>
                      <thead>
                        <tr>
                          <th>Codice</th><th>Nome struttura</th><th>Organizzazione</th>
                          <th>Nazione</th><th>Regione</th><th>Provincia</th><th>Città</th>
                          <th>Indirizzo</th><th>CAP</th><th>Capienza</th><th>Stato</th><th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facilities.map((f) => (
                          <tr key={f.id}>
                            <td><Badge color='light' className='text-primary fw-semibold'>{f.code}</Badge></td>
                            <td className='fw-semibold'>{f.name}</td>
                            <td>{f.organization?.name ?? `#${f.organization_id}`}</td>
                            <td>{f.city?.province?.region?.country?.name ?? '—'}</td>
                            <td>{f.city?.province?.region?.name ?? '—'}</td>
                            <td>{f.city?.province?.name ?? '—'}</td>
                            <td>{f.city?.name ?? `#${f.city_id}`}</td>
                            <td><small className='text-muted'>{f.address_line}</small></td>
                            <td>{f.postal_code ?? '—'}</td>
                            <td>{f.capacity ?? '—'}</td>
                            <td>
                              {f.status_label ?? f.status_lookup?.name ?? f.status
                                ? <Badge color='light' className='badge-light-primary'>{f.status_label ?? f.status_lookup?.name ?? f.status}</Badge>
                                : <span className='text-muted'>—</span>}
                            </td>
                            <td>
                              <div className='d-flex gap-1'>
                                <Button color='light' size='sm' title='Modifica' onClick={() => openEdit(f)}>
                                  <Edit2 size={12} />
                                </Button>
                                <Button color='light' size='sm' title='Elimina' onClick={() => confirmDelete(f)}>
                                  <Trash2 size={12} className='text-danger' />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                    <div className='text-muted small p-2'>{facilities.length} strutture</div>
                  </div>
                )}
          </CardBody>
        </Card>
      </Container>

      {/* ── Modal delete ────────────────────────────────────────────────────── */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} size='sm'>
        <ModalHeader toggle={() => setDeleteModal(false)}>Elimina struttura</ModalHeader>
        <ModalBody>
          Eliminare la struttura <strong>{deletingFac?.name}</strong>?
          <br /><small className='text-muted'>L'operazione non può essere annullata.</small>
        </ModalBody>
        <ModalFooter>
          <Button color='secondary' onClick={() => setDeleteModal(false)}>Annulla</Button>
          <Button color='danger' onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? <Spinner size='sm' /> : 'Elimina'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal form ──────────────────────────────────────────────────────── */}
      <Modal isOpen={modal} toggle={closeModal} size='lg'>
        <ModalHeader toggle={closeModal}>
          {editing ? 'Modifica struttura' : 'Nuova struttura'}
        </ModalHeader>
        <ModalBody>
          {formErr && <Alert color='danger'>{formErr}</Alert>}
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Organizzazione <span className='text-danger'>*</span></Label>
                <Input type='select' value={form.organization_id}
                  onChange={(e) => setForm((p) => ({ ...p, organization_id: e.target.value }))}>
                  <option value=''>Seleziona…</option>
                  {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </Input>
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Codice <span className='text-danger'>*</span></Label>
                <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder='es. CF-MI-001' />
              </FormGroup>
            </Col>
            <Col xs='12'>
              <FormGroup>
                <Label>Nome struttura <span className='text-danger'>*</span></Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </FormGroup>
            </Col>
            <Col xs='12'>
              <FormGroup>
                <Label>Indirizzo</Label>
                <Input value={form.address_line} onChange={(e) => setForm((p) => ({ ...p, address_line: e.target.value }))} />
              </FormGroup>
            </Col>
          </Row>

          <hr className='my-2' />
          <p className='fw-semibold text-muted small mb-2'>Localizzazione geografica</p>

          <Row>
            <Col md='6'>
              <SelectLoader label='Nazione' value={form.country_id}
                onChange={(v) => setForm((p) => ({ ...p, country_id: v }))}
                disabled={false} loading={false}
                options={allCountries.map((c) => ({ id: c.id, label: c.name }))}
                placeholder='Seleziona nazione…' />
            </Col>
            <Col md='6'>
              <SelectLoader label='Regione' value={form.region_id}
                onChange={(v) => setForm((p) => ({ ...p, region_id: v }))}
                disabled={!form.country_id} loading={loadingRegions}
                options={regions.map((r) => ({ id: r.id, label: r.name }))}
                placeholder={form.country_id ? 'Seleziona regione…' : 'Seleziona prima una nazione'} />
            </Col>
            <Col md='6'>
              <SelectLoader label='Provincia' value={form.province_id}
                onChange={(v) => setForm((p) => ({ ...p, province_id: v }))}
                disabled={!form.region_id} loading={loadingProvinces}
                options={provinces.map((p) => ({ id: p.id, label: p.name }))}
                placeholder={form.region_id ? 'Seleziona provincia…' : 'Seleziona prima una regione'} />
            </Col>
            <Col md='6'>
              <SelectLoader label='Città *' value={form.city_id}
                onChange={(v) => setForm((p) => ({ ...p, city_id: v }))}
                disabled={!form.province_id} loading={loadingCities}
                options={cities.map((c) => ({ id: c.id, label: c.name }))}
                placeholder={form.province_id ? 'Seleziona città…' : 'Seleziona prima una provincia'}
                required />
            </Col>
          </Row>

          <Row>
            <Col md='4'>
              <FormGroup>
                <Label>CAP</Label>
                <Input maxLength={5} value={form.postal_code} onChange={(e) => setForm((p) => ({ ...p, postal_code: e.target.value }))} />
              </FormGroup>
            </Col>
            <Col md='4'>
              <FormGroup>
                <Label>Capienza</Label>
                <Input type='number' min={1} value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} />
              </FormGroup>
            </Col>
            <Col md='4'>
              <FormGroup>
                <Label>Stato struttura</Label>
                <Input type='select' value={form.status_code} onChange={(e) => setForm((p) => ({ ...p, status_code: e.target.value }))}>
                  <option value=''>Seleziona stato…</option>
                  {facilityStatuses.map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color='secondary' onClick={closeModal}>Annulla</Button>
          <Button color='primary' onClick={handleSubmit} disabled={saving}>
            {saving ? <Spinner size='sm' /> : 'Salva'}
          </Button>
        </ModalFooter>
      </Modal>

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Guida — Strutture'>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>A cosa serve</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            La sezione <strong>Strutture</strong> consente di configurare e mantenere i contesti
            organizzativi in cui operano utenti e minori. Una struttura non è solo un indirizzo:
            è un perimetro logico di lavoro.
          </p>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Perimetro organizzativo</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            La struttura influisce direttamente su:
          </p>
          <ul style={{ fontSize: 14, color: '#444', paddingLeft: 20 }}>
            <li>Ruolo attivo dell'utente nella struttura</li>
            <li>Visibilità dei minori</li>
            <li>Assegnazioni operative</li>
            <li>Reporting e perimetro audit</li>
          </ul>
          <div className='alert alert-warning py-2 px-3' style={{ fontSize: 13 }}>
            Molte autorizzazioni vanno sempre lette nel contesto della struttura.
            Una configurazione errata può riflettersi su utenti, minori e assegnazioni.
          </div>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Dati geografici</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            I riferimenti territoriali della struttura devono essere selezionati da anagrafiche
            canoniche, non scritti liberamente. Questo garantisce coerenza con minori, educatori
            e moduli documentali.
          </p>
        </section>
        <section className='mb-3'>
          <h6 className='fw-bold mb-2'>Dipendenze con altri moduli</h6>
          <table className='table table-sm table-bordered' style={{ fontSize: 13 }}>
            <thead className='table-light'>
              <tr><th>Modulo</th><th>Relazione</th></tr>
            </thead>
            <tbody>
              <tr><td>Utenti</td><td>Ruolo attivo per struttura</td></tr>
              <tr><td>Minori</td><td>Struttura di presa in carico</td></tr>
              <tr><td>Educatori</td><td>Appartenenza organizzativa</td></tr>
              <tr><td>Assegnazioni Minori</td><td>Perimetro operativo</td></tr>
              <tr><td>Audit Log</td><td>Contesto degli eventi</td></tr>
            </tbody>
          </table>
        </section>
      </InfoDrawer>
    </>
  )
}
