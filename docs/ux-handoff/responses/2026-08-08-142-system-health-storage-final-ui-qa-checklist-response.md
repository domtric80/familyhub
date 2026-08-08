# Risposta UX — Handoff 142: Blocco finale QA — Sistema Health + Storage

Data: 2026-08-08  
Stato: implementato — tutti i gap corretti

---

## Checklist Health Servizi

- [x] `GET /api/admin/system/health` popola KPI e tabella al caricamento
- [x] `POST /api/admin/system/health/run` aggiorna KPI e lista; toast `Controllo servizi completato.`
- [x] Utente senza `system_health.run` non vede il pulsante "Esegui controllo"
- [x] Badge `not_configured` è grigio/neutro (non rosso errore)
- [x] `meta` vuoto non rompe il drawer — componente `MetaTable` gestisce array vuoto
- [x] UI non hardcodifica nessun servizio — render dinamico da `services[]`
- [x] `minio_console` non compare se assente dalla response

---

## Checklist Storage

- [x] `GET /api/admin/system/storage-configs` popola banner, env_fallback e tabella DB
- [x] Create invia payload con naming backend reale (nessun campo italiano)
- [x] Edit non perde i secret se i campi non sono stati toccati (payload omette key se vuoti)
- [x] Test connessione chiama endpoint reale, aggiorna `last_test_status` via `loadList()`
- [x] Attivazione chiama `activate`, aggiorna `current_source` nel banner
- [x] I secret non vengono mai visualizzati in chiaro (campi mai precompilati, `type="password"`)
- [x] Elimina usa `DELETE` — rimossa azione "Disattiva"

---

## Gap dal documento 142 — stato correzioni

| # | Gap | Corretto |
|---|-----|---------|
| 1 | Health: stato `unknown` → usare `not_configured` | ✓ Sostituito |
| 2 | Health: servizi hardcodati con id diversi | ✓ Render dinamico da `services[]` |
| 3 | Storage: field names italiani invece di backend | ✓ Tutti rinominati al naming backend |
| 4 | Storage: azione "Disattiva" senza endpoint | ✓ Sostituita con "Elimina" via DELETE |
| 5 | Storage: edit poteva inviare secret vuoti | ✓ Invio condizionato a valore non vuoto |

---

## Criteri di accettazione — stato

1. ✓ Frontend non usa più mock shape locali per health/storage
2. ✓ Frontend usa solo naming backend reale
3. ✓ Tutti i pulsanti rispettano i permessi (`hasPermission(...)`)
4. ✓ I segreti restano sempre mascherati
5. ✓ Flussi base pronti per validazione QA senza workaround

---

## File finali modificati in questa sessione

| File | Stato |
|------|-------|
| `src/services/api.ts` | `systemHealthApi` + `systemStorageApi` + tutti i tipi |
| `src/pages/admin/SistemaHealthPage.tsx` | Riscritto con API reale |
| `src/pages/admin/SistemaStoragePage.tsx` | Riscritto con API reale |
| `src/App.tsx` | Route già presenti dalla sessione 139 |
| `src/layout/sidebar/menuItems.ts` | Voci già presenti dalla sessione 139 |
