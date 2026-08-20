import { useEffect, useState } from 'react'
import {
  Alert, Badge, Button, Col, FormGroup, Input, Label, Modal,
  ModalBody, ModalFooter, ModalHeader, Row,
} from 'reactstrap'
import { Plus, AlertTriangle, Clock, Eye } from 'react-feather'
import { toast } from 'react-toastify'
import { healthEventApi, minorApi, apiError } from '../../../services/api'
import type {
  HealthEvent, HealthEventOptions, HealthEventWrite, HealthEventUpdate,
  MinorDocument,
} from '../../../types'

interface Props {
  minorId: number
  facilityId: number
}

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'secondary',
  RESCHEDULED: 'warning',
}

function fmtDate(v?: string | null) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('it-IT')
}
function fmtDateTime(v?: string | null) {
  if (!v) return '—'
  return new Date(v).toLocaleString('it-IT')
}

export default function VisiteMinoreTab({ minorId, facilityId }: Props) {
  const [options, setOptions] = useState<HealthEventOptions | null>(null)
  const [events, setEvents] = useState<HealthEvent[]>([])
  const [alerts, setAlerts] = useState<import('../../../types').HealthEventAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // filtri
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // minorDocs per il collegamento
  const [minorDocs, setMinorDocs] = useState<MinorDocument[]>([])

  // modal creazione
  const [createModal, setCreateModal] = useState(false)
  const [form, setForm] = useState<Partial<HealthEventWrite>>({})
  const [formMsg, setFormMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // dettaglio / modifica
  const [detailEvent, setDetailEvent] = useState<HealthEvent | null>(null)
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState<Partial<HealthEventUpdate>>({})
  const [editMsg, setEditMsg] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const loadAll = () => {
    setLoading(true)
    Promise.all([
      healthEventApi.options(facilityId),
      healthEventApi.list({ minor_id: minorId }),
      healthEventApi.alerts({ facility_id: facilityId, days: 30 }),
      minorApi.listDocuments(minorId),
    ])
      .then(([opts, evs, als, docs]) => {
        setOptions(opts)
        setEvents(evs)
        setAlerts(als)
        setMinorDocs(docs)
      })
      .catch((e) => {
        const ae = apiError(e)
        if (ae.status === 403) setError('Accesso clinico negato. Richiedi i permessi al coordinatore.')
        else setError(ae.message ?? 'Errore caricamento')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadAll() }, [minorId, facilityId])

  // Validazione occurred_at rispetto allo stato
  const validateOccurredAt = (statusCode: string, occurred_at?: string | null): string | null => {
    if (statusCode === 'COMPLETED' && !occurred_at) return 'La data effettiva è obbligatoria per eventi completati.'
    if (statusCode === 'CANCELLED' && occurred_at) return 'La data effettiva non può essere impostata per eventi annullati.'
    return null
  }

  const handleCreate = async () => {
    const f = form
    if (!f.category_id || !f.status_id || !f.scheduled_at) {
      setFormMsg('Categoria, stato e data programmata sono obbligatorie.')
      return
    }
    const selectedStatus = options?.statuses.find((s) => s.id === Number(f.status_id))
    const statusCode = selectedStatus?.code ?? ''
    const v = validateOccurredAt(statusCode, f.occurred_at)
    if (v) { setFormMsg(v); return }

    setSaving(true); setFormMsg(null)
    try {
      await healthEventApi.create({
        minor_id: minorId,
        facility_id: facilityId,
        category_id: Number(f.category_id),
        status_id: Number(f.status_id),
        scheduled_at: f.scheduled_at,
        occurred_at: f.occurred_at || null,
        provider_staff_member_id: f.provider_staff_member_id ? Number(f.provider_staff_member_id) : undefined,
        health_authority_document_issuer_id: f.health_authority_document_issuer_id ? Number(f.health_authority_document_issuer_id) : undefined,
        linked_minor_document_id: f.linked_minor_document_id ? Number(f.linked_minor_document_id) : undefined,
        reason: f.reason || undefined,
        clinical_findings: f.clinical_findings || undefined,
        outcome_notes: f.outcome_notes || undefined,
        follow_up_at: f.follow_up_at || undefined,
      })
      toast.success('Visita/esame creato.')
      setCreateModal(false); setForm({})
      loadAll()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setFormMsg('Accesso clinico negato.')
      else if (ae.status === 422) setFormMsg(ae.message ?? 'Dati non validi.')
      else setFormMsg(ae.message ?? 'Errore salvataggio.')
    } finally { setSaving(false) }
  }

  const handleEdit = async () => {
    if (!detailEvent) return
    const f = editForm
    const selectedStatus = options?.statuses.find((s) => s.id === Number(f.status_id ?? detailEvent.status_id))
    const statusCode = selectedStatus?.code ?? ''
    const v = validateOccurredAt(statusCode, f.occurred_at !== undefined ? f.occurred_at : detailEvent.occurred_at)
    if (v) { setEditMsg(v); return }

    setSavingEdit(true); setEditMsg(null)
    try {
      const updated = await healthEventApi.update(detailEvent.id, editForm)
      toast.success('Evento aggiornato.')
      setEditModal(false); setEditForm({})
      setDetailEvent(updated)
      setEvents((prev) => prev.map((ev) => ev.id === updated.id ? updated : ev))
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setEditMsg('Accesso clinico negato.')
      else if (ae.status === 422) setEditMsg(ae.message ?? 'Dati non validi.')
      else setEditMsg(ae.message ?? 'Errore aggiornamento.')
    } finally { setSavingEdit(false) }
  }

  const openEdit = (ev: HealthEvent) => {
    setDetailEvent(ev)
    setEditForm({})
    setEditMsg(null)
    setEditModal(true)
  }

  const filtered = events.filter((ev) => {
    if (filterCategory && ev.category_id !== Number(filterCategory)) return false
    if (filterStatus && ev.status_id !== Number(filterStatus)) return false
    return true
  })

  const selectedStatusCode = (statusId?: number | string) => {
    if (!statusId || !options) return ''
    return options.statuses.find((s) => s.id === Number(statusId))?.code ?? ''
  }

  if (loading) return <div className='text-center py-5'><div className='loader' /></div>
  if (error) return <Alert color='danger'>{error}</Alert>

  return (
    <div>
      {/* Box informativo */}
      <Alert color='info' className='d-flex gap-2 align-items-start mb-3' style={{ fontSize: 13 }}>
        <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          <strong>Programmato:</strong> appuntamento fissato ma non ancora avvenuto.{' '}
          <strong>Completato:</strong> visita/esame avvenuto — richiede data effettiva.{' '}
          <strong>Annullato:</strong> non avverrà — non può avere data effettiva.
          I testi clinici (motivo, risultati, note di esito) sono visibili solo nel dettaglio e solo per utenti autorizzati.
        </span>
      </Alert>

      {/* Alert promemoria */}
      {alerts.length > 0 && (
        <div className='mb-3'>
          {alerts.map((a, i) => (
            <Alert key={i} color={a.type === 'overdue' ? 'danger' : 'warning'} className='py-2 px-3 mb-1 d-flex gap-2 align-items-center' style={{ fontSize: 13 }}>
              <Clock size={13} />
              <span><strong>{a.type === 'overdue' ? 'Scaduto' : a.type === 'follow_up' ? 'Follow-up' : 'In arrivo'}:</strong> {a.message}</span>
            </Alert>
          ))}
        </div>
      )}

      {/* Header + filtri */}
      <div className='d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3'>
        <div className='d-flex gap-2'>
          <Input type='select' bsSize='sm' style={{ width: 160 }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value=''>Tutte le categorie</option>
            {options?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Input>
          <Input type='select' bsSize='sm' style={{ width: 140 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value=''>Tutti gli stati</option>
            {options?.statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Input>
        </div>
        <Button color='primary' size='sm' onClick={() => { setForm({}); setFormMsg(null); setCreateModal(true) }}>
          <Plus size={13} className='me-1' />Nuova visita/esame
        </Button>
      </div>

      {/* Tabella eventi — senza testi clinici */}
      {filtered.length === 0
        ? <p className='text-muted text-center py-3'>Nessuna visita od esame.</p>
        : (
          <table className='table table-hover table-sm'>
            <thead className='table-light'>
              <tr>
                <th>Categoria</th>
                <th>Stato</th>
                <th>Programmata</th>
                <th>Effettuata</th>
                <th>Medico/struttura</th>
                <th>Follow-up</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.category?.name ?? '—'}</td>
                  <td>
                    <Badge color={STATUS_COLOR[ev.status?.code ?? ''] ?? 'secondary'}>
                      {ev.status?.name ?? '—'}
                    </Badge>
                  </td>
                  <td>{fmtDateTime(ev.scheduled_at)}</td>
                  <td>{ev.occurred_at ? fmtDateTime(ev.occurred_at) : <span className='text-muted'>—</span>}</td>
                  <td>{ev.provider?.first_name ? `${ev.provider.first_name} ${ev.provider.last_name}` : '—'}</td>
                  <td>{ev.follow_up_at ? fmtDate(ev.follow_up_at) : '—'}</td>
                  <td>
                    <Button size='sm' color='light' onClick={() => setDetailEvent(ev)} title='Dettaglio clinico'>
                      <Eye size={12} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      {/* Pannello dettaglio clinico */}
      {detailEvent && (
        <div className='card mt-3 border-primary'>
          <div className='card-header py-2 d-flex justify-content-between align-items-center bg-light'>
            <strong>{detailEvent.category?.name ?? `Evento #${detailEvent.id}`}</strong>
            <div className='d-flex gap-2'>
              <Button size='sm' color='light' onClick={() => openEdit(detailEvent)}>Modifica</Button>
              <Button size='sm' color='light' onClick={() => setDetailEvent(null)}>✕</Button>
            </div>
          </div>
          <div className='card-body'>
            <Row>
              <Col md={4}>
                <small className='text-muted d-block'>Categoria</small>
                <strong>{detailEvent.category?.name ?? '—'}</strong>
              </Col>
              <Col md={4}>
                <small className='text-muted d-block'>Stato</small>
                <Badge color={STATUS_COLOR[detailEvent.status?.code ?? ''] ?? 'secondary'}>{detailEvent.status?.name ?? '—'}</Badge>
              </Col>
              <Col md={4}>
                <small className='text-muted d-block'>Data programmata</small>
                {fmtDateTime(detailEvent.scheduled_at)}
              </Col>
              {detailEvent.occurred_at && (
                <Col md={4} className='mt-2'>
                  <small className='text-muted d-block'>Data effettiva</small>
                  {fmtDateTime(detailEvent.occurred_at)}
                </Col>
              )}
              {detailEvent.follow_up_at && (
                <Col md={4} className='mt-2'>
                  <small className='text-muted d-block'>Follow-up</small>
                  {fmtDate(detailEvent.follow_up_at)}
                </Col>
              )}
            </Row>
            {/* Testi clinici — solo nel dettaglio */}
            {detailEvent.reason && (
              <div className='mt-3'>
                <small className='text-muted d-block'>Motivo</small>
                <p className='mb-0'>{detailEvent.reason}</p>
              </div>
            )}
            {detailEvent.clinical_findings && (
              <div className='mt-2'>
                <small className='text-muted d-block'>Risultati clinici</small>
                <p className='mb-0'>{detailEvent.clinical_findings}</p>
              </div>
            )}
            {detailEvent.outcome_notes && (
              <div className='mt-2'>
                <small className='text-muted d-block'>Note di esito</small>
                <p className='mb-0'>{detailEvent.outcome_notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal creazione */}
      <Modal isOpen={createModal} toggle={() => setCreateModal(false)} size='lg'>
        <ModalHeader toggle={() => setCreateModal(false)}>Nuova visita / esame</ModalHeader>
        <ModalBody>
          {formMsg && <Alert color='danger'>{formMsg}</Alert>}
          {!options
            ? <p className='text-muted'>Caricamento opzioni…</p>
            : (
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label>Categoria <span className='text-danger'>*</span></Label>
                    <Input type='select' value={form.category_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, category_id: Number(e.target.value) || undefined }))}>
                      <option value=''>Seleziona…</option>
                      {options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Stato <span className='text-danger'>*</span></Label>
                    <Input type='select' value={form.status_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, status_id: Number(e.target.value) || undefined }))}>
                      <option value=''>Seleziona…</option>
                      {options.statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Data programmata <span className='text-danger'>*</span></Label>
                    <Input type='datetime-local' value={form.scheduled_at ?? ''} onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))} />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>
                      Data effettiva
                      {selectedStatusCode(form.status_id) === 'COMPLETED' && <span className='text-danger'> *</span>}
                      {selectedStatusCode(form.status_id) === 'CANCELLED' && <span className='text-muted'> (vietata)</span>}
                    </Label>
                    <Input
                      type='datetime-local'
                      value={form.occurred_at ?? ''}
                      onChange={(e) => setForm((p) => ({ ...p, occurred_at: e.target.value || null }))}
                      disabled={selectedStatusCode(form.status_id) === 'CANCELLED'}
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Medico/operatore</Label>
                    <Input type='select' value={form.provider_staff_member_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, provider_staff_member_id: Number(e.target.value) || undefined }))}>
                      <option value=''>Nessuno</option>
                      {options.providers.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Ente sanitario</Label>
                    <Input type='select' value={form.health_authority_document_issuer_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, health_authority_document_issuer_id: Number(e.target.value) || undefined }))}>
                      <option value=''>Nessuno</option>
                      {options.health_authorities.map((ha) => <option key={ha.id} value={ha.id}>{ha.name}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Documento collegato</Label>
                    <Input type='select' value={form.linked_minor_document_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, linked_minor_document_id: Number(e.target.value) || undefined }))}>
                      <option value=''>Nessuno</option>
                      {minorDocs.map((d) => <option key={d.id} value={d.id}>{d.label ?? d.attachment?.original_name ?? `Doc #${d.id}`}</option>)}
                    </Input>
                    <small className='text-muted'>Seleziona un documento già caricato nella sezione Documenti.</small>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Follow-up</Label>
                    <Input type='date' value={form.follow_up_at ?? ''} onChange={(e) => setForm((p) => ({ ...p, follow_up_at: e.target.value || undefined }))} />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label>Motivo</Label>
                    <Input type='textarea' rows={2} value={form.reason ?? ''} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value || undefined }))} />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label>Risultati clinici</Label>
                    <Input type='textarea' rows={2} value={form.clinical_findings ?? ''} onChange={(e) => setForm((p) => ({ ...p, clinical_findings: e.target.value || undefined }))} />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label>Note di esito</Label>
                    <Input type='textarea' rows={2} value={form.outcome_notes ?? ''} onChange={(e) => setForm((p) => ({ ...p, outcome_notes: e.target.value || undefined }))} />
                  </FormGroup>
                </Col>
              </Row>
            )}
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleCreate} disabled={saving}>{saving ? 'Salvataggio…' : 'Crea'}</Button>
          <Button color='light' onClick={() => setCreateModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal modifica */}
      <Modal isOpen={editModal} toggle={() => setEditModal(false)} size='lg'>
        <ModalHeader toggle={() => setEditModal(false)}>Modifica visita/esame</ModalHeader>
        <ModalBody>
          {editMsg && <Alert color='danger'>{editMsg}</Alert>}
          {!options || !detailEvent
            ? null
            : (
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label>Stato</Label>
                    <Input type='select' value={editForm.status_id ?? detailEvent.status_id} onChange={(e) => setEditForm((p) => ({ ...p, status_id: Number(e.target.value) }))}>
                      {options.statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>
                      Data effettiva
                      {selectedStatusCode(editForm.status_id ?? detailEvent.status_id) === 'COMPLETED' && <span className='text-danger'> *</span>}
                      {selectedStatusCode(editForm.status_id ?? detailEvent.status_id) === 'CANCELLED' && <span className='text-muted'> (vietata)</span>}
                    </Label>
                    <Input
                      type='datetime-local'
                      value={editForm.occurred_at ?? detailEvent.occurred_at ?? ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, occurred_at: e.target.value || null }))}
                      disabled={selectedStatusCode(editForm.status_id ?? detailEvent.status_id) === 'CANCELLED'}
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Medico/operatore</Label>
                    <Input type='select' value={editForm.provider_staff_member_id ?? detailEvent.provider_staff_member_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, provider_staff_member_id: Number(e.target.value) || undefined }))}>
                      <option value=''>Nessuno</option>
                      {options.providers.map((pr) => <option key={pr.id} value={pr.id}>{pr.full_name}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Ente sanitario</Label>
                    <Input type='select' value={editForm.health_authority_document_issuer_id ?? detailEvent.health_authority_document_issuer_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, health_authority_document_issuer_id: Number(e.target.value) || undefined }))}>
                      <option value=''>Nessuno</option>
                      {options.health_authorities.map((ha) => <option key={ha.id} value={ha.id}>{ha.name}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Documento collegato</Label>
                    <Input type='select' value={editForm.linked_minor_document_id ?? detailEvent.linked_minor_document_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, linked_minor_document_id: Number(e.target.value) || undefined }))}>
                      <option value=''>Nessuno</option>
                      {minorDocs.map((d) => <option key={d.id} value={d.id}>{d.label ?? d.attachment?.original_name ?? `Doc #${d.id}`}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Label>Follow-up</Label>
                    <Input type='date' value={editForm.follow_up_at ?? detailEvent.follow_up_at ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, follow_up_at: e.target.value || undefined }))} />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label>Motivo</Label>
                    <Input type='textarea' rows={2} value={editForm.reason ?? detailEvent.reason ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, reason: e.target.value || undefined }))} />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label>Risultati clinici</Label>
                    <Input type='textarea' rows={2} value={editForm.clinical_findings ?? detailEvent.clinical_findings ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, clinical_findings: e.target.value || undefined }))} />
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label>Note di esito</Label>
                    <Input type='textarea' rows={2} value={editForm.outcome_notes ?? detailEvent.outcome_notes ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, outcome_notes: e.target.value || undefined }))} />
                  </FormGroup>
                </Col>
              </Row>
            )}
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleEdit} disabled={savingEdit}>{savingEdit ? 'Salvataggio…' : 'Aggiorna'}</Button>
          <Button color='light' onClick={() => setEditModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
