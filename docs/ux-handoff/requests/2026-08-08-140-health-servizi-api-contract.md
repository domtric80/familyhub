# FamilyHub — Handoff UX/API — Health Servizi

Data: 2026-08-08  
Owner backend: Codex  
Scope: pagina amministrativa “Health servizi” + refresh manuale

## Obiettivo

Esporre in UI lo stato tecnico dei servizi applicativi e infrastrutturali già monitorati dal backend, con una vista semplice:

- elenco servizi
- stato semaforico
- messaggio umano leggibile
- latenza quando disponibile
- metadati tecnici secondari in drawer/dettaglio
- pulsante “Esegui controllo” per refresh manuale

## Permessi

- Lettura pagina: `system_health.read`
- Avvio controllo manuale: `system_health.run`

Ruoli oggi abilitati dal backend:

- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`
- `REFERENTE_STRUTTURA`

## Endpoint

### 1. Snapshot corrente

`GET /api/admin/system/health`

Permesso richiesto: `system_health.read`

### 2. Esecuzione controllo manuale

`POST /api/admin/system/health/run`

Permesso richiesto: `system_health.run`

Effetto aggiuntivo backend:

- produce audit log di tipo `system_health`
- action logica: controllo manuale stato servizi

## Response contract

Entrambi gli endpoint rispondono con lo stesso payload JSON.

```json
{
  "generated_at": "2026-08-08T20:10:00+02:00",
  "storage_config_source": "ENV",
  "summary": {
    "ok": 5,
    "warning": 2,
    "error": 1,
    "not_configured": 1
  },
  "services": [
    {
      "service": "api_backend",
      "label": "API backend",
      "status": "ok",
      "checked_at": "2026-08-08T20:10:00+02:00",
      "latency_ms": 1.25,
      "message": "API applicativa disponibile.",
      "error": null,
      "meta": {}
    }
  ]
}
```

## Stati possibili

Valore `status`:

- `ok`
- `warning`
- `error`
- `not_configured`

Mappatura UI consigliata:

- `ok` → verde
- `warning` → giallo/arancio
- `error` → rosso
- `not_configured` → grigio

## Servizi oggi monitorati

La UI non deve hardcodare l’elenco: deve renderizzare `services[]` come arriva dal backend.

Valori attesi oggi in `service`:

- `api_backend`
- `database`
- `redis`
- `queue_worker`
- `scheduler`
- `storage`
- `antivirus`
- `smtp`
- `minio_console` solo se pertinente alla configurazione corrente

## Regole UI

### Header KPI

Mostrare 4 KPI:

- Operativi = `summary.ok`
- Warning = `summary.warning`
- Errori = `summary.error`
- Non configurati = `summary.not_configured`

### Tabella/Card list

Per ogni servizio mostrare:

- `label`
- badge stato da `status`
- `message`
- `latency_ms` se non nullo
- `checked_at`

### Dettaglio tecnico

Prevedere drawer o modale “Dettagli” con:

- `service`
- `error` se presente
- `meta` serializzato in forma leggibile chiave/valore

### Refresh manuale

Pulsante “Esegui controllo”:

- chiama `POST /api/admin/system/health/run`
- disabilitare il pulsante durante la richiesta
- al successo aggiornare KPI e lista servizi
- mostrare toast: `Controllo servizi completato.`

## Gestione errori frontend

- `403` → mostrare schermata permesso insufficiente
- `422` non atteso in flusso normale
- `500` → toast errore e mantenere ultima snapshot in pagina se già presente

## Note importanti per UX

- `storage_config_source` oggi vale sempre `ENV`; mostrarlo come etichetta informativa “Configurazione storage attuale: ENV”.
- Non tentare polling automatico aggressivo. Se serve auto-refresh, usare intervallo minimo 60 secondi.
- Non dedurre lo stato dal testo del messaggio: usare sempre `status`.
- `latency_ms` può essere `null`.
- `meta` può contenere dati diversi per servizio; renderizzare generico.

## QA checklist UX

- utente con solo `system_health.read` vede pagina ma non il pulsante run
- utente con `system_health.run` può lanciare il controllo
- `minio_console` non deve apparire se assente dalla response
- drawer dettaglio non deve rompersi con `meta` vuoto
- stato `not_configured` deve avere badge neutro, non errore

