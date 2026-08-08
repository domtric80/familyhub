# UX Handoff Response — Task 059–064
## Guide contestuali: Uscite, Attività, Documenti, Assegnazioni Minori, Utenti, Audit Log

**Data risposta:** 2026-06-30  
**Task di riferimento:** 059, 060, 061, 062, 063, 064  
**File modificati:** 6  

---

## Riepilogo

Implementate le guide contestuali richieste nei task 059–064 seguendo il pattern InfoDrawer già stabilito nei task 057–058. Ogni sezione ha ora un pulsante "Informazioni" nell'header che apre un drawer laterale con la guida specifica.

---

## Task 059 — Guida sezione Uscite

**File:** `frontend/src/pages/uscite/UscitePage.tsx`

### Modifiche

- Aggiunto import `Info` da `react-feather` e `InfoDrawer`
- Aggiunto stato `infoOpen` (useState)
- Info button nell'header accanto a `<h3>Uscite</h3>`:
  ```tsx
  <button className='btn btn-light btn-sm d-flex align-items-center gap-1' onClick={() => setInfoOpen(true)}>
    <Info size={13} /> Informazioni
  </button>
  ```
- `InfoDrawer` con titolo "Guida — Uscite" aggiunto in fondo al return

### Contenuto drawer

- **Scopo**: gestione uscite dei minori (pianificazione, accompagnatori, rientro, esito)
- **Accesso**: dipende da ruolo + assegnazione al minore; ruoli privilegiati accedono a tutti
- **Tabella permessi**: `minor_exits.view/create/update/delete`
- **Errori frequenti**: 403 = mancanza `minor_exits.view` oppure minore non assegnato

---

## Task 060 — Guida sezione Attività

**File:** `frontend/src/pages/attivita/AttivitaPage.tsx`

### Modifiche

- Aggiunto import `Info` da `react-feather` e `InfoDrawer`
- Aggiunto stato `infoOpen`
- Info button nell'header del layout a due colonne (accanto all'h3)
- `InfoDrawer` con titolo "Guida — Attività" aggiunto prima della chiusura del fragment

### Contenuto drawer

- **Scopo**: registrazione attività dei minori (laboratori, terapie, scolastiche, ricreative)
- **Accesso**: ruolo + assegnazione; privilegiati vedono tutto
- **Tabella permessi**: `activities.view/create/update/delete`
- **Errori frequenti**: 403 = nessun minore assegnato con attività registrate

---

## Task 061 — Nota ABAC tab Documenti

**File:** `frontend/src/pages/minori/MinoreDetailPage.tsx`

### Modifiche

Banner informativo aggiunto nella funzione `DocumentiTab`, sopra la lista documenti:

```tsx
<div className='alert alert-info py-2 px-3 mb-3 d-flex align-items-start gap-2' style={{ fontSize: 13 }}>
  <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
  <span>
    La visibilità dei documenti segue regole <strong>ABAC</strong> basate su tag e classificazioni,
    indipendentemente dal ruolo. È possibile vedere il minore e non poter consultare tutti i suoi documenti.
  </span>
</div>
```

Questo è un banner in-page (non un drawer) coerente con il contesto tab-based della scheda minore.

---

## Task 062 — Guida sezione Assegnazioni Minori

**File:** `frontend/src/pages/admin/AssegnazioniMinoriPage.tsx`

### Modifiche

- Aggiunto import `Info` da `react-feather` e `InfoDrawer`
- Aggiunto stato `infoOpen`
- Info button nell'header accanto al titolo della pagina
- `InfoDrawer` con titolo "Guida — Assegnazioni Minori" aggiunto prima della chiusura del fragment

### Contenuto drawer

- **Ruolo vs Assegnazione**: ruolo = cosa può fare (permessi); assegnazione = su quale minore
- **Ruoli privilegiati**: SUPER_ADMIN, DIRETTORE, COORDINATORE accedono senza assegnazione esplicita; non compaiono nella lista operatori assegnabili
- **Tabella campi**: utente, minore, data inizio, data fine (vuoto = attiva), note
- **Revoca**: imposta data fine validità; l'operatore perde accesso dal giorno indicato

---

## Task 063 — Guida sezione Utenti

**File:** `frontend/src/pages/admin/UtentiPage.tsx`

### Modifiche

- Aggiunto import `Info` da `react-feather` e `InfoDrawer`
- Aggiunto stato `infoOpen`
- Info button nell'header della pagina
- `InfoDrawer` con titolo "Guida — Utenti" aggiunto prima della chiusura del fragment

### Contenuto drawer

- **Tre piani**: (1) Utente = credenziali/email/MFA, (2) Ruolo = permessi, (3) Struttura = dove opera
- **Un solo ruolo attivo per struttura**: utente può avere ruoli diversi in strutture diverse
- **Tabella stati**: Attivo (accesso abilitato) / Inattivo (disabilitato, non eliminato)
- **Reset MFA**: revoca il dispositivo TOTP; al prossimo accesso l'utente registra un nuovo dispositivo

---

## Task 064 — Guida sezione Audit Log

**File:** `frontend/src/pages/admin/AuditPage.tsx`

### Modifiche

- `<h4>Audit log</h4>` avvolto in un flex div con info button:
  ```tsx
  <div className='d-flex align-items-center gap-2 mb-4'>
    <h4 className='mb-0'>Audit log</h4>
    <button className='btn btn-light btn-sm ...' onClick={() => setInfoOpen(true)}>
      <Info size={13} /> Informazioni
    </button>
  </div>
  ```
- `InfoDrawer` con titolo "Guida — Audit Log" aggiunto dentro il `<Container>` prima della chiusura

### Contenuto drawer

- **Scopo**: log automatico e immutabile di ogni operazione significativa (create/update/delete/view su dati sensibili)
- **Cosa viene tracciato**: utente, entità coinvolta, tipo operazione, valori prima/dopo, timestamp
- **Tabella formato evento**: entity_type, action, old_values, new_values, performed_by
- **Audit generale vs storico minore**: questa pagina = log globale; storico specifico di un minore = tab "Storico" nella scheda minore
- **Filtri**: per struttura, utente, tipo azione, entità, data; preset rapidi per scenari comuni

---

## Pattern comune applicato

Tutti i drawer seguono il pattern stabilito nei task 057–058:

```
[Info icon] Informazioni  ← button nell'header
    ↓ click
┌─────────────────────────────────────┐
│ Guida — [Nome sezione]          [X] │
├─────────────────────────────────────┤
│ Scopo della sezione                 │
│ Accesso / Permessi                  │
│ Tabella permessi o campi            │
│ Errori frequenti / Note             │
└─────────────────────────────────────┘
```

Componente riusabile: `frontend/src/components/common/InfoDrawer.tsx`

---

## Note tecniche

- Build TypeScript verificata: tutti i 6 file passano il parser TSX senza errori
- Nessuna modifica a tipi, API, o routing
- Nessun nuovo componente creato (riutilizzo di `InfoDrawer` già esistente)
