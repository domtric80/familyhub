import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button,
} from 'reactstrap'
import InfoDrawer from '../../components/common/InfoDrawer'
import { Home, Plus, Edit2, Trash2, Info } from 'react-feather'
import { toast } from 'react-toastify'
import { adminDocTypeApi, lookupsApi, apiError, errorMessage } from '../../services/api'
import type { DocumentTypeItem, DocumentTypeWrite, DocumentScopeItem } from '../../types'

const EMPTY_FORM: DocumentTypeWrite = { code: '', name: '', document_scope_code: '' }

export default function TipiDocumentoPage() {
  const [infoOpen, setInfoOpen] = useState(false)
  const [items, setItems] = useState<DocumentTypeItem[]>([])
  const [scopes, setScopes] = useState<DocumentScopeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DocumentTypeItem | null>(null)
  const [form, setForm] = useState<DocumentTypeWrite>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const [conflictMsg, setConflictMsg] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<DocumentTypeItem | null>(null)
  const [deleteConflict, setDeleteConflict] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [documentTypes, documentScopes] = await Promise.all([
        adminDocTypeApi.list(),
        lookupsApi.documentScopes(),
      ])
      setItems(documentTypes)
      setScopes(documentScopes)
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

  const openEdit = (item: DocumentTypeItem) => {
    setEditTarget(item)
    setForm({ code: item.code, name: item.name, document_scope_code: item.document_scope_code ?? item.scope ?? '' })
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
        await adminDocTypeApi.update(editTarget.id, form)
        toast.success('Tipo documento aggiornato')
      } else {
        await adminDocTypeApi.create(form)
        toast.success('Tipo documento creato')
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
      await adminDocTypeApi.delete(deleteTarget.id)
      toast.success('Tipo documento eliminato')
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
            <Col xs='6'>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0 }}>Tipi documento</h3>
                <button className='btn btn-light btn-sm d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
                  <Info size={13} /> Informazioni
                </button>
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'><Link to='/anagrafiche'>Anagrafiche</Link></li>
                <li className='breadcrumb-item active'>Tipi documento</li>
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
                <h5 className='mb-0'>Tipi documento</h5>
                <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
                  <Plus size={13} /> Nuovo tipo
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
                            <th>Scope</th>
                            <th>Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.length === 0
                            ? <tr><td colSpan={5} className='text-muted text-center'>Nessun tipo documento.</td></tr>
                            : items.map((item) => (
                              <tr key={item.id}>
                                <td className='text-muted small'>{item.id}</td>
                                <td><code>{item.code}</code></td>
                                <td>{item.name}</td>
                                <td><span className='badge bg-light text-dark'>{item.document_scope?.name ?? item.scope}</span></td>
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
          {editTarget ? 'Modifica tipo documento' : 'Nuovo tipo documento'}
        </ModalHeader>
        <ModalBody>
          {conflictMsg && <Alert color='danger'>{conflictMsg}</Alert>}
          <FormGroup>
            <Label>Codice <span className='text-danger'>*</span></Label>
            <Input
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              invalid={!!fErr('code')}
              placeholder='es. CI'
            />
            {fErr('code') && <div className='invalid-feedback d-block'>{fErr('code')}</div>}
          </FormGroup>
          <FormGroup>
            <Label>Nome <span className='text-danger'>*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              invalid={!!fErr('name')}
              placeholder='es. Carta di identità'
            />
            {fErr('name') && <div className='invalid-feedback d-block'>{fErr('name')}</div>}
          </FormGroup>
          <FormGroup>
            <Label>Ambito documento <span className='text-danger'>*</span></Label>
            <Input
              type='select'
              value={form.document_scope_code}
              onChange={(e) => setForm((p) => ({ ...p, document_scope_code: e.target.value }))}
              invalid={!!fErr('document_scope_code')}
            >
              <option value=''>Seleziona ambito…</option>
              {scopes.map((scope) => (
                <option key={scope.id} value={scope.code}>{scope.name}</option>
              ))}
            </Input>
            {fErr('document_scope_code') && <div className='invalid-feedback d-block'>{fErr('document_scope_code')}</div>}
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

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Guida — Tipi Documento'>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>A cosa serve</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            Definisce la tipologia funzionale del documento. I tipi documento vengono riusati
            nei form di caricamento, nei filtri e nelle regole documentali.
          </p>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Perché è importante</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            Usare un tipo canonico invece di testo libero garantisce coerenza nei filtri,
            nel reporting e nelle correlazioni tra documenti. Il tipo documento descrive
            <em>che cos'è</em> il documento, non la sua classificazione di accesso.
          </p>
        </section>
        <section className='mb-3'>
          <h6 className='fw-bold mb-2'>Come impatta il resto del software</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            I tipi documento compaiono nei form di caricamento documenti, nei filtri della
            sezione Documenti del minore e nei report. Modificare o eliminare un tipo in uso
            può rendere incoerenti i documenti già classificati.
          </p>
        </section>
      </InfoDrawer>
    </>
  )
}
