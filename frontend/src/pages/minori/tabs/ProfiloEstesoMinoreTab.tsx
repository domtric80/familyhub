import { useEffect, useState } from 'react'
import {
  Row, Col, FormGroup, Label, Input, Alert, Button, Badge,
  Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap'
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronRight, Info } from 'react-feather'
import { toast } from 'react-toastify'
import { minorApi, staffMemberApi, apiError } from '../../../services/api'
import type {
  MinorProfile, MinorDiagnosis, MinorDiagnosisWrite,
  MinorPei, MinorPeiWrite, PeiObjective, PeiObjectiveWrite,
  MinorNeed, MinorNeedWrite, StaffMember, MinorDocument,
  MinorPeiHistoryEntry, MinorPeiObjectiveProgressEntry,
} from '../../../types'
import InfoDrawer from '../../../components/common/InfoDrawer'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('it-IT')
}
function docLabel(doc: MinorDocument) {
  return doc.label ?? doc.attachment?.original_name ?? `Doc #${doc.id}`
}

const CATEGORY_LABEL: Record<string, string> = {
  physical: 'Fisico', emotional: 'Emotivo', cognitive: 'Cognitivo',
  relational: 'Relazionale', spiritual: 'Spirituale',
}
const PRIORITY_LABEL: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Bassa' }
const PRIORITY_BADGE: Record<string, string> = {
  high: 'badge-light-danger', medium: 'badge-light-warning', low: 'badge-light-secondary',
}
const NEED_STATUS_LABEL: Record<string, string> = {
  open: 'Aperto', in_progress: 'In corso', satisfied: 'Soddisfatto',
}
const NEED_STATUS_BADGE: Record<string, string> = {
  open: 'badge-light-warning', in_progress: 'badge-light-primary', satisfied: 'badge-light-success',
}
const PEI_STATUS_LABEL: Record<string, string> = {
  draft: 'Bozza', active: 'Attivo', closed: 'Chiuso', archived: 'Archiviato',
}
const OBJ_STATUS_LABEL: Record<string, string> = {
  pending: 'In attesa', in_progress: 'In corso', achieved: 'Raggiunto', not_achieved: 'Non raggiunto',
}

