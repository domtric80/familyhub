import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, Row, Col, Card, CardHeader, CardBody, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input, Alert, Button } from 'reactstrap'
import { Home, Plus, Edit2, Trash2 } from 'react-feather'
import { toast } from 'react-toastify'
import { adminDocScopeApi, apiError, errorMessage } from '../../services/api'
import type { DocumentScopeItem, DocumentScopeWrite } from '../../types'

const EMPTY_FORM: DocumentScopeWrite = { code: '', name: '', description: '', is_active: true }

export default function ScopeDocumentoPage() {
  const [items, setItems] = useState<DocumentScopeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DocumentScopeItem | null>(null)
  const [form, setForm] = useState<DocumentScopeWrite>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const [conflictMsg, setConflictMsg] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DocumentScopeItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try { setItems(await adminDocScopeApi.list()) } catch (e) { setError(apiError(e).message ?? 'Errore caricamento') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setFieldErrors({}); setConflictMsg(null); setModalOpen(true) }
  const openEdit = (item: DocumentScopeItem) => { setEditTarget(item); setForm({ code: item.code, name: item.name, description: item.description ?? '', is_active: item.is_active }); setFieldErrors({}); setConflictMsg(null); setModalOpen(true) }
  const fErr = (f: string) => fieldErrors[f]?.[0]

  const handleSave = async () => {
    setSaving(true); setFieldErrors({}); setConflictMsg(null)
    try {
      if (editTarget) { await adminDocScopeApi.update(editTarget.id, form); toast.success('Scope aggiornato') }
      else { await adminDocScopeApi.create(form); toast.success('Scope creato') }
      setModalOpen(false); load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setConflictMsg(errorMessage(ae))
      else if (ae.status === 409) setConflictMsg(ae.message ?? 'Record in uso')
      else if (ae.errors) setFieldErrors(ae.errors)
      else setConflictMsg(ae.message ?? 'Errore salvataggio')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try { await adminDocScopeApi.delete(deleteTarget.id); toast.success('Scope eliminato'); setDeleteTarget(null); load() }
    catch (e) { toast.error(apiError(e).message ?? 'Errore eliminazione') }
    finally { setDeleting(false) }
  }

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Scope documento</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'>Anagrafiche</li>
                <li className='breadcrumb-item active'>Scope documento</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>
      <Container fluid>
        <Card>
          <CardHeader className='d-flex justify-content-between align-items-center'>
            <h5 className='mb-0'>Scope documento</h5>
            <Button color='primary' size='sm' onClick={openCreate}><Plus size={13} className='me-1' /> Nuovo scope</Button>
          </CardHeader>
          <CardBody>
            {error && <Alert color='danger'>{error}</Alert>}
            {loading ? <div className='text-center py-5'><div className='loader' /></div> : (
              <div className='table-responsive'>
                <table className='table table-hover'>
                  <thead><tr><th>Codice</th><th>Nome</th><th>Descrizione</th><th>Stato</th><th>Azioni</th></tr></thead>
                  <tbody>
                    {items.length === 0 ? <tr><td colSpan={5} className='text-center text-muted'>Nessuno scope.</td></tr> : items.map((item) => (
                      <tr key={item.id}>
                        <td><code>{item.code}</code></td>
                        <td>{item.name}</td>
                        <td>{item.description ?? '—'}</td>
                        <td><span className={`badge ${item.is_active ? 'badge-light-success' : 'badge-light-secondary'}`}>{item.is_active ? 'Attivo' : 'Disattivo'}</span></td>
                        <td><div className='d-flex gap-1'><button className='btn btn-sm btn-outline-primary' onClick={() => openEdit(item)}><Edit2 size={12} /></button><button className='btn btn-sm btn-outline-danger' onClick={() => setDeleteTarget(item)}><Trash2 size={12} /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </Container>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)}>
        <ModalHeader toggle={() => setModalOpen(false)}>{editTarget ? 'Modifica scope' : 'Nuovo scope'}</ModalHeader>
        <ModalBody>
          {conflictMsg && <Alert color='danger'>{conflictMsg}</Alert>}
          <FormGroup><Label>Codice *</Label><Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} invalid={!!fErr('code')} />{fErr('code') && <div className='invalid-feedback d-block'>{fErr('code')}</div>}</FormGroup>
          <FormGroup><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} invalid={!!fErr('name')} />{fErr('name') && <div className='invalid-feedback d-block'>{fErr('name')}</div>}</FormGroup>
          <FormGroup><Label>Descrizione</Label><Input type='textarea' rows={2} value={form.description ?? ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></FormGroup>
          <FormGroup check><Input type='checkbox' checked={form.is_active ?? true} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} /><Label check>Attivo</Label></FormGroup>
        </ModalBody>
        <ModalFooter><Button color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button><Button color='light' onClick={() => setModalOpen(false)}>Annulla</Button></ModalFooter>
      </Modal>

      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)}>
        <ModalHeader toggle={() => setDeleteTarget(null)}>Conferma eliminazione</ModalHeader>
        <ModalBody>Eliminare <strong>{deleteTarget?.name}</strong>?</ModalBody>
        <ModalFooter><Button color='danger' onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminazione…' : 'Elimina'}</Button><Button color='light' onClick={() => setDeleteTarget(null)}>Annulla</Button></ModalFooter>
      </Modal>
    </>
  )
}
