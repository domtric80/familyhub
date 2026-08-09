import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AppLayout from './layout/AppLayout'

// Auth
import LoginPage from './pages/auth/LoginPage'
import MfaSetupPage from './pages/auth/MfaSetupPage'
import MfaConfigPage from './pages/auth/MfaConfigPage'
import ProfiloPage from './pages/auth/ProfiloPage'

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage'

// Minori
import MinoriListPage from './pages/minori/MinoriListPage'
import MinoreDetailPage from './pages/minori/MinoreDetailPage'
import MinoreFormPage from './pages/minori/MinoreFormPage'

// Admin
import OrganizzazioniPage from './pages/admin/OrganizzazioniPage'
import StrutturePage from './pages/admin/StrutturePage'
import UtentiPage from './pages/admin/UtentiPage'
import AssegnazioniPage from './pages/admin/AssegnazioniPage'
import AssegnazioniMinoriPage from './pages/admin/AssegnazioniMinoriPage'
import AuditPage from './pages/admin/AuditPage'
import AuditKpiPage from './pages/admin/AuditKpiPage'
import BackupPage from './pages/admin/BackupPage'
import SistemaStoragePage from './pages/admin/SistemaStoragePage'
import SistemaHealthPage from './pages/admin/SistemaHealthPage'

// Anagrafiche
import GeografiaPage from './pages/anagrafiche/GeografiaPage'
import GeografiaSyncPage from './pages/anagrafiche/GeografiaSyncPage'
import ProviderGeografiaPage from './pages/anagrafiche/ProviderGeografiaPage'
import RuoliPage from './pages/anagrafiche/RuoliPage'
import DocumentAccessMatrixPage from './pages/anagrafiche/DocumentAccessMatrixPage'
import ScopeDocumentoPage from './pages/anagrafiche/ScopeDocumentoPage'
import TipiDocumentoPage from './pages/anagrafiche/TipiDocumentoPage'
import ClassificazioniPage from './pages/anagrafiche/ClassificazioniPage'
import TipiContattoPage from './pages/anagrafiche/TipiContattoPage'
import StatiMinorePage from './pages/anagrafiche/StatiMinorePage'
import GeneriPage from './pages/anagrafiche/GeneriPage'
import SessoPage from './pages/anagrafiche/SessoPage'
import TipiUscitaPage from './pages/anagrafiche/TipiUscitaPage'
import TipiAttivitaPage from './pages/anagrafiche/TipiAttivitaPage'
import QualificheOperatoriPage from './pages/anagrafiche/QualificheOperatoriPage'
import StatiOperatoriPage from './pages/anagrafiche/StatiOperatoriPage'
import StatiStrutturaPage from './pages/anagrafiche/StatiStrutturaPage'
import StatiDocumentiStaffPage from './pages/anagrafiche/StatiDocumentiStaffPage'
import EntiRilascioPage from './pages/anagrafiche/EntiRilascioPage'
import CittaDetailPage from './pages/anagrafiche/CittaDetailPage'
import TipiAvvicinamentoPage from './pages/anagrafiche/TipiAvvicinamentoPage'
import TipiDiarioPage from './pages/anagrafiche/TipiDiarioPage'

// Moduli operativi
import UscitePage from './pages/uscite/UscitePage'
import AttivitaPage from './pages/attivita/AttivitaPage'
import AvvicinamentiPage from './pages/avvicinamenti/AvvicinamentiPage'
import DiarioPage from './pages/diario/DiarioPage'
import EducatoriPage from './pages/educatori/EducatoriPage'
import PianificazionePage from './pages/turni/PianificazionePage'
import TimesheetPage from './pages/turni/TimesheetPage'
import ModelliTurnoPage from './pages/turni/ModelliTurnoPage'
import MiaSettimanaPage from './pages/turni/MiaSettimanaPage'
import MiePresentePage from './pages/turni/MiePresentePage'
import VerificaTimesheetPage from './pages/turni/VerificaTimesheetPage'
import TimesheetLockPage from './pages/turni/TimesheetLockPage'
import ExportPresenzePage from './pages/turni/ExportPresenzePage'
import MessaggiPage from './pages/messaggi/MessaggiPage'
import MessaggioDetailPage from './pages/messaggi/MessaggioDetailPage'

function MfaGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <>{children}</>
  if (user?.mfa?.setup_required) {
    return <Navigate to='/mfa/setup' replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route path='/mfa/setup' element={<MfaSetupPage />} />
      <Route element={<MfaGuard><AppLayout /></MfaGuard>}>
        <Route index element={<Navigate to='/dashboard' replace />} />
        <Route path='/dashboard' element={<DashboardPage />} />
        <Route path='/profilo' element={<ProfiloPage />} />
        <Route path='/mfa/config' element={<MfaConfigPage />} />
        <Route path='/minori' element={<MinoriListPage />} />
        <Route path='/minori/nuovo' element={<MinoreFormPage />} />
        <Route path='/minori/:id' element={<MinoreDetailPage />} />
        <Route path='/minori/:id/modifica' element={<MinoreFormPage />} />
        <Route path='/uscite' element={<UscitePage />} />
        <Route path='/attivita' element={<AttivitaPage />} />
        <Route path='/avvicinamenti' element={<AvvicinamentiPage />} />
        <Route path='/diario' element={<DiarioPage />} />
        <Route path='/educatori' element={<EducatoriPage />} />
        <Route path='/turni' element={<PianificazionePage />} />
        <Route path='/turni/timesheet' element={<TimesheetPage />} />
        <Route path='/turni/modelli' element={<ModelliTurnoPage />} />
        <Route path='/turni/mia-settimana' element={<MiaSettimanaPage />} />
        <Route path='/turni/presenze' element={<MiePresentePage />} />
        <Route path='/turni/verifica' element={<VerificaTimesheetPage />} />
        <Route path='/turni/lock' element={<TimesheetLockPage />} />
        <Route path='/turni/export' element={<ExportPresenzePage />} />
        <Route path='/messaggi' element={<MessaggiPage />} />
        <Route path='/messaggi/:id' element={<MessaggioDetailPage />} />
        <Route path='/admin/organizzazioni' element={<OrganizzazioniPage />} />
        <Route path='/admin/strutture' element={<StrutturePage />} />
        <Route path='/admin/utenti' element={<UtentiPage />} />
        <Route path='/admin/assegnazioni' element={<AssegnazioniPage />} />
        <Route path='/admin/assegnazioni-minori' element={<AssegnazioniMinoriPage />} />
        <Route path='/admin/audit' element={<AuditPage />} />
        <Route path='/admin/audit-kpi' element={<AuditKpiPage />} />
        <Route path='/admin/backup' element={<BackupPage />} />
        <Route path='/admin/sistema/storage' element={<SistemaStoragePage />} />
        <Route path='/admin/sistema/health' element={<SistemaHealthPage />} />
        <Route path='/anagrafiche/geografia' element={<GeografiaPage />} />
        <Route path='/anagrafiche/geografia/citta/:id' element={<CittaDetailPage />} />
        <Route path='/anagrafiche/geografia-sync' element={<GeografiaSyncPage />} />
        {/* Redirect route dismesse → hub provider */}
        <Route path='/anagrafiche/scarico-geografia' element={<Navigate to='/anagrafiche/provider-geografia' replace />} />
        <Route path='/anagrafiche/import-geografia'  element={<Navigate to='/anagrafiche/provider-geografia' replace />} />
        <Route path='/anagrafiche/provider-geografia' element={<ProviderGeografiaPage />} />
        <Route path='/anagrafiche/strutture' element={<StrutturePage />} />
        <Route path='/anagrafiche/ruoli' element={<RuoliPage />} />
        <Route path='/anagrafiche/accesso-documentale' element={<DocumentAccessMatrixPage />} />
        <Route path='/anagrafiche/scope-documento' element={<ScopeDocumentoPage />} />
        <Route path='/anagrafiche/tipi-documento' element={<TipiDocumentoPage />} />
        <Route path='/anagrafiche/classificazioni' element={<ClassificazioniPage />} />
        <Route path='/anagrafiche/tipi-contatto' element={<TipiContattoPage />} />
        <Route path='/anagrafiche/stati-minore' element={<StatiMinorePage />} />
        <Route path='/anagrafiche/generi' element={<GeneriPage />} />
        <Route path='/anagrafiche/sesso' element={<SessoPage />} />
        <Route path='/anagrafiche/tipi-uscita' element={<TipiUscitaPage />} />
        <Route path='/anagrafiche/tipi-attivita' element={<TipiAttivitaPage />} />
        <Route path='/anagrafiche/qualifiche-operatori' element={<QualificheOperatoriPage />} />
        <Route path='/anagrafiche/stati-operatori' element={<StatiOperatoriPage />} />
        <Route path='/anagrafiche/stati-struttura' element={<StatiStrutturaPage />} />
        <Route path='/anagrafiche/stati-documenti-staff' element={<StatiDocumentiStaffPage />} />
        <Route path='/anagrafiche/enti-rilascio' element={<EntiRilascioPage />} />
        <Route path='/anagrafiche/tipi-avvicinamento' element={<TipiAvvicinamentoPage />} />
        <Route path='/anagrafiche/tipi-diario' element={<TipiDiarioPage />} />
      </Route>
      <Route path='*' element={<Navigate to='/dashboard' replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
