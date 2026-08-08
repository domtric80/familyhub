import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardBody, CardHeader,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button, Badge,
} from 'reactstrap'
import { Home, Plus, Edit2, Trash2, Shield, Save, Info } from 'react-feather'
import { toast } from 'react-toastify'
import { adminRoleApi, apiError, errorMessage } from '../../services/api'
import type { AdminRole, RoleWrite, RolePermissionsMatrix, Permission, DocumentPolicy } from '../../types'
import InfoDrawer from '../../components/common/InfoDrawer'

const PRIVILEGED_ROLE_CODES = ['SUPER_ADMIN', 'DIRETTORE', 'COORDINATORE']

interface RoleGuideEntry {
  tipo: string; privilegiato: boolean; richiedeAssegnazione: boolean | null; rbacModificabile: boolean; descrizione: string
}
const ROLE_INFO: Record<string, RoleGuideEntry> = {
  SUPER_ADMIN:            { tipo: 'Sistema',   privilegiato: true,  richiedeAssegnazione: false, rbacModificabile: false, descrizione: 'Governance totale multi-struttura. Accesso completo senza assegnazione al minore.' },
  DIRETTORE:              { tipo: 'Sistema',   privilegiato: true,  richiedeAssegnazione: false, rbacModificabile: false, descrizione: 'Direzione completa della struttura. Visione piena dei casi.' },
  COORDINATORE:           { tipo: 'Sistema',   privilegiato: true,  richiedeAssegnazione: false, rbacModificabile: false, descrizione: 'Coordinamento operativo della struttura. Accesso operativo ai minori.' },
  PSICOLOGO:              { tipo: 'Operativo', privilegiato: false, richiedeAssegnazione: true,  rbacModificabile: true,  descrizione: 'Accesso specialistico ai minori assegnati.' },
  EDUCATORE:              { tipo: 'Operativo', privilegiato: false, richiedeAssegnazione: true,  rbacModificabile: true,  descrizione: 'Gestione quotidiana dei minori assegnati.' },
  EDUCATORE_NOTTURNO:     { tipo: 'Operativo', privilegiato: false, richiedeAssegnazione: true,  rbacModificabile: true,  descrizione: 'Operatività ridotta sui minori assegnati.' },
  ASSISTENTE_SOCIALE_EST: { tipo: 'Esterno',   privilegiato: false, richiedeAssegnazione: true,  rbacModificabile: true,  descrizione: 'Lettura selettiva sui minori assegnati.' },
  SUPERVISORE_ESTERNO:    { tipo: 'Esterno',   privilegiato: false, richiedeAssegnazione: true,  rbacModificabile: true,  descrizione: 'Reporting e vista aggregata.' },
  PEDIATRA:               { tipo: 'Clinico',   privilegiato: false, richiedeAssegnazione: true,  rbacModificabile: true,  descrizione: 'Accesso ai documenti clinici dei minori assegnati attivamente.' },
  ADMIN_IT:               { tipo: 'Tecnico',   privilegiato: false, richiedeAssegnazione: null,  rbacModificabile: true,  descrizione: 'Gestione tecnica e configurazione. Nessun accesso ai minori.' },
}

