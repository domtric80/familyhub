# Handoff UX/API — Dashboard minore: trend PEI

Data: 2026-07-03  
Area: `Minori > Scheda minore > Dashboard/Profilo/PEI`

## 1. Obiettivo

Esporre nella scheda del minore un blocco già pronto per la dashboard con i trend degli obiettivi `PEI`, così il frontend può mostrare andamento e segnali operativi senza ricostruire i dati a mano dai log grezzi.

## 2. Nuovo payload backend

L'endpoint:
- `GET /api/minors/{minor}`

ora restituisce anche:
- `pei_trends`

## 3. Struttura `pei_trends`

```json
{
  "pei_trends": {
    "summary": {
      "total_peis": 1,
      "active_peis": 1,
      "total_objectives": 4,
      "completed_objectives": 1,
      "average_progress_percent": 52.5,
      "linked_activity_events": 6,
      "linked_journal_events": 9
    },
    "objective_trends": [
      {
        "objective_id": 55,
        "minor_pei_id": 12,
        "objective_code": "OBJ-A1",
        "objective_title": "Autonomia personale",
        "status": "in_progress",
        "current_progress_percent": 65,
        "last_progress_at": "2026-07-03T09:15:00Z",
        "series": [
          {
            "logged_at": "2026-07-01T08:00:00Z",
            "progress_percent": 30,
            "status": "in_progress",
            "source_type": null,
            "source_id": null,
            "source_label": null,
            "notes": "Creazione obiettivo PEI"
          },
          {
            "logged_at": "2026-07-03T09:15:00Z",
            "progress_percent": 65,
            "status": "in_progress",
            "source_type": "minor_activity",
            "source_id": "201",
            "source_label": "Laboratorio autonomia",
            "notes": "Attività collegata: Laboratorio autonomia [completed]."
          }
        ]
      }
    ],
    "recent_events": []
  }
}
```

## 4. Come usare questo blocco in UI

### 4.1 KPI testata dashboard minore

Mostrare almeno:
- `PEI attivi`
- `Obiettivi totali`
- `Obiettivi completati`
- `Avanzamento medio`
- `Eventi da Attività`
- `Eventi da Diario educativo`

### 4.2 Grafico andamento obiettivi

Per ogni obiettivo:
- usare `objective_trends[].series`
- asse X = `logged_at`
- asse Y = `progress_percent`
- colore o badge = `status`

### 4.3 Timeline eventi recenti

Usare `recent_events` come lista rapida:
- data/ora
- obiettivo
- sorgente (`Attività`, `Diario educativo`, oppure aggiornamento manuale)
- nota
- utente attore se presente

## 5. Regole importanti per UX

- non calcolare i KPI PEI sommando dati client-side dai vari moduli
- usare sempre `pei_trends.summary` come fonte primaria
- se `source_type` è `minor_activity`, mostrare etichetta `Attività`
- se `source_type` è `minor_journal_entry`, mostrare etichetta `Diario educativo`
- se `source_type` è `null`, trattare l'evento come aggiornamento manuale o iniziale del PEI

## 6. Nota implementativa

Il backend continua a restituire anche `peis`, `objectives`, `progress_logs` e `history_entries`. `pei_trends` non sostituisce quei dati: li sintetizza per dashboard e visual analytics.
