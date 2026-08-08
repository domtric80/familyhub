# FamilyHub · Piano batch giornaliero geografia

Data: 2026-06-21

## 1. Obiettivo operativo

Realizzare un processo schedulato che:

- verifica se i dataset geografici sono cambiati
- importa i file in staging
- valida la qualità del dato
- produce un diff verso il modello canonico
- applica solo aggiornamenti sicuri
- genera evidenze per audit e supporto operativo

## 2. Scheduling consigliato

Frequenza:

- una volta al giorno

Finestra consigliata:

- `02:15 Europe/Rome`

Motivazione:

- basso carico applicativo
- tempo sufficiente per eventuale retry
- report disponibile la mattina

## 3. Comandi Laravel proposti

### `familyhub:geo-sync`

Scopo:

- orchestrare il run completo

Opzioni consigliate:

- `--scope=full`
- `--source=all|anpr|istat|geonames`
- `--dry-run`
- `--publish`
- `--since=YYYY-MM-DD`
- `--file=...`

### `familyhub:geo-quality-report`

Scopo:

- rigenerare il report qualità per l’ultimo run o per uno specifico run

### `familyhub:geo-reconcile-history`

Scopo:

- processare dataset storici comuni e proporre mapping/decisioni

## 4. Pipeline logica

### Step 1 · Acquire

- download da URL configurate
- verifica HTTP status
- salvataggio file
- hash SHA-256
- registrazione in `geo_source_files`

### Step 2 · Parse

- parse CSV/XLSX/XML secondo sorgente
- conversione in record raw
- validazione strutturale minima

### Step 3 · Normalize

- normalizzazione encoding
- trim
- uppercase codici
- allineamento campi comuni
- costruzione chiavi sorgente

### Step 4 · Validate

- controlli blocking
- controlli warning
- creazione `geo_import_issues`

### Step 5 · Diff

- confronto tra raw normalizzato e dato canonico
- proposta `create`, `update`, `deactivate`, `skip`

### Step 6 · Publish

- applicazione transazionale delle sole decisioni sicure
- snapshot e audit

### Step 7 · Report

- sintesi numerica
- issue summary
- exit status

## 5. Politica di sicurezza

Il batch:

- gira con utenza tecnica dedicata
- scrive solo su bucket privato / storage applicativo
- non espone file sorgente via web pubblica
- non elimina hard record canonici già referenziati
- usa transazioni DB per il publish
- logga ogni run con `run_uuid`

## 6. Politica di qualità

### Errori bloccanti

Esempi:

- file non leggibile
- colonne obbligatorie assenti
- duplicati chiave business
- record figli senza padre
- mapping ambiguo

Effetto:

- `publish` interrotto
- run `failed` o `completed_with_warnings` senza applicazione

### Warning non bloccanti

Esempi:

- CAP mancante
- codice catastale mancante
- rename sospetto
- differenze non critiche tra fonti

Effetto:

- publish consentito se il record resta coerente

## 7. Politica di retry

- retry automatico solo per failure di rete temporanei
- massimo 3 tentativi
- backoff progressivo
- nessun retry automatico su errori di qualità dati

## 8. Report atteso

Ogni run deve produrre almeno:

- sorgenti lette
- file cambiati / invariati
- record raw processati
- record creati
- record aggiornati
- record disattivati
- warning count
- error count
- issue bloccanti

## 9. Notifiche consigliate

Minimo:

- log applicativo
- tabella DB

Consigliato:

- email operativa su run failed
- email o webhook su run with warnings

## 10. Integrazione con Docker

Tutto è dockerizzabile.

Componenti:

- `app` esegue command scheduler
- `worker` esegue job asincroni
- `redis` gestisce queue
- `minio` o storage locale conserva i sorgenti

Configurazione consigliata:

- scheduler nel container `app`
- job pesanti nel container `worker`

## 11. Roadmap implementativa

### Step A

- introdurre tabelle `geo_source_files`, `geo_import_runs`, `geo_import_issues`
- aggiungere command `familyhub:geo-sync --dry-run`

### Step B

- aggiungere parser GeoNames nazioni
- aggiungere parser seed Italia iniziale

### Step C

- aggiungere parser ANPR/ISTAT
- quality gates blocking/non-blocking

### Step D

- introdurre publish automatico controllato
- report e dashboard admin

## 12. Decisione raccomandata

Per partire bene:

- implementare subito la pipeline
- tenere `publish` in `dry-run` nelle prime iterazioni
- abilitare publish automatico solo dopo 2–3 cicli di verifica reali

## 13. Stato implementazione attuale

Implementato in questa fase:

- migration iniziali:
  - `geo_source_files`
  - `geo_import_runs`
  - `geo_import_run_steps`
  - `geo_import_issues`
- migration raw staging:
  - `geo_source_countries_raw`
  - `geo_source_regions_raw`
  - `geo_source_provinces_raw`
  - `geo_source_cities_raw`
  - `geo_source_city_history_raw`
- command:
  - `familyhub:geo-sync`
- parser sorgente:
  - GeoNames `countryInfo`
  - seed Italia `italy_admin_seed` verso raw staging
- scheduler:
  - esecuzione giornaliera `02:15` in `dry-run`

Non ancora implementato:

- publish automatico sui master data
- parser ANPR/ISTAT
- tabelle raw dedicate per staging completo
- dashboard admin/API di consultazione run

- parser storico ANPR raw:
  - sorgente `anpr_history`
  - popolamento `geo_source_city_history_raw`
