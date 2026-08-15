import { useEffect, useState } from 'react'
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Row, Col,
} from 'reactstrap'
import { Plus, Edit2, Eye, X } from 'react-feather'
import { toast } from 'react-toastify'
import { journalApi, lookupsApi, minorApi, apiError } from '../../../services/api'
import type { JournalEntry, JournalEntryWrite, JournalEntryType, PriorityLevel, MoodLevel, PeiObjective } from '../../../types'

const PRIORITY_BADGE: Record<string, string> = {
  green: 'badge-light-success', yellow: 'badge-light-warning', red: 'badge-light-danger',
}
const PRIORITY_LABEL: Record<string, string> = {
  green: 'Verde', yellow: 'Giallo', red: 'Rosso',
}
const MOOD_LABEL: Record<string, string> = {
  very_negative: 'Molto negativo', negative: 'Negativo', neutral: 'Neutro',
  positive: 'Positivo', very_positive: 'Molto positivo',
}
function fmtDt(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })
}

const EMPTY_FORM: JournalEntryWrite = {
  minor_id: 0,
  journal_entry_type_id: 0,
  observed_at: '',
  title: '',
  content: '',
  follow_up_required: false,
  follow_up_notes: null,
  priority_level: null,
  mood_level: null,
  nutrition_summary: null,
  hygiene_summary: null,
  sleep_summary: null,
  handover_required: false,
  handover_notes: null,
}

