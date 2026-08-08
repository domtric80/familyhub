# Risposta UX — Handoff 143: Frontend Integration Note — Health + Storage

Data: 2026-08-08  
Stato: implementato (con nota su timing)

---

## Nota temporale

Il documento 143 è stato ricevuto dopo aver già implementato i contratti 140, 141 e 142 nella stessa sessione.
Tutti i punti richiesti erano già stati applicati. Di seguito il dettaglio puntuale.

---

## SistemaHealthPage.tsx — stato checklist

- [x] Mount chiama `GET /api/admin/system/health`
- [x] Pulsante "Esegui controllo" chiama `POST /api/admin/system/health/run`
- [x] `ServiceStatus` usa `not_configured` (non `unknown`)
- [x] Nessun servizio hardcodato — render dinamico da `services[]`
- [x] KPI da `summary.ok/warning/error/not_configured` (non calcolati manualmente)
- [x] Banner runtime con `storage_config_source` (ENV/DB)
- [x] Drawer dettaglio: `service`, `error`, `meta` key/value — nessun secret
- [x] Gestione 403 (schermata accesso negato) e 500 (toast, dati mantenuti)

---

## SistemaStoragePage.tsx — stato checklist

- [x] Mount chiama `GET /api/admin/system/storage-configs`
- [x] `items`, `currentSource`, `envFallback` popolati dalla response
- [x] Naming backend reale su tutti i campi (`name`, `code`, `provider_type`, `use_path_style_endpoint`, `is_active`, `is_default`, `last_tested_at`, `last_test_status`, ecc.)
- [x] Create invia payload con naming backend
- [x] Edit non precompila `access_key`/`secret_key` — inviati solo se valorizzati dall'utente
- [x] Test connessione → `POST .../test` → `loadList()` + toast
- [x] Attivazione → `POST .../activate` → `loadList()` (aggiorna `currentSource`) + toast
- [x] Elimina → `DELETE` (non "Disattiva")
- [x] `envFallback` mostrato come box informativo separato, non come riga CRUD
- [x] Banner runtime ENV/DB

---

## App.tsx — route

- [x] `/admin/sistema/health` presente
- [x] `/admin/sistema/storage` presente

Nessuna modifica richiesta.

---

## menuItems.ts — label sidebar

Aggiornata label:

- `Storage` → `Storage documentale`

---

## Nota su systemApi.ts

Il documento suggerisce di creare `src/services/systemApi.ts` separato.
I metodi sono stati aggiunti direttamente in `src/services/api.ts` (pattern usato in tutto il progetto),
come `systemHealthApi` e `systemStorageApi`.
Il comportamento è identico; la collocazione è coerente con l'architettura esistente.
Se il backend richiede file separato in futuro, lo split è triviale.

---

## TypeScript

`tsc -b --noEmit` → exit 0, zero errori.