// ─── Matrice accesso documentale ABAC (statica — finché non esiste GET /admin/document-access-matrix) ──
interface DocAccessEntry {
  classification: string
  label: string
  read: 'sì' | 'sì (con assegnazione)' | 'no'
  download: 'sì' | 'sì (con assegnazione)' | 'no'
  note?: string
}
const DOC_ACCESS_BY_ROLE: Record<string, DocAccessEntry[]> = {
  SUPER_ADMIN: [
    { classification: 'internal',   label: 'Interno',      read: 'sì', download: 'sì' },
    { classification: 'restricted', label: 'Riservato',    read: 'sì', download: 'sì' },
    { classification: 'clinical',   label: 'Clinico',      read: 'sì', download: 'sì' },
    { classification: 'judicial',   label: 'Giudiziario',  read: 'sì', download: 'sì' },
  ],
  DIRETTORE: [
    { classification: 'internal',   label: 'Interno',      read: 'sì', download: 'sì' },
    { classification: 'restricted', label: 'Riservato',    read: 'sì', download: 'sì' },
    { classification: 'clinical',   label: 'Clinico',      read: 'sì', download: 'sì' },
    { classification: 'judicial',   label: 'Giudiziario',  read: 'sì', download: 'sì' },
  ],
  COORDINATORE: [
    { classification: 'internal',   label: 'Interno',      read: 'sì', download: 'sì' },
    { classification: 'restricted', label: 'Riservato',    read: 'sì', download: 'sì' },
    { classification: 'clinical',   label: 'Clinico',      read: 'sì', download: 'sì' },
    { classification: 'judicial',   label: 'Giudiziario',  read: 'sì', download: 'sì' },
  ],
  PSICOLOGO: [
    { classification: 'internal',   label: 'Interno',      read: 'sì (con assegnazione)', download: 'sì (con assegnazione)' },
    { classification: 'restricted', label: 'Riservato',    read: 'sì (con assegnazione)', download: 'sì (con assegnazione)' },
    { classification: 'clinical',   label: 'Clinico',      read: 'sì (con assegnazione)', download: 'sì (con assegnazione)' },
    { classification: 'judicial',   label: 'Giudiziario',  read: 'no', download: 'no', note: 'Accesso riservato a ruoli altamente autorizzati' },
  ],
  EDUCATORE: [
    { classification: 'internal',   label: 'Interno',      read: 'sì (con assegnazione)', download: 'sì (con assegnazione)' },
    { classification: 'restricted', label: 'Riservato',    read: 'sì (con assegnazione)', download: 'no', note: 'Lettura consentita, download no' },
    { classification: 'clinical',   label: 'Clinico',      read: 'no', download: 'no' },
    { classification: 'judicial',   label: 'Giudiziario',  read: 'no', download: 'no' },
  ],
  EDUCATORE_NOTTURNO: [
    { classification: 'internal',   label: 'Interno',      read: 'sì (con assegnazione)', download: 'no' },
    { classification: 'restricted', label: 'Riservato',    read: 'no', download: 'no' },
    { classification: 'clinical',   label: 'Clinico',      read: 'no', download: 'no' },
    { classification: 'judicial',   label: 'Giudiziario',  read: 'no', download: 'no' },
  ],
  ASSISTENTE_SOCIALE_EST: [
    { classification: 'internal',   label: 'Interno',      read: 'sì (con assegnazione)', download: 'no' },
    { classification: 'restricted', label: 'Riservato',    read: 'no', download: 'no' },
    { classification: 'clinical',   label: 'Clinico',      read: 'no', download: 'no' },
    { classification: 'judicial',   label: 'Giudiziario',  read: 'no', download: 'no' },
  ],
  SUPERVISORE_ESTERNO: [
    { classification: 'internal',   label: 'Interno',      read: 'sì (con assegnazione)', download: 'no' },
    { classification: 'restricted', label: 'Riservato',    read: 'no', download: 'no' },
    { classification: 'clinical',   label: 'Clinico',      read: 'no', download: 'no' },
    { classification: 'judicial',   label: 'Giudiziario',  read: 'no', download: 'no' },
  ],
  PEDIATRA: [
    { classification: 'internal',   label: 'Interno',      read: 'no', download: 'no', note: 'Accesso non previsto per questo ruolo' },
    { classification: 'restricted', label: 'Riservato',    read: 'no', download: 'no' },
    { classification: 'clinical',   label: 'Clinico',      read: 'sì (con assegnazione)', download: 'sì (con assegnazione)', note: 'Solo su minori assegnati attivamente' },
    { classification: 'judicial',   label: 'Giudiziario',  read: 'no', download: 'no' },
  ],
  ADMIN_IT: [
    { classification: 'internal',   label: 'Interno',      read: 'no', download: 'no', note: 'Nessun accesso ai minori' },
    { classification: 'restricted', label: 'Riservato',    read: 'no', download: 'no' },
    { classification: 'clinical',   label: 'Clinico',      read: 'no', download: 'no' },
    { classification: 'judicial',   label: 'Giudiziario',  read: 'no', download: 'no' },
  ],
}

function DocAccessBadge({ value }: { value: DocAccessEntry['read'] }) {
  if (value === 'sì') return <span className='badge badge-light-success' style={{ fontSize: 10 }}>Sì</span>
  if (value === 'sì (con assegnazione)') return <span className='badge badge-light-warning' style={{ fontSize: 10 }}>Sì (con assegnazione)</span>
  return <span className='badge badge-light-secondary' style={{ fontSize: 10 }}>No</span>
}

const EMPTY_FORM: RoleWrite = { code: '', name: '', description: '', is_system: false }

function isPrivileged(code: string) { return PRIVILEGED_ROLE_CODES.includes(code.toUpperCase()) }

