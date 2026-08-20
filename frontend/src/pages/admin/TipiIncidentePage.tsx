import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button,
  Nav, NavItem, NavLink, TabContent, TabPane,
} from 'reactstrap'
import { Home, Plus, Edit2 } from 'react-feather'
import { toast } from 'react-toastify'
import { incidentTypeApi, apiError } from '../../services/api'
import type { IncidentType, IncidentTypeWrite } from '../../types'

const EMPTY: IncidentTypeWrite = { name: '', code: '', description: null, is_active: true }

export default function TipiIncidentePage() {
  const [types, setTypes]       = useState<IncidentType[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<IncidentType | null>(null)
  const [form, setForm]           = useState<IncidentTypeWrite>(EMPTY)
  const [formMsg, setFormMsg]     = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<IncidentType | null>(null)
  const [deleting, setDeleting]   = useState(false)

  const load = () => {
    setLoading(true)
    incidentTypeApi.list()
      .then(setTypes)
      .catch((e) => setError(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditTarget(null); setForm({ ...EMPTY }); setFormMsg(null); setModalOpen(true)
  }
  const openEdit = (t: IncidentType) => {
    setEditTarget(t)
    setForm({ name: t.name, code: t.code, description: t.description ?? null, is_active: t.is_active })
    setFormMsg(null); setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) { setFormMsg('Nome e codice sono obbligatori.'); return }
    setSaving(true); setFormMsg(null)
    try {
      if (editTarget) {
        await incidentTypeApi.update(editTarget.id, form)
        toast.success('Tipo incidente aggiornato.')
      } else {
        await incidentTypeApi.create(form)
        toast.success('Tipo incidente creato.')
      }
      setModalOpen(false); load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 409) setFormMsg('Il codice è già in uso.')
      else setFormMsg(ae.message ?? 'Errore salvataggio.')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await incidentTypeApi.delete(deleteTarget.id)
      toast.success('Tipo incidente eliminato.')
      setDeleteTarget(null); load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 409) {
        toast.error('Il tipo è già usato in incidenti esistenti — disattivalo invece di eliminarlo.')
        setDeleteTarget(null)
      } else { toast.error(ae.message ?? 'Errore eliminazione.') }
    } finally { setDeleting(false) }
  }

  const active   = types.filter((t) => t.is_active)
  const inactive = types.filter((t) => !t.is_active)

  const TypeRow = ({ t }: { t: IncidentType }) => (
    <tr>
      <td><strong>{t.name}</strong></td>
      <td><code>{t.code}</code></td>
      <td className='small text-muted'>{t.description ?? '—'}</td>
      <td>
        <Button size='sm' color='light' className='me-1' onClick={() => openEdit(t)}><Edit2 size={12} /></Button>
        <Button size='sm' color='light' onClick={() => setDeleteTarget(t)}>✕</Button>
      </td>
    </tr>
  )

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'><h3>Tipi di incidente</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'>Amministrazione</li>
                <li className='breadcrumb-item active'>Tipi incidente</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Row><Col>
          <Card>
            <CardHeader>
              <div className='d-flex align-items-center justify-content-between'>
                <Nav tabs className='border-0 card-header-tabs'>
                  <NavItem><NavLink className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')} style={{ cursor: 'pointer' }}>Attivi ({active.length})</NavLink></NavItem>
                  <NavItem><NavLink className={activeTab === 'inactive' ? 'active' : ''} onClick={() => setActiveTab('inactive')} style={{ cursor: 'pointer' }}>Disattivi ({inactive.length})</NavLink></NavItem>
                </Nav>
                <Button color='primary' size='sm' onClick={openCreate}><Plus size={13} className='me-1' />Nuovo tipo</Button>
              </div>
            </CardHeader>
            <CardBody>
              {error && <Alert color='danger'>{error}</Alert>}
              {loading ? <div className='text-center py-4'><div className='loader' /></div> : (
                <TabContent activeTab={activeTab}>
                  {(['active', 'inactive'] as const).map((tab) => (
                    <TabPane key={tab} tabId={tab}>
                      {(tab === 'active' ? active : inactive).length === 0
                        ? <p className='text-muted text-center py-3'>Nessun tipo {tab === 'active' ? 'attivo' : 'disattivo'}.</p>
                        : (
                          <table className='table table-sm table-hover'>
                            <thead className='table-light'><tr><th>Nome</th><th>Codice</th><th>Descrizione</th><th></th></tr></thead>
                            <tbody>{(tab === 'active' ? active : inactive).map((t) => <TypeRow key={t.id} t={t} />)}</tbody>
                          </table>
                        )}
                    </TabPane>
                  ))}
                </TabContent>
              )}
            </CardBody>
          </Card>
        </Col></Row>
      </Container>

      {/* Modal create/edit */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)}>
        <ModalHeader toggle={() => setModalOpen(false)}>{editTarget ? 'Modifica tipo' : 'Nuovo tipo di incidente'}</ModalHeader>
        <ModalBody>
          {formMsg && <Alert color='danger'>{formMsg}</Alert>}
          <FormGroup>
            <Label>Nome <span className='text-danger'>*</span></Label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </FormGroup>
          <FormGroup>
            <Label>Codice <span className='text-danger'>*</span></Label>
            <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder='es. CADUTA, AGGRESSIONE…' disabled={!!editTarget} />
            {editTarget && <small className='text-muted'>Il codice non è modificabile dopo la creazione.</small>}
          </FormGroup>
          <FormGroup>
            <Label>Descrizione</Label>
            <Input type='textarea' rows={2} value={form.description ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value || null }))} />
          </FormGroup>
          <FormGroup check>
            <Input type='checkbox' id='ti_active' checked={form.is_active ?? true}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
            <Label check for='ti_active'>Attivo</Label>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : editTarget ? 'Aggiorna' : 'Crea'}</Button>
          <Button color='light' onClick={() => setModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal elimina */}
      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)} size='sm'>
        <ModalHeader toggle={() => setDeleteTarget(null)}>Elimina tipo incidente</ModalHeader>
        <ModalBody>
          <p>Eliminare <strong>{deleteTarget?.name}</strong>?</p>
          <Alert color='warning' className='py-2 px-3' style={{ fontSize: 13 }}>
            Se il tipo è già usato in incidenti esistenti, l'eliminazione sarà rifiutata (409). In quel caso, disattivalo.
          </Alert>
        </ModalBody>
        <ModalFooter>
          <Button color='danger' onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminazione…' : 'Elimina'}</Button>
          <Button color='light' onClick={() => setDeleteTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
