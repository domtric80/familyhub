import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button,
} from 'reactstrap'
import { Home, Plus, Edit2, Trash2 } from 'react-feather'
import { toast } from 'react-toastify'
import { adminGenderApi, apiError, errorMessage } from '../../services/api'
import type { OrderedLookupItem, OrderedLookupItemWrite } from '../../types'

const EMPTY_FORM: OrderedLookupItemWrite = { code: '', name: '', sort_order: 0, is_active: true }

export default function GeneriPage() {
  const [items, setItems] = useState<OrderedLookupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<OrderedLookupItem | null>(null)
  const [form, setForm] = useState<OrderedLookupItemWrite>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const [conflictMsg, setConflictMsg] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<OrderedLookupItem | null>(null)
  const [deleteConflict, setDeleteConflict] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await adminGenderApi.list())
    } catch (e) {
      setError(apiError(e).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setConflictMsg(null)
    setModalOpen(true)
  }

  const openEdit = (item: OrderedLookupItem) => {
    setEditTarget(item)
    setForm({ code: item.code, name: item.name, sort_order: item.sort_order, is_active: item.is_active })
    setFieldErrors({})
    setConflictMsg(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setFieldErrors({})
    setConflictMsg(null)
    try {
      if (editTarget) {
        await adminGenderApi.update(editTarget.id, form)
        toast.success('Genere aggiornato')
      } else {
        await adminGenderApi.create(form)
        toast.success('Genere creato')
      }
      setModalOpen(false)
      load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) {
        setConflictMsg(errorMessage(ae))
      } else if (ae.status === 409) {
        setConflictMsg(ae.message ?? 'Record in uso')
      } else if (ae.errors) {
        setFieldErrors(ae.errors)
      } else {
        setConflictMsg(ae.message ?? 'Errore salvataggio')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteConflict(null)
    try {
      await adminGenderApi.delete(deleteTarget.id)
      toast.success('Genere eliminato')
      setDeleteTarget(null)
      load()
    } catch (e) {
      const ae = apiError(e)
      setDeleteConflict(
        ae.status === 403 ? errorMessage(ae)
        : ae.status === 409 ? (ae.message ?? 'Record in uso: impossibile eliminare')
        : (ae.message ?? 'Errore eliminazione'))
    } finally {
      setDeleting(false)
    }
  }

  const fErr = (f: string) => fieldErrors[f]?.[0]

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Generi</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'><Link to='/anagrafiche'>Anagrafiche</Link></li>
                <li className='breadcrumb-item active'>Generi</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Row>
          <Col sm='12'>
            <Card>
              <CardHeader className='d-flex justify-content-between align-items-center'>
                <h5 className='mb-0'>Generi</h5>
                <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
                  <Plus size={13} /> Nuovo genere
                </Button>
              </CardHeader>
              <CardBody>
                {error && <Alert color='danger'>{error}</Alert>}
                {loading
                  ? <div className='text-center py-5'><div className='loader' /></div>
                  : (
                    <div className='table-responsive'>
                      <table className='table table-hover'>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Codice</th>
                            <th>Nome</th>
                            <th>Ordine</th>
                            <th>Attivo</th>
                            <th>Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.length === 0
                            ? <tr><td colSpan={6} className='text-muted text-center'>Nessun genere.</td></tr>
                            : items.map((item) => (
                              <tr key={item.id}>
                                <td className='text-muted small'>{item.id}</td>
                                <td><code>{item.code}</code></td>
                                <td>{item.name}</td>
                                <td>{item.sort_order}</td>
                                <td>
                                  <span className={`badge bg-${item.is_active ? 'success' : 'secondary'}`}>
                                    {item.is_active ? 'Sì' : 'No'}
                                  </span>
                                </td>
                                <td>
                                  <div className='d-flex gap-1'>
                                    <button className='btn btn-sm btn-outline-primary' onClick={() => openEdit(item)}><Edit2 size={12} /></button>
                                    <button className='btn btn-sm btn-outline-danger' onClick={() => { setDeleteTarget(item); setDeleteConflict(null) }}><Trash2 size={12} /></button>
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
          </Col>
        </Row>
      </Container>

      {/* Modal crea/modifica */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)}>
        <ModalHeader toggle={() => setModalOpen(false)}>
          {editTarget ? 'Modifica genere' : 'Nuovo genere'}
        </ModalHeader>
        <ModalBody>
          {conflictMsg && <Alert color='danger'>{conflictMsg}</Alert>}
          <FormGroup>
            <Label>Codice <span className='text-danger'>*</span></Label>
            <Input
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              invalid={!!fErr('code')}
              placeholder='es. M'
            />
            {fErr('code') && <div className='invalid-feedback d-block'>{fErr('code')}</div>}
          </FormGroup>
          <FormGroup>
            <Label>Nome <span className='text-danger'>*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              invalid={!!fErr('name')}
              placeholder='es. Maschile'
            />
            {fErr('name') && <div className='invalid-feedback d-block'>{fErr('name')}</div>}
          </FormGroup>
          <FormGroup>
            <Label>Ordine</Label>
            <Input
              type='number'
              value={form.sort_order}
              onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
              invalid={!!fErr('sort_order')}
              min={0}
            />
            {fErr('sort_order') && <div className='invalid-feedback d-block'>{fErr('sort_order')}</div>}
          </FormGroup>
          <FormGroup check>
            <Input
              type='checkbox'
              id='genere-active'
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
            />
            <Label check for='genere-active'>Attivo</Label>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>
            {saving ? 'Salvataggio…' : 'Salva'}
          </Button>
          <Button color='light' onClick={() => setModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal elimina */}
      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)}>
        <ModalHeader toggle={() => setDeleteTarget(null)}>Conferma eliminazione</ModalHeader>
        <ModalBody>
          {deleteConflict
            ? <Alert color='danger'>{deleteConflict}</Alert>
            : <p>Eliminare <strong>{deleteTarget?.name}</strong>? L'operazione non è reversibile.</p>}
        </ModalBody>
        <ModalFooter>
          {!deleteConflict && (
            <Button color='danger' onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminazione…' : 'Elimina'}
            </Button>
          )}
          <Button color='light' onClick={() => setDeleteTarget(null)}>
            {deleteConflict ? 'Chiudi' : 'Annulla'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
