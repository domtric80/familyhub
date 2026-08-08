# Richiesta UX 047 · Modulo Attività, contratto API e superfici UI

Data: 2026-06-28
Stato: READY_FOR_UX_IMPLEMENTATION
Priorità: ALTA

## 1. Obiettivo

Sostituire la pagina placeholder `Attività` con un modulo operativo reale.

## 2. Anagrafica necessaria

### Tipi attività

Endpoint admin:

- `GET /api/admin/activity-types`
- `POST /api/admin/activity-types`
- `GET /api/admin/activity-types/{activity_type}`
- `PUT /api/admin/activity-types/{activity_type}`
- `DELETE /api/admin/activity-types/{activity_type}`

Lookup pubblico autenticato:

- `GET /api/lookups/activity-types`

Campi:

- `code`
- `name`
- `description`
- `sort_order`
- `is_active`

## 3. Modulo operativo Attività

Endpoint:

- `GET /api/activities`
- `POST /api/activities`
- `GET /api/activities/{activity}`
- `PUT /api/activities/{activity}`
- `PATCH /api/activities/{activity}`
- `DELETE /api/activities/{activity}`

## 4. Payload create/update

```json
{
  "minor_id": 1,
  "activity_type_id": 2,
  "title": "Allenamento settimanale",
  "description": "Attività sportiva con educatore di riferimento",
  "location": "Palestra comunale",
  "planned_start_at": "2026-06-29T15:00:00+02:00",
  "planned_end_at": "2026-06-29T16:30:00+02:00",
  "actual_start_at": null,
  "actual_end_at": null,
  "status": "planned",
  "pei_objective_ref": "PEI-MOT-01",
  "outcome_notes": null
}
```

## 5. Filtri lista

`GET /api/activities` supporta:

- `facility_id`
- `minor_id`
- `activity_type_id`
- `status`

## 6. Stati controllati

Valori ammessi:

- `planned`
- `in_progress`
- `completed`
- `cancelled`

No testo libero.

## 7. UI richiesta

### 7.1 Pagina Attività

Vista lista con:

- filtro struttura
- filtro minore
- filtro tipo attività
- filtro stato
- tabella attività
- pulsante nuova attività

### 7.2 Colonne tabella

- Minore
- Tipo attività
- Titolo
- Luogo
- Inizio pianificato
- Fine pianificata
- Stato
- PEI
- Azioni

### 7.3 Form attività

Campi:

- Minore
- Tipo attività
- Titolo
- Descrizione
- Luogo
- Inizio pianificato
- Fine pianificata
- Inizio effettivo
- Fine effettiva
- Stato
- Riferimento PEI
- Note esito

## 8. Vincoli UX

- `activity_type_id` sempre select da lookup
- `status` sempre select controllata
- minore filtrato per struttura / visibilità utente
- nessun campo libero per classificazioni o ruoli

## 9. Messaggi consigliati

- creazione: `Attività registrata con successo.`
- aggiornamento: `Attività aggiornata con successo.`
- eliminazione: `Attività eliminata con successo.`

## 10. File vincolanti

- `C:\Projects\FamilyHUB\docs\architecture\2026-06-28-activities-module.md`
- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 11. Richiesta al team UX

Produrre risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-28-047-activities-module-api-and-ui-contract-response.md`
