import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Input, Alert, Button, Badge,
} from 'reactstrap'
import { Home, Bell, CheckCircle, Clock, ExternalLink } from 'react-feather'
import { toast } from 'react-toastify'
import { activityReminderApi, apiError } from '../../services/api'
import type { MinorActivityReminder } from '../../types'

function fmtDt(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}

export default function MieiPromemoriPage() {
  const [reminders, setReminders] = useState<MinorActivityReminder[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [pendingOnly, setPendingOnly] = useState(true)

  const load = (pending = pendingOnly) => {
    setLoading(true); setError(null)
    activityReminderApi.mine(pending)
      .then(setReminders)
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento promemoria'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, []) // eslint-disable-line

  const handleAcknowledge = async (r: MinorActivityReminder) => {
    if (!r.activity) return
    try {
      const updated = await activityReminderApi.acknowledge(r.minor_activity_id, r.id)
      setReminders((prev) => prev.map((x) => x.id === updated.id ? updated : x))
      toast.success('Presa visione registrata.')
    } catch (e) { toast.error(apiError(e).message ?? 'Errore presa visione.') }
  }

  const due     = reminders.filter((r) => r.is_due && !r.acknowledged_at)
  const pending = reminders.filter((r) => !r.is_due && !r.acknowledged_at)
  const done    = reminders.filter((r) => r.acknowledged_at)

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>I miei promemoria</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'><Link to='/attivita'>Attività</Link></li>
                <li className='breadcrumb-item active'>Miei promemoria</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Card>
          <CardHeader>
            <div className='d-flex align-items-center justify-content-between'>
              <div className='d-flex align-items-center gap-2'>
                <Bell size={16} className='text-primary' />
                <strong>Promemoria attività assegnati a me</strong>
                {due.length > 0 && <Badge color='warning' pill>{due.length} scaduti</Badge>}
              </div>
              <div className='d-flex align-items-center gap-2'>
                <div className='form-check form-switch mb-0'>
                  <input className='form-check-input' type='checkbox' id='pendingOnly' checked={pendingOnly}
                    onChange={(e) => { setPendingOnly(e.target.checked); load(e.target.checked) }} />
                  <label className='form-check-label small' htmlFor='pendingOnly'>Solo non presi in visione</label>
                </div>
                <Button size='sm' color='light' onClick={() => load()}>Aggiorna</Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className='alert alert-info py-2 px-3 mb-3' style={{ fontSize: 13 }}>
              Questa pagina mostra i promemoria sulle attività che altri utenti hanno impostato per te, o che hai impostato per te stesso. La presa visione è idempotente.
            </div>

            {error && <Alert color='danger'>{error}</Alert>}
            {loading && <div className='text-center py-4'><div className='loader' /></div>}

            {!loading && reminders.length === 0 && (
              <p className='text-muted text-center py-4'>Nessun promemoria {pendingOnly ? 'in attesa' : ''}.</p>
            )}

            {!loading && due.length > 0 && (
              <div className='mb-4'>
                <h6 className='fw-bold text-warning border-bottom pb-1 mb-2'><Clock size={14} className='me-1' />Scaduti — presa visione richiesta</h6>
                {due.map((r) => <ReminderRow key={r.id} r={r} onAck={handleAcknowledge} />)}
              </div>
            )}

            {!loading && pending.length > 0 && (
              <div className='mb-4'>
                <h6 className='fw-bold border-bottom pb-1 mb-2'><Bell size={14} className='me-1' />In attesa</h6>
                {pending.map((r) => <ReminderRow key={r.id} r={r} onAck={handleAcknowledge} />)}
              </div>
            )}

            {!loading && done.length > 0 && (
              <div>
                <h6 className='fw-bold text-muted border-bottom pb-1 mb-2'><CheckCircle size={14} className='me-1' />Presi in visione</h6>
                {done.map((r) => <ReminderRow key={r.id} r={r} onAck={handleAcknowledge} />)}
              </div>
            )}
          </CardBody>
        </Card>
      </Container>
    </>
  )
}

function ReminderRow({ r, onAck }: { r: MinorActivityReminder; onAck: (r: MinorActivityReminder) => void }) {
  const activityTitle = r.activity?.title ?? `Attività #${r.minor_activity_id}`
  const isAck = !!r.acknowledged_at

  return (
    <div className={`d-flex align-items-center justify-content-between border rounded px-3 py-2 mb-1 ${r.is_due && !isAck ? 'border-warning bg-warning bg-opacity-10' : isAck ? 'opacity-60' : ''}`}>
      <div>
        <span className='small fw-semibold me-2'>{activityTitle}</span>
        <span className='small text-muted'>{fmtDt(r.remind_at)}</span>
        {isAck
          ? <span className='ms-2 badge badge-light-success'><CheckCircle size={10} /> {fmtDt(r.acknowledged_at)}</span>
          : r.is_due
            ? <span className='ms-2 badge badge-light-warning'><Clock size={10} /> Scaduto</span>
            : null}
      </div>
      <div className='d-flex gap-1'>
        {r.activity && (
          <Link to={`/attivita`} className='btn btn-sm btn-light' title='Vai alle attività'>
            <ExternalLink size={12} />
          </Link>
        )}
        {!isAck && (
          <Button size='sm' color='primary' outline onClick={() => onAck(r)} title='Prendi visione'>
            <CheckCircle size={12} />
          </Button>
        )}
      </div>
    </div>
  )
}
