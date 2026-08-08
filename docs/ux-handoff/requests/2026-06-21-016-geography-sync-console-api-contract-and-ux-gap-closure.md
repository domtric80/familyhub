# FamilyHub · Richiesta UX 016 · Contratto API reale console sync geografia + chiusura gap menu permessi

Data: 2026-06-21
Motivo: il backend ha ora endpoint reali per la console sync geografia; inoltre la risposta UX 015 non è completamente allineata alla spec originaria su menu e permessi.

## 1. Verifica risposta UX 015

Elementi ricevuti correttamente:

- pagina dedicata presente
- sezioni richieste presenti
- tabelle issue/decisioni/run presenti
- modali di avvio/publish previste

Gap da correggere:

- la voce menu deve essere **nascosta** senza `geography_sync.read`
- la posizione menu deve restare semanticamente allineata a:
  - `Anagrafiche > Geografia > Sincronizzazione`
- il filtro permessi non può essere solo nella pagina: deve agire anche sul menu

## 2. Endpoint backend ora disponibili

- `GET /api/admin/geography-sync/runs/latest`
- `GET /api/admin/geography-sync/runs`
- `GET /api/admin/geography-sync/runs/{run}`
- `GET /api/admin/geography-sync/runs/{run}/issues`
- `GET /api/admin/geography-sync/runs/{run}/decisions`
- `POST /api/admin/geography-sync/runs`
- `POST /api/admin/geography-sync/runs/{run}/publish`

## 3. Stato attuale endpoint

### Implementati e funzionanti

- `latest`
- `runs`
- `run detail`
- `issues`
- `decisions`
- `start run`

### Implementato ma non operativo in modo completo

- `publish`

Comportamento attuale:

- restituisce `409`
- messaggio: publish automatico non ancora disponibile in questa fase

UX deve quindi mantenere il pulsante, ma gestire il caso `409` come stato previsto e non come errore inatteso.

## 4. Contratto response `GET /runs/latest` e `GET /runs/{id}`

Response envelope:

```json
{
  "data": {
    "id": 12,
    "run_uuid": "uuid",
    "trigger_mode": "manual",
    "scope": "italy_admin_seed",
    "status": "completed",
    "started_at": "2026-06-21T08:00:00.000000Z",
    "finished_at": "2026-06-21T08:00:03.000000Z",
    "source_file_count": 0,
    "raw_record_count": 18,
    "normalized_record_count": 18,
    "published_record_count": 0,
    "issue_count": 0,
    "error_count": 0,
    "warning_count": 0,
    "sources": ["seed"],
    "stats": {
      "countries_parsed": 1,
      "regions_parsed": 3,
      "provinces_parsed": 6,
      "cities_parsed": 8,
      "valid_countries": 0
    },
    "summary": {}
  }
}
```

Nota:

- `summary` è presente nel detail e nel `start run`
- su `latest` può essere omesso

## 5. Contratto response `GET /runs`

Response:

```json
{
  "data": [
    {
      "id": 12,
      "run_uuid": "uuid",
      "trigger_mode": "manual",
      "scope": "full",
      "status": "completed_with_warnings",
      "started_at": "...",
      "finished_at": "...",
      "source_file_count": 1,
      "raw_record_count": 250,
      "normalized_record_count": 250,
      "published_record_count": 0,
      "issue_count": 4,
      "error_count": 0,
      "warning_count": 4,
      "sources": ["geonames"],
      "stats": {
        "countries_parsed": 250,
        "regions_parsed": 0,
        "provinces_parsed": 0,
        "cities_parsed": 0,
        "valid_countries": 250
      }
    }
  ]
}
```

## 6. Contratto response `GET /issues`

```json
{
  "data": [
    {
      "id": 1,
      "severity": "warning",
      "issue_type": "missing_iso3_code",
      "entity_level": "country",
      "source_system": "geonames",
      "source_record_key": "AD",
      "target_table": null,
      "target_record_id": null,
      "message": "Codice ISO3 mancante...",
      "is_blocking": false,
      "resolved_at": null,
      "resolution_notes": null,
      "details": {}
    }
  ]
}
```

## 7. Contratto response `GET /decisions`

Attualmente può legittimamente restituire:

```json
{
  "data": []
}
```

UX non deve trattarlo come errore, ma come empty state esplicito:

- `Nessuna decisione di publish disponibile per questo run`

## 8. Contratto request `POST /runs`

Payload:

```json
{
  "scope": "italy_admin_seed",
  "source": "seed",
  "dry_run": true
}
```

Valori attualmente supportati:

- `source`: `geonames`, `seed`
- `scope`: stringa libera, ma usare:
  - `full`
  - `italy_admin_seed`

## 9. Contratto response `POST /runs`

### Successo

HTTP `201`

```json
{
  "message": "Run di sincronizzazione completato.",
  "data": { "...run..." },
  "exit_code": 0
}
```

### Errore run già attivo

HTTP `409`

```json
{
  "message": "Un run di sincronizzazione è già in esecuzione."
}
```

### Errore esecuzione

HTTP `422`

```json
{
  "message": "Run di sincronizzazione completato con errori.",
  "data": { "...run..." },
  "exit_code": 1
}
```

## 10. Comportamenti UX richiesti ora

- mostrare menu solo con `geography_sync.read`
- mantenere pulsante `Pubblica modifiche sicure`, ma gestire `409` come stato atteso
- mostrare empty state su decisioni vuote
- mostrare filtri issue senza assumere paginazione lato backend
- usare envelope `data`

## 11. Azione richiesta al team UX

Aggiornare:

- menu capability-aware
- adapter API con envelope `data`
- gestione `409` del publish
- empty state decisioni

Risposta attesa in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-21-016-geography-sync-console-api-contract-and-ux-gap-closure-response.md`