// Mappa resource tecnico → label italiano leggibile
const RESOURCE_LABELS: Record<string, string> = {
  // Minori
  minors:                   'Minori — Anagrafica',
  minor_profiles:           'Minori — Profilo esteso',
  minor_contacts:           'Minori — Contatti',
  minor_documents:          'Minori — Documenti',
  minor_case_details:       'Minori — Scheda caso',
  minor_exits:              'Minori — Uscite',
  minor_assignments:        'Minori — Assegnazioni operatori',
  minor_approaches:         'Minori — Avvicinamenti',
  minor_journal_entries:    'Minori — Diario',
  minor_diagnoses:          'Minori — Diagnosi',
  minor_peis:               'Minori — PEI',
  minor_needs:              'Minori — Bisogni',
  // Attività
  activities:               'Attività',
  activity_types:           'Attività — Tipi',
  // Messaggistica
  internal_messages:        'Messaggistica interna',
  internal_message_threads: 'Messaggistica — Thread',
  // Admin
  facilities:               'Strutture',
  organizations:            'Organizzazioni',
  users:                    'Utenti',
  admin_users:              'Utenti admin',
  roles:                    'Ruoli',
  assignments:              'Assegnazioni ruolo',
  staff_members:            'Operatori (Staff)',
  staff_documents:          'Operatori — Documenti',
  // Anagrafiche
  minor_statuses:           'Anagrafiche — Stati minore',
  genders:                  'Anagrafiche — Generi',
  contact_types:            'Anagrafiche — Tipi contatto',
  document_types:           'Anagrafiche — Tipi documento',
  document_issuers:         'Anagrafiche — Enti emittenti',
  approach_types:           'Anagrafiche — Tipi avvicinamento',
  journal_entry_types:      'Anagrafiche — Tipi diario',
  staff_qualifications:     'Anagrafiche — Qualifiche operatori',
  staff_statuses:           'Anagrafiche — Stati operatori',
  facility_statuses:        'Anagrafiche — Stati struttura',
  // Geo
  countries:                'Geografica — Nazioni',
  regions:                  'Geografica — Regioni',
  provinces:                'Geografica — Province',
  cities:                   'Geografica — Comuni',
  // Audit
  audit_logs:               'Registro audit',
  // Altro
  permissions:              'Permessi di sistema',
}

// Mappa action tecnica → label italiano
const ACTION_LABELS: Record<string, string> = {
  read:    'Lettura',
  create:  'Creazione',
  update:  'Modifica',
  delete:  'Eliminazione',
  list:    'Elenco',
  export:  'Esportazione',
  import:  'Importazione',
  revoke:  'Revoca',
  restore: 'Ripristino',
  approve: 'Approvazione',
  assign:  'Assegnazione',
  upload:  'Caricamento file',
  download:'Download',
}

