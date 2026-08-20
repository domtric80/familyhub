# Handoff UX/API 193 — Media attività con consenso

Data: 2026-08-17
Stato: backend implementato e testato; integrazione UX richiesta

## Obiettivo UI

Nel dettaglio di una attività aggiungere il tab `Media`, senza upload diretto e senza accesso allo storage. L'operatore seleziona due documenti già presenti nella scheda del minore: foto/video dell'attività e documento che prova il consenso.

## Endpoint

- `GET /api/activities/{activity}/media`
- `POST /api/activities/{activity}/media`
- `DELETE /api/activities/{activity}/media/{media}`
- `POST /api/activities/{activity}/media/{media}/revoke-consent`

Il contratto completo è in `docs/api/openapi.yaml`.

## Regole UI obbligatorie

- mostrare `Valido`, `Scaduto` o `Revocato` usando `consent_status`;
- abilitare `Anteprima` solo con `can_preview=true`;
- usare `GET /api/minors/{minor}/documents/{document}/preview`, mai URL S3/MinIO;
- non dedurre la validità del consenso nel browser;
- richiedere conferma e motivazione prima della revoca;
- dopo la revoca aggiornare la riga senza rimuoverla dalla cronologia;
- non offrire pubblicazione, condivisione pubblica o download automatico;
- mostrare i messaggi backend per `403`, `409` e `422`.

## Form collegamento

- `media_document_id`: select/autocomplete dei documenti del minore; UX può filtrare per MIME immagine/video, ma il backend rivalida;
- `consent_document_id`: select/autocomplete dei documenti del minore;
- `captured_at`: data/ora facoltativa.

## Box Informazioni

> I media restano documenti protetti del minore. La galleria li rende visibili solo quando il consenso è valido, il file ha superato i controlli di sicurezza e il tuo profilo possiede gli accessi documentali necessari. La revoca interrompe la fruizione senza cancellare la prova storica.

## Criteri QA UX

- un media valido apre la preview documentale autenticata;
- un consenso revocato disabilita immediatamente la preview;
- nessuna risposta API espone bucket, path o URL storage;
- documenti di un altro minore producono `422`;
- l'assenza di autorizzazione ABAC produce `403`.
