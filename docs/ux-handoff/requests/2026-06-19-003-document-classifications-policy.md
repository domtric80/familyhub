# Documenti · Classificazioni esplicite backend

- `Request ID`: 2026-06-19-003
- `Stato`: OPEN
- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 1. Contesto

Le classificazioni documentali non sono più testo libero lato backend.
Ora sono un contratto esplicito esposto da API.

## 2. Endpoint coinvolti

- `GET /lookups/document-classifications`
- `POST /minors/{minor}/documents`

## 3. Classificazioni attuali

- `internal`
- `restricted`
- `clinical`
- `judicial`

## 4. Impatto frontend

Il frontend non deve più hardcodare o inventare classificazioni.
Deve leggere l’elenco dal backend e usarlo in:

- select upload documento
- badge elenco documenti
- filtri eventuali
- messaggi di permesso

## 5. Errori da gestire

Se viene inviata una classificazione non valida:

- `422 validation error`

## 6. Checklist UX team

- [ ] classificazioni lette da API
- [ ] nessuna classificazione hardcoded
- [ ] select coerente col backend
- [ ] badge/etichette coerenti

## 7. Richiesta di risposta UX

Creare risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-19-003-document-classifications-policy-response.md`

