# Modulo Uscite operativo + anagrafica Tipi Uscita

- `Request ID`: 2026-06-28-037  
- `Stato`: OPEN  
- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 1. Contesto

È stato implementato il primo modulo operativo reale `Uscite`.

Obiettivo funzionale:
- pianificare un'uscita di un minore dalla struttura;
- registrare partenza effettiva;
- registrare rientro effettivo;
- annullare un'uscita pianificata;
- mantenere uno storico coerente lato backend e cronologia minore.

In parallelo è stata implementata l'anagrafica backend `Tipi Uscita`, usata per evitare valori testuali liberi come “familiare”, “fam”, “uscita scuola”, ecc.

## 2. Impatto frontend

- La voce menu `Uscite` non deve più mostrare placeholder / coming soon.
- Deve esistere una pagina operativa con:
  - filtri;
  - tabella elenco;
  - creazione uscita;
  - modifica uscita;
  - azioni rapide di transizione stato.
- Il team UX deve prevedere anche una pagina amministrativa separata per `Tipi Uscita` con CRUD completo.

## 3. Endpoint coinvolti

- `GET /api/lookups/exit-types`
- `GET /api/exits`
- `POST /api/exits`
- `GET /api/exits/{exit}`
- `PATCH /api/exits/{exit}`
- `PUT /api/exits/{exit}`
- `POST /api/exits/{exit}/mark-out`
- `POST /api/exits/{exit}/mark-returned`
- `POST /api/exits/{exit}/cancel`
- `DELETE /api/exits/{exit}`
- `GET /api/admin/exit-types`
- `POST /api/admin/exit-types`
- `GET /api/admin/exit-types/{exit_type}`
- `PUT /api/admin/exit-types/{exit_type}`
- `DELETE /api/admin/exit-types/{exit_type}`

## 4. Request da supportare

### 4.1 Creazione uscita `POST /api/exits`

Campi obbligatori:
- `facility_id`
- `minor_id`
- `exit_type_id`
- `destination`
- `planned_exit_at`

Campi opzionali:
- `reason`
- `accompanied_by`
- `authorized_by_user_id`
- `expected_return_at`
- `outcome_notes`

Vincoli:
- `facility_id` deve coincidere con la struttura del minore scelto
- `expected_return_at >= planned_exit_at`
- niente testo libero per il tipo uscita: usare sempre `exit_type_id`

### 4.2 Modifica uscita `PATCH /api/exits/{exit}`

Campi modificabili:
- `exit_type_id`
- `destination`
- `reason`
- `accompanied_by`
- `authorized_by_user_id`
- `planned_exit_at`
- `expected_return_at`
- `status`
- `outcome_notes`
- `cancellation_reason`

Importante:
- `facility_id` e `minor_id` **non vanno modificati in UX** per un record già creato
- se UX vuole cambiare minore/struttura, il flusso corretto è: annulla/elimina e ricrea

### 4.3 Transizioni rapide

#### `POST /api/exits/{exit}/mark-out`
Body opzionale:
- `actual_exit_at`

#### `POST /api/exits/{exit}/mark-returned`
Body opzionale:
- `actual_return_at`
- `outcome_notes`

#### `POST /api/exits/{exit}/cancel`
Body opzionale:
- `cancellation_reason`

Consiglio UX:
- chiedere sempre una conferma utente
- per `cancel` mostrare textarea/modale per motivazione

### 4.4 CRUD Tipi Uscita admin

Payload `OrderedLookupItemWrite`:
- `code`
- `name`
- `sort_order`
- `is_active`

## 5. Response da visualizzare

### 5.1 Lista uscite

Campi principali da mostrare:
- `id`
- `minor.last_name`
- `minor.first_name`
- `minor.internal_code`
- `facility.name`
- `exit_type.name`
- `destination`
- `planned_exit_at`
- `expected_return_at`
- `actual_exit_at`
- `actual_return_at`
- `status`

### 5.2 Badge stato

Mappatura obbligatoria:
- `planned` → `Pianificata`
- `out` → `Fuori struttura`
- `returned` → `Rientrata`
- `cancelled` → `Annullata`

### 5.3 Azioni visibili per stato

- `planned`
  - modifica
  - marca uscita avvenuta
  - annulla
  - elimina (se permesso)
- `out`
  - modifica
  - marca rientro
  - elimina (se permesso)
- `returned`
  - modifica
  - elimina (se permesso)
- `cancelled`
  - modifica
  - elimina (se permesso)

## 6. Stati UI da gestire

- loading lista
- empty lista
- success salvataggio
- validation error backend `422`
- forbidden `403`
- conflict `409` su delete tipo uscita
- stato “nessun permesso creazione”

## 7. Regole autorizzative

### Modulo Uscite

Il frontend deve usare i permessi restituiti in `GET /api/auth/me`:
- `minor_exits.read`
- `minor_exits.create`
- `minor_exits.update`
- `minor_exits.delete`

Non basta mostrare la pagina:
- i pulsanti azione devono comparire solo se il permesso esiste davvero.

### Anagrafica Tipi Uscita

Permessi:
- `exit_types.read`
- `exit_types.create`
- `exit_types.update`
- `exit_types.delete`

Nota importante:
- `GET /api/lookups/exit-types` è il lookup operativo da usare nei form;
- `GET /api/admin/exit-types` è la console admin CRUD.

## 8. Comportamento atteso

### Flusso operativo base

1. utente apre `Uscite`
2. seleziona eventuale struttura / minore / stato
3. visualizza elenco uscite
4. crea nuova uscita scegliendo:
   - struttura
   - minore
   - tipo uscita
   - destinazione
   - data/ora uscita
   - eventuale rientro previsto
5. quando il minore esce davvero, usa azione `mark-out`
6. quando rientra, usa azione `mark-returned`
7. se l'uscita salta, usa `cancel`

### Flusso admin Tipi Uscita

1. utente admin apre pagina `Tipi Uscita`
2. vede lista ordinata per `sort_order`, poi `name`
3. può creare / modificare / disattivare / eliminare
4. se il tipo è già usato da uscite esistenti, backend restituisce `409`

## 9. Checklist UX team

- [ ] Pagina `Uscite` reale, non placeholder
- [ ] Filtri struttura / minore / stato
- [ ] Tabella con badge stato
- [ ] Form creazione uscita
- [ ] Form modifica uscita
- [ ] Azioni rapide `mark-out`, `mark-returned`, `cancel`
- [ ] Pagina admin `Tipi Uscita` CRUD
- [ ] Gestione `403`, `409`, `422`
- [ ] Nessun campo testuale libero per il tipo uscita
- [ ] QA funzionale con transizioni stato completato

## 10. Note backend

- Migrazione additiva eseguita senza reset DB.
- Nuove tabelle:
  - `exit_types`
  - `minor_exits`
- Seeder aggiornati in modo idempotente per popolare i tipi base:
  - `FAMILY`
  - `SCHOOL`
  - `MEDICAL`
  - `RECREATIONAL`
  - `ADMIN`
- Le uscite vengono anche registrate nella cronologia minore con eventi dedicati:
  - `minor_exit_created`
  - `minor_exit_updated`
  - `minor_exit_marked_out`
  - `minor_exit_returned`
  - `minor_exit_cancelled`
  - `minor_exit_deleted`
