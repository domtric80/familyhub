# UX handoff response — 190

**Data risposta:** 2026-08-19
**Handoff:** 190 — Idoneità personale per pianificazione turni (advisory)
**Stato:** implementato

---

## Nuovi tipi (`frontend/src/types/index.ts`)

```typescript
StaffShiftEligibilityAlert    // { code, message }
StaffShiftEligibility         // { staff_member_id, requires_attention, can_assign, alerts[] }
FacilityShiftEligibility      // { facility_id, staff: StaffShiftEligibility[] }
```

## Nuova API (`frontend/src/services/api.ts`)

```typescript
shiftEligibilityApi.get(facilityId)
  → GET /admin/facilities/{facilityId}/shift-eligibility
  → permesso: staff_shift_assignments.read
```

## Modifiche a `PianificazionePage.tsx`

**Caricamento:** useEffect su `facilityId` → chiama `shiftEligibilityApi.get(facilityId)`.
Errori silenziosi (permesso non garantito) — se la chiamata fallisce, `eligibility` rimane `null` e nessun badge compare.

**Helper `getEligibility(staffMemberId)`:** lookup su `eligibility.staff[]` per `staff_member_id`.

**Box informativo (advisory):**
- Compare solo se almeno un operatore ha `requires_attention: true`
- Testo: "Il controllo è consultivo: valuta documenti e certificazioni ma non blocca i turni."
- Mostra quanti operatori richiedono attenzione

**Badge nella griglia settimanale:**
- Accanto al nome dell'operatore assegnato: badge `⚠ Attenzione` (bg-warning)
- Tooltip `title` con i messaggi degli `alerts[]` concatenati
- Visualizzato solo se `getEligibility(staff_member.id)?.requires_attention === true`

**Modal nuova assegnazione:**
- In `<select>` operatore: prefisso `⚠ ` nel testo dell'option se `requires_attention`
- Sotto il select, se l'operatore selezionato ha `requires_attention`:
  - Elenco degli `alerts[].message` con icona
  - Nota: "Il controllo è consultivo — l'assegnazione è comunque possibile."

## Vincoli rispettati

- Controllo esclusivamente advisory: nessun blocco, nessuna modifica automatica di stati o ruoli
- `can_assign` non richiesto per mostrare avvisi (si mostra sempre se `requires_attention`)
- Nessuna ricostruzione di controlli lato browser
- Dati HR riservati non restituiti (solo tipo avviso e messaggio)
- Errori di permesso gestiti silenziosamente (il badge non compare se l'API restituisce 403)

## File modificati

| File | Tipo |
|---|---|
| `frontend/src/types/index.ts` | Modifica (nuovi tipi 190) |
| `frontend/src/services/api.ts` | Modifica (shiftEligibilityApi) |
| `frontend/src/pages/turni/PianificazionePage.tsx` | Modifica (useEffect + getEligibility + badge + info box + modal) |
