# UX Handoff — 2026-08-09 — Timesheet lock contabile mensile

## Contesto
Backend completato per lo step roadmap **1B Lock contabile mensile** del modulo `Turni / Timesheet`.

## Obiettivo funzionale
Consentire a coordinatore/amministrazione di:
- vedere i mesi già bloccati per struttura
- chiudere contabilmente un mese
- riaprire un mese già chiuso

Dopo il lock mensile il backend blocca davvero:
- nuove timbrature (`attendance-events`)
- invio timesheet dell'operatore
- nuove rettifiche timesheet
- approvazione/rifiuto rettifiche
- rifiuto entry admin

## Permesso richiesto
Usare il permesso RBAC:
- `staff_timesheet_entries.lock`

## Endpoint nuovi

### 1) Lista lock mensili
`GET /api/admin/timesheet-month-locks?facility_id={id}`

Response item:
```json
{
  "id": 3,
  "facility_id": 2,
  "year": 2026,
  "month": 7,
  "is_locked": true,
  "locked_at": "2026-08-09T17:24:00+02:00",
  "unlocked_at": null,
  "notes": "Chiusura amministrativa mese luglio.",
  "facility": { "id": 2, "name": "Arcobaleno" },
  "locked_by": {
    "id": 1,
    "first_name": "Administrator",
    "last_name": "System",
    "email": "admin@familyhub.local"
  },
  "unlocked_by": null
}
```

### 2) Chiusura mese
`POST /api/admin/timesheet-month-locks`

Payload:
```json
{
  "facility_id": 2,
  "year": 2026,
  "month": 7,
  "notes": "Chiusura amministrativa mese luglio."
}
```

Response `201`:
```json
{
  "message": "Lock mensile eseguito con successo.",
  "lock": { ...shape lista... },
  "entries_locked": 24
}
```

### 3) Riapertura mese
`POST /api/admin/timesheet-month-locks/{monthLock}/unlock`

Response `200`:
```json
{
  "message": "Lock mensile riaperto con successo.",
  "lock": { ...shape lista... },
  "entries_unlocked": 24
}
```

## Regole backend da mostrare chiaramente in UI
La chiusura mese fallisce con `422` se:
- non esistono entry nel periodo
- esistono entry del mese non ancora `approved` o `locked`
- esistono rettifiche `pending`
- il mese è già bloccato

Messaggi da esporre senza reinterpretarli.

## Comportamento UI richiesto

### Pagina consigliata
Sezione nuova in `Turni / Timesheet` oppure in area admin turni:
- filtro `Struttura`
- tabella `Lock mensili`
- CTA `Chiudi mese`
- azione riga `Riapri mese`

### Form chiusura mese
Campi:
- `Struttura` select obbligatoria
- `Anno` select/number obbligatorio
- `Mese` select obbligatorio
- `Note` textarea opzionale

### Tabella lock
Colonne consigliate:
- struttura
- periodo (`YYYY-MM`)
- stato (`Bloccato` / `Riaperto`)
- bloccato il
- bloccato da
- riaperto il
- riaperto da
- note
- azioni

### Badge stato
- `Bloccato` se `is_locked=true`
- `Riaperto` se `is_locked=false`

## Effetti secondari da considerare in UI timesheet
Se il backend risponde `422` con uno dei messaggi di lock, nelle pagine:
- `Le mie presenze`
- `Verifica timesheet`
- eventuale pannello timbrature

la UI deve mostrare il messaggio del backend e disabilitare i CTA di modifica se il mese risulta bloccato.

## Checklist QA UX
- carica lista lock senza errori
- chiude un mese con entry approvate
- impedisce doppio lock dello stesso mese
- mostra errore se esistono rettifiche pending
- riapre un mese bloccato
- dopo il lock, tentativo di rettifica/timbratura genera messaggio backend corretto
