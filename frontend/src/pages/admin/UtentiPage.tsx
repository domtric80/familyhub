import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Container, Row, Col, Card, CardHeader, CardBody,
  Modal, ModalHeader, ModalBody, ModalFooter,
  FormGroup, Label, Input, Alert, Button,
} from 'reactstrap'
import { Home, Plus, Edit2, UserX, RefreshCw, List, Info } from 'react-feather'
import InfoDrawer from '../../components/common/InfoDrawer'
import { toast } from 'react-toastify'
import { adminUserApi, staffMemberApi, facilityApi, minorApi, minorAssignmentApi, assignmentApi, lookupsApi, apiError, errorMessage } from '../../services/api'
import type { AdminUser, AdminUserWrite, AdminUserUpdate, StaffMember, Facility, EducatorAccountPayload, Minor, MinorAssignment, Role } from '../../types'

// ── Complessità password ─────────────────────────────────────────────────────

const PWD_CHECKS = [
  { label: 'Almeno 8 caratteri',                         test: (p: string) => p.length >= 8 },
  { label: 'Almeno una lettera maiuscola (A–Z)',          test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Almeno una lettera minuscola (a–z)',          test: (p: string) => /[a-z]/.test(p) },
  { label: 'Almeno un numero (0–9)',                      test: (p: string) => /[0-9]/.test(p) },
  { label: 'Almeno un carattere speciale (!@#$%^&*...)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

type StrengthLevel = 'danger' | 'warning' | 'success'

interface PwdStrength {
  score:   number
  level:   StrengthLevel
  label:   string
  pct:     number
  checks:  { label: string; passed: boolean }[]
}

function evalPassword(pwd: string): PwdStrength {
  const checks = PWD_CHECKS.map((c) => ({ label: c.label, passed: c.test(pwd) }))
  const score  = checks.filter((c) => c.passed).length
  const level: StrengthLevel = score <= 2 ? 'danger' : score <= 3 ? 'warning' : 'success'
  const label  = score <= 2 ? 'Insicura' : score <= 3 ? 'Debole' : 'Sicura'
  return { score, level, label, pct: (score / PWD_CHECKS.length) * 100, checks }
}

const LEVEL_COLOR: Record<StrengthLevel, string> = {
  danger:  '#dc3545',
  warning: '#ffc107',
  success: '#198754',
}
const LEVEL_TEXT: Record<StrengthLevel, string> = {
  danger:  'text-danger',
  warning: 'text-warning',
  success: 'text-success',
}

// ── Componenti password ───────────────────────────────────────────────────────

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null
  const s = evalPassword(password)
  return (
    <div className='mt-2'>
      {/* Barra */}
      <div style={{ height: 5, background: '#e9ecef', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          width: `${s.pct}%`,
          height: '100%',
          background: LEVEL_COLOR[s.level],
          transition: 'width 0.25s ease, background 0.25s ease',
        }} />
      </div>
      <div className={`small fw-semibold mt-1 ${LEVEL_TEXT[s.level]}`}>
        Password {s.label}
      </div>
      {/* Checklist requisiti */}
      <ul className='list-unstyled mb-0 mt-1' style={{ fontSize: '0.77rem', lineHeight: '1.6' }}>
        {s.checks.map((c, i) => (
          <li key={i} className={c.passed ? 'text-success' : 'text-muted'}>
            {c.passed ? '✓' : '○'} {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PasswordComplexityHint() {
  return (
    <small className='text-muted d-block mt-1' style={{ fontSize: '0.77rem' }}>
      Requisiti: min. 8 caratteri · maiuscola · minuscola · numero · carattere speciale
    </small>
  )
}

// ── Form vuoti ────────────────────────────────────────────────────────────────

const EMPTY_CREATE: AdminUserWrite = { first_name: '', last_name: '', email: '', password: '', is_active: true, mfa_required: false }
const EMPTY_EDIT:   AdminUserUpdate = { first_name: '', last_name: '', email: '', password: '', is_active: true, mfa_required: false }

// ── Componente principale ─────────────────────────────────────────────────────

export default function UtentiPage() {
  const [infoOpen, setInfoOpen] = useState(false)
  const [users, setUsers]     = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // Modal crea
  const [createOpen, setCreateOpen]     = useState(false)
  const [createForm, setCreateForm]     = useState<AdminUserWrite>(EMPTY_CREATE)
  const [createPwdConfirm, setCreatePwdConfirm] = useState('')
  const [createPwdMatchErr, setCreatePwdMatchErr] = useState<string | null>(null)
  const [createErrors, setCreateErrors] = useState<Record<string, string[]>>({})
  const [createMsg, setCreateMsg]       = useState<string | null>(null)
  const [creating, setCreating]         = useState(false)

  // Modal modifica
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [editOpen, setEditOpen]     = useState(false)
  const [editForm, setEditForm]     = useState<AdminUserUpdate>(EMPTY_EDIT)
  const [editPwdConfirm, setEditPwdConfirm] = useState('')
  const [editPwdMatchErr, setEditPwdMatchErr] = useState<string | null>(null)
  const [editErrors, setEditErrors] = useState<Record<string, string[]>>({})
  const [editMsg, setEditMsg]       = useState<string | null>(null)
  const [editing, setEditing]       = useState(false)

  // Confirm disattiva
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null)
  const [deactivateMsg, setDeactivateMsg]         = useState<string | null>(null)
  const [deactivating, setDeactivating]           = useState(false)

  // Confirm reset MFA
  const [resetMfaTarget, setResetMfaTarget] = useState<AdminUser | null>(null)
  const [resetting, setResetting]           = useState(false)

  // Modal minori assegnati
  const [minoriTarget,    setMinoriTarget]    = useState<AdminUser | null>(null)
  const [minoriFacilities, setMinoriFacilities] = useState<Facility[]>([])
  const [minoriFacilityId, setMinoriFacilityId] = useState<number>(0)
  const [minoriAll,        setMinoriAll]        = useState<Minor[]>([])
  const [minoriAssegnati,  setMinoriAssegnati]  = useState<MinorAssignment[]>([])
  const [minoriSelected,   setMinoriSelected]   = useState<number[]>([])
  const [minoriLoading,    setMinoriLoading]    = useState(false)
  const [minoriSaving,     setMinoriSaving]     = useState(false)
  const [minoriError,      setMinoriError]      = useState<string | null>(null)
  // Lista filtrata per struttura selezionata (0 = tutte)
  const minoriVisibili = minoriFacilityId
    ? minoriAll.filter((m) => m.facility_id === minoriFacilityId)
    : minoriAll

  // ── Wizard educatore ───────────────────────────────────────────────────────
  type WizardStep = 1 | 2 | '3A' | '3B'
  const [wizardOpen, setWizardOpen]           = useState(false)
  const [wizardStep, setWizardStep]           = useState<WizardStep>(1)
  const [wizardFacilities, setWizardFacilities] = useState<Facility[]>([])
  const [wizardFacilityId, setWizardFacilityId] = useState<number>(0)
  const [wizardQ, setWizardQ]                 = useState('')
  const [linkable, setLinkable]               = useState<StaffMember[]>([])
  const [linkableLoading, setLinkableLoading] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
  const [wizardAccount, setWizardAccount]     = useState({ first_name: '', last_name: '', email: '', password: '', confirm: '' })
  const [wizardNewStaff, setWizardNewStaff]   = useState({ facility_id: 0, employee_code: '', qualification: '' })
  const [wizardPwdMatchErr, setWizardPwdMatchErr] = useState<string | null>(null)
  const [wizardMsg, setWizardMsg]             = useState<string | null>(null)
  const [wizardSaving, setWizardSaving]       = useState(false)


  // Ruoli disponibili (caricati al mount, usati in crea e modifica)
  const [roles,     setRoles]     = useState<Role[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])

  // Selezione ruolo nel modal crea
  const [createRoleFacilityId, setCreateRoleFacilityId] = useState<number>(0)
  const [createRoleId,         setCreateRoleId]         = useState<number>(0)

  // Aggiunta ruolo nel modal modifica
  const [editRoleFacilityId,   setEditRoleFacilityId]   = useState<number>(0)
  const [editRoleId,           setEditRoleId]           = useState<number>(0)
  const [editRoleAssigning,    setEditRoleAssigning]     = useState(false)
  const [editRoleMsg,          setEditRoleMsg]           = useState<string | null>(null)


  // Carica ruoli e strutture al mount (necessari per i modal crea/modifica)
  useEffect(() => {
    Promise.all([lookupsApi.roles(), facilityApi.list()])
      .then(([r, f]) => { setRoles(r); setFacilities(f) })
      .catch(() => { /* non bloccante */ })
  }, [])

  const openMinoriModal = async (u: AdminUser) => {
    setMinoriTarget(u)
    setMinoriFacilityId(0)
    setMinoriAll([])
    setMinoriAssegnati([])
    setMinoriSelected([])
    setMinoriError(null)

    // Strutture già caricate al mount — disponibili subito
    setMinoriFacilities(facilities.length > 0 ? facilities : await facilityApi.list().catch(() => []))

    // Carica tutti i minori subito (il filtro struttura è solo visivo)
    setMinoriLoading(true)
    const [, ] = await Promise.allSettled([
      minorApi.list()
        .then((raw) => {
          const all: Minor[] = Array.isArray(raw) ? raw : ((raw as { data?: Minor[] })?.data ?? [])
          setMinoriAll(all)
        })
        .catch(() => setMinoriAll([])),

      minorAssignmentApi.assignedMinors(u.id)
        .then((assegnati) => {
          const arr: MinorAssignment[] = Array.isArray(assegnati) ? assegnati : []
          setMinoriAssegnati(arr)
          setMinoriSelected(arr.filter((a) => a.is_active).map((a) => a.minor_id))
        })
        .catch((e) => {
          const status = (e as { response?: { status?: number } })?.response?.status
          if (status === 404) {
            setMinoriError('Endpoint assegnazioni non ancora attivo sul backend (404).')
          } else {
            setMinoriError(apiError(e).message ?? 'Errore caricamento assegnazioni')
          }
        }),
    ])
    setMinoriLoading(false)
  }

  // Non più usato come gate — mantenuto per retrocompatibilità eventuale
  const loadMinoriForFacility = async (facilityId: number) => {
    setMinoriLoading(true)
    try {
      const raw = await minorApi.list()
      const all: Minor[] = Array.isArray(raw) ? raw : ((raw as { data?: Minor[] })?.data ?? [])
      setMinoriAll(facilityId ? all.filter((m) => m.facility_id === facilityId) : all)
    } catch { setMinoriAll([]) }
    finally { setMinoriLoading(false) }
  }

  const toggleMinore = (id: number) =>
    setMinoriSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const handleSaveMinori = async () => {
    if (!minoriTarget) return
    if (!minoriFacilityId) {
      toast.warning('Seleziona una struttura prima di salvare le assegnazioni.')
      return
    }
    setMinoriSaving(true)
    try {
      await minorAssignmentApi.bulkSyncFromUser(minoriTarget.id, {
        facility_id: minoriFacilityId,
        minor_ids:   minoriSelected,
        valid_from:  new Date().toISOString().slice(0, 10),
        is_active:   true,
      })
      toast.success('Assegnazioni minori aggiornate con successo.')
      // Ricarica assegnazioni per riflettere lo stato reale dal backend
      try {
        const fresh = await minorAssignmentApi.assignedMinors(minoriTarget.id)
        const arr: MinorAssignment[] = Array.isArray(fresh) ? fresh : []
        setMinoriAssegnati(arr)
        setMinoriSelected(arr.filter((a) => a.is_active).map((a) => a.minor_id))
      } catch { /* ignora errore reload */ }
      setMinoriTarget(null)
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore salvataggio')
    } finally {
      setMinoriSaving(false)
    }
  }

  const openWizard = async () => {
    setWizardStep(1)
    setWizardAccount({ first_name: '', last_name: '', email: '', password: '', confirm: '' })
    setWizardNewStaff({ facility_id: 0, employee_code: '', qualification: '' })
    setWizardQ('')
    setWizardFacilityId(0)
    setSelectedStaffId(null)
    setLinkable([])
    setWizardMsg(null)
    setWizardPwdMatchErr(null)
    try {
      const facs = await facilityApi.list()
      setWizardFacilities(facs)
    } catch { /* non bloccante */ }
    setWizardOpen(true)
  }

  const loadLinkable = async (facilityId: number, q: string) => {
    setLinkableLoading(true)
    try {
      const results = await adminUserApi.linkableStaffMembers({
        facility_id: facilityId || undefined,
        q: q || undefined,
      })
      setLinkable(results)
    } catch { setLinkable([]) }
    finally { setLinkableLoading(false) }
  }

  const goToStep3A = () => {
    setWizardStep('3A')
    loadLinkable(wizardFacilityId, wizardQ)
  }

  const handleWizardSubmit = async () => {
    if (wizardAccount.password !== wizardAccount.confirm) {
      setWizardPwdMatchErr('Le password non coincidono')
      return
    }
    setWizardSaving(true)
    setWizardMsg(null)
    try {
      const payload: EducatorAccountPayload = {
        first_name: wizardAccount.first_name,
        last_name:  wizardAccount.last_name,
        email:      wizardAccount.email,
        password:   wizardAccount.password,
        ...(wizardStep === '3A'
          ? { staff_member_id: selectedStaffId }
          : {
              staff_member: {
                facility_id:   wizardNewStaff.facility_id,
                employee_code: wizardNewStaff.employee_code,
                first_name:    wizardAccount.first_name,
                last_name:     wizardAccount.last_name,
                email:         wizardAccount.email,
                qualification: wizardNewStaff.qualification || null,
              },
            }),
      }
      await adminUserApi.createEducatorAccount(payload)
      toast.success('Account educatore creato')
      setWizardOpen(false)
      load()
    } catch (e) {
      const ae = apiError(e)
      setWizardMsg(ae.message ?? 'Errore creazione')
    } finally {
      setWizardSaving(false)
    }
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setUsers(await adminUserApi.list())
    } catch (e) {
      setError(apiError(e).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Apertura modal crea ────────────────────────────────────────────────────

  const openCreate = () => {
    setCreateForm(EMPTY_CREATE)
    setCreatePwdConfirm('')
    setCreatePwdMatchErr(null)
    setCreateErrors({})
    setCreateMsg(null)
    setCreateRoleFacilityId(0)
    setCreateRoleId(0)
    setCreateOpen(true)
  }

  // ── Salvataggio crea ──────────────────────────────────────────────────────

  const handleCreate = async () => {
    // Validazione client-side: conferma password
    if (createForm.password !== createPwdConfirm) {
      setCreatePwdMatchErr('Le password non corrispondono.')
      return
    }
    setCreatePwdMatchErr(null)
    setCreating(true)
    setCreateErrors({})
    setCreateMsg(null)
    try {
      const newUser = await adminUserApi.create(createForm)
      // Se è stato selezionato struttura + ruolo, crea l'assegnazione immediatamente
      if (createRoleFacilityId && createRoleId) {
        try {
          await assignmentApi.create({
            user_id:     newUser.id,
            facility_id: createRoleFacilityId,
            role_id:     createRoleId,
            valid_from:  new Date().toISOString().slice(0, 10),
            is_active:   true,
          })
          toast.success('Utente creato e ruolo assegnato')
        } catch {
          toast.success('Utente creato')
          toast.warning('Ruolo non assegnato: verifica in Assegnazioni')
        }
      } else {
        toast.success('Utente creato')
      }
      setCreateOpen(false)
      load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.errors) setCreateErrors(ae.errors)
      else if (ae.status === 403) setCreateMsg(errorMessage(ae))
      else setCreateMsg(ae.message ?? 'Errore creazione')
    } finally {
      setCreating(false)
    }
  }

  // ── Apertura modal modifica ───────────────────────────────────────────────

  const openEdit = (u: AdminUser) => {
    setEditTarget(u)
    setEditForm({ first_name: u.first_name, last_name: u.last_name, email: u.email, password: '', is_active: u.is_active, mfa_required: u.mfa_required })
    setEditPwdConfirm('')
    setEditPwdMatchErr(null)
    setEditErrors({})
    setEditMsg(null)
    // Pre-valorizza il ruolo con quello corrente dell'utente (il primo/unico)
    const activeRole = u.user_facility_roles?.find((fr) => fr.is_active !== false)
    const currentRoleId = activeRole?.role?.id ?? 0
    setEditRoleId(currentRoleId)
    setEditRoleFacilityId(0)
    setEditRoleMsg(null)
    setEditOpen(true)
  }

  // Cambia il ruolo dell'utente.
  // Strategia: UPDATE sempre sul primo record esistente (attivo o meno) per non creare duplicati.
  // Solo se l'utente non ha MAI avuto assegnazioni → CREATE.
  const handleAssignRole = async () => {
    if (!editTarget || !editRoleId) return
    // Prendi il primo record disponibile (attivo o revocato) — aggiornarlo è più sicuro che crearne uno nuovo
    const anyAssignment = editTarget.user_facility_roles?.[0]
    setEditRoleAssigning(true)
    setEditRoleMsg(null)
    try {
      if (anyAssignment) {
        const facilityId = anyAssignment.facility?.id ?? facilities[0]?.id
        if (!facilityId) {
          setEditRoleMsg('Nessuna struttura disponibile nel sistema.')
          setEditRoleAssigning(false)
          return
        }
        // UPDATE del record esistente: cambia solo il ruolo, riattiva se era revocato
        await assignmentApi.update(anyAssignment.id, {
          user_id:     editTarget.id,
          facility_id: facilityId,
          role_id:     editRoleId,
          valid_from:  anyAssignment.valid_from ?? new Date().toISOString().slice(0, 10),
          valid_to:    null,
          is_active:   true,
        })
        // Se esistono altri record oltre al primo, segnala al backend (non possiamo cancellarli dal frontend)
        if ((editTarget.user_facility_roles?.length ?? 0) > 1) {
          toast.warning('Rilevati record multipli: contattare il backend per pulizia dati.')
        }
      } else {
        // Prima volta assoluta: CREATE
        const facilityId = facilities[0]?.id
        if (!facilityId) {
          setEditRoleMsg('Nessuna struttura disponibile nel sistema.')
          setEditRoleAssigning(false)
          return
        }
        await assignmentApi.create({
          user_id:     editTarget.id,
          facility_id: facilityId,
          role_id:     editRoleId,
          valid_from:  new Date().toISOString().slice(0, 10),
          is_active:   true,
        })
      }
      toast.success('Ruolo aggiornato')
      load()
      const updated = await adminUserApi.list()
      const found = updated.find((u) => u.id === editTarget.id)
      if (found) {
        setEditTarget(found)
        setEditRoleId(found.user_facility_roles?.find((fr) => fr.is_active !== false)?.role?.id ?? 0)
      }
    } catch (e) {
      const ae = apiError(e)
      setEditRoleMsg(ae.message ?? 'Errore cambio ruolo')
    } finally {
      setEditRoleAssigning(false)
    }
  }

  // Revoca un'assegnazione ruolo dalla modal modifica
  const handleRevokeRole = async (assignmentId: number) => {
    if (!editTarget) return
    try {
      await assignmentApi.revoke(assignmentId)
      toast.success('Ruolo revocato')
      load()
      const updated = await adminUserApi.list()
      const found = updated.find((u) => u.id === editTarget.id)
      if (found) setEditTarget(found)
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore revoca ruolo')
    }
  }

  // ── Salvataggio modifica ──────────────────────────────────────────────────

  const handleEdit = async () => {
    // Validazione client-side: conferma password (solo se sta cambiando la password)
    if (editForm.password) {
      if (editForm.password !== editPwdConfirm) {
        setEditPwdMatchErr('Le password non corrispondono.')
        return
      }
    }
    setEditPwdMatchErr(null)
    setEditing(true)
    setEditErrors({})
    setEditMsg(null)
    try {
      const payload: AdminUserUpdate = { ...editForm }
      if (!payload.password) delete payload.password
      await adminUserApi.update(editTarget!.id, payload)
      toast.success('Utente aggiornato')
      setEditOpen(false)
      load()
    } catch (e) {
      const ae = apiError(e)
      if (ae.errors) setEditErrors(ae.errors)
      else if (ae.status === 403) setEditMsg(errorMessage(ae))
      else setEditMsg(ae.message ?? 'Errore aggiornamento')
    } finally {
      setEditing(false)
    }
  }

  // ── Disattiva / Reset MFA ─────────────────────────────────────────────────

  const handleDeactivate = async () => {
    if (!deactivateTarget) return
    setDeactivating(true)
    setDeactivateMsg(null)
    try {
      await adminUserApi.deactivate(deactivateTarget.id)
      toast.success('Utente disattivato')
      setDeactivateTarget(null)
      load()
    } catch (e) {
      const ae = apiError(e)
      setDeactivateMsg(ae.status === 403 ? errorMessage(ae) : (ae.message ?? 'Errore disattivazione'))
    } finally {
      setDeactivating(false)
    }
  }

  const handleResetMfa = async () => {
    if (!resetMfaTarget) return
    setResetting(true)
    try {
      await adminUserApi.resetMfa(resetMfaTarget.id)
      toast.success('MFA azzerata')
      setResetMfaTarget(null)
      load()
    } catch (e) {
      toast.error(apiError(e).message ?? 'Errore reset MFA')
    } finally {
      setResetting(false)
    }
  }

  // ── Helpers errori ────────────────────────────────────────────────────────

  const cErr = (f: string) => createErrors[f]?.[0]
  const eErr = (f: string) => editErrors[f]?.[0]

  // Traduce i messaggi tecnici del backend per la password in italiano esplicito
  const humanizePwdError = (msg: string): string => {
    if (/8 characters/i.test(msg))                         return 'La password deve essere di almeno 8 caratteri.'
    if (/uppercase/i.test(msg) || /maiuscol/i.test(msg))  return 'La password deve contenere almeno una lettera maiuscola.'
    if (/lowercase/i.test(msg) || /minuscol/i.test(msg))  return 'La password deve contenere almeno una lettera minuscola.'
    if (/number|digit|numero/i.test(msg))                  return 'La password deve contenere almeno un numero.'
    if (/special|symbol|speciale/i.test(msg))              return 'La password deve contenere almeno un carattere speciale (es. !@#$%).'
    if (/confirmed|conferma/i.test(msg))                   return 'Le password non corrispondono.'
    return msg
  }

  const rolesLabel = (u: AdminUser) => {
    const roles = u.user_facility_roles?.filter((fr) => fr.is_active !== false).map((fr) => fr.role?.name).filter(Boolean) ?? []
    if (roles.length === 0) return <span className='text-muted'>—</span>
    return roles.slice(0, 2).map((r, i) => (
      <span key={i} className='badge bg-light text-dark me-1'>{r}</span>
    ))
  }

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <>
      <Container fluid>
        <div className='page-title'>
          <Row>
            <Col xs='6'>
                <div className='d-flex align-items-center gap-2'>
                  <h3 className='mb-0'>Utenti di sistema</h3>
                  <Button color='light' size='sm' className='d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
                    <Info size={13} /> Informazioni
                  </Button>
                </div>
              </Col>
            <Col xs='6'>
              <ol className='breadcrumb'>
                <li className='breadcrumb-item'><Link to='/dashboard'><Home size={14} /></Link></li>
                <li className='breadcrumb-item active'>Utenti di sistema</li>
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
                <h5 className='mb-0'>Utenti di sistema</h5>
                <div className='d-flex gap-2'>
                  <Button color='outline-secondary' size='sm' className='d-flex align-items-center gap-1' onClick={openWizard}>
                    <Plus size={14} /> Account educatore
                  </Button>
                  <Button color='primary' size='sm' className='d-flex align-items-center gap-1' onClick={openCreate}>
                    <Plus size={14} /> Nuovo utente
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {error && <Alert color='danger'>{error}</Alert>}
                {loading ? (
                  <div className='text-center py-5'><div className='loader' /></div>
                ) : users.length === 0 ? (
                  <p className='text-muted text-center py-4'>Nessun utente presente.</p>
                ) : (
                  <div className='table-responsive'>
                    <table className='table table-hover'>
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Email</th>
                          <th>Attivo</th>
                          <th>MFA richiesta</th>
                          <th>MFA confermata</th>
                          <th>Ultimo accesso</th>
                          <th>Ruoli assegnati</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td>{u.first_name} {u.last_name}</td>
                            <td>{u.email}</td>
                            <td>
                              {u.is_active
                                ? <span className='badge bg-success'>Sì</span>
                                : <span className='badge bg-secondary'>No</span>}
                            </td>
                            <td>
                              {u.mfa_required
                                ? <span className='badge bg-warning text-dark'>Sì</span>
                                : <span className='badge bg-light text-dark'>No</span>}
                            </td>
                            <td>
                              {u.mfa_confirmed_at
                                ? <span className='badge bg-success'>Sì</span>
                                : <span className='badge bg-light text-dark'>No</span>}
                            </td>
                            <td>{u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('it-IT') : '—'}</td>
                            <td>{rolesLabel(u)}</td>
                            <td>
                              <div className='d-flex gap-1'>
                                <button className='btn btn-sm btn-outline-primary' onClick={() => openEdit(u)} title='Modifica'>
                                  <Edit2 size={13} />
                                </button>
                                <button className='btn btn-sm btn-outline-warning' onClick={() => { setDeactivateTarget(u); setDeactivateMsg(null) }} title='Disattiva' disabled={!u.is_active}>
                                  <UserX size={13} />
                                </button>
                                <button className='btn btn-sm btn-outline-secondary' onClick={() => setResetMfaTarget(u)} title='Reset MFA' disabled={!u.mfa_required}>
                                  <RefreshCw size={13} />
                                </button>
                                <button className='btn btn-sm btn-outline-info' onClick={() => openMinoriModal(u)} title='Minori assegnati'>
                                  <List size={13} />
                                </button>
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

      {/* ── Modal crea utente ── */}
      <Modal isOpen={createOpen} toggle={() => setCreateOpen(false)}>
        <ModalHeader toggle={() => setCreateOpen(false)}>Nuovo utente</ModalHeader>
        <ModalBody>
          {createMsg && <Alert color='danger'>{createMsg}</Alert>}

          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Nome <span className='text-danger'>*</span></Label>
                <Input
                  value={createForm.first_name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, first_name: e.target.value }))}
                  invalid={!!cErr('first_name')}
                />
                {cErr('first_name') && <div className='invalid-feedback d-block'>{cErr('first_name')}</div>}
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Cognome <span className='text-danger'>*</span></Label>
                <Input
                  value={createForm.last_name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, last_name: e.target.value }))}
                  invalid={!!cErr('last_name')}
                />
                {cErr('last_name') && <div className='invalid-feedback d-block'>{cErr('last_name')}</div>}
              </FormGroup>
            </Col>
          </Row>

          <FormGroup>
            <Label>Email <span className='text-danger'>*</span></Label>
            <Input
              type='email'
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              invalid={!!cErr('email')}
            />
            {cErr('email') && <div className='invalid-feedback d-block'>{cErr('email')}</div>}
          </FormGroup>

          {/* Password */}
          <FormGroup>
            <Label>Password <span className='text-danger'>*</span></Label>
            <Input
              type='password'
              value={createForm.password}
              onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
              invalid={!!cErr('password')}
              placeholder='••••••••'
              autoComplete='new-password'
            />
            {/* Indicatore forza */}
            <PasswordStrengthBar password={createForm.password} />
            {/* Hint requisiti (solo se la barra non è visibile) */}
            {!createForm.password && <PasswordComplexityHint />}
            {/* Errore backend password */}
            {cErr('password') && (
              <div className='invalid-feedback d-block mt-2'>
                {humanizePwdError(cErr('password')!)}
              </div>
            )}
          </FormGroup>

          {/* Conferma password */}
          <FormGroup>
            <Label>Conferma password <span className='text-danger'>*</span></Label>
            <Input
              type='password'
              value={createPwdConfirm}
              onChange={(e) => { setCreatePwdConfirm(e.target.value); setCreatePwdMatchErr(null) }}
              invalid={!!createPwdMatchErr}
              placeholder='••••••••'
              autoComplete='new-password'
            />
            {createPwdMatchErr && (
              <div className='invalid-feedback d-block'>{createPwdMatchErr}</div>
            )}
            {!createPwdMatchErr && createPwdConfirm && createPwdConfirm === createForm.password && (
              <small className='text-success'>✓ Le password corrispondono</small>
            )}
          </FormGroup>

          <Row>
            <Col xs='6'>
              <FormGroup check>
                <Input type='checkbox' id='create-active' checked={createForm.is_active} onChange={(e) => setCreateForm((p) => ({ ...p, is_active: e.target.checked }))} />
                <Label check for='create-active'>Attivo</Label>
              </FormGroup>
            </Col>
            <Col xs='6'>
              <FormGroup check>
                <Input type='checkbox' id='create-mfa' checked={createForm.mfa_required} onChange={(e) => setCreateForm((p) => ({ ...p, mfa_required: e.target.checked }))} />
                <Label check for='create-mfa'>MFA richiesta</Label>
              </FormGroup>
            </Col>
          </Row>

        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleCreate} disabled={creating}>{creating ? 'Creazione…' : 'Crea'}</Button>
          <Button color='light' onClick={() => setCreateOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal modifica utente ── */}
      <Modal isOpen={editOpen} toggle={() => setEditOpen(false)}>
        <ModalHeader toggle={() => setEditOpen(false)}>Modifica utente</ModalHeader>
        <ModalBody>
          {editMsg && <Alert color='danger'>{editMsg}</Alert>}

          <Row>
            <Col md='6'>
              <FormGroup>
                <Label>Nome <span className='text-danger'>*</span></Label>
                <Input
                  value={editForm.first_name}
                  onChange={(e) => setEditForm((p) => ({ ...p, first_name: e.target.value }))}
                  invalid={!!eErr('first_name')}
                />
                {eErr('first_name') && <div className='invalid-feedback d-block'>{eErr('first_name')}</div>}
              </FormGroup>
            </Col>
            <Col md='6'>
              <FormGroup>
                <Label>Cognome <span className='text-danger'>*</span></Label>
                <Input
                  value={editForm.last_name}
                  onChange={(e) => setEditForm((p) => ({ ...p, last_name: e.target.value }))}
                  invalid={!!eErr('last_name')}
                />
                {eErr('last_name') && <div className='invalid-feedback d-block'>{eErr('last_name')}</div>}
              </FormGroup>
            </Col>
          </Row>

          <FormGroup>
            <Label>Email <span className='text-danger'>*</span></Label>
            <Input
              type='email'
              value={editForm.email}
              onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
              invalid={!!eErr('email')}
            />
            {eErr('email') && <div className='invalid-feedback d-block'>{eErr('email')}</div>}
          </FormGroup>

          {/* Nuova password (opzionale) */}
          <FormGroup>
            <Label>
              Nuova password{' '}
              <small className='text-muted'>(lascia vuoto per non cambiare)</small>
            </Label>
            <Input
              type='password'
              value={editForm.password ?? ''}
              onChange={(e) => { setEditForm((p) => ({ ...p, password: e.target.value })); setEditPwdMatchErr(null) }}
              invalid={!!eErr('password')}
              placeholder='••••••••'
              autoComplete='new-password'
            />
            {/* Indicatore forza (solo quando sta digitando) */}
            {editForm.password ? (
              <PasswordStrengthBar password={editForm.password} />
            ) : (
              <PasswordComplexityHint />
            )}
            {eErr('password') && (
              <div className='invalid-feedback d-block mt-2'>
                {humanizePwdError(eErr('password')!)}
              </div>
            )}
          </FormGroup>

          {/* Conferma password (solo se sta digitando una nuova password) */}
          {!!editForm.password && (
            <FormGroup>
              <Label>Conferma nuova password <span className='text-danger'>*</span></Label>
              <Input
                type='password'
                value={editPwdConfirm}
                onChange={(e) => { setEditPwdConfirm(e.target.value); setEditPwdMatchErr(null) }}
                invalid={!!editPwdMatchErr}
                placeholder='••••••••'
                autoComplete='new-password'
              />
              {editPwdMatchErr && (
                <div className='invalid-feedback d-block'>{editPwdMatchErr}</div>
              )}
              {!editPwdMatchErr && editPwdConfirm && editPwdConfirm === editForm.password && (
                <small className='text-success'>✓ Le password corrispondono</small>
              )}
            </FormGroup>
          )}

          <Row>
            <Col xs='6'>
              <FormGroup check>
                <Input type='checkbox' id='edit-active' checked={editForm.is_active ?? true} onChange={(e) => setEditForm((p) => ({ ...p, is_active: e.target.checked }))} />
                <Label check for='edit-active'>Attivo</Label>
              </FormGroup>
            </Col>
            <Col xs='6'>
              <FormGroup check>
                <Input type='checkbox' id='edit-mfa' checked={editForm.mfa_required ?? false} onChange={(e) => setEditForm((p) => ({ ...p, mfa_required: e.target.checked }))} />
                <Label check for='edit-mfa'>MFA richiesta</Label>
              </FormGroup>
            </Col>
          </Row>

          {/* ── Ruolo ── */}
          <hr className='my-3' />
          <FormGroup>
            <Label><strong>Ruolo</strong></Label>
            {editRoleMsg && <Alert color='danger' className='py-2 mb-2'>{editRoleMsg}</Alert>}
            <Row className='g-2 align-items-center'>
              <Col>
                <Input
                  type='select'
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(Number(e.target.value))}
                >
                  <option value={0}>— Seleziona ruolo —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Input>
              </Col>
              <Col xs='auto'>
                <Button
                  color='primary'
                  disabled={!editRoleId || editRoleAssigning}
                  onClick={handleAssignRole}
                >
                  {editRoleAssigning ? 'Salvataggio…' : 'Cambia ruolo'}
                </Button>
              </Col>
            </Row>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color='primary' onClick={handleEdit} disabled={editing}>{editing ? 'Salvataggio…' : 'Salva'}</Button>
          <Button color='light' onClick={() => setEditOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal disattiva ── */}
      <Modal isOpen={!!deactivateTarget} toggle={() => setDeactivateTarget(null)}>
        <ModalHeader toggle={() => setDeactivateTarget(null)}>Disattiva utente</ModalHeader>
        <ModalBody>
          {deactivateMsg && <Alert color='danger'>{deactivateMsg}</Alert>}
          {!deactivateMsg && (
            <p>Disattivare <strong>{deactivateTarget?.first_name} {deactivateTarget?.last_name}</strong>? L&apos;utente non potrà più accedere al sistema.</p>
          )}
        </ModalBody>
        <ModalFooter>
          {!deactivateMsg && (
            <Button color='warning' onClick={handleDeactivate} disabled={deactivating}>{deactivating ? 'Disattivazione…' : 'Disattiva'}</Button>
          )}
          <Button color='light' onClick={() => setDeactivateTarget(null)}>{deactivateMsg ? 'Chiudi' : 'Annulla'}</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal reset MFA ── */}
      <Modal isOpen={!!resetMfaTarget} toggle={() => setResetMfaTarget(null)}>
        <ModalHeader toggle={() => setResetMfaTarget(null)}>Reset MFA</ModalHeader>
        <ModalBody>
          <p>Azzerare la configurazione MFA di <strong>{resetMfaTarget?.first_name} {resetMfaTarget?.last_name}</strong>? L&apos;utente dovrà riconfigurare l&apos;autenticazione a due fattori al prossimo accesso.</p>
        </ModalBody>
        <ModalFooter>
          <Button color='secondary' onClick={handleResetMfa} disabled={resetting}>{resetting ? 'Reset…' : 'Conferma reset'}</Button>
          <Button color='light' onClick={() => setResetMfaTarget(null)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── Wizard account educatore ── */}
      <Modal isOpen={wizardOpen} toggle={() => setWizardOpen(false)} size='lg'>
        <ModalHeader toggle={() => setWizardOpen(false)}>Crea account educatore</ModalHeader>
        <ModalBody>
          {wizardMsg && <Alert color='danger'>{wizardMsg}</Alert>}

          {wizardStep === 1 && (
            <div>
              <p>Inserisci i dati dell&apos;account che verrà creato:</p>
              <Row>
                <Col md='6'>
                  <FormGroup>
                    <Label>Nome <span className='text-danger'>*</span></Label>
                    <Input value={wizardAccount.first_name} onChange={(e) => setWizardAccount((p) => ({ ...p, first_name: e.target.value }))} />
                  </FormGroup>
                </Col>
                <Col md='6'>
                  <FormGroup>
                    <Label>Cognome <span className='text-danger'>*</span></Label>
                    <Input value={wizardAccount.last_name} onChange={(e) => setWizardAccount((p) => ({ ...p, last_name: e.target.value }))} />
                  </FormGroup>
                </Col>
              </Row>
              <FormGroup>
                <Label>Email <span className='text-danger'>*</span></Label>
                <Input type='email' value={wizardAccount.email} onChange={(e) => setWizardAccount((p) => ({ ...p, email: e.target.value }))} />
              </FormGroup>
              <FormGroup>
                <Label>Password <span className='text-danger'>*</span></Label>
                <Input type='password' value={wizardAccount.password} onChange={(e) => setWizardAccount((p) => ({ ...p, password: e.target.value }))} autoComplete='new-password' />
                <PasswordStrengthBar password={wizardAccount.password} />
              </FormGroup>
              <FormGroup>
                <Label>Conferma password <span className='text-danger'>*</span></Label>
                <Input type='password' value={wizardAccount.confirm} onChange={(e) => { setWizardAccount((p) => ({ ...p, confirm: e.target.value })); setWizardPwdMatchErr(null) }} invalid={!!wizardPwdMatchErr} autoComplete='new-password' />
                {wizardPwdMatchErr && <div className='invalid-feedback d-block'>{wizardPwdMatchErr}</div>}
              </FormGroup>
            </div>
          )}

          {wizardStep === 2 && (
            <div>
              <p>L&apos;educatore esiste già nell&apos;anagrafica o deve essere creato?</p>
              <div className='d-flex gap-3'>
                <Button color='outline-primary' onClick={goToStep3A}>Collega educatore esistente</Button>
                <Button color='outline-secondary' onClick={() => setWizardStep('3B')}>Crea nuova anagrafica educatore</Button>
              </div>
            </div>
          )}

          {wizardStep === '3A' && (
            <div>
              <p>Seleziona l&apos;educatore da collegare all&apos;account:</p>
              <Row className='mb-3'>
                <Col md='6'>
                  <Input type='select' value={wizardFacilityId} onChange={(e) => { setWizardFacilityId(Number(e.target.value)); loadLinkable(Number(e.target.value), wizardQ) }}>
                    <option value={0}>Tutte le strutture</option>
                    {wizardFacilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </Input>
                </Col>
                <Col md='6'>
                  <Input placeholder='Cerca per nome…' value={wizardQ} onChange={(e) => { setWizardQ(e.target.value); loadLinkable(wizardFacilityId, e.target.value) }} />
                </Col>
              </Row>
              {linkableLoading ? <div className='text-center py-3'><div className='loader' /></div> : (
                <div className='table-responsive'>
                  <table className='table table-hover table-sm'>
                    <thead><tr><th></th><th>Codice</th><th>Nome</th><th>Struttura</th></tr></thead>
                    <tbody>
                      {linkable.length === 0 && <tr><td colSpan={4} className='text-center text-muted'>Nessun educatore trovato</td></tr>}
                      {linkable.map((s) => (
                        <tr key={s.id} className={selectedStaffId === s.id ? 'table-primary' : ''} style={{ cursor: 'pointer' }} onClick={() => setSelectedStaffId(s.id)}>
                          <td><Input type='radio' checked={selectedStaffId === s.id} readOnly /></td>
                          <td><code>{s.employee_code}</code></td>
                          <td>{s.first_name} {s.last_name}</td>
                          <td>{s.facility?.name ?? `#${s.facility_id}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {wizardStep === '3B' && (
            <div>
              <p>Inserisci i dati dell&apos;anagrafica educatore da creare:</p>
              <Row>
                <Col md='6'>
                  <FormGroup>
                    <Label>Struttura <span className='text-danger'>*</span></Label>
                    <Input type='select' value={wizardNewStaff.facility_id} onChange={(e) => setWizardNewStaff((p) => ({ ...p, facility_id: Number(e.target.value) }))}>
                      <option value={0}>Seleziona…</option>
                      {wizardFacilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md='6'>
                  <FormGroup>
                    <Label>Codice dipendente <span className='text-danger'>*</span></Label>
                    <Input value={wizardNewStaff.employee_code} onChange={(e) => setWizardNewStaff((p) => ({ ...p, employee_code: e.target.value }))} />
                  </FormGroup>
                </Col>
                <Col md='12'>
                  <FormGroup>
                    <Label>Qualifica</Label>
                    <Input value={wizardNewStaff.qualification} onChange={(e) => setWizardNewStaff((p) => ({ ...p, qualification: e.target.value }))} />
                  </FormGroup>
                </Col>
              </Row>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {wizardStep === 1 && (
            <Button color='primary' onClick={() => setWizardStep(2)}>Avanti</Button>
          )}
          {wizardStep === 2 && (
            <Button color='light' onClick={() => setWizardStep(1)}>Indietro</Button>
          )}
          {(wizardStep === '3A' || wizardStep === '3B') && (
            <>
              <Button color='primary' onClick={handleWizardSubmit} disabled={wizardSaving}>{wizardSaving ? 'Creazione…' : 'Crea account'}</Button>
              <Button color='light' onClick={() => setWizardStep(2)}>Indietro</Button>
            </>
          )}
          <Button color='light' onClick={() => setWizardOpen(false)}>Annulla</Button>
        </ModalFooter>
      </Modal>

      {/* ── Modal minori assegnati ── */}
      <Modal isOpen={!!minoriTarget} toggle={() => setMinoriTarget(null)} size='xl'>
        <ModalHeader toggle={() => setMinoriTarget(null)}>
          Minori assegnati — {minoriTarget?.last_name} {minoriTarget?.first_name}
        </ModalHeader>
        <ModalBody>
          {minoriError && (
            <div className='alert alert-warning mb-3'>
              <strong>Attenzione:</strong> {minoriError}
            </div>
          )}
          <Row className='mb-3 align-items-end'>
            <Col md='5'>
              <Label className='form-label mb-1'>
                Struttura <span className='text-danger'>*</span>
                <small className='text-muted fw-normal ms-1'>(richiesta per salvare)</small>
              </Label>
              <Input type='select' value={minoriFacilityId}
                onChange={(e) => setMinoriFacilityId(Number(e.target.value))}>
                <option value={0}>— Tutte le strutture —</option>
                {minoriFacilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </Input>
            </Col>
            <Col md='7' className='d-flex align-items-end gap-2 justify-content-end'>
              <Button size='sm' color='light'
                onClick={() => setMinoriSelected(minoriVisibili.map((m) => m.id))}>
                Seleziona tutti
              </Button>
              <Button size='sm' color='light' onClick={() => setMinoriSelected([])}>
                Deseleziona tutti
              </Button>
            </Col>
          </Row>

          {minoriLoading ? (
            <div className='text-center py-4'><div className='loader' /></div>
          ) : (
            <div className='table-responsive' style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table className='table table-hover table-sm'>
                <thead className='table-light sticky-top'>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th>Codice</th>
                    <th>Nome</th>
                    <th>Struttura</th>
                    <th>Stato</th>
                    <th>Assegnato</th>
                  </tr>
                </thead>
                <tbody>
                  {minoriVisibili.length === 0 && (
                    <tr><td colSpan={6} className='text-center text-muted py-3'>
                      {minoriAll.length === 0 ? 'Nessun minore nel sistema.' : 'Nessun minore per la struttura selezionata.'}
                    </td></tr>
                  )}
                  {minoriVisibili.map((m) => {
                    const assegnazione = minoriAssegnati.find((a) => a.minor_id === m.id)
                    const checked = minoriSelected.includes(m.id)
                    return (
                      <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => toggleMinore(m.id)}>
                        <td>
                          <Input type='checkbox' checked={checked}
                            onChange={() => toggleMinore(m.id)} onClick={(e) => e.stopPropagation()} />
                        </td>
                        <td><code>{m.internal_code}</code></td>
                        <td>{m.last_name} {m.first_name}</td>
                        <td><small className='text-muted'>{m.facility?.name ?? `#${m.facility_id}`}</small></td>
                        <td><small>{m.minor_status?.name ?? '—'}</small></td>
                        <td>
                          {assegnazione?.is_active
                            ? <span className='badge bg-success'>Sì</span>
                            : <span className='badge bg-light text-dark'>No</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <small className='text-muted'>
            {minoriSelected.length} minor{minoriSelected.length === 1 ? 'e' : 'i'} selezionat{minoriSelected.length === 1 ? 'o' : 'i'}
            {minoriFacilityId === 0 && minoriSelected.length > 0 && (
              <span className='text-warning ms-2'>⚠ Seleziona una struttura per salvare</span>
            )}
          </small>
          </ModalBody>
          <ModalFooter>
            <Button color='primary' onClick={handleSaveMinori} disabled={minoriSaving}>
              {minoriSaving ? 'Salvataggio…' : 'Salva assegnazioni'}
            </Button>
            <Button color='light' onClick={() => setMinoriTarget(null)}>Annulla</Button>
          </ModalFooter>
        </Modal>

      <InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Guida — Utenti'>
        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Tre piani di configurazione</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            Ogni utente opera su tre livelli distinti:
          </p>
          <ol style={{ fontSize: 14, color: '#444', paddingLeft: 20 }}>
            <li><strong>Utente</strong>: credenziali, email, MFA</li>
            <li><strong>Ruolo</strong>: cosa può fare (permessi)</li>
            <li><strong>Struttura</strong>: in quale struttura opera</li>
          </ol>
          <p style={{ fontSize: 14, color: '#444' }}>
            Un utente può avere ruoli diversi in strutture diverse, ma un solo ruolo attivo per struttura.
          </p>
        </section>

        <section className='mb-4'>
          <h6 className='fw-bold mb-2'>Stato utente</h6>
          <table className='table table-sm table-bordered' style={{ fontSize: 13 }}>
            <thead className='table-light'>
              <tr><th>Stato</th><th>Significato</th></tr>
            </thead>
            <tbody>
              <tr><td><span className='badge bg-success'>Attivo</span></td><td>Accesso abilitato</td></tr>
              <tr><td><span className='badge bg-secondary'>Inattivo</span></td><td>Accesso disabilitato (non eliminato)</td></tr>
            </tbody>
          </table>
        </section>

        <section className='mb-3'>
          <h6 className='fw-bold mb-2'>Reset MFA</h6>
          <p style={{ fontSize: 14, color: '#444' }}>
            Il reset MFA revoca il dispositivo TOTP dell'utente. Al prossimo accesso verrà richiesto
            di registrare un nuovo dispositivo. Usare solo in caso di perdita del dispositivo.
          </p>
        </section>
      </InfoDrawer>
    </>
  )
}
