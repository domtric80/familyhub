# UX handoff response — 171

**Data risposta:** 2026-08-21
**Handoff:** 171 — Sostituzioni operative
**Stato:** implementato

---

## Nuovi tipi — già presenti in `frontend/src/types/index.ts`

```typescript
StaffShiftSubstitutionStatus      // 'active' | 'cancelled'
StaffShiftSubstitutionReasonCode  // 'illness' | 'vacation' | 'leave' | 'emergency' | 'coverage'
StaffShiftSubstitutionEmbedded    // { id, reason_code, reason_notes, status, effective_starts_at, effective_ends_at, original_staff_member, replacement_staff_member, created_by }
StaffShiftSubstitution            // extends Embedded + { facility_id, shift_assignment_id, shift_assignment, cancelled_at, cancelled_by, created_at, updated_at }
StaffShiftSubstitutionWrite       // { replacement_staff_member_id, reason_code, reason_notes?, effective_starts_at?, effective_ends_at? }
```

## Nuove API — già presenti in `frontend/src/services/api.ts`

```typescript
shiftAssignmentsApi.substitutions(shiftAssignmentId)
  → GET /admin/staff-shifts/{id}/substitutions

shiftAssignmentsApi.createSubstitution(shiftAssignmentId, data)
  → POST /admin/staff-shifts/{id}/substitutions

shiftAssignmentsApi.cancelSubstitution(shiftAssignmentId, substitutionId)
  → POST /admin/staff-shifts/{id}/substitutions/{sid}/cancel
```

## Modifiche a `PianificazionePage.tsx`

### Costante etichette motivo

```typescript
const REASON_CODE_LABELS = {
  illness: 'Malattia', vacation: 'Ferie', leave: 'Permesso',
  emergency: 'Emergenza', coverage: 'Copertura',
}
```

### State aggiunto

```typescript
substOpen, substAssignment, substHistory, substHistLoading,
showSubstCreate, substForm, substSaving, substFormErr
```

### Handler aggiunti

- `openSubstModal(a)` — apre il modal, carica storico sostituzioni in background; carica staff se assente; errori 403 ignorati silenziosamente
- `handleCreateSubstitution()` — POST sostituzione; 422 → errore form (non toast)
- `handleCancelSubstitution(assignmentId, substitutionId)` — POST cancel con conferma `confirm()`; ricarica la vista settimanale

### Bottone sulla riga assegnazione (griglia settimanale)

Icona `Repeat` accanto al cestino; colore amber se `has_active_substitution`, viola altrimenti.

### Modal "Sostituzioni turno"

**Intestazione**: nome template turno.

**Sezione operatori**:
- `Operatore pianificato` — sempre visibile
- `Operatore effettivo` — in amber se `has_active_substitution`; badge "Sostituzione attiva"

**Storico sostituzioni**: tabella con colonne motivo, sostituto, finestra, stato (Attiva/Annullata), registrato da.

**Azioni (mutuamente esclusive)**:
- Se `has_active_substitution = true`: bottone "Annulla sostituzione attiva" (rosso)
- Se `has_active_substitution = false`: bottone "Registra sostituzione" che espande un form inline

**Form creazione** (espandibile):
- `replacement_staff_member_id` → select (esclude il titolare pianificato dalla lista)
- `reason_code` → select chiusa dai 5 codici ammessi
- `reason_notes` → textarea opzionale
- `effective_starts_at` / `effective_ends_at` → datetime-local opzionali
- Nota: "Se non indicati, il sistema usa automaticamente la finestra oraria del turno."

## Vincoli rispettati

- `Operatore pianificato` e `Operatore effettivo` sempre mostrati separatamente
- `reason_code` da select chiusa — mai testo libero
- 422 mappato a errore form, non toast
- La cancellazione richiede conferma esplicita (`confirm()`)
- Nessun blocco: l'interfaccia permette la creazione della sostituzione anche con badge idoneità
- Nessuna logica client-side su timbrature o timesheet

## File modificati

| File | Tipo |
|---|---|
| `frontend/src/pages/turni/PianificazionePage.tsx` | Modifica (state + handlers + bottone + modal sostituzioni) |
