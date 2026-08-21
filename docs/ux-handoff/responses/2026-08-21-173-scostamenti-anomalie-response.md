# UX handoff response — 173

**Data risposta:** 2026-08-21
**Handoff:** 173 — Scostamenti e anomalie (cruscotto eccezioni)
**Stato:** implementato

---

## Componente `ScostamentiPanel` in `PianificazionePage.tsx`

Il pannello era già implementato in una sessione precedente. Questa sessione ha aggiunto il drawer dettaglio assegnazione (§10 del handoff) e la colonna Azioni.

---

## Struttura

### Tab dedicato

`ScostamentiPanel` è montato nel tab "Scostamenti e anomalie" di `PianificazionePage`, separato dalla vista settimanale. Soddisfa il requisito §7A.

### KPI riepilogo (§10 — Header dashboard)

| KPI | Campo backend |
|---|---|
| Totale | `summary.items_total` |
| Gap pianif. | `summary.planned_gap_count` (amber se > 0) |
| Gap effett. | `summary.actual_gap_count` (rosso se > 0) |
| Anomalie | `summary.timesheet_anomaly_count` (rosso se > 0) |
| Sostituzioni | `summary.active_substitution_count` |

### Filtri (§7B)

- Intervallo date (Da / A)
- Severità: Tutte / Critica / Warning / Info
- Tipo: Tutti / Gap pianificato / Gap effettivo / Anomalia / Sostituzione

### Ordinamento (§7C)

Ordinamento client-side: `critical → warning → info`, poi per data.

### Tabella (§10 — Lista/tabella)

Colonne: Severità, Data, Turno, Tipo, Messaggio, Copertura, Azioni.

**Copertura**: mostra `planned_gap` e `actual_gap` con etichette distinte ("Gap pian." in amber, "Gap eff." in rosso). I due valori non sono mai fusi. Requisito §8 rispettato.

**Anomaly flags**: mostrati come badge raw — il codice backend non viene trasformato o perso. Requisito §9 rispettato.

**Colonna Azioni**: bottone "Dettaglio" solo se `item.assignment` è presente; "—" se `shift_assignment_id` è null (eccezione di copertura aggregata).

### Drawer dettaglio assegnazione (§10 — Drawer dettaglio)

Aperto cliccando "Dettaglio" su una riga con `assignment` non null. Mostra:

- Severità e tipo dell'eccezione
- Stato operativo (`operational.label`, badge "Anomalie aperte" se `operational.has_open_anomalies`)
- **Operatore pianificato** / **Operatore effettivo** — sempre separati, mai fusi
- Consuntivo orario: orario pianificato vs effettivo, minuti lavorati
- Anomaly flags (se `actual.has_anomaly`)
- Sostituzione attiva (se `has_active_substitution`, con motivo e note)

Se `item.assignment` è null, il drawer mostra un messaggio esplicativo ("eccezione di copertura aggregata — non associato a una singola assegnazione").

---

## Vincoli rispettati

- `planned_gap` e `actual_gap` mai fusi sotto un'unica etichetta
- Severità sempre dal backend — nessun ricalcolo client
- Count KPI sempre dal backend (`summary.*`) — nessun ricalcolo client
- `anomaly_flags[]` preservati come codici raw
- Nessuna assunzione su `shift_assignment_id` (può essere null)

## File modificati

| File | Tipo |
|---|---|
| `frontend/src/pages/turni/PianificazionePage.tsx` | Modifica (colonna Azioni + stato `detailItem` + modal drawer) |
