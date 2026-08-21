# UX handoff response — 198

**Data risposta:** 2026-08-21  
**Handoff:** 198 — Turni: errore 403 mascherato nello storico sostituzioni  
**Tipo risposta:** Bugfix frontend  
**Esito:** IMPLEMENTATO

---

## File modificati

| File | Modifica |
|---|---|
| `frontend/src/pages/turni/PianificazionePage.tsx` | Aggiunto stato `substHistoryError`, fix catch in `openSubstModal`, aggiornata sezione storico nella modale |

---

## Gestione implementata per stato

### Stato 1 — Caricamento in corso

`substHistLoading === true` → messaggio "Caricamento…" (invariato).

### Stato 2 — Storico caricato con record

`substHistoryError === null` e `substHistory.length > 0` → tabella con le sostituzioni (invariato).

### Stato 3 — Storico realmente vuoto

`substHistoryError === null` e `substHistory.length === 0` → "Nessuna sostituzione registrata." (invariato, mostrato solo quando la risposta API è `200` con array vuoto).

### Stato 4 — Accesso negato (403)

```typescript
} catch (e) {
  const ae = apiError(e)
  setSubstHistoryError(ae.status === 403 ? 'forbidden' : 'generic')
}
```

`substHistoryError === 'forbidden'` → `<div role='alert' class='alert alert-warning'>`:

> Non disponi del permesso necessario per consultare lo storico delle sostituzioni.

Nessun dettaglio tecnico, nessun messaggio "storico vuoto".

### Stato 5 — Errore generico (5xx, rete, risposta non valida)

`substHistoryError === 'generic'` → `<div role='alert' class='alert alert-danger'>`:

> Impossibile caricare lo storico delle sostituzioni. Riprova oppure contatta l'assistenza.

L'utente può chiudere e riaprire la modale per ritentare.

### Reset alla nuova apertura

`openSubstModal` azzera `substHistoryError` (e `substHistory`) prima di avviare la nuova chiamata, impedendo che il messaggio precedente resti visibile durante il caricamento successivo.

---

## Build frontend

`npm run build` non eseguibile nel sandbox (I/O error su `node_modules` nel mount Windows — stesso limite rilevato in QA 197). Verificare su macchina di sviluppo o in CI prima del deploy.

---

## Criteri di accettazione

| # | Caso | Esito |
|---|---|---|
| 1 | API `200` con record → tabella mostrata | ✓ PASS (code) |
| 2 | API `200` array vuoto → "Nessuna sostituzione registrata." | ✓ PASS (code) — mostrato solo su risposta 200 vuota |
| 3 | API `403` → messaggio permesso insufficiente, nessun "storico vuoto" | ✓ PASS (code) |
| 4 | API `500`/rete → messaggio generico persistente, nessun dettaglio tecnico | ✓ PASS (code) |
| 5 | Nuova apertura dopo errore → errore precedente azzerato | ✓ PASS (code) — `setSubstHistoryError(null)` all'inizio di `openSubstModal` |

---

## Limiti residui

- Build e prova manuale dei quattro esiti API devono essere eseguiti su ambiente live con backend attivo.
- Navigazione da tastiera e annuncio accessibile del messaggio (`role='alert'`) da verificare con screen reader su ambiente live.
- Nessuna regressione attesa su creazione e annullamento sostituzione: le funzioni `handleCreateSubstitution` e `handleCancelSubstitution` non sono state modificate.
