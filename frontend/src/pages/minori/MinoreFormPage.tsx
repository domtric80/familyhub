import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Container, Row, Col, Card, CardBody, Form, FormGroup, Label } from 'reactstrap'
import { Save, ArrowLeft, Home, Info } from 'react-feather'
import InfoDrawer from '../../components/common/InfoDrawer'
import { minorApi, lookupsApi, facilityApi, apiError } from '../../services/api'
import type { MinorWrite, LookupItem, Facility, City, Country, Region, Province } from '../../types'

export default function MinoreFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [infoOpen, setInfoOpen] = useState(false)
  const [form, setForm] = useState<MinorWrite>({
    facility_id: 0,
    internal_code: '',
    first_name: '',
    last_name: '',
    preferred_name: null,
    birth_date: '',
    birth_city_id: null,
    biological_sex_id: null,
    gender_identity_id: null,
    tax_code: null,
    entry_date: new Date().toISOString().split('T')[0],
    minor_status_id: 1,
  })

  const [facilities, setFacilities] = useState<Facility[]>([])
  const [statuses, setStatuses] = useState<LookupItem[]>([])
  const [biologicalSexes, setBiologicalSexes] = useState<LookupItem[]>([])
  const [genders, setGenders] = useState<LookupItem[]>([])
  const [geography, setGeography] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [birthCountryId, setBirthCountryId] = useState<number>(0)
  const [birthRegionId, setBirthRegionId] = useState<number>(0)
  const [birthProvinceId, setBirthProvinceId] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  useEffect(() => {
    Promise.all([
      facilityApi.list(),
      lookupsApi.minorStatuses(),
      lookupsApi.biologicalSexes(),
      lookupsApi.genderIdentities(),
      lookupsApi.geography(),
    ]).then(([f, s, bs, g, geo]) => {
      setFacilities(f)
      setStatuses(s)
      setBiologicalSexes(bs)
      setGenders(g)
      setGeography(geo)
      if (!isEdit && f.length > 0) setForm((prev) => ({ ...prev, facility_id: f[0].id }))
    }).then(async () => {
      if (isEdit && id) {
        const m = await minorApi.get(parseInt(id))
        setForm({
          facility_id: m.facility_id,
          internal_code: m.internal_code,
          first_name: m.first_name,
          last_name: m.last_name,
          preferred_name: m.preferred_name ?? null,
          birth_date: m.birth_date?.split('T')[0] ?? '',
          birth_city_id: m.birth_city_id ?? null,
          biological_sex_id: m.biological_sex_id ?? null,
          gender_identity_id: m.gender_identity_id ?? null,
          tax_code: m.tax_code ?? null,
          entry_date: m.entry_date?.split('T')[0] ?? '',
          minor_status_id: m.minor_status_id,
        })

        const city = m.birth_city
        const province = city?.province
        const region = province?.region
        const country = region?.country

        setBirthCountryId(country?.id ?? 0)
        setBirthRegionId(region?.id ?? 0)
        setBirthProvinceId(province?.id ?? 0)
      }
    }).catch((e) => setError(apiError(e).message ?? 'Errore'))
      .finally(() => setInitLoading(false))
  }, [id, isEdit])

  const selectedCountry = geography.find((country) => country.id === birthCountryId)
  const regions: Region[] = selectedCountry?.regions ?? []
  const selectedRegion = regions.find((region) => region.id === birthRegionId)
  const provinces: Province[] = selectedRegion?.provinces ?? []
  const filteredCities: City[] = provinces.find((province) => province.id === birthProvinceId)?.cities ?? []

  useEffect(() => {
    setCities(filteredCities)
  }, [filteredCities])

  const set = (field: keyof MinorWrite, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
  }

  const handleBirthCountryChange = (value: number) => {
    setBirthCountryId(value)
    setBirthRegionId(0)
    setBirthProvinceId(0)
    set('birth_city_id', null)
  }

  const handleBirthRegionChange = (value: number) => {
    setBirthRegionId(value)
    setBirthProvinceId(0)
    set('birth_city_id', null)
  }

  const handleBirthProvinceChange = (value: number) => {
    setBirthProvinceId(value)
    set('birth_city_id', null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})
    try {
      if (isEdit && id) {
        await minorApi.update(parseInt(id), form)
        navigate(`/minori/${id}`)
      } else {
        const created = await minorApi.create(form)
        navigate(`/minori/${created.id}`)
      }
    } catch (err) {
      const ae = apiError(err)
      setError(ae.message ?? 'Errore salvataggio')
      if (ae.errors) setFieldErrors(ae.errors)
    } finally {
      setLoading(false)
    }
  }

  const fErr = (f: string) => fieldErrors[f]?.[0]

  if (initLoading) return (
    <Container fluid>
      <div className='text-center' style={{ padding: 80 }}>
        <div className='loader'></div>
      </div>
    </Container>
  )

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <div className='d-flex align-items-center gap-2'>
                <h3 className='mb-0'>{isEdit ? 'Modifica minore' : 'Nuovo minore'}</h3>
                <button className='btn btn-light btn-sm d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)} aria-label='Informazioni su questa pagina'>
                  <Info size={13} /> Informazioni
                </button>
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'>
                  <Link to='/dashboard'><Home size={14} /></Link>
                </li>
                <li className='breadcrumb-item'>
                  <Link to='/minori'>Minori</Link>
                </li>
                <li className='breadcrumb-item active'>
                  {isEdit ? 'Modifica' : 'Nuovo'}
                </li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Row>
          <Col sm='12'>
            <Card>
              <CardBody>
                <div className='d-flex align-items-center gap-2 mb-4 pb-3 border-bottom'>
                  <button
                    type='button'
                    className='btn btn-light btn-sm d-flex align-items-center gap-1'
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft size={14} />
                    Indietro
                  </button>
                  <h5 className='mb-0'>
                    {isEdit ? 'Modifica scheda minore' : 'Registra nuovo minore'}
                  </h5>
                </div>

                {error && <div className='alert alert-danger mb-4'>{error}</div>}

                <Form className='form theme-form' onSubmit={handleSubmit}>
                  <Row>
                    <Col md='6'>
                      <FormGroup>
                        <Label>Struttura <span className='text-danger'>*</span></Label>
                        <select
                          className={`form-select${fErr('facility_id') ? ' is-invalid' : ''}`}
                          value={form.facility_id}
                          onChange={(e) => set('facility_id', parseInt(e.target.value))}
                          required
                        >
                          <option value=''>Seleziona struttura…</option>
                          {facilities.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                        {fErr('facility_id') && <div className='invalid-feedback'>{fErr('facility_id')}</div>}
                      </FormGroup>
                    </Col>

                    <Col md='6'>
                      <FormGroup>
                        <Label>Codice interno <span className='text-danger'>*</span></Label>
                        <input
                          className={`form-control${fErr('internal_code') ? ' is-invalid' : ''}`}
                          value={form.internal_code}
                          onChange={(e) => set('internal_code', e.target.value)}
                          required
                          placeholder='es. MIN-2026-001'
                        />
                        {fErr('internal_code') && <div className='invalid-feedback'>{fErr('internal_code')}</div>}
                      </FormGroup>
                    </Col>

                    <Col md='4'>
                      <FormGroup>
                        <Label>Nome <span className='text-danger'>*</span></Label>
                        <input
                          className={`form-control${fErr('first_name') ? ' is-invalid' : ''}`}
                          value={form.first_name}
                          onChange={(e) => set('first_name', e.target.value)}
                          required
                        />
                        {fErr('first_name') && <div className='invalid-feedback'>{fErr('first_name')}</div>}
                      </FormGroup>
                    </Col>

                    <Col md='4'>
                      <FormGroup>
                        <Label>Cognome <span className='text-danger'>*</span></Label>
                        <input
                          className={`form-control${fErr('last_name') ? ' is-invalid' : ''}`}
                          value={form.last_name}
                          onChange={(e) => set('last_name', e.target.value)}
                          required
                        />
                        {fErr('last_name') && <div className='invalid-feedback'>{fErr('last_name')}</div>}
                      </FormGroup>
                    </Col>

                    <Col md='4'>
                      <FormGroup>
                        <Label>Nome preferito / soprannome</Label>
                        <input
                          className='form-control'
                          value={form.preferred_name ?? ''}
                          onChange={(e) => set('preferred_name', e.target.value || null)}
                          placeholder='Opzionale'
                        />
                      </FormGroup>
                    </Col>

                    <Col md='4'>
                      <FormGroup>
                        <Label>Data di nascita <span className='text-danger'>*</span></Label>
                        <input
                          className={`form-control${fErr('birth_date') ? ' is-invalid' : ''}`}
                          type='date'
                          value={form.birth_date}
                          onChange={(e) => set('birth_date', e.target.value)}
                          required
                        />
                        {fErr('birth_date') && <div className='invalid-feedback'>{fErr('birth_date')}</div>}
                      </FormGroup>
                    </Col>

                    <Col md='4'>
                      <FormGroup>
                        <Label>Nazione di nascita</Label>
                        <select
                          className='form-select'
                          value={birthCountryId}
                          onChange={(e) => handleBirthCountryChange(parseInt(e.target.value))}
                        >
                          <option value='0'>Seleziona nazione…</option>
                          {geography.map((country) => (
                            <option key={country.id} value={country.id}>{country.name}</option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>

                    <Col md='4'>
                      <FormGroup>
                        <Label>Regione di nascita</Label>
                        <select
                          className='form-select'
                          value={birthRegionId}
                          onChange={(e) => handleBirthRegionChange(parseInt(e.target.value))}
                          disabled={!birthCountryId}
                        >
                          <option value='0'>{birthCountryId ? 'Seleziona regione…' : 'Seleziona prima una nazione'}</option>
                          {regions.map((region) => (
                            <option key={region.id} value={region.id}>{region.name}</option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>

                    <Col md='4'>
                      <FormGroup>
                        <Label>Provincia di nascita</Label>
                        <select
                          className='form-select'
                          value={birthProvinceId}
                          onChange={(e) => handleBirthProvinceChange(parseInt(e.target.value))}
                          disabled={!birthRegionId}
                        >
                          <option value='0'>{birthRegionId ? 'Seleziona provincia…' : 'Seleziona prima una regione'}</option>
                          {provinces.map((province) => (
                            <option key={province.id} value={province.id}>{province.name}</option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>

                    <Col md='4'>
                      <FormGroup>
                        <Label>Città di nascita</Label>
                        <select
                          className='form-select'
                          value={form.birth_city_id ?? ''}
                          onChange={(e) => set('birth_city_id', e.target.value ? parseInt(e.target.value) : null)}
                          disabled={!birthProvinceId}
                        >
                          <option value=''>{birthProvinceId ? 'Seleziona città…' : 'Seleziona prima una provincia'}</option>
                          {cities.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>

                    <Col md='4'>
                      <FormGroup>
                        <Label>Sesso biologico</Label>
                        <select
                          className='form-select'
                          value={form.biological_sex_id ?? ''}
                          onChange={(e) => set('biological_sex_id', e.target.value ? parseInt(e.target.value) : null)}
                        >
                          <option value=''>Seleziona…</option>
                          {biologicalSexes.map((item) => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>

                    <Col md='4'>
                      <FormGroup>
                        <Label>Identità di genere</Label>
                        <select
                          className='form-select'
                          value={form.gender_identity_id ?? ''}
                          onChange={(e) => set('gender_identity_id', e.target.value ? parseInt(e.target.value) : null)}
                        >
                          <option value=''>Seleziona…</option>
                          {genders.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      </FormGroup>
                    </Col>

                    <Col md='4'>
                      <FormGroup>
                        <Label>Codice fiscale</Label>
                        <input
                          className='form-control'
                          value={form.tax_code ?? ''}
                          onChange={(e) => set('tax_code', e.target.value.toUpperCase() || null)}
                          maxLength={16}
                          placeholder='XXXXXX00X00X000X'
                        />
                      </FormGroup>
                    </Col>

                    <Col md='4'>
                      <FormGroup>
                        <Label>Data ingresso <span className='text-danger'>*</span></Label>
                        <input
                          className={`form-control${fErr('entry_date') ? ' is-invalid' : ''}`}
                          type='date'
                          value={form.entry_date}
                          onChange={(e) => set('entry_date', e.target.value)}
                          required
                        />
                        {fErr('entry_date') && <div className='invalid-feedback'>{fErr('entry_date')}</div>}
                      </FormGroup>
                    </Col>

                    <Col md='4'>
                      <FormGroup>
                        <Label>Stato <span className='text-danger'>*</span></Label>
                        <select
                          className={`form-select${fErr('minor_status_id') ? ' is-invalid' : ''}`}
                          value={form.minor_status_id}
                          onChange={(e) => set('minor_status_id', parseInt(e.target.value))}
                          required
                        >
                          {statuses.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        {fErr('minor_status_id') && <div className='invalid-feedback'>{fErr('minor_status_id')}</div>}
                      </FormGroup>
                    </Col>
                  </Row>

                  <div className='d-flex gap-2 mt-3'>
                    <button
                      type='submit'
                      className='btn btn-primary d-flex align-items-center gap-1'
                      disabled={loading}
                    >
                      <Save size={16} />
                      {loading ? 'Salvataggio…' : isEdit ? 'Salva modifiche' : 'Registra minore'}
                    </button>
                    <button
                      type='button'
                      className='btn btn-light'
                      onClick={() => navigate(-1)}
                    >
                      Annulla
                    </button>
                  </div>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title={isEdit ? 'Guida — Modifica minore' : 'Guida — Nuovo minore'}>
        <p>{isEdit ? 'Questa pagina permette di aggiornare la scheda anagrafica del minore.' : 'Questa pagina permette di registrare un nuovo minore nel sistema.'}</p>
        <h6>Struttura di accoglienza</h6>
        <p>Seleziona la struttura presso cui il minore è accolto. L'elenco mostra solo le strutture a cui sei assegnato.</p>
        <h6>Codice interno</h6>
        <p>Identificativo anonimo utilizzato internamente (es. numero di cartella). Non usare nome o cognome reali.</p>
        <h6>Pseudonimo</h6>
        <p>Nome di fantasia visualizzato nell'audit log al posto del nome reale. Obbligatorio per garantire la riservatezza nei log.</p>
        <h6>Dati anagrafici</h6>
        <p>Data di nascita, genere biologico e genere dell'identità sono campi da lookup: seleziona dall'elenco, non inserire testo libero.</p>
        <h6>Nazionalità e luogo di nascita</h6>
        <p>Scegli il paese, poi la regione, la provincia e il comune in sequenza. I menu si aggiornano in base alla selezione precedente.</p>
        <h6>Stato</h6>
        <p>Indica la fase del percorso del minore (es. Accoglienza attiva, Dimesso). Modificabile solo dagli utenti con ruolo appropriato.</p>
        <h6>Permessi richiesti</h6>
        <p><code>minors.create</code> per registrare un nuovo minore, <code>minors.update</code> per modificarlo. Gli utenti con ruolo COORDINATORE non possono creare né modificare minori.</p>
        <h6>In caso di errore</h6>
        <p>Se il salvataggio fallisce, verifica che tutti i campi obbligatori siano compilati e che il codice interno non sia già in uso in questa struttura.</p>
      </InfoDrawer>
    </>
  )
}




