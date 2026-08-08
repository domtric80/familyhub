# FamilyHub · Correzione modello assegnazioni minore

Data: 2026-06-28
Stato: decisione architetturale correttiva

## 1. Premessa

La prima proposta di implementazione delle assegnazioni minore ha introdotto due campi:

- `assignment_role_code`
- `access_level`

Questa scelta si è rivelata concettualmente sbagliata per il dominio FamilyHub.

Motivi:

- il ruolo dell'utente è già definito da `user_facility_roles`
- il livello di accesso ai dati deve derivare da policy ABAC e classificazioni documentali, non da un secondo mini-RBAC scritto dentro l'assegnazione

Conclusione:

- l'assegnazione minore **non deve ridefinire il ruolo**
- l'assegnazione minore **non deve decidere il livello dati con un enum locale**

## 2. Modello corretto

L'assegnazione minore deve rappresentare solo:

- il collegamento tra un utente e uno o più minori
- la validità temporale dell'assegnazione
- eventuali note operative

Quindi la tabella `minor_user_assignments` deve diventare concettualmente:

- `id`
- `minor_id`
- `user_id`
- `facility_id`
- `valid_from`
- `valid_to`
- `is_active`
- `assigned_by_user_id`
- `notes`
- `created_at`
- `updated_at`

Vincolo logico:

- una sola assegnazione attiva per combinazione `minor_id + user_id + facility_id`

## 3. Dove resta il ruolo

Il ruolo resta nello strato già esistente:

- `users`
- `roles`
- `permissions`
- `user_facility_roles`

Esempi:

- se l'utente è `PEDIATRA`, il suo ruolo è già noto
- se l'utente è `EDUCATORE`, il suo ruolo è già noto
- se l'utente è `PSICOLOGO`, il suo ruolo è già noto

Non va chiesto di nuovo nel form di assegnazione minore.

## 4. Dove resta ABAC

L'accesso ai dati non deve essere deciso dalla singola assegnazione.

Deve essere deciso da:

1. ruolo RBAC dell'utente nella struttura
2. assegnazione attiva al minore
3. classificazione o tag della risorsa
4. policy sito/configurazione ABAC

Formula corretta:

`ALLOW = RBAC valido AND assegnazione attiva AND policy ABAC soddisfatta`

Non:

- `ALLOW = access_level assegnato nel record`

## 5. Documenti e tag

Per i documenti il controllo deve basarsi su:

- classificazione documento
- tag documento
- eventuali tag del minore
- ruolo dell'utente
- assegnazione attiva al minore

Esempio:

- un documento con tag `clinical`
- può essere visibile solo a ruoli abilitati dal sito
- e solo se l'utente è assegnato a quel minore

Il record di assegnazione minore non deve contenere un proprio campo `read_clinical`.

## 6. UX corretta

La UX deve avere due punti di ingresso semplici e simmetrici.

### 6.1 Dalla scheda minore

Sezione: `Accesso al minore`

Funzioni:

- vedere utenti già assegnati
- aggiungere uno o più utenti al minore
- revocare assegnazioni

### 6.2 Dalla scheda utente

Tab: `Minori assegnati`

Funzioni:

- scegliere la struttura
- vedere tabella minori della struttura
- selezione bulk con checkbox
- assegnare molti minori in una volta
- revocare molti minori in una volta

Questo è il flusso corretto per casi reali come:

- pediatra assegnato a 6 minori della stessa struttura
- psicologo assegnato a 12 minori
- educatore di riferimento associato a un gruppo stabile

## 7. API correttive consigliate

### CRUD semplice assegnazioni

- `GET /api/admin/minor-assignments`
- `POST /api/admin/minor-assignments`
- `DELETE /api/admin/minor-assignments/{minor_assignment}`

Payload minimo:

- `facility_id`
- `minor_id`
- `user_id`
- `valid_from`
- `valid_to`
- `is_active`
- `notes`

### Bulk da scheda utente

- `POST /api/admin/users/{user}/minor-assignments/bulk-sync`

Payload:

- `facility_id`
- `minor_ids[]`
- `valid_from`
- `valid_to`
- `notes`

Semantica:

- allinea i minori assegnati a quell'utente in quella struttura

### Bulk da scheda minore

- `POST /api/admin/minors/{minor}/user-assignments/bulk-sync`

Payload:

- `user_ids[]`
- `valid_from`
- `valid_to`
- `notes`

Semantica:

- allinea gli utenti assegnati a quel minore

## 8. Impatto sul lavoro già fatto

La prima implementazione va considerata una base tecnica utile, ma da rifinire.

Da correggere:

- rimuovere dal frontend i campi `Ruolo assegnazione` e `Livello accesso`
- deprecare in API i campi `assignment_role_code` e `access_level`
- spostare la semantica ABAC dentro policy/config e servizi backend
- introdurre operazioni bulk

## 9. Decisione

Decisione approvata:

- le assegnazioni minore diventano un semplice legame `utente ↔ minore`
- il ruolo resta nell'RBAC di struttura
- l'accesso ai dati resta nell'ABAC basato su classificazioni/tag/policy
- la UX deve supportare gestione singola e bulk