function resourceLabel(key: string): string {
  return RESOURCE_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function actionLabel(key: string): string {
  return ACTION_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function groupPerms(perms: Permission[] | undefined | null) {
  const map: Record<string, Permission[]> = {}
  if (!perms) return map
  perms.forEach((p) => { if (!map[p.resource]) map[p.resource] = []; map[p.resource].push(p) })
  return map
}

export default function RuoliPage() {
  const [roles, setRoles]     = useState<AdminRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)

  // Modale dettaglio permessi (read-only, solo attivi)
  const [detailRole, setDetailRole]       = useState<AdminRole | null>(null)
  const [detailMatrix, setDetailMatrix]   = useState<RolePermissionsMatrix | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Policy documentale
  const [policy, setPolicy]               = useState<DocumentPolicy | null>(null)
  const [policyLoading, setPolicyLoading] = useState(false)
  const [policyChecked, setPolicyChecked] = useState<Set<string>>(new Set())
  const [policySaving, setPolicySaving]   = useState(false)

  // Modale modifica permessi (editable, aperta dal dettaglio)
  const [permEditOpen, setPermEditOpen] = useState(false)
  const [checkedIds, setCheckedIds]     = useState<Set<number>>(new Set())
  const [savingPerms, setSavingPerms]   = useState(false)

  // Modale crea/modifica ruolo
  const [modalOpen, setModalOpen]     = useState(false)
  const [editTarget, setEditTarget]   = useState<AdminRole | null>(null)
  const [form, setForm]               = useState<RoleWrite>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [saving, setSaving]           = useState(false)
  const [conflictMsg, setConflictMsg] = useState<string | null>(null)

  // Modale elimina
  const [deleteTarget, setDeleteTarget]     = useState<AdminRole | null>(null)
  const [deleteConflict, setDeleteConflict] = useState<string | null>(null)
  const [deleting, setDeleting]             = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try { setRoles(await adminRoleApi.list()) }
    catch (e) { setError(apiError(e).message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openDetail = async (role: AdminRole) => {
    setDetailRole(role); setDetailMatrix(null); setDetailLoading(true)
    setPolicy(null); setPolicyLoading(true)
    try {
      const [m, p] = await Promise.allSettled([
        adminRoleApi.getPermissions(role.id),
        adminRoleApi.getDocumentPolicy(role.id),
      ])
      if (m.status === 'fulfilled') {
        // Fallback retrocompatibile: il backend può restituire all_permissions o permissions
        const raw = m.value
        const normalized = { ...raw, permissions: raw.all_permissions ?? raw.permissions ?? [] }
        setDetailMatrix(normalized)
        setCheckedIds(new Set(raw.assigned_permission_ids))
      }
      else toast.error(apiError(m.reason).message ?? 'Errore caricamento permessi')
      if (p.status === 'fulfilled') { setPolicy(p.value); setPolicyChecked(new Set(p.value.classifications.filter((c) => c.assigned_to_role).map((c) => c.code))) }
      // policy failure is non-blocking
    } finally { setDetailLoading(false); setPolicyLoading(false) }
  }

  const openPermEdit = () => { setPermEditOpen(true) }

  const savePolicy = async () => {
    if (!detailRole) return
    setPolicySaving(true)
    try {
      const updated = await adminRoleApi.updateDocumentPolicy(detailRole.id, Array.from(policyChecked))
      setPolicy(updated)
      toast.success('Policy documentale salvata')
    } catch (e) { toast.error(apiError(e).message ?? 'Errore salvataggio policy documentale') }
    finally { setPolicySaving(false) }
  }

  const savePermissions = async () => {
    if (!detailRole) return
    setSavingPerms(true)
    try {
      await adminRoleApi.updatePermissions(detailRole.id, { permission_ids: Array.from(checkedIds) })
      toast.success('Permessi salvati')
      setRoles((prev) => prev.map((r) => r.id === detailRole.id ? { ...r, permissions_count: checkedIds.size } : r))
      setPermEditOpen(false)
    } catch (e) { toast.error(apiError(e).message ?? 'Errore salvataggio permessi') }
    finally { setSavingPerms(false) }
  }

  const togglePerm = (id: number) => setCheckedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const openCreate = () => { setEditTarget(null); setForm(EMPTY_FORM); setFieldErrors({}); setConflictMsg(null); setModalOpen(true) }
  const openEdit   = (role: AdminRole) => {
    setEditTarget(role)
    setForm({ code: role.code, name: role.name, description: role.description ?? '', is_system: role.is_system })
    setFieldErrors({}); setConflictMsg(null); setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true); setFieldErrors({}); setConflictMsg(null)
    try {
      if (editTarget) { await adminRoleApi.update(editTarget.id, form); toast.success('Ruolo aggiornato') }
      else { await adminRoleApi.create(form); toast.success('Ruolo creato') }
      setModalOpen(false); load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.status === 403) setConflictMsg(errorMessage(ae))
      else if (ae.status === 409) setConflictMsg(ae.message ?? 'Conflitto')
      else if (ae.errors) setFieldErrors(ae.errors)
      else setConflictMsg(ae.message ?? 'Errore salvataggio')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true); setDeleteConflict(null)
    try {
      await adminRoleApi.delete(deleteTarget.id)
      toast.success('Ruolo eliminato')
      if (detailRole?.id === deleteTarget.id) { setDetailRole(null); setDetailMatrix(null) }
      setDeleteTarget(null); load()
    } catch (e) {
      const ae = apiError(e)
      setDeleteConflict(ae.status === 409 ? (ae.message ?? 'Ruolo in uso') : (ae.message ?? 'Errore eliminazione'))
    } finally { setDeleting(false) }
  }

  const fErr = (f: string) => fieldErrors[f]?.[0]

  // Permessi attivi = quelli assegnati
  const activePerms = detailMatrix?.permissions?.filter((p) => detailMatrix.assigned_permission_ids?.includes(p.id)) ?? []
  const activeGrouped = groupPerms(activePerms)
  const allGrouped   = groupPerms(detailMatrix?.permissions)

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
              <div className='d-flex align-items-center gap-2'>
                <h3 className='mb-0'>Ruoli</h3>
                <Button color='light' size='sm' className='d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
                  <Info size={13} /> Informazioni
                </Button>
              </div>
            </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item'>Anagrafiche</li>
                <li className='breadcrumb-item active'>Ruoli</li>
              </ol>
            </Col>
          </Row>
        </div>
      </Container>

      <Container fluid>
        <Row><Col xs={12}>
          <Card>
            <CardHeader className='d-flex justify-content-between align-items-center'>
              <h5 className='mb-0'>Elenco ruoli</h5>
              <div className='d-flex align-items-center gap-2'>
                <small className='text-muted'>{roles.length} ruoli</small>
                <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
                  <Plus size={13} /> Nuovo ruolo
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {error && <Alert color='danger'>{error}</Alert>}
              {loading ? <div className='text-center py-5'><div className='loader' /></div> : (
                <div className='table-responsive'>
                  <table className='table table-hover'>
                    <thead className='table-light'>
                      <tr>
                        <th>Codice</th><th>Nome</th><th>Descrizione</th>
                        <th>Permessi</th><th>Tipo</th><th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.length === 0 && <tr><td colSpan={6} className='text-center text-muted py-4'>Nessun ruolo configurato.</td></tr>}
                      {roles.map((role) => {
                        const priv = isPrivileged(role.code)
                        return (
                          <tr key={role.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(role)}>
                            <td><code style={{ fontSize: 12 }}>{role.code}</code></td>
                            <td className='fw-semibold'>{role.name}</td>
                            <td className='text-muted small'>{role.description ?? '—'}</td>
                            <td>
                              <span className='badge badge-light-primary'>
                                {role.permissions_count ?? '—'} permessi
                              </span>
                            </td>
                            <td>
                              {priv
                                ? <Badge color='' className='badge-light-warning'>Privilegiato</Badge>
                                : role.is_system
                                  ? <Badge color='' className='badge-light-secondary'>Sistema</Badge>
                                  : <Badge color='' className='badge-light-primary'>Operativo</Badge>}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className='d-flex gap-1'>
                                <button className='btn btn-sm btn-outline-primary' onClick={() => openEdit(role)} title='Modifica'><Edit2 size={12} /></button>
                                <button className='btn btn-sm btn-outline-danger' disabled={role.is_system}
                                  onClick={() => { setDeleteTarget(role); setDeleteConflict(null) }} title='Elimina'>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </Col></Row>
      </Container>

      {/* ── Modale dettaglio permessi (solo attivi, read-only) ── */}
      <Modal isOpen={!!detailRole} toggle={() => setDetailRole(null)} size='lg'>
        <ModalHeader toggle={() => setDetailRole(null)}>
          <Shield size={15} className='me-2' />
          Permessi attivi — {detailRole?.name}
        </ModalHeader>
        <ModalBody>
          {detailLoading && <div className='text-center py-4'><div className='loader' /></div>}
          {!detailLoading && detailMatrix && (
            <>
              {isPrivileged(detailRole?.code ?? '') && (
                <Alert color='warning' className='d-flex align-items-start gap-2 mb-3'>
                  <Shield size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div className='small'>
                    <strong>Ruolo di sistema privilegiato</strong> — possiede un comportamento speciale nell'accesso ai minori
                    e può operare senza assegnazione manuale. La matrice permessi RBAC non è modificabile da questa interfaccia.
                    La <strong>policy documentale ABAC</strong> (sezione sotto) rimane invece configurabile.
                  </div>
                </Alert>
              )}
              {activePerms.length === 0
                ? <p className='text-muted text-center py-3'>Nessun permesso attivo assegnato a questo ruolo.</p>
                : Object.entries(activeGrouped).map(([resource, perms]) => (
                    <div key={resource} className='mb-3'>
                      <div className='fw-semibold small border-bottom pb-1 mb-2 d-flex align-items-center gap-2'>
                        {resourceLabel(resource)}
                        <code className='text-muted fw-normal' style={{ fontSize: 10 }}>{resource}</code>
                      </div>
                      <div className='d-flex flex-wrap gap-1'>
                        {perms.map((p) => (
                          <Badge key={p.id} color='' className='badge-light-primary' style={{ fontSize: 11, fontWeight: 400 }}>
                            {actionLabel(p.action)}
                            {p.description && <span className='text-muted ms-1'>— {p.description}</span>}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
            </>
          )}
          {/* Sezione policy documentale */}
          <div className='mt-4 pt-3 border-top'>
            <div className='fw-semibold text-uppercase small text-muted mb-2' style={{ letterSpacing: '0.5px' }}>
              Policy documentale (ABAC)
            </div>
            <div className='alert alert-info py-2 px-3 mb-2' style={{ fontSize: 12 }}>
              I permessi di ruolo controllano l'accesso alle funzioni del sistema.
              L'accesso ai documenti sensibili dipende anche da <strong>classificazione</strong>,
              ruolo effettivo e <strong>assegnazione attiva al minore</strong>.
            </div>
            <div className='alert alert-light border py-2 px-3 mb-3 d-flex align-items-center gap-2' style={{ fontSize: 12 }}>
              <span>Abilita o disabilita le classificazioni per questo ruolo. Per aggiungere nuovi tag documentali vai in</span>
              <Link to='/anagrafiche/classificazioni' className='fw-semibold' style={{ whiteSpace: 'nowrap' }}>Classificazioni documentali →</Link>
            </div>
            {policyLoading && <div className='text-center py-2'><span className='spinner-border spinner-border-sm text-primary' /></div>}
            {!policyLoading && policy && (
              <>
                {/* Header RBAC base */}
                <div className='d-flex gap-3 mb-3'>
                  <div className='d-flex align-items-center gap-2'>
                    <span className='small text-muted'>Lettura documenti:</span>
                    {policy.rbac.attachments_read
                      ? <Badge color='' className='badge-light-success' style={{ fontSize: 10 }}>Sì</Badge>
                      : <Badge color='' className='badge-light-secondary' style={{ fontSize: 10 }}>No</Badge>}
                  </div>
                  <div className='d-flex align-items-center gap-2'>
                    <span className='small text-muted'>Upload documenti:</span>
                    {policy.rbac.attachments_upload
                      ? <Badge color='' className='badge-light-success' style={{ fontSize: 10 }}>Sì</Badge>
                      : <Badge color='' className='badge-light-secondary' style={{ fontSize: 10 }}>No</Badge>}
                  </div>
                </div>
                {!policy.rbac.attachments_read && (
                  <Alert color='warning' className='py-2 px-3 mb-3' style={{ fontSize: 12 }}>
                    Questo ruolo non ha il permesso base di lettura documenti (<code>attachments.read</code>).
                    Anche se abiliti una classificazione, non potrà leggere documenti finché non riceve quel permesso.
                  </Alert>
                )}
                {/* Checklist classificazioni */}
                <table className='table table-sm table-bordered mb-2' style={{ fontSize: 12 }}>
                  <thead className='table-light'>
                    <tr>
                      <th style={{ width: 36 }}></th>
                      <th>Classificazione</th>
                      <th>Descrizione</th>
                      <th>Accesso effettivo</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policy.classifications.map((cls) => {
                      const checked = policyChecked.has(cls.code)
                      const canEdit = true // policy ABAC editabile per tutti i ruoli
                      return (
                        <tr key={cls.code} style={{ opacity: cls.is_active ? 1 : 0.5 }}>
                          <td className='text-center'>
                            <Input
                              type='checkbox'
                              checked={checked}
                              disabled={!canEdit}
                              onChange={(e) => {
                                const s = new Set(policyChecked)
                                if (e.target.checked) s.add(cls.code); else s.delete(cls.code)
                                setPolicyChecked(s)
                              }}
                            />
                          </td>
                          <td>
                            <code style={{ fontSize: 11 }}>{cls.code}</code>
                            {' '}<span className='fw-semibold'>{cls.name}</span>
                            {!cls.is_active && <Badge color='' className='badge-light-secondary ms-1' style={{ fontSize: 9 }}>inattiva</Badge>}
                          </td>
                          <td className='text-muted' style={{ fontSize: 11 }}>{cls.description ?? '—'}</td>
                          <td>
                            {cls.effective_read_access
                              ? cls.requires_minor_assignment
                                ? <span className='badge badge-light-warning' style={{ fontSize: 10 }}>Sì (con assegnazione)</span>
                                : <span className='badge badge-light-success' style={{ fontSize: 10 }}>Sì</span>
                              : <span className='badge badge-light-secondary' style={{ fontSize: 10 }}>No</span>}
                          </td>
                          <td style={{ fontSize: 11, color: '#777' }}>{cls.notes ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <p className='text-muted mb-0' style={{ fontSize: 11 }}>
                  * Per i documenti del minore l'accesso effettivo richiede anche l'assegnazione attiva al minore.{' '}
                  <Link to='/anagrafiche/accesso-documentale' style={{ fontSize: 11 }}>Vista completa →</Link>
                </p>
              </>
            )}
            {!policyLoading && !policy && (
              <p className='text-muted small'>Policy documentale non disponibile per questo ruolo.</p>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          {detailRole && policy && (
            <Button color='success' size='sm' className='d-flex align-items-center gap-1' disabled={policySaving} onClick={savePolicy}>
              {policySaving ? <span className='spinner-border spinner-border-sm me-1' /> : <Save size={12} />}
              Salva policy documentale
            </Button>
          )}
          {detailRole && !isPrivileged(detailRole.code) && (
            <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openPermEdit}>
              <Edit2 size={12} /> Modifica permessi
            </Button>
          )}
          <Button color='light' onClick={() => setDetailRole(null)}>Chiudi</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modale modifica permessi (editable matrix) ── */}
      <Modal isOpen={permEditOpen} toggle={() => setPermEditOpen(false)} size='xl'>
        <ModalHeader toggle={() => setPermEditOpen(false)}>
          <Shield size={15} className='me-2' />
          Modifica permessi — {detailRole?.name}
        </ModalHeader>
        <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {detailMatrix && Object.entries(allGrouped).map(([resource, perms]) => (
            <div key={resource} className='mb-4'>
              <div className='fw-semibold small border-bottom pb-1 mb-2 d-flex align-items-center gap-2'>
                {resourceLabel(resource)}
                <code className='text-muted fw-normal' style={{ fontSize: 10 }}>{resource}</code>
              </div>
              <Row>
                {perms.map((p) => (
                  <Col md='6' key={p.id} className='mb-1'>
                    <FormGroup check className='mb-0'>
                      <Input type='checkbox' id={`perm-${p.id}`} checked={checkedIds.has(p.id)} onChange={() => togglePerm(p.id)} />
                      <Label check for={`perm-${p.id}`} className='mb-0'>
                        <span className='small fw-semibold'>{actionLabel(p.action)}</span>
                        {p.description && <span className='text-muted ms-1 small'> — {p.description}</span>}
                      </Label>
                    </FormGroup>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
          {(!detailMatrix?.permissions || detailMatrix.permissions.length === 0) && (
            <p className='text-muted'>Nessun permesso disponibile.</p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color='primary' className='d-flex align-items-center gap-1' onClick={savePermissions} disabled={savingPerms}>
            <Save size={13} /> {savingPerms ? 'Salvataggio…' : 'Salva permessi'}
          </Button>
          <Button color='light' onClick={() => setPermEditOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modale crea/modifica ruolo ── */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)}>
        <ModalHeader toggle={() => setModalOpen(false)}>{editTarget ? 'Modifica ruolo' : 'Nuovo ruolo'}</ModalHeader>
        <ModalBody>
          {conflictMsg && <Alert color='danger'>{conflictMsg}</Alert>}
          <FormGroup>
            <Label>Codice <span className='text-danger'>*</span></Label>
            <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} invalid={!!fErr('code')} placeholder='es. EDUCATORE' />
            {fErr('code') && <div className='invalid-feedback d-block'>{fErr('code')}</div>}
          </FormGroup>
          <FormGroup>
            <Label>Nome <span className='text-danger'>*</span></Label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} invalid={!!fErr('name')} placeholder='es. Educatore' />
            {fErr('name') && <div className='invalid-feedback d-block'>{fErr('name')}</div>}
          </FormGroup>
          <FormGroup>
            <Label>Descrizione</Label>
            <Input type='textarea' rows={2} value={form.description ?? ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </FormGroup>
          <FormGroup check>
            <Input type='checkbox' id='role-system' checked={form.is_system ?? false} onChange={(e) => setForm((p) => ({ ...p, is_system: e.target.checked }))} />
            <Label check for='role-system'>Ruolo di sistema (non eliminabile)</Label>
          </FormGroup>
          <div className='alert alert-warning py-2 px-3 mt-3 mb-0' style={{ fontSize: 12 }}>
            <strong>Accesso documentale — attenzione</strong><br />
            I permessi di ruolo controllano l'accesso ai moduli e alle funzioni del sistema.<br />
            L'accesso ai documenti sensibili segue anche policy ABAC basate su classificazione,
            ruolo effettivo e assegnazione al minore. Queste regole non sono configurabili
            da questa interfaccia e non dipendono dai permessi RBAC qui assegnati.
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='light' onClick={() => setModalOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modale elimina ── */}
      <Modal isOpen={!!deleteTarget} toggle={() => setDeleteTarget(null)}>
        <ModalHeader toggle={() => setDeleteTarget(null)}>Conferma eliminazione</ModalHeader>
        <ModalBody>
          {deleteConflict
            ? <Alert color='danger'>{deleteConflict}</Alert>
            : <p>Eliminare il ruolo <strong>{deleteTarget?.name}</strong>? L'operazione non è reversibile.</p>}
        </ModalBody>
        <ModalFooter>
          {!deleteConflict && <Button color='danger' onClick={handleDelete} disabled={deleting}>{deleting ? 'Eliminazione…' : 'Elimina'}</Button>}
          <Button color='light' onClick={() => setDeleteTarget(null)}>{deleteConflict ? 'Chiudi' : 'Annulla'}</Button>
        </ModalFooter>
      </Modal>

      {/* ── Drawer informazioni ── */}
      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Informazioni sui ruoli'>
        <p className='text-muted' style={{ fontSize: 14 }}>I ruoli definiscono cosa può fare un utente nel sistema. Alcuni ruoli di sistema hanno un comportamento speciale rispetto all'accesso ai minori e ai documenti.</p>

        <h6 className='fw-bold mt-4 mb-2'>RBAC vs ABAC documentale</h6>
        <div className='alert alert-info py-2 px-3 mb-3' style={{ fontSize: 13 }}>
          <strong>RBAC</strong> — controlla l'accesso ai moduli, alle funzioni e ai dati applicativi (es. poter aprire la sezione Minori, creare un'uscita, gestire utenti).
        </div>
        <div className='alert alert-warning py-2 px-3 mb-3' style={{ fontSize: 13 }}>
          <strong>ABAC documentale</strong> — controlla l'accesso effettivo ai singoli documenti in base a: classificazione del documento, ruolo effettivo dell'utente nella struttura, assegnazione attiva al minore.<br />
          Il ruolo non sostituisce ABAC: è uno degli attributi usati dalla policy documentale.
        </div>
        <p style={{ fontSize: 13, color: '#555' }}>
          Questo significa che un utente con permesso RBAC corretto può vedere il minore, ma non necessariamente
          tutti i suoi documenti. L'accesso documentale dipende dalla classificazione del file e da regole di policy separate.
        </p>

        <h6 className='fw-bold mt-4 mb-2'>Mappa ruoli di sistema</h6>
        <div className='table-responsive mb-4'>
          <table className='table table-sm table-bordered' style={{ fontSize: 13 }}>
            <thead className='table-light'>
              <tr><th>Codice</th><th>Tipo</th><th>Privilegiato</th><th>Ass. minore</th><th>RBAC</th><th>Note</th></tr>
            </thead>
            <tbody>
              {Object.entries(ROLE_INFO).map(([code, info]) => (
                <tr key={code}>
                  <td><code style={{ fontSize: 11 }}>{code}</code></td>
                  <td><span className={`badge ${info.tipo === 'Sistema' ? 'bg-dark' : info.tipo === 'Operativo' ? 'bg-primary' : info.tipo === 'Tecnico' ? 'bg-secondary' : 'bg-info'}`} style={{ fontSize: 10 }}>{info.tipo}</span></td>
                  <td className='text-center'>{info.privilegiato ? <span className='badge bg-warning text-dark' style={{ fontSize: 10 }}>SÌ</span> : <span className='text-muted small'>no</span>}</td>
                  <td className='text-center'>{info.richiedeAssegnazione === null ? <span className='text-muted small'>n/a</span> : info.richiedeAssegnazione ? <span className='badge badge-light-danger' style={{ fontSize: 10 }}>Richiesta</span> : <span className='badge badge-light-success' style={{ fontSize: 10 }}>Non richiesta</span>}</td>
                  <td className='text-center'>{info.rbacModificabile ? <span className='badge badge-light-success' style={{ fontSize: 10 }}>Modificabile</span> : <span className='badge badge-light-warning' style={{ fontSize: 10 }}>Bloccata</span>}</td>
                  <td style={{ fontSize: 12, color: '#555' }}>{info.descrizione}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h6 className='fw-bold mb-2'>Classificazioni documentali</h6>
        <p style={{ fontSize: 13, color: '#555' }}>Ogni documento ha una classificazione che determina chi può leggerlo e scaricarlo:</p>
        <table className='table table-sm table-bordered mb-3' style={{ fontSize: 12 }}>
          <thead className='table-light'>
            <tr><th>Classificazione</th><th>Descrizione</th><th>Accesso</th></tr>
          </thead>
          <tbody>
            <tr><td><code>internal</code></td><td>Interno alla struttura</td><td>Tutti i ruoli operativi (con assegnazione)</td></tr>
            <tr><td><code>restricted</code></td><td>Riservato</td><td>Ruoli con accesso esteso (con assegnazione)</td></tr>
            <tr><td><code>clinical</code></td><td>Clinico / specialistico</td><td>Psicologo e ruoli privilegiati</td></tr>
            <tr><td><code>judicial</code></td><td>Giudiziario</td><td>Solo ruoli altamente autorizzati</td></tr>
          </tbody>
        </table>

        <div className='alert alert-warning py-2 px-3 mb-3' style={{ fontSize: 13 }}>
          <strong>Ruoli privilegiati</strong> — SUPER_ADMIN, DIRETTORE, COORDINATORE<br />
          Accedono a tutti i documenti senza assegnazione al minore. La matrice RBAC non è modificabile da UI.
        </div>
        <div className='alert alert-secondary py-2 px-3 mb-0' style={{ fontSize: 12 }}>
          La matrice documentale completa per ruolo è disponibile nella{' '}
          <Link to='/anagrafiche/accesso-documentale'>pagina Accesso documentale</Link>.
          Il dettaglio del singolo ruolo mostra la matrice in forma compatta direttamente nel modal.
        </div>
      </InfoDrawer>
    </>
  )
}
