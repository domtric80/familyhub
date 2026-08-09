# Handoff UX/API ? Rettifiche timesheet: workflow revisione

Data: 2026-08-09  
Ambito: `Turni > Verifica timesheet`, `Turni > Le mie presenze`  
Priorit?: alta

---

## Obiettivo

Le rettifiche timesheet non sono pi? approvate in creazione.

Da ora il flusso corretto ?:

1. creazione richiesta rettifica
2. stato iniziale `pending`
3. revisione coordinatore / referente / direttore
4. esito `approved` oppure `rejected`
5. il ricalcolo minuti avviene **solo** quando la rettifica viene approvata

---

## Endpoint aggiornato

### `POST /api/admin/timesheets/{timesheetEntry}/adjustments`

Permesso backend richiesto:

- `staff_timesheet_adjustments.create`

Payload invariato:

```json
{
  "adjustment_type": "manual_correction",
  "delta_minutes": 30,
  "reason": "Autorizzata rettifica per uscita registrata in ritardo nel verbale turno."
}
```

Nuovo comportamento:

- crea una rettifica con `status = pending`
- **non** ricalcola subito il consuntivo
- restituisce `201 Created`
- body = `StaffTimesheetEntry` aggiornato con `adjustments[]`

---

## Nuovi endpoint attivi

### `POST /api/admin/timesheets/{timesheetEntry}/adjustments/{adjustment}/approve`

Permesso backend richiesto:

- `staff_timesheet_adjustments.approve`

Payload:

```json
{
  "review_notes": "Rettifica coerente con verbale coordinatore."
}
```

Regole:

- approvabile solo se `adjustment.status = pending`
- `review_notes` facoltative
- all'approvazione il backend:
  - salva `reviewed_by_user_id`
  - salva `reviewed_at`
  - salva `review_notes`
  - ricalcola il consuntivo sommando i `delta_minutes` approved
  - mantiene il lifecycle corrente del timesheet (`submitted`, `approved`, `rejected`, ecc.)

Risposta:

- `200 OK`
- body = `StaffTimesheetEntry` aggiornato

### `POST /api/admin/timesheets/{timesheetEntry}/adjustments/{adjustment}/reject`

Permesso backend richiesto:

- `staff_timesheet_adjustments.approve`

Payload:

```json
{
  "review_notes": "Rigettata dopo verifica con timbrature originali."
}
```

Regole:

- rifiutabile solo se `adjustment.status = pending`
- `review_notes` obbligatorie
- il rifiuto **non** altera i minuti consuntivi

Risposta:

- `200 OK`
- body = `StaffTimesheetEntry` aggiornato

---

## Impatto frontend richiesto

### 1. Pagina `Turni > Verifica timesheet`

Aggiornare il modal dettaglio entry.

#### Sezione `Rettifiche`

La tabella deve mostrare queste colonne:

- `Tipo`
- `? min`
- `Motivo`
- `Stato`
- `Creata il`
- `Revisione`
- `Azioni`

Campo `Revisione`:

- se la rettifica ? stata revisionata: mostra `reviewed_at`
- se presenti: mostra anche `review_notes`
- se non revisionata: mostra placeholder neutro (`?`)

Campo `Azioni`:

- mostra pulsanti solo per rettifiche `pending`
- azioni disponibili:
  - `Approva`
  - `Rifiuta`

#### Modal creazione rettifica

Testi aggiornati:

- CTA: `Invia richiesta`
- toast successo: `Richiesta di rettifica registrata e in attesa di approvazione.`

#### Modal revisione rettifica

Nuovo modal con due varianti:

- `Approva rettifica`
- `Rifiuta rettifica`

Regole UI:

- in approvazione: note facoltative
- in rifiuto: motivazione obbligatoria
- submit approvazione ? endpoint `/approve`
- submit rifiuto ? endpoint `/reject`

### 2. Pagina `Turni > Le mie presenze`

Nessuna azione operativa lato operatore.

Mostrare in sola lettura anche:

- `reviewed_at`
- `review_notes` se presenti

---

## Regole funzionali da rispettare

- le rettifiche **non sostituiscono** le timbrature originali
- le rettifiche `pending` o `rejected` **non** cambiano i minuti finali
- solo le rettifiche `approved` entrano nel consuntivo

---

## QA minima richiesta a UX

1. aprire dettaglio entry con stato `computed` o `submitted`
2. creare una rettifica `+30`
3. verificare che la riga nasca `pending`
4. verificare che i minuti **non** cambino subito
5. approvare la rettifica
6. verificare aggiornamento immediato dei minuti
7. creare una seconda rettifica e rifiutarla
8. verificare che resti `rejected` senza alterare il consuntivo

---

## Nota per il team frontend

Il vecchio contratto `147` va considerato superato **solo** per la parte comportamento rettifiche.

Restano validi:

- enum `adjustment_type`
- validazioni `delta_minutes`
- separazione tra timbrature originali e consuntivo
