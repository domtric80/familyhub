# Risposta UX Handoff · Request 2026-06-21-013

- `Request ID`: 2026-06-21-013
- `Data risposta`: 2026-06-21
- `Stato`: READY_FOR_BACKEND_REVIEW

---

## 1. Stato implementazione

La pagina `/admin/assegnazioni` era già aggiornata con il ciclo CRUD completo prima della ricezione di questa specifica. Verifica effettuata — tutto allineato.

---

## 2. Checklist spec 013

- [x] tabella aggiornata con colonna `Assegnato da` (campo `assignment.assignedBy`)
- [x] modale nuova assegnazione collegata a `POST /admin/user-facility-roles`
- [x] modale modifica collegata a `PUT /admin/user-facility-roles/{assignment}`
- [x] modale revoca collegata a `PATCH /admin/user-facility-roles/{assignment}/revoke`
- [x] gestione `422` campo-per-campo (incluso errore sovrapposizione temporale su `role_id`)
- [x] pulsante `Revoca` disabilitato per assegnazioni già inattive (`!a.is_active`)
- [x] banner "backend incompleto" rimosso
- [x] TypeScript 0 errori

---

## 3. Dettaglio implementazione

### Tabella

Colonne presenti: `Utente`, `Struttura`, `Ruolo`, `Dal`, `Al`, `Assegnato da`, `Stato`, `Azioni`.

### Modale crea/modifica

Campi: `user_id` (select), `facility_id` (select), `role_id` (select), `valid_from`, `valid_to` (opzionale), `is_active` (checkbox).

Validazione client: tutti e tre i select devono avere valore > 0 prima dell'invio.

### Modale revoca

Mostra: utente, ruolo, struttura, campo `data revoca effettiva` (input date).

Comportamento:
- chiama `PATCH /admin/user-facility-roles/{id}/revoke` con payload `{ valid_to: "YYYY-MM-DD" }`
- se backend risponde `422`, mostra il messaggio ricevuto nell'alert della modale
- se backend risponde con messaggio "già revocata", lo mostra e non forza ulteriori tentativi

### Errore sovrapposizione temporale

Gestito tramite mapping `ae.errors?.role_id?.[0]` → messaggio campo nel form modale.

---

## 4. Tipi TypeScript rilevanti

- `Assignment` — include `assignedBy?: AdminUser | null`
- `AssignmentWrite` — `{ user_id, facility_id, role_id, valid_from, valid_to?, is_active? }`
- `AssignmentRevokeResponse` — risposta da `PATCH /revoke`
- `assignmentApi.update` — `PUT /admin/user-facility-roles/{id}`
- `assignmentApi.revoke` — `PATCH /admin/user-facility-roles/{id}/revoke`

---

## 5. Punti aperti per backend

- Confermare che `GET /admin/user-facility-roles` restituisca il campo `assignedBy` (o nome equivalente) nella risposta, altrimenti la colonna mostrerà sempre `—`
