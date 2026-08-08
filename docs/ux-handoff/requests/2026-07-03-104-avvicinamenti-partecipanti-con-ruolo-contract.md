# Handoff UX/API — Partecipanti avvicinamento con ruolo specifico

Data: 2026-07-03  
Area: `Minori > Avvicinamenti familiari`  
Priorità: Alta

## Obiettivo

Ogni avvicinamento può coinvolgere più contatti e per ciascun contatto deve essere visibile il **ruolo nel singolo evento**:

- madre
- padre
- affidatario
- tutore
- altro ruolo censito in `contact_types`

Non usare testo libero.

## Nuovo payload preferito

Endpoint:

- `POST /api/approaches`
- `PUT /api/approaches/{approach}`
- `PATCH /api/approaches/{approach}`

Payload preferito:

```json
{
  "minor_id": 12,
  "approach_type_id": 3,
  "participants": [
    { "minor_contact_id": 44, "contact_type_id": 2 },
    { "minor_contact_id": 45, "contact_type_id": 7 }
  ],
  "title": "Videochiamata con nucleo affidatario",
  "planned_start_at": "2026-07-03 17:00:00"
}
```

## Retrocompatibilità

`minor_contact_id` e `minor_contact_ids` restano accettati, ma UX deve migrare a `participants`.

## Response da usare

La response di dettaglio/lista include:

- `participants[]`
  - `minor_contact_id`
  - `contact_type_id`
  - `contact_type`
  - `contact`
  - `sort_order`

## Regole UX obbligatorie

### Form

Il form non deve limitarsi a una multi-select semplice.  
Serve una griglia ripetibile del tipo:

- contatto
- ruolo nel singolo avvicinamento

Esempio riga:

- `Contatto: Maria Rossi`
- `Ruolo nel contatto: Madre`

### Sorgenti dati

- contatti del minore
- lookup `contact_types`

### Comportamento

- se il ruolo non viene scelto, il backend usa il ruolo anagrafico del contatto
- UX dovrebbe comunque precompilare il ruolo anagrafico e lasciarlo modificabile se il caso operativo lo richiede

## Lista / dettaglio

Nella lista e nel dettaglio mostrare i partecipanti in forma leggibile:

- `Maria Rossi (Madre)`
- `Paolo Rossi (Padre)`
- `Anna Verdi (Affidataria)`

## QA minima

- creare avvicinamento con 2 contatti e 2 ruoli distinti
- riaprire il record e verificare che i ruoli siano persistiti
- verificare response `participants`
- verificare che la lista mostri i nomi con ruolo tra parentesi
