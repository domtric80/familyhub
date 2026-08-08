import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button,
} from 'reactstrap'
import { Home, Plus, Edit2, Trash2 } from 'react-feather'
import { toast } from 'react-toastify'
import { adminBiologicalSexApi, apiError, errorMessage } from '../../services/api'
import type { OrderedLookupItem, OrderedLookupItemWrite } from '../../types'

/**
 * NOTA DI SVILUPPO — Sesso biologico vs Identità di genere
 *
 * Questo modulo gestisce il SESSO BIOLOGICO (campo `sesso`), distinto e
 * separato dal campo GENERE (`genere`) già presente nel sistema.
 *
 * - `sesso`  → sesso biologico assegnato alla nascita (AFAB / AMAB / Intersex).
 *              Determinato da cromosomi, caratteristiche anatomiche e ormonali.
 *              Valori tipici: Maschio, Femmina, Intersex, Non specificato.
 *
 * - `genere` → identità di genere, ovvero la percezione che la persona ha di sé.
 *              Valori possibili: Uomo, Donna, Non binario, Genderfluid, Agender,
 *              Transgender, Genderqueer, Demigender, Bigender, Pangender, Altro,
 *              Preferisco non specificare.
 *
 * I due campi NON sono sinonimi. Per i pre-adolescenti e adolescenti in carico
 * questa distinzione è fondamentale:
 *  • Il sesso biologico è un dato anagrafico/medico.
 *  • L'identità di genere è un aspetto dell'identità della persona e può
 *    differire dal sesso assegnato alla nascita.
 *  • Il sistema deve permettere di registrare entrambi in modo indipendente,
 *    rispettando l'autodeterminazione del minore e le linee guida
 *    degli operatori educativi.
 *
 * BACKEND: endpoint /admin/biological-sexes confermato e disponibile (task 036).
 * Campo `biological_sex_id` aggiunto al modello Minor dal backend (task 036).
 * Il campo `gender_identity_id` rimane distinto e indipendente.
 */

const EMPTY_FORM: OrderedLookupItemWrite = { code: '', name: '', sort_order: 0, is_active: true }

export default function SessoPage() {
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
      setItems(await adminBiologicalSexApi.list())
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
        await adminBiologicalSexApi.update(editTarget.id, form)
        toast.success('Sesso biologico aggiornato')
      } else {
        await adminBiologicalSexApi.create(form)
        toast.success('Sesso biologico creato')
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
      await adminBiologicalSexApi.delete(deleteTarget.id)
      toast.success('Sesso biologico eliminato')
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
            <Col xs='6'><h3>Sesso biologico</h3></Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'>Impostazioni</li>
                <li className='breadcrumb-item'>Minore</li>
                <li className='breadcrumb-item active'>Sesso biologico</li>
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
                <div>
                  <h5 className='mb-0'>Sesso biologico</h5>
                  <small className='text-muted'>
                    Sesso assegnato alla nascita (biologico). Campo distinto dall'identità di genere.
                  </small>
                </div>
                <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
                  <Plus size={13} /> Nuovo
                </Button>
              </CardHeader>
              <CardBody>
                <Alert color='info' className='py-2 px-3 mb-3' style={{ fontSize: 13 }}>
                  <strong>Nota:</strong> Il sesso biologico (questo campo) è distinto dall'
                  <strong>identità di genere</strong> (sezione Generi). Entrambi i campi devono
                  essere presenti nel profilo del minore e gestiti separatamente, nel rispetto
                  dell'autodeterminazione della persona.
                </Alert>

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
                            ? (
                              <tr>
                                <td colSpan={6} className='text-muted text-center py-4'>
                                  Nessun valore configurato.
                                  <div className='mt-1 small'>
                                    Valori suggeriti: <code>M</code> Maschio, <code>F</code> Femmina,
                                    <code> I</code> Intersex, <code>NS</code> Non specificato
                                  </div>
                                </td>
                              </tr>
                            )
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
          {editTarget ? 'Modifica sesso biologico' : 'Nuovo sesso biologico'}
        </ModalHeader>
        <ModalBody>
          {conflictMsg && <Alert color='danger'>{conflictMsg}</Alert>}
          <FormGroup>
            <Label>Codice <span className='text-danger'>*</span></Label>
            <Input
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              invalid={!!fErr('code')}
              placeholder='es. M, F, I, NS'
            />
            {fErr('code') && <div className='invalid-feedback d-block'>{fErr('code')}</div>}
          </FormGroup>
          <FormGroup>
            <Label>Nome <span className='text-danger'>*</span></Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              invalid={!!fErr('name')}
              placeholder='es. Maschio, Femmina, Intersex, Non specificato'
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
              id='sesso-active'
              checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
            />
            <Label check for='sesso-active'>Attivo</Label>
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
