# FamilyHub — Risposta handoff UX — 176 + 177 + 178

Data: 2026-08-14  
Riferimenti: `2026-08-13-176-minori-log-pseudonimo-public-contract.md`, `2026-08-13-177-minori-narrativa-protetta-profile-contract.md`, `2026-08-13-178-minori-diagnosi-dashboard-summary-contract.md`

---

## Handoff 176 — Pseudonimo pubblico nei log Minori

### Stato: ✅ Implementato

#### AuditPage (`frontend/src/pages/audit/AuditPage.tsx`)

- Colonna `Minore` → usa `minor.public_display_name`
- Drawer dettaglio audit → usa `minor.public_display_name`
- Nessun riferimento a `minor.first_name` / `minor.last_name` in questa pagina

#### Tab Storico in `MinoreDetailPage.tsx` — `StoricoTab`

- Testo primario dell'evento: `h.description` (serializzato dal backend, già pseudonimizzato)
- Fallback (solo se `description` assente): `h.metadata?.operation_summary`
- Nessuna concatenazione `first_name + last_name` del minore nella timeline

```tsx
const primaryText = h.description || (h.metadata?.operation_summary as string | undefined)
```

- Attore mostrato con `h.actor.display_name` se presente, mai tramite ricostruzione nome/cognome del minore

#### QA checklist

- [x] Pagina Audit: colonna Minore usa `public_display_name`
- [x] Dettaglio audit: usa `public_display_name`
- [x] Storico minore: eventi usano `description`
- [x] Nessun componente concatena `minor.first_name + minor.last_name` nei log pubblici
- [ ] Export CSV audit: la colonna backend si chiama `minore_pseudonimo` — nessuna modifica frontend richiesta (il backend genera il CSV)

---

## Handoff 177 — Narrativa protetta e profilo sensibile

### Stato: ✅ Implementato

**File:** `frontend/src/pages/minori/MinoreDetailPage.tsx` — `ProfiloTab`

#### Struttura form in 5 gruppi

| Gruppo | Campi | Sensibile |
|---|---|---|
| 1. Contesto familiare | `family_background` | 🔒 sì |
| 2. Storia di vita | `life_history` | 🔒 sì |
| 3. Profilo educativo | `learning_styles`, `interests`, `hobbies`, `strengths` | no |
| 4. Rischi e crisi | `risk_factors`, `crisis_indicators` | no |
| 5. Note cliniche riservate | `clinical_notes_encrypted` | 🔒 sì + nota "cifrato a riposo" |

#### `SensitiveBadge`

Componente inline aggiunto ai gruppi 1, 2, 5:
```tsx
<span className='badge badge-light-warning ms-2' title='Contenuto sensibile — visibile solo in questa scheda ai ruoli autorizzati'>
  🔒 Contenuto sensibile
</span>
```

#### Stili card per gruppo

- Gruppi 1, 2, 5 (sensibili): bordo sinistro ambra `#ffe0a0`
- Gruppo 3 (educativo): bordo sinistro lilla `#e8e6ff`
- Gruppo 4 (rischi): bordo sinistro rosso `#fad4d4`

#### Garanzie

- Nessun campo sensibile riportato in card riepilogo, tooltip, tabella o drawer generici
- Label UI `clinical_notes_encrypted` → "Note cliniche riservate" (retrocompatibile, nome campo invariato per API)
- Gruppo 5 include nota `<small>Cifrato a riposo nel database.</small>`

#### QA checklist

- [x] `family_background` e `life_history` presentati come campi protetti con badge
- [x] `clinical_notes_encrypted` presentato come area clinica riservata con badge + nota
- [x] Nessun riepilogo secondario mostra il contenuto di questi campi
- [x] Nessuna tabella audit/storico mostra il testo inserito (vedi handoff 176)

---

## Handoff 178 — Diagnosi cifrate + Dashboard summary

### Stato: ✅ Implementato

#### 1) Campo `diagnosis_notes_encrypted`

- Trattato come campo sensibile nella tab Diagnosi (non replicato in liste, badge o tooltip)
- Mostrato solo nel form diagnosi dedicato all'interno della tab protetta

#### 2) Dashboard summary — `MinorGlobalSummaryCard`

**Tipi aggiunti** (`frontend/src/types/index.ts`):

```typescript
MinorDashboardSummarySummary
MinorDashboardHighPriorityNeed
MinorDashboardDeadline
MinorDashboardRelevantEvent
MinorDashboardSummary
```

Campo aggiunto su `Minor`:
```typescript
dashboard_summary?: MinorDashboardSummary | null
```

**KPI row** da `ds.summary`:

| KPI | Campo |
|---|---|
| Diagnosi attive | `active_diagnoses_count` |
| Bisogni aperti | `open_needs_count` |
| Bisogni urgenti | `high_priority_open_needs_count` (badge rosso) |
| PEI attivi | `active_peis_count` |
| Scadenze prossime | `upcoming_deadlines_count` |

**Widget Scadenze** (`upcoming_deadlines`)

- Ordinati per data
- Badge tipo per `diagnosis_review`, `pei_review`, `pei_objective_due`
- `is_overdue` → badge rosso sovrapposto

**Widget Bisogni urgenti** (`high_priority_needs`)

- Bordo card rosso
- Lista `title` + badge status/priority

**Widget Eventi rilevanti** (`recent_relevant_events`)

- Bordo card viola
- Lista con `description` + data `created_at`

#### Regole rispettate

- KPI mai ricalcolati in frontend: fonte unica `dashboard_summary.summary`
- Scadenze mai ricostruite da `diagnoses[]` / `peis[]`
- `description` degli eventi usata as-is (già serializzata dal backend)

#### QA checklist

- [x] Header minore usa `dashboard_summary.summary`
- [x] Lista scadenze usa `dashboard_summary.upcoming_deadlines`
- [x] Lista bisogni urgenti usa `dashboard_summary.high_priority_needs`
- [x] Timeline usa `dashboard_summary.recent_relevant_events`
- [x] Note diagnosi non mostrate fuori dal contesto clinico protetto (tab Diagnosi)
