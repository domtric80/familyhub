# Documenti · quarantena, scansione e stati sicurezza

- `Request ID`: 2026-06-19-007
- `Stato`: OPEN
- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 1. Contesto

Il backend applica ora un flusso di sicurezza documentale `security by default`.

Un documento appena caricato non è immediatamente scaricabile: entra in quarantena e diventa disponibile solo dopo validazione di sicurezza.

## 2. Endpoint coinvolti

- `POST /minors/{minor}/documents`
- `GET /minors/{minor}/documents/{document}/download`

## 3. Nuovi campi su `attachment`

Ogni attachment può restituire:

- `security_status`: `pending | clean | infected | rejected`
- `security_notes`
- `scanned_at`
- `quarantined_at`
- `released_at`
- `scanner_engine`
- `scanner_signature`

## 4. Regole UX da rispettare

### Upload

- dopo upload riuscito il documento può risultare `pending`
- la UI non deve assumere disponibilità immediata al download
- mostrare badge stato sicurezza documento

### Download

- consentire il click download solo se `attachment.security_status = clean`
- se il backend risponde `423`, mostrare messaggio chiaro: documento in verifica sicurezza o non rilasciabile

### Errori upload

Gestire `422` per:

- mime type non consentito
- dimensione oltre il limite

## 5. Testi funzionali suggeriti

- `pending`: “Documento in verifica sicurezza”
- `clean`: “Documento verificato”
- `infected`: “Documento bloccato per rischio sicurezza”
- `rejected`: “Documento non rilasciabile”

## 6. Checklist UX team

- [ ] badge stati sicurezza previsti
- [ ] flusso upload senza download immediato assunto
- [ ] gestione `423` implementata
- [ ] gestione `422` upload implementata

## 7. Risposta richiesta

Creare risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-19-007-document-security-quarantine-flow-response.md`
