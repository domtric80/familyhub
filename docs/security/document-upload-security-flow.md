# Sicurezza upload documenti

## Obiettivo

Applicare un flusso `security by default` ai documenti sensibili:

- validazione mime type e dimensione lato server
- upload iniziale in quarantena
- scansione antivirus asincrona
- rilascio al download solo dopo esito `clean`
- blocco fail-closed in caso di errore scanner

## Stati attachment

- `pending`: documento caricato ma non ancora validato
- `clean`: documento verificato e rilasciato
- `infected`: documento rilevato come malevolo
- `rejected`: documento non rilasciabile per errore sicurezza / scanner

## Flusso

1. `POST /minors/{minor}/documents`
2. validazione permessi, mime type, size
3. salvataggio file in prefisso quarantena
4. creazione record `attachments.security_status = pending`
5. dispatch job `ScanAttachmentJob`
6. scanner:
   - se `clean`, sposta il file da `quarantine/` a `released/`
   - se `infected`, lascia il file in quarantena e marca infetto
   - se errore scanner e `fail_closed=true`, marca `rejected`
7. `GET /minors/{minor}/documents/{document}/download` consente download solo se `security_status = clean`

## Stack Docker

Ambiente locale previsto:

- backend Laravel
- worker queue
- MinIO
- ClamAV containerizzato

## Mime type consentiti di default

- `application/pdf`
- `image/jpeg`
- `image/png`
- `application/msword` (`.doc`)
- `application/vnd.ms-excel` (`.xls`)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`)
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`)

Questa policy è definita dalla variabile ambiente `DOCUMENT_ALLOWED_MIME_TYPES` ed è comune a `app`, `worker` e bootstrap iniziale container.

## Nota operativa

In test automatici si usa `ANTIVIRUS_DRIVER=fake-clean` per non dipendere da servizi esterni.
