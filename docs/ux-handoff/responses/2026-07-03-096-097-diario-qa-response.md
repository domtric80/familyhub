# Risposta UX handoff — Task 096-097
# Diario educativo: QA checklist e perimetro funzionale

Data: 2026-07-03
File: `DiarioPage.tsx`, `types/index.ts`, `services/api.ts`

---

## Task 096 — Mini checklist QA Diario educativo

### Stato: ✅ Implementato

**Endpoint list:** `GET /api/journals` — già collegato con filtri server-side.

**Endpoint summary:** `GET /api/journals/summary` — **aggiunto in questa sessione**.
- Nuovo tipo `JournalSummary` in `types/index.ts`
- Nuovo metodo `journalApi.summary(params?)` in `services/api.ts`
- Blocco KPI renderizzato sopra la tabella in `DiarioPage.tsx`
- Caricamento in background (non blocca la lista)
- Filtra per `facility_id` e `minor_id` quando attivi

**KPI visualizzati:**
- Totale voci
- Priorità ordinaria (green)
- Priorità attenzione (yellow)
- Priorità urgente (red)
- Follow-up aperti
- Handover richiesti
- Handover in attesa (badge rosso se > 0)

**Filtri server-side attivi:** `minor_id`, `priority_level`, `mood_level`, `handover_required`

**Form a 5 blocchi:** dati base, priorità e contesto, registro turno, follow-up, passaggio consegne — tutti presenti.

**Gestione 422:**
- `follow_up_required = true` + `follow_up_notes` vuoto → errore 422 mostrato inline
- `handover_required = true` + `handover_notes` vuoto → errore 422 mostrato inline
- `handover_read_at` presente senza `handover_read_by_user_id` → gestito da backend 422

**InfoDrawer:** presente con sezioni su priorità, umore, follow-up e handover.

**Funzionalità roadmap NON presenti in UI:**
- Firma digitale chiusura turno → non implementata, menzionata solo nell'InfoDrawer come "evoluzione futura"
- Ricerca full-text avanzata → non presente
- Messaggistica interna cifrata → non presente

---

## Task 097 — Nota QA e perimetro funzionale

### Stato: ✅ Recepito

Il frontend rispetta il perimetro backend attuale:
- nessuna logica KPI client-side (tutti i dati vengono da `GET /api/journals/summary`)
- nessun workflow di firma o messaggistica simulato
- InfoDrawer chiarisce esplicitamente cosa è disponibile e cosa è roadmap

---

## Tab Avvicinamenti + Diario in MinoreDetailPage

**Aggiunto nella stessa sessione:**
- `AvvicinamentiMinoreTab` — tabella read-only, `approachApi.list({ minor_id })`
  - colonne: data/ora, tipo, luogo, stato, reazione pre, reazione post, autorizzazione
- `DiarioMinoreTab` — tabella read-only, `journalApi.list({ minor_id })`
  - colonne: data/ora, tipologia, titolo, priorità, umore, follow-up, handover
- Entrambi i tab gestiscono 403/404 con messaggi in italiano
- Voci aggiunte nell'array `tabs[]` con icone `Info` e `FileText`
- `TabPane` aggiunti nel `TabContent`
