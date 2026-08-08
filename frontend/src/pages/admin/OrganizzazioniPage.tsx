import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, CardHeader, CardBody, Table, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, FormFeedback, Badge, Alert } from 'reactstrap'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { Plus, Edit2, Trash2, Lock } from 'react-feather'
import { orgApi, apiError, errorMessage } from '../../services/api'
import type { Organization, OrganizationWrite } from '../../types'

type FormData = { name: string; legal_name: string; email: string; phone: string }

const blockedAction = () => toast.warning('Endpoint backend non disponibile — funzione in arrivo')

export default function OrganizzazioniPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>()

  const load = () => {
    setLoading(true)
    orgApi.list()
      .then(setOrgs)
      .catch((e) => toast.error(apiError(e).message ?? 'Errore caricamento'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openNew = () => {
    reset({ name: '', legal_name: '', email: '', phone: '' })
    setModal(true)
  }

  const closeModal = () => setModal(false)

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    const payload: OrganizationWrite = {
      name: data.name,
      legal_name: data.legal_name || null,
      email: data.email || null,
      phone: data.phone || null,
    }
    try {
      await orgApi.create(payload)
      toast.success('Organizzazione creata')
      closeModal()
      load()
    } catch (e) {
      const ae = apiError(e)
      toast.error(ae.status === 403 ? errorMessage(ae) : (ae.message ?? 'Errore salvataggio'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container fluid>
      <div className="page-title">
        <Row>
          <Col xs={6}><h3>Organizzazioni</h3></Col>
          <Col xs={6}>
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item">Admin</li>
              <li className="breadcrumb-item active">Organizzazioni</li>
            </ol>
          </Col>
        </Row>
      </div>

      <Row>
        <Col sm={12}>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Elenco organizzazioni</h5>
              <Button color="primary" size="sm" onClick={openNew}>
                <Plus size={16} className="me-1" /> Nuova organizzazione
              </Button>
            </CardHeader>
            <CardBody>
              <Alert color="warning" className="py-2 px-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: 13 }}>
                <Lock size={14} />
                <span><strong>Modifica</strong> ed <strong>Elimina</strong> sono predisposte — endpoint backend non ancora disponibili.</span>
              </Alert>
              {loading ? (
                <div className="text-center py-5"><div className="loader-box"><div className="loader-15" /></div></div>
              ) : orgs.length === 0 ? (
                <div className="text-center py-5 text-muted">Nessuna organizzazione registrata</div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="table-border-horizontal">
                    <thead>
                      <tr>
                        <th>#</th><th>Nome</th><th>Ragione sociale</th><th>Email</th><th>Telefono</th><th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orgs.map((o) => (
                        <tr key={o.id}>
                          <td><Badge color="light" className="text-dark">{o.id}</Badge></td>
                          <td className="f-w-600">{o.name}</td>
                          <td>{o.legal_name ?? '—'}</td>
                          <td>{o.email ?? '—'}</td>
                          <td>{o.phone ?? '—'}</td>
                          <td>
                            <Button color="secondary" size="sm" outline className="me-1" disabled title="Endpoint backend non disponibile">
                              <Edit2 size={13} />
                            </Button>
                            <Button color="secondary" size="sm" outline disabled title="Endpoint backend non disponibile">
                              <Trash2 size={13} />
                            </Button>
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

      <Modal isOpen={modal} toggle={closeModal} centered>
        <Form className="form theme-form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader toggle={closeModal}>Nuova organizzazione</ModalHeader>
          <ModalBody>
            <Row>
              <Col sm={12}>
                <FormGroup>
                  <Label>Nome <span className="text-danger">*</span></Label>
                  <Input type="text" invalid={!!errors.name} {...register('name', { required: 'Il nome è obbligatorio' })} />
                  <FormFeedback>{errors.name?.message}</FormFeedback>
                </FormGroup>
              </Col>
              <Col sm={12}>
                <FormGroup>
                  <Label>Ragione sociale</Label>
                  <Input type="text" {...register('legal_name')} />
                </FormGroup>
              </Col>
              <Col xs={6}>
                <FormGroup>
                  <Label>Email</Label>
                  <Input type="email" invalid={!!errors.email} {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email non valida' } })} />
                  <FormFeedback>{errors.email?.message}</FormFeedback>
                </FormGroup>
              </Col>
              <Col xs={6}>
                <FormGroup>
                  <Label>Telefono</Label>
                  <Input type="text" {...register('phone')} />
                </FormGroup>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" type="submit" disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
            <Button color="light" type="button" onClick={closeModal}>Annulla</Button>
          </ModalFooter>
        </Form>
      </Modal>
    </Container>
  )
}
