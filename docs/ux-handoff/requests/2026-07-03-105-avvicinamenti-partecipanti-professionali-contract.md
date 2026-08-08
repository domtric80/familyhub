# Handoff UX/API — Partecipanti professionali negli avvicinamenti

Data: 2026-07-03  
Area: `Minori > Avvicinamenti familiari`  
Priorità: Alta

## Obiettivo

Un avvicinamento può coinvolgere anche figure professionali, ad esempio:

- psicologo
- assistente sociale
- educatore presente
- coordinatore
- mediatore culturale

Queste figure non devono essere trattate come contatti familiari.

## Nuovo payload backend

Accanto a `participants` è disponibile:

```json
{
  "staff_participants": [
    { "staff_member_id": 21, "qualification_code": "PSICOLOGO" },
    { "staff_member_id": 22, "qualification_code": "ASSISTENTE_SOCIALE" }
  ]
}
```

## Regole dati

- `staff_member_id` deve appartenere alla stessa struttura del minore
- `qualification_code` è opzionale
- se `qualification_code` è omesso, il backend usa la qualifica anagrafica dello staff member

## Response

La response espone:

- `staff_participants[]`
  - `staff_member_id`
  - `qualification_code`
  - `qualification`
  - `staff_member`
  - `sort_order`
- `staff_participants_count`

## Regole UX obbligatorie

Nel form avvicinamento servono **due blocchi distinti**:

### 1. Partecipanti familiari / tutori

Usano:

- `participants[]`

### 2. Partecipanti professionali

Usano:

- `staff_participants[]`

Ogni riga deve permettere:

- selezione operatore
- ruolo professionale nel singolo evento

## Esempio UI

### Familiari coinvolti

- Maria Rossi — Madre
- Paolo Rossi — Padre

### Professionisti presenti

- Dott.ssa Bianchi — Psicologo
- Luca Verdi — Assistente sociale

## QA minima

- creare un avvicinamento con 2 familiari e 2 professionisti
- riaprire il dettaglio e verificare entrambi i blocchi
- verificare `staff_participants_count`
- verificare che il primo professionista venga anche valorizzato come `supervising_staff_member_id` per retrocompatibilità backend
