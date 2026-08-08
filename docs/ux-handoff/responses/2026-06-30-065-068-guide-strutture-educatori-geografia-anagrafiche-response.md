# UX Handoff Response — Task 065–068
## Guide contestuali: Strutture, Educatori, Geografia, Anagrafiche residue

**Data risposta:** 2026-07-01  
**Task di riferimento:** 065, 066, 067, 068  
**File modificati:** 9  

---

## Task 065 — Guida sezione Strutture

**File:** `frontend/src/pages/admin/StrutturePage.tsx`

### Modifiche

- Aggiunto `Info` agli import da `react-feather`
- Aggiunto import `InfoDrawer`
- Aggiunto stato `infoOpen`
- Info button nell'header accanto a `<h3>Strutture</h3>`
- `InfoDrawer` con titolo "Guida — Strutture" aggiunto prima della chiusura del fragment

### Contenuto drawer

- **A cosa serve**: contesti organizzativi in cui operano utenti e minori
- **Perimetro organizzativo**: la struttura influisce su ruolo attivo, visibilità minori, assegnazioni, audit — con alert warning che evidenzia il rischio di configurazione errata
- **Tabella dipendenze**: Utenti (ruolo per struttura), Minori (struttura di presa in carico), Educatori (appartenenza), Assegnazioni Minori (perimetro operativo), Audit Log (contesto eventi)
- **Dati geografici**: i riferimenti territoriali devono essere selezionati da anagrafiche canoniche

---

## Task 066 — Guida sezione Educatori

**File:** `frontend/src/pages/educatori/EducatoriPage.tsx`

### Modifiche

- Aggiunto `Info` agli import da `react-feather`
- Aggiunto import `InfoDrawer`
- Aggiunto stato `infoOpen`
- Info button nell'header accanto a `<h3>Educatori</h3>`
- `InfoDrawer` con titolo "Guida — Educatori" aggiunto prima della chiusura del fragment

### Contenuto drawer

- **A cosa serve**: figura educativa come risorsa organizzativa della struttura
- **Educatore vs Utente**: alert info che distingue esplicitamente le due entità — creare un educatore **non** crea automaticamente un account di accesso
- **Quando serve un account**: lista dei casi in cui il collegamento è necessario (accesso software, vedere minori assegnati, operare su attività/uscite/documenti)
- **Relazione con ruoli e minori**: i permessi derivano dall'account utente + ruolo + struttura; l'anagrafica da sola non conferisce permessi

---

## Task 067 — Guida sezione Geografia

**File:** `frontend/src/pages/anagrafiche/GeografiaPage.tsx`

### Modifiche

- Aggiunto `Info` agli import da `react-feather`
- Aggiunto import `InfoDrawer`
- Aggiunto stato `infoOpen` subito dopo la dichiarazione della funzione componente
- Info button nell'header accanto a `<h3>Geografia</h3>`
- `InfoDrawer` con titolo "Guida — Geografia" aggiunto prima della chiusura del fragment (il componente chiude con `/>` del DeleteConfirmModal)

### Contenuto drawer

- **A cosa serve**: database territoriale canonico dell'intero sistema
- **Dati canonici**: alert info che spiega perché i dati geografici non vanno scritti liberamente
- **Tabella provider vs import**: Provider = definisce fonte e modalità di lettura; Import = popola il database canonico usando il provider
- **Gerarchia geografica**: Continente → Nazione → Regione → Provincia → Città
- **Impatto sul sistema**: errori qui si propagano a strutture, minori, staff, documenti; filtri incoerenti in altri form vanno verificati in questa sezione

---

## Task 068 — Guide anagrafiche residue (6 pagine)

### File modificati

| File | Titolo drawer |
|------|--------------|
| `TipiDocumentoPage.tsx` | Guida — Tipi Documento |
| `TipiContattoPage.tsx` | Guida — Tipi Contatto |
| `StatiMinorePage.tsx` | Guida — Stati Minore |
| `TipiUscitaPage.tsx` | Guida — Tipi Uscita |
| `TipiAttivitaPage.tsx` | Guida — Tipi Attività |
| `ClassificazioniPage.tsx` | Guida — Classificazioni Documentali |

### Struttura comune applicata a tutte le 6 pagine

Ogni drawer contiene 3 sezioni:
1. **A cosa serve** — finalità specifica dell'anagrafica
2. **Perché è importante** — ragione per preferire il valore canonico al testo libero
3. **Come impatta il resto del software** — moduli e form che dipendono da questa anagrafica

### Contenuti specifici per sezione

**Tipi Documento**: la tipologia funzionale del documento; appare nei form di caricamento, nei filtri e nelle regole documentali; non sostituisce classificazione o scope.

**Classificazioni Documento**: classificazione con possibile impatto su regole ABAC; non è un'etichetta cosmetica — può incidere su visibilità, filtri e audit; va gestita con attenzione per non alterare il perimetro di accesso.

**Tipi Contatto**: categorie di contatto normalizzate per la tab Contatti del minore; evitano varianti manuali incoerenti dello stesso concetto.

**Stati Minore**: stati canonici del ciclo gestionale del minore; uno stato eliminato impatta tutti i minori che lo utilizzano; compaiono in lista, filtri, report e form.

**Tipi Uscita**: categorie delle uscite per controllo operativo e reporting; un tipo eliminato in uso rende orfane le uscite già registrate.

**Tipi Attività**: categorie delle attività educative; evitano dispersione semantica; migliorano l'analisi del percorso educativo nel tempo.

---

## Pattern comune applicato

Tutti i drawer seguono la struttura stabilita nei task precedenti:

```
[Info icon] Informazioni  ← button nell'header accanto all'h3
    ↓ click
┌──────────────────────────────────────┐
│ Guida — [Nome sezione]           [X] │
├──────────────────────────────────────┤
│ A cosa serve                         │
│ Perché è importante / Perimetro      │
│ Impatto sul resto del software       │
└──────────────────────────────────────┘
```

Componente: `frontend/src/components/common/InfoDrawer.tsx` (invariato)

---

## Note tecniche

- Tutte le modifiche applicate tramite Python replace per evitare troncamento file
- Tutti i 9 file verificati con parser TSX TypeScript: 0 errori di parsing
- Nessuna modifica a tipi, API o routing
- Nessun nuovo componente
