# Handoff UX/API 196 — Eventi sanitari

Data: 2026-08-17
Stato: backend implementato e testato; integrazione UX richiesta

## Posizione UI

Nel dettaglio minore aggiungere `Salute > Visite ed esami`, separato da `Salute > Farmaci`.

## Flusso esatto

1. Selezionata la struttura, chiamare `GET /api/health/events/options?facility_id={id}`.
2. Mostrare categoria e stato esclusivamente come select.
3. Per il documento collegato usare la lista documenti del minore filtrata ai documenti sanitari.
4. Creare con `POST /api/health/events`.
5. Aggiornare con `PATCH /api/health/events/{id}`.
6. Mostrare calendario/elenco con `GET /api/health/events?minor_id={id}`.
7. Mostrare promemoria con `GET /api/health/events/alerts?facility_id={id}&days=30`.

## Campi form

- `category_id`: obbligatorio, select;
- `status_id`: obbligatorio, select;
- `scheduled_at`: obbligatorio;
- `occurred_at`: obbligatorio solo se stato `COMPLETED`, vietato se `CANCELLED`;
- `provider_staff_member_id`: select opzionale restituita da options;
- `health_authority_document_issuer_id`: select opzionale restituita da options;
- `linked_minor_document_id`: documento sanitario esistente dello stesso minore;
- `reason`, `clinical_findings`, `outcome_notes`: textarea protette;
- `follow_up_at`: data/ora opzionale.

## Regole UX obbligatorie

- non aggiungere delete: il backend non lo espone;
- non consentire categorie, stati, medici o enti in testo libero;
- non aprire direttamente URL storage: usare preview/download documentali protetti;
- non dedurre accesso dal nome ruolo: usare i permessi `minor_health.read/create/update` presenti nella sessione;
- gestire `403` come accesso clinico negato e `422` mostrando il messaggio backend;
- aggiungere box `Informazioni` che chiarisca la differenza tra programmato, completato e annullato;
- non mostrare i testi clinici nelle tabelle generali: solo nel dettaglio autorizzato.

## Contratto

La specifica autorevole è `docs/api/openapi.yaml`, operazioni `getMinorHealthEventOptions`, `listMinorHealthEvents`, `createMinorHealthEvent`, `listMinorHealthEventAlerts`, `getMinorHealthEvent`, `updateMinorHealthEvent`.

## Checklist UX

- [ ] tab separato Farmaci / Visite ed esami;
- [ ] filtri per categoria e stato;
- [ ] form senza campi testuali riutilizzabili;
- [ ] validazioni stato/data;
- [ ] collegamento documento tramite endpoint ABAC;
- [ ] alert appuntamenti e follow-up;
- [ ] box Informazioni;
- [ ] risposta in `docs/ux-handoff/responses/` con file modificati e test eseguiti.
