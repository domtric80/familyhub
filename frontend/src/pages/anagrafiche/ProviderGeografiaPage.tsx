import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardHeader, CardBody,
  Nav, NavItem, NavLink, TabContent, TabPane,
  Table, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Spinner, FormFeedback,
} from 'reactstrap'
import { Home, Plus, Edit2, Trash2, Link2, Database, CheckCircle, XCircle, Upload } from 'react-feather'
import { toast } from 'react-toastify'
import {
  adminGeoProvidersApi, adminGeoApi, adminGeoImportApi,
  apiError,
} from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import type {
  GeoProvider, GeoProviderWrite, GeoProviderType, GeoProviderMode, GeoProviderFormat,
  CountryProviderMapping, CountryProviderMappingWrite,
  Country, GeoImportResponseData,
} from '../../types'

// ── Utility ───────────────────────────────────────────────────────────────────

function typeBadge(t: GeoProviderType) {
  return t === 'generic'
    ? <Badge color='secondary'>Generico</Badge>
    : <Badge color='primary'>Paese specifico</Badge>
}

function jsonValid(s: string) {
  if (!s.trim()) return true
  try { JSON.parse(s); return true } catch { return false }
}

function tryParseJson(s: string): Record<string, unknown> | null {
  if (!s.trim()) return null
  try { return JSON.parse(s) } catch { return null }
}

function sourceDisplay(p: GeoProvider) {
  if (p.source_url) return p.source_url
  if (p.source_path) return p.source_path
  return '—'
}

/** Livelli supportati in base al driver */
function supportedLevels(p: GeoProvider): string[] {
  const d = (p.driver ?? '').toLowerCase()
  if (d === 'istat' || d === 'geonames') return ['Nazione', 'Regioni', 'Province', 'Città']
  return ['Nazione']
}

// ── Tipi form ─────────────────────────────────────────────────────────────────

type ProviderForm = {
  code: string; name: string; type: GeoProviderType
  driver: string; mode: GeoProviderMode | ''
  format: GeoProviderFormat | ''; source_path: string; source_url: string
  auth_type: string; auth_config_json: string
  priority: string; is_active: boolean; notes: string
}

const emptyProviderForm = (): ProviderForm => ({
  code: '', name: '', type: 'generic', driver: '',
  mode: '', format: '', source_path: '', source_url: '',
  auth_type: 'none', auth_config_json: '', priority: '', is_active: true, notes: '',
})

const DRIVER_OPTIONS = [
  { value: 'istat', label: 'ISTAT', type: 'country_specific' as GeoProviderType, mode: 'remote_file' as GeoProviderMode, format: 'csv' as GeoProviderFormat, authType: 'none' },
  { value: 'geonames', label: 'GeoNames', type: 'generic' as GeoProviderType, mode: 'remote_file' as GeoProviderMode, format: 'txt' as GeoProviderFormat, authType: 'none' },
]

type MappingForm = {
  provider_id: string; is_default: boolean
  priority: string; is_active: boolean; config_override_json: string
}

const emptyMappingForm = (): MappingForm => ({
  provider_id: '', is_default: false, priority: '', is_active: true, config_override_json: '',
})

// ── Capability provider ───────────────────────────────────────────────────────

function CapabilityBox({ provider }: { provider: GeoProvider }) {
  const levels = supportedLevels(provider)
  const isFull = levels.includes('Città')
  const providerName = provider.name
  const driver = (provider.driver ?? '').toLowerCase()

  return (
    <Card className='border-info mb-0'>
      <CardHeader className='py-2 bg-light'>
        <small className='fw-semibold text-muted text-uppercase'>Provider risolto</small>
        <span className='ms-2 fw-semibold'>{providerName}</span>
      </CardHeader>
      <CardBody className='py-3'>
        <div className='d-flex flex-wrap gap-2 mb-2'>
          <Badge color='success' className='d-flex align-items-center gap-1'><CheckCircle size={11} /> Nazione</Badge>
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
            ? driver === 'geonames'
              ? 'Questo provider importa la gerarchia geografica completa della nazione selezionata (nazione, regioni, province, città). Il CAP potrebbe non essere disponibile nel dataset GeoNames.'
              : 'Questo provider popola il database geografico italiano con regioni, province e città, in base al dataset ISTAT configurato.'
            : 'Questo provider aggiorna solo l\'anagrafica della nazione. I livelli amministrativi inferiori non sono disponibili con il provider corrente.'}
        </p>
      </CardBody>
    </Card>
  )
}

// ── Risultato import ──────────────────────────────────────────────────────────

