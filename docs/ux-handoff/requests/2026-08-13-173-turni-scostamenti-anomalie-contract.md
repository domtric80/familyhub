# UX Handoff 173 - Turni: scostamenti, anomalie e cruscotto eccezioni

Data: 2026-08-13
Ambito: `Turni > Pianificazione`, dashboard coordinatore, vista controllo coperture
Priorita: Alta

## Stato backend

Backend pronto.

Questo handoff descrive lo step 4 della roadmap `Turni / Timesheet` e va letto insieme a:

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-170-turni-calendario-mensile-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-171-turni-sostituzioni-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-172-turni-chiusura-firma-contract.md`

---

## 1. Obiettivo prodotto

Il coordinatore deve avere un pannello operativo che evidenzia:

- coperture pianificate insufficienti;
- coperture effettive insufficienti;
- anomalie di consuntivazione;
- sostituzioni attive.

Questo endpoint non sostituisce il planner calendario: lo affianca come vista di controllo.

---

## 2. Endpoint nuovo

`GET /api/admin/staff-shifts/exceptions`

### Query params

- `facility_id` required
- `date_from` optional
- `date_to` optional
- `types[]` optional

### `types[]` supportati

- `planned_gap`
- `actual_gap`
- `timesheet_anomaly`
- `active_substitution`

Se `types[]` non e passato, il backend restituisce tutto.

---

## 3. Response root

```json
{
  "facility_id": 3,
  "date_from": "2026-08-01",
  "date_to": "2026-08-31",
  "summary": {
    "items_total": 12,
    "planned_gap_count": 3,
    "actual_gap_count": 4,
    "timesheet_anomaly_count": 3,
    "active_substitution_count": 2
  },
  "items": [ "..."]
}
```

---

## 4. Tipologie restitute

### A. `planned_gap`

Manca copertura in pianificazione.

Esempio:

```json
{
  "type": "planned_gap",
  "severity": "warning",
  "shift_date": "2026-08-21",
  "message": "Copertura pianificata insufficiente per il turno Notte: assegnati 1 su 2 richiesti.",
  "facility": { "id": 3, "name": "Arcobaleno" },
  "shift_template": { "id": 7, "code": "NIGHT", "name": "Notte" },
  "shift_assignment_id": null,
  "coverage": {
    "minimum_staff_required": 2,
    "assigned_count": 1,
    "actual_completed_count": 0,
    "planned_gap": 1,
    "actual_gap": 2
  },
  "anomaly_flags": [],
  "active_substitution": false
}
```

### B. `actual_gap`

La copertura reale completata e inferiore al minimo richiesto.

### C. `timesheet_anomaly`

Esiste un turno con anomalie nel consuntivo.

In questo caso puo esserci anche:

- `shift_assignment_id`
- `assignment`
- `anomaly_flags[]`

### D. `active_substitution`

Esiste una sostituzione attiva sul turno.

In questo caso puo esserci anche:

- `shift_assignment_id`
- `assignment`
- `active_substitution = true`

---

## 5. Semantica severita

### `severity`

Valori possibili:

- `info`
- `warning`
- `critical`

### Uso consigliato

- `info` -> sostituzione attiva
- `warning` -> gap pianificato
- `critical` -> gap effettivo o anomalia timesheet

Questa mappatura e gia prodotta dal backend: UX non deve ricalcolarla.

---

## 6. Campo `assignment`

Per i tipi:

- `timesheet_anomaly`
- `active_substitution`

il backend puo restituire l'assegnazione completa serializzata dentro `assignment`.

Questo consente a UX di aprire:

- drawer dettaglio turno;
- collegamento diretto al planner;
- CTA rapide su dettaglio anomalia.

Il contratto di `assignment` e lo stesso gia documentato, incluso:

- `actual`
- `operational`
- `staff_member`
- `effective_staff_member`
- `active_substitution`

---

## 7. Regole UX obbligatorie

### A. Costruire una vista "eccezioni" separata

Non mischiare questa lista dentro il calendario base in modo opaco.

Serve almeno una di queste due soluzioni:

- tab dedicato `Scostamenti e anomalie`
- card dashboard con tabella filtrabile

### B. Filtri minimi da prevedere

- struttura
- intervallo date
- tipo eccezione
- severita

### C. Raggruppamenti consigliati

Ordine suggerito:

1. `critical`
2. `warning`
3. `info`

e dentro ciascun gruppo:

- per data
- poi per turno

### D. CTA consigliate

Per ogni riga:

- `Apri turno`
- `Apri sostituzione` se presente
- `Vedi dettaglio anomalia`

Se `shift_assignment_id` e `null`, UX deve mostrare il problema come eccezione di copertura aggregata, non come singolo turno cliccabile.

---

## 8. Distinzione importante: gap pianificato vs gap effettivo

UX deve mantenere molto chiara questa differenza:

- `planned_gap`: non ho assegnato abbastanza persone
- `actual_gap`: anche se pianificate, non ho abbastanza presenze concluse reali

Non unificare questi due casi sotto una sola etichetta generica tipo `copertura mancante`.

Testi suggeriti:

- `Copertura pianificata insufficiente`
- `Copertura effettiva insufficiente`

---

## 9. Nota su anomalie timesheet

`anomaly_flags[]` contiene i codici raw backend.

Esempi possibili:

- `late_clock_in`
- `missing_clock_out`
- altri flag consuntivo

UX puo mostrare:

- badge raw per subito;
- oppure mappa label utente-friendly in un layer di presentazione.

Ma non deve perdere il codice raw, utile per supporto e QA.

---

## 10. UX minima richiesta

### Header dashboard

Mostrare almeno i KPI:

- totale elementi
- gap pianificati
- gap effettivi
- anomalie timesheet
- sostituzioni attive

### Lista/tabella

Colonne minime:

- severita
- data
- turno
- tipo
- messaggio
- struttura
- azioni

### Drawer dettaglio

Se `assignment` e presente, mostrare:

- stato operativo
- operatore pianificato
- operatore effettivo
- consuntivo orario
- anomalie
- sostituzione attiva

---

## 11. Cosa non deve fare UX

- non deve calcolare gap e anomaly count lato client;
- non deve dedurre sostituzioni da confronti fra operatori;
- non deve fondere `planned_gap` e `actual_gap`;
- non deve assumere che ogni item abbia un `shift_assignment_id`.

---

## 12. Nota QA

Il QA deve verificare almeno:

1. un giorno con gap pianificato -> compare `planned_gap`
2. un giorno con turno non completato -> compare `actual_gap`
3. un turno con anomalie di timbratura -> compare `timesheet_anomaly`
4. un turno con sostituzione attiva -> compare `active_substitution`
5. filtro `types[]=timesheet_anomaly` -> restituisce solo quel tipo
