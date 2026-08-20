import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  FormGroup, Label, Input, Alert, Button,
} from 'reactstrap'
import { Home } from 'react-feather'
import { toast } from 'react-toastify'
import { incidentApi, incidentTypeApi, facilityApi, minorApi, apiError } from '../../services/api'
import type { Facility, Minor, IncidentOptions } from '../../types'

export default function NuovaSegnalazionePage() {
  const navigate = useNavigate()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [minors, setMinors]         = useState<Minor[]>([])
  const [options, setOptions]       = useState<IncidentOptions | null>(null)
  const [incidentTypes, setIncidentTypes] = useState<{ id: number; name: string }[]>([])

  const [form, setForm] = useState({
    facility_id: 0,
    minor_id: 0,
    incident_type_id: 0,
    severity: '',
    title: '',
    description: '',
    occurred_at: '',
  })
  const [msg, setMsg]       = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  useEffect(() => {
    Promise.all([
      facilityApi.list(),
      minorApi.list(),
      incidentApi.options(),
      incidentTypeApi.list().catch(() => []),
    ]).then(([facs, mins, opts, types]) => {
      setFacilities(facs)
      setMinors(Array.isArray(mins) ? mins : (mins as any).data ?? [])
      setOptions(opts)
      setIncidentTypes(Array.isArray(types) ? types : [])
    }).catch(() => {})
  }, [])

  const filteredMinors = form.facility_id ? minors.filter((m) => m.facility_id === form.facility_id) : minors

  const setF = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }))
  const fErr = (f: string) => fieldErrors[f]?.[0]

  const handleSubmit = async () => {
    if (!form.facility_id) { setMsg('Seleziona la struttura.'); return }
    if (!form.minor_id) { setMsg('Seleziona il minore.'); return }
    if (!form.incident_type_id) { setMsg('Seleziona il tipo di incidente.'); return }
    if (!form.severity) { setMsg('Seleziona il livello di gravità.'); return }
    if (!form.title.trim()) { setMsg('Inserisci un titolo.'); return }
    if (!form.description.trim()) { setMsg('Descrivi l\'incidente.'); return }
    if (!form.occurred_at) { setMsg('Indica data e ora dell\'incidente.'); return }
    setSaving(true); setMsg(null); setFieldErrors({})
    try {
      const inc = await incidentApi.create({
        facility_id: form.facility_id,
        minor_id: form.minor_id,
        incident_type_id: form.incident_type_id,
        severity: form.severity,
        title: form.title,
        description: form.description,
        occurred_at: form.occurred_at,
      })
      toast.success('Segnalazione registrata.')
      navigate(`/incidenti/${inc.id}`)
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 422) { setFieldErrors(ae.errors ?? {}); setMsg(ae.message ?? 'Dati non validi.') }
      else if (ae.status === 403) setMsg('Operazione non consentita.')
      else setMsg(ae.message ?? 'Errore salvataggio.')
    } finally { setSaving(false) }
  }

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Nuova segnalazione</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'><Link to='/incidenti'>Incidenti</Link></li>
                <li className='breadcrumb-item active'>Nuova segnalazione</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Row><Col md='8' lg='6'>
          <Card>
            <CardHeader><strong>Registra incidente</strong></CardHeader>
            <CardBody>
              <Alert color='warning' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
                Tutti i campi vengono validati dal backend. Seleziona i valori dai menu — nessun testo libero per tipologia, gravità o stato.
              </Alert>
              {msg && <Alert color='danger'>{msg}</Alert>}

              <Row>
                <Col md='6'>
                  <FormGroup>
                    <Label>Struttura <span className='text-danger'>*</span></Label>
                    <Input type='select' value={form.facility_id} invalid={!!fErr('facility_id')}
                      onChange={(e) => setF('facility_id', Number(e.target.value))}>
                      <option value={0}>Seleziona struttura…</option>
                      {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md='6'>
                  <FormGroup>
                    <Label>Minore <span className='text-danger'>*</span></Label>
                    <Input type='select' value={form.minor_id} invalid={!!fErr('minor_id')}
                      onChange={(e) => setF('minor_id', Number(e.target.value))}>
                      <option value={0}>Seleziona minore…</option>
                      {filteredMinors.map((m) => <option key={m.id} value={m.id}>{m.last_name} {m.first_name}</option>)}
                    </Input>
                    {form.facility_id === 0 && <small className='text-muted'>Seleziona prima la struttura</small>}
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md='6'>
                  <FormGroup>
                    <Label>Tipo di incidente <span className='text-danger'>*</span></Label>
                    <Input type='select' value={form.incident_type_id} invalid={!!fErr('incident_type_id')}
                      onChange={(e) => setF('incident_type_id', Number(e.target.value))}>
                      <option value={0}>Seleziona tipo…</option>
                      {incidentTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md='6'>
                  <FormGroup>
                    <Label>Gravità <span className='text-danger'>*</span></Label>
                    <Input type='select' value={form.severity} invalid={!!fErr('severity')}
                      onChange={(e) => setF('severity', e.target.value)}>
                      <option value=''>Seleziona gravità…</option>
                      {options?.severity_levels.map((s) => (
                        <option key={s.code} value={s.code}>{s.label}</option>
                      ))}
                    </Input>
                    {form.severity && options && (
                      <div className='mt-1'>
                        <span className={`badge badge-light-${options.severity_levels.find((s) => s.code === form.severity)?.color === 'green' ? 'success' : options.severity_levels.find((s) => s.code === form.severity)?.color === 'red' ? 'danger' : 'warning'}`}>
                          {options.severity_levels.find((s) => s.code === form.severity)?.label}
                        </span>
                      </div>
                    )}
                  </FormGroup>
                </Col>
              </Row>

              <FormGroup>
                <Label>Data e ora incidente <span className='text-danger'>*</span></Label>
                <Input type='datetime-local' value={form.occurred_at} invalid={!!fErr('occurred_at')}
                  onChange={(e) => setF('occurred_at', e.target.value)} />
                {fErr('occurred_at') && <div className='invalid-feedback d-block'>{fErr('occurred_at')}</div>}
              </FormGroup>

              <FormGroup>
                <Label>Titolo <span className='text-danger'>*</span></Label>
                <Input value={form.title} invalid={!!fErr('title')}
                  onChange={(e) => setF('title', e.target.value)}
                  placeholder="Descrizione sintetica dell'evento" />
                {fErr('title') && <div className='invalid-feedback d-block'>{fErr('title')}</div>}
              </FormGroup>

              <FormGroup>
                <Label>Descrizione dell'incidente <span className='text-danger'>*</span></Label>
                <Input type='textarea' rows={5} value={form.description} invalid={!!fErr('description')}
                  onChange={(e) => setF('description', e.target.value)}
                  placeholder='Descrizione dettagliata di quanto accaduto, inclusi eventuali testimoni, luogo e circostanze' />
                {fErr('description') && <div className='invalid-feedback d-block'>{fErr('description')}</div>}
              </FormGroup>

              <div className='d-flex gap-2'>
                <Button color='danger' onClick={handleSubmit} disabled={saving}>
                  {saving ? 'Salvataggio…' : 'Registra incidente'}
                </Button>
                <Button color='light' onClick={() => navigate('/incidenti')}>Annulla</Button>
              </div>
            </CardBody>
          </Card>
        </Col></Row>
      </Container>
    </>
  )
}
