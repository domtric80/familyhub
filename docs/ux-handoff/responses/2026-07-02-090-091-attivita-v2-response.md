# Risposta UX handoff — Task 090-091
# Attività v2

Data: 2026-07-02  
File di riferimento: `AttivitaPage.tsx`, `types/index.ts`, `services/api.ts`

---

## Task 090 — Attività v2: form e tabella

### Stato: ✅ Implementato

**Nuovi tipi aggiunti in `types/index.ts`:**
```typescript
export type AttendanceStatus = 'present' | 'partial' | 'absent'
export type SupportLevel = 'autonomous' | 'light' | 'medium' | 'high'
```

**Interfacce `Activity` e `ActivityWrite` estese con:**
- `responsible_staff_member_id`
- `attendance_status`
- `support_level`
- `requires_transport`
- `materials_needed`
- `follow_up_required`
- `follow_up_notes`
- `responsible_staff_member?: { id: number; display_name: string }`

**Form a 5 blocchi:**

| Blocco | Campi |
|--------|-------|
| 1. Dati base | minor_id, activity_type_id, title, description |
| 2. Pianificazione | planned/actual start/end, luogo, stato, PEI |
| 3. Responsabilità e supporto | responsible_staff_member_id, attendance_status, support_level |
| 4. Logistica | requires_transport, materials_needed |
| 5. Esito e follow-up | outcome_notes, follow_up_required, follow_up_notes |

**Nuove colonne tabella:** responsabile, presenza, supporto, trasporto, follow-up

**Nuovi filtri server-side:** attendance_status, support_level, follow_up_required  
**Filtri client-side già presenti:** da/a date + limite

**Copy enum implementato:**
- `present` → "Presenza completa", `partial` → "Presenza parziale", `absent` → "Assente"
- `autonomous` → "Autonomia piena", `light` → "Supporto leggero", `medium` → "Supporto medio", `high` → "Supporto elevato"

**Selettore personale:** filtrato per struttura quando `filterFacilityId > 0`

**Non implementato (rinviato):**
- `GET /api/activities/summary` — KPI card non realizzata. Richiede UI dedicata. Da aggiungere in task successivo.

---

## Task 091 — Attività v2: InfoDrawer e box inline

### Stato: ✅ Implementato

**InfoDrawer aggiornato con sezioni:**
- "A cosa serve questa sezione"
- "Quali dati vengono gestiti"
- "Come leggere presenza e supporto"
- "Quando alcune azioni possono essere bloccate"
- "Permessi"

**Box inline obbligatori:**
- Blocco "Responsabilità e supporto": Alert info con copy da task 091
- Blocco "Logistica": Alert info con copy da task 091
- Blocco "Esito e follow-up": Alert info con copy da task 091

**Empty state:** "Non risultano attività per i filtri selezionati."

---

## Divergenze e rinvii

| Item | Motivo |
|------|--------|
| `GET /api/activities/summary` | Nessuna UI concordata. Proposta: card KPI in testa alla pagina in task successivo |

---

## Aggiornamenti in `services/api.ts`

`activityApi.list()` ora accetta i nuovi parametri di filtro:
- `attendance_status`
- `support_level`
- `follow_up_required`
