import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardHeader, CardBody,
  FormGroup, Label, Input, Alert, Button, Badge, Spinner,
} from 'reactstrap'
import { Home, Database, CheckCircle, XCircle } from 'react-feather'
import { toast } from 'react-toastify'
import { adminGeoImportApi, adminGeoApi, apiError } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import type { Country, GeoImportResponseData } from '../../types'

// ── Provider capability ───────────────────────────────────────────────────────

type ProviderCapability = 'full' | 'country_only'

function resolveCapability(country: Country | null): ProviderCapability {
  if (!country) return 'country_only'
  const iso = (country.iso_code ?? country.iso2 ?? '').toUpperCase()
  return iso === 'IT' ? 'full' : 'country_only'
}

function resolveProviderLabel(country: Country | null): string {
  if (!country) return '—'
  const iso = (country.iso_code ?? country.iso2 ?? '').toUpperCase()
  return iso === 'IT' ? 'ISTAT Italia' : 'GeoNames (generico)'
}

function CapabilityBox({ country }: { country: Country }) {
  const cap = resolveCapability(country)
  const isFull = cap === 'full'

  return (
    <Card className='border-info mb-0'>
      <CardHeader className='py-2 bg-light'>
        <small className='fw-semibold text-muted text-uppercase'>Capacità provider</small>
        <span className='ms-2 fw-semibold'>{resolveProviderLabel(country)}</span>
      </CardHeader>
      <CardBody className='py-3'>
        <div className='d-flex flex-wrap gap-2 mb-2'>
          <Badge color='success' className='d-flex align-items-center gap-1'>
            <CheckCircle size={11} /> Nazione
          </Badge>
          {isFull ? (
            <>
              <Badge color='success' className='d-flex align-items-center gap-1'><CheckCircle size={11} /> Regioni</Badge>
              <Badge color='success' className='d-flex align-items-center gap-1'><CheckCircle size={11} /> Province</Badge>
              <Badge color='success' className='d-flex align-items-center gap-1'><CheckCircle size={11} /> Città</Badge>
            </>
          ) : (
            <>
              <Badge color='secondary' className='d-flex align-items-center gap-1'><XCircle size={11} /> Regioni non disponibili</Badge>
              <Badge color='secondary' className='d-flex align-items-center gap-1'><XCircle size={11} /> Province non disponibili</Badge>
              <Badge color='secondary' className='d-flex align-items-center gap-1'><XCircle size={11} /> Città non disponibili</Badge>
            </>
          )}
        </div>
        <p className='mb-0 small text-muted'>
          {isFull
            ? 'Questo provider popola il database geografico italiano con regioni, province e città, in base al dataset ISTAT configurato.'
            : 'Questo provider aggiorna solo l\'anagrafica della nazione. I livelli amministrativi inferiori non sono disponibili con il provider corrente.'}
        </p>
      </CardBody>
    </Card>
  )
}

// ── Risultato import ──────────────────────────────────────────────────────────

