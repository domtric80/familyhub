import { useEffect, useState } from 'react'
import {
  Card, CardBody, CardHeader,
  Table, Button, Badge,
  Modal, ModalHeader, ModalBody, ModalFooter,
  Form, FormGroup, Label, Input, Alert,
  Row, Col,
} from 'reactstrap'
import { Plus, Edit2, Trash2, Info, Clock } from 'react-feather'
import { toast } from 'react-toastify'
import { shiftTemplatesApi, facilityApi, apiError } from '../../services/api'
import type { StaffShiftTemplate, StaffShiftTemplateWrite, Facility } from '../../types'
import InfoDrawer from '../../components/common/InfoDrawer'

const EMPTY_FORM: StaffShiftTemplateWrite = {
  facility_id: 0,
  code: '',
  name: '',
  start_time: '',
  end_time: '',
  minimum_staff_required: 1,
  sort_order: 0,
  is_active: true,
}

export default function ModelliTurnoPage() {
  const [templates, setTemplates] = useState<StaffShiftTemplate[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading]     = useState(true)
  const [filterFacility, setFilterFacility] = useState<number>(0)
  const [infoOpen, setInfoOpen]   = useState(false)

  // Modal
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState<StaffShiftTemplate | null>(null)
  const [form, setForm]     = useState<StaffShiftTemplateWrite>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)

  // Delete
  const [deleting, setDeleting] = useState<StaffShiftTemplate | null>(null)
  const [deleteModal, setDeleteModal] = useState(false)

  const load = () => {
    setLoading(true)
    const params = filterFacility ? { facility_id: filterFacility } : undefined
    shiftTemplatesApi.list(params)
      .then(setTemplates)
      .catch(() => toast.error('Errore caricamento modelli turno'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    facilityApi.list().then(setFacilities).catch(() => {})
  }, [])

  useEffect(() => { load() }, [filterFacility]) // eslint-disable-line react-hooks/exhaustive-deps

  const setF = (k: keyof StaffShiftTemplateWrite, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, facility_id: filterFacility || (facilities[0]?.id ?? 0) })
    setFormErr(null)
    setModal(true)
  }

  const openEdit = (t: StaffShiftTemplate) => {
    setEditing(t)
    setForm({
      facility_id:           t.facility_id,
      code:                  t.code,
      name:                  t.name,
      start_time:            t.start_time,
      end_time:              t.end_time,
      minimum_staff_required: t.minimum_staff_required,
      sort_order:            t.sort_order,
      is_active:             t.is_active,
    })
    setFormErr(null)
    setModal(true)
  }

  const handleSave = async () => {
    if (!form.facility_id) { setFormErr('Seleziona una struttura.'); return }
    if (!form.code.trim()) { setFormErr('Il codice è obbligatorio.'); return }
    if (!form.name.trim()) { setFormErr('Il nome è obbligatorio.'); return }
    if (!form.start_time) { setFormErr('Ora inizio obbligatoria.'); return }
    if (!form.end_time)   { setFormErr('Ora fine obbligatoria.'); return }

    setSaving(true); setFormErr(null)
    try {
      if (editing) {
        const updated = await shiftTemplatesApi.update(editing.id, form)
        setTemplates((prev) => prev.map((t) => t.id === editing.id ? updated : t))
        toast.success('Modello turno aggiornato.')
      } else {
        const created = await shiftTemplatesApi.create(form)
        setTemplates((prev) => [...prev, created])
        toast.success('Modello turno creato.')
      }
      setModal(false)
    } catch (e) {
      const ae = apiError(e)
      setFormErr(ae.message ?? 'Errore durante il salvataggio.')
    } finally { setSaving(false) }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await shiftTemplatesApi.delete(deleting.id)
      setTemplates((prev) => prev.filter((t) => t.id !== deleting.id))
      toast.success('Modello turno eliminato.')
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 409) toast.error('Impossibile eliminare: esistono assegnazioni collegate.')
      else toast.error(ae.message ?? 'Errore durante l\'eliminazione.')
    } finally { setDeleting(null); setDeleteModal(false) }
  }

  return (
    <div className='container-fluid py-3'>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h5 className='fw-bold mb-0' style={{ color: '#7366ff' }}>Modelli turno</h5>
        <div className='d-flex gap-2'>
          <Button size='sm' color='outline-secondary' className='d-flex align-items-center gap-1'
            onClick={() => setInfoOpen(true)}>
            <Info size={13} /> Info
          </Button>
          <Button size='sm' color='primary' className='d-flex align-items-center gap-1'
            onClick={openCreate}>
            <Plus size={13} /> Nuovo modello
          </Button>
        </div>
      </div>

      {/* Filtri */}
      <Card className='mb-3'>
        <CardBody className='py-2'>
          <Row className='g-2 align-items-center'>
            <Col md='3'>
              <Input type='select' bsSize='sm' value={filterFacility}
                onChange={(e) => setFilterFacility(Number(e.target.value))}>
                <option value='0'>Tutte le strutture</option>
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Input>
            </Col>
          </Row>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className='py-2 d-flex align-items-center gap-2'>
          <Clock size={16} style={{ color: '#7366ff' }} />
          <strong>Modelli configurati</strong>
          <Badge color='primary' pill className='ms-auto'>{templates.length}</Badge>
        </CardHeader>
        <CardBody className='p-0'>
          {loading ? (
            <div className='text-center py-4'><div className='loader' /></div>
          ) : templates.length === 0 ? (
            <div className='text-center py-5 text-muted'>
              <Clock size={40} className='mb-2' />
              <p>Nessun modello turno configurato.</p>
              <Button size='sm' color='primary' onClick={openCreate}>Crea il primo modello</Button>
            </div>
          ) : (
            <Table hover responsive className='mb-0 table-sm'>
              <thead className='table-light'>
                <tr>
                  <th>Struttura</th>
                  <th>Codice</th>
                  <th>Nome</th>
                  <th>Fascia oraria</th>
                  <th className='text-center'>Min. richiesto</th>
                  <th className='text-center'>Ordine</th>
                  <th className='text-center'>Stato</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id}>
                    <td className='small'>{t.facility?.name ?? `Struttura #${t.facility_id}`}</td>
                    <td><code className='small'>{t.code}</code></td>
                    <td className='fw-semibold small'>{t.name}</td>
                    <td className='small text-nowrap'>
                      {t.start_time} → {t.end_time}
                    </td>
                    <td className='text-center small'>{t.minimum_staff_required}</td>
                    <td className='text-center small'>{t.sort_order}</td>
                    <td className='text-center'>
                      {t.is_active
                        ? <span className='badge badge-light-success'>Attivo</span>
                        : <span className='badge badge-light-secondary'>Inattivo</span>}
                    </td>
                    <td className='text-end text-nowrap'>
                      <Button size='sm' color='outline-primary' className='me-1 py-0 px-2'
                        onClick={() => openEdit(t)}>
                        <Edit2 size={12} />
                      </Button>
                      <Button size='sm' color='outline-danger' className='py-0 px-2'
                        onClick={() => { setDeleting(t); setDeleteModal(true) }}>
                        <Trash2 size={12} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Modal create/edit */}
      <Modal isOpen={modal} toggle={() => setModal(false)} size='lg'>
        <ModalHeader toggle={() => setModal(false)}>
          {editing ? 'Modifica modello turno' : 'Nuovo modello turno'}
        </ModalHeader>
        <ModalBody>
          {formErr && <Alert color='warning'>{formErr}</Alert>}
          <Form>
            <Row>
              <Col md='6'>
                <FormGroup>
                  <Label>Struttura *</Label>
                  <Input type='select' value={form.facility_id}
                    onChange={(e) => setF('facility_id', Number(e.target.value))}>
                    <option value='0'>Seleziona struttura…</option>
                    {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </Input>
                </FormGroup>
              </Col>
              <Col md='3'>
                <FormGroup>
                  <Label>Codice *</Label>
                  <Input value={form.code} placeholder='Es. NIGHT'
                    onChange={(e) => setF('code', e.target.value.toUpperCase())} />
                </FormGroup>
              </Col>
              <Col md='3'>
                <FormGroup>
                  <Label>Ordine</Label>
                  <Input type='number' min={0} value={form.sort_order}
                    onChange={(e) => setF('sort_order', Number(e.target.value))} />
                </FormGroup>
              </Col>
            </Row>
            <FormGroup>
              <Label>Nome *</Label>
              <Input value={form.name} placeholder='Es. Turno notte'
                onChange={(e) => setF('name', e.target.value)} />
            </FormGroup>
            <Row>
              <Col md='4'>
                <FormGroup>
                  <Label>Ora inizio *</Label>
                  <Input type='time' value={form.start_time}
                    onChange={(e) => setF('start_time', e.target.value)} />
                </FormGroup>
              </Col>
              <Col md='4'>
                <FormGroup>
                  <Label>Ora fine *</Label>
                  <Input type='time' value={form.end_time}
                    onChange={(e) => setF('end_time', e.target.value)} />
                </FormGroup>
              </Col>
              <Col md='4'>
                <FormGroup>
                  <Label>Minimo operatori richiesti</Label>
                  <Input type='number' min={1} value={form.minimum_staff_required}
                    onChange={(e) => setF('minimum_staff_required', Number(e.target.value))} />
                </FormGroup>
              </Col>
            </Row>
            <FormGroup check>
              <Input type='checkbox' checked={form.is_active}
                onChange={(e) => setF('is_active', e.target.checked)} />
              {' '}
              <Label check>Modello attivo</Label>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>
            {saving ? 'Salvataggio…' : 'Salva'}
          </Button>
          <Button color='secondary' onClick={() => setModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* Modal conferma eliminazione */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(false)} size='sm'>
        <ModalHeader toggle={() => setDeleteModal(false)}>Conferma eliminazione</ModalHeader>
        <ModalBody>
          Eliminare il modello <strong>{deleting?.name}</strong>?
          <br /><small className='text-muted'>Non è possibile eliminare modelli con assegnazioni collegate.</small>
        </ModalBody>
        <ModalFooter>
          <Button color='danger' onClick={confirmDelete}>Elimina</Button>
          <Button color='secondary' onClick={() => setDeleteModal(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Modelli turno — Guida'>
        <p>I <strong>modelli turno</strong> definiscono le fasce orarie standard della struttura (es. mattina, pomeriggio, notte).</p>
        <p>Per ogni modello puoi impostare il <strong>numero minimo di operatori</strong> richiesti. Questo valore verrà confrontato con gli operatori assegnati nella pianificazione settimanale, evidenziando eventuali scoperture.</p>
        <p>Ogni modello appartiene a una <strong>struttura specifica</strong>. Gli operatori e le assegnazioni devono appartenere alla stessa struttura.</p>
        <p className='text-muted small'>Un modello non può essere eliminato se ha assegnazioni collegate. Disattivalo invece per nasconderlo dalla pianificazione.</p>
      </InfoDrawer>
    </div>
  )
}
