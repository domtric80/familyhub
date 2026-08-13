# UX Handoff 171 — Turni: sostituzioni operative e staff effettivo

Data: 2026-08-13
Ambito: `Turni > Pianificazione`, `Turni > I miei turni`, eventuale drawer dettaglio turno
Priorita: Alta

## Stato backend

Backend pronto.

Questo handoff completa lo step 2 della roadmap `Turni / Timesheet` e va letto insieme a:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-170-turni-calendario-mensile-contract.md`
- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

---

## 1. Obiettivo prodotto

Una assegnazione turno ora distingue sempre:

- `staff_member` = operatore pianificato originariamente
- `effective_staff_member` = operatore che copre davvero il turno adesso

Se esiste una sostituzione attiva:

- `has_active_substitution = true`
- `active_substitution` contiene motivo, finestra e attori

La UI non deve mai “sovrascrivere mentalmente” il titolare col sostituto: deve mostrare entrambi in modo leggibile.

---

## 2. Endpoint nuovi

### A. Elenco sostituzioni di un turno

`GET /api/admin/staff-shifts/{shift_assignment}/substitutions`

Uso:

- aprire drawer/modal storico sostituzioni
- mostrare eventuale sostituzione attiva
- mostrare eventuali sostituzioni annullate precedenti

### B. Creazione sostituzione

`POST /api/admin/staff-shifts/{shift_assignment}/substitutions`

Body:

```json
{
  "replacement_staff_member_id": 25,
  "reason_code": "illness",
  "reason_notes": "Copertura per assenza improvvisa.",
  "effective_starts_at": "2026-08-18T08:00:00+02:00",
  "effective_ends_at": "2026-08-18T16:00:00+02:00"
}
```

`effective_starts_at` e `effective_ends_at` sono opzionali:

- se omessi, il backend usa in automatico la finestra del turno

### C. Annullamento sostituzione

`POST /api/admin/staff-shifts/{shift_assignment}/substitutions/{substitution}/cancel`

Uso:

- rimuovere la sostituzione attiva
- far tornare il turno al titolare originario

---

## 3. Aggiornamento contratto assegnazione turno

Ogni `StaffShiftAssignment` puo ora includere:

```json
{
  "staff_member": {
    "id": 11,
    "display_name": "Rossi Mario"
  },
  "effective_staff_member": {
    "id": 25,
    "display_name": "Verdi Luca"
  },
  "has_active_substitution": true,
  "active_substitution": {
    "id": 7,
    "reason_code": "illness",
    "reason_notes": "Copertura per assenza improvvisa.",
    "status": "active",
    "effective_starts_at": "2026-08-18T08:00:00+02:00",
    "effective_ends_at": "2026-08-18T16:00:00+02:00",
    "original_staff_member": {
      "id": 11,
      "display_name": "Rossi Mario"
    },
    "replacement_staff_member": {
      "id": 25,
      "display_name": "Verdi Luca"
    },
    "created_by": {
      "id": 3,
      "display_name": "Paola Bianchi",
      "email": "coord@familyhub.local"
    }
  }
}
```

Se non esiste sostituzione attiva:

- `effective_staff_member` coincide di fatto con `staff_member`
- `has_active_substitution = false`
- `active_substitution = null`

---

## 4. Contratto risposta sostituzione

```json
{
  "id": 7,
  "facility_id": 3,
  "shift_assignment_id": 44,
  "original_staff_member_id": 11,
  "replacement_staff_member_id": 25,
  "reason_code": "illness",
  "reason_notes": "Copertura per assenza improvvisa.",
  "effective_starts_at": "2026-08-18T08:00:00+02:00",
  "effective_ends_at": "2026-08-18T16:00:00+02:00",
  "status": "active",
  "cancelled_at": null,
  "shift_assignment": {
    "id": 44,
    "shift_date": "2026-08-18",
    "status": "confirmed",
    "shift_template": {
      "id": 9,
      "code": "DAY",
      "name": "Turno giorno"
    }
  },
  "original_staff_member": {
    "id": 11,
    "display_name": "Rossi Mario"
  },
  "replacement_staff_member": {
    "id": 25,
    "display_name": "Verdi Luca"
  },
  "created_by": {
    "id": 3,
    "display_name": "Paola Bianchi",
    "email": "coord@familyhub.local"
  },
  "cancelled_by": null,
  "created_at": "2026-08-13T10:00:00+02:00",
  "updated_at": "2026-08-13T10:00:00+02:00"
}
```

---

## 5. Regole UX obbligatorie

### A. Nomenclatura

In UI usare sempre testi espliciti:

- `Operatore pianificato`
- `Operatore effettivo`
- `Sostituzione attiva`

Evitare etichette ambigue come solo `Operatore`.

### B. Vista planner settimanale e mensile struttura

Per ogni assegnazione:

- mostrare il titolare pianificato
- se `has_active_substitution = true`, mostrare badge evidente `Sostituito`
- mostrare sotto o a lato il `effective_staff_member`
- non nascondere il titolare originario

### C. Vista personale operatore

La vista `I miei turni` usa gia il filtro backend sull’operatore effettivo:

- il sostituto vede il turno
- il titolare originario non lo vede piu finche la sostituzione resta attiva

Questa parte NON va ricostruita lato frontend: e gia risolta dal backend.

### D. Azioni consigliate

Su dettaglio assegnazione turno:

- bottone `Apri sostituzioni`
- lista storico sostituzioni
- se non esiste sostituzione attiva: CTA `Registra sostituzione`
- se esiste sostituzione attiva: CTA `Annulla sostituzione`

---

## 6. Form creazione sostituzione

Campi richiesti da UI:

- `replacement_staff_member_id` (select operatore)
- `reason_code` (select chiusa, non testo libero)

Campi opzionali:

- `reason_notes`
- `effective_starts_at`
- `effective_ends_at`

### `reason_code` ammessi

- `illness`
- `vacation`
- `leave`
- `emergency`
- `coverage`

La UI deve presentare label utente leggibili, ma inviare al backend i codici sopra.

---

## 7. Validazioni che UX deve aspettarsi

Il backend puo rispondere `422` se:

- il sostituto appartiene a una struttura diversa
- il sostituto coincide col titolare del turno
- esiste gia una sostituzione attiva sul turno
- il sostituto ha gia un altro turno sovrapposto nella stessa fascia

La UI deve mappare questi errori sul form, non come toast generico.

---

## 8. Impatto su timbrature e timesheet

Con sostituzione attiva:

- il sostituto puo timbrare sul turno originario
- il consuntivo/timesheet viene calcolato sul sostituto effettivo

Questa logica e backend: la UI non deve costruire workaround.

---

## 9. QA minimo richiesto a UX

### Scenario 1 — Sostituzione attiva

- aprire turno con titolare A
- creare sostituzione verso operatore B
- verificare che planner mostri A come pianificato e B come effettivo
- verificare badge `Sostituzione attiva`

### Scenario 2 — Vista personale

- accedere come operatore B
- verificare che il turno sostituito compaia in `I miei turni`

### Scenario 3 — Annullamento

- annullare la sostituzione
- verificare che il badge sparisca
- verificare che `effective_staff_member` torni a coincidere col titolare

### Scenario 4 — Storico

- aprire storico sostituzioni del turno
- verificare lista discendente per data creazione
- verificare stato `active` / `cancelled`

---

## 10. Nota importante per UX

Questo step non introduce ancora:

- drag&drop planner
- sostituzioni bulk su piu turni
- suggerimento automatico del miglior sostituto

Quindi la UI deve restare semplice e rigorosa sul singolo turno.
