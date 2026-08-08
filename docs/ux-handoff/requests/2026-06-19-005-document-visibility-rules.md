# Documenti · Regole di visibilità per classificazione

- `Request ID`: 2026-06-19-005
- `Stato`: OPEN
- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 1. Contesto

Le classificazioni documentali ora hanno regole di accesso backend esplicite per ruolo.
Non è più sufficiente sapere che un documento è `restricted`: ogni classificazione ha una visibilità precisa.

## 2. Endpoint coinvolti

- `GET /lookups/document-classifications`
- `POST /minors/{minor}/documents`
- `GET /minors/{minor}/documents/{document}/download`

## 3. Classificazioni e ruoli ammessi

### `internal`

Ruoli ammessi:

- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`
- `PSICOLOGO`
- `EDUCATORE`
- `EDUCATORE_NOTTURNO`
- `ASSISTENTE_SOCIALE_EST`

### `restricted`

Ruoli ammessi:

- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`
- `PSICOLOGO`

### `clinical`

Ruoli ammessi:

- `SUPER_ADMIN`
- `DIRETTORE`
- `PSICOLOGO`

### `judicial`

Ruoli ammessi:

- `SUPER_ADMIN`
- `DIRETTORE`

## 4. Impatto frontend

Il frontend deve:

- mostrare correttamente badge/etichette per classificazione
- prevedere che il backend possa restituire `403`
- non assumere che un utente che vede il minore possa scaricare ogni documento
- usare `GET /lookups/document-classifications` come fonte ufficiale

## 5. Errori da gestire

### `403`

Messaggio da prevedere:

- accesso non consentito alla classificazione documentale

### `422`

- classificazione non valida in upload

## 6. Checklist UX team

- [ ] regole di visibilità comprese
- [ ] etichette classificazione coerenti
- [ ] gestione `403` per download documenti
- [ ] upload allineato a classificazioni backend

## 7. Risposta richiesta

Creare risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-19-005-document-visibility-rules-response.md`

