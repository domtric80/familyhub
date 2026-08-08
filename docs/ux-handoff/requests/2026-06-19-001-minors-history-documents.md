# Modulo Minori · Storico immutabile e documenti

- `Request ID`: 2026-06-19-001
- `Stato`: DONE
- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 1. Contesto

Il backend FamilyHub ha introdotto due capacità nuove nel modulo `Minori`:

- cronologia immutabile del minore con snapshot denormalizzati
- gestione documenti minore con upload e download

Queste capacità sono già disponibili a livello API e devono essere recepite dal team UX senza modificare il contratto backend.

## 2. Impatto frontend

Il frontend deve supportare:

- visualizzazione timeline eventi storicizzati del minore
- filtro per tipo evento nella cronologia
- visualizzazione elenco documenti collegati al minore
- upload documento con metadata
- download documento
- gestione di errori autorizzativi `403`

## 3. Endpoint coinvolti

- `GET /minors/{minor}`
- `GET /minors/{minor}/history`
- `POST /minors/{minor}/documents`
- `GET /minors/{minor}/documents/{document}/download`
- `GET /lookups/document-types`

Fonte contrattuale:

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 4. Request da supportare

### 4.1 Upload documento minore

Endpoint:

- `POST /minors/{minor}/documents`

Content type:

- `multipart/form-data`

Campi:

- `document_type_id` · integer · required
- `file` · binary · required
- `document_issuer_id` · integer · optional
- `issued_by` · string · optional · alias legacy
- `issue_date` · date `YYYY-MM-DD` · optional
- `expiry_date` · date `YYYY-MM-DD` · optional
- `classification_code` · string · optional
- `classification` · string · optional · alias legacy

Valore attuale consigliato:

- `restricted`

## 5. Response da visualizzare

### 5.1 Cronologia

Endpoint:

- `GET /minors/{minor}/history`

Campi UI rilevanti:

- `id`
- `event_type`
- `created_at`
- `actor.first_name`
- `actor.last_name`
- `actor.email`
- `metadata`

### 5.2 Documento minore

Campi UI rilevanti:

- `id`
- `document_type.name`
- `attachment.original_name`
- `attachment.mime_type`
- `attachment.size_bytes`
- `attachment.sha256`
- `document_issuer_id`
- `issued_by`
- `issue_date`
- `expiry_date`
- `classification_code`

## 6. Stati UI da gestire

### Cronologia

- loading
- lista popolata
- nessun evento
- errore caricamento

### Documenti

- upload in corso
- upload riuscito
- upload fallito
- lista vuota
- download in corso
- download fallito

## 7. Errori UI da gestire

### `403 Forbidden`

Da gestire esplicitamente per i documenti classificati o per assenza permessi.

Messaggio suggerito:

- `Non hai i permessi necessari per accedere a questo documento.`

### `422 Validation error`

Casi tipici:

- tipo documento non selezionato
- file mancante
- formato o dimensione non validi

### `404 Not found`

Per documento non più disponibile o minore non trovato.

## 8. Regole autorizzative da riflettere in UI

### Upload documento

Consentito solo a utenti con permesso backend `attachments.upload`.

### Download documento

Consentito solo a utenti con permesso backend `attachments.read`.

### Documenti `restricted`

Il backend applica anche un vincolo di ruolo più restrittivo.

La UI deve:

- gestire il `403`
- prevedere che il pulsante possa non essere disponibile in base al profilo utente, quando questa informazione sarà esposta in modo strutturato

## 9. Comportamento atteso

### Storico

1. l’utente apre il dettaglio minore
2. il frontend carica la cronologia
3. l’utente può filtrare per `event_type`
4. la timeline deve mostrare data/ora, tipo evento, attore

### Documenti

1. l’utente apre la sezione documenti
2. seleziona tipo documento
3. seleziona file
4. compila eventuali metadata
5. invia upload
6. il documento appare in elenco
7. se autorizzato, l’utente può scaricarlo

## 10. Checklist UX team

- [ ] sezione cronologia aggiunta nel dettaglio minore
- [ ] filtro evento cronologia implementato
- [ ] sezione documenti aggiunta nel dettaglio minore
- [ ] form upload documento implementato
- [ ] azione download documento implementata
- [ ] gestione `403` implementata
- [ ] gestione `422` implementata
- [ ] empty state implementati
- [ ] QA funzionale eseguito

## 11. Note backend

- La fonte veritiera dei campi resta `openapi.yaml`
- Non introdurre campi frontend non presenti in specifica
- Non assumere visibilità uniforme dei documenti
- La cronologia è immutabile: non esistono endpoint di modifica o cancellazione

## 13. Completamento

Lavorazioni completate in data 2026-06-19. Risposta UX disponibile in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-19-001-minors-history-documents-response.md`

File modificati:

- `frontend/src/pages/minori/MinoreDetailPage.tsx`
- `frontend/src/types/index.ts`

## 12. Richiesta di risposta UX

Il team UX deve creare un file di risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-19-001-minors-history-documents-response.md`

usando il template:

- `C:\Projects\FamilyHUB\docs\ux-handoff\templates\ux-response-template.md`
