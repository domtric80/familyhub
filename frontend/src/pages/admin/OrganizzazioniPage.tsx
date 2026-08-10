import { useEffect, useState } from 'react'
import {
  Container, Row, Col, Card, CardHeader, CardBody,
  Table, Button, Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Badge, Alert,
} from 'reactstrap'
import { toast } from 'react-toastify'
import { Plus, Edit2, Trash2 } from 'react-feather'
import { Link } from 'react-router-dom'
import { Home } from 'react-feather'
import { orgApi, apiError, errorMessage } from '../../services/api'
import type { Organization, OrganizationWrite } from '../../types'

type OrgForm = { name: string; legal_name: string; email: string; phone: string }
const EMPTY_FORM: OrgForm = { name: '', legal_name: '', email: '', phone: '' }

export default function OrganizzazioniPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Organization | null>(null)
  const [form, setForm] = useState<OrgForm>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [conflictMsg, setConflictMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null)
  const [deleteConflict, setDeleteConflict] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const setF = (k: keyof OrgForm, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const load = () => {
    setLoading(true)
    orgApi.list()
      .then(setOrgs)
      .catch((e) => toast.error(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setConflictMsg(null)
    setModal(true)
  }

  const openEdit = (org: Organization) => {
    setEditing(org)
    setForm({
      name: org.name,
      legal_name: org.legal_name ?? '',
      email: org.email ?? '',
      phone: org.phone ?? '',
    })
    setFieldErrors({})
    setConflictMsg(null)
    setModal(true)
  }

  const closeModal = () => { setModal(false); setEditing(null) }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Il nome è obbligatorio'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email non valida'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    setConflictMsg(null)
    const payload: OrganizationWrite = {
      name: form.name.trim(),
      legal_name: form.legal_name.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
    }
    try {
      if (editing) {
        await orgApi.update(editing.id, payload)
        toast.success('Organizzazione aggiornata')
      } else {
        await orgApi.create(payload)
        toast.success('Organizzazione creata')
      }
      closeModal()
      load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setConflictMsg(errorMessage(ae))
      else if (ae.errors) {
        const mapped: Record<string, string> = {}
        Object.entries(ae.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : String(v) })
        setFieldErrors(mapped)
      } else setConflictMsg(ae.message ?? 'Errore salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteConflict(null)
    try {
      await orgApi.delete(deleteTarget.id)
      toast.success('Organizzazione eliminata')
      setDeleteTarget(null)
      load()
    } catch (e) {
      const ae = apiError(e)
      setDeleteConflict(ae.status === 403 ? errorMessage(ae) : (ae.message ?? 'Errore eliminazione'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Container fluid>
      <div className='page-title'>
        <Row>
          <Col xs={6}><h3>Organizzazioni</h3></Col>
          <Col xs={6}>
            <ol className='breadcrumb'>
              <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
              <li className='breadcrumb-item'>Admin</li>
              <li className='breadcrumb-item active'>Organizzazioni</li>
            </ol>
          </Col>
        </Row>
      </div>

      <Row>
        <Col sm={12}>
          <Card>
            <CardHeader className='d-flex justify-content-between align-items-center'>
              <h5 className='mb-0'>Elenco organizzazioni</h5>
              <Button color='primary' size='sm' onClick={openNew}>
                <Plus size={16} className='me-1' /> Nuova organizzazione
              </Button>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className='text-center py-5'><div className='loader-box'><div className='loader-15' /></div></div>
              ) : orgs.length === 0 ? (
                <div className='text-center py-5 text-muted'>Nessuna organizzazione registrata</div>
              ) : (
                <div className='table-responsive'>
                  <Table hover className='table-border-horizontal'>
                    <thead>
                      <tr>
                        <th>#</th><th>Nome</th><th>Ragione sociale</th><th>Email</th><th>Telefono</th><th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orgs.map((o) => (
                        <tr key={o.id}>
                          <td><Badge color='light' className='text-dark'>{o.id}</Badge></td>
                          <td className='f-w-600'>{o.name}</td>
                          <td>{o.legal_name ?? '—'}</td>
                          <td>{o.email ?? '—'}</td>
                          <td>{o.phone ?? '—'}</td>
                          <td>
                            <div className='d-flex gap-1'>
                              <Button color='outline-primary' size='sm' onClick={() => openEdit(o)} title='Modifica'>
                                <Edit2 size={13} />
                              </Button>
                              <Button color='outline-danger' size='sm' onClick={() => { setDeleteConflict(null); setDeleteTarget(o) }} title='Elimina'>
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Modal crea / modifica */}
      <Modal isOpen={modal} toggle={closeModal} centered>
        <ModalHeader toggle={closeModal}>{editing ? 'Modifica organizzazione' : 'Nuova organizzazione'}</ModalHeader>
        <ModalBody>
          {conflictMsg && <Alert color='danger' className='py-2 mb-3'>{conflictMsg}</Alert>}
          <FormGroup>
            <Label>Nome <span className='text-danger'>*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => setF('name', e.target.value)}
              invalid={!!fieldErrors.name}
              placeholder='Es. Cooperativa Sociale XYZ'
            />
            {fieldErrors.name && <div className='invalid-feedback d-block'>{fieldErrors.name}</div>}
          </FormGroup>
          <FormGroup>
            <Label>Ragione sociale</Label>
            <Input
              value={form.legal_name}
              onChange={(e) => setF('legal_name', e.target.value)}
              placeholder='Ragione sociale legale (opzionale)'
            />
          </FormGroup>
          <Row>
            <Col xs={6}>
              <FormGroup>
                <Label>Email</Label>
                <Input
                  type='email'
                  value={form.email}
                  onChange={(e) => setF('email', e.target.value)}
                  invalid={!!fieldErrors.email}
                  placeholder='info@esempio.it'
                />
                {fieldErrors.email && <div className='invalid-feedback d-block'>{fieldErrors.email}</div>}
              </FormGroup>
            </Col>
            <Col xs={6}>
              <FormGroup>
                <Label>Telefono</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setF('phone', e.target.value)}
                  placeholder='+39 02 1234567'
                />
              </FormGroup>
            </Col>
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>
            {saving ? 'Salvataggio…' : 'Salva'}
          </Button>
          <Button color='light' onClick={closeModal}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal conferma eliminazione */}
      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)} centered>
        <ModalHeader toggle={() => setDeleteTarget(null)}>Conferma eliminazione</ModalHeader>
        <ModalBody>
          {deleteConflict
            ? <Alert color='danger'>{deleteConflict}</Alert>
            : <p>Eliminare l&apos;organizzazione <strong>{deleteTarget?.name}</strong>? L&apos;operazione non è reversibile.</p>}
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
    </Container>
  )
}
