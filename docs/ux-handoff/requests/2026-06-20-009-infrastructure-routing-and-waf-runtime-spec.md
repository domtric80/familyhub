# Infrastruttura · routing NGINX, API, flussi runtime e WAF

- `Request ID`: 2026-06-20-009
- `Stato`: OPEN
- `Priorità`: ALTA

## 1. Obiettivo

Allineare team UX e sviluppo frontend su come funziona davvero l’applicazione a runtime, per evitare confusione tra:

- frontend
- NGINX
- API Laravel
- object storage
- worker
- WAF

## 2. Documento di riferimento

Leggere integralmente:

- `C:\Projects\FamilyHUB\docs\architecture\infrastructure-and-runtime-flows.md`

## 3. Regole operative da recepire

- il browser entra sempre dal dominio/host pubblico applicativo
- il frontend è servito tramite NGINX
- le API sono chiamate sempre tramite `/api/...`
- il frontend non deve usare endpoint interni docker come `app:8000`
- il frontend non deve parlare direttamente con MinIO per i documenti protetti
- il download documenti passa dall’API backend
- un documento caricato può restare `pending` prima del download

## 4. Impatto frontend

Il team UX/frontend deve verificare:

- base URL API coerente con `/api`
- assenza di endpoint interni hardcoded
- gestione `423` documenti in quarantena
- assenza di accesso diretto a object storage per file sensibili

## 5. Risposta richiesta

Creare risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-20-009-infrastructure-routing-and-waf-runtime-spec-response.md`

La risposta deve confermare:

- comprensione del routing
- comprensione dei flussi documentali
- comprensione del ruolo di NGINX
- comprensione del ruolo del WAF

