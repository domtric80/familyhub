# Handoff UX/API 195 — Farmaci e somministrazioni

Data: 2026-08-17
Stato: backend implementato e testato; integrazione UX richiesta

## UI richiesta

Nel dettaglio minore aggiungere `Salute > Farmaci` con:

- elenco piani attivi/storici;
- form piano con sole select relazionali;
- orari settimanali;
- registro somministrazioni firmate;
- alert scadenza piano/ricetta.

## Regole obbligatorie

- invocare `GET /api/health/medications/options` solo con `facility_id` selezionato: il parametro è obbligatorio e il backend verifica `minor_health.read` sulla struttura;
- non consentire testo libero per farmaco, unità, via, esito o prescrittore;
- non mostrare azioni in base a supposizioni sul ruolo: usare i `can_*` restituiti dal backend;
- una somministrazione registrata non è modificabile né cancellabile;
- mostrare `Firma applicativa autenticata`, non `firma digitale qualificata`;
- per aprire la ricetta usare l'endpoint documentale protetto del minore;
- non esporre path o URL S3/MinIO;
- gestire `409` come duplicato o stato non compatibile, non come successo.

## Endpoint

- `GET /api/health/medications/options`
- `GET|POST /api/health/medication-plans`
- `GET|PATCH /api/health/medication-plans/{plan}`
- `GET /api/health/medication-plans/alerts`
- `POST /api/health/medication-plans/{plan}/schedules`
- `GET|POST /api/health/medication-plans/{plan}/administrations`
- CRUD `/api/admin/medications`

## Box Informazioni

> La scheda farmacologica deriva da una prescrizione. Ogni somministrazione viene registrata una sola volta, firmata dall'utente autenticato e conservata nello storico. In caso di dubbio non correggere il registro: segnala l'evento al coordinatore o al personale sanitario.
