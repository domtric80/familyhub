import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, CardHeader, CardBody, Table, Badge, Button, Alert, Modal, ModalHeader, ModalBody, ModalFooter, FormGroup, Label, Input } from 'reactstrap'
import { Link } from 'react-router-dom'
import InfoDrawer from '../../components/common/InfoDrawer'
import { Home, Plus, Edit2, Trash2, Info } from 'react-feather'
import { toast } from 'react-toastify'
import { adminDocClassificationApi, lookupsApi, apiError, errorMessage } from '../../services/api'
import type { DocumentClassification, DocumentClassificationWrite, Role } from '../../types'

const EMPTY_FORM: DocumentClassificationWrite = {
  code: '',
  name: '',
  description: '',
  allowed_role_codes: [],
  is_active: true,
}

export default function ClassificazioniPage() {
  const [infoOpen, setInfoOpen] = useState(false)
  const [items, setItems] = useState<DocumentClassification[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DocumentClassification | null>(null)
  const [form, setForm] = useState<DocumentClassificationWrite>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const [conflictMsg, setConflictMsg] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DocumentClassification | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [classifications, roleItems] = await Promise.all([
        adminDocClassificationApi.list(),
        lookupsApi.roles(),
      ])
      setItems(classifications)
      setRoles(roleItems)
    } catch (e) {
      setError(apiError(e).message ?? 'Errore caricamento')
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

  const openEdit = (item: DocumentClassification) => {
    setEditTarget(item)
    setForm({
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      allowed_role_codes: item.allowed_roles ?? [],
      is_active: item.is_active ?? true,
    })
    setFieldErrors({})
    setConflictMsg(null)
    setModalOpen(true)
  }

  const handleRoleToggle = (roleCode: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      allowed_role_codes: checked
        ? Array.from(new Set([...(prev.allowed_role_codes ?? []), roleCode]))
        : (prev.allowed_role_codes ?? []).filter((code) => code !== roleCode),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setFieldErrors({})
    setConflictMsg(null)
    try {
      if (editTarget?.id) {
        await adminDocClassificationApi.update(editTarget.id, form)
        toast.success('Classificazione aggiornata')
      } else {
        await adminDocClassificationApi.create(form)
        toast.success('Classificazione creata')
      }
      setModalOpen(false)
      load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) {
        setConflictMsg(errorMessage(ae))
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
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      await adminDocClassificationApi.delete(deleteTarget.id)
      toast.success('Classificazione eliminata')
      setDeleteTarget(null)
      load()
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore eliminazione')
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
            <Col xs={6}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0 }}>Classificazioni documentali</h3>
                <button className='btn btn-light btn-sm d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
                  <Info size={13} /> Informazioni
                </button>
              </div>
            </Col>
            <Col xs={6}>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'>Anagrafiche</li>
                <li className='breadcrumb-item active'>Classificazioni doc.</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>
      <Container fluid>
        {/* ── Guidance: due livelli ABAC ── */}
        <div className='alert alert-info mb-3 d-flex gap-3 align-items-start' role='alert' style={{ fontSize: 13 }}>
          <Info size={18} style={{ flexShrink: 0, marginTop: 2, color: '#0d6efd' }} />
          <div>
            <strong>Come funziona l'accesso ai documenti — due passi</strong>
            <div className='mt-2 d-flex flex-column gap-1'>
              <div className='d-flex align-items-start gap-2'>
                <span className='badge badge-light-primary' style={{ minWidth: 22, textAlign: 'center' }}>1</span>
                <span>
                  <strong>Crea il tag</strong> — definisci una nuova classificazione con codice, nome e ruoli ammessi di default.
                </span>
              </div>
              <div className='d-flex align-items-start gap-2'>
                <span className='badge badge-light-primary' style={{ minWidth: 22, textAlign: 'center' }}>2</span>
                <span>
                  <strong>Assegna il tag ai ruoli</strong> — vai in{' '}
                  <Link to='/anagrafiche/ruoli' className='fw-semibold'>Anagrafiche → Ruoli</Link>,
                  apri un ruolo e abilita la classificazione dalla sezione <em>Policy documentale</em>.
                  Creare un tag non basta: finché non viene assegnato a un ruolo, nessuno lo vede.
                </span>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className='d-flex justify-content-between align-items-center'>
            <div>
              <h5 className='mb-1'>Classificazioni documentali</h5>
              <small className='text-muted'>Le classificazioni controllano la visibilità dei documenti in base ai ruoli.</small>
            </div>
            <Button color='primary' size='sm' onClick={openCreate}>
              <Plus size={14} className='me-1' /> Nuova classificazione
            </Button>
          </CardHeader>
          <CardBody>
            {error && <Alert color='danger'>{error}</Alert>}
            {loading ? <div className='text-center py-5'><div className='loader' /></div> : (
              <div className='table-responsive'>
                <Table hover className='table-border-horizontal'>
                  <thead>
                    <tr>
                      <th>Codice</th>
                      <th>Nome</th>
                      <th>Descrizione</th>
                      <th>Ruoli ammessi</th>
                      <th>Stato</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={6} className='text-center text-muted'>Nessuna classificazione.</td></tr>
                    ) : items.map((item) => (
                      <tr key={item.id ?? item.code}>
                        <td><Badge color='light' className='text-primary f-w-600'>{item.code}</Badge></td>
                        <td>{item.name}</td>
                        <td className='text-muted f-13'>{item.description ?? '—'}</td>
                        <td>
                          <div className='d-flex flex-wrap gap-1'>
                            {(item.allowed_roles ?? []).map((roleCode) => (
                              <span key={roleCode} className='badge badge-light-secondary'>{roleCode}</span>
                            ))}
                          </div>
                        </td>
                        <td><Badge color={(item.is_active ?? true) ? 'success' : 'secondary'}>{(item.is_active ?? true) ? 'Attiva' : 'Disattiva'}</Badge></td>
                        <td>
                          <div className='d-flex gap-1'>
                            <button className='btn btn-sm btn-outline-primary' onClick={() => openEdit(item)}><Edit2 size={12} /></button>
                            <button className='btn btn-sm btn-outline-danger' onClick={() => setDeleteTarget(item)}><Trash2 size={12} /></button>
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
      </Container>

      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size='lg'>
        <ModalHeader toggle={() => setModalOpen(false)}>
          {editTarget ? 'Modifica classificazione' : 'Nuova classificazione'}
        </ModalHeader>
        <ModalBody>
          {conflictMsg && <Alert color='danger'>{conflictMsg}</Alert>}
          <FormGroup>
            <Label>Codice *</Label>
            <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} invalid={!!fErr('code')} />
            {fErr('code') && <div className='invalid-feedback d-block'>{fErr('code')}</div>}
          </FormGroup>
          <FormGroup>
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} invalid={!!fErr('name')} />
            {fErr('name') && <div className='invalid-feedback d-block'>{fErr('name')}</div>}
          </FormGroup>
          <FormGroup>
            <Label>Descrizione</Label>
            <Input type='textarea' rows={2} value={form.description ?? ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </FormGroup>
          <FormGroup>
            <Label>Ruoli ammessi</Label>
            <div className='d-flex flex-wrap gap-3'>
              {roles.map((role) => (
                <FormGroup check key={role.id}>
                  <Input
                    type='checkbox'
                    checked={(form.allowed_role_codes ?? []).includes(role.code)}
                    onChange={(e) => handleRoleToggle(role.code, e.target.checked)}
                  />
                  <Label check>{role.name}</Label>
                </FormGroup>
              ))}
            </div>
            {fErr('allowed_role_codes') && <div className='invalid-feedback d-block'>{fErr('allowed_role_codes')}</div>}
          </FormGroup>
          <FormGroup check>
            <Input type='checkbox' checked={form.is_active ?? true} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
            <Label check>Attiva</Label>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='light' onClick={() => setModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)}>
        <ModalHeader toggle={() => setDeleteTarget(null)}>Conferma eliminazione</ModalHeader>
        <ModalBody>Eliminare <strong>{deleteTarget?.name}</strong>?</ModalBody>
        <ModalFooter>
          <Button color='danger' onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminazione…' : 'Elimina'}</Button>
          <Button color='light' onClick={() => setDeleteTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Guida — Classificazioni Documentali'>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>A cosa serve</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            Definisce il livello o la famiglia di classificazione del documento, con possibile
            impatto sulle regole di accesso documentale (ABAC). Non è un'etichetta cosmetica.
          </p>
        </section>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Perché è importante</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            La classificazione è strettamente collegata al modello documentale e alle regole ABAC.
            Può incidere su visibilità, filtri e audit. Va gestita con attenzione per non
            alterare involontariamente il perimetro di accesso ai documenti.
          </p>
        </section>
        <section className='mb-3'>
          <h6 className='fw-bold mb-2'>Come impatta il resto del software</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            Compaiono nei form di caricamento e modifica documenti, nei filtri, nell'audit
            documentale e nelle regole di visibilità ABAC. Modificare una classificazione
            in uso può cambiare chi può vedere determinati documenti.
          </p>
        </section>
      </InfoDrawer>
    </>
  )
}