function ImportResult({ data, message }: { data: GeoImportResponseData; message: string }) {
  return (
    <>
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
        {(['countries', 'regions', 'provinces', 'cities'] as const).map((k) => (
          <Col xs='6' key={k}>
            <div className='border rounded p-2'>
              <div className='fs-5 fw-bold text-primary'>{data.loaded[k]}</div>
              <small className='text-muted'>{{ countries: 'Nazioni', regions: 'Regioni', provinces: 'Province', cities: 'Città' }[k]}</small>
            </div>
          </Col>
        ))}
      </Row>
      <div className='mt-2 text-center'>
        <small className='text-muted'>Run #{data.run.id} · {data.run.status}</small>
      </div>
    </>
  )
}

// ── Pagina principale ─────────────────────────────────────────────────────────

export default function ProviderGeografiaPage() {
  const { hasPermission } = useAuth()
  const canRead   = hasPermission('geography_providers.read')
  const canCreate = hasPermission('geography_providers.create')
  const canUpdate = hasPermission('geography_providers.update')
  const canDelete = hasPermission('geography_providers.delete')
  const canImport = hasPermission('geography_sync.run')

  const [activeTab, setActiveTab] = useState<'providers' | 'mappings' | 'import'>('providers')

  // ── Providers ───────────────────────────────────────────────────────────────
  const [providers, setProviders] = useState<GeoProvider[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [provErr, setProvErr] = useState<string | null>(null)

  const [provModal, setProvModal] = useState(false)
  const [provForm, setProvForm] = useState<ProviderForm>(emptyProviderForm())
  const [editingProv, setEditingProv] = useState<GeoProvider | null>(null)
  const [savingProv, setSavingProv] = useState(false)
  const [provFormErr, setProvFormErr] = useState<string | null>(null)

  const [deleteProvModal, setDeleteProvModal] = useState(false)
  const [deletingProv, setDeletingProv] = useState<GeoProvider | null>(null)
  const [deleteProvLoading, setDeleteProvLoading] = useState(false)

  // ── Associazioni ────────────────────────────────────────────────────────────
  const [countries, setCountries] = useState<Country[]>([])
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null)
  const [mappings, setMappings] = useState<CountryProviderMapping[]>([])
  const [loadingMappings, setLoadingMappings] = useState(false)
  const [mappErr, setMappErr] = useState<string | null>(null)

  const [mapModal, setMapModal] = useState(false)
  const [mapForm, setMapForm] = useState<MappingForm>(emptyMappingForm())
  const [editingMap, setEditingMap] = useState<CountryProviderMapping | null>(null)
  const [savingMap, setSavingMap] = useState(false)
  const [mapFormErr, setMapFormErr] = useState<string | null>(null)

  const [deleteMapModal, setDeleteMapModal] = useState(false)
  const [deletingMap, setDeletingMap] = useState<CountryProviderMapping | null>(null)
  const [deleteMapLoading, setDeleteMapLoading] = useState(false)

  // ── Import ───────────────────────────────────────────────────────────────────
  const [importCountry, setImportCountry] = useState<Country | null>(null)
  const [importProviderOverride, setImportProviderOverride] = useState<GeoProvider | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<GeoImportResponseData | null>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  // ── Load ─────────────────────────────────────────────────────────────────────
  const loadProviders = () => {
    setLoadingProviders(true); setProvErr(null)
    adminGeoProvidersApi.list()
      .then(setProviders)
      .catch((e) => setProvErr(apiError(e).message ?? 'Errore caricamento provider'))
      .finally(() => setLoadingProviders(false))
  }

  useEffect(() => {
    if (!canRead) return
    loadProviders()
    adminGeoApi.countries().then(setCountries).catch(() => {}).finally(() => setLoadingCountries(false))
  }, [canRead])

  useEffect(() => {
    if (!selectedCountryId) { setMappings([]); return }
    setLoadingMappings(true); setMappErr(null)
    adminGeoProvidersApi.countryMappings(selectedCountryId)
      .then(setMappings)
      .catch((e) => setMappErr(apiError(e).message ?? 'Errore caricamento associazioni'))
      .finally(() => setLoadingMappings(false))
  }, [selectedCountryId])

  // ── CRUD Provider ─────────────────────────────────────────────────────────────
  const openNewProv = () => {
    setEditingProv(null); setProvForm(emptyProviderForm()); setProvFormErr(null); setProvModal(true)
  }
  const openEditProv = (p: GeoProvider) => {
    setEditingProv(p)
    setProvForm({
      code: p.code, name: p.name, type: p.type,
      driver: p.driver ?? '', mode: p.mode ?? '', format: p.format ?? '',
      source_path: p.source_path ?? '', source_url: p.source_url ?? '',
      auth_type: p.auth_type ?? '',
      auth_config_json: p.auth_config_json ? JSON.stringify(p.auth_config_json, null, 2) : '',
      priority: p.priority?.toString() ?? '', is_active: p.is_active, notes: p.notes ?? '',
    })
    setProvFormErr(null); setProvModal(true)
  }

  const saveProv = async () => {
    if (!jsonValid(provForm.auth_config_json)) { setProvFormErr('Config autenticazione JSON non valido'); return }
    setSavingProv(true); setProvFormErr(null)
    const payload: GeoProviderWrite = {
      code: provForm.code.trim(), name: provForm.name.trim(), type: provForm.type,
      driver: provForm.driver.trim() || null,
      mode: (provForm.mode || null) as GeoProviderMode | null,
      format: (provForm.format || null) as GeoProviderFormat | null,
      source_path: provForm.source_path.trim() || null,
      source_url: provForm.source_url.trim() || null,
      auth_type: provForm.auth_type.trim() || null,
      auth_config_json: tryParseJson(provForm.auth_config_json),
      priority: provForm.priority ? Number(provForm.priority) : null,
      is_active: provForm.is_active,
      notes: provForm.notes.trim() || null,
    }
    try {
      if (editingProv) {
        await adminGeoProvidersApi.update(editingProv.id, payload)
        toast.success('Provider aggiornato')
      } else {
        await adminGeoProvidersApi.create(payload)
        toast.success('Provider creato')
      }
      setProvModal(false); loadProviders()
    } catch (e) {
      setProvFormErr(apiError(e).message ?? 'Errore salvataggio')
    } finally { setSavingProv(false) }
  }

  const confirmDeleteProv = (p: GeoProvider) => { setDeletingProv(p); setDeleteProvModal(true) }
  const deleteProv = async () => {
    if (!deletingProv) return
    setDeleteProvLoading(true)
    try {
      await adminGeoProvidersApi.delete(deletingProv.id)
      toast.success('Provider eliminato')
      setDeleteProvModal(false); loadProviders()
    } catch (e) {
      const ae = apiError(e)
      toast.error(ae.status === 409 ? 'Impossibile eliminare: provider associato a nazioni' : (ae.message ?? 'Errore eliminazione'))
      setDeleteProvModal(false)
    } finally { setDeleteProvLoading(false) }
  }

  // ── CRUD Mappings ─────────────────────────────────────────────────────────────
  const openNewMap = () => {
    setEditingMap(null); setMapForm(emptyMappingForm()); setMapFormErr(null); setMapModal(true)
  }
  const openEditMap = (m: CountryProviderMapping) => {
    setEditingMap(m)
    setMapForm({
      provider_id: m.provider_id.toString(), is_default: m.is_default,
      priority: m.priority?.toString() ?? '', is_active: m.is_active,
      config_override_json: m.config_override_json ? JSON.stringify(m.config_override_json, null, 2) : '',
    })
    setMapFormErr(null); setMapModal(true)
  }

  const saveMap = async () => {
    if (!selectedCountryId) return
    if (!mapForm.provider_id) { setMapFormErr('Seleziona un provider'); return }
    if (!jsonValid(mapForm.config_override_json)) { setMapFormErr('Config override JSON non valido'); return }
    setSavingMap(true); setMapFormErr(null)
    const payload: CountryProviderMappingWrite = {
      provider_id: Number(mapForm.provider_id),
      geography_provider_id: Number(mapForm.provider_id),
      country_id: selectedCountryId,
      is_default: mapForm.is_default, is_active: mapForm.is_active,
      priority: mapForm.priority ? Number(mapForm.priority) : null,
      config_override_json: tryParseJson(mapForm.config_override_json),
    }
    try {
      if (editingMap) {
        await adminGeoProvidersApi.updateMapping(selectedCountryId, editingMap.provider_id, payload)
        toast.success('Associazione aggiornata')
      } else {
        await adminGeoProvidersApi.addMapping(selectedCountryId, payload)
        toast.success('Provider associato')
      }
      setMapModal(false)
      adminGeoProvidersApi.countryMappings(selectedCountryId).then(setMappings).catch(() => {})
    } catch (e) {
      setMapFormErr(apiError(e).message ?? 'Errore salvataggio')
    } finally { setSavingMap(false) }
  }

  const confirmDeleteMap = (m: CountryProviderMapping) => { setDeletingMap(m); setDeleteMapModal(true) }
  const deleteMap = async () => {
    if (!deletingMap || !selectedCountryId) return
    setDeleteMapLoading(true)
    try {
      await adminGeoProvidersApi.deleteMapping(selectedCountryId, deletingMap.provider_id)
      toast.success('Associazione rimossa')
      setDeleteMapModal(false)
      adminGeoProvidersApi.countryMappings(selectedCountryId).then(setMappings).catch(() => {})
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore eliminazione')
      setDeleteMapModal(false)
    } finally { setDeleteMapLoading(false) }
  }

  // ── Import ────────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!importCountry) return
    setImporting(true); setImportResult(null); setImportMessage(null); setImportError(null)
    try {
      const res = await adminGeoImportApi.import({ country_id: importCountry.id, provider_id: importProviderOverride?.id ?? null })
      setImportResult(res.data); setImportMessage(res.message)
      toast.success(res.message ?? 'Import completato')
    } catch (e) {
      const msg = apiError(e).message ?? 'Errore durante l\'import'
      setImportError(msg); toast.error(msg)
    } finally { setImporting(false) }
  }

  // ── Guard ─────────────────────────────────────────────────────────────────────
  const resolvedPreviewProvider = (() => {
    if (importProviderOverride) return importProviderOverride

    if (importCountry?.id && selectedCountryId === importCountry.id && mappings.length > 0) {
      const activeMappings = mappings.filter((m) => m.is_active && m.provider)
      const defaultMapping = activeMappings.find((m) => m.is_default)
      return defaultMapping?.provider ?? activeMappings.sort((a, b) => (a.priority ?? 9999) - (b.priority ?? 9999))[0]?.provider ?? null
    }

    const iso = (importCountry?.iso_code ?? importCountry?.iso2 ?? '').toUpperCase()
    if (iso === 'IT') {
      return providers.find((p) => p.code === 'ISTAT') ?? null
    }

    return providers.find((p) => p.type === 'generic' && p.is_active) ?? null
  })()

  if (!canRead) {
    return (
      <Container fluid>
        <div className='page-title'>
          <Row><Col xs='6'><h3>Provider geografia</h3></Col></Row>
        </div>
        <Alert color='warning'>Permesso <code>geography_providers.read</code> richiesto.</Alert>
      </Container>
    )
  }

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Provider geografia</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item active'>Provider geografia</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Card>
          <CardHeader>
            <Nav tabs className='border-tab'>
              {[
                { id: 'providers', label: 'Provider', icon: <Database size={14} /> },
                { id: 'mappings', label: 'Associazioni nazioni', icon: <Link2 size={14} /> },
                { id: 'import', label: 'Import dati', icon: <Upload size={14} /> },
              ].map(({ id, label, icon }) => (
                <NavItem key={id}>
                  <NavLink
                    className={activeTab === id ? 'active' : ''}
                    onClick={() => setActiveTab(id as typeof activeTab)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className='me-1'>{icon}</span>{label}
                  </NavLink>
                </NavItem>
              ))}
            </Nav>
          </CardHeader>

          <CardBody>
            <TabContent activeTab={activeTab}>

              {/* ═══════════ TAB PROVIDER ═══════════ */}
              <TabPane tabId='providers'>
                <div className='d-flex justify-content-between align-items-center mb-3'>
                  <span className='text-muted small'>{providers.length} provider configurati</span>
                  {canCreate && (
                    <Button color='primary' size='sm' onClick={openNewProv}>
                      <Plus size={14} className='me-1' /> Nuovo provider
                    </Button>
                  )}
                </div>

                {provErr && <Alert color='danger'>{provErr}</Alert>}
                {loadingProviders
                  ? <div className='text-center py-4'><Spinner /></div>
                  : providers.length === 0
                    ? <Alert color='info'>Nessun provider configurato.</Alert>
                    : (
                      <div className='table-responsive'>
                        <Table hover className='mb-0' style={{ fontSize: 13 }}>
                          <thead>
                            <tr>
                              <th>Codice</th><th>Nome</th><th>Tipo</th><th>Driver</th>
                              <th>Modalità</th><th>Formato</th><th>URL / Path</th>
                              <th>Priorità</th><th>Attivo</th><th>Livelli</th><th>Azioni</th>
                            </tr>
                          </thead>
                          <tbody>
                            {providers.map((p) => (
                              <tr key={p.id}>
                                <td><code>{p.code}</code></td>
                                <td>{p.name}</td>
                                <td>{typeBadge(p.type)}</td>
                                <td><small className='text-muted'>{p.driver ?? '—'}</small></td>
                                <td><small className='text-muted'>{p.mode ?? '—'}</small></td>
                                <td><small className='text-muted'>{p.format ?? '—'}</small></td>
                                <td><small className='text-muted text-truncate d-inline-block' style={{ maxWidth: 120 }}>{sourceDisplay(p)}</small></td>
                                <td>{p.priority ?? '—'}</td>
                                <td><Badge color={p.is_active ? 'success' : 'secondary'}>{p.is_active ? 'Sì' : 'No'}</Badge></td>
                                <td>
                                  <div className='d-flex flex-wrap gap-1'>
                                    {supportedLevels(p).map((l) => (
                                      <Badge key={l} color='light' className='text-dark' style={{ fontSize: 11 }}>{l}</Badge>
                                    ))}
                                  </div>
                                </td>
                                <td>
                                  <div className='d-flex gap-1'>
                                    {canUpdate && (
                                      <Button color='light' size='sm' title='Modifica provider' onClick={() => openEditProv(p)}>
                                        <Edit2 size={12} />
                                      </Button>
                                    )}
                                    <Button color='light' size='sm' title='Associa a nazioni' onClick={() => { setActiveTab('mappings') }}>
                                      <Link2 size={12} />
                                    </Button>
                                    <Button color='light' size='sm' title='Apri import' onClick={() => { setImportProviderOverride(p); if (p.code === 'ISTAT') { const italy = countries.find((c) => (c.iso_code ?? c.iso2 ?? '').toUpperCase() === 'IT') ?? null; setImportCountry(italy); setSelectedCountryId(italy?.id ?? null) } setImportResult(null); setImportMessage(null); setImportError(null); setActiveTab('import') }}>
                                      <Upload size={12} />
                                    </Button>
                                    {canDelete && (
                                      <Button color='light' size='sm' title='Elimina' onClick={() => confirmDeleteProv(p)}>
                                        <Trash2 size={12} className='text-danger' />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
              </TabPane>

              {/* ═══════════ TAB ASSOCIAZIONI ═══════════ */}
              <TabPane tabId='mappings'>
                <Row className='mb-3 align-items-end'>
                  <Col md='5'>
                    <FormGroup className='mb-0'>
                      <Label className='fw-semibold'>Nazione</Label>
                      <Input
                        type='select'
                        value={selectedCountryId ?? ''}
                        onChange={(e) => setSelectedCountryId(e.target.value ? Number(e.target.value) : null)}
                        disabled={loadingCountries}
                      >
                        <option value=''>{loadingCountries ? 'Caricamento…' : 'Seleziona nazione…'}</option>
                        {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </Input>
                      <small className='text-muted d-block mt-1'>
                        Se cambi nazione dopo aver aperto l&apos;import da un provider, il provider forzato viene ricalcolato.
                      </small>
                    </FormGroup>
                  </Col>
                  <Col md='7' className='text-end'>
                    {canCreate && selectedCountryId && (
                      <Button color='primary' size='sm' onClick={openNewMap}>
                        <Plus size={14} className='me-1' /> Associa provider
                      </Button>
                    )}
                  </Col>
                </Row>

                {!selectedCountryId && <Alert color='info'>Seleziona una nazione per vedere i provider associati.</Alert>}
                {selectedCountryId && mappErr && <Alert color='danger'>{mappErr}</Alert>}
                {selectedCountryId && loadingMappings && <div className='text-center py-4'><Spinner /></div>}
                {selectedCountryId && !loadingMappings && mappings.length === 0 && !mappErr && (
                  <Alert color='info'>Nessun provider associato a questa nazione.</Alert>
                )}
                {selectedCountryId && !loadingMappings && mappings.length > 0 && (
                  <div className='table-responsive'>
                    <Table hover className='mb-0'>
                      <thead>
                        <tr>
                          <th>Provider</th><th>Tipo</th><th>Default</th>
                          <th>Priorità</th><th>Attivo</th><th>Livelli supportati</th><th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappings.map((m) => (
                          <tr key={m.provider_id}>
                            <td>{m.provider?.name ?? `Provider #${m.provider_id}`}</td>
                            <td>{m.provider ? typeBadge(m.provider.type) : '—'}</td>
                            <td><Badge color={m.is_default ? 'success' : 'light'}>{m.is_default ? 'Default' : '—'}</Badge></td>
                            <td>{m.priority ?? '—'}</td>
                            <td><Badge color={m.is_active ? 'success' : 'secondary'}>{m.is_active ? 'Sì' : 'No'}</Badge></td>
                            <td>
                              <div className='d-flex flex-wrap gap-1'>
                                {m.provider ? supportedLevels(m.provider).map((l) => (
                                  <Badge key={l} color='light' className='text-dark' style={{ fontSize: 11 }}>{l}</Badge>
                                )) : '—'}
                              </div>
                            </td>
                            <td>
                              <div className='d-flex gap-1'>
                                {canUpdate && <Button color='light' size='sm' onClick={() => openEditMap(m)}><Edit2 size={12} /></Button>}
                                {canDelete && <Button color='light' size='sm' onClick={() => confirmDeleteMap(m)}><Trash2 size={12} className='text-danger' /></Button>}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </TabPane>

              {/* ═══════════ TAB IMPORT ═══════════ */}
              <TabPane tabId='import'>
                {!canImport && (
                  <Alert color='warning'>Permesso <code>geography_sync.run</code> richiesto per eseguire l'import.</Alert>
                )}

                <Alert color='info' className='mb-4'>
                  Flusso operativo: scegli la nazione e avvia l&apos;import.
                  Se hai aperto questa schermata dal pulsante di un provider, verrà usato quel provider.
                  In caso contrario il backend risolve il provider in base alle associazioni configurate per la nazione.
                </Alert>

                <Row>
                  <Col lg='5'>
                    {importProviderOverride && (
                      <Alert color='primary' className='mb-3'>
                        Import forzato sul provider <strong>{importProviderOverride.name}</strong> ({importProviderOverride.code}).
                      </Alert>
                    )}

                    <FormGroup>
                      <Label className='fw-semibold'>Nazione <span className='text-danger'>*</span></Label>
                      <Input
                        type='select'
                        value={importCountry?.id?.toString() ?? ''}
                        onChange={(e) => {
                          const c = countries.find((x) => x.id === Number(e.target.value)) ?? null
                          setImportCountry(c)
                          setSelectedCountryId(c?.id ?? null)
                          setImportProviderOverride(null)
                          setImportResult(null); setImportMessage(null); setImportError(null)
                        }}
                        disabled={loadingCountries}
                      >
                        <option value=''>{loadingCountries ? 'Caricamento…' : 'Seleziona nazione…'}</option>
                        {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </Input>
                    </FormGroup>

                    {importCountry && resolvedPreviewProvider && (
                      <div className='mt-3 mb-2'>
                        <CapabilityBox provider={resolvedPreviewProvider} />
                      </div>
                    )}

                    {resolvedPreviewProvider?.driver?.toLowerCase() === 'istat' && (
                      <Alert color='light' className='border mb-4 py-2 px-3' style={{ fontSize: 13 }}>
                        ℹ️ Il dataset ufficiale ISTAT non include il CAP. Il comune e il codice catastale sono completi; il CAP potrà essere integrato da un provider dedicato.
                      </Alert>
                    )}

                    <Button
                      color='primary' block
                      disabled={!importCountry || importing || !canImport}
                      onClick={handleImport}
                    >
                      {importing
                        ? <><Spinner size='sm' className='me-1' /> Import in corso…</>
                        : <><Database size={14} className='me-1' /> Importa dati nel database</>}
                    </Button>
                  </Col>

                  <Col lg='7'>
                    {importError && <Alert color='danger'>{importError}</Alert>}
                    {importResult && importMessage && (
                      <ImportResult data={importResult} message={importMessage} />
                    )}
                    {!importResult && !importError && importCountry && (
                      <div className='text-muted text-center pt-4'>
                        <Upload size={36} className='mb-2 opacity-25' />
                        <p>Clicca "Importa dati nel database" per avviare il caricamento.</p>
                      </div>
                    )}
                  </Col>
                </Row>
              </TabPane>
            </TabContent>
          </CardBody>
        </Card>
      </Container>

      {/* ── Modal form Provider ──────────────────────────────────────────────── */}
      <Modal isOpen={provModal} toggle={() => setProvModal(false)} size='lg'>
        <ModalHeader toggle={() => setProvModal(false)}>
          {editingProv ? 'Modifica provider' : 'Nuovo provider'}
        </ModalHeader>
        <ModalBody>
          {provFormErr && <Alert color='danger'>{provFormErr}</Alert>}
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Codice *</Label>
                <Input value={provForm.code} onChange={(e) => setProvForm((p) => ({ ...p, code: e.target.value }))} />
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Nome *</Label>
                <Input value={provForm.name} onChange={(e) => setProvForm((p) => ({ ...p, name: e.target.value }))} />
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Tipo</Label>
                <Input type='select' value={provForm.type} onChange={(e) => setProvForm((p) => ({ ...p, type: e.target.value as GeoProviderType }))}>
                  <option value='generic'>Generico</option>
                  <option value='country_specific'>Paese specifico</option>
                </Input>
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Driver</Label>
                <Input
                  type='select'
                  value={provForm.driver}
                  onChange={(e) => {
                    const selected = DRIVER_OPTIONS.find((option) => option.value === e.target.value)
                    setProvForm((p) => ({
                      ...p,
                      driver: e.target.value,
                      type: selected?.type ?? p.type,
                      mode: selected?.mode ?? p.mode,
                      format: selected?.format ?? p.format,
                      auth_type: selected?.authType ?? p.auth_type,
                    }))
                  }}
                >
                  <option value=''>Seleziona driver…</option>
                  {DRIVER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Input>
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md='4'>
              <FormGroup>
                <Label>Modalità sorgente</Label>
                <Input type='select' value={provForm.mode} onChange={(e) => setProvForm((p) => ({ ...p, mode: e.target.value as GeoProviderMode | '' }))}>
                  <option value=''>—</option>
                  <option value='local_file'>File locale</option>
                  <option value='remote_file'>File remoto</option>
                  <option value='api'>API</option>
                </Input>
              </FormGroup>
            </Col>
            <Col md='4'>
              <FormGroup>
                <Label>Formato</Label>
                <Input type='select' value={provForm.format} onChange={(e) => setProvForm((p) => ({ ...p, format: e.target.value as GeoProviderFormat | '' }))}>
                  <option value=''>—</option>
                  <option value='csv'>CSV</option>
                  <option value='zip'>ZIP</option>
                  <option value='json'>JSON</option>
                  <option value='xml'>XML</option>
                  <option value='txt'>TXT</option>
                </Input>
              </FormGroup>
            </Col>
            <Col md='4'>
              <FormGroup>
                <Label>Priorità</Label>
                <Input type='number' value={provForm.priority} onChange={(e) => setProvForm((p) => ({ ...p, priority: e.target.value }))} />
              </FormGroup>
            </Col>
          </Row>
          {(provForm.mode === 'local_file') && (
            <FormGroup>
              <Label>Path locale</Label>
              <Input value={provForm.source_path} onChange={(e) => setProvForm((p) => ({ ...p, source_path: e.target.value }))} placeholder='/data/istat/comuni.csv' />
            </FormGroup>
          )}
          {(provForm.mode === 'remote_file' || provForm.mode === 'api') && (
            <FormGroup>
              <Label>URL sorgente</Label>
              <Input value={provForm.source_url} onChange={(e) => setProvForm((p) => ({ ...p, source_url: e.target.value }))} placeholder='https://...' />
            </FormGroup>
          )}
          {provForm.driver === 'geonames' && (
            <Alert color='light' className='border py-2 px-3 mb-3' style={{ fontSize: 13 }}>
              ℹ️ Il driver GeoNames importa nazione, regioni, province e città. Il formato primario può essere <strong>txt</strong> (countryInfo) o <strong>zip</strong> (dump per città). Tramite <code>auth_config_json</code> è possibile definire le sorgenti ausiliarie: <code>admin1_source_url</code>, <code>admin2_source_url</code>, <code>country_dump_url_template</code> (o le varianti <code>_source_path</code> per file locali). Il placeholder <code>{'{ISO}'}</code> viene sostituito con il codice ISO della nazione.
            </Alert>
          )}
          {provForm.mode === 'api' && (
            <Row>
              <Col md='4'>
                <FormGroup>
                  <Label>Tipo autenticazione</Label>
                  <Input type='select' value={provForm.auth_type} onChange={(e) => setProvForm((p) => ({ ...p, auth_type: e.target.value }))}>
                    <option value='none'>Nessuna</option>
                    <option value='api_key'>API Key</option>
                    <option value='basic'>Basic Auth</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md='8'>
                <FormGroup>
                  <Label>Config autenticazione JSON</Label>
                  <Input
                    type='textarea' rows={2}
                    value={provForm.auth_config_json}
                    onChange={(e) => setProvForm((p) => ({ ...p, auth_config_json: e.target.value }))}
                    invalid={!jsonValid(provForm.auth_config_json)}
                    placeholder='{"token":"..."}'
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                  <FormFeedback>JSON non valido</FormFeedback>
                </FormGroup>
              </Col>
            </Row>
          )}
          {provForm.driver === 'geonames' && provForm.mode !== 'api' && (
            <FormGroup>
              <Label>Sorgenti ausiliarie GeoNames (JSON)</Label>
              <Input
                type='textarea' rows={4}
                value={provForm.auth_config_json}
                onChange={(e) => setProvForm((p) => ({ ...p, auth_config_json: e.target.value }))}
                invalid={!jsonValid(provForm.auth_config_json)}
                placeholder={`{\n  "countries_source_url": "https://download.geonames.org/export/dump/countryInfo.txt",\n  "admin1_source_url": "https://download.geonames.org/export/dump/admin1CodesASCII.txt",\n  "admin2_source_url": "https://download.geonames.org/export/dump/admin2Codes.txt",\n  "country_dump_url_template": "https://download.geonames.org/export/dump/{ISO}.zip"\n}`}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
              <FormFeedback>JSON non valido</FormFeedback>
              <small className='text-muted'>Lasciare vuoto per usare le URL GeoNames ufficiali predefinite configurate nel backend.</small>
            </FormGroup>
          )}
          <Row>
            <Col md='10'>
              <FormGroup>
                <Label>Note</Label>
                <Input type='textarea' rows={2} value={provForm.notes} onChange={(e) => setProvForm((p) => ({ ...p, notes: e.target.value }))} />
              </FormGroup>
            </Col>
            <Col md='2' className='d-flex align-items-center'>
              <FormGroup check>
                <Input type='checkbox' checked={provForm.is_active} onChange={(e) => setProvForm((p) => ({ ...p, is_active: e.target.checked }))} />
                <Label check>Attivo</Label>
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color='secondary' onClick={() => setProvModal(false)}>Annulla</Button>
          <Button color='primary' onClick={saveProv} disabled={savingProv}>
            {savingProv ? <Spinner size='sm' /> : 'Salva'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal delete Provider ────────────────────────────────────────────── */}
      <Modal isOpen={deleteProvModal} toggle={() => setDeleteProvModal(false)} size='sm'>
        <ModalHeader toggle={() => setDeleteProvModal(false)}>Elimina provider</ModalHeader>
        <ModalBody>Eliminare il provider <strong>{deletingProv?.name}</strong>?</ModalBody>
        <ModalFooter>
          <Button color='secondary' onClick={() => setDeleteProvModal(false)}>Annulla</Button>
          <Button color='danger' onClick={deleteProv} disabled={deleteProvLoading}>
            {deleteProvLoading ? <Spinner size='sm' /> : 'Elimina'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal Associazione ───────────────────────────────────────────────── */}
      <Modal isOpen={mapModal} toggle={() => setMapModal(false)}>
        <ModalHeader toggle={() => setMapModal(false)}>
          {editingMap ? 'Modifica associazione' : 'Associa provider'}
        </ModalHeader>
        <ModalBody>
          {mapFormErr && <Alert color='danger'>{mapFormErr}</Alert>}
          <FormGroup>
            <Label>Provider *</Label>
            <Input type='select' value={mapForm.provider_id}
              onChange={(e) => setMapForm((p) => ({ ...p, provider_id: e.target.value }))}
              disabled={!!editingMap}
            >
              <option value=''>Seleziona provider…</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
            </Input>
          </FormGroup>
          <Row>
            <Col md='4'>
              <FormGroup>
                <Label>Priorità</Label>
                <Input type='number' value={mapForm.priority} onChange={(e) => setMapForm((p) => ({ ...p, priority: e.target.value }))} />
              </FormGroup>
            </Col>
            <Col md='8' className='d-flex gap-3 align-items-center pt-4'>
              <FormGroup check>
                <Input type='checkbox' checked={mapForm.is_default} onChange={(e) => setMapForm((p) => ({ ...p, is_default: e.target.checked }))} />
                <Label check>Default</Label>
              </FormGroup>
              <FormGroup check>
                <Input type='checkbox' checked={mapForm.is_active} onChange={(e) => setMapForm((p) => ({ ...p, is_active: e.target.checked }))} />
                <Label check>Attivo</Label>
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color='secondary' onClick={() => setMapModal(false)}>Annulla</Button>
          <Button color='primary' onClick={saveMap} disabled={savingMap}>
            {savingMap ? <Spinner size='sm' /> : 'Salva'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal delete Associazione ────────────────────────────────────────── */}
      <Modal isOpen={deleteMapModal} toggle={() => setDeleteMapModal(false)} size='sm'>
        <ModalHeader toggle={() => setDeleteMapModal(false)}>Rimuovi associazione</ModalHeader>
        <ModalBody>Rimuovere il provider <strong>{deletingMap?.provider?.name ?? `#${deletingMap?.provider_id}`}</strong> da questa nazione?</ModalBody>
        <ModalFooter>
          <Button color='secondary' onClick={() => setDeleteMapModal(false)}>Annulla</Button>
          <Button color='danger' onClick={deleteMap} disabled={deleteMapLoading}>
            {deleteMapLoading ? <Spinner size='sm' /> : 'Rimuovi'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
