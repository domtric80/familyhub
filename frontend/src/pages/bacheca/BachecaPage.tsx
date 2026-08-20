import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Alert, Button, Badge, Input, FormGroup, Label,
} from 'reactstrap'
import { Home, CheckCircle, Clock } from 'react-feather'
import { toast } from 'react-toastify'
import { bulletinApi, facilityApi, apiError } from '../../services/api'
import type { FacilityBulletin, Facility } from '../../types'

function fmtDateTime(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'badge-light-success',
  ARCHIVED:  'badge-light-secondary',
}
const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: 'Pubblicata',
  ARCHIVED:  'Archiviata',
}

export default function BachecaPage() {
  const [bulletins, setBulletins] = useState<FacilityBulletin[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [facilityFilter, setFacilityFilter] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selected, setSelected] = useState<FacilityBulletin | null>(null)
  const [acknowledging, setAcknowledging] = useState(false)

  const load = (fid = facilityFilter) => {
    setLoading(true); setError(null)
    bulletinApi.list(fid ? { facility_id: fid } : {})
      .then(setBulletins)
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    facilityApi.list().then(setFacilities).catch(() => {})
    load()
  }, []) // eslint-disable-line

  const handleFacilityChange = (fid: number) => {
    setFacilityFilter(fid); load(fid)
  }

  const handleAcknowledge = async () => {
    if (!selected) return
    setAcknowledging(true)
    try {
      const updated = await bulletinApi.acknowledge(selected.id)
      // Aggiorna la circolare nella lista senza esporre il corpo nel toast
      setBulletins((prev) => prev.map((b) => b.id === updated.id ? updated : b))
      setSelected(updated)
      toast.success('Presa visione registrata.')
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore presa visione.')
    } finally { setAcknowledging(false) }
  }

  const unread = bulletins.filter((b) => b.status === 'PUBLISHED' && !b.is_acknowledged).length

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <h3>
                Bacheca circolari
                {unread > 0 && <Badge color='danger' className='ms-2'>{unread}</Badge>}
              </h3>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item active'>Bacheca</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Card>
          <CardHeader>
            <div className='d-flex align-items-center gap-3 flex-wrap'>
              <FormGroup className='mb-0' style={{ minWidth: 200 }}>
                <Input type='select' bsSize='sm' value={facilityFilter}
                  onChange={(e) => handleFacilityChange(Number(e.target.value))}>
                  <option value={0}>Tutte le strutture</option>
                  {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </Input>
              </FormGroup>
            </div>
          </CardHeader>
          <CardBody>
            <div className='alert alert-info py-2 px-3 mb-3' style={{ fontSize: 13 }}>
              Le circolari pubblicate sono visibili agli utenti con il ruolo destinatario nella struttura. La presa visione è registrata e tracciata. Le circolari archiviate restano in elenco solo a titolo storico.
            </div>

            {error && <Alert color='danger'>{error}</Alert>}
            {loading ? <div className='text-center py-4'><div className='loader' /></div> : (
              bulletins.length === 0 ? <p className='text-muted'>Nessuna circolare disponibile.</p> : (
                <div className='table-responsive'>
                  <table className='table table-hover table-sm align-middle'>
                    <thead className='table-light'>
                      <tr>
                        <th>Titolo</th>
                        <th>Pubblicata il</th>
                        <th>Scadenza</th>
                        <th style={{ width: 110 }}>Stato</th>
                        <th style={{ width: 110 }}>Presa visione</th>
                        <th style={{ width: 90 }}>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulletins.map((b) => (
                        <tr key={b.id} style={{ fontWeight: (b.status === 'PUBLISHED' && !b.is_acknowledged) ? 600 : 400 }}>
                          <td className='small'>{b.title}</td>
                          <td className='small'>{fmtDateTime(b.published_at)}</td>
                          <td className='small'>{fmtDateTime(b.expires_at)}</td>
                          <td>
                            <span className={`badge ${STATUS_BADGE[b.status] ?? 'badge-light-secondary'}`}>
                              {STATUS_LABEL[b.status] ?? b.status}
                            </span>
                          </td>
                          <td>
                            {b.status === 'PUBLISHED' ? (
                              b.is_acknowledged
                                ? <span className='text-success small d-flex align-items-center gap-1'><CheckCircle size={12} /> {fmtDateTime(b.acknowledged_at)}</span>
                                : <span className='text-warning small d-flex align-items-center gap-1'><Clock size={12} /> In attesa</span>
                            ) : <span className='text-muted'>—</span>}
                          </td>
                          <td>
                            <Button size='sm' color='light' onClick={() => setSelected(b)}>Leggi</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </CardBody>
        </Card>
      </Container>

      {/* Modal dettaglio */}
      <Modal isOpen={!!selected} toggle={() => setSelected(null)} size='lg'>
        <ModalHeader toggle={() => setSelected(null)}>
          {selected?.title}
          {selected && (
            <span className={`ms-2 badge ${STATUS_BADGE[selected.status] ?? 'badge-light-secondary'}`}>
              {STATUS_LABEL[selected.status] ?? selected.status}
            </span>
          )}
        </ModalHeader>
        <ModalBody>
          {selected && (
            <>
              <table className='table table-sm table-borderless mb-3' style={{ maxWidth: 480 }}>
                <tbody>
                  <tr><td className='text-muted fw-semibold' style={{ width: 160 }}>Pubblicata il</td><td>{fmtDateTime(selected.published_at)}</td></tr>
                  <tr><td className='text-muted fw-semibold'>Scadenza</td><td>{fmtDateTime(selected.expires_at)}</td></tr>
                  <tr>
                    <td className='text-muted fw-semibold'>Destinatari</td>
                    <td>
                      {selected.target_roles.length === 0
                        ? <span className='text-muted'>Tutti i ruoli attivi della struttura</span>
                        : selected.target_roles.map((r) => <Badge key={r.id} color='light' className='me-1 text-dark border'>{r.name}</Badge>)
                      }
                    </td>
                  </tr>
                  <tr>
                    <td className='text-muted fw-semibold'>Presa visione</td>
                    <td>
                      {selected.status === 'PUBLISHED' ? (
                        selected.is_acknowledged
                          ? <span className='text-success'>✓ {fmtDateTime(selected.acknowledged_at)}</span>
                          : <span className='text-warning'>In attesa</span>
                      ) : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className='border rounded p-3 mb-3' style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>
                {selected.body}
              </div>

              {selected.status === 'PUBLISHED' && !selected.is_acknowledged && (
                <Alert color='warning' className='py-2 px-3' style={{ fontSize: 13 }}>
                  Prendi visione di questa circolare per confermare la lettura. La presa visione è tracciata nel sistema.
                </Alert>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          {selected?.status === 'PUBLISHED' && !selected.is_acknowledged && (
            <Button color='primary' onClick={handleAcknowledge} disabled={acknowledging}>
              {acknowledging ? 'Conferma…' : 'Prendi visione'}
            </Button>
          )}
          <Button color='light' onClick={() => setSelected(null)}>Chiudi</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