function ImportResult({ data, message }: { data: GeoImportResponseData; message: string }) {
  return (
    <Card className='mt-3'>
      <CardHeader><h5 className='mb-0'>Risultato import</h5></CardHeader>
      <CardBody>
        <Alert color='success'>{message}</Alert>

        {data.warning && <Alert color='warning'>{data.warning}</Alert>}

        <Row className='g-2 mb-3'>
          <Col xs='6'>
            <div className='border rounded p-2 text-center'>
              <div className='small text-muted'>Provider utilizzato</div>
              <div className='fw-semibold'>{data.provider.name}</div>
              <small className='text-muted'>{data.provider.driver}{data.provider.mode ? ` · ${data.provider.mode}` : ''}</small>
            </div>
          </Col>
          <Col xs='6'>
            <div className='border rounded p-2 text-center'>
              <div className='small text-muted'>Nazione importata</div>
              <div className='fw-semibold'>{data.country.name}</div>
              <small className='text-muted'>{data.country.iso_code}</small>
            </div>
          </Col>
        </Row>

        <Row className='g-2 text-center'>
          <Col xs='6'>
            <div className='border rounded p-2'>
              <div className='fs-4 fw-bold text-primary'>{data.loaded.countries}</div>
              <small className='text-muted'>Nazioni</small>
            </div>
          </Col>
          <Col xs='6'>
            <div className='border rounded p-2'>
              <div className='fs-4 fw-bold text-info'>{data.loaded.regions}</div>
              <small className='text-muted'>Regioni</small>
            </div>
          </Col>
          <Col xs='6'>
            <div className='border rounded p-2'>
              <div className='fs-4 fw-bold text-warning'>{data.loaded.provinces}</div>
              <small className='text-muted'>Province</small>
            </div>
          </Col>
          <Col xs='6'>
            <div className='border rounded p-2'>
              <div className='fs-4 fw-bold text-success'>{data.loaded.cities}</div>
              <small className='text-muted'>Città</small>
            </div>
          </Col>
        </Row>

        <div className='mt-2 text-center'>
          <small className='text-muted'>Run #{data.run.id} · {data.run.status}</small>
        </div>
      </CardBody>
    </Card>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function ImportGeografiaPage() {
  const { hasPermission } = useAuth()
  const canRun = hasPermission('geography_sync.run')

  const [countries, setCountries] = useState<Country[]>([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)

  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<GeoImportResponseData | null>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    adminGeoApi.countries()
      .then(setCountries)
      .catch(() => {})
      .finally(() => setLoadingCountries(false))
  }, [])

  const handleCountryChange = (id: string) => {
    const c = countries.find((x) => x.id === Number(id)) ?? null
    setSelectedCountry(c)
    setImportResult(null); setImportMessage(null); setImportError(null)
  }

  const handleImport = async () => {
    if (!selectedCountry) return
    setImporting(true); setImportResult(null); setImportMessage(null); setImportError(null)
    try {
      const res = await adminGeoImportApi.import({ country_id: selectedCountry.id })
      setImportResult(res.data); setImportMessage(res.message)
      toast.success(res.message ?? 'Import completato')
    } catch (e) {
      const ae = apiError(e)
      const msg = ae.message ?? 'Errore durante l\'import'
      setImportError(msg); toast.error(msg)
    } finally { setImporting(false) }
  }

  if (!canRun) {
    return (
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Import geografia</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item active'>Import geografia</li>
              </ol>
            </Col>
          </Row>
        </div>
        <Row><Col><Alert color='warning'>Permesso <code>geography_sync.run</code> richiesto.</Alert></Col></Row>
      </Container>
    )
  }

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Import geografia</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item active'>Import geografia</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Alert color='info' className='mb-4'>
          Seleziona una nazione per importare i dati geografici nel database applicativo.
          Il provider verrà risolto automaticamente in base alla configurazione.
        </Alert>

        <Row>
          <Col lg='5'>
            <Card>
              <CardHeader><h5 className='mb-0'>Selezione nazione</h5></CardHeader>
              <CardBody>
                <FormGroup>
                  <Label className='fw-semibold'>
                    Nazione <span className='text-danger'>*</span>
                    {loadingCountries && <Spinner size='sm' className='ms-2' />}
                  </Label>
                  <Input
                    type='select'
                    value={selectedCountry?.id?.toString() ?? ''}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    disabled={loadingCountries}
                  >
                    <option value=''>{loadingCountries ? 'Caricamento…' : 'Seleziona nazione…'}</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Input>
                </FormGroup>

                {selectedCountry && (
                  <div className='mt-3'>
                    <CapabilityBox country={selectedCountry} />
                  </div>
                )}

                <div className='mt-4'>
                  <Button
                    color='primary'
                    block
                    disabled={!selectedCountry || importing}
                    onClick={handleImport}
                  >
                    {importing
                      ? <><Spinner size='sm' className='me-1' /> Import in corso…</>
                      : <><Database size={14} className='me-1' /> Importa nel database</>}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col lg='7'>
            {importError && (
              <Alert color='danger'>{importError}</Alert>
            )}
            {importResult && importMessage && (
              <ImportResult data={importResult} message={importMessage} />
            )}
            {!importResult && !importError && (
              <div className='text-muted text-center pt-5'>
                <Database size={40} className='mb-2 opacity-25' />
                <p>Il risultato dell'import apparirà qui.</p>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </>
  )
}
