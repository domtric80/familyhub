# Handoff UX/API 194 — Incidenti e segnalazioni

Data: 2026-08-17
Stato: backend implementato e testato; integrazione UX richiesta

## Pagine richieste

1. `Incidenti`: tabella filtrabile per struttura, minore, tipologia, gravità, stato e periodo.
2. `Nuova segnalazione`: form guidato senza campi liberi per tipologia, gravità o stato.
3. `Dettaglio incidente`: timeline escalation, RCA, notifiche esterne e azioni disponibili restituite dal backend.
4. `Anagrafica Tipi incidente`: CRUD amministrativo.

## Regole UX obbligatorie

- non calcolare o forzare transizioni nel browser;
- mostrare solo i pulsanti coerenti con `allowed_transitions` restituito dal backend;
- non consentire cancellazione di un incidente;
- rendere obbligatoria una conferma prima di ogni avanzamento stato;
- mostrare verde/giallo/rosso usando codice e descrizione restituiti da `/api/incidents/options`;
- il report autorità è una precompilazione: UX deve mostrare chiaramente `Nessun invio automatico`;
- selezione autorità solo da `document_issuers`, mai testo libero;
- errori `403`, `409`, `422` devono mostrare il messaggio backend.

## Endpoint

- `GET|POST /api/incidents`
- `GET|PATCH /api/incidents/{incident}`
- `POST /api/incidents/{incident}/transition`
- `PUT /api/incidents/{incident}/analysis`
- `POST /api/incidents/{incident}/external-notifications`
- `GET /api/incidents/{incident}/authority-report`
- CRUD `/api/admin/incident-types`

Dettagli e payload sono definiti in `docs/api/openapi.yaml`.

## Box Informazioni

> Il registro incidenti documenta eventi critici e ne guida l'escalation formale. Ogni passaggio è tracciato, non cancellabile e visibile solo agli utenti autorizzati sul minore. La precompilazione per un'autorità non equivale a un invio automatico.