export default function DiarioMinoreTab({ minorId }: { minorId: number }) {
  const [items, setItems]               = useState<JournalEntry[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [entryTypes, setEntryTypes]     = useState<JournalEntryType[]>([])
  const [peiObjectives, setPeiObjectives] = useState<PeiObjective[]>([])

  const [detailTarget, setDetailTarget] = useState<JournalEntry | null>(null)
  const [editTarget, setEditTarget]     = useState<JournalEntry | null>(null)
  const [form, setForm]                 = useState<JournalEntryWrite>({ ...EMPTY_FORM, minor_id: minorId })
  const [saving, setSaving]             = useState(false)
  const [formMsg, setFormMsg]           = useState<string | null>(null)
  const [createOpen, setCreateOpen]     = useState(false)

  const load = () => {
    setLoading(true); setError(null)
    journalApi.list({ minor_id: minorId })
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((e) => {
        const ae = apiError(e)
        if (ae.status === 403) setError('Permessi insufficienti per visualizzare il diario di questo minore.')
        else setError(ae.message ?? 'Errore caricamento')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    lookupsApi.journalEntryTypes().then(setEntryTypes).catch(() => {})
    minorApi.get(minorId).then((m) => {
      const objs: PeiObjective[] = (m.peis ?? []).flatMap((pei) => pei.objectives ?? [])
      setPeiObjectives(objs)
    }).catch(() => {})
  }, [minorId]) // eslint-disable-line

  const setF = <K extends keyof JournalEntryWrite>(k: K, v: JournalEntryWrite[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, minor_id: minorId }); setFormMsg(null); setCreateOpen(true)
  }
  const openEdit = (item: JournalEntry) => {
    setForm({
      minor_id: minorId,
      journal_entry_type_id: item.journal_entry_type_id,
      observed_at: item.observed_at?.slice(0, 16) ?? '',
      title: item.title,
      content: item.content,
      follow_up_required: item.follow_up_required,
      follow_up_notes: item.follow_up_notes ?? null,
      pei_objective_id: item.pei_objective_id ?? null,
      priority_level: item.priority_level ?? null,
      mood_level: item.mood_level ?? null,
      nutrition_summary: item.nutrition_summary ?? null,
      hygiene_summary: item.hygiene_summary ?? null,
      sleep_summary: item.sleep_summary ?? null,
      handover_required: item.handover_required ?? false,
      handover_notes: item.handover_notes ?? null,
    })
    setFormMsg(null); setEditTarget(item)
  }

  const handleSave = async () => {
    setFormMsg(null)
    if (!form.journal_entry_type_id) { setFormMsg('Seleziona il tipo di voce.'); return }
    if (!form.observed_at)           { setFormMsg('Inserisci la data/ora di osservazione.'); return }
    if (!form.title.trim())          { setFormMsg('Inserisci un titolo.'); return }
    if (!form.content.trim())        { setFormMsg('Il contenuto è obbligatorio.'); return }
    setSaving(true)
    try {
      if (editTarget) {
        await journalApi.update(editTarget.id, form)
        toast.success('Voce diario aggiornata.')
        setEditTarget(null)
      } else {
        await journalApi.create(form)
        toast.success('Voce diario registrata.')
        setCreateOpen(false)
      }
      load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setFormMsg('Non hai i permessi per questa operazione.')
      else setFormMsg(ae.message ?? 'Errore durante il salvataggio.')
    } finally { setSaving(false) }
  }

  const PRIORITY_OPTIONS: PriorityLevel[] = ['green', 'yellow', 'red']
  const MOOD_OPTIONS: MoodLevel[] = ['very_negative', 'negative', 'neutral', 'positive', 'very_positive']

  const FormBody = () => (
    <>
      {formMsg && <Alert color='warning'>{formMsg}</Alert>}
      <Row>
        <Col md='6'>
          <FormGroup>
            <Label className='col-form-label'>Tipo voce <span className='text-danger'>*</span></Label>
            <Input type='select' value={form.journal_entry_type_id || ''}
              onChange={(e) => setF('journal_entry_type_id', Number(e.target.value))}>
              <option value=''>— Seleziona —</option>
              {entryTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Input>
          </FormGroup>
        </Col>
        <Col md='6'>
          <FormGroup>
            <Label className='col-form-label'>Data/ora osservazione <span className='text-danger'>*</span></Label>
            <Input type='datetime-local' value={form.observed_at}
              onChange={(e) => setF('observed_at', e.target.value)} />
          </FormGroup>
        </Col>
      </Row>
      <FormGroup>
        <Label className='col-form-label'>Titolo <span className='text-danger'>*</span></Label>
        <Input value={form.title} onChange={(e) => setF('title', e.target.value)} />
      </FormGroup>
      <FormGroup>
        <Label className='col-form-label'>Contenuto <span className='text-danger'>*</span></Label>
        <Input type='textarea' rows={4} value={form.content}
          onChange={(e) => setF('content', e.target.value)} />
      </FormGroup>
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
          <small className='text-muted'>Collega la voce a un obiettivo PEI se l'osservazione misura l'andamento educativo.</small>
        </FormGroup>
      )}
      <Row>
        <Col md='6'>
          <FormGroup>
            <Label className='col-form-label'>Livello priorità</Label>
            <Input type='select' value={form.priority_level ?? ''}
              onChange={(e) => setF('priority_level', (e.target.value || null) as PriorityLevel | null)}>
              <option value=''>— Non specificato —</option>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </Input>
          </FormGroup>
        </Col>
        <Col md='6'>
          <FormGroup>
            <Label className='col-form-label'>Umore osservato</Label>
            <Input type='select' value={form.mood_level ?? ''}
              onChange={(e) => setF('mood_level', (e.target.value || null) as MoodLevel | null)}>
              <option value=''>— Non rilevato —</option>
              {MOOD_OPTIONS.map((m) => <option key={m} value={m}>{MOOD_LABEL[m]}</option>)}
            </Input>
          </FormGroup>
        </Col>
      </Row>
      <Row>
        <Col md='4'>
          <FormGroup>
            <Label className='col-form-label'>Note nutrizione</Label>
            <Input type='textarea' rows={2} value={form.nutrition_summary ?? ''}
              onChange={(e) => setF('nutrition_summary', e.target.value || null)} />
          </FormGroup>
        </Col>
        <Col md='4'>
          <FormGroup>
            <Label className='col-form-label'>Note igiene</Label>
            <Input type='textarea' rows={2} value={form.hygiene_summary ?? ''}
              onChange={(e) => setF('hygiene_summary', e.target.value || null)} />
          </FormGroup>
        </Col>
        <Col md='4'>
          <FormGroup>
            <Label className='col-form-label'>Note sonno</Label>
            <Input type='textarea' rows={2} value={form.sleep_summary ?? ''}
              onChange={(e) => setF('sleep_summary', e.target.value || null)} />
          </FormGroup>
        </Col>
      </Row>
      <Row>
        <Col md='6'>
          <FormGroup check className='mt-2'>
            <Input type='checkbox' checked={form.follow_up_required}
              onChange={(e) => setF('follow_up_required', e.target.checked)} id='diario-fu' />
            <Label check for='diario-fu'>Follow-up richiesto</Label>
          </FormGroup>
        </Col>
        <Col md='6'>
          <FormGroup check className='mt-2'>
            <Input type='checkbox' checked={form.handover_required ?? false}
              onChange={(e) => setF('handover_required', e.target.checked)} id='diario-ho' />
            <Label check for='diario-ho'>Handover richiesto</Label>
          </FormGroup>
        </Col>
      </Row>
      {form.follow_up_required && (
        <FormGroup className='mt-2'>
          <Label className='col-form-label'>Note follow-up</Label>
          <Input type='textarea' rows={2} value={form.follow_up_notes ?? ''}
            onChange={(e) => setF('follow_up_notes', e.target.value || null)} />
        </FormGroup>
      )}
      {form.handover_required && (
        <FormGroup className='mt-2'>
          <Label className='col-form-label'>Note handover</Label>
          <Input type='textarea' rows={2} value={form.handover_notes ?? ''}
            onChange={(e) => setF('handover_notes', e.target.value || null)} />
        </FormGroup>
      )}
    </>
  )

  return (
    <div>
      <div className='d-flex justify-content-end mb-3'>
        <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
          <Plus size={13} /> Nuova voce diario
        </Button>
      </div>

      {loading && <div className='text-center py-3'><span className='spinner-border spinner-border-sm' /></div>}
      {error && <Alert color='warning'>{error}</Alert>}
      {!loading && !error && items.length === 0 && (
        <p className='text-muted py-2'>Nessuna voce di diario registrata per questo minore.</p>
      )}
      {!loading && !error && items.length > 0 && (
        <div className='table-responsive'>
          <table className='table table-hover table-sm'>
            <thead className='table-light'>
              <tr><th>Data</th><th>Tipo</th><th>Titolo</th><th>Priorità</th><th>Umore</th><th>Follow-up</th><th>Handover</th><th>PEI</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className='small'>{fmtDt(item.observed_at)}</td>
                  <td className='small'>{item.journal_entry_type?.name ?? '—'}</td>
                  <td className='small'>{item.title}</td>
                  <td>{item.priority_level ? <span className={`badge ${PRIORITY_BADGE[item.priority_level]}`}>{PRIORITY_LABEL[item.priority_level]}</span> : <span className='text-muted'>—</span>}</td>
                  <td className='small'>{item.mood_level ? MOOD_LABEL[item.mood_level] : '—'}</td>
                  <td>{item.follow_up_required ? <span className='badge badge-light-warning'>Sì</span> : <span className='text-muted'>No</span>}</td>
                  <td>{item.handover_required ? <span className='badge badge-light-info'>Sì</span> : <span className='text-muted'>No</span>}</td>
                  <td>
                    {item.pei_objective_id && <span className='badge badge-light-info'>PEI</span>}
                  </td>
                  <td>
                    <div className='d-flex gap-1'>
                      <Button size='sm' color='outline-secondary' className='d-flex align-items-center gap-1' onClick={() => setDetailTarget(item)}><Eye size={12} /> Dettagli</Button>
                      <Button size='sm' color='outline-primary' className='d-flex align-items-center gap-1'
                        disabled={!!item.journal_shift?.closed_at}
                        title={item.journal_shift?.closed_at ? 'Turno chiuso — voce non modificabile' : 'Modifica'}
                        onClick={() => openEdit(item)}><Edit2 size={12} /> Modifica</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={createOpen} toggle={() => setCreateOpen(false)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setCreateOpen(false)}>Nuova voce diario</ModalHeader>
        <ModalBody>{FormBody()}</ModalBody>
        <ModalFooter>
          <Button color='primary' size='sm' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='secondary' size='sm' className='d-flex align-items-center gap-1' onClick={() => setCreateOpen(false)}><X size={13} /> Annulla</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!editTarget} toggle={() => setEditTarget(null)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setEditTarget(null)}>Modifica voce diario</ModalHeader>
        <ModalBody>{FormBody()}</ModalBody>
        <ModalFooter>
          <Button color='primary' size='sm' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='secondary' size='sm' className='d-flex align-items-center gap-1' onClick={() => setEditTarget(null)}><X size={13} /> Annulla</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!detailTarget} toggle={() => setDetailTarget(null)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setDetailTarget(null)}>Dettaglio voce diario</ModalHeader>
        <ModalBody>
          {detailTarget && (<>
            <Row className='mb-3'>
              <Col md='6'>
                <small className='text-muted d-block'>Tipo voce</small>
                <span>{detailTarget.journal_entry_type?.name ?? '\u2014'}</span>
              </Col>
              <Col md='6'>
                <small className='text-muted d-block'>Data osservazione</small>
                <span>{fmtDt(detailTarget.observed_at)}</span>
              </Col>
            </Row>
            <div className='mb-3'>
              <small className='text-muted d-block'>Titolo</small>
              <strong>{detailTarget.title}</strong>
            </div>
            <div className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
              <strong style={{ color: '#333' }}>Contenuto</strong>
              <p className='mb-0 mt-2 small' style={{ whiteSpace: 'pre-wrap', color: '#7366ff' }}>{detailTarget.content}</p>
            </div>
            {(detailTarget.priority_level || detailTarget.mood_level) && (
              <div className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
                <strong style={{ color: '#333' }}>Valutazione</strong>
                <div className='mt-2 small' style={{ color: '#444' }}>
                  {detailTarget.priority_level && <div><span className='text-muted'>Priorita:</span> <span className={`badge ms-1 ${PRIORITY_BADGE[detailTarget.priority_level]}`}>{PRIORITY_LABEL[detailTarget.priority_level]}</span></div>}
                  {detailTarget.mood_level && <div className='mt-1'><span className='text-muted'>Umore:</span> <span className='ms-1'>{MOOD_LABEL[detailTarget.mood_level]}</span></div>}
                </div>
              </div>
            )}
            {(detailTarget.nutrition_summary || detailTarget.hygiene_summary || detailTarget.sleep_summary) && (
              <div className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
                <strong style={{ color: '#333' }}>Registro turno</strong>
                <Row className='mt-2'>
                  {detailTarget.nutrition_summary && <Col md='4'><small className='text-muted d-block'>Alimentazione</small><span style={{ color: '#333', fontSize: 13 }}>{detailTarget.nutrition_summary}</span></Col>}
                  {detailTarget.hygiene_summary   && <Col md='4'><small className='text-muted d-block'>Igiene</small><span style={{ color: '#333', fontSize: 13 }}>{detailTarget.hygiene_summary}</span></Col>}
                  {detailTarget.sleep_summary     && <Col md='4'><small className='text-muted d-block'>Sonno</small><span style={{ color: '#333', fontSize: 13 }}>{detailTarget.sleep_summary}</span></Col>}
                </Row>
              </div>
            )}
            {(detailTarget.follow_up_required || detailTarget.handover_required) && (
              <div className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
                <strong style={{ color: '#333' }}>Segnalazioni</strong>
                <div className='mt-2 small'>
                  {detailTarget.follow_up_required && (
                    <div><span className='badge badge-light-warning me-1'>Follow-up richiesto</span><span style={{ color: '#444' }}>{detailTarget.follow_up_notes}</span></div>
                  )}
                  {detailTarget.handover_required && (
                    <div className='mt-1'><span className='badge badge-light-info me-1'>Handover richiesto</span><span style={{ color: '#444' }}>{detailTarget.handover_notes}</span></div>
                  )}
                </div>
              </div>
            )}
            {detailTarget.created_by && (
              <div className='mt-2 small text-muted'>Registrato da: {detailTarget.created_by.display_name}</div>
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
