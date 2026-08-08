# Risposta UX handoff — Task 092-093-095
# Uscite v2 + Avvicinamenti trend

Data: 2026-07-03
File: `UscitePage.tsx`, `AvvicinamentiPage.tsx`, `types/index.ts`, `services/api.ts`

---

## Task 092 — Uscite v2

### Stato: ✅ Implementato

**Nuovi tipi in `types/index.ts`:**
```typescript
export type ReturnCondition = 'regular' | 'delayed' | 'critical'
export interface ExitSummary { total, planned, out, returned, cancelled, overdue_open, follow_up_required, delayed_returns, critical_returns }
```

**`MinorExit` esteso con:**
- `is_overdue`, `delay_minutes`, `return_condition`, `follow_up_required`, `follow_up_notes`

**`MinorExitTransition` esteso con:**
- `return_condition`, `follow_up_required`, `follow_up_notes`

**`minorExitApi` aggiornato:**
- `summary(params?)` → `GET /api/exits/summary`
- `list()` ora accetta `follow_up_required` e `return_condition` come filtri

**KPI summary:** card row sopra la lista con 7 indicatori (totale, pianificate, fuori struttura, rientrate, in ritardo, follow-up, rientri critici). I dati vengono da `GET /api/exits/summary`, mai calcolati client-side.

**Badge `is_overdue`:** mostrato inline sotto il badge stato nella tabella, con minutaggio delay se disponibile.

**Nuove colonne tabella:** `Esito rientro` (regular/delayed/critical) e `Follow-up` (sì/no).

**Nuovi filtri server-side:** `return_condition`, `follow_up_required`.

**Modale "Segna rientro" strutturata:**
- `actual_return_at` (datetime, obbligatorio)
- `return_condition` (select: regolare/in ritardo/critico)
- `outcome_notes` (textarea)
- `follow_up_required` (checkbox)
- `follow_up_notes` (textarea, visibile solo se follow_up attivo)
- Gestione errori 422 da backend (follow_up_notes obbligatorio se follow_up=true)
- Help inline nella modale (box info)

**InfoDrawer aggiornato** con: flusso stati, significato KPI (in ritardo / follow-up / rientri critici), nota "KPI dal backend", sezione segna rientro.

---

## Task 093 — Uscite v2: box informativi

### Stato: ✅ Implementato (insieme a 092)

- Box info nella modale mark-returned
- Microcopy KPI con titoli esplicativi (tooltip `title` su card KPI in ritardo, follow-up, rientri critici)
- InfoDrawer con tutte le sezioni previste da task 093

---

## Task 095 — Avvicinamenti: trend backend collegato

### Stato: ✅ Implementato

**`approachApi.trend()` aggiunto** → `GET /api/approaches/trend`

**`ApproachTrend` aggiunto in `types/index.ts`:**
```typescript
export interface ApproachTrend {
  summary: ApproachTrendSummary
  monthly_series: { month: string; total: number; avg_post_reaction_score: number | null }[]
  reaction_distribution: { phase: 'pre' | 'during' | 'post'; level: string; total: number }[]
}
```

**UI:** Blocco KPI trend sopra la tabella in `AvvicinamentiPage`, con:
- 7 card KPI (totale, pianificati, in corso, completati, sospesi, auth. in scadenza, auth. scaduta)
- Badge colorati per autorizzazioni critiche (rosso/giallo se > 0)
- Sezione distribuzione reazioni (fase × livello × conteggio)

Il trend viene caricato in background dopo la lista — non blocca il rendering.
Il filtro `facility_id` e `minor_id` viene passato anche alla chiamata trend.

---

## Checklist QA 094 — Uscite

La checklist 094 è destinata al team QA per validazione manuale in ambiente con utenti reali. Non richiede modifiche frontend aggiuntive.

---

## Checklist QA 095 — Avvicinamenti sicurezza

I controlli di sicurezza su `reserved_psychologist_notes` e `reserved_coordinator_notes` sono già implementati: i campi vengono mostrati solo quando `has_reserved_notes = true`. La visibilità delle note testuali dipende dalla risposta API (il backend non le restituisce se l'utente non è autorizzato). Nessuna logica client-side aggiuntiva necessaria.
