# UX Handoff Response — Task 072–073
## Ruolo effettivo assegnazioni + document_scope_code relazionale

**Data risposta:** 2026-07-01  
**Task di riferimento:** 072, 073  
**File modificati:** 3  

---

## Task 072 — Ruolo effettivo in AssegnazioniMinoriPage

### Contesto

L'assegnazione minore (`MinorAssignment`) non porta più un ruolo locale proprio. Il ruolo dell'utente deriva da `user_facility_roles` e il backend lo espone già nella risposta come campo derivato.

### Tipo aggiornato

**File:** `frontend/src/types/index.ts`

Aggiunti a `MinorAssignment`:
```ts
effective_role_code?: string | null
effective_role_name?: string | null
```

Questi campi non devono essere inviati nel payload di creazione (`MinorAssignmentWrite` invariato) — vengono solo letti dalla risposta.

### Tabella assegnazioni

**File:** `frontend/src/pages/admin/AssegnazioniMinoriPage.tsx`

Aggiunta colonna **Ruolo effettivo** tra Utente e Struttura.

Logica display:
- Se `effective_role_name` è presente → badge `badge-light-primary` con il nome del ruolo
- Se assente → `—` (utente non ha ruolo attivo nella struttura, situazione anomala)

### Cosa NON è cambiato

- Il form di creazione assegnazione non ha alcun campo ruolo da selezionare
- `MinorAssignmentWrite` non include `effective_role_code` né `assignment_role_code`
- Nessun campo legacy tecnico è esposto in UI

---

## Task 073 — document_scope_code relazionale in TipiDocumentoPage

### Contesto

Il campo `scope` (stringa libera) non è più il campo funzionale da usare. Il backend ora accetta e restituisce `document_scope_code` come campo canonico.

### Tipo aggiornato

**File:** `frontend/src/types/index.ts`

`DocumentTypeItem`:
```ts
scope?: string | null             // mantenuto ma opzionale (retrocompat.)
document_scope_code?: string | null  // campo canonico
document_scope?: DocumentScopeItem | null  // invariato
```

`DocumentTypeWrite`:
```ts
// Prima:
scope: string
// Dopo:
document_scope_code: string
```

### Form aggiornato

**File:** `frontend/src/pages/anagrafiche/TipiDocumentoPage.tsx`

- `EMPTY_FORM` usa `document_scope_code: ''` invece di `scope: ''`
- `openEdit` legge `item.document_scope_code ?? item.scope ?? ''` (fallback per record legacy)
- Il `<Input type='select'>` è ora legato a `form.document_scope_code`
- Gli errori di validazione sono riferiti a `document_scope_code`
- La label è aggiornata da "Scope" a "Ambito documento"

### Visualizzazione in tabella

Invariata — continuava già a usare `item.document_scope?.name ?? item.scope`, che rimane corretto.

### Payload inviato

```json
{
  "code": "COURT_NOTE",
  "name": "Nota giudiziaria",
  "document_scope_code": "minor"
}
```

---

## Note tecniche

- Tutti e 3 i file verificati con parser TSX TypeScript: 0 errori di parsing
- Nessuna modifica a routing, componenti condivisi o API client
- Il vecchio campo `scope` rimane nel tipo `DocumentTypeItem` come opzionale per retrocompatibilità di lettura
