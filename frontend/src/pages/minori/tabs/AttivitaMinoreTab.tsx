import { useEffect, useState } from 'react'
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Row, Col,
} from 'reactstrap'
import { Plus, Edit2, Eye, X } from 'react-feather'
import { toast } from 'react-toastify'
import { activityApi, lookupsApi, minorApi, apiError } from '../../../services/api'
import type { Activity, ActivityWrite, ActivityType, PeiObjective } from '../../../types'

const STATUS_BADGE: Record<string, string> = {
  planned: 'badge-light-primary', in_progress: 'badge-light-warning',
  completed: 'badge-light-success', cancelled: 'badge-light-secondary',
}
const STATUS_LABEL: Record<string, string> = {
  planned: 'Pianificata', in_progress: 'In corso',
  completed: 'Completata', cancelled: 'Annullata',
}
const ATTENDANCE_LABEL: Record<string, string> = {
  present: 'Presenza completa', partial: 'Presenza parziale', absent: 'Assente',
}
function fmtDt(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}

const EMPTY_FORM: ActivityWrite = {
  minor_id: 0,
  activity_type_id: 0,
  title: '',
  description: '',
  location: '',
  planned_start_at: '',
  planned_end_at: '',
  status: 'planned',
  outcome_notes: '',
  attendance_status: null,
  follow_up_required: false,
  follow_up_notes: '',
}

