# Risposta UX — Handoff 155: Dashboard timesheet coordinatore

Data: 2026-08-09

---

## Stato: implementato

---

## File modificati / creati

| File | Tipo | Note |
|------|------|------|
| `frontend/src/pages/turni/TimesheetCoordDashboardPage.tsx` | NUOVO | Pagina dashboard coordinatore |
| `frontend/src/services/api.ts` | modifica | Aggiunto `timesheetApi.dashboardSummary()` |
| `frontend/src/App.tsx` | modifica | Route `/turni/dashboard` |
| `frontend/src/layout/sidebar/menuItems.ts` | modifica | Voce "Dashboard coordinatore" |

I tipi (`TimesheetCoordinatorDashboardResponse`, `TimesheetDashboardSummary`, ecc.) erano già presenti in `types/index.ts`.

---

## API aggiunta

```ts
timesheetApi.dashboardSummary(params?) →
  GET /admin/timesheets/dashboard-summary
  params: { facility_id?, staff_member_id?, date_from?, date_to? }
```

---

## Pagina `/turni/dashboard` — Dashboard coordinatore

### Filtri (in CardBody, sempre visibili)
- **Struttura** — select `Tutte le strutture` / struttura specifica
- **Dal / Al** — date picker, default = primo e ultimo giorno del mese corrente
- Pulsante **Aggiorna** — ricarica manuale; caricamento automatico al cambio filtro via `useCallback` + `useEffect`

### KPI cards (4 — riga superiore)
| Card | Campo | Colore |
|------|-------|--------|
| Anomalie aperte | `open_anomalies_count` | rosso |
| Straordinari totali | `overtime_minutes_total` (hh mm) | giallo |
| Assenze riconciliate | `absence_reconciliations_count` + `absence_reconciled_minutes_total` | viola |
| Rettifiche pending | `pending_adjustments_count` | arancio |

### Box operativi (4 — griglia 2×2)

**1. Anomalie aperte** — da `open_anomalies` (max 8)
Colonne: Data | Operatore | Δ varianza | Flag (badge `badge-light-warning`)

**2. Top straordinari** — da `top_overtime_entries` (max 8, già ordinati backend)
Colonne: Data | Operatore | Straordinario | Pianificato

**3. Assenze riconciliate** — da `absence_reconciliations` (max 8)
Colonne: Data | Operatore | Delta minuti | Revisione

**4. Rettifiche da approvare** — da `pending_adjustments` (max 8)
Colonne: Data | Operatore | Tipo | Delta

Ogni box ha un link **"Verifica →"** in header che porta a `/turni/verifica` per drill-down completo.

### Nota informativa (footer)
Spiega che i box mostrano max 8 righe e che il KPI `pending_adjustments_count` è il totale reale.

---

## Sidebar

Nuova voce "Dashboard coordinatore" → `/turni/dashboard` inserita prima di "Verifica timesheet" nella sezione Turni.

---

## Checklist QA

- [x] cambio struttura → ricarica automatica
- [x] cambio periodo → ricarica automatica
- [x] KPI anomalie = `open_anomalies_count` (non len(lista))
- [x] KPI rettifiche = `pending_adjustments_count` (totale reale)
- [x] top_overtime_entries ordinate decrescente (gestito backend)
- [x] 403 → alert informativo
- [x] lista vuota → messaggio placeholder per ogni box
