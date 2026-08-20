# UX handoff response — 188, 189

**Data risposta:** 2026-08-19
**Handoff:** 188 (HR runtime contract compatibility), 189 (Valutazioni periodiche professionisti)
**Stato:** entrambi implementati

---

## Handoff 188 — HR runtime contract compatibility

Nessuna modifica frontend richiesta. Il contratto runtime HR è retrocompatibile con quanto già implementato negli handoff 182–185. Le pagine `EducatoreDetailPage`, `AnagraficheProfessionaliPage`, `StrutturaDetailPage` e `DashboardHRPage` continuano a funzionare senza modifiche.

---

## Handoff 189 — Valutazioni periodiche professionisti

### Nuovi tipi (`frontend/src/types/index.ts`)

```typescript
StaffEvaluationCriterion      // id, code, name, description?, is_active, sort_order
StaffEvaluationCriterionWrite // code, name, description?, is_active?, sort_order?
StaffEvaluationScore          // criterion_id, score: 1|2|3|4|5, notes?, criterion?
StaffEvaluation               // id, facility_id, staff_member_id, period_start/end,
                              // evaluation_date, status: DRAFT|FINALIZED, overall_score?,
                              // summary?, evaluator?, finalized_by?, finalized_at?, scores[]
StaffEvaluationWrite          // period_start, period_end, evaluation_date, summary?, scores[]
```

### Nuove API (`frontend/src/services/api.ts`)

```typescript
staffEvaluationCriteriaApi: { list, create, update, delete }
// endpoint: /admin/staff-evaluation-criteria (dedicato, NON /admin/staff-profile-lookups)

staffEvaluationApi: { list, create, get, update, archive, finalize }
// endpoint: /admin/staff-members/{staffId}/evaluations[/{evalId}[/finalize]]
```

### Tab "Criteri valutazione" in `AnagraficheProfessionaliPage`

**Posizione:** 6° tab (dopo Tipi certificazione)
**File:** `frontend/src/pages/admin/AnagraficheProfessionaliPage.tsx`

- CRUD criteri via `staffEvaluationCriteriaApi` (endpoint dedicato, distinto dall'API lookup generica)
- Stesso pattern degli altri tab: codice immutabile dopo creazione, auto-uppercase
- Toggle attivo/inattivo via `update` con `is_active` invertito
- 409 su delete → modal proposta disattivazione con spiegazione ("il criterio è già usato in una o più valutazioni")
- I criteri disattivati restano visibili nelle valutazioni già compilate, non appaiono nei nuovi moduli

### Tab "Valutazioni periodiche" in `EducatoreDetailPage`

**Posizione:** 5° tab (dopo Profilo professionale)
**File:** `frontend/src/pages/educatori/EducatoreDetailPage.tsx`

#### Lista valutazioni

Tabella con: periodo, data valutazione, valutatore (first_name + last_name), punteggio medio (`overall_score`), stato (Bozza / Finalizzata).

Per valutazioni `DRAFT`: pulsanti Modifica, Finalizza, Archivia.
Per valutazioni `FINALIZED`: solo pulsante Visualizza (read-only).

#### Form crea/modifica (DRAFT)

Campi:
- `period_start`, `period_end`: date periodo
- `evaluation_date`: data valutazione
- `summary`: textarea "Commento riservato" — campo cifrato a riposo, **non incluso in toast, badge o log client-side**
- Sezione punteggi: una riga per ogni criterio attivo con select 1–5 (Insufficiente → Ottimo) + nota riservata
- Solo i criteri con punteggio selezionato (≥1) vengono inviati nel payload

#### Gestione stati e immutabilità

- `FINALIZED` → form non apribile; solo modal di sola lettura con tutti i campi
- Finalizzazione: richiede conferma esplicita con avviso di irreversibilità — "una valutazione finalizzata non può essere modificata o archiviata"
- La finalizzazione costituisce **firma applicativa** (non firma digitale qualificata)
- 409 su update/archive → "La valutazione è già finalizzata e non può essere modificata o archiviata"
- Nessun effetto automatico su turni o assegnazioni

#### Punteggi

- Select/radio 1..5 interi — nessun testo libero per il punteggio
- `StaffEvaluationScore.notes` è cifrato a riposo — non esposto in toast o log
- `overall_score` visualizzato come media calcolata dal backend (non ricalcolato lato client)

#### Permessi

Il pulsante Finalizza è visibile per tutte le valutazioni in DRAFT; il backend restituisce 403 se l'utente non ha `staff_evaluations.manage`. Nessun gating lato frontend (coerente con gli altri moduli).

#### Box informativo

> Le valutazioni periodiche sono documentali e riservate. I punteggi e i commenti non influenzano automaticamente turni o assegnazioni. La finalizzazione è irreversibile e costituisce firma applicativa (non firma digitale qualificata ai sensi del D.Lgs. 82/2005).

---

## File modificati

| File | Tipo |
|---|---|
| `frontend/src/types/index.ts` | Modifica (5 nuovi tipi valutazioni) |
| `frontend/src/services/api.ts` | Modifica (`staffEvaluationCriteriaApi`, `staffEvaluationApi`) |
| `frontend/src/pages/admin/AnagraficheProfessionaliPage.tsx` | Modifica (6° tab "Criteri valutazione" + `CriteriCrudTab`) |
| `frontend/src/pages/educatori/EducatoreDetailPage.tsx` | Modifica (5° tab "Valutazioni periodiche" + `ValutazioniTab`) |

## Vincoli di sicurezza rispettati

- `summary` e `score.notes` non compaiono mai in toast, badge, notifiche o console log
- Finalizzazione protetta da modal di conferma esplicita con avviso di irreversibilità
- 409 produce messaggio specifico (non generico), senza esporre dettagli interni
- Punteggi: select 1..5 interi — nessun campo libero
- `overall_score` letto dal backend, non ricalcolato client-side
