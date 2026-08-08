# FamilyHub · Accesso per-minore (RBAC + vincolo di assegnazione)

Data: 2026-06-28
Stato: proposta architetturale pronta per implementazione

## 1. Problema da risolvere

L'RBAC attuale controlla bene:

- chi può entrare nel software
- in quale struttura può operare
- quali azioni generali può eseguire
- quali classificazioni documentali può vedere in base al ruolo

Non controlla ancora invece il caso:

- un professionista può lavorare solo su alcuni minori della struttura
- un pediatra, psicologo o consulente esterno deve vedere solo i minori assegnati
- i documenti clinici non devono diventare visibili a tutti gli utenti con ruolo compatibile

Questa esigenza introduce un secondo livello di autorizzazione:

- **RBAC** = cosa posso fare nella struttura
- **minor scope** = su quali minori specifici posso farlo

## 2. Principio di sicurezza

La regola deve essere:

- nessun accesso ai dati del minore se manca il permesso RBAC
- nessun accesso ai dati del minore se manca l'assegnazione specifica, quando richiesta

Quindi:

`ALLOW = ruolo/permesso valido AND assegnazione valida`

Non:

`ALLOW = ruolo valido OR assegnazione valida`

## 3. Modello consigliato

## 3.1 Strato 1 — RBAC di struttura

Resta invariato:

- `users`
- `roles`
- `permissions`
- `user_facility_roles`

Serve ancora per:

- `minors.read`
- `minors.update`
- `attachments.read`
- `attachments.upload`
- `minor_profiles.read`
- `minor_profiles.update`

## 3.2 Strato 2 — assegnazione per-minore

Introdurre una nuova tabella operativa:

### `minor_user_assignments`

Campi proposti:

- `id`
- `minor_id`
- `user_id`
- `facility_id`
- `assignment_role_code`
- `access_level`
- `valid_from`
- `valid_to`
- `is_active`
- `assigned_by_user_id`
- `notes`
- `created_at`
- `updated_at`

Vincoli:

- FK `minor_id -> minors.id`
- FK `user_id -> users.id`
- FK `facility_id -> facilities.id`
- FK `assigned_by_user_id -> users.id`
- unique logico su `minor_id + user_id + assignment_role_code + valid_from`

## 3.3 Significato dei campi

### `assignment_role_code`

Non sostituisce il ruolo RBAC.
Serve a descrivere la funzione nel contesto del minore.

Esempi:

- `PRIMARY_EDUCATOR`
- `SECONDARY_EDUCATOR`
- `PEDIATRICIAN`
- `PSYCHOLOGIST`
- `LEGAL_GUARDIAN_CONTACT`
- `SOCIAL_WORKER`

Questo valore deve provenire da una anagrafica dedicata, non da testo libero.

### `access_level`

Determina il perimetro dati consentito su quel minore.

Valori consigliati:

- `read_basic`
- `read_sensitive`
- `read_clinical`
- `edit_operational`
- `edit_sensitive`

Anche questo deve essere anagrafico o enum controllato backend.

## 4. Regola autorizzativa target

Per accedere a un minore o a una sua risorsa:

1. l'utente deve avere un `user_facility_role` attivo sulla struttura del minore
2. il ruolo deve avere il permesso richiesto
3. se la risorsa è minor-scoped, deve esistere una `minor_user_assignment` attiva
4. l'`access_level` dell'assegnazione deve coprire l'azione richiesta

## 5. Cosa deve essere minor-scoped

Da rendere progressivamente vincolato da assegnazione:

- dettaglio minore
- profilo minore
- contatti del minore
- documenti del minore
- diario educativo
- attività individuali
- uscite riferite al minore
- allegati clinici e sociali

## 6. Classificazioni documentali

Oggi i documenti classificati `clinical` sono filtrati soprattutto per ruolo.
Questo non basta per il caso d'uso richiesto.

Regola proposta:

- la classificazione documentale resta filtrata per ruolo
- in aggiunta, per classificazioni sensibili (`restricted`, `clinical`, future `legal_sensitive`) si applica anche il vincolo di assegnazione sul minore

