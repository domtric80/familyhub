import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardHeader, CardBody,
  FormGroup, Label, Input, Alert, Button, Badge, Spinner,
} from 'reactstrap'
import { Home, Database } from 'react-feather'
import { toast } from 'react-toastify'
import { adminGeoLoadApi, apiError, errorMessage } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import type {
  GeoLoadRunOption, GeoLoadContinentOption, GeoLoadCountryOption,
  GeoLoadRegionOption, GeoLoadProvinceOption, GeoLoadExecuteRequest, GeoLoadExecuteResponse,
} from '../../types'

// ── Helper select ─────────────────────────────────────────────────────────────

function SelectWithLoader({
  label, value, onChange, disabled, loading, options, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
  loading: boolean
  options: { value: string; label: string }[]
  placeholder: string
}) {
  return (
    <FormGroup>
      <Label className='fw-semibold'>
        {label}
        {loading && <Spinner size='sm' className='ms-2' />}
      </Label>
      <Input
        type='select'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
      >
        <option value=''>{loading ? 'Caricamento…' : placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Input>
      {!loading && !disabled && options.length === 0 && value === '' && (
        <small className='text-muted'>Nessun dato disponibile per questa selezione</small>
      )}
    </FormGroup>
  )
}

// ── Helpers livelli ───────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, string> = {
  countries: 'nazioni',
  regions: 'regioni',
  provinces: 'province',
  cities: 'città',
}

