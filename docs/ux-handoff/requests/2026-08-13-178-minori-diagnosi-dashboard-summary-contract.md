# FamilyHub — Handoff UX/API — Modulo Minori — Diagnosi cifrate + Dashboard summary

Data: 2026-08-13  
Area: `Minori > Dettaglio minore`  
Priorita: alta  
Tipo: completamento backend + contratto frontend asincrono

## Obiettivo

Chiudere due punti residui del modulo `Minori`:

1. sicurezza dati clinici diagnosi / DSM
2. dashboard minore con indicatori immediati e scadenze operative

## 1) Diagnosi cliniche / DSM

### Stato backend

Il campo:

- `diagnosis_notes_encrypted`

è ora **cifrato a riposo nel database**.

Il backend continua a restituire il valore decrittato ai ruoli autorizzati nelle API di dettaglio minore.

### Regola UX

Il campo deve essere trattato come:

- `Nota clinica diagnosi`
- contenuto sensibile
- da non replicare in liste, badge, tooltip, audit panel o riepiloghi compressi

### Endpoint coinvolti

- `POST /api/minors/{minor}/diagnoses`
- `PUT /api/minors/{minor}/diagnoses/{diagnosis}`
- `PATCH /api/minors/{minor}/diagnoses/{diagnosis}`
- `GET /api/minors/{minor}`

## 2) Dashboard summary del minore

### Nuovo nodo payload

Dentro `GET /api/minors/{minor}` è disponibile:

- `dashboard_summary`

### Shape

```json
{
  "dashboard_summary": {
    "summary": {
      "active_diagnoses_count": 1,
      "primary_diagnosis_label": "Disturbo d'ansia in osservazione",
      "open_needs_count": 1,
      "high_priority_open_needs_count": 1,
      "active_peis_count": 1,
      "upcoming_deadlines_count": 3,
      "overdue_deadlines_count": 0
    },
    "high_priority_needs": [
      {
        "id": 12,
        "category_code": "relational",
        "title": "Stabilizzare relazione con figura educativa",
        "status": "in_progress",
        "priority": "high"
      }
    ],
    "upcoming_deadlines": [
      {
        "type": "diagnosis_review",
        "label": "Disturbo d'ansia in osservazione",
        "date": "2026-10-01",
        "is_overdue": false
      },
      {
        "type": "pei_review",
        "label": "PEI secondo semestre 2026",
        "date": "2026-09-30",
        "is_overdue": false
      },
      {
        "type": "pei_objective_due",
        "label": "Migliorare autonomia quotidiana",
        "date": "2026-08-15",
        "is_overdue": false
      }
    ],
    "recent_relevant_events": [
      {
        "id": 100,
        "event_type": "minor_pei_objective_updated",
        "description": "System Administrator ha aggiornato l'obiettivo PEI ...",
        "created_at": "2026-08-13T10:00:00Z"
      }
    ]
  }
}
```

## Significato campi

### `summary`

- `active_diagnoses_count` = numero diagnosi attive
- `primary_diagnosis_label` = etichetta diagnosi primaria
- `open_needs_count` = bisogni in stato `open` o `in_progress`
- `high_priority_open_needs_count` = bisogni prioritari aperti/in corso
- `active_peis_count` = PEI attivi
- `upcoming_deadlines_count` = scadenze entro 30 giorni
- `overdue_deadlines_count` = scadenze già oltre data

### `high_priority_needs`

Top lista operativa dei bisogni più urgenti.

### `upcoming_deadlines`

Scadenze miste provenienti da:

- revisione diagnosi
- revisione PEI
- scadenza obiettivi PEI

### `recent_relevant_events`

Ultimi eventi rilevanti dello storico minore, già serializzati e leggibili.

## Impatto UX richiesto

### Header / dashboard minore

Aggiungere box/KPI per:

- diagnosi attive
- bisogni aperti
- bisogni alta priorità
- PEI attivi
- scadenze prossime
- scadenze scadute

### Widget “Scadenze”

Lista ordinata per data con badge tipo:

- revisione diagnosi
- revisione PEI
- obiettivo PEI

### Widget “Eventi rilevanti”

Timeline sintetica usando:

- `recent_relevant_events[].description`
- `recent_relevant_events[].created_at`

## Regole UX importanti

- non calcolare questi KPI lato frontend
- non derivare scadenze ricostruendo manualmente `diagnoses` / `peis`
- usare sempre `dashboard_summary` come fonte primaria

## QA checklist UX

- [ ] header minore usa `dashboard_summary.summary`
- [ ] lista scadenze usa `dashboard_summary.upcoming_deadlines`
- [ ] lista bisogni urgenti usa `dashboard_summary.high_priority_needs`
- [ ] timeline usa `dashboard_summary.recent_relevant_events`
- [ ] note diagnosi non vengono mostrate fuori dal contesto clinico protetto
