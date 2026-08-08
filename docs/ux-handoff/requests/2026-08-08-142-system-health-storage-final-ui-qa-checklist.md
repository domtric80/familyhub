# FamilyHub — Blocco finale UX/QA — Sistema Health + Storage

Data: 2026-08-08  
Owner backend: Codex  
Ambito: completamento integrazione frontend per `Amministrazione > Sistema`

## Obiettivo

Chiudere in modo definitivo il collegamento frontend/backend delle due nuove sezioni:

- `Health Servizi`
- `Configurazione Storage`

Questo documento sostituisce ogni interpretazione libera lato UI: il team frontend deve attenersi ai contratti API già consegnati e a questa checklist finale.

## Documenti da usare come fonte unica

- `docs/ux-handoff/requests/2026-08-08-140-health-servizi-api-contract.md`
- `docs/ux-handoff/requests/2026-08-08-141-storage-configuration-api-contract.md`
- `docs/api/openapi.yaml`

## Gap da correggere subito nel frontend

Dalla review dei file UI già predisposti risultano questi scostamenti:

### 1. Health servizi — mapping stato errato

Backend usa:

- `ok`
- `warning`
- `error`
- `not_configured`

La UI mock attuale usa invece:

- `ok`
- `warning`
- `error`
- `unknown`

Correzione obbligatoria:

- sostituire `unknown` con `not_configured` come stato reale backend
- non inventare conversioni lato frontend

### 2. Health servizi — chiavi servizio errate

Backend restituisce `service` con valori:

- `api_backend`
- `database`
- `redis`
- `queue_worker`
- `scheduler`
- `storage`
- `antivirus`
- `smtp`
- `minio_console` solo se applicabile

La UI mock attuale usa id diversi:

- `api`
- `postgres`
- `queue`
- `clamav`
- `minio`

Correzione obbligatoria:

- non usare whitelist frontend
- renderizzare direttamente `services[]` come arriva dal backend

### 3. Storage — shape dati non allineata

Backend restituisce campi:

- `name`
- `code`
- `provider_type`
- `bucket`
- `region`
- `endpoint`
- `use_path_style_endpoint`
- `prefix`
- `is_active`
- `is_default`
- `last_tested_at`
- `last_test_status`
- `last_test_message`
- `access_key_masked`
- `secret_key_masked`
- `has_access_key`
- `has_secret_key`

La UI mock attuale usa alias diversi:

- `nome`
- `codice`
- `provider`
- `path_style`
- `attivo`
- `ultimo_test`
- `test_esito`

Correzione obbligatoria:

- eliminare il mapping mock italiano
- usare i campi API reali

### 4. Storage — action “Disattiva” non coerente con backend

Backend oggi espone:

- `DELETE /api/admin/system/storage-configs/{storageConfig}`

Non esiste endpoint dedicato “disattiva”.

Correzione obbligatoria:

- sostituire l’azione UI “Disattiva” con `Elimina`
- se in futuro servirà “disattiva senza delete”, sarà un requisito nuovo, non implicito

### 5. Storage — edit secret

Regola backend reale:

- secret non restituiti mai in chiaro
- se non inviati, restano invariati
- se inviati vuoti, vengono azzerati

Correzione obbligatoria:

- il frontend deve inviare `access_key` e `secret_key` solo quando l’utente li modifica davvero
- evitare submit automatico di stringhe vuote se il form non è stato toccato

## Comportamento UI definitivo richiesto

## Health Servizi

### Header

Mostrare:

- titolo pagina
- badge o testo `Sorgente storage runtime: ENV|DB`
- pulsante `Esegui controllo` solo se utente ha permesso `system_health.run`

### KPI

Mostrare sempre:

- Operativi
- Warning
- Errori
- Non configurati

Fonte unica:

- `summary.ok`
- `summary.warning`
- `summary.error`
- `summary.not_configured`

### Lista servizi

Per ogni riga:

- `label`
- badge da `status`
- `message`
- `checked_at`
- `latency_ms` se presente
- pulsante/row expand per dettaglio

### Drawer dettaglio

Mostrare:

- `service`
- `error` se valorizzato
- `meta` chiave/valore

Non mostrare:

- segreti
- token
- chiavi storage

### Empty/edge cases

- se `services` è vuoto, mostrare stato vuoto pulito
- se `minio_console` non arriva, non deve comparire alcun placeholder

## Configurazione Storage

### Banner stato runtime

Se `current_source = ENV`:

- banner informativo che lo storage attivo arriva da ambiente

Se `current_source = DB`:

- banner informativo che lo storage attivo arriva da configurazione amministrativa

### Tabella

Per ogni riga:

- `name`
- `code`
- `provider_type`
- `bucket`
- `endpoint`
- `region`
- `use_path_style_endpoint`
- `is_active`
- `is_default`
- `last_tested_at`
- `last_test_status`

### Azioni riga

- `Modifica`
- `Test connessione`
- `Attiva`
- `Elimina`

Visibilità azioni in base ai permessi:

- senza `system_storage.update` → no modifica
- senza `system_storage.test` → no test
- senza `system_storage.activate` → no attiva
- senza `system_storage.delete` → no elimina

### Form create/edit

Campi:

- `code`
- `name`
- `provider_type`
- `bucket`
- `region`
- `endpoint`
- `use_path_style_endpoint`
- `access_key`
- `secret_key`
- `prefix`
- `is_active`
- `is_default`

### Provider select

Select chiusa, valori esatti:

- `minio`
- `aws_s3`
- `s3_compatible`

Label utente:

- MinIO
- AWS S3
- S3 compatibile

## QA checklist finale

## Health servizi

- [ ] `GET /api/admin/system/health` popola KPI e tabella
- [ ] `POST /api/admin/system/health/run` aggiorna i dati a schermo
- [ ] utente senza `system_health.run` non vede il pulsante di run
- [ ] badge `not_configured` è neutro/grigio
- [ ] `meta` vuoto non rompe il drawer
- [ ] UI non hardcodifica servizi assenti

## Storage

- [ ] `GET /api/admin/system/storage-configs` popola banner, tabella e stato runtime
- [ ] create invia payload con naming backend reale
- [ ] edit non perde i secret se i campi non sono stati toccati
- [ ] test connessione aggiorna `last_test_status` e `last_test_message`
- [ ] attivazione aggiorna `current_source` a `DB`
- [ ] i secret non vengono mai visualizzati in chiaro dopo il salvataggio
- [ ] elimina usa `DELETE`, non azione custom “disattiva”

## Criteri di accettazione

Il blocco si considera chiuso quando:

1. frontend smette di usare mock shape locali per health/storage
2. frontend usa solo il naming reale backend
3. tutti i pulsanti rispettano i permessi
4. i segreti restano sempre mascherati
5. il team QA valida i flussi base senza workaround

## Nota al team frontend

Le due pagine esistono già come base visiva, ma non vanno considerate “quasi finite” finché non vengono allineate ai contratti reali.

Il backend è pronto.  
Da questo momento eventuali differenze residue tra UI e API vanno trattate come bug di integrazione, non come comportamento atteso.