export default function AttivitaMinoreTab({ minorId }: { minorId: number }) {
  const [items, setItems]             = useState<Activity[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])
  const [peiObjectives, setPeiObjectives] = useState<PeiObjective[]>([])

  const [detailTarget, setDetailTarget] = useState<Activity | null>(null)
  const [editTarget, setEditTarget]     = useState<Activity | null>(null)
  const [form, setForm]                 = useState<ActivityWrite>({ ...EMPTY_FORM, minor_id: minorId })
  const [saving, setSaving]             = useState(false)
  const [formMsg, setFormMsg]           = useState<string | null>(null)
  const [createOpen, setCreateOpen]     = useState(false)

  const load = () => {
    setLoading(true); setError(null)
    activityApi.list({ minor_id: minorId })
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => {
        const ae = apiError(e)
        if (ae.status === 403) setError('Permessi insufficienti per visualizzare le attività di questo minore.')
        else setError(ae.message ?? 'Errore caricamento')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    lookupsApi.activityTypes().then(setActivityTypes).catch(() => {})
    // Carica PEI e obiettivi per il selettore
    minorApi.get(minorId).then((m) => {
      const objs: PeiObjective[] = (m.peis ?? []).flatMap((pei) => pei.objectives ?? [])
      setPeiObjectives(objs)
    }).catch(() => {})
  }, [minorId]) // eslint-disable-line

  const setF = (k: keyof ActivityWrite, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, minor_id: minorId }); setFormMsg(null); setCreateOpen(true)
  }
  const openEdit = (item: Activity) => {
    setForm({
      minor_id: minorId,
      activity_type_id: item.activity_type_id,
      title: item.title,
      description: item.description ?? '',
      location: item.location ?? '',
      planned_start_at: item.planned_start_at?.slice(0, 16) ?? '',
      planned_end_at: item.planned_end_at?.slice(0, 16) ?? '',
      status: item.status,
      pei_objective_id: item.pei_objective_id ?? null,
      outcome_notes: item.outcome_notes ?? '',
      attendance_status: item.attendance_status ?? null,
      follow_up_required: item.follow_up_required ?? false,
      follow_up_notes: item.follow_up_notes ?? '',
    })
    setFormMsg(null); setEditTarget(item)
  }

  const handleSave = async () => {
    setFormMsg(null)
    if (!form.activity_type_id)  { setFormMsg('Seleziona il tipo di attività.'); return }
    if (!form.title.trim())      { setFormMsg('Inserisci il titolo.'); return }
    if (!form.planned_start_at)  { setFormMsg('Inserisci la data di inizio prevista.'); return }
    setSaving(true)
    try {
      if (editTarget) {
        await activityApi.update(editTarget.id, form)
        toast.success('Attività aggiornata.')
        setEditTarget(null)
      } else {
        await activityApi.create(form)
        toast.success('Attività registrata.')
        setCreateOpen(false)
      }
      load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setFormMsg('Non hai i permessi per questa operazione.')
      else setFormMsg(ae.message ?? 'Errore durante il salvataggio.')
    } finally { setSaving(false) }
  }

  const FormBody = () => (
    <>
      {formMsg && <Alert color='warning'>{formMsg}</Alert>}
      <Row>
        <Col md='6'>
          <FormGroup>
            <Label className='col-form-label'>Tipo attività <span className='text-danger'>*</span></Label>
            <Input type='select' value={form.activity_type_id || ''}
              onChange={(e) => setF('activity_type_id', Number(e.target.value))}>
              <option value=''>— Seleziona —</option>
              {activityTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
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
        <Label className='col-form-label'>Titolo <span className='text-danger'>*</span></Label>
        <Input value={form.title} onChange={(e) => setF('title', e.target.value)} />
      </FormGroup>
      <FormGroup>
        <Label className='col-form-label'>Descrizione</Label>
        <Input type='textarea' rows={2} value={form.description ?? ''}
          onChange={(e) => setF('description', e.target.value || null)} />
      </FormGroup>
      <Row>
        <Col md='4'>
          <FormGroup>
            <Label className='col-form-label'>Luogo</Label>
            <Input value={form.location ?? ''} onChange={(e) => setF('location', e.target.value || null)} />
          </FormGroup>
        </Col>
        <Col md='4'>
          <FormGroup>
            <Label className='col-form-label'>Inizio previsto <span className='text-danger'>*</span></Label>
            <Input type='datetime-local' value={form.planned_start_at}
              onChange={(e) => setF('planned_start_at', e.target.value)} />
          </FormGroup>
        </Col>
        <Col md='4'>
          <FormGroup>
            <Label className='col-form-label'>Fine prevista</Label>
            <Input type='datetime-local' value={form.planned_end_at ?? ''}
              onChange={(e) => setF('planned_end_at', e.target.value || null)} />
          </FormGroup>
        </Col>
      </Row>
      <Row>
        <Col md='6'>
          <FormGroup>
            <Label className='col-form-label'>Presenza</Label>
            <Input type='select' value={form.attendance_status ?? ''}
              onChange={(e) => setF('attendance_status', e.target.value || null)}>
              <option value=''>— Non specificata —</option>
              {Object.entries(ATTENDANCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Input>
          </FormGroup>
        </Col>
        <Col md='6'>
          <FormGroup>
            <Label className='col-form-label'>Note esito</Label>
            <Input type='textarea' rows={2} value={form.outcome_notes ?? ''}
              onChange={(e) => setF('outcome_notes', e.target.value || null)} />
          </FormGroup>
        </Col>
      </Row>
      {peiObjectives.length > 0 && (
        <FormGroup>
          <Label className='col-form-label'>Collega a obiettivo PEI</Label>
          <Input type='select' value={form.pei_objective_id ?? ''}
            onChange={(e) => setF('pei_objective_id', Number(e.target.value) || null)}>
            <option value=''>— Nessun collegamento PEI —</option>
            {peiObjectives.map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.code ? `[${obj.code}] ` : ''}{obj.title}
              </option>
            ))}
          </Input>
          <small className='text-muted'>Usa questo campo quando l'attività documenta un progresso o una criticità rispetto al PEI.</small>
        </FormGroup>
      )}
      <FormGroup check className='mb-2'>
        <Input type='checkbox' id='fu-attivita' checked={form.follow_up_required ?? false}
          onChange={(e) => setF('follow_up_required', e.target.checked)} />
        <Label check htmlFor='fu-attivita' className='ms-1'>Follow-up richiesto</Label>
      </FormGroup>
      {form.follow_up_required && (
        <FormGroup>
          <Input type='textarea' rows={2} value={form.follow_up_notes ?? ''}
            onChange={(e) => setF('follow_up_notes', e.target.value || null)}
            placeholder='Descrivi il follow-up richiesto...' />
        </FormGroup>
      )}
    </>
  )

  return (
    <div>
      <div className='d-flex justify-content-end mb-3'>
        <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
          <Plus size={13} /> Nuova attività
        </Button>
      </div>

      {loading && <div className='text-center py-3'><span className='spinner-border spinner-border-sm' /></div>}
      {error && <Alert color='warning'>{error}</Alert>}
      {!loading && !error && items.length === 0 && (
        <p className='text-muted py-2'>Nessuna attività registrata per questo minore.</p>
      )}
      {!loading && !error && items.length > 0 && (
        <div className='table-responsive'>
          <table className='table table-hover table-sm'>
            <thead className='table-light'>
              <tr><th>Tipo</th><th>Titolo</th><th>Inizio prev.</th><th>Stato</th><th>Presenza</th><th>PEI</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className='small'>{item.activity_type?.name ?? '—'}</td>
                  <td className='small'>{item.title}</td>
                  <td className='small'>{fmtDt(item.planned_start_at)}</td>
                  <td><span className={`badge ${STATUS_BADGE[item.status] ?? 'badge-light-secondary'}`}>{STATUS_LABEL[item.status] ?? item.status}</span></td>
                  <td className='small'>{item.attendance_status ? ATTENDANCE_LABEL[item.attendance_status] ?? item.attendance_status : '—'}</td>
                  <td>
                    {item.pei_objective_id && <span className='badge badge-light-info'>PEI</span>}
                  </td>
                  <td>
                    <div className='d-flex gap-1'>
                      <Button size='sm' color='outline-secondary' className='d-flex align-items-center gap-1' onClick={() => setDetailTarget(item)}><Eye size={12} /> Dettagli</Button>
                      <Button size='sm' color='outline-primary' className='d-flex align-items-center gap-1' onClick={() => openEdit(item)}><Edit2 size={12} /> Modifica</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={createOpen} toggle={() => setCreateOpen(false)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setCreateOpen(false)}>Nuova attività</ModalHeader>
        <ModalBody>{FormBody()}</ModalBody>
        <ModalFooter>
          <Button color='primary' size='sm' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='secondary' size='sm' className='d-flex align-items-center gap-1' onClick={() => setCreateOpen(false)}><X size={13} /> Annulla</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!editTarget} toggle={() => setEditTarget(null)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setEditTarget(null)}>Modifica attività</ModalHeader>
        <ModalBody>{FormBody()}</ModalBody>
        <ModalFooter>
          <Button color='primary' size='sm' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='secondary' size='sm' className='d-flex align-items-center gap-1' onClick={() => setEditTarget(null)}><X size={13} /> Annulla</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!detailTarget} toggle={() => setDetailTarget(null)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setDetailTarget(null)}>Dettaglio attivita</ModalHeader>
        <ModalBody>
          {detailTarget && (<>
            <Row className='mb-3'>
              <Col md='6'>
                <small className='text-muted d-block'>Tipo attivita</small>
                <span>{detailTarget.activity_type?.name ?? '\u2014'}</span>
              </Col>
              <Col md='6'>
                <small className='text-muted d-block'>Stato</small>
                <span className={`badge ${STATUS_BADGE[detailTarget.status]}`}>{STATUS_LABEL[detailTarget.status] ?? detailTarget.status}</span>
              </Col>
            </Row>
            <div className='mb-2'>
              <small className='text-muted d-block'>Titolo</small>
              <strong>{detailTarget.title}</strong>
            </div>
            {detailTarget.description && (
              <div className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
                <strong style={{ color: '#333' }}>Descrizione</strong>
                <p className='mb-0 mt-1 small' style={{ color: '#333', whiteSpace: 'pre-wrap' }}>{detailTarget.description}</p>
              </div>
            )}
            <div className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
              <strong style={{ color: '#333' }}>Date e luogo</strong>
              <Row className='mt-2'>
                <Col md='4'><small className='text-muted d-block'>Luogo</small><span style={{ color: '#333', fontSize: 14 }}>{detailTarget.location ?? '\u2014'}</span></Col>
                <Col md='4'><small className='text-muted d-block'>Inizio previsto</small><span style={{ color: '#333', fontSize: 14 }}>{fmtDt(detailTarget.planned_start_at)}</span></Col>
                <Col md='4'><small className='text-muted d-block'>Fine prevista</small><span style={{ color: '#333', fontSize: 14 }}>{fmtDt(detailTarget.planned_end_at)}</span></Col>
              </Row>
            </div>
            <div className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
              <strong style={{ color: '#333' }}>Esito</strong>
              <div className='mt-2 small' style={{ color: '#444' }}>
                <div><span className='text-muted'>Presenza:</span> {detailTarget.attendance_status ? ATTENDANCE_LABEL[detailTarget.attendance_status] ?? detailTarget.attendance_status : '\u2014'}</div>
                {detailTarget.outcome_notes && <div className='mt-1'><span className='text-muted'>Note:</span> {detailTarget.outcome_notes}</div>}
              </div>
            </div>
            {detailTarget.follow_up_required && (
              <div className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
                <strong style={{ color: '#333' }}>Follow-up</strong>
                <div className='mt-1 small' style={{ color: '#444' }}>
                  <span className='badge badge-light-warning me-1'>Richiesto</span>
                  {detailTarget.follow_up_notes}
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
