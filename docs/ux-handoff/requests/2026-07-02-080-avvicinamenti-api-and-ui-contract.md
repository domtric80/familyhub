# Handoff UX/API — Sezione Avvicinamenti

Data: 2026-07-02  
Area: `Minori > Avvicinamenti`  
Priorità: alta

## Obiettivo

Attivare una sezione operativa per gestire incontri e percorsi di avvicinamento del minore verso figure di riferimento autorizzate.

Il backend espone:

- lookup tipologie avvicinamento
- CRUD admin tipologie
- CRUD operativo avvicinamenti
- audit e storico minore su create/update/delete

## Modello funzionale

Un avvicinamento è un record pianificato o consuntivato con:

- minore
- tipologia avvicinamento
- contatto del minore coinvolto opzionale
- operatore supervisore opzionale
- titolo
- obiettivo
- luogo
- date pianificate / effettive
- stato
- note esito
- prossimi passi

## Endpoint

### Lookup

- `GET /api/lookups/approach-types`

### Admin tipologie

- `GET /api/admin/approach-types`
- `POST /api/admin/approach-types`
- `GET /api/admin/approach-types/{approach_type}`
- `PUT /api/admin/approach-types/{approach_type}`
- `DELETE /api/admin/approach-types/{approach_type}`

### Operativo

- `GET /api/approaches`
- `POST /api/approaches`
- `GET /api/approaches/{approach}`
- `PUT /api/approaches/{approach}`
- `PATCH /api/approaches/{approach}`
- `DELETE /api/approaches/{approach}`

## Filtri lista

`GET /api/approaches`

Query supportate:

- `facility_id`
- `minor_id`
- `approach_type_id`
- `minor_contact_id`
- `status`

## Payload create/update

```json
{
  "minor_id": 12,
  "approach_type_id": 2,
  "minor_contact_id": 44,
  "supervising_staff_member_id": 7,
  "title": "Incontro con tutore",
  "objective": "Verificare andamento scolastico e relazionale.",
  "location": "Sala colloqui",
  "planned_start_at": "2026-07-10T10:00:00+02:00",
  "planned_end_at": "2026-07-10T11:00:00+02:00",
  "actual_start_at": null,
  "actual_end_at": null,
  "status": "planned",
  "outcome_notes": null,
  "next_steps": null
}
```

## Stati

Valori ammessi:

- `planned`
- `in_progress`
- `completed`
- `cancelled`

UX non deve hardcodare etichette extra oltre questi valori senza allineamento.

## Risposta utile per UI

La response dettaglio/lista include relazioni:

- `facility`
- `minor`
- `approach_type`
- `minor_contact`
- `supervising_staff_member`
- `created_by`
- `updated_by`

## Regole UX richieste

- pagina separata `Avvicinamenti` nel menu minore/app
- lista con filtri per struttura, minore, tipologia, stato, contatto
- bottone `Nuovo avvicinamento`
- form con select lookup per `approach_type_id`
- form con select contatti filtrata sui contatti del minore
- form con select supervisore filtrata sugli operatori della struttura del minore
- stato in badge
- dettaglio/edizione in pagina o drawer

## Messaggi/validazioni da gestire

- `minor_contact_id` non del minore selezionato → errore backend
- `supervising_staff_member_id` fuori struttura → errore backend
- permessi insufficienti → `403`

## Nota importante

Questa prima versione modella l’avvicinamento come singolo evento/step operativo, non come pratica multi-step con workflow separato. Se in seguito servirà un “caso di avvicinamento” con più incontri collegati, estenderemo con entità padre.
