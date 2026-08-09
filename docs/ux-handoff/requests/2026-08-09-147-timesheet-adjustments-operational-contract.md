# Handoff UX/API — Rettifiche timesheet operative

Data: 2026-08-09  
Ambito: `Turni > Verifica timesheet`, `Turni > Le mie presenze`, `Dashboard timesheet`
Priorità: alta

---

## Obiettivo

Le rettifiche timesheet non sono più “placeholder”.

Da ora il backend espone un endpoint reale che:

- crea una rettifica sul consuntivo
- non modifica lo storico timbrature
- aggiorna i minuti calcolati dell'entry
- lascia audit trail completo

---

## Endpoint attivo

### `POST /api/admin/timesheets/{timesheetEntry}/adjustments`

Permesso backend richiesto:

- `staff_timesheet_adjustments.create`

Payload:

```json
{
  "adjustment_type": "manual_correction",
  "delta_minutes": 30,
  "reason": "Autorizzata rettifica per uscita registrata in ritardo nel verbale turno."
}
```

Enum validi `adjustment_type`:

- `manual_correction` → `Correzione manuale`
- `break_correction` → `Correzione pausa`
- `overtime_authorization` → `Straordinario autorizzato`
- `absence_reconciliation` → `Riconciliazione assenza`

Regole:

- `delta_minutes` obbligatorio
- range ammesso: `-720 .. 720`
- `0` non ammesso
- `reason` obbligatoria
- se l'entry è `locked` il backend risponde `422`

Risposta:

- `201 Created`
- body = `StaffTimesheetEntry` completo aggiornato
- include anche `adjustments[]`

---

## Impatto frontend richiesto

### 1. Pagina `Turni > Verifica timesheet`

Stato atteso:

- il modal dettaglio entry deve mostrare pulsante `Aggiungi rettifica`
- il pulsante è visibile per tutti gli stati eccetto `locked`
- la creazione rettifica avviene da modal dedicato

Campi modal:

- `Tipo rettifica` → select obbligatoria con i 4 enum sopra
- `Delta minuti` → numero intero positivo/negativo
- `Motivazione` → textarea obbligatoria

Comportamento:

- submit → `POST /api/admin/timesheets/{id}/adjustments`
- su successo:
  - chiudere modal rettifica
  - aggiornare `detail`
  - aggiornare la riga in tabella senza reload pagina completo se possibile
  - mostrare toast positivo

### 2. Sezione `Rettifiche` nel dettaglio entry

La tabella rettifiche deve mostrare:

- tipo leggibile
- delta minuti
- motivazione
- stato
- data/ora creazione

### 3. Pagina `Turni > Le mie presenze`

L'operatore non crea rettifiche.

Mostra solo:

- elenco rettifiche già presenti
- tipo leggibile
- delta
- motivazione
- stato

---

## Regola funzionale da rispettare

Molto importante:

- le rettifiche **non sostituiscono** le timbrature
- le rettifiche **non cancellano** gli eventi `clock_in/clock_out/break_*`
- le rettifiche agiscono solo sul consuntivo finale dell'entry

Formula operativa backend:

- il backend calcola il consuntivo da timbrature
- somma tutti i `delta_minutes` delle rettifiche `approved`
- ricalcola:
  - `worked_minutes`
  - `ordinary_minutes`
  - `overtime_minutes`
  - `absence_minutes`
  - `variance_minutes`

---

## Note UX importanti

- rimuovere ogni testo tipo “rettifiche non ancora disponibili”
- non introdurre campi testuali per il tipo rettifica
- usare esattamente gli enum documentati
- non cambiare le label senza riallineamento, perché servono anche alla guida utente

---

## QA minima richiesta a UX

1. aprire dettaglio entry `computed/submitted/approved`
2. creare una rettifica `+30`
3. verificare aggiornamento numeri nel consuntivo
4. verificare presenza riga in tabella rettifiche
5. verificare assenza del pulsante su entry `locked`

---

## Nota per sviluppo frontend

Lato service:

- `timesheetApi.addAdjustment(id, data)` non è più stub
- ora punta a endpoint reale e restituisce `TimesheetEntry` normalizzato

