import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Badge,
} from 'reactstrap'
import { Home, Plus, Edit2, Trash2 } from 'react-feather'
import { toast } from 'react-toastify'
import { adminStaffDocumentStatusApi, apiError } from '../../services/api'
import type { StaffDocumentStatus } from '../../types'

const EMPTY_FORM = { code: '', name: '', description: '', sort_order: '', is_active: true }

export default function StatiDocumentiStaffPage() {
  const [items, setItems]       = useState<StaffDocumentStatus[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [modalOpen, setModalOpen]     = useState(false)
  const [editTarget, setEditTarget]   = useState<StaffDocumentStatus | null>(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving]           = useState(false)
  const [conflictMsg, setConflictMsg] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget]     = useState<StaffDocumentStatus | null>(null)
  const [deleteConflict, setDeleteConflict] = useState<string | null>(null)
  const [deleting, setDeleting]             = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try { setItems(await adminStaffDocumentStatusApi.list()) }
    catch (e) { setError(apiError(e).message ?? 'Errore caricamento') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setFieldErrors({}); setConflictMsg(null); setModalOpen(true) }

  const openEdit = (item: StaffDocumentStatus) => {
    setEditTarget(item)
    setForm({ code: item.code, name: item.name, description: item.description ?? '', sort_order: item.sort_order != null ? String(item.sort_order) : '', is_active: item.is_active })
    setFieldErrors({}); setConflictMsg(null); setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true); setFieldErrors({}); setConflictMsg(null)
    try {
      const payload = { code: form.code.trim(), name: form.name.trim(), description: form.description.trim() || null, sort_order: form.sort_order !== '' ? Number(form.sort_order) : null, is_active: form.is_active }
      if (editTarget) { await adminStaffDocumentStatusApi.update(editTarget.id, payload); toast.success('Stato aggiornato') }
      else { await adminStaffDocumentStatusApi.create(payload as Omit<StaffDocumentStatus, 'id'>); toast.success('Stato creato') }
      setModalOpen(false); load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 409) setConflictMsg(ae.message ?? 'Codice già esistente.')
      else if (ae.status === 422) setFieldErrors(ae.errors ?? {})
      else toast.error(ae.message ?? 'Errore salvataggio')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true); setDeleteConflict(null)
    try { await adminStaffDocumentStatusApi.delete(deleteTarget.id); toast.success('Stato eliminato'); setDeleteTarget(null); load() }
    catch (e) {
      const ae = apiError(e)
      if (ae.status === 409) setDeleteConflict(ae.message ?? 'Stato in uso da documenti staff esistenti.')
      else { toast.error(ae.message ?? 'Errore eliminazione'); setDeleteTarget(null) }
    } finally { setDeleting(false) }
  }

  const fErr = (f: string) => fieldErrors[f]?.[0]

  return (
    <Container fluid>
      <div className='page-title'>
        <Row>
          <Col xs={6}><h3>Stati documenti staff</h3></Col>
          <Col xs={6}>
            <ol className='breadcrumb'>
              <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
              <li className='breadcrumb-item'>Anagrafiche</li>
              <li className='breadcrumb-item active'>Stati documenti staff</li>
            </ol>
          </Col>
        </Row>
      </div>
      <Row><Col xs={12}>
        <Card>
          <CardHeader className='d-flex justify-content-between align-items-center'>
            <h5 className='mb-0'>Elenco stati</h5>
            <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}><Plus size={14} /> Nuovo stato</Button>
          </CardHeader>
          <CardBody>
            {error && <Alert color='danger'>{error}</Alert>}
            {loading ? <div className='text-center py-5'><div className='loader' /></div> : (
              <div className='table-responsive'>
                <table className='table table-hover'>
                  <thead className='table-light'>
                    <tr><th>Codice</th><th>Nome</th><th>Descrizione</th><th>Ordine</th><th>Stato anagrafica</th><th>Azioni</th></tr>
                  </thead>
                  <tbody>
                    {items.length === 0 && <tr><td colSpan={6} className='text-center text-muted py-4'>Nessuno stato configurato.</td></tr>}
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td><code>{item.code}</code></td>
                        <td>{item.name}</td>
                        <td className='text-muted' style={{ fontSize: 13 }}>{item.description ?? '—'}</td>
                        <td>{item.sort_order ?? '—'}</td>
                        <td>{item.is_active ? <Badge color='success'>Attivo</Badge> : <Badge color='secondary'>Disattivo</Badge>}</td>
                        <td>
                          <div className='d-flex gap-1'>
                            <button className='btn btn-sm btn-outline-primary' onClick={() => openEdit(item)} title='Modifica'><Edit2 size={12} /></button>
                            <button className='btn btn-sm btn-outline-danger' onClick={() => { setDeleteTarget(item); setDeleteConflict(null) }} title='Elimina'><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </Col></Row>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size='md'>
        <ModalHeader toggle={() => setModalOpen(false)}>{editTarget ? 'Modifica stato' : 'Nuovo stato documento staff'}</ModalHeader>
        <ModalBody>
          {conflictMsg && <Alert color='warning'>{conflictMsg}</Alert>}
          <FormGroup>
            <Label>Codice <span className='text-danger'>*</span></Label>
            <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder='Es. VALID' invalid={!!fErr('code')} disabled={!!editTarget} />
            {fErr('code') && <div className='invalid-feedback d-block'>{fErr('code')}</div>}
            {editTarget && <small className='text-muted'>Il codice non è modificabile dopo la creazione.</small>}
          </FormGroup>
          <FormGroup>
            <Label>Nome <span className='text-danger'>*</span></Label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder='Es. Valido' invalid={!!fErr('name')} />
            {fErr('name') && <div className='invalid-feedback d-block'>{fErr('name')}</div>}
          </FormGroup>
          <FormGroup>
            <Label>Descrizione</Label>
            <Input type='textarea' rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder='Descrizione opzionale' />
          </FormGroup>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label>Ordine visualizzazione</Label>
                <Input type='number' value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} placeholder='Es. 10' min={0} />
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup className='mt-4 pt-1'>
                <div className='d-flex align-items-center gap-2'>
                  <Input type='checkbox' id='is_active_staff_doc_status' checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} style={{ width: 16, height: 16 }} />
                  <Label for='is_active_staff_doc_status' className='mb-0'>Stato attivo</Label>
                </div>
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : editTarget ? 'Salva modifiche' : 'Crea stato'}</Button>
          <Button color='light' onClick={() => setModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)}>
        <ModalHeader toggle={() => setDeleteTarget(null)}>Elimina stato documento staff</ModalHeader>
        <ModalBody>
          {deleteConflict
            ? <Alert color='warning'>{deleteConflict} Non è possibile eliminare uno stato assegnato a documenti esistenti.</Alert>
            : <p>Eliminare lo stato <strong>{deleteTarget?.name}</strong> (<code>{deleteTarget?.code}</code>)?</p>}
        </ModalBody>
        <ModalFooter>
          {!deleteConflict && <Button color='danger' onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminazione…' : 'Elimina'}</Button>}
          <Button color='light' onClick={() => setDeleteTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>
    </Container>
  )
}
