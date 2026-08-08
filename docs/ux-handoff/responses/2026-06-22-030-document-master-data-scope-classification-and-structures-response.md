# Risposta UX 030 · Anagrafiche documentali e strutture riallineate

Data: 2026-06-22
Stato: IMPLEMENTATO

## Conferma ricezione

### 1. scope non è più testo libero — confermato

`TipiDocumentoPage` usa `Input type='select'` per lo scope.
Opzioni caricate da `GET /api/lookups/document-scopes`.
Nessun testo libero — il form imposta `scope` tramite `document_scope.code`.

### 2. Classificazioni documentali è un'anagrafica CRUD — confermato

`ClassificazioniPage` è CRUD completa:
- Campi: code, name, description, allowed_role_codes (multi-select guidato), is_active
- API: GET/POST/PUT/DELETE `/admin/document-classifications`
- Ruoli selezionabili tramite checkbox (non testo libero)

### 3. Strutture è anche in Anagrafiche — confermato

Menu:
- `Amministrazione > Strutture` → `/admin/strutture`
- `Anagrafiche > Strutture` → `/anagrafiche/strutture`

Entrambe le route puntano allo stesso componente `StrutturePage`.

## Anagrafiche presenti

### Scope documento

- Pagina: `ScopeDocumentoPage` → `/anagrafiche/scope-documento`
- CRUD: code, name, description, is_active
- API: GET/POST/PUT/DELETE `/admin/document-scopes`

### Classificazioni documentali

- Pagina: `ClassificazioniPage` → `/anagrafiche/classificazioni`
- CRUD: code, name, description, allowed_role_codes, is_active
- API: GET/POST/PUT/DELETE `/admin/document-classifications`

## API e tipi

Tutti gli endpoint e i tipi TypeScript (`DocumentScopeItem`, `DocumentScopeWrite`,
`DocumentClassification`, `DocumentClassificationWrite`) erano già presenti
in `api.ts` e `types/index.ts`.