function hasLevel(run: GeoLoadRunOption | null, level: string): boolean {
  if (!run?.available_levels) return true // se non dichiarato, mostriamo tutto
  return run.available_levels.includes(level)
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function ScaricaGeografiaPage() {
  const { hasPermission } = useAuth()
  const canRead = hasPermission('geography_sync.read')
  const canRun  = hasPermission('geography_sync.run')

  // ── Dataset (run) ────────────────────────────────────────────────────────────
  const [runs, setRuns] = useState<GeoLoadRunOption[]>([])
  const [loadingRuns, setLoadingRuns] = useState(true)
  const [runsError, setRunsError] = useState<string | null>(null)
  const [selectedRun, setSelectedRun] = useState<GeoLoadRunOption | null>(null)

  // ── Contesto geografico ──────────────────────────────────────────────────────
  const [continents, setContinents] = useState<GeoLoadContinentOption[]>([])
  const [loadingContinents, setLoadingContinents] = useState(false)
  const [showContinents, setShowContinents] = useState(false)
  const [continentCode, setContinentCode] = useState('')

  const [countries, setCountries] = useState<GeoLoadCountryOption[]>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [countryKey, setCountryKey] = useState('')

  const [regions, setRegions] = useState<GeoLoadRegionOption[]>([])
  const [loadingRegions, setLoadingRegions] = useState(false)
  const [regionKey, setRegionKey] = useState('')

  const [provinces, setProvinces] = useState<GeoLoadProvinceOption[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [provinceKey, setProvinceKey] = useState('')

  // ── Esecuzione ──────────────────────────────────────────────────────────────
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<GeoLoadExecuteResponse | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [executeError, setExecuteError] = useState<string | null>(null)

  // ── Carica dataset disponibili ───────────────────────────────────────────────
  useEffect(() => {
    if (!canRead) return
    adminGeoLoadApi.runs()
      .then((data) => setRuns(data.filter((r) => r.is_loadable !== false)))
      .catch((e) => setRunsError(apiError(e).message ?? 'Errore caricamento dataset'))
      .finally(() => setLoadingRuns(false))
  }, [canRead])

  // ── Quando dataset cambia: carica opzioni geografiche ───────────────────────
  useEffect(() => {
    // reset tutto
    setContinentCode(''); setContinents([]); setShowContinents(false)
    setCountries([]); setCountryKey('')
    setRegions([]); setRegionKey('')
    setProvinces([]); setProvinceKey('')
    setResult(null); setResultMessage(null); setExecuteError(null)

    if (!selectedRun?.source) return

    const { id, source } = selectedRun
    setLoadingContinents(true)
    adminGeoLoadApi.continents(id, source)
      .then((data) => {
        if (data.length > 0) {
          setContinents(data); setShowContinents(true)
        } else {
          setShowContinents(false)
          setLoadingCountries(true)
          adminGeoLoadApi.countries(id, source, null)
            .then(setCountries).catch(() => setCountries([]))
            .finally(() => setLoadingCountries(false))
        }
      })
      .catch(() => {
        setShowContinents(false)
        setLoadingCountries(true)
        adminGeoLoadApi.countries(selectedRun.id, selectedRun.source!, null)
          .then(setCountries).catch(() => setCountries([]))
          .finally(() => setLoadingCountries(false))
      })
      .finally(() => setLoadingContinents(false))
  }, [selectedRun])

  // ── Continente cambia ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showContinents) return
    setCountries([]); setCountryKey('')
    setRegions([]); setRegionKey(''); setProvinces([]); setProvinceKey('')
    if (!selectedRun?.source) return
    setLoadingCountries(true)
    adminGeoLoadApi.countries(selectedRun.id, selectedRun.source, continentCode || null)
      .then(setCountries).catch(() => setCountries([]))
      .finally(() => setLoadingCountries(false))
  }, [continentCode, showContinents]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Nazione cambia ───────────────────────────────────────────────────────────
  useEffect(() => {
    setRegions([]); setRegionKey(''); setProvinces([]); setProvinceKey('')
    if (!selectedRun?.source || !countryKey) return
    setLoadingRegions(true)
    adminGeoLoadApi.regions(selectedRun.id, selectedRun.source, countryKey)
      .then(setRegions).catch(() => setRegions([]))
      .finally(() => setLoadingRegions(false))
  }, [countryKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Regione cambia ───────────────────────────────────────────────────────────
  useEffect(() => {
    setProvinces([]); setProvinceKey('')
    if (!selectedRun?.source || !regionKey) return
    setLoadingProvinces(true)
    adminGeoLoadApi.provinces(selectedRun.id, selectedRun.source, regionKey)
      .then(setProvinces).catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false))
  }, [regionKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Esegui caricamento ───────────────────────────────────────────────────────
  const execute = async (req: GeoLoadExecuteRequest) => {
    setExecuting(true); setResult(null); setResultMessage(null); setExecuteError(null)
    try {
      const res = await adminGeoLoadApi.execute(req)
      setResult(res.data); setResultMessage(res.message)
      toast.success(res.message ?? 'Caricamento completato')
    } catch (e) {
      const ae = apiError(e)
      const msg = ae.status === 403 ? errorMessage(ae) : (ae.message ?? 'Errore durante il caricamento')
      setExecuteError(msg); toast.error(msg)
    } finally { setExecuting(false) }
  }

  const mkReq = (level: GeoLoadExecuteRequest['level'], recursive = false): GeoLoadExecuteRequest | null => {
    if (!selectedRun?.source) return null
    return {
      run_id: selectedRun.id,
      source: selectedRun.source as GeoLoadExecuteRequest['source'],
      level, recursive,
      continent_code: continentCode || null,
      country_key: countryKey || null,
      region_key: regionKey || null,
      province_key: provinceKey || null,
    }
  }

  const deepestLevel = (): GeoLoadExecuteRequest['level'] | null => {
    if (provinceKey) return 'cities'
    if (regionKey)   return 'provinces'
    if (countryKey)  return 'regions'
    if (selectedRun) return 'countries'
    return null
  }

  // ── Permesso assente ─────────────────────────────────────────────────────────
  if (!canRead) {
    return (
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Scarico geografia</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item active'>Scarico geografia</li>
              </ol>
            </Col>
          </Row>
        </div>
        <Row><Col><Alert color='warning'>Permesso insufficiente.</Alert></Col></Row>
      </Container>
    )
  }

  const level = deepestLevel()

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Scarico geografia</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'><Link to='/anagrafiche/geografia'>Geografia</Link></li>
                <li className='breadcrumb-item active'>Scarico</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        {/* Box esplicativo */}
        <Alert color='info' className='mb-4'>
          <strong>Sincronizzazione vs Scarico</strong>
          <p className='mb-0 mt-1 small'>
            La <strong>Sincronizzazione</strong> verifica le sorgenti esterne, acquisisce i dati raw e controlla
            le modifiche rispetto al database canonico.<br />
            Lo <strong>Scarico</strong> inserisce nel database applicativo i dati raw già acquisiti da una
            sincronizzazione completata, rendendoli disponibili nell'applicazione.
          </p>
        </Alert>

        <Row>
          <Col lg='7'>
            <Card>
              <CardHeader><h5 className='mb-0'>Selezione dataset</h5></CardHeader>
              <CardBody>
                {runsError && <Alert color='danger'>{runsError}</Alert>}

                {/* Step 1 — Dataset disponibile */}
                <FormGroup>
                  <Label className='fw-semibold'>
                    Dataset disponibile da scaricare
                    <span className='text-danger ms-1'>*</span>
                    {loadingRuns && <Spinner size='sm' className='ms-2' />}
                  </Label>
                  {!loadingRuns && runs.length === 0 && !runsError ? (
                    <Alert color='warning' className='mb-0'>
                      Nessun dataset scaricabile disponibile. Eseguire prima una sincronizzazione valida.
                    </Alert>
                  ) : (
                    <Input
                      type='select'
                      value={selectedRun?.id?.toString() ?? ''}
                      onChange={(e) => {
                        const run = runs.find((r) => r.id === Number(e.target.value)) ?? null
                        setSelectedRun(run)
                      }}
                      disabled={loadingRuns || runs.length === 0}
                    >
                      <option value=''>{loadingRuns ? 'Caricamento…' : 'Seleziona dataset…'}</option>
                      {runs.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.display_name ?? r.dataset ?? `Dataset #${r.id}`} — Run #{r.id}
                        </option>
                      ))}
                    </Input>
                  )}
                </FormGroup>

                {/* Sorgente in sola lettura */}
                {selectedRun && (
                  <FormGroup>
                    <Label className='fw-semibold'>Sorgente</Label>
                    <div className='d-flex align-items-center gap-2 mt-1'>
                      <Badge color='secondary' className='text-uppercase'>{selectedRun.source}</Badge>
                      {selectedRun.available_levels && (
                        <span className='text-muted small'>
                          Livelli disponibili: {selectedRun.available_levels.map((l) => LEVEL_LABELS[l] ?? l).join(', ')}
                        </span>
                      )}
                    </div>
                  </FormGroup>
                )}

                {/* Continente (opzionale) */}
                {showContinents && (
                  <SelectWithLoader
                    label='Continente'
                    value={continentCode}
                    onChange={setContinentCode}
                    disabled={!selectedRun}
                    loading={loadingContinents}
                    placeholder='Tutti i continenti'
                    options={continents.map((c) => ({ value: c.code, label: c.name }))}
                  />
                )}
                {loadingContinents && !showContinents && (
                  <div className='text-muted small mb-3'><Spinner size='sm' /> Verifica continenti…</div>
                )}

                {/* Nazione */}
                <SelectWithLoader
                  label='Nazione'
                  value={countryKey}
                  onChange={setCountryKey}
                  disabled={!selectedRun || loadingContinents || loadingCountries}
                  loading={loadingCountries}
                  placeholder='Seleziona nazione…'
                  options={countries.map((c) => ({ value: c.key, label: `${c.name}${c.iso_code ? ` (${c.iso_code})` : ''}` }))}
                />

                {/* Regione */}
                <SelectWithLoader
                  label='Regione'
                  value={regionKey}
                  onChange={setRegionKey}
                  disabled={!countryKey}
                  loading={loadingRegions}
                  placeholder={countryKey ? 'Seleziona regione…' : 'Seleziona prima una nazione'}
                  options={regions.map((r) => ({ value: r.key, label: r.name }))}
                />

                {/* Provincia */}
                <SelectWithLoader
                  label='Provincia'
                  value={provinceKey}
                  onChange={setProvinceKey}
                  disabled={!regionKey}
                  loading={loadingProvinces}
                  placeholder={regionKey ? 'Seleziona provincia…' : 'Seleziona prima una regione'}
                  options={provinces.map((p) => ({ value: p.key, label: `${p.name}${p.code ? ` (${p.code})` : ''}` }))}
                />
              </CardBody>
            </Card>
          </Col>

          <Col lg='5'>
            {/* Azioni */}
            <Card>
              <CardHeader><h5 className='mb-0'>Azioni di caricamento</h5></CardHeader>
              <CardBody>
                {!canRun && (
                  <Alert color='warning' className='small'>
                    Permesso <code>geography_sync.run</code> richiesto per eseguire il caricamento.
                  </Alert>
                )}

                <p className='text-muted small mb-3'>
                  I dati verranno inseriti nel database applicativo.
                </p>

                <div className='d-grid gap-2'>
                  {/* Carica nazioni */}
                  {hasLevel(selectedRun, 'countries') && (
                    <Button
                      color='primary' outline
                      disabled={!selectedRun || !canRun || executing}
                      onClick={() => { const r = mkReq('countries'); if (r) execute(r) }}
                    >
                      <Database size={14} className='me-1' /> Carica nazioni nel database
                    </Button>
                  )}

                  {/* Carica regioni */}
                  {hasLevel(selectedRun, 'regions') && (
                    <Button
                      color='primary' outline
                      disabled={!countryKey || !canRun || executing}
                      title={!countryKey ? 'Seleziona prima una nazione' : ''}
                      onClick={() => { const r = mkReq('regions'); if (r) execute(r) }}
                    >
                      <Database size={14} className='me-1' /> Carica regioni nel database
                    </Button>
                  )}

                  {/* Carica province */}
                  {hasLevel(selectedRun, 'provinces') && (
                    <Button
                      color='primary' outline
                      disabled={!regionKey || !canRun || executing}
                      title={!regionKey ? 'Seleziona prima una regione' : ''}
                      onClick={() => { const r = mkReq('provinces'); if (r) execute(r) }}
                    >
                      <Database size={14} className='me-1' /> Carica province nel database
                    </Button>
                  )}

                  {/* Carica città */}
                  {hasLevel(selectedRun, 'cities') && (
                    <Button
                      color='primary' outline
                      disabled={!provinceKey || !canRun || executing}
                      title={!provinceKey ? 'Seleziona prima una provincia' : ''}
                      onClick={() => { const r = mkReq('cities'); if (r) execute(r) }}
                    >
                      <Database size={14} className='me-1' /> Carica città nel database
                    </Button>
                  )}

                  <hr className='my-2' />

                  {/* Carica tutto */}
                  <Button
                    color='success'
                    disabled={!level || !canRun || executing}
                    onClick={() => {
                      if (!level) return
                      const r = mkReq(level, true); if (r) execute(r)
                    }}
                  >
                    {executing
                      ? <><Spinner size='sm' className='me-1' /> Caricamento in corso…</>
                      : <><Database size={14} className='me-1' /> Carica tutto nel database</>}
                  </Button>

                  {level && (
                    <small className='text-muted text-center'>
                      Caricamento ricorsivo dal livello: <strong>{LEVEL_LABELS[level] ?? level}</strong>
                    </small>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Risultato */}
            {(result || executeError) && (
              <Card className='mt-3'>
                <CardHeader><h5 className='mb-0'>Risultato</h5></CardHeader>
                <CardBody>
                  {executeError && <Alert color='danger'>{executeError}</Alert>}
                  {result && (
                    <>
                      {resultMessage && <Alert color='success'>{resultMessage}</Alert>}
                      <Row className='g-2 text-center'>
                        <Col xs='6'>
                          <div className='border rounded p-2'>
                            <div className='fs-4 fw-bold text-primary'>{result.countries}</div>
                            <small className='text-muted'>Nazioni</small>
                          </div>
                        </Col>
                        <Col xs='6'>
                          <div className='border rounded p-2'>
                            <div className='fs-4 fw-bold text-info'>{result.regions}</div>
                            <small className='text-muted'>Regioni</small>
                          </div>
                        </Col>
                        <Col xs='6'>
                          <div className='border rounded p-2'>
                            <div className='fs-4 fw-bold text-warning'>{result.provinces}</div>
                            <small className='text-muted'>Province</small>
                          </div>
                        </Col>
                        <Col xs='6'>
                          <div className='border rounded p-2'>
                            <div className='fs-4 fw-bold text-success'>{result.cities}</div>
                            <small className='text-muted'>Città</small>
                          </div>
                        </Col>
                      </Row>
                      <div className='mt-2 text-center'>
                        <Badge color='secondary' className='me-1'>Livello: {LEVEL_LABELS[result.level] ?? result.level}</Badge>
                        <Badge color={result.recursive ? 'primary' : 'light'}>
                          {result.recursive ? 'Ricorsivo' : 'Solo livello'}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </>
  )
}
