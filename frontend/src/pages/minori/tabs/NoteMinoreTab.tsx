import { useEffect, useState } from 'react'
import {
  Alert, Badge, Button, FormGroup, Input, Label,
  Modal, ModalBody, ModalFooter, ModalHeader,
} from 'reactstrap'
import { Edit2, Lock, Plus, Trash2 } from 'react-feather'
import { toast } from 'react-toastify'
import { minorApi, apiError } from '../../../services/api'
import { useAuth } from '../../../contexts/AuthContext'
import type { MinorNote, MinorNoteWrite } from '../../../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CLASSIFICATION_COLORS: Record<string, string> = {
  internal:   'badge-light-primary',
  restricted: 'badge-light-warning',
  clinical:   'badge-light-success',
  judicial:   'badge-light-danger',
}

function ClassificationBadge({ code, label }: { code: string; label: string }) {
  const cls = CLASSIFICATION_COLORS[code] ?? 'badge-light-secondary'
  return <span className={`badge ${cls}`} style={{ fontSize: 11 }}>{label}</span>
}

function fmtDt(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface Props { minorId: number }

const EMPTY_FORM: MinorNoteWrite = { classification_code: 'internal', title: '', body: '' }

export default function NoteMinoreTab({ minorId }: Props) {
  const { user } = useAuth()
  const docClassifications = user?.capabilities?.document_classifications ?? []

  const [notes, setNotes]       = useState<MinorNote[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  // Modale create/edit
  const [modalOpen, setModalOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<MinorNote | null>(null)
  const [form, setForm]             = useState<MinorNoteWrite>(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)

  // Modale delete
  const [deleteTarget, setDeleteTarget] = useState<MinorNote | null>(null)
  const [deleting, setDeleting]         = useState(false)

  // Dettaglio nota aperta
  const [detail, setDetail] = useState<MinorNote | null>(null)

  const load = () => {
    setLoading(true); setError(null)
    minorApi.listNotes(minorId)
      .then(setNotes)
      .catch((e) => {
        const ae = apiError(e)
        if (ae.status === 403) setError('Non hai i permessi per leggere le note di questo minore.')
        else setError(ae.message ?? 'Errore caricamento note')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [minorId]) // eslint-disable-line

  const openCreate = () => {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM, classification_code: docClassifications[0]?.code ?? 'internal' })
    setModalOpen(true)
  }

  const openEdit = (n: MinorNote) => {
    setEditTarget(n)
    setForm({ classification_code: n.classification_code, title: n.title, body: n.body })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Titolo e corpo sono obbligatori'); return
    }
    setSaving(true)
    try {
      if (editTarget) {
        const updated = await minorApi.updateNote(minorId, editTarget.id, form)
        setNotes((prev) => prev.map((n) => n.id === editTarget.id ? updated : n))
        toast.success('Nota aggiornata')
      } else {
        const created = await minorApi.createNote(minorId, form)
        setNotes((prev) => [created, ...prev])
        toast.success('Nota creata')
      }
      setModalOpen(false)
    } catch (e) { toast.error(apiError(e).message ?? 'Errore salvataggio nota') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await minorApi.deleteNote(minorId, deleteTarget.id)
      setNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id))
      if (detail?.id === deleteTarget.id) setDetail(null)
      toast.success('Nota eliminata')
      setDeleteTarget(null)
    } catch (e) { toast.error(apiError(e).message ?? 'Errore eliminazione') }
    finally { setDeleting(false) }
  }

  const setF = (k: keyof MinorNoteWrite, v: string) => setForm((f) => ({ ...f, [k]: v }))

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header sicurezza */}
      <div className='alert alert-warning d-flex align-items-start gap-2 py-2 px-3 mb-3' style={{ fontSize: 12 }}>
        <Lock size={13} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Le note sensibili vengono salvate in forma cifrata e sono visibili solo agli utenti
          autorizzati per classificazione e assegnazione al minore.
        </span>
      </div>

      {/* Toolbar */}
      <div className='d-flex align-items-center justify-content-between mb-3'>
        <h6 className='mb-0 fw-semibold'>Note classificate ({notes.length})</h6>
        <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
          <Plus size={13} /> Nuova nota
        </Button>
      </div>

      {loading && <div className='text-center py-4'><span className='spinner-border spinner-border-sm text-primary' /></div>}
      {error && <Alert color='warning'>{error}</Alert>}

      {!loading && !error && notes.length === 0 && (
        <p className='text-muted text-center py-4'>
          Nessuna nota visibile. Se ti aspetti delle note, verifica classificazione e assegnazione al minore.
        </p>
      )}

      {!loading && !error && notes.length > 0 && (
        <div>
          {notes.map((n) => (
            <div
              key={n.id}
              className='card mb-2'
              style={{ cursor: 'pointer', borderLeft: '3px solid #7366ff' }}
              onClick={() => setDetail(detail?.id === n.id ? null : n)}
            >
              <div className='card-body py-2 px-3'>
                <div className='d-flex align-items-start justify-content-between'>
                  <div>
                    <div className='d-flex align-items-center gap-2 mb-1'>
                      <ClassificationBadge code={n.classification_code} label={n.classification_label} />
                      {n.is_encrypted && (
                        <span className='d-flex align-items-center gap-1 text-muted' style={{ fontSize: 10 }}>
                          <Lock size={10} /> cifrata
                        </span>
                      )}
                    </div>
                    <div className='fw-semibold' style={{ fontSize: 13 }}>{n.title}</div>
                    <div className='text-muted' style={{ fontSize: 11 }}>
                      {fmtDt(n.created_at)}
                      {n.created_by && ` · ${n.created_by.first_name} ${n.created_by.last_name}`}
                    </div>
                  </div>
                  <div className='d-flex gap-1' onClick={(e) => e.stopPropagation()}>
                    <button className='btn btn-sm btn-light d-flex align-items-center' onClick={() => openEdit(n)}>
                      <Edit2 size={12} />
                    </button>
                    <button className='btn btn-sm btn-light d-flex align-items-center text-danger' onClick={() => setDeleteTarget(n)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                {detail?.id === n.id && (
                  <div className='mt-2 pt-2 border-top' style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>
                    {n.body}
                    {n.updated_at !== n.created_at && (
                      <div className='text-muted mt-1' style={{ fontSize: 11 }}>
                        Modificata: {fmtDt(n.updated_at)}
                        {n.updated_by && ` · ${n.updated_by.first_name} ${n.updated_by.last_name}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale crea/modifica */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size='lg'>
        <ModalHeader toggle={() => setModalOpen(false)}>
          {editTarget ? 'Modifica nota' : 'Nuova nota classificata'}
        </ModalHeader>
        <ModalBody>
          <div className='alert alert-info py-2 px-3 mb-3' style={{ fontSize: 12 }}>
            I permessi di ruolo e la classificazione determinano chi può leggere questa nota.
            Non cifrare il contenuto manualmente: il backend si occupa della cifratura a riposo.
          </div>
          <FormGroup>
            <Label>Classificazione</Label>
            <Input type='select' value={form.classification_code} onChange={(e) => setF('classification_code', e.target.value)}>
              {docClassifications.length > 0
                ? docClassifications.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))
                : (
                    <>
                      <option value='internal'>Interno</option>
                      <option value='restricted'>Riservato</option>
                      <option value='clinical'>Clinico</option>
                      <option value='judicial'>Giudiziario</option>
                    </>
                  )}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label>Titolo <span className='text-danger'>*</span></Label>
            <Input value={form.title} onChange={(e) => setF('title', e.target.value)} placeholder='Titolo della nota' />
          </FormGroup>
          <FormGroup>
            <Label>Corpo <span className='text-danger'>*</span></Label>
            <Input type='textarea' rows={6} value={form.body} onChange={(e) => setF('body', e.target.value)} placeholder='Contenuto della nota…' />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' disabled={saving} onClick={handleSave}>
            {saving ? 'Salvataggio…' : editTarget ? 'Salva modifiche' : 'Crea nota'}
          </Button>
          <Button color='light' onClick={() => setModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modale elimina */}
      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)} size='sm'>
        <ModalHeader toggle={() => setDeleteTarget(null)}>Elimina nota</ModalHeader>
        <ModalBody>
          <p>Sei sicuro di voler eliminare la nota <strong>{deleteTarget?.title}</strong>?</p>
          <p className='text-muted small'>L'operazione non è reversibile.</p>
        </ModalBody>
        <ModalFooter>
          <Button color='danger' disabled={deleting} onClick={handleDelete}>
            {deleting ? 'Eliminazione…' : 'Elimina'}
          </Button>
          <Button color='light' onClick={() => setDeleteTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
