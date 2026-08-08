# Risposta UX — Handoff 121: Matrice accesso documentale RBAC + ABAC

Data risposta: 2026-07-05  
Handoff: 2026-07-05-121  
Stato: ✅ Implementato

## Cosa è stato fatto

### 1. Nuova pagina `DocumentAccessMatrixPage`

Route: `/anagrafiche/accesso-documentale`

La pagina chiama `GET /api/admin/document-access-matrix` (permesso richiesto: `roles.read`) e mostra:

**Box introduttivo RBAC vs ABAC** (due card affiancate):
- RBAC: accesso ai moduli, `attachments.read` e `attachments.upload`
- ABAC: accesso effettivo = RBAC base + classificazione ammessa + assegnazione minore

**Avviso ruoli personalizzati**: spiega che `attachments.read` da solo non basta — se il ruolo non è in `allowed_role_codes` di una classificazione, non potrà leggerla.

**Tabella classificazioni**: per ogni classificazione mostra codice, nome, descrizione, ruoli ammessi, se richiede assegnazione al minore, stato attiva/inattiva.

**Tabella ruoli** (righe espandibili):
- Colonne: Ruolo, Lettura doc. (RBAC), Upload doc. (RBAC), Classificazioni leggibili, Toggle dettaglio
- Clic su riga → espande il dettaglio con tabella per classificazione:
  - Accesso effettivo: Sì / Con assegnazione / Non consentito / No RBAC base
  - Regola (`effective_read_rule`)
  - Note backend (`notes`)
  - Alert se il ruolo non ha `attachments.read` di base

### 2. Tipi TypeScript aggiunti

In `types/index.ts`:
- `DocumentAccessMatrix`
- `DocumentAccessClassification`
- `DocumentAccessRole`
- `DocumentAccessEntry`

### 3. Endpoint API

In `api.ts`:
```ts
adminRoleApi.getDocumentAccessMatrix()
// → GET /admin/document-access-matrix
```

### 4. Integrazione con RuoliPage

- Nel detail modal di ogni ruolo, la nota statica ora include un link "Vista completa →" che apre la nuova pagina
- Nel drawer Informazioni, la nota finale rimanda alla pagina dedicata

### 5. Route

In `App.tsx`:
```tsx
<Route path='/anagrafiche/accesso-documentale' element={<DocumentAccessMatrixPage />} />
```

## Messaggi UX implementati

| Caso | Testo mostrato |
|---|---|
| Accesso consentito senza assegnazione | "Sì" (verde) |
| Accesso con assegnazione minore | "Con assegnazione" (giallo) |
| Non consentito (classificazione non ammette il ruolo) | "Non consentito" (rosso) |
| No RBAC base (`attachments.read` mancante) | "No RBAC base" (giallo) + alert espanso |

## File creati/modificati

- `frontend/src/pages/anagrafiche/DocumentAccessMatrixPage.tsx` ← nuovo
- `frontend/src/types/index.ts` ← nuovi tipi DocumentAccess*
- `frontend/src/services/api.ts` ← `getDocumentAccessMatrix()`
- `frontend/src/App.tsx` ← nuova route
- `frontend/src/pages/anagrafiche/RuoliPage.tsx` ← link alla nuova pagina
