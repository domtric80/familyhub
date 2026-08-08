# Risposta UX — Handoff 126: Note classificate del minore

Data risposta: 2026-07-06  
Handoff: 2026-07-06-126  
Stato: ✅ Implementato

## Cosa è stato fatto

### 1. OpenAPI — schemi aggiunti

In `docs/api/openapi.yaml` aggiunti tre schemi referenziati ma non definiti:

- `MinorNote` — response completa con `id`, `minor_id`, `facility_id`, `classification_code`, `classification_label`, `document_classification`, `title`, `body`, `is_encrypted`, `created_at`, `updated_at`, `created_by`, `updated_by`
- `MinorNoteWrite` — payload create: `classification_code`, `title`, `body` (tutti obbligatori)
- `MinorNotePatch` — payload patch (tutti opzionali)

### 2. Tipi TypeScript (`types/index.ts`)

```typescript
MinorNote { id, minor_id, facility_id, classification_code, classification_label,
            document_classification?, title, body, is_encrypted,
            created_at, updated_at, created_by?, updated_by? }

MinorNoteWrite { classification_code, title, body }
```

### 3. API methods (`api.ts`, in `minorApi`)

```typescript
listNotes(minorId)                        // GET /minors/{id}/notes
createNote(minorId, data)                 // POST /minors/{id}/notes
updateNote(minorId, noteId, data)         // PUT /minors/{id}/notes/{note}
deleteNote(minorId, noteId)              // DELETE /minors/{id}/notes/{note}
```

### 4. Tab "Note riservate" in `MinoreDetailPage`

- Aggiunta al tipo `Tab` e all'array `tabs` (icona Lock)
- Nuovo `<TabPane tabId='note'>` con `<NoteMinoreTab minorId={minorId} />`
- Guida drawer aggiornata con riga "Note riservate"

### 5. Componente `NoteMinoreTab.tsx`

**Alert sicurezza fisso:**
> "Le note sensibili vengono salvate in forma cifrata e sono visibili solo agli utenti autorizzati per classificazione e assegnazione al minore."

**Lista note:**
- Card per ogni nota con badge classificazione colorato (internal=blu, restricted=giallo, clinical=verde, judicial=rosso)
- Indicatore "cifrata" con icona Lock
- Click sulla card apre il corpo della nota inline
- Bottoni Edit / Elimina per nota

**Modale crea/modifica:**
- Select classificazione alimentata da `capabilities.document_classifications` con fallback hardcoded
- Campi: Titolo (obbligatorio), Corpo textarea (obbligatorio)
- Nota: "Non cifrare il contenuto manualmente: il backend si occupa della cifratura a riposo."

**Modale elimina:** conferma con nome nota, non reversibile.

**Stato vuoto:** testo esplicativo che suggerisce di verificare classificazione e assegnazione (non tratta "vuoto" come errore — corretto per backend ABAC).

**403:** messaggio specifico "Non hai i permessi per leggere le note di questo minore."

## Regole UX rispettate

- ✅ Non si filtra lato client — si mostra tutto ciò che il backend restituisce
- ✅ Non si cifra lato client
- ✅ "Vuoto" non è un errore: messaggio esplicativo suggerisce di verificare ABAC
- ✅ Classificazioni da `capabilities.document_classifications`
- ✅ Badge per internal / restricted / clinical / judicial
- ✅ Messaggio sicurezza visibile

## File creati/modificati

- `frontend/src/pages/minori/tabs/NoteMinoreTab.tsx` ← nuovo
- `frontend/src/pages/minori/MinoreDetailPage.tsx` ← Tab type, tabs array, TabPane, import, guida
- `frontend/src/types/index.ts` ← `MinorNote`, `MinorNoteWrite`
- `frontend/src/services/api.ts` ← `listNotes`, `createNote`, `updateNote`, `deleteNote`
- `docs/api/openapi.yaml` ← schemi `MinorNote`, `MinorNoteWrite`, `MinorNotePatch`
