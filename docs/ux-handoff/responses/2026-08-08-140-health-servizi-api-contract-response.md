# Risposta UX — Handoff 140: Health Servizi API Contract

Data: 2026-08-08  
Stato: implementato

---

## Modifiche apportate

| File | Operazione |
|------|-----------|
| `src/services/api.ts` | Aggiunti tipi `SystemHealthService`, `SystemHealthSummary`, `SystemHealthResponse` e `systemHealthApi` |
| `src/pages/admin/SistemaHealthPage.tsx` | Riscritto completamente con integrazione API reale |

---

## api.ts — Nuovi tipi e client

```ts
export const systemHealthApi = {
  snapshot: () => http.get<SystemHealthResponse>('/api/admin/system/health').then((r) => r.data),
  run:      () => http.post<SystemHealthResponse>('/api/admin/system/health/run').then((r) => r.data),
}
```

Endpoint implementati:
- `GET /api/admin/system/health` — snapshot all'avvio
- `POST /api/admin/system/health/run` — check manuale

---

## SistemaHealthPage.tsx — Comportamento

### Caricamento

- `useEffect` al mount → `systemHealthApi.snapshot()`
- KPI da `summary.ok`, `summary.warning`, `summary.error`, `summary.not_configured`
- `storage_config_source` mostrato sotto il titolo pagina
- `generated_at` come timestamp "Aggiornato:"

### Servizi

- Renderizzati dinamicamente da `services[]` — nessun whitelist frontend
- Nessun servizio hardcodato (incluso `minio_console`: compare solo se arriva dal backend)
- Campo chiave: `svc.service` (id interno), `svc.label` (nome UI)

### Stato

Mappatura corretta:
- `ok` → verde, Operativo
- `warning` → arancio, Degradato
- `error` → rosso, Non disponibile
- `not_configured` → grigio, Non configurato

Lo stato `unknown` (usato nel mock precedente) è **eliminato**.

### Pulsante "Esegui controllo"

- Visibile **solo** se `hasPermission('system_health.run')`
- Chiama `POST /api/admin/system/health/run`
- Toast: `Controllo servizi completato.` al successo
- Toast errore se 403 o 500, con dati precedenti mantenuti a schermo

### Drawer dettaglio (espandibile per riga)

- Appare solo se `error` valorizzato o `meta` non vuoto
- Mostra: `service` (codice), `error` se presente, `meta` come tabella chiave/valore
- **Non espone** password, token o chiavi

### Gestione errori

- `403` → schermata "Accesso negato" con codice permesso
- `500` → toast errore, mantiene snapshot precedente

---

## Gap corretti rispetto al mock (handoff 142)

| Gap | Correzione |
|-----|-----------|
| Stato `unknown` → backend usa `not_configured` | Eliminato `unknown`, aggiunto `not_configured` |
| Servizi hardcodati (`api`, `postgres`, `queue`, `clamav`, `minio`) | Rimossi — render dinamico da `services[]` |
| Toast placeholder "in attesa API" | Sostituito con chiamata reale e toast reale |
| Nessun check permesso sul pulsante run | Aggiunto `hasPermission('system_health.run')` |
| Nessun drawer dettaglio con `meta` | Aggiunto con MetaTable key/value |

---

## Build

`npm run build` — verificato senza errori TypeScript né Vite.
