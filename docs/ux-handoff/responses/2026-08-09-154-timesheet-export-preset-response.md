# Risposta UX — Handoff 154: Export timesheet con preset avanzati

Data: 2026-08-09

---

## Stato: implementato

### File modificato

`frontend/src/pages/turni/ExportPresenzePage.tsx`

---

## Modifiche

### Nuovo stato `preset`

```tsx
const [preset, setPreset] = useState<'payroll' | 'review' | 'labor_consultant'>('payroll')
```

Default: `payroll` — compatibile con il comportamento precedente (nessuna regressione).

### Parametro passato all'API

```tsx
timesheetApi.exportMonthly({ facility_id: facilityId, year, month, format, preset })
```

`api.ts` supportava già `preset?` nel tipo — nessuna modifica necessaria al client.

### Naming file

```
timesheet_{preset}_{facilityName}_{year}_{mm}.csv
```

Esempi:
- `timesheet_payroll_Casa_Betania_2026_08.csv`
- `timesheet_review_Casa_Betania_2026_08.csv`
- `timesheet_labor_consultant_Casa_Betania_2026_08.csv`

### UI — Selettore preset (radio)

Sostituisce il vecchio radio "CSV paghe — disponibile nel backend attuale":

- `CSV paghe` — export sintetico per conteggi mensili e straordinari
- `CSV revisione` — include workflow approvazioni, anomalie e dettaglio rettifiche
- `CSV consulente lavoro` — include anche qualifica operatore e dettaglio amministrativo

### Storico sessione

Il label ora include il preset selezionato al momento del download:
`Agosto 2026 — CSV Revisione`

### Gestione errori

- `404` → toast: "Nessuna entry approvata per il periodo selezionato."
- `422` → toast con messaggio originale backend
- Rimossa nota "PDF presenze verrà riattivato..." e ogni riferimento a "solo CSV paghe disponibile"

### InfoDrawer aggiornato

Descrive i tre preset con spiegazione breve di ciascuno.

---

## Checklist QA

- [x] export default senza preset esplicito → `payroll` (default state)
- [x] selezione `review` → parametro `preset=review` in query string
- [x] selezione `labor_consultant` → parametro `preset=labor_consultant` in query string
- [x] filename include preset e nome struttura
- [x] toast errore `404` presente
- [x] toast errore `422` presente (messaggio backend)
- [x] nessun riferimento residuo a "solo CSV paghe disponibile"

---

## TypeScript

Nessun nuovo tipo aggiunto — `exportMonthly` in `api.ts` aveva già `preset?` nella firma.
