# Risposta UX — Handoff 111-116: PEI storico, trend dashboard, collegamento Attività/Diario

Data risposta: 2026-07-05  
Handoff di riferimento: 111, 112, 113, 114, 115, 116  
Stato: ✅ Implementato

---

## Handoff 111 — Storico PEI e timeline avanzamento obiettivi

### Nuovi tipi in `types/index.ts`

```ts
export interface MinorPeiHistoryEntry {
  id: number
  event_type: string
  version_number?: number | null
  snapshot?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  actor?: { id: number; display_name?: string | null; email?: string | null } | null
  created_at: string
}

export interface MinorPeiObjectiveProgressEntry {
  id: number
  progress_percent: number
  status?: string | null
  notes?: string | null
  source_type?: string | null
  source_id?: string | null
  source_label?: string | null
  actor?: { id: number; display_name?: string | null; email?: string | null } | null
  created_at: string
}
```

### Nuovi metodi in `services/api.ts` → `minorApi`

```ts
getPeiHistory: (id: number, peiId: number) =>
  http.get<MinorPeiHistoryEntry[]>(`/minors/${id}/peis/${peiId}/history`).then((r) => r.data),
getObjectiveProgress: (id: number, peiId: number, objId: number) =>
  http.get<MinorPeiObjectiveProgressEntry[]>(`/minors/${id}/peis/${peiId}/objectives/${objId}/progress`).then((r) => r.data),
```

### Modifiche a `ProfiloEstesoMinoreTab.tsx`

- Aggiunto pulsante **Storico PEI** nel dettaglio di ogni PEI aperto
- Aggiunto pulsante **Storico avanzamento** (icona info) per ogni obiettivo nella tabella
- Modal **Storico PEI**: tabella con data/ora, versione, evento tradotto, utente
- Modal **Storico avanzamento obiettivo**: tabella con data/ora, avanzamento %, stato, sorgente (Attività / Diario educativo / Manuale), utente, note
- Label eventi PEI tradotte in italiano:
  - `minor_pei_created` → `PEI creato`
  - `minor_pei_updated` → `PEI aggiornato`
  - `minor_pei_objective_created` → `Obiettivo PEI aggiunto`
  - `minor_pei_objective_updated` → `Obiettivo PEI aggiornato`
  - `minor_pei_objective_deleted` → `Obiettivo PEI eliminato`

---

## Handoff 112 — Collegamento PEI → Attività / Diario educativo

### `AttivitaMinoreTab.tsx`

- Carica gli obiettivi PEI del minore al mount (via `minorApi.get(minorId).peis.objectives`)
- Selettore opzionale **Collega a obiettivo PEI** nel form crea/modifica attività
  - Visibile solo se il minore ha PEI con obiettivi
  - Helper text: "Usa questo campo quando l'attività documenta un progresso o una criticità rispetto al PEI."
- Badge **PEI** nella colonna lista quando `pei_objective_id` è valorizzato
- `openEdit` popola `pei_objective_id` dal record esistente

### `DiarioMinoreTab.tsx`

- Identico pattern del tab Attività
- Helper text: "Collega la voce a un obiettivo PEI se l'osservazione misura l'andamento educativo."
- Badge **PEI** nella colonna lista
- `openEdit` popola `pei_objective_id`

---

## Handoff 113 — Dashboard minore: trend PEI (contratto)

Contratto `pei_trends` dal backend già definito in `types/index.ts`:
- `MinorPeiTrendDashboard` con `summary`, `objective_trends`, `recent_events`
- Già incluso nel tipo `Minor.pei_trends`

Nessuna modifica necessaria: il contratto era già allineato.

---

## Handoff 114 — Card Trend PEI in tab Anagrafica

### `MinoreDetailPage.tsx` — `PeiTrendDashboardCard`

- Card posizionata **prima** dei dati anagrafici nel `TabPane` `anagrafica`
- KPI: PEI attivi, Obiettivi totali/completati, Avanzamento medio, Eventi Attività, Eventi Diario
- Lista obiettivi con sparkline SVG inline, badge stato, percentuale attuale, data ultimo aggiornamento, contatore eventi
- Sezione eventi recenti PEI con badge sorgente (Attività / Diario educativo / Aggiornamento manuale)
- Stato vuoto: alert neutro se `pei_trends` assente o `total_objectives === 0`

---

## Handoff 115 — Stabilizzazione scheda minore + QA

Elementi verificati e confermati funzionanti:
- ✅ `?? '—'` su tutti i campi nullable in tab Anagrafica, Documenti, Accesso al minore
- ✅ Card `Trend PEI` in `Anagrafica` (sopra i dati)
- ✅ Card `Dashboard minore` globale (sopra le tab)
- ✅ Nessun `null` / `undefined` esposto come testo nei campi

---

## Handoff 116 — Dashboard globale minore

### `MinoreDetailPage.tsx` — `MinorGlobalSummaryCard`

- Posizionata **sopra la card principale** (fuori dal blocco tab), sempre visibile
- Badge di contesto: Struttura, Stato, Documenti, Contatti
- 6 KPI PEI sintetici da `pei_trends.summary` con fallback `0`
- Non introduce richieste API aggiuntive: legge `minor` già caricato

---

## File modificati

| File | Modifica |
|------|----------|
| `types/index.ts` | Aggiunti `MinorPeiHistoryEntry`, `MinorPeiObjectiveProgressEntry` |
| `services/api.ts` | Aggiunti `minorApi.getPeiHistory`, `minorApi.getObjectiveProgress` |
| `pages/minori/tabs/ProfiloEstesoMinoreTab.tsx` | Storico PEI + storico avanzamento obiettivi |
| `pages/minori/tabs/AttivitaMinoreTab.tsx` | Selettore PEI + badge PEI in lista |
| `pages/minori/tabs/DiarioMinoreTab.tsx` | Selettore PEI + badge PEI in lista |
| `pages/minori/MinoreDetailPage.tsx` | Card Trend PEI (anagrafica) + Dashboard globale (pre-tab) |
