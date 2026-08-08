# Handoff UX/API — Admin Tipi Avvicinamento

Data: 2026-07-02  
Area: `Amministrazione > Tipi Avvicinamento`  
Priorità: alta

## Obiettivo

Gestire l’anagrafica delle tipologie di avvicinamento usate nella sezione operativa `Avvicinamenti`.

## Endpoint

- `GET /api/admin/approach-types`
- `POST /api/admin/approach-types`
- `GET /api/admin/approach-types/{approach_type}`
- `PUT /api/admin/approach-types/{approach_type}`
- `DELETE /api/admin/approach-types/{approach_type}`

Lookup operativo:

- `GET /api/lookups/approach-types`

## Campi record

```json
{
  "id": 1,
  "code": "FAMILY_VISIT",
  "name": "Avvicinamento familiare",
  "description": "Incontro finalizzato al rafforzamento o ripresa della relazione familiare.",
  "sort_order": 10,
  "is_active": true
}
```

## Regole UX

- tabella con colonne: `code`, `name`, `description`, `sort_order`, `is_active`
- azioni: nuovo, modifica, elimina
- `code` tecnico stabile
- `name` etichetta utente
- `is_active=false` deve nascondere il tipo dalle select operative

## Validazioni da gestire

- `code` univoco
- `name` obbligatorio
- `sort_order` intero non negativo

## Nota frontend

La select nella pagina `Avvicinamenti` deve leggere esclusivamente `GET /api/lookups/approach-types`, non la lista admin completa.