// ─── Sezione Profilo esteso ────────────────────────────────────────────────────
function ProfiloSection({ minorId, initial }: { minorId: number; initial?: MinorProfile | null }) {
  const [profile, setProfile] = useState<MinorProfile>(initial ?? {})
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState<MinorProfile>(initial ?? {})
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState<string | null>(null)
  const setF = (k: keyof MinorProfile, v: string | null) => setForm((p) => ({ ...p, [k]: v || null }))

  const save = async () => {
    setSaving(true); setMsg(null)
    try {
      const res = await minorApi.upsertProfile(minorId, form)
      setProfile(res); setEditing(false)
      toast.success('Profilo aggiornato.')
    } catch (e) {
      const ae = apiError(e)
      setMsg(ae.message ?? 'Errore salvataggio.')
    } finally { setSaving(false) }
  }

  const blocks: { label: string; keys: (keyof MinorProfile)[] }[] = [
    { label: 'Contesto familiare', keys: ['family_background'] },
    { label: 'Storia di vita', keys: ['life_history'] },
    { label: 'Apprendimento e interessi', keys: ['learning_styles', 'interests', 'hobbies', 'strengths'] },
    { label: 'Fattori di rischio e crisi', keys: ['risk_factors', 'crisis_indicators'] },
    { label: 'Note cliniche', keys: ['clinical_notes_encrypted'] },
  ]
  const fieldLabel: Record<string, string> = {
    family_background: 'Contesto familiare', life_history: 'Storia di vita',
    learning_styles: 'Stili di apprendimento', interests: 'Interessi', hobbies: 'Hobby',
    strengths: 'Punti di forza', risk_factors: 'Fattori di rischio',
    crisis_indicators: 'Indicatori di crisi', clinical_notes_encrypted: 'Note cliniche (cifrate)',
  }

  return (
    <div>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h6 className='fw-bold mb-0' style={{ color: '#7366ff' }}>Profilo psico-educativo</h6>
        {!editing && (
          <Button size='sm' color='primary' className='d-flex align-items-center gap-1' onClick={() => { setForm({ ...profile }); setEditing(true) }}>
            <Edit2 size={13} /> Modifica profilo
          </Button>
        )}
      </div>
      {editing ? (
        <>
          {msg && <Alert color='warning'>{msg}</Alert>}
          {blocks.map((block) => (
            <div key={block.label} className='mb-3'>
              <h6 className='fw-bold text-muted border-bottom pb-1 mb-2' style={{ fontSize: 13 }}>{block.label}</h6>
              {block.keys.map((k) => (
                <FormGroup key={k}>
                  <Label className='small'>{fieldLabel[k]}</Label>
                  <Input type='textarea' rows={2} value={(form[k] as string) ?? ''}
                    onChange={(e) => setF(k, e.target.value)} />
                </FormGroup>
              ))}
            </div>
          ))}
          <div className='d-flex gap-2'>
            <Button size='sm' color='primary' className='d-flex align-items-center gap-1' onClick={save} disabled={saving}>
              <Save size={13} /> {saving ? 'Salvataggio…' : 'Salva'}
            </Button>
            <Button size='sm' color='secondary' className='d-flex align-items-center gap-1' onClick={() => setEditing(false)}>
              <X size={13} /> Annulla
            </Button>
          </div>
        </>
      ) : (
        blocks.map((block) => {
          const hasContent = block.keys.some((k) => profile[k])
          if (!hasContent) return null
          return (
            <div key={block.label} className='p-3 rounded mb-2' style={{ background: '#f4f5f7' }}>
              <strong style={{ color: '#333', fontSize: 13 }}>{block.label}</strong>
              {block.keys.map((k) => profile[k] ? (
                <p key={k} className='mb-1 mt-1 small' style={{ color: '#444', whiteSpace: 'pre-wrap' }}>
                  <span className='text-muted'>{fieldLabel[k]}:</span> {profile[k] as string}
                </p>
              ) : null)}
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Sezione Diagnosi ─────────────────────────────────────────────────────────
const EMPTY_DIAG: MinorDiagnosisWrite = {
  diagnosis_code: '', diagnosis_label: '', dsm_code: '', diagnosis_notes_encrypted: '',
  diagnosed_at: '', review_due_at: '', is_primary: false, is_active: true,
}

function DiagnosiSection({ minorId, initial }: { minorId: number; initial?: MinorDiagnosis[] }) {
  const [items, setItems] = useState<MinorDiagnosis[]>(initial ?? [])
  const [editTarget, setEditTarget] = useState<MinorDiagnosis | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<MinorDiagnosisWrite>({ ...EMPTY_DIAG })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const reload = () => minorApi.listDiagnoses(minorId).then(setItems).catch(() => {})
  const setF = (k: keyof MinorDiagnosisWrite, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  // Fetch sempre dati freschi al mount — i dati "initial" potrebbero essere stale
  useEffect(() => { reload() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setForm({ ...EMPTY_DIAG }); setMsg(null); setCreateOpen(true) }
  const openEdit = (item: MinorDiagnosis) => {
    setForm({
      diagnosis_code: item.diagnosis_code ?? '', diagnosis_label: item.diagnosis_label ?? '',
      dsm_code: item.dsm_code ?? '', diagnosis_notes_encrypted: item.diagnosis_notes_encrypted ?? '',
      diagnosed_at: item.diagnosed_at?.slice(0, 10) ?? '', review_due_at: item.review_due_at?.slice(0, 10) ?? '',
      is_primary: item.is_primary ?? false, is_active: item.is_active ?? true,
    })
    setMsg(null); setEditTarget(item)
  }
  const handleSave = async () => {
    setSaving(true); setMsg(null)
    try {
      if (editTarget) {
        const res = await minorApi.updateDiagnosis(minorId, editTarget.id, form)
        setItems((p) => p.map((i) => i.id === editTarget.id ? res : i))
        setEditTarget(null); toast.success('Diagnosi aggiornata.')
      } else {
        const res = await minorApi.createDiagnosis(minorId, form)
        setItems((p) => [...p, res]); setCreateOpen(false); toast.success('Diagnosi aggiunta.')
      }
    } catch (e) { setMsg(apiError(e).message ?? 'Errore.') }
    finally { setSaving(false) }
  }
  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questa diagnosi?')) return
    await minorApi.deleteDiagnosis(minorId, id).catch(() => {})
    reload(); toast.success('Diagnosi eliminata.')
  }

  const DiagForm = () => (
    <>
      {msg && <Alert color='warning'>{msg}</Alert>}
      <Row>
        <Col md='3'><FormGroup><Label className='small'>Codice diagnosi</Label>
          <Input bsSize='sm' value={form.diagnosis_code ?? ''} onChange={(e) => setF('diagnosis_code', e.target.value || null)} /></FormGroup></Col>
        <Col md='6'><FormGroup><Label className='small'>Etichetta diagnosi</Label>
          <Input bsSize='sm' value={form.diagnosis_label ?? ''} onChange={(e) => setF('diagnosis_label', e.target.value || null)} /></FormGroup></Col>
        <Col md='3'><FormGroup><Label className='small'>Codice DSM</Label>
          <Input bsSize='sm' value={form.dsm_code ?? ''} onChange={(e) => setF('dsm_code', e.target.value || null)} /></FormGroup></Col>
      </Row>
      <FormGroup><Label className='small'>Note cliniche</Label>
        <Input type='textarea' rows={2} value={form.diagnosis_notes_encrypted ?? ''} onChange={(e) => setF('diagnosis_notes_encrypted', e.target.value || null)} /></FormGroup>
      <Row>
        <Col md='3'><FormGroup><Label className='small'>Data diagnosi</Label>
          <Input type='date' bsSize='sm' value={form.diagnosed_at ?? ''} onChange={(e) => setF('diagnosed_at', e.target.value || null)} /></FormGroup></Col>
        <Col md='3'><FormGroup><Label className='small'>Revisione prevista</Label>
          <Input type='date' bsSize='sm' value={form.review_due_at ?? ''} onChange={(e) => setF('review_due_at', e.target.value || null)} /></FormGroup></Col>
        <Col md='3' className='d-flex align-items-center gap-3 pt-3'>
          <FormGroup check className='mb-0'>
            <Input type='checkbox' id='diag-primary' checked={form.is_primary ?? false} onChange={(e) => setF('is_primary', e.target.checked)} />
            <Label check htmlFor='diag-primary' className='small ms-1'>Primaria</Label>
          </FormGroup>
          <FormGroup check className='mb-0'>
            <Input type='checkbox' id='diag-active' checked={form.is_active ?? true} onChange={(e) => setF('is_active', e.target.checked)} />
            <Label check htmlFor='diag-active' className='small ms-1'>Attiva</Label>
          </FormGroup>
        </Col>
      </Row>
    </>
  )

  return (
    <div>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h6 className='fw-bold mb-0' style={{ color: '#7366ff' }}>Diagnosi / DSM</h6>
        <Button size='sm' color='primary' className='d-flex align-items-center gap-1' onClick={openCreate}>
          <Plus size={13} /> Aggiungi diagnosi
        </Button>
      </div>
      {items.length === 0
        ? <p className='text-muted small'>Nessuna diagnosi registrata.</p>
        : (
          <div className='table-responsive'>
            <table className='table table-hover table-sm'>
              <thead className='table-light'>
                <tr><th>Codice</th><th>Etichetta</th><th>DSM</th><th>Data</th><th>Revisione</th><th>Flags</th><th></th></tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className='small'>{item.diagnosis_code ?? '—'}</td>
                    <td className='small'>{item.diagnosis_label ?? '—'}</td>
                    <td className='small'>{item.dsm_code ?? '—'}</td>
                    <td className='small'>{fmtDate(item.diagnosed_at)}</td>
                    <td className='small'>{fmtDate(item.review_due_at)}</td>
                    <td>
                      {item.is_primary && <span className='badge badge-light-primary me-1'>Primaria</span>}
                      {item.is_active ? <span className='badge badge-light-success'>Attiva</span> : <span className='badge badge-light-secondary'>Inattiva</span>}
                    </td>
                    <td>
                      <div className='d-flex gap-1'>
                        <Button size='sm' color='outline-primary' onClick={() => openEdit(item)}><Edit2 size={12} /></Button>
                        <Button size='sm' color='outline-danger' onClick={() => handleDelete(item.id)}><Trash2 size={12} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      <Modal isOpen={createOpen} toggle={() => setCreateOpen(false)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setCreateOpen(false)}>Aggiungi diagnosi</ModalHeader>
        <ModalBody>{DiagForm()}</ModalBody>
        <ModalFooter>
          <Button size='sm' color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button size='sm' color='secondary' onClick={() => setCreateOpen(false)}><X size={13} /> Annulla</Button>
        </ModalFooter>
      </Modal>
      <Modal isOpen={!!editTarget} toggle={() => setEditTarget(null)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setEditTarget(null)}>Modifica diagnosi</ModalHeader>
        <ModalBody>{DiagForm()}</ModalBody>
        <ModalFooter>
          <Button size='sm' color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button size='sm' color='secondary' onClick={() => setEditTarget(null)}><X size={13} /> Annulla</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// ─── Sezione PEI ──────────────────────────────────────────────────────────────
const EMPTY_PEI: MinorPeiWrite = { title: '', summary: '', start_date: '', review_date: '', end_date: '', status: 'draft' }
const EMPTY_OBJ: PeiObjectiveWrite = { title: '', description: '', due_date: '', status: 'pending', progress_percent: 0, responsible_staff_member_id: null }

const PEI_EVENT_LABEL: Record<string, string> = {
  minor_pei_created:            'PEI creato',
  minor_pei_updated:            'PEI aggiornato',
  minor_pei_objective_created:  'Obiettivo PEI aggiunto',
  minor_pei_objective_updated:  'Obiettivo PEI aggiornato',
  minor_pei_objective_deleted:  'Obiettivo PEI eliminato',
}

function PeiSection({ minorId, initial, staffMembers }: { minorId: number; initial?: MinorPei[]; staffMembers: StaffMember[] }) {
  const [peis, setPeis]             = useState<MinorPei[]>(initial ?? [])
  const [selectedPei, setSelectedPei] = useState<MinorPei | null>(null)
  const [peiForm, setPeiForm]       = useState<MinorPeiWrite>({ ...EMPTY_PEI })
  const [peiEdit, setPeiEdit]       = useState<MinorPei | null>(null)
  const [peiCreate, setPeiCreate]   = useState(false)
  const [objForm, setObjForm]       = useState<PeiObjectiveWrite>({ ...EMPTY_OBJ })
  const [objEdit, setObjEdit]       = useState<PeiObjective | null>(null)
  const [objCreate, setObjCreate]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [msg, setMsg]               = useState<string | null>(null)
  // Storico PEI
  const [historyOpen, setHistoryOpen] = useState<number | null>(null) // pei.id
  const [peiHistory, setPeiHistory]   = useState<MinorPeiHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  // Storico avanzamento obiettivo
  const [progressPei, setProgressPei]   = useState<number | null>(null)
  const [progressObj, setProgressObj]   = useState<PeiObjective | null>(null)
  const [progressData, setProgressData] = useState<MinorPeiObjectiveProgressEntry[]>([])
  const [progressLoading, setProgressLoading] = useState(false)

  const openHistory = (pei: MinorPei) => {
    setHistoryOpen(pei.id)
    setHistoryLoading(true)
    setPeiHistory([])
    minorApi.getPeiHistory(minorId, pei.id)
      .then(setPeiHistory)
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }

  const openProgress = (pei: MinorPei, obj: PeiObjective) => {
    setProgressPei(pei.id)
    setProgressObj(obj)
    setProgressLoading(true)
    setProgressData([])
    minorApi.getObjectiveProgress(minorId, pei.id, obj.id)
      .then(setProgressData)
      .catch(() => {})
      .finally(() => setProgressLoading(false))
  }

  const reloadPeis = () => minorApi.listPeis(minorId).then(setPeis).catch(() => {})
  const setF  = (k: keyof MinorPeiWrite, v: unknown) => setPeiForm((p) => ({ ...p, [k]: v }))

  // Fetch sempre dati freschi al mount
  useEffect(() => { reloadPeis() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const setFO = (k: keyof PeiObjectiveWrite, v: unknown) => setObjForm((p) => ({ ...p, [k]: v }))

  const savePei = async () => {
    setSaving(true); setMsg(null)
    try {
      if (peiEdit) {
        const res = await minorApi.updatePei(minorId, peiEdit.id, peiForm)
        setPeis((p) => p.map((i) => i.id === peiEdit.id ? res : i))
        if (selectedPei?.id === peiEdit.id) setSelectedPei(res)
        setPeiEdit(null); toast.success('PEI aggiornato.')
      } else {
        const res = await minorApi.createPei(minorId, peiForm)
        setPeis((p) => [...p, res]); setPeiCreate(false); toast.success('PEI creato.')
      }
    } catch (e) { setMsg(apiError(e).message ?? 'Errore.') }
    finally { setSaving(false) }
  }

  const saveObj = async () => {
    if (!selectedPei) return
    setSaving(true); setMsg(null)
    const peiId = selectedPei.id
    try {
      if (objEdit) {
        const editedId = objEdit.id
        const res = await minorApi.updatePeiObjective(minorId, peiId, editedId, objForm)
        const updateObjs = (objs?: PeiObjective[]) => objs?.map((o) => o.id === editedId ? res : o)
        setSelectedPei((p) => p ? { ...p, objectives: updateObjs(p.objectives) } : p)
        setPeis((list) => list.map((p) => p.id === peiId ? { ...p, objectives: updateObjs(p.objectives) } : p))
        setObjEdit(null); toast.success('Obiettivo aggiornato.')
      } else {
        const res = await minorApi.createPeiObjective(minorId, peiId, objForm)
        const addObj = (objs?: PeiObjective[]) => [...(objs ?? []), res]
        setSelectedPei((p) => p ? { ...p, objectives: addObj(p.objectives) } : p)
        setPeis((list) => list.map((p) => p.id === peiId ? { ...p, objectives: addObj(p.objectives) } : p))
        setObjCreate(false); toast.success('Obiettivo aggiunto.')
      }
    } catch (e) { setMsg(apiError(e).message ?? 'Errore.') }
    finally { setSaving(false) }
  }

  const deleteObj = async (objId: number) => {
    if (!selectedPei || !confirm('Eliminare questo obiettivo?')) return
    const peiId = selectedPei.id
    await minorApi.deletePeiObjective(minorId, peiId, objId).catch(() => {})
    const removeObj = (objs?: PeiObjective[]) => objs?.filter((o) => o.id !== objId)
    setSelectedPei((p) => p ? { ...p, objectives: removeObj(p.objectives) } : p)
    setPeis((list) => list.map((p) => p.id === peiId ? { ...p, objectives: removeObj(p.objectives) } : p))
    toast.success('Obiettivo eliminato.')
  }

  const PeiForm = () => (
    <>
      {msg && <Alert color='warning'>{msg}</Alert>}
      <FormGroup><Label>Titolo <span className='text-danger'>*</span></Label>
        <Input value={peiForm.title} onChange={(e) => setF('title', e.target.value)} /></FormGroup>
      <FormGroup><Label>Sintesi</Label>
        <Input type='textarea' rows={2} value={peiForm.summary ?? ''} onChange={(e) => setF('summary', e.target.value || null)} /></FormGroup>
      <Row>
        <Col md='4'><FormGroup><Label className='small'>Data inizio</Label>
          <Input type='date' bsSize='sm' value={peiForm.start_date ?? ''} onChange={(e) => setF('start_date', e.target.value || null)} /></FormGroup></Col>
        <Col md='4'><FormGroup><Label className='small'>Data revisione</Label>
          <Input type='date' bsSize='sm' value={peiForm.review_date ?? ''} onChange={(e) => setF('review_date', e.target.value || null)} /></FormGroup></Col>
        <Col md='4'><FormGroup><Label className='small'>Data fine</Label>
          <Input type='date' bsSize='sm' value={peiForm.end_date ?? ''} onChange={(e) => setF('end_date', e.target.value || null)} /></FormGroup></Col>
      </Row>
      <FormGroup><Label className='small'>Stato</Label>
        <Input type='select' bsSize='sm' value={peiForm.status ?? ''} onChange={(e) => setF('status', e.target.value || null)}>
          {Object.entries(PEI_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Input>
      </FormGroup>
    </>
  )

  const ObjForm = () => (
    <>
      {msg && <Alert color='warning'>{msg}</Alert>}
      <Row>
        <Col md='3'><FormGroup><Label className='small'>Codice</Label>
          <Input bsSize='sm' value={objForm.code ?? ''} onChange={(e) => setFO('code', e.target.value || null)} /></FormGroup></Col>
        <Col md='9'><FormGroup><Label className='small'>Titolo <span className='text-danger'>*</span></Label>
          <Input bsSize='sm' value={objForm.title} onChange={(e) => setFO('title', e.target.value)} /></FormGroup></Col>
      </Row>
      <FormGroup><Label className='small'>Descrizione</Label>
        <Input type='textarea' rows={2} value={objForm.description ?? ''} onChange={(e) => setFO('description', e.target.value || null)} /></FormGroup>
      <Row>
        <Col md='3'><FormGroup><Label className='small'>Scadenza</Label>
          <Input type='date' bsSize='sm' value={objForm.due_date ?? ''} onChange={(e) => setFO('due_date', e.target.value || null)} /></FormGroup></Col>
        <Col md='3'><FormGroup><Label className='small'>Stato</Label>
          <Input type='select' bsSize='sm' value={objForm.status ?? ''} onChange={(e) => setFO('status', e.target.value || null)}>
            {Object.entries(OBJ_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Input></FormGroup></Col>
        <Col md='3'><FormGroup><Label className='small'>Avanzamento %</Label>
          <Input type='number' bsSize='sm' min={0} max={100} value={objForm.progress_percent ?? 0}
            onChange={(e) => setFO('progress_percent', Number(e.target.value))} /></FormGroup></Col>
        <Col md='3'><FormGroup><Label className='small'>Responsabile</Label>
          <Input type='select' bsSize='sm' value={objForm.responsible_staff_member_id ?? ''}
            onChange={(e) => setFO('responsible_staff_member_id', Number(e.target.value) || null)}>
            <option value=''>— Nessuno —</option>
            {staffMembers.map((s) => <option key={s.id} value={s.id}>{s.display_name ?? `${s.last_name} ${s.first_name}`}</option>)}
          </Input></FormGroup></Col>
      </Row>
    </>
  )

  return (
    <div>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h6 className='fw-bold mb-0' style={{ color: '#7366ff' }}>PEI — Piano Educativo Individualizzato</h6>
        <Button size='sm' color='primary' className='d-flex align-items-center gap-1'
          onClick={() => { setPeiForm({ ...EMPTY_PEI }); setMsg(null); setPeiCreate(true) }}>
          <Plus size={13} /> Nuovo PEI
        </Button>
      </div>

      {peis.length === 0
        ? <p className='text-muted small'>Nessun PEI registrato.</p>
        : peis.map((pei) => {
          const isOpen = selectedPei?.id === pei.id
          return (
            <div key={pei.id} className='border rounded mb-2'>
              <div className='d-flex align-items-center justify-content-between p-3'
                style={{ cursor: 'pointer', background: isOpen ? '#f4f3ff' : '#fff' }}
                onClick={() => setSelectedPei(isOpen ? null : pei)}>
                <div className='d-flex align-items-center gap-2'>
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <strong style={{ fontSize: 14 }}>{pei.title}</strong>
                  {pei.status && <span className='badge badge-light-primary ms-1'>{PEI_STATUS_LABEL[pei.status] ?? pei.status}</span>}
                </div>
                <div className='d-flex gap-1' onClick={(e) => e.stopPropagation()}>
                  <Button size='sm' color='outline-primary'
                    onClick={() => {
                      setPeiForm({ title: pei.title, summary: pei.summary ?? '', start_date: pei.start_date?.slice(0,10) ?? '', review_date: pei.review_date?.slice(0,10) ?? '', end_date: pei.end_date?.slice(0,10) ?? '', status: pei.status ?? 'draft' })
                      setMsg(null); setPeiEdit(pei)
                    }}><Edit2 size={12} /></Button>
                </div>
              </div>

              {isOpen && (
                <div className='p-3 border-top'>
                  {pei.summary && <p className='small text-muted mb-2'>{pei.summary}</p>}
                  <Row className='mb-3'>
                    <Col md='3'><small className='text-muted d-block'>Inizio</small><span className='small'>{fmtDate(pei.start_date)}</span></Col>
                    <Col md='3'><small className='text-muted d-block'>Revisione</small><span className='small'>{fmtDate(pei.review_date)}</span></Col>
                    <Col md='3'><small className='text-muted d-block'>Fine</small><span className='small'>{fmtDate(pei.end_date)}</span></Col>
                  </Row>

                  <div className='d-flex justify-content-between align-items-center mb-2'>
                    <strong className='small'>Obiettivi ({selectedPei?.objectives?.length ?? 0})</strong>
                    <div className='d-flex gap-1'>
                      <Button size='sm' color='outline-secondary' className='d-flex align-items-center gap-1'
                        onClick={() => openHistory(pei)}>
                        <Info size={12} /> Storico PEI
                      </Button>
                      <Button size='sm' color='outline-primary' className='d-flex align-items-center gap-1'
                        onClick={() => { setObjForm({ ...EMPTY_OBJ }); setMsg(null); setObjCreate(true) }}>
                        <Plus size={12} /> Obiettivo
                      </Button>
                    </div>
                  </div>

                  {(!selectedPei?.objectives || selectedPei.objectives.length === 0)
                    ? <p className='small text-muted'>Nessun obiettivo.</p>
                    : (
                      <table className='table table-sm table-hover'>
                        <thead className='table-light'><tr><th>Titolo</th><th>Responsabile</th><th>Scadenza</th><th>Stato</th><th>%</th><th></th></tr></thead>
                        <tbody>
                          {selectedPei.objectives?.map((obj) => (
                            <tr key={obj.id}>
                              <td className='small'>{obj.title}</td>
                              <td className='small'>{obj.responsible_staff_member ? (obj.responsible_staff_member.display_name ?? `${obj.responsible_staff_member.last_name} ${obj.responsible_staff_member.first_name}`) : '—'}</td>
                              <td className='small'>{fmtDate(obj.due_date)}</td>
                              <td><span className='badge badge-light-secondary'>{OBJ_STATUS_LABEL[obj.status ?? ''] ?? obj.status ?? '—'}</span></td>
                              <td className='small'>{obj.progress_percent ?? 0}%</td>
                              <td>
                                <div className='d-flex gap-1'>
                                  <Button size='sm' color='outline-info' title='Storico avanzamento'
                                    onClick={() => openProgress(pei, obj)}><Info size={12} /></Button>
                                  <Button size='sm' color='outline-primary' onClick={() => {
                                    setObjForm({ code: obj.code ?? '', title: obj.title, description: obj.description ?? '', due_date: obj.due_date?.slice(0,10) ?? '', status: obj.status ?? 'pending', progress_percent: obj.progress_percent ?? 0, responsible_staff_member_id: obj.responsible_staff_member_id ?? null })
                                    setMsg(null); setObjEdit(obj)
                                  }}><Edit2 size={12} /></Button>
                                  <Button size='sm' color='outline-danger' onClick={() => deleteObj(obj.id)}><Trash2 size={12} /></Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  }
                </div>
              )}
            </div>
          )
        })
      }

      <Modal isOpen={peiCreate} toggle={() => setPeiCreate(false)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setPeiCreate(false)}>Nuovo PEI</ModalHeader>
        <ModalBody>{PeiForm()}</ModalBody>
        <ModalFooter>
          <Button size='sm' color='primary' onClick={savePei} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button size='sm' color='secondary' onClick={() => setPeiCreate(false)}><X size={13} /> Annulla</Button>
        </ModalFooter>
      </Modal>
      <Modal isOpen={!!peiEdit} toggle={() => setPeiEdit(null)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setPeiEdit(null)}>Modifica PEI</ModalHeader>
        <ModalBody>{PeiForm()}</ModalBody>
        <ModalFooter>
          <Button size='sm' color='primary' onClick={savePei} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button size='sm' color='secondary' onClick={() => setPeiEdit(null)}><X size={13} /> Annulla</Button>
        </ModalFooter>
      </Modal>
      <Modal isOpen={objCreate} toggle={() => setObjCreate(false)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setObjCreate(false)}>Nuovo obiettivo</ModalHeader>
        <ModalBody>{ObjForm()}</ModalBody>
        <ModalFooter>
          <Button size='sm' color='primary' onClick={saveObj} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button size='sm' color='secondary' onClick={() => setObjCreate(false)}><X size={13} /> Annulla</Button>
        </ModalFooter>
      </Modal>
      <Modal isOpen={!!objEdit} toggle={() => setObjEdit(null)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setObjEdit(null)}>Modifica obiettivo</ModalHeader>
        <ModalBody>{ObjForm()}</ModalBody>
        <ModalFooter>
          <Button size='sm' color='primary' onClick={saveObj} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button size='sm' color='secondary' onClick={() => setObjEdit(null)}><X size={13} /> Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal storico PEI */}
      <Modal isOpen={historyOpen !== null} toggle={() => setHistoryOpen(null)} size='xl' centered scrollable>
        <ModalHeader toggle={() => setHistoryOpen(null)}>Storico PEI</ModalHeader>
        <ModalBody>
          {historyLoading && <div className='text-center py-3'><span className='spinner-border spinner-border-sm' /></div>}
          {!historyLoading && peiHistory.length === 0 && (
            <p className='text-muted'>Nessun evento storico disponibile.</p>
          )}
          {!historyLoading && peiHistory.length > 0 && (
            <div className='table-responsive'>
              <table className='table table-sm table-hover'>
                <thead className='table-light'>
                  <tr>
                    <th>Data/Ora</th>
                    <th>Versione</th>
                    <th>Evento</th>
                    <th>Utente</th>
                  </tr>
                </thead>
                <tbody>
                  {peiHistory.map((entry) => (
                    <tr key={entry.id}>
                      <td className='small text-nowrap'>{new Date(entry.created_at).toLocaleString('it-IT')}</td>
                      <td className='small'>{entry.version_number != null ? `Versione ${entry.version_number}` : '—'}</td>
                      <td><span className='badge badge-light-primary'>{PEI_EVENT_LABEL[entry.event_type] ?? entry.event_type}</span></td>
                      <td className='small'>{entry.actor?.display_name ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button size='sm' color='secondary' onClick={() => setHistoryOpen(null)}>Chiudi</Button>
        </ModalFooter>
      </Modal>

      {/* Modal storico avanzamento obiettivo */}
      <Modal isOpen={progressObj !== null} toggle={() => { setProgressObj(null); setProgressPei(null) }} size='lg' centered scrollable>
        <ModalHeader toggle={() => { setProgressObj(null); setProgressPei(null) }}>
          Storico avanzamento — {progressObj?.title ?? ''}
        </ModalHeader>
        <ModalBody>
          {progressLoading && <div className='text-center py-3'><span className='spinner-border spinner-border-sm' /></div>}
          {!progressLoading && progressData.length === 0 && (
            <p className='text-muted'>Nessun avanzamento registrato per questo obiettivo.</p>
          )}
          {!progressLoading && progressData.length > 0 && (
            <div className='table-responsive'>
              <table className='table table-sm table-hover'>
                <thead className='table-light'>
                  <tr>
                    <th>Data/Ora</th>
                    <th>Avanz. %</th>
                    <th>Stato</th>
                    <th>Sorgente</th>
                    <th>Utente</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {progressData.map((entry) => (
                    <tr key={entry.id}>
                      <td className='small text-nowrap'>{new Date(entry.created_at).toLocaleString('it-IT')}</td>
                      <td className='small fw-bold' style={{ color: '#7366ff' }}>{entry.progress_percent}%</td>
                      <td><span className='badge badge-light-secondary'>{entry.status ?? '—'}</span></td>
                      <td className='small'>
                        {entry.source_type === 'minor_activity' && <span className='badge badge-light-info'>Attività</span>}
                        {entry.source_type === 'minor_journal_entry' && <span className='badge badge-light-warning'>Diario educativo</span>}
                        {!entry.source_type && <span className='text-muted'>Manuale</span>}
                        {entry.source_label && <span className='ms-1 text-muted small'>{entry.source_label}</span>}
                      </td>
                      <td className='small'>{entry.actor?.display_name ?? '—'}</td>
                      <td className='small text-muted'>{entry.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button size='sm' color='secondary' onClick={() => { setProgressObj(null); setProgressPei(null) }}>Chiudi</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// ─── Sezione Bisogni ──────────────────────────────────────────────────────────
const EMPTY_NEED: MinorNeedWrite = { category_code: 'physical', title: '', description: '', priority: 'medium', status: 'open', responsible_staff_member_id: null, attachment_minor_document_id: null }

function BisogniSection({ minorId, initial, staffMembers, minorDocs }: {
  minorId: number; initial?: MinorNeed[]; staffMembers: StaffMember[]; minorDocs: MinorDocument[]
}) {
  const [items, setItems]   = useState<MinorNeed[]>(initial ?? [])
  const [editTarget, setEditTarget] = useState<MinorNeed | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm]     = useState<MinorNeedWrite>({ ...EMPTY_NEED })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState<string | null>(null)

  const reload = () => minorApi.listNeeds(minorId).then(setItems).catch(() => {})
  const setF = (k: keyof MinorNeedWrite, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const openCreate = () => { setForm({ ...EMPTY_NEED }); setMsg(null); setCreateOpen(true) }
  const openEdit = (item: MinorNeed) => {
    setForm({ category_code: item.category_code, title: item.title, description: item.description ?? '', priority: item.priority, status: item.status, responsible_staff_member_id: item.responsible_staff_member_id ?? null, attachment_minor_document_id: item.attachment_minor_document_id ?? null })
    setMsg(null); setEditTarget(item)
  }
  const handleSave = async () => {
    if (!form.title.trim()) { setMsg('Inserisci il titolo.'); return }
    setSaving(true); setMsg(null)
    try {
      if (editTarget) {
        const res = await minorApi.updateNeed(minorId, editTarget.id, form)
        setItems((p) => p.map((i) => i.id === editTarget.id ? res : i))
        setEditTarget(null); toast.success('Bisogno aggiornato.')
      } else {
        const res = await minorApi.createNeed(minorId, form)
        setItems((p) => [...p, res]); setCreateOpen(false); toast.success('Bisogno aggiunto.')
      }
    } catch (e) { setMsg(apiError(e).message ?? 'Errore.') }
    finally { setSaving(false) }
  }
  const handleDelete = async (id: number) => {
    if (!confirm('Eliminare questo bisogno?')) return
    await minorApi.deleteNeed(minorId, id).catch(() => {})
    reload(); toast.success('Bisogno eliminato.')
  }

  const NeedForm = () => (
    <>
      {msg && <Alert color='warning'>{msg}</Alert>}
      <Row>
        <Col md='4'><FormGroup><Label className='small'>Categoria</Label>
          <Input type='select' bsSize='sm' value={form.category_code} onChange={(e) => setF('category_code', e.target.value)}>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Input></FormGroup></Col>
        <Col md='8'><FormGroup><Label className='small'>Titolo <span className='text-danger'>*</span></Label>
          <Input bsSize='sm' value={form.title} onChange={(e) => setF('title', e.target.value)} /></FormGroup></Col>
      </Row>
      <FormGroup><Label className='small'>Descrizione</Label>
        <Input type='textarea' rows={2} value={form.description ?? ''} onChange={(e) => setF('description', e.target.value || null)} /></FormGroup>
      <Row>
        <Col md='3'><FormGroup><Label className='small'>Priorità</Label>
          <Input type='select' bsSize='sm' value={form.priority} onChange={(e) => setF('priority', e.target.value)}>
            {Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Input></FormGroup></Col>
        <Col md='3'><FormGroup><Label className='small'>Stato</Label>
          <Input type='select' bsSize='sm' value={form.status} onChange={(e) => setF('status', e.target.value)}>
            {Object.entries(NEED_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Input></FormGroup></Col>
        <Col md='3'><FormGroup><Label className='small'>Responsabile</Label>
          <Input type='select' bsSize='sm' value={form.responsible_staff_member_id ?? ''}
            onChange={(e) => setF('responsible_staff_member_id', Number(e.target.value) || null)}>
            <option value=''>— Nessuno —</option>
            {staffMembers.map((s) => <option key={s.id} value={s.id}>{s.display_name ?? `${s.last_name} ${s.first_name}`}</option>)}
          </Input></FormGroup></Col>
        <Col md='3'><FormGroup><Label className='small'>Documento allegato</Label>
          <Input type='select' bsSize='sm' value={form.attachment_minor_document_id ?? ''}
            onChange={(e) => setF('attachment_minor_document_id', Number(e.target.value) || null)}>
            <option value=''>— Nessuno —</option>
            {minorDocs.map((doc) => <option key={doc.id} value={doc.id}>{docLabel(doc)}</option>)}
          </Input></FormGroup></Col>
      </Row>
    </>
  )

  return (
    <div>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h6 className='fw-bold mb-0' style={{ color: '#7366ff' }}>Bisogni categorizzati</h6>
        <Button size='sm' color='primary' className='d-flex align-items-center gap-1' onClick={openCreate}>
          <Plus size={13} /> Aggiungi bisogno
        </Button>
      </div>
      {items.length === 0
        ? <p className='text-muted small'>Nessun bisogno registrato.</p>
        : (
          <div className='table-responsive'>
            <table className='table table-hover table-sm'>
              <thead className='table-light'>
                <tr><th>Categoria</th><th>Titolo</th><th>Priorità</th><th>Stato</th><th>Responsabile</th><th></th></tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className='small'>{CATEGORY_LABEL[item.category_code] ?? item.category_code}</td>
                    <td className='small'>{item.title}</td>
                    <td><span className={`badge ${PRIORITY_BADGE[item.priority] ?? 'badge-light-secondary'}`}>{PRIORITY_LABEL[item.priority] ?? item.priority}</span></td>
                    <td><span className={`badge ${NEED_STATUS_BADGE[item.status] ?? 'badge-light-secondary'}`}>{NEED_STATUS_LABEL[item.status] ?? item.status}</span></td>
                    <td className='small'>{item.responsible_staff_member ? (item.responsible_staff_member.display_name ?? `${item.responsible_staff_member.last_name} ${item.responsible_staff_member.first_name}`) : '—'}</td>
                    <td>
                      <div className='d-flex gap-1'>
                        <Button size='sm' color='outline-primary' onClick={() => openEdit(item)}><Edit2 size={12} /></Button>
                        <Button size='sm' color='outline-danger' onClick={() => handleDelete(item.id)}><Trash2 size={12} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      <Modal isOpen={createOpen} toggle={() => setCreateOpen(false)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setCreateOpen(false)}>Aggiungi bisogno</ModalHeader>
        <ModalBody>{NeedForm()}</ModalBody>
        <ModalFooter>
          <Button size='sm' color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button size='sm' color='secondary' onClick={() => setCreateOpen(false)}><X size={13} /> Annulla</Button>
        </ModalFooter>
      </Modal>
      <Modal isOpen={!!editTarget} toggle={() => setEditTarget(null)} size='lg' centered scrollable>
        <ModalHeader toggle={() => setEditTarget(null)}>Modifica bisogno</ModalHeader>
        <ModalBody>{NeedForm()}</ModalBody>
        <ModalFooter>
          <Button size='sm' color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button size='sm' color='secondary' onClick={() => setEditTarget(null)}><X size={13} /> Annulla</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// ─── Componente principale ────────────────────────────────────────────────────
export default function ProfiloEstesoMinoreTab({
  minorId, facilityId, initialProfile, initialDiagnoses, initialPeis, initialNeeds,
}: {
  minorId: number
  facilityId: number
  initialProfile?: MinorProfile | null
  initialDiagnoses?: MinorDiagnosis[]
  initialPeis?: MinorPei[]
  initialNeeds?: MinorNeed[]
}) {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [minorDocs, setMinorDocs]       = useState<MinorDocument[]>([])
  const [infoOpen, setInfoOpen]         = useState(false)
  const [activeSection, setActiveSection] = useState<'profilo' | 'diagnosi' | 'pei' | 'bisogni'>('profilo')

  useEffect(() => {
    if (facilityId) staffMemberApi.list({ facility_id: facilityId }).then(setStaffMembers).catch(() => {})
    minorApi.listDocuments(minorId).then(setMinorDocs).catch(() => {})
  }, [minorId, facilityId]) // eslint-disable-line

  const sections = [
    { key: 'profilo', label: 'Profilo psico-educativo' },
    { key: 'diagnosi', label: 'Diagnosi / DSM' },
    { key: 'pei', label: 'PEI' },
    { key: 'bisogni', label: 'Bisogni' },
  ] as const

  return (
    <div>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <div className='d-flex gap-2'>
          {sections.map((s) => (
            <button key={s.key} type='button'
              onClick={() => setActiveSection(s.key)}
              style={{
                background: activeSection === s.key ? '#7366ff' : '#f4f3ff',
                color: activeSection === s.key ? '#fff' : '#7366ff',
                border: `1.5px solid ${activeSection === s.key ? '#7366ff' : '#c9c4ff'}`,
                borderRadius: 8, padding: '5px 14px', fontSize: 12,
                fontWeight: activeSection === s.key ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.18s ease',
                boxShadow: activeSection === s.key ? '0 4px 12px rgba(115,102,255,0.3)' : 'none',
              }}>
              {s.label}
            </button>
          ))}
        </div>
        <Button size='sm' color='outline-secondary' className='d-flex align-items-center gap-1'
          onClick={() => setInfoOpen(true)}>
          <Info size={13} /> Info
        </Button>
      </div>

      {activeSection === 'profilo' && (
        <ProfiloSection minorId={minorId} initial={initialProfile} />
      )}
      {activeSection === 'diagnosi' && (
        <DiagnosiSection minorId={minorId} initial={initialDiagnoses} />
      )}
      {activeSection === 'pei' && (
        <PeiSection minorId={minorId} initial={initialPeis} staffMembers={staffMembers} />
      )}
      {activeSection === 'bisogni' && (
        <BisogniSection minorId={minorId} initial={initialNeeds} staffMembers={staffMembers} minorDocs={minorDocs} />
      )}

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Profilo esteso — Guida'>
        <p><strong>Profilo psico-educativo</strong> — Raccoglie la storia del minore, il contesto familiare, gli interessi e i fattori di rischio. È la base conoscitiva per il progetto educativo.</p>
        <p><strong>Diagnosi / DSM</strong> — Registra le diagnosi cliniche con codice DSM, date e validità. La diagnosi primaria è quella principale di riferimento.</p>
        <p><strong>PEI</strong> — Il Piano Educativo Individualizzato definisce obiettivi, scadenze e responsabili. Ogni PEI può avere più obiettivi con avanzamento percentuale.</p>
        <p><strong>Bisogni categorizzati</strong> — Registra i bisogni del minore per categoria (fisico, emotivo, cognitivo, relazionale, spirituale) con priorità e stato di soddisfazione.</p>
        <p className='text-muted small'>Tutte le modifiche sono tracciate nel registro audit. I dati sensibili (note cliniche) sono cifrati a riposo.</p>
      </InfoDrawer>
    </div>
  )
}
