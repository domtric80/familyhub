# FamilyHub · Flusso canonico Educatore ↔ Utente applicativo

Data: 2026-06-28
Stato: definizione canonica

## 1. Obiettivo

Stabilire quando usare:

- `staff_members` (educatore / professionista)
- `users` (account applicativo)
- `user_facility_roles` (ruolo e permessi)

senza produrre duplicati o disallineamenti.

## 2. Decisione canonica

Per le figure educative e professionali della struttura il flusso corretto è:

1. creare prima il **professionista**
2. collegare o creare dopo l'**utente applicativo**, solo se necessario

Quindi:

- `staff_member` può esistere senza `user`
- `user` per un educatore non dovrebbe nascere “orfano” rispetto a `staff_member`

## 3. Distinzione di dominio

### `staff_member`

Rappresenta la persona nel dominio organizzativo.

Serve per:

- anagrafica professionale
- matricola / codice dipendente
- qualifica
- stato lavorativo
- documenti staff
- timesheet
- turni
- accompagnamenti
- legami operativi futuri con minori

### `user`

Rappresenta l'identità digitale.

Serve per:

- login
- password
- MFA
- ruoli applicativi
- permessi RBAC
- audit
- accesso alle funzioni software

### `user_facility_roles`

Rappresenta il contesto autorizzativo dell'account dentro una struttura.

## 4. Regole pratiche

### Regola A

Un educatore può esistere senza utente.

Conseguenza:

- nessun login
- nessun timesheet
- nessuna operatività digitale personale

### Regola B

Se un utente deve operare come educatore nel software, deve essere collegato a un `staff_member`.

### Regola C

Un `user` non deve essere collegato a più `staff_members`.

### Regola D

Per il ruolo `EDUCATORE`, la creazione account deve prevedere:

- collegamento a educatore esistente non associato
- oppure creazione contestuale del nuovo educatore

## 5. Flussi applicativi target

## 5.1 Crea educatore senza account

Caso:

- persona presente in struttura ma senza accesso software

Flusso:

1. creare `staff_member`
2. `user_id = null`

## 5.2 Crea utente per educatore già esistente

Caso:

- educatore già censito
- ora serve accesso software

Flusso:

1. aprire creazione utente
2. se si assegna profilo/ruolo educatore, chiedere prima se esiste educatore già censito
3. mostrare elenco educatori non collegati
4. collegare `staff_members.user_id`
5. creare assegnazione ruolo in `user_facility_roles`

## 5.3 Crea utente educatore nuovo

Caso:

- la persona non esiste ancora né come staff né come user

Flusso:

1. creare `user`
2. creare contestualmente `staff_member`
3. collegare `staff_member.user_id`
4. creare assegnazione ruolo alla struttura

## 6. Matching e anti-duplicazione

Il matching automatico non deve mai fondere record in autonomia.

Può solo suggerire candidati.

Campi utili per suggerimento:

- nome
- cognome
- email
- codice fiscale, se presente

Il sistema deve sempre chiedere conferma umana.

## 7. Guardrail minimi backend

Da applicare subito:

- `staff_members.user_id` unico tra i record attivi
- impossibile collegare lo stesso account a due `staff_members`

Da applicare nella fase successiva:

- endpoint di suggerimento educatori non collegati
- endpoint di collegamento account ↔ educatore
- creazione utente educatore guidata

## 8. Perché non fondere `staff_member` e `user`

Non conviene fonderli perché:

- esistono professionisti senza accesso software
- i dati dominio e i dati di autenticazione hanno cicli di vita diversi
- i processi organizzativi usano la persona anche senza account
- timesheet, turni e documenti staff hanno semantica professionale, non di login

## 9. Conclusione

La doppia entità non è un errore concettuale in sé.

L'errore nasce solo quando manca un flusso canonico che governi:

- creazione
- collegamento
- prevenzione duplicati

La decisione corretta è quindi:

- mantenere `staff_member` e `user` separati
- imporre il flusso “prima professionista, poi eventualmente account”