Quindi per leggere un documento clinico:

1. `attachments.read` sulla struttura
2. ruolo ammesso per `clinical`
3. assegnazione attiva al minore con `access_level >= read_clinical`

## 7. Visibilità lista minori

La lista minori non deve essere uguale per tutti.

Comportamento consigliato:

- ruoli direzionali (`SUPER_ADMIN`, `DIRETTORE`) vedono tutti i minori della struttura
- ruoli operativi con scope globale vedono tutti i minori se il ruolo lo consente
- ruoli professionali minor-scoped vedono solo i minori assegnati

Questo richiede una proprietà di policy sul ruolo, ad esempio:

- `minor_scope_mode = all_facility`
- `minor_scope_mode = assigned_only`

Questo dato può vivere:

- in tabella `roles` come colonna dedicata
- oppure in configurazione/metadato ruolo

## 8. Flussi principali

### 8.1 Pediatra

1. esiste come utente applicativo
2. ha ruolo assegnato alla struttura
3. riceve assegnazione ai minori A, B, C
4. vede solo A, B, C
5. può vedere documenti clinici solo di A, B, C

### 8.2 Educatore di riferimento

1. ha ruolo `EDUCATORE`
2. può avere permessi operativi generali nella struttura
3. se impostato come `assigned_only`, vede solo i minori assegnati
4. se impostato come `all_facility`, vede tutti i minori della struttura

## 9. API da introdurre

### Nuovo dominio assegnazioni per-minore

- `GET /api/admin/minor-assignments`
- `POST /api/admin/minor-assignments`
- `GET /api/admin/minor-assignments/{id}`
- `PUT /api/admin/minor-assignments/{id}`
- `POST /api/admin/minor-assignments/{id}/revoke`
- `DELETE /api/admin/minor-assignments/{id}` solo se mai usata o soft rule equivalente

Filtri richiesti:

- `facility_id`
- `minor_id`
- `user_id`
- `assignment_role_code`
- `is_active`

### Endpoint di supporto

- `GET /api/admin/minors/{minor}/assigned-users`
- `GET /api/admin/users/{user}/assigned-minors`

## 10. Enforcement backend

Serve un servizio centralizzato, per esempio:

- `MinorAccessService`

Responsabilità:

- verificare se utente può vedere il minore
- verificare se utente può modificare il minore
- verificare se utente può leggere documenti di una certa classificazione
- applicare override per super admin e direttore

Da usare in:

- `MinorController@index`
- `MinorController@show`
- `MinorController@update`
- `MinorController@upsertProfile`
- `MinorController@storeContact`
- `MinorController@updateContact`
- `MinorController@history`
- `MinorController@storeDocument`
- `MinorController@downloadDocument`
- futuri controller diario / attività / uscite

## 11. Allineamento con note UX recenti

Le ultime risposte UX mostrano un possibile fraintendimento:

- `Assegnazioni` oggi non equivale a “educatore assegnato al minore”
- oggi `Assegnazioni` è soprattutto `user ↔ facility ↔ role`

Questa nuova funzione deve essere esplicitamente separata:

- **Assegnazioni struttura** = accesso al software nella struttura
- **Assegnazioni minore** = perimetro operativo su uno o più minori

## 12. Decisione consigliata

Consiglio di implementare:

### Fase A

- nuova tabella `minor_user_assignments`
- CRUD admin assegnazioni per-minore
- filtro lista minori `assigned_only`
- enforcement su `show`, `profile`, `contacts`, `documents`

### Fase B

- integrazione con diario, attività, uscite
- livelli accesso sensibile / clinico
- endpoint aggregati per UX

### Fase C

- eventuale collegamento con `staff_members`
- eventuale supporto team multi-professionali per minore

## 13. Raccomandazione finale

Per il requisito del pediatra che segue solo alcuni minori, la soluzione corretta non è aggiungere solo un nuovo ruolo.

Serve:

1. ruolo di struttura
2. assegnazione nominativa ai minori
3. policy dati sensibili per classificazione documentale

Questa è la soluzione più sicura, estendibile e coerente con il dominio.
