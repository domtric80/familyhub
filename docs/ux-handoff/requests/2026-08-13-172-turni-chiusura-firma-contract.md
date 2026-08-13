# UX Handoff 172 - Turni: chiusura e firma operativa del turno

Data: 2026-08-13
Ambito: `Turni > I miei turni`, eventuale drawer dettaglio turno, CTA operatore
Priorita: Alta

## Stato backend

Backend pronto.

Questo handoff descrive lo step 3 della roadmap `Turni / Timesheet` e va letto insieme a:

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-170-turni-calendario-mensile-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-171-turni-sostituzioni-contract.md`

---

## 1. Obiettivo prodotto

L'operatore autenticato deve poter:

- vedere se un turno puo essere chiuso;
- chiudere e firmare operativamente il proprio turno;
- capire chiaramente la differenza tra:
  - chiusura operativa del turno da parte dell'operatore;
  - eventuale approvazione amministrativa successiva del timesheet.

Questa azione **non** sostituisce il flusso amministrativo di approvazione timesheet. Serve solo a dichiarare: "ho concluso il turno e confermo il consuntivo operativo".

---

## 2. Endpoint nuovo

### Chiusura e firma del proprio turno

`POST /api/staff-shifts/{shift_assignment}/submit`

### Regole backend

Il backend consente la chiusura solo se:

- l'utente autenticato e collegato a uno `staff_member`;
- lo `staff_member` autenticato e l'operatore effettivo del turno;
- esiste il `timesheet_entry` collegato al turno;
- il mese timesheet non e bloccato;
- esiste la timbratura di uscita;
- lo stato del consuntivo e uno tra:
  - `draft`
  - `computed`
  - `rejected`

Se una di queste condizioni fallisce, il frontend deve mostrare l'errore backend senza inventare regole locali.

---

## 3. Request body

Body opzionale:

```json
{
  "notes": "Turno chiuso con consegne completate."
}
```

### Campo supportato

- `notes` optional, stringa, max 4000 caratteri

Se assente, il backend chiude comunque il turno.

---

## 4. Response

```json
{
  "message": "Turno chiuso e firmato con successo.",
  "assignment": {
    "...": "...",
    "operational": {
      "state": "signed",
      "label": "Firmato",
      "timesheet_status": "submitted",
      "submitted_at": "2026-08-13T16:12:00+02:00",
      "approved_at": null,
      "locked_at": null,
      "can_submit": false,
      "has_open_anomalies": false
    }
  },
  "timesheet_entry": {
    "id": 88,
    "status": "submitted",
    "submitted_at": "2026-08-13T16:12:00+02:00",
    "submitted_by_user_id": 14
  }
}
```

---

## 5. Nuovo blocco `assignment.operational`

Ogni `StaffShiftAssignment` ora include anche:

```json
{
  "operational": {
    "state": "open",
    "label": "Aperto",
    "timesheet_status": "draft",
    "submitted_at": null,
    "approved_at": null,
    "locked_at": null,
    "can_submit": true,
    "has_open_anomalies": true
  }
}
```

### Semantica campi

- `state`: stato operativo sintetico da usare come stato principale UI
- `label`: etichetta leggibile gia pronta
- `timesheet_status`: stato raw del consuntivo
- `submitted_at`: valorizzato dopo chiusura/firma operativa
- `approved_at`: valorizzato dopo approvazione amministrativa
- `locked_at`: valorizzato se mese o record e bloccato
- `can_submit`: verita backend da usare per abilitare/disabilitare CTA
- `has_open_anomalies`: indica che ci sono anomalie aperte nel consuntivo

---

## 6. Stati da gestire in UI

### `operational.state`

Valori possibili:

- `open`
- `in_progress`
- `closed`
- `signed`
- `approved`
- `locked`
- `cancelled`

### Significato pratico

- `open`: turno pianificato ma non ancora avviato
- `in_progress`: turno iniziato ma non concluso
- `closed`: turno concluso ma non ancora firmato operativamente
- `signed`: turno chiuso e inviato dall'operatore
- `approved`: turno validato da flusso amministrativo
- `locked`: turno o mese bloccato, nessuna modifica consentita
- `cancelled`: turno annullato

---

## 7. Regole UX obbligatorie

### A. La CTA principale deve usare `can_submit`

Non duplicare logica lato frontend.

- se `can_submit = true`: mostra CTA `Chiudi e firma turno`
- se `can_submit = false`: CTA nascosta o disabilitata

### B. Lo stato principale visuale deve usare `operational`

Non inferire lo stato solo da:

- `assignment.status`
- `actual.completed`
- `timesheet_entry.status`

Lo stato da mostrare all'operatore e il blocco `operational`.

### C. Distinguere firma operativa da approvazione

Testi suggeriti:

- `Turno chiuso e firmato`
- `In attesa di approvazione`
- `Turno approvato`

Evitare testi fuorvianti come:

- `Timesheet approvato` subito dopo submit
- `Turno definitivo` se non e ancora approvato

### D. Gestione anomalie

Se `has_open_anomalies = true`:

- mostrare badge warning vicino allo stato;
- non bloccare automaticamente la CTA se `can_submit = true`;
- lasciare al backend l'ultima parola sul submit.

---

## 8. UX minima richiesta

### Vista "I miei turni"

Per ogni assegnazione mostrare almeno:

- nome turno
- data e fascia oraria
- stato operativo
- eventuale badge anomalie
- CTA `Chiudi e firma turno` quando disponibile

### Drawer o dettaglio turno

Mostrare:

- operatore pianificato
- operatore effettivo
- orario pianificato
- orario effettivo
- minuti lavorati
- pausa
- eventuali anomalie
- campo note finale
- CTA submit

---

## 9. Cosa non deve fare UX

- non deve implementare la logica di chi puo chiudere il turno;
- non deve derivare localmente se il mese e bloccato;
- non deve trasformare `submitted` in `approved`;
- non deve nascondere gli errori backend.

---

## 10. Messaggi errore da gestire

Possibili errori backend:

- `Permesso insufficiente per chiudere questo turno.`
- `Nessun consuntivo turno disponibile per questa assegnazione.`
- `Impossibile chiudere un turno senza timbratura di uscita.`
- `Lo stato corrente non consente la chiusura/firma del turno.`
- errore mese bloccato

UX deve mostrare il messaggio backend in toast o alert inline.

---

## 11. Nota QA

Il QA deve verificare almeno questi casi:

1. turno con uscita registrata e `can_submit = true` -> submit riuscito
2. turno senza uscita -> submit rifiutato
3. turno gia firmato -> CTA non ripetibile
4. sostituto attivo -> puo chiudere il turno il sostituto, non il titolare originario
5. stato `signed` -> visibile come fase intermedia prima di `approved`
