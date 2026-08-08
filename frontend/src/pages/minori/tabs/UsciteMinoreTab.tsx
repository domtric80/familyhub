import { useEffect, useState } from 'react'
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Row, Col, Badge,
} from 'reactstrap'
import { Plus, Edit2, Eye, X } from 'react-feather'
import { toast } from 'react-toastify'
import { minorExitApi, lookupsApi, apiError } from '../../../services/api'
import type { MinorExit, MinorExitUpdate, LookupItem } from '../../../types'

const STATUS_BADGE: Record<string, string> = {
  planned: 'badge-light-primary', out: 'badge-light-warning',
  returned: 'badge-light-success', cancelled: 'badge-light-secondary',
}
const STATUS_LABEL: Record<string, string> = {
  planned: 'Pianificata', out: 'Fuori struttura',
  returned: 'Rientrata', cancelled: 'Annullata',
}
function fmtDt(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}

const EMPTY_FORM: MinorExitUpdate = {
  exit_type_id: 0,
  destination: '',
  reason: '',
  planned_exit_at: '',
  expected_return_at: '',
  status: 'planned',
  outcome_notes: '',
  cancellation_reason: '',
}

export default function UsciteMinoreTab({ minorId, facilityId }: { minorId: number; facilityId: number }) {
  const [items, setItems]         = useState<MinorExit[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [exitTypes, setExitTypes] = useState<LookupItem[]>([])

  const [detailTarget, setDetailTarget] = useState<MinorExit | null>(null)
  const [editTarget, setEditTarget]     = useState<MinorExit | null>(null)
  const [form, setForm]                 = useState<MinorExitUpdate>(EMPTY_FORM)
  const [saving, setSaving]             = useState(false)
  const [formMsg, setFormMsg]           = useState<string | null>(null)
  const [createOpen, setCreateOpen]     = useState(false)

  const load = () => {
    setLoading(true); setError(null)
    minorExitApi.list({ minor_id: minorId })
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => {
        const ae = apiError(e)
        if (ae.status === 403) setError('Permessi insufficienti per visualizzare le uscite di questo minore.')
        else setError(ae.message ?? 'Errore caricamento')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    lookupsApi.exitTypes().then(setExitTypes).catch(() => {})
  }, [minorId]) // eslint-disable-line

  const setF = (k: keyof MinorExitUpdate, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const openCreate = () => {
    setForm(EMPTY_FORM); setFormMsg(null); setCreateOpen(true)
  }
  const openEdit = (item: MinorExit) => {
    setForm({
      exit_type_id: item.exit_type_id,
      destination: item.destination,
      reason: item.reason ?? '',
      planned_exit_at: item.planned_exit_at?.slice(0, 16) ?? '',
      expected_return_at: item.expected_return_at?.slice(0, 16) ?? '',
      status: item.status,
      outcome_notes: item.outcome_notes ?? '',
      cancellation_reason: item.cancellation_reason ?? '',
    })
    setFormMsg(null); setEditTarget(item)
  }

  const handleSave = async () => {
    setFormMsg(null)
    if (!form.exit_type_id)      { setFormMsg('Seleziona il tipo di uscita.'); return }
    if (!form.destination.trim()) { setFormMsg('Inserisci la destinazione.'); return }
    if (!form.planned_exit_at)   { setFormMsg('Inserisci la data/ora di uscita prevista.'); return }
    setSaving(true)
    try {
      if (editTarget) {
        await minorExitApi.update(editTarget.id, form)
        toast.success('Uscita aggiornata.')
        setEditTarget(null)
      } else {
        await minorExitApi.create({ ...form, minor_id: minorId, facility_id: facilityId })
        toast.success('Uscita registrata.')
        setCreateOpen(false)
      }
      load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setFormMsg('Non hai i permessi per questa operazione.')
      else setFormMsg(ae.message ?? 'Errore durante il salvataggio.')
    } finally { setSaving(false) }
  }

  const FormModal = ({ isOpen, onClose, title }: { isOpen: boolean; onClose: () => void; title: string }) => (
    <Modal isOpen={isOpen} toggle={onClose} size='lg' centered scrollable>
      <ModalHeader toggle={onClose}>{title}</ModalHeader>
      <ModalBody>
        {formMsg && <Alert color='warning'>{formMsg}</Alert>}
        <Row>
          <Col md='6'>
            <FormGroup>
              <Label className='col-form-label'>Tipo uscita <span className='text-danger'>*</span></Label>
              <Input type='select' value={form.exit_type_id || ''}
                onChange={(e) => setF('exit_type_id', Number(e.target.value))}>
                <option value=''>— Seleziona —</option>
                {exitTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Input>
            </FormGroup>
          </Col>
          <Col md='6'>
            <FormGroup>
              <Label className='col-form-label'>Stato</Label>
              <Input type='select' value={form.status}
                onChange={(e) => setF('status', e.target.value)}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Input>
            </FormGroup>
          </Col>
        </Row>
        <FormGroup>
          <Label className='col-form-label'>Destinazione <span className='text-danger'>*</span></Label>
          <Input value={form.destination} onChange={(e) => setF('destination', e.target.value)}
            placeholder='Es. Via Roma 12, Milano' />
        </FormGroup>
        <FormGroup>
          <Label className='col-form-label'>Motivo</Label>
          <Input type='textarea' rows={2} value={form.reason ?? ''}
            onChange={(e) => setF('reason', e.target.value || null)} />
        </FormGroup>
        <Row>
          <Col md='6'>
            <FormGroup>
              <Label className='col-form-label'>Uscita prevista <span className='text-danger'>*</span></Label>
              <Input type='datetime-local' value={form.planned_exit_at}
                onChange={(e) => setF('planned_exit_at', e.target.value)} />
            </FormGroup>
          </Col>
          <Col md='6'>
            <FormGroup>
              <Label className='col-form-label'>Rientro previsto</Label>
              <Input type='datetime-local' value={form.expected_return_at ?? ''}
                onChange={(e) => setF('expected_return_at', e.target.value || null)} />
            </FormGroup>
          </Col>
        </Row>
        <FormGroup>
          <Label className='col-form-label'>Note esito</Label>
          <Input type='textarea' rows={2} value={form.outcome_notes ?? ''}
            onChange={(e) => setF('outcome_notes', e.target.value || null)} />
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button color='primary' size='sm' onClick={handleSave} disabled={saving}>
          {saving ? 'Salvataggio…' : 'Salva'}
        </Button>
        <Button color='secondary' size='sm' className='d-flex align-items-center gap-1' onClick={onClose}>
          <X size={13} /> Annulla
        </Button>
      </ModalFooter>
    </Modal>
  )

  return (
    <div>
      <div className='d-flex justify-content-end mb-3'>
        <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
          <Plus size={13} /> Nuova uscita
        </Button>
      </div>

      {loading && <div className='text-center py-3'><span className='spinner-border spinner-border-sm' /></div>}
      {error && <Alert color='warning'>{error}</Alert>}

      {!loading && !error && items.length === 0 && (
        <p className='text-muted py-2'>Nessuna uscita registrata per questo minore.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className='table-responsive'>
          <table className='table table-hover table-sm'>
            <thead className='table-light'>
              <tr><th>Tipo</th><th>Destinazione</th><th>Uscita prev.</th><th>Rientro prev.</th><th>Stato</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className='small'>{item.exit_type?.name ?? `#${item.exit_type_id}`}</td>
                  <td className='small'>{item.destination}</td>
                  <td className='small'>{fmtDt(item.planned_exit_at)}</td>
                  <td className='small'>{fmtDt(item.expected_return_at)}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[item.status] ?? 'badge-light-secondary'}`}>
                      {STATUS_LABEL[item.status] ?? item.status}
                    </span>
                    {item.is_overdue && <Badge color='danger' className='ms-1' style={{ fontSize: 10 }}>In ritardo</Badge>}
                  </td>
                  <td>
                    <div className='d-flex gap-1'>
                      <Button size='sm' color='outline-secondary' className='d-flex align-items-center gap-1'
                        onClick={() => setDetailTarget(item)}>
                        <Eye size={12} /> Dettagli
                      </Button>
                      <Button size='sm' color='outline-primary' className='d-flex align-items-center gap-1'
                        onClick={() => openEdit(item)}>
                        <Edit2 size={12} /> Modifica
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modale crea */}
      {FormModal({ isOpen: createOpen, onClose: () => setCreateOpen(false), title: 'Nuova uscita' })}

      {/* Modale modifica */}
      {FormModal({ isOpen: !!editTarget, onClose: () => setEditTarget(null), title: 'Modifica uscita' })}

      <Modal isOpen={!!detailTarget} toggle={() => setDetailTarget(null)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setDetailTarget(null)}>Dettaglio uscita</ModalHeader>
        <ModalBody>
          {detailTarget && (<>
            <Row className='mb-3'>
              <Col md='6'>
                <small className='text-muted d-block'>Tipo uscita</small>
                <span>{detailTarget.exit_type?.name ?? '\u2014'}</span>
              </Col>
              <Col md='6'>
                <small className='text-muted d-block'>Stato</small>
                <span className={`badge ${STATUS_BADGE[detailTarget.status]}`}>{STATUS_LABEL[detailTarget.status] ?? detailTarget.status}</span>
                {detailTarget.is_overdue && <Badge color='danger' className='ms-1' style={{ fontSize: 10 }}>In ritardo</Badge>}
              </Col>
            </Row>
            <div className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
              <strong style={{ color: '#333' }}>Destinazione e motivo</strong>
              <div className='mt-2 small' style={{ color: '#333' }}>
                <div><span className='text-muted'>Destinazione:</span> {detailTarget.destination}</div>
                {detailTarget.reason && <div className='mt-1'><span className='text-muted'>Motivo:</span> {detailTarget.reason}</div>}
              </div>
            </div>
            <div className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
              <strong style={{ color: '#333' }}>Date</strong>
              <Row className='mt-2'>
                <Col md='6'><small className='text-muted d-block'>Uscita prevista</small><span style={{ color: '#333', fontSize: 14 }}>{fmtDt(detailTarget.planned_exit_at)}</span></Col>
                <Col md='6'><small className='text-muted d-block'>Rientro previsto</small><span style={{ color: '#333', fontSize: 14 }}>{fmtDt(detailTarget.expected_return_at)}</span></Col>
                <Col md='6' className='mt-2'><small className='text-muted d-block'>Uscita effettiva</small><span style={{ color: '#333', fontSize: 14 }}>{fmtDt(detailTarget.actual_exit_at)}</span></Col>
                <Col md='6' className='mt-2'><small className='text-muted d-block'>Rientro effettivo</small><span style={{ color: '#333', fontSize: 14 }}>{fmtDt(detailTarget.actual_return_at)}</span></Col>
              </Row>
              {detailTarget.delay_minutes != null && detailTarget.delay_minutes > 0 && (
                <div className='mt-2 small' style={{ color: '#c00' }}>Ritardo: {detailTarget.delay_minutes} min</div>
              )}
              {detailTarget.return_condition && (
                <div className='mt-2 small'><span className='text-muted'>Condizione rientro:</span> <span style={{ color: '#333' }}>{detailTarget.return_condition}</span></div>
              )}
            </div>
            {(detailTarget.outcome_notes || detailTarget.follow_up_required) && (
              <div className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
                <strong style={{ color: '#333' }}>Note</strong>
                <div className='mt-2 small' style={{ color: '#444' }}>
                  {detailTarget.outcome_notes && <div><span className='text-muted'>Note esito:</span> {detailTarget.outcome_notes}</div>}
                  {detailTarget.follow_up_required && (
                    <div className='mt-1'><span className='badge badge-light-warning me-1'>Follow-up richiesto</span>{detailTarget.follow_up_notes}</div>
                  )}
                </div>
              </div>
            )}
          </>)}
        </ModalBody>
        <ModalFooter>
          {detailTarget && <Button color='primary' size='sm' onClick={() => { openEdit(detailTarget); setDetailTarget(null) }}>Modifica</Button>}
          <Button color='secondary' size='sm' onClick={() => setDetailTarget(null)}>Chiudi</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
