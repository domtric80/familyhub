# Risposta UX 057 + 058 · Pagina ruoli informativi + Guide contestuali sezione Minori

Data: 2026-06-30
Stato: IMPLEMENTATO

---

## Task 057 — Pagina informativa ruoli + pattern guide contestuali

### Cosa è stato implementato

#### Nuovo componente: `InfoDrawer`

- File: `frontend/src/components/common/InfoDrawer.tsx`
- Drawer laterale generico (width 520px, overlay scuro, scrollabile)
- Props: `isOpen`, `onClose`, `title`, `children`
- Riusabile in tutte le sezioni applicative

#### RuoliPage — pulsante Informazioni

- Aggiunto pulsante `Informazioni` (icona `i`) nell'header della pagina Ruoli, accanto al titolo
- Click apre drawer con guida completa

#### RuoliPage — contenuto drawer

Il drawer mostra:

1. Testo introduttivo sulla distinzione RBAC vs bypass assegnazione minore
2. Tabella mappa ruoli con colonne: Codice, Tipo, Privilegiato, Ass. minore, RBAC, Note
   - Copre tutti i ruoli di sistema + riga generica `CUSTOM_*`
   - Badge colorati per tipo (Sistema / Operativo / Esterno / Tecnico / Custom)
   - Badge Privilegiato (warning) vs non privilegiato
   - Badge Richiesta / Non richiesta per assegnazione minore
   - Badge Modificabile / Bloccata per RBAC
3. Tre blocchi informativi: Ruoli privilegiati, Ruoli operativi, Ruoli custom
4. Fonte: riferimento al doc operativo

#### RuoliPage — lock RBAC per ruoli privilegiati

Ruoli: `SUPER_ADMIN`, `DIRETTORE`, `COORDINATORE`

- Il pulsante "Salva permessi" **non viene renderizzato** per questi ruoli
- Le checkbox della matrice permessi sono **disabilitate** (`disabled` + `cursor: not-allowed`)
- Viene mostrato un banner `alert-warning` con spiegazione:

> Questo è un ruolo di sistema privilegiato. Oltre ai permessi RBAC, possiede un comportamento speciale nell'accesso ai minori: può operare senza assegnazione manuale puntuale. Per evitare configurazioni incoerenti, la matrice permessi non è modificabile da questa interfaccia.

La matrice è ancora **visibile** (sola lettura) per consultazione.

---

## Task 058 — Guida contestuale sezione Minori

### MinoriListPage

- Aggiunto pulsante `Informazioni` nell'header della pagina elenco minori, accanto al titolo `<h3>`
- Click apre InfoDrawer con guida sezione

### MinoreDetailPage

- Aggiunto pulsante `Informazioni` nel card header della scheda, a fianco del pulsante Modifica
- Il titolo del drawer è contestualizzato: `Guida accesso — {Nome Cognome}`
- Click apre InfoDrawer con guida accesso specifico

### Contenuto drawer Minori (condiviso tra lista e scheda)

Sezioni:
1. **A cosa serve** — descrizione funzionale della sezione
2. **Elenco vs scheda completa** — distinzione dei due livelli di accesso
3. **Come funziona l'accesso** — regola RBAC + assegnazione, + eccezione ruoli privilegiati (alert-warning)
4. **Documenti e dati sensibili** — ABAC sui tag documentali
5. **Le tab della scheda minore** — tabella con tab, contenuto e note accesso
6. **Errori frequenti** — 403 su scheda, 403 su Uscite/Attività, elenco vuoto

### Nota in tab "Accesso al minore"

Aggiunto banner informativo nella TabPane `operatori`:

> Questa tab mostra le assegnazioni manuali al minore. Alcuni ruoli privilegiati di sistema (SUPER_ADMIN, DIRETTORE, COORDINATORE) possono accedere senza comparire in questo elenco.

---

## Pattern stabilito per le guide contestuali

Da questa implementazione in poi, il pattern standard per ogni nuova guida contestuale è:

```tsx
// 1. Import
import InfoDrawer from '../../components/common/InfoDrawer'
import { Info } from 'react-feather'

// 2. State
const [infoOpen, setInfoOpen] = useState(false)

// 3. Pulsante nell'header
<button className='btn btn-light btn-sm d-flex align-items-center gap-1'
  onClick={() => setInfoOpen(true)}>
  <Info size={13} /> Informazioni
</button>

// 4. Drawer in fondo al JSX
<InfoDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} title='Guida — NomeSezione'>
  <NomeSezionGuideContent />
</InfoDrawer>

// 5. Funzione contenuto (componente separato in fondo al file)
function NomeSezionGuideContent() { ... }
```

---

## Prossime sezioni da dotare di guida (backlog priorità)

Secondo il task 057, l'ordine consigliato per i prossimi task è:

1. ✅ Ruoli (fatto)
2. ✅ Minori (fatto)
3. Uscite
4. Attività
5. Documenti
6. Assegnazioni Minori
7. Utenti
8. Audit Log

---

## File modificati

| File | Modifica |
|------|----------|
| `frontend/src/components/common/InfoDrawer.tsx` | NUOVO — componente drawer riusabile |
| `frontend/src/pages/anagrafiche/RuoliPage.tsx` | Info button, lock RBAC privilegiati, drawer guida ruoli |
| `frontend/src/pages/minori/MinoriListPage.tsx` | Info button, drawer guida sezione |
| `frontend/src/pages/minori/MinoreDetailPage.tsx` | Info button, drawer guida scheda, nota tab operatori |

## Note QA

- Il lock RBAC è solo UI: il backend non ha un vincolo corrispondente. Se si bypassa la UI, la chiamata PUT raggiungerebbe il backend. Valutare se aggiungere protezione server-side per i ruoli privilegiati.
- Le guide sono statiche (contenuto hardcoded derivato da docs/operations). Aggiornare il contenuto manualmente se le regole operative cambiano.
- Il drawer non ha un shortcut da tastiera per chiudersi (Esc). Da aggiungere se richiesto.
