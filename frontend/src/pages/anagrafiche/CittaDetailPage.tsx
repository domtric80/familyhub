import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Alert, Badge,
} from 'reactstrap'
import { Home, ArrowLeft, ExternalLink, MapPin } from 'react-feather'
import { adminCityApi, apiError } from '../../services/api'
import type { City } from '../../types'

const MAP_PROVIDER = import.meta.env.VITE_CITY_MAP_PROVIDER ?? 'osm'
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY ?? ''

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

function buildOpenStreetMapUrl(city: City) {
  const province = city.province?.name ?? ''
  const country = city.province?.region?.country?.name ?? ''
  const query = [city.name, province, country].filter(Boolean).join(', ')
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`
}

function buildWikipediaUrl(city: City) {
  return `https://it.wikipedia.org/wiki/Speciale:Ricerca?search=${encodeURIComponent(city.name)}`
}

interface MapCoords {
  lat: string | null
  lon: string | null
  loading: boolean
  error: string | null
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <tr>
      <td className='text-muted' style={{ width: '40%', paddingRight: 16 }}>{label}</td>
      <td><strong>{value ?? '—'}</strong></td>
    </tr>
  )
}

export default function CittaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [city, setCity] = useState<City | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [map, setMap] = useState<MapCoords>({ lat: null, lon: null, loading: false, error: null })

  useEffect(() => {
    if (!id) return
    setLoading(true)
    adminCityApi.get(Number(id))
      .then(setCity)
      .catch((e) => setError(apiError(e).message ?? 'Città non trovata'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!city) return
    const country = city.province?.region?.country?.name ?? ''
    const region = city.province?.region?.name ?? ''
    const province = city.province?.name ?? ''
    const query = [city.name, province, region, country].filter(Boolean).join(', ')

    setMap({ lat: null, lon: null, loading: true, error: null })

    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((results: { lat: string; lon: string }[]) => {
        if (results.length > 0) {
          setMap({ lat: results[0].lat, lon: results[0].lon, loading: false, error: null })
        } else {
          setMap({ lat: null, lon: null, loading: false, error: 'Coordinate non trovate' })
        }
      })
      .catch(() => setMap({ lat: null, lon: null, loading: false, error: 'Errore geocoding' }))
  }, [city])

  const country = city?.province?.region?.country
  const region = city?.province?.region
  const province = city?.province

  if (loading) {
    return (
      <Container fluid>
        <div className='text-center py-5'><div className='loader' /></div>
      </Container>
    )
  }

  if (error || !city) {
    return (
      <Container fluid>
        <Alert color='danger'>{error ?? 'Città non trovata'}</Alert>
        <button className='btn btn-light' onClick={() => navigate(-1)}>
          <ArrowLeft size={14} className='me-1' /> Torna indietro
        </button>
      </Container>
    )
  }

  return (
    <Container fluid>
      {/* Titolo + breadcrumb */}
      <div className='page-title'>
        <Row>
          <Col xs='6'>
            <h3 className='d-flex align-items-center gap-2'>
              <MapPin size={20} className='text-primary' />
              {city.name}
            </h3>
          </Col>
          <Col xs='6'>
            <ol className='breadcrumb'>
              <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
              <li className='breadcrumb-item'><Link to='/anagrafiche/geografia'>Geografia</Link></li>
              {country && <li className='breadcrumb-item'>{country.name}</li>}
              {region && <li className='breadcrumb-item'>{region.name}</li>}
              {province && <li className='breadcrumb-item'>{province.name}</li>}
              <li className='breadcrumb-item active'>{city.name}</li>
            </ol>
          </Col>
        </Row>
      </div>

      <Row>
        {/* Colonna sinistra — dati */}
        <Col xl='4' lg='5'>

          {/* Gerarchia */}
          <Card className='mb-3'>
            <CardHeader><h5 className='mb-0'>Gerarchia geografica</h5></CardHeader>
            <CardBody className='p-0'>
              <table className='table table-sm mb-0'>
                <tbody>
                  <InfoRow label='Paese' value={country ? `${country.name} (${country.iso_code ?? country.iso2 ?? '—'})` : undefined} />
                  <InfoRow label='Regione' value={region ? `${region.name} (${region.code})` : undefined} />
                  <InfoRow label='Provincia' value={province ? `${province.name} (${province.code})` : undefined} />
                  <InfoRow label='Comune' value={city.name} />
                </tbody>
              </table>
            </CardBody>
          </Card>

          {/* Dati amministrativi */}
          <Card className='mb-3'>
            <CardHeader><h5 className='mb-0'>Dati amministrativi</h5></CardHeader>
            <CardBody className='p-0'>
              <table className='table table-sm mb-0'>
                <tbody>
                  <InfoRow label='Codice catastale' value={city.cadastre_code} />
                  <InfoRow label='CAP' value={city.postal_code} />
                  <InfoRow label='Codice provincia' value={province?.code} />
                  <InfoRow label='Codice regione' value={region?.code} />
                  <InfoRow label='ISO paese' value={country?.iso_code ?? country?.iso2} />
                </tbody>
              </table>
            </CardBody>
          </Card>

          {/* Coordinate */}
          <Card className='mb-3'>
            <CardHeader><h5 className='mb-0'>Coordinate</h5></CardHeader>
            <CardBody>
              {map.loading && <p className='text-muted mb-0'>Ricerca coordinate…</p>}
              {map.error && <p className='text-muted mb-0'>{map.error}</p>}
              {map.lat && map.lon && (
                <table className='table table-sm mb-0'>
                  <tbody>
                    <InfoRow label='Latitudine' value={map.lat} />
                    <InfoRow label='Longitudine' value={map.lon} />
                  </tbody>
                </table>
              )}
              {!map.loading && !map.lat && !map.error && (
                <p className='text-muted mb-0'>—</p>
              )}
            </CardBody>
          </Card>

          {/* Badge stato */}
          <div className='d-flex gap-2 flex-wrap mb-3'>
            {city.cadastre_code && <Badge color='primary'>{city.cadastre_code}</Badge>}
            {city.postal_code && <Badge color='secondary'>{city.postal_code}</Badge>}
            {province?.code && <Badge color='light' className='text-dark'>Prov. {province.code}</Badge>}
          </div>

          {/* Link esterni */}
          <Card className='mb-3'>
            <CardHeader><h5 className='mb-0'>Link esterni</h5></CardHeader>
            <CardBody className='d-flex flex-column gap-2'>
              <a
                className='btn btn-outline-secondary btn-sm d-flex align-items-center gap-1'
                href={buildOpenStreetMapUrl(city)}
                target='_blank'
                rel='noreferrer'
              >
                <MapPin size={13} /> OpenStreetMap <ExternalLink size={12} className='ms-auto' />
              </a>
              <a
                className='btn btn-outline-secondary btn-sm d-flex align-items-center gap-1'
                href={buildWikipediaUrl(city)}
                target='_blank'
                rel='noreferrer'
              >
                Wikipedia <ExternalLink size={12} className='ms-auto' />
              </a>
            </CardBody>
          </Card>

          <button className='btn btn-light btn-sm d-flex align-items-center gap-1' onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Torna a Geografia
          </button>
        </Col>

        {/* Colonna destra — mappa */}
        <Col xl='8' lg='7'>
          <Card>
            <CardHeader><h5 className='mb-0'>Mappa</h5></CardHeader>
            <CardBody className='p-0' style={{ minHeight: 480 }}>
              {map.loading && (
                <div className='d-flex align-items-center justify-content-center' style={{ height: 480 }}>
                  <div className='loader' />
                </div>
              )}
              {map.lat && map.lon && (
                <iframe
                  title={`map-${city.id}`}
                  src={buildMapEmbedUrl(map.lat, map.lon)}
                  style={{ width: '100%', height: 480, border: 0 }}
                  loading='lazy'
                />
              )}
              {!map.loading && !map.lat && (
                <div
                  className='d-flex flex-column align-items-center justify-content-center text-muted gap-2'
                  style={{ height: 480 }}
                >
                  <MapPin size={32} style={{ opacity: 0.3 }} />
                  <span>Mappa non disponibile per questa città</span>
                  <a
                    href={buildOpenStreetMapUrl(city)}
                    target='_blank'
                    rel='noreferrer'
                    className='btn btn-sm btn-outline-secondary'
                  >
                    Cerca su OpenStreetMap <ExternalLink size={12} className='ms-1' />
                  </a>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}
