# Risposta UX handoff — Task 085-089
# Avvicinamenti v2 + Diario educativo v2

Data: 2026-07-02  
File di riferimento: `AvvicinamentiPage.tsx`, `DiarioPage.tsx`, `types/index.ts`, `services/api.ts`

---

## Task 085 — Avvicinamenti: workflow autorizzativo

### Stato: ✅ Implementato (con eccezione su trend)

**Implementato:**
- Nuovo tipo `AuthorizationStatus = 'active' | 'expiring' | 'expired'`
- Badge colorati in tabella: `AUTH_BADGE` (success/warning/danger)
- Filtro server-side `authorization_status` (active | expiring | expired)
- Colonne tabella aggiornate: `autorizzazione`, `scadenza`, `reazione finale`, `note riservate`
- Form blocco 2 "Provvedimento autorizzativo": `authorization_status`, `authorization_document_ref`, `authorization_expiry_date`, `authorization_notes`

**Non implementato (divergenza intenzionale):**
- `GET /api/approaches/trend` — endpoint non collegato. Il task indica "non fare trend lato client", ma non è stata creata UI dedicata per consumare l'endpoint. Da valutare se aggiungere un KPI card separato o una sezione dashboard.

---

## Task 086 — Avvicinamenti: InfoDrawer aggiornato

### Stato: ✅ Implementato

- InfoDrawer aggiornato con sezioni: "A cosa serve", "Quale dati vengono gestiti", "Workflow autorizzativo", "Livelli di reazione", "Note riservate", "Sospensione", "Permessi"
- Alert inline per ogni blocco funzionale del form
- Box priorità su ogni blocco critico (autorizzazione, reazione, note riservate, sospensione)

---

## Task 087 — Diario educativo: form v2

### Stato: ✅ Implementato

**Nuovi campi form (5 blocchi):**

| Blocco | Campi |
|--------|-------|
| 1. Dati base | minor_id, journal_entry_type_id, observed_at, title, content |
| 2. Priorità e contesto | priority_level (green/yellow/red), mood_level |
| 3. Registro turno | nutrition_summary, hygiene_summary, sleep_summary |
| 4. Follow-up | follow_up_required, follow_up_notes |
| 5. Passaggio consegne | handover_required, handover_notes, handover_read_at |

**Nuove colonne tabella:** priorità, umore, follow-up, handover (con stato letto/in attesa)

**Nuovi filtri:** priority_level, mood_level, handover_required (server-side); da/a date + limite (client-side)

**Non implementato (rinviato):**
- `GET /api/journals/summary` — KPI card con verde/giallo/rosso counts, follow-up aperti, handover pendenti, andamento giornaliero. Richiede UI dedicata da aggiungere in testa alla pagina. Proposta: implementare in task successivo come card "Riepilogo diario".

---

## Task 088 — Diario educativo: InfoDrawer aggiornato

### Stato: ✅ Implementato

- InfoDrawer aggiornato con sezioni: "A cosa serve", "Quali dati vengono gestiti", "Come usare la priorità", "Follow-up e handover", "Stato funzionale", "Permessi"
- Alert inline per ogni blocco del form
- Nota "Modulo v2 funzionale" con indicazione delle funzioni rinviate

---

## Task 089 — Risposta handoff

### Stato: ✅ Questo documento

---

## Tipi aggiunti in `types/index.ts`

```typescript
export type ApproachStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'suspended'
export type ReactionLevel = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive'
export type AuthorizationStatus = 'active' | 'expiring' | 'expired'
export type PriorityLevel = 'green' | 'yellow' | 'red'
export type MoodLevel = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive'
```

Interfacce `Approach`, `ApproachWrite`, `JournalEntry`, `JournalEntryWrite` estese con tutti i campi v2.

---

## Metodi aggiunti in `services/api.ts`

- `lookupsApi.approachTypes()` — `GET /api/lookups/approach-types`
- `lookupsApi.journalEntryTypes()` — `GET /api/lookups/journal-entry-types`

---

## Divergenze e rinvii

| Item | Motivo |
|------|--------|
| `GET /api/approaches/trend` | Nessuna UI ancora. Serve accordo su dove mostrare il dato (card dashboard? sezione interna?) |
| `GET /api/journals/summary` | Rinviato al task successivo. KPI card da aggiungere in testa a DiarioPage |
| Firma di chiusura turno | Non prevista nell'attuale spec v2. Da aggiungere se necessario |

---

## Note tecniche

- `minorApi.contacts` → corretto in `minorApi.listContacts` (bug naming session precedente)
- RBAC 403: tutti i messaggi sono stati tradotti in italiano con testo user-friendly (nessun permesso tecnico esposto all'utente)
- Pattern `displayItems` con `useMemo` applicato a tutte e tre le pagine (Avvicinamenti, Diario, Attività)
