# Handoff UX/API — Diario del minore

Data: 2026-07-02  
Area: `Minori > Diario educativo`  
Priorità: alta

## Obiettivo

Attivare una sezione diario per registrare osservazioni ed eventi relativi al minore in forma strutturata, auditabile e filtrabile.

## Anagrafiche correlate

Tipologie diario:

- `GET /api/lookups/journal-entry-types`
- `GET /api/admin/journal-entry-types`
- `POST /api/admin/journal-entry-types`
- `GET /api/admin/journal-entry-types/{journal_entry_type}`
- `PUT /api/admin/journal-entry-types/{journal_entry_type}`
- `DELETE /api/admin/journal-entry-types/{journal_entry_type}`

## Endpoint operativi

- `GET /api/journals`
- `POST /api/journals`
- `GET /api/journals/{journal}`
- `PUT /api/journals/{journal}`
- `PATCH /api/journals/{journal}`
- `DELETE /api/journals/{journal}`

## Payload create/update

```json
{
  "minor_id": 12,
  "journal_entry_type_id": 1,
  "observed_at": "2026-07-02T15:30:00+02:00",
  "title": "Osservazione pomeridiana",
  "content": "Il minore ha partecipato con attenzione alle attività programmate.",
  "follow_up_required": true,
  "follow_up_notes": "Verificare continuità domani."
}
```

## Filtri lista

`GET /api/journals`

Query supportate:

- `facility_id`
- `minor_id`
- `journal_entry_type_id`

## Dati utili per UI

La lista/dettaglio include:

- `facility`
- `minor`
- `journal_entry_type`
- `created_by`
- `updated_by`

## Regole UX richieste

- pagina dedicata `Diario educativo`
- tabella con colonne minime:
  - data/ora osservazione
  - minore
  - tipologia
  - titolo
  - flag follow-up
  - autore ultimo aggiornamento
- filtri sopra tabella
- form nuova voce / modifica voce
- `content` in textarea estesa
- `follow_up_required` come switch/checkbox
- `follow_up_notes` visibile sempre o condizionato se follow-up attivo

## Stati e messaggi

- `403` se utente non autorizzato sul minore
- `422` per campi mancanti o formati data errati

## Nota operativa

Questa v1 registra singole voci diario. Se in seguito serviranno allegati o firma/validazione della voce, estenderemo la tabella mantenendo compatibilità.
