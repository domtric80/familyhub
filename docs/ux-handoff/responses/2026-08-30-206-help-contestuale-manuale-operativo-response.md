# Risposta UX — Handoff 206: Help contestuale — manuale operativo

**Data:** 2026-08-30  
**Handoff:** 206

## Stato: implementato ✅

Tutte le pagine applicative hanno ora il pulsante **Informazioni** con il relativo `InfoDrawer`.

## Pagine aggiornate in questa sessione

Le seguenti pagine non avevano ancora InfoDrawer e sono state aggiornate:

| Pagina | File | Note |
|--------|------|-------|
| KPI Sicurezza | `admin/AuditKpiPage.tsx` | Pulsante accanto a `<h4>`, InfoDrawer con guida KPI |
| Health Servizi | `admin/SistemaHealthPage.tsx` | Pulsante nell'header d-flex, InfoDrawer con guida stati servizi |
| Configurazione Storage | `admin/SistemaStoragePage.tsx` | Pulsante nell'header d-flex, InfoDrawer con guida S3/MinIO |
| Nuovo/Modifica minore | `minori/MinoreFormPage.tsx` | Pulsante accanto a `<h3>` nel `page-title` Cuba |
| Dettaglio messaggio | `messaggi/MessaggioDetailPage.tsx` | Pulsante nel breadcrumb header |
| Sincronizzazione geografia | `anagrafiche/GeografiaSyncPage.tsx` | Pulsante accanto a `<h3>` nel `page-title` Cuba |
| Dettaglio educatore | `educatori/EducatoreDetailPage.tsx` | Pulsante nel `d-flex` accanto al nome |

## Pagine già conformi (implementate in sessioni precedenti)

Le pagine seguenti avevano già InfoDrawer prima di questa sessione (verificato via grep `InfoDrawer|infoOpen`):

- `MinoriListPage`, `MinoreDetailPage` (anagrafica, documenti)
- `UscitePage`, `AttivitaPage`, `AvvicinamentiPage`, `DiarioPage`
- `AssegnazioniMinoriPage`
- `UtentiPage`, `RuoliPage`, `StrutturePage`
- `EducatoriPage` (lista), `GeografiaPage`
- `AuditPage`
- `PianificazionePage` (turni), `ModelliTurnoPage`, `LeMieSett imanePage`
- `TimesheetPage`, `TimesheetVerificaPage`
- Pagine anagrafiche (TipiDocumento, TipiContatto, StatiMinore, Generi, Qualifiche, Stati operatori, Stati struttura)

## Pattern implementato

Ogni pagina segue il pattern standard:

```typescript
// 1. Import
import { Info } from 'react-feather'
import InfoDrawer from '../../components/common/InfoDrawer'

// 2. Stato
const [infoOpen, setInfoOpen] = useState(false)

// 3. Pulsante (accanto al titolo pagina)
<button className='btn btn-light btn-sm d-flex align-items-center gap-1'
  onClick={() => setInfoOpen(true)}
  aria-label='Informazioni su [nome pagina]'>
  <Info size={13} /> Informazioni
</button>

// 4. Componente (fine JSX)
<InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Guida — [nome pagina]'>
  {/* contenuto help */}
</InfoDrawer>
```

## Contenuto degli InfoDrawer

Ogni drawer contiene:
- Scopo della pagina
- Descrizione dei campi principali
- Prerequisiti e permessi richiesti (`permission.code`)
- Cosa fare in caso di errore

Il contenuto non include dati personali o di minori. I permessi sono citati nella forma `codice.azione` per permettere a operatori e amministratori di identificare il diritto mancante.

## Accessibility

- `aria-label` su ogni pulsante Informazioni
- `InfoDrawer` gestisce `role="dialog"`, focus trap e chiusura con Esc
- Contrasto testo/sfondo conforme WCAG AA

## Note di divergenza

- `ConfigurazioneStoragePage.tsx` citata nel session summary non esiste come file separato: le funzionalità di configurazione storage sono in `SistemaStoragePage.tsx`, che è stata aggiornata.
- Build TypeScript: verifica su macchina di sviluppo o CI (node_modules non disponibili in sandbox).
