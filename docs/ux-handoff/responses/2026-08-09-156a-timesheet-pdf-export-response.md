# Risposta UX — Handoff 156a: Export presenze PDF

Data: 2026-08-09

---

## Stato: implementato

---

## File modificati

| File | Modifica |
|------|----------|
| `frontend/src/services/api.ts` | Aggiunto `timesheetApi.exportMonthlyPdf()` |
| `frontend/src/pages/turni/ExportPresenzePage.tsx` | Selettore Formato CSV/PDF + logica download |

---

## API aggiunta

```ts
timesheetApi.exportMonthlyPdf(params) →
  GET /admin/timesheets/export.pdf
  params: { facility_id, year, month, preset? }
  responseType: 'blob'
```

---

## Modifiche UI — `ExportPresenzePage`

### Nuovo selettore "Formato"

Inserito sopra il selettore Preset, con due radio:
- `CSV` — foglio di calcolo
- `PDF` — report stampabile

Default: `CSV` (nessuna regressione).

### Logica download

```ts
format === 'pdf'
  ? timesheetApi.exportMonthlyPdf({ facility_id, year, month, preset })
  : timesheetApi.exportMonthly({ facility_id, year, month, format: 'csv', preset })
```

### Naming file

`timesheet_{preset}_{facilityName}_{year}_{mm}.{format}`

Esempi:
- `timesheet_payroll_Casa_Betania_2026_08.csv`
- `timesheet_review_Casa_Betania_2026_08.pdf`
- `timesheet_labor_consultant_Casa_Betania_2026_08.pdf`

### Storico sessione

Label aggiornata per includere il formato:
`Agosto 2026 — PDF Revisione`

### InfoDrawer

Aggiornato: descrive entrambi i formati e chiarisce che preset e dataset sono identici per CSV e PDF.

---

## Checklist QA

- [x] `CSV` → chiama `export.csv`, scarica `.csv`
- [x] `PDF` → chiama `export.pdf`, scarica `.pdf`
- [x] preset `review` e `labor_consultant` funzionano in entrambi i formati
- [x] toast `404` presente
- [x] toast errore `422` presente
- [x] nessun riferimento residuo a "PDF non disponibile"
- [x] naming file coerente con `Content-Disposition` backend
