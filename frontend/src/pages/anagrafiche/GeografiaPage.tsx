import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardHeader, CardBody,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Badge,
} from 'reactstrap'
import InfoDrawer from '../../components/common/InfoDrawer'
import { Home, Plus, Edit2, Trash2, MapPin, ExternalLink, ArrowRight, Info } from 'react-feather'
import { toast } from 'react-toastify'
import {
  adminCountryApi, adminRegionApi, adminProvinceApi, adminCityApi,
  apiError, errorMessage,
} from '../../services/api'
import type {
  Country, CountryWrite,
  Region, RegionWrite,
  Province, ProvinceWrite,
  City, CityWrite,
} from '../../types'

type GeoLevel = 'countries' | 'regions' | 'provinces' | 'cities'
type CountryForm = CountryWrite

type MapState = {
  loading: boolean
  lat: string | null
  lon: string | null
  error: string | null
  source?: 'db' | 'geocoder' | null
}

const MAP_PROVIDER = import.meta.env.VITE_CITY_MAP_PROVIDER ?? 'osm'
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY ?? ''

function buildWikipediaUrl(city: City) {
  return `https://it.wikipedia.org/wiki/Speciale:Ricerca?search=${encodeURIComponent(city.name)}`
}

function buildOpenStreetMapUrl(city: City) {
  if (city.latitude != null && city.longitude != null) {
    return `https://www.openstreetmap.org/?mlat=${city.latitude}&mlon=${city.longitude}#map=15/${city.latitude}/${city.longitude}`
  }
  const province = city.province?.name ?? ''
  const country = city.province?.region?.country?.name ?? ''
  const query = [city.name, province, country].filter(Boolean).join(', ')
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`
}

function buildMapEmbedUrl(lat: string, lon: string) {
  const latitude = Number(lat)
  const longitude = Number(lon)
  const delta = 0.12

  if (MAP_PROVIDER === 'maptiler' && MAPTILER_KEY) {
    return `https://api.maptiler.com/maps/streets/?key=${encodeURIComponent(MAPTILER_KEY)}#11/${latitude}/${longitude}`
  }

  const left = longitude - delta
  const right = longitude + delta
  const top = latitude + delta
  const bottom = latitude - delta

  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latitude}%2C${longitude}`
}

function DeleteModal({
  name, open, conflict, deleting, onConfirm, onClose,
}: {
  name: string
  open: boolean
  conflict: string | null
  deleting: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal isOpen={open} toggle={onClose}>
      <ModalHeader toggle={onClose}>Conferma eliminazione</ModalHeader>
      <ModalBody>
        {conflict
          ? <Alert color='danger'>{conflict}</Alert>
          : <p>Eliminare <strong>{name}</strong>? L&apos;operazione non è reversibile.</p>}
      </ModalBody>
      <ModalFooter>
        {!conflict && <Button color='danger' onClick={onConfirm} disabled={deleting}>{deleting ? 'Eliminazione…' : 'Elimina'}</Button>}
        <Button color='light' onClick={onClose}>{conflict ? 'Chiudi' : 'Annulla'}</Button>
      </ModalFooter>
    </Modal>
  )
}

function CityInsightCard({ city }: { city: City | null }) {
  const [mapState, setMapState] = useState<MapState>({ loading: false, lat: null, lon: null, error: null })

  useEffect(() => {
    if (!city) {
      setMapState({ loading: false, lat: null, lon: null, error: null, source: null })
      return
    }

    if (city.latitude != null && city.longitude != null) {
      setMapState({
        loading: false,
        lat: String(city.latitude),
        lon: String(city.longitude),
        error: null,
        source: 'db',
      })
      return
    }

    const country = city.province?.region?.country?.name ?? ''
    const region = city.province?.region?.name ?? ''
    const province = city.province?.name ?? ''
    const query = [city.name, province, region, country].filter(Boolean).join(', ')

    let active = true
    setMapState({ loading: true, lat: null, lon: null, error: null, source: null })

    fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Geocoding non disponibile')
        return response.json() as Promise<Array<{ lat: string; lon: string }>>
      })
      .then((data) => {
        if (!active) return
        if (data.length === 0) {
          setMapState({ loading: false, lat: null, lon: null, error: 'Coordinate non trovate automaticamente.', source: null })
          return
        }
        setMapState({ loading: false, lat: data[0].lat, lon: data[0].lon, error: null, source: 'geocoder' })
      })
      .catch(() => {
        if (!active) return
        setMapState({ loading: false, lat: null, lon: null, error: 'Mappa temporaneamente non disponibile.', source: null })
      })

    return () => { active = false }
  }, [city])

  if (!city) {
    return (
      <Card className='mt-3'>
        <CardBody className='text-muted'>
          Seleziona una città per vedere dettaglio, mappa e collegamenti esterni.
        </CardBody>
      </Card>
    )
  }

  const country = city.province?.region?.country?.name ?? '—'
  const region = city.province?.region?.name ?? '—'
  const province = city.province?.name ?? '—'

  return (
    <Card className='mt-3'>
      <CardHeader>
        <div className='d-flex justify-content-between align-items-center'>
          <div>
            <h5 className='mb-0'>{city.name}</h5>
            <small className='text-muted'>{province} · {region} · {country}</small>
          </div>
          <Badge color='light' className='text-primary'>{city.cadastre_code ?? 'No catasto'}</Badge>
        </div>
      </CardHeader>
      <CardBody>
        <Row className='g-3'>
          <Col md='4'>
            <div className='border rounded p-3 h-100'>
              <div className='fw-semibold mb-2'>Dati anagrafici</div>
              <div><strong>Nome:</strong> {city.name}</div>
              <div><strong>Cod. catastale:</strong> {city.cadastre_code ?? '—'}</div>
              <div><strong>CAP:</strong> {city.postal_code ?? '—'}</div>
              <div><strong>Provincia:</strong> {province}</div>
              <div><strong>Regione:</strong> {region}</div>
              <div><strong>Nazione:</strong> {country}</div>
            </div>
          </Col>
          <Col md='8'>
            <div className='border rounded p-3'>
              <div className='d-flex justify-content-between align-items-center mb-2'>
                <div className='fw-semibold d-flex align-items-center gap-2'><MapPin size={16} /> Mappa</div>
                <div className='d-flex gap-2'>
                  <a className='btn btn-sm btn-light' href={buildOpenStreetMapUrl(city)} target='_blank' rel='noreferrer'>
                    OpenStreetMap <ExternalLink size={12} className='ms-1' />
                  </a>
                  <a className='btn btn-sm btn-light' href={buildWikipediaUrl(city)} target='_blank' rel='noreferrer'>
                    Wikipedia <ExternalLink size={12} className='ms-1' />
                  </a>
                </div>
              </div>
              {mapState.loading && <div className='text-muted'>Ricerca coordinate in corso…</div>}
              {!mapState.loading && mapState.source === 'db' && (
                <Alert color='light' className='mb-2'>
                  Coordinate lette dal database geografico.
                </Alert>
              )}
              {!mapState.loading && mapState.source === 'geocoder' && (
                <Alert color='light' className='mb-2'>
                  Coordinate stimate tramite geocoding esterno.
                </Alert>
              )}
              {!mapState.loading && mapState.lat && mapState.lon && (
                <iframe
                  title={`map-${city.id}`}
                  src={buildMapEmbedUrl(mapState.lat, mapState.lon)}
                  style={{ width: '100%', height: 320, border: 0, borderRadius: 8 }}
                  loading='lazy'
                  referrerPolicy='no-referrer-when-downgrade'
                />
              )}
              {!mapState.loading && !mapState.lat && (
                <Alert color='warning' className='mb-0'>
                  {mapState.error ?? 'Coordinate non disponibili.'} Usa i link esterni per consultare la località.
                </Alert>
              )}
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}

type GeoNavState = { countryId?: number; regionId?: number; provinceId?: number } | null

export default function GeografiaPage() {
  const [infoOpen, setInfoOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [selectedCountryId, setSelectedCountryId] = useState<number>(0)
  const [selectedRegionId, setSelectedRegionId] = useState<number>(0)
  const [selectedProvinceId, setSelectedProvinceId] = useState<number>(0)
  const [selectedCityId, setSelectedCityId] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [countryModalOpen, setCountryModalOpen] = useState(false)
  const [countryForm, setCountryForm] = useState<CountryForm>({ iso_code: '', name: '' })
  const [countryEdit, setCountryEdit] = useState<Country | null>(null)

  const [regionModalOpen, setRegionModalOpen] = useState(false)
  const [regionForm, setRegionForm] = useState<RegionWrite>({ country_id: 0, code: '', name: '' })
  const [regionEdit, setRegionEdit] = useState<Region | null>(null)

  const [provinceModalOpen, setProvinceModalOpen] = useState(false)
  const [provinceForm, setProvinceForm] = useState<ProvinceWrite>({ region_id: 0, code: '', name: '' })
  const [provinceEdit, setProvinceEdit] = useState<Province | null>(null)

  const [cityModalOpen, setCityModalOpen] = useState(false)
  const [cityForm, setCityForm] = useState<CityWrite>({ province_id: 0, name: '', cadastre_code: '', postal_code: '' })
  const [cityEdit, setCityEdit] = useState<City | null>(null)

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const [conflictMsg, setConflictMsg] = useState<string | null>(null)

  const [deleteLevel, setDeleteLevel] = useState<GeoLevel | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)
  const [deleteConflict, setDeleteConflict] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Stato iniziale passato da CittaDetailPage via navigate(..., { state })
  const navState = (location.state as GeoNavState) ?? null
  const initApplied = useRef(false)

  useEffect(() => {
    setLoading(true)
    adminCountryApi.list()
      .then(setCountries)
      .catch((e) => {
        const ae = apiError(e)
        const status = ae.status ? ` (HTTP ${ae.status})` : ''
        setError((ae.message ?? 'Errore caricamento') + status)
      })
      .finally(() => setLoading(false))
  }, [])

  // Pre-selezione dei livelli quando si torna da CittaDetailPage
  useEffect(() => {
    if (!navState || initApplied.current || countries.length === 0) return
    initApplied.current = true

    const { countryId, regionId, provinceId } = navState
    if (!countryId) return

    const run = async () => {
      setTableLoading(true)
      try {
        setSelectedCountryId(countryId)
        const loadedRegions = await adminRegionApi.list(countryId)
        setRegions(loadedRegions)

        if (regionId) {
          setSelectedRegionId(regionId)
          const loadedProvinces = await adminProvinceApi.list(regionId)
          setProvinces(loadedProvinces)

          if (provinceId) {
            setSelectedProvinceId(provinceId)
            const loadedCities = await adminCityApi.list(provinceId)
            setCities(loadedCities)
          }
        }
      } catch {
        // ignora errori di pre-selezione, la pagina è comunque usabile
      } finally {
        setTableLoading(false)
      }
    }
    run()
  }, [countries, navState]) // eslint-disable-line

  const activeLevel: GeoLevel = selectedProvinceId ? 'cities' : selectedRegionId ? 'provinces' : selectedCountryId ? 'regions' : 'countries'

  const activeRows = useMemo(() => {
    if (activeLevel === 'countries') return countries
    if (activeLevel === 'regions') return regions
    if (activeLevel === 'provinces') return provinces
    return cities
  }, [activeLevel, countries, regions, provinces, cities])

  const selectedCity = cities.find((city) => city.id === selectedCityId) ?? null

  const loadCountries = async () => {
    setCountries(await adminCountryApi.list())
  }

  const loadRegions = async (countryId: number) => {
    setTableLoading(true)
    try {
      const data = await adminRegionApi.list(countryId)
      setRegions(data)
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore caricamento regioni')
      setRegions([])
    } finally { setTableLoading(false) }
  }

  const loadProvinces = async (regionId: number) => {
    setTableLoading(true)
    try {
      const data = await adminProvinceApi.list(regionId)
      setProvinces(data)
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore caricamento province')
      setProvinces([])
    } finally { setTableLoading(false) }
  }

  const loadCities = async (provinceId: number) => {
    setTableLoading(true)
    try {
      const data = await adminCityApi.list(provinceId)
      setCities(data)
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore caricamento città')
      setCities([])
    } finally { setTableLoading(false) }
  }

  const handleCountrySelect = async (countryId: number) => {
    setSelectedCountryId(countryId)
    setSelectedRegionId(0)
    setSelectedProvinceId(0)
    setSelectedCityId(0)
    setRegions([]); setProvinces([]); setCities([])
    if (countryId) await loadRegions(countryId)
  }

  const handleRegionSelect = async (regionId: number) => {
    setSelectedRegionId(regionId)
    setSelectedProvinceId(0)
    setSelectedCityId(0)
    setProvinces([]); setCities([])
    if (regionId) await loadProvinces(regionId)
  }

  const handleProvinceSelect = async (provinceId: number) => {
    setSelectedProvinceId(provinceId)
    setSelectedCityId(0)
    setCities([])
    if (provinceId) await loadCities(provinceId)
  }

  const resetMessages = () => {
    setFieldErrors({})
    setConflictMsg(null)
  }

  const openCreate = () => {
    resetMessages()
    if (activeLevel === 'countries') {
      setCountryEdit(null)
      setCountryForm({ iso_code: '', name: '' })
      setCountryModalOpen(true)
      return
    }
    if (activeLevel === 'regions') {
      setRegionEdit(null)
      setRegionForm({ country_id: selectedCountryId, code: '', name: '' })
      setRegionModalOpen(true)
      return
    }
    if (activeLevel === 'provinces') {
      setProvinceEdit(null)
      setProvinceForm({ region_id: selectedRegionId, code: '', name: '' })
      setProvinceModalOpen(true)
      return
    }
    setCityEdit(null)
    setCityForm({ province_id: selectedProvinceId, name: '', cadastre_code: '', postal_code: '' })
    setCityModalOpen(true)
  }

  const openEdit = (row: Country | Region | Province | City) => {
    resetMessages()
    if (activeLevel === 'countries') {
      const item = row as Country
      setCountryEdit(item)
      setCountryForm({ iso_code: item.iso_code ?? item.iso2 ?? '', name: item.name })
      setCountryModalOpen(true)
      return
    }
    if (activeLevel === 'regions') {
      const item = row as Region
      setRegionEdit(item)
      setRegionForm({ country_id: item.country_id ?? selectedCountryId, code: item.code, name: item.name })
      setRegionModalOpen(true)
      return
    }
    if (activeLevel === 'provinces') {
      const item = row as Province
      setProvinceEdit(item)
      setProvinceForm({ region_id: item.region_id ?? selectedRegionId, code: item.code, name: item.name })
      setProvinceModalOpen(true)
      return
    }
    const item = row as City
    setCityEdit(item)
    setCityForm({ province_id: item.province_id ?? selectedProvinceId, name: item.name, cadastre_code: item.cadastre_code ?? '', postal_code: item.postal_code ?? '' })
    setCityModalOpen(true)
  }

  const askDelete = (row: Country | Region | Province | City) => {
    const name = 'name' in row ? row.name : ''
    setDeleteLevel(activeLevel)
    setDeleteConflict(null)
    setDeleteTarget({ id: row.id, name })
  }

  const refreshActive = async () => {
    if (activeLevel === 'countries') return loadCountries()
    if (activeLevel === 'regions') return loadRegions(selectedCountryId)
    if (activeLevel === 'provinces') return loadProvinces(selectedRegionId)
    return loadCities(selectedProvinceId)
  }

  const handleDelete = async () => {
    if (!deleteTarget || !deleteLevel) return
    setDeleting(true)
    setDeleteConflict(null)
    try {
      if (deleteLevel === 'countries') await adminCountryApi.delete(deleteTarget.id)
      if (deleteLevel === 'regions') await adminRegionApi.delete(deleteTarget.id)
      if (deleteLevel === 'provinces') await adminProvinceApi.delete(deleteTarget.id)
      if (deleteLevel === 'cities') await adminCityApi.delete(deleteTarget.id)
      toast.success('Elemento eliminato')
      setDeleteTarget(null)
      await refreshActive()
    } catch (e) {
      const ae = apiError(e)
      setDeleteConflict(ae.status === 403 ? errorMessage(ae) : (ae.message ?? 'Errore eliminazione'))
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveCountry = async () => {
    setSaving(true); resetMessages()
    try {
      if (countryEdit) await adminCountryApi.update(countryEdit.id, countryForm)
      else await adminCountryApi.create(countryForm)
      toast.success(countryEdit ? 'Nazione aggiornata' : 'Nazione creata')
      setCountryModalOpen(false)
      await loadCountries()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setConflictMsg(errorMessage(ae))
      else if (ae.errors) setFieldErrors(ae.errors)
      else setConflictMsg(ae.message ?? 'Errore salvataggio')
    } finally { setSaving(false) }
  }

  const handleSaveRegion = async () => {
    setSaving(true); resetMessages()
    try {
      if (regionEdit) await adminRegionApi.update(regionEdit.id, regionForm)
      else await adminRegionApi.create(regionForm)
      toast.success(regionEdit ? 'Regione aggiornata' : 'Regione creata')
      setRegionModalOpen(false)
      await loadRegions(selectedCountryId || regionForm.country_id)
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setConflictMsg(errorMessage(ae))
      else if (ae.errors) setFieldErrors(ae.errors)
      else setConflictMsg(ae.message ?? 'Errore salvataggio')
    } finally { setSaving(false) }
  }

  const handleSaveProvince = async () => {
    setSaving(true); resetMessages()
    try {
      if (provinceEdit) await adminProvinceApi.update(provinceEdit.id, provinceForm)
      else await adminProvinceApi.create(provinceForm)
      toast.success(provinceEdit ? 'Provincia aggiornata' : 'Provincia creata')
      setProvinceModalOpen(false)
      await loadProvinces(selectedRegionId || provinceForm.region_id)
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setConflictMsg(errorMessage(ae))
      else if (ae.errors) setFieldErrors(ae.errors)
      else setConflictMsg(ae.message ?? 'Errore salvataggio')
    } finally { setSaving(false) }
  }

  const handleSaveCity = async () => {
    setSaving(true); resetMessages()
    const payload = { ...cityForm, cadastre_code: cityForm.cadastre_code || null, postal_code: cityForm.postal_code || null }
    try {
      if (cityEdit) await adminCityApi.update(cityEdit.id, payload)
      else await adminCityApi.create(payload)
      toast.success(cityEdit ? 'Città aggiornata' : 'Città creata')
      setCityModalOpen(false)
      await loadCities(selectedProvinceId || cityForm.province_id)
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setConflictMsg(errorMessage(ae))
      else if (ae.errors) setFieldErrors(ae.errors)
      else setConflictMsg(ae.message ?? 'Errore salvataggio')
    } finally { setSaving(false) }
  }

  const selectedCountryName = countries.find((c) => c.id === selectedCountryId)?.name ?? '…'
  const selectedRegionName = regions.find((r) => r.id === selectedRegionId)?.name ?? '…'
  const selectedProvinceName = provinces.find((p) => p.id === selectedProvinceId)?.name ?? '…'

  const resetToCountries = () => {
    setSelectedCountryId(0); setSelectedRegionId(0); setSelectedProvinceId(0); setSelectedCityId(0)
    setRegions([]); setProvinces([]); setCities([])
  }
  const resetToRegions = () => {
    setSelectedRegionId(0); setSelectedProvinceId(0); setSelectedCityId(0)
    setProvinces([]); setCities([])
  }
  const resetToProvinces = () => {
    setSelectedProvinceId(0); setSelectedCityId(0)
    setCities([])
  }

  const renderTable = () => {
    if (tableLoading) return <div className='text-center py-5'><div className='loader' /></div>

    if (activeLevel === 'countries') {
      if (countries.length === 0) {
        return (
          <div className='text-center py-5 text-muted'>
            <p className='mb-2'>Nessuna nazione nel database.</p>
            <p className='small'>
              Usa <strong>Anagrafiche › Provider Geografia</strong> per importare le nazioni tramite GeoNames
              (bottone <em>Importa nazioni</em>) oppure aggiungi una nazione manualmente con il pulsante qui sopra.
            </p>
          </div>
        )
      }
      return (
        <table className='table table-hover'>
          <thead><tr><th>Codice ISO</th><th>Nome</th><th>Azioni</th></tr></thead>
          <tbody>
            {countries.map((row) => (
              <tr key={row.id}>
                <td><button className='btn btn-link p-0 fw-semibold' onClick={() => handleCountrySelect(row.id)}>{row.iso_code ?? row.iso2}</button></td>
                <td>{row.name}</td>
                <td>
                  <div className='d-flex gap-1'>
                    <button className='btn btn-sm btn-outline-primary' onClick={() => openEdit(row)}><Edit2 size={12} /></button>
                    <button className='btn btn-sm btn-outline-danger' onClick={() => askDelete(row)}><Trash2 size={12} /></button>
                    <button className='btn btn-sm btn-light' onClick={() => handleCountrySelect(row.id)}>Apri <ArrowRight size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    if (activeLevel === 'regions') {
      return (
        <table className='table table-hover'>
          <thead><tr><th>Codice</th><th>Nome</th><th>N. province</th><th>Azioni</th></tr></thead>
          <tbody>
            {regions.map((row) => (
              <tr key={row.id}>
                <td><button className='btn btn-link p-0 fw-semibold' onClick={() => handleRegionSelect(row.id)}>{row.code}</button></td>
                <td>{row.name}</td>
                <td><span className='text-muted small'>{row.provinces_count ?? '—'}</span></td>
                <td>
                  <div className='d-flex gap-1'>
                    <button className='btn btn-sm btn-outline-primary' onClick={() => openEdit(row)}><Edit2 size={12} /></button>
                    <button className='btn btn-sm btn-outline-danger' onClick={() => askDelete(row)}><Trash2 size={12} /></button>
                    <button className='btn btn-sm btn-light' onClick={() => handleRegionSelect(row.id)}>Apri <ArrowRight size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    if (activeLevel === 'provinces') {
      const isSynthetic = (p: { code: string; name: string }) =>
        p.code === '00' || p.name.toLowerCase().includes('non classificata')
      return (
        <table className='table table-hover'>
          <thead><tr><th>Codice</th><th>Nome</th><th>N. città</th><th>Azioni</th></tr></thead>
          <tbody>
            {provinces.map((row) => (
              <tr key={row.id}>
                <td><button className='btn btn-link p-0 fw-semibold' onClick={() => handleProvinceSelect(row.id)}>{row.code}</button></td>
                <td>
                  <div className='d-flex flex-column gap-1'>
                    <span>{row.name}</span>
                    {isSynthetic(row) && (
                      <span title='GeoNames non fornisce la provincia amministrativa per tutte le città di questa area; i comuni sono raccolti in questo contenitore tecnico.'>
                        <Badge color='light' className='text-muted border' style={{ fontSize: 10 }}>Dato aggregato GeoNames</Badge>
                      </span>
                    )}
                  </div>
                </td>
                <td><span className='text-muted small'>{row.cities_count ?? '—'}</span></td>
                <td>
                  <div className='d-flex gap-1'>
                    <button className='btn btn-sm btn-outline-primary' onClick={() => openEdit(row)}><Edit2 size={12} /></button>
                    <button className='btn btn-sm btn-outline-danger' onClick={() => askDelete(row)}><Trash2 size={12} /></button>
                    <button className='btn btn-sm btn-light' onClick={() => handleProvinceSelect(row.id)}>Apri <ArrowRight size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }

    return (
      <table className='table table-hover'>
        <thead><tr><th>Nome</th><th>Cod. catastale</th><th>CAP</th><th>Azioni</th></tr></thead>
        <tbody>
          {cities.map((row) => (
            <tr key={row.id} className={selectedCityId === row.id ? 'table-active' : ''}>
              <td>
                <button className='btn btn-link p-0 fw-semibold' onClick={() => navigate(`/anagrafiche/geografia/citta/${row.id}`)}>{row.name}</button>
              </td>
              <td><code>{row.cadastre_code ?? '—'}</code></td>
              <td>{row.postal_code ?? '—'}</td>
              <td>
                <div className='d-flex gap-1'>
                  <button className='btn btn-sm btn-outline-primary' onClick={() => openEdit(row)}><Edit2 size={12} /></button>
                  <button className='btn btn-sm btn-outline-danger' onClick={() => askDelete(row)}><Trash2 size={12} /></button>
                  <button className='btn btn-sm btn-light' onClick={() => navigate(`/anagrafiche/geografia/citta/${row.id}`)}>Dettaglio <ArrowRight size={12} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (loading) {
    return <Container fluid><div className='text-center py-5'><div className='loader' /></div></Container>
  }

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0 }}>Geografia</h3>
                <button className='btn btn-light btn-sm d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
                  <Info size={13} /> Informazioni
                </button>
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'><Link to='/anagrafiche'>Anagrafiche</Link></li>
                <li className='breadcrumb-item active'>Geografia</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Card>
          <CardHeader className='d-flex justify-content-between align-items-center'>
            <div>
              <h5 className='mb-0'>Vista geografica progressiva</h5>
              <small className='text-muted'>Nazione → Regione → Provincia → Città</small>
            </div>
            <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
              <Plus size={13} />
              {activeLevel === 'countries' ? 'Nuova nazione' : activeLevel === 'regions' ? 'Nuova regione' : activeLevel === 'provinces' ? 'Nuova provincia' : 'Nuova città'}
            </Button>
          </CardHeader>
          <CardBody>
            {error && <Alert color='danger'>{error}</Alert>}

            <Row className='g-3 mb-3'>
              <Col md='4'>
                <FormGroup>
                  <Label>Nazione</Label>
                  <Input type='select' value={selectedCountryId} onChange={(e) => handleCountrySelect(Number(e.target.value))}>
                    <option value={0}>Seleziona nazione…</option>
                    {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
                  </Input>
                </FormGroup>
              </Col>
              <Col md='4'>
                <FormGroup>
                  <Label>Regione</Label>
                  <Input type='select' value={selectedRegionId} onChange={(e) => handleRegionSelect(Number(e.target.value))} disabled={!selectedCountryId}>
                    <option value={0}>{selectedCountryId ? 'Seleziona regione…' : 'Seleziona prima una nazione'}</option>
                    {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
                  </Input>
                </FormGroup>
              </Col>
              <Col md='4'>
                <FormGroup>
                  <Label>Provincia</Label>
                  <Input type='select' value={selectedProvinceId} onChange={(e) => handleProvinceSelect(Number(e.target.value))} disabled={!selectedRegionId}>
                    <option value={0}>{selectedRegionId ? 'Seleziona provincia…' : 'Seleziona prima una regione'}</option>
                    {provinces.map((province) => <option key={province.id} value={province.id}>{province.name} ({province.code})</option>)}
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <div className='d-flex align-items-center justify-content-between mb-3'>
              <ol className='breadcrumb mb-0'>
                <li className={`breadcrumb-item${activeLevel === 'countries' ? ' active' : ''}`}>
                  {activeLevel !== 'countries'
                    ? <button className='btn btn-link p-0 text-decoration-none' style={{ fontSize: 'inherit', lineHeight: 'inherit' }} onClick={resetToCountries}>Nazioni</button>
                    : 'Nazioni'}
                </li>
                {selectedCountryId > 0 && (
                  <li className={`breadcrumb-item${activeLevel === 'regions' ? ' active' : ''}`}>
                    {activeLevel !== 'regions'
                      ? <button className='btn btn-link p-0 text-decoration-none' style={{ fontSize: 'inherit', lineHeight: 'inherit' }} onClick={resetToRegions}>{selectedCountryName}</button>
                      : selectedCountryName}
                  </li>
                )}
                {selectedRegionId > 0 && (
                  <li className={`breadcrumb-item${activeLevel === 'provinces' ? ' active' : ''}`}>
                    {activeLevel !== 'provinces'
                      ? <button className='btn btn-link p-0 text-decoration-none' style={{ fontSize: 'inherit', lineHeight: 'inherit' }} onClick={resetToProvinces}>{selectedRegionName}</button>
                      : selectedRegionName}
                  </li>
                )}
                {selectedProvinceId > 0 && (
                  <li className='breadcrumb-item active'>{selectedProvinceName}</li>
                )}
              </ol>
              <Badge color='light' className='text-muted'>{activeRows.length} elementi</Badge>
            </div>

            <div className='table-responsive'>
              {renderTable()}
            </div>

            {activeLevel === 'cities' && <CityInsightCard city={selectedCity} />}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={countryModalOpen} toggle={() => setCountryModalOpen(false)}>
        <ModalHeader toggle={() => setCountryModalOpen(false)}>{countryEdit ? 'Modifica nazione' : 'Nuova nazione'}</ModalHeader>
        <ModalBody>
          {conflictMsg && <Alert color='danger'>{conflictMsg}</Alert>}
          <FormGroup>
            <Label>Codice ISO</Label>
            <Input value={countryForm.iso_code} onChange={(e) => setCountryForm((p) => ({ ...p, iso_code: e.target.value.toUpperCase() }))} invalid={!!fieldErrors.iso_code} />
          </FormGroup>
          <FormGroup>
            <Label>Nome</Label>
            <Input value={countryForm.name} onChange={(e) => setCountryForm((p) => ({ ...p, name: e.target.value }))} invalid={!!fieldErrors.name} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSaveCountry} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='light' onClick={() => setCountryModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={regionModalOpen} toggle={() => setRegionModalOpen(false)}>
        <ModalHeader toggle={() => setRegionModalOpen(false)}>{regionEdit ? 'Modifica regione' : 'Nuova regione'}</ModalHeader>
        <ModalBody>
          {conflictMsg && <Alert color='danger'>{conflictMsg}</Alert>}
          <FormGroup>
            <Label>Nazione</Label>
            <Input type='select' value={regionForm.country_id} onChange={(e) => setRegionForm((p) => ({ ...p, country_id: Number(e.target.value) }))}>
              <option value={0}>Seleziona…</option>
              {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Codice</Label>
            <Input value={regionForm.code} onChange={(e) => setRegionForm((p) => ({ ...p, code: e.target.value }))} />
          </FormGroup>
          <FormGroup>
            <Label>Nome</Label>
            <Input value={regionForm.name} onChange={(e) => setRegionForm((p) => ({ ...p, name: e.target.value }))} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSaveRegion} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='light' onClick={() => setRegionModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={provinceModalOpen} toggle={() => setProvinceModalOpen(false)}>
        <ModalHeader toggle={() => setProvinceModalOpen(false)}>{provinceEdit ? 'Modifica provincia' : 'Nuova provincia'}</ModalHeader>
        <ModalBody>
          {conflictMsg && <Alert color='danger'>{conflictMsg}</Alert>}
          <FormGroup>
            <Label>Regione</Label>
            <Input type='select' value={provinceForm.region_id} onChange={(e) => setProvinceForm((p) => ({ ...p, region_id: Number(e.target.value) }))}>
              <option value={0}>Seleziona…</option>
              {regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Codice</Label>
            <Input value={provinceForm.code} onChange={(e) => setProvinceForm((p) => ({ ...p, code: e.target.value }))} />
          </FormGroup>
          <FormGroup>
            <Label>Nome</Label>
            <Input value={provinceForm.name} onChange={(e) => setProvinceForm((p) => ({ ...p, name: e.target.value }))} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSaveProvince} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='light' onClick={() => setProvinceModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={cityModalOpen} toggle={() => setCityModalOpen(false)}>
        <ModalHeader toggle={() => setCityModalOpen(false)}>{cityEdit ? 'Modifica città' : 'Nuova città'}</ModalHeader>
        <ModalBody>
          {conflictMsg && <Alert color='danger'>{conflictMsg}</Alert>}
          <FormGroup>
            <Label>Provincia</Label>
            <Input type='select' value={cityForm.province_id} onChange={(e) => setCityForm((p) => ({ ...p, province_id: Number(e.target.value) }))}>
              <option value={0}>Seleziona…</option>
              {provinces.map((province) => <option key={province.id} value={province.id}>{province.name} ({province.code})</option>)}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Nome</Label>
            <Input value={cityForm.name} onChange={(e) => setCityForm((p) => ({ ...p, name: e.target.value }))} />
          </FormGroup>
          <FormGroup>
            <Label>Codice catastale</Label>
            <Input value={cityForm.cadastre_code ?? ''} onChange={(e) => setCityForm((p) => ({ ...p, cadastre_code: e.target.value }))} />
          </FormGroup>
          <FormGroup>
            <Label>CAP</Label>
            <Input value={cityForm.postal_code ?? ''} onChange={(e) => setCityForm((p) => ({ ...p, postal_code: e.target.value }))} />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSaveCity} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='light' onClick={() => setCityModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      <DeleteModal
        name={deleteTarget?.name ?? ''}
        open={!!deleteTarget}
        conflict={deleteConflict}
        deleting={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Guida — Geografia'>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>A cosa serve</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            La sezione <strong>Geografia</strong> mantiene il database territoriale canonico
            su cui si appoggiano strutture, minori, educatori e anagrafiche correlate.
            Non è solo consultazione: governa la qualità del dato geografico di tutto il software.
          </p>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Dati canonici</h6>
          <div className='alert alert-info py-2 px-3' style={{ fontSize: 13 }}>
            Dati come continente, nazione, regione, provincia e città non devono essere scritti
            liberamente quando fanno parte del modello riusabile. Devono essere selezionati
            da anagrafiche canoniche o importati da provider affidabili.
          </div>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Provider e import</h6>
          <table className='table table-sm table-bordered' style={{ fontSize: 13 }}>
            <thead className='table-light'>
              <tr><th>Concetto</th><th>Funzione</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Provider Geografia</strong></td><td>Definisce da dove e come leggere il dato geografico</td></tr>
              <tr><td><strong>Import dati</strong></td><td>Usa il provider per popolare o aggiornare il database canonico</td></tr>
            </tbody>
          </table>
          <p style={{ fontSize: 14, color: '#444' }}>
            Provider e import non sono funzioni scollegate: il provider è il prerequisito dell'import.
          </p>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Gerarchia geografica</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            I filtri devono rispettare la gerarchia:{' '}
            <strong>Continente → Nazione → Regione → Provincia → Città</strong>.
            Saltare livelli può generare riferimenti incoerenti.
          </p>
        </section>
        <section className='mb-3'>
          <h6 className='fw-bold mb-2'>Impatto sul resto del sistema</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            Errori in questa sezione si propagano a strutture, minori, staff, documenti e
            moduli amministrativi. Se i filtri geografici appaiono incoerenti in altri form,
            il problema va verificato qui.
          </p>
        </section>
      </InfoDrawer>
    </>
  )
}
