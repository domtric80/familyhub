# Checklist QA — RBAC, accesso minori e moduli operativi

Data: 2026-06-29  
Ambito: collaudo operativo backend/frontend  
Obiettivo: verificare coerenza tra permessi RBAC, assegnazioni al minore, ABAC documentale e UI

> Nota importante  
> Non usare `admin@familyhub.local` per validare i limiti di accesso: è associato a `SUPER_ADMIN`.
> Per i test restrittivi usare utenti operativi reali, ad esempio `EDUCATORE`, `PSICOLOGO`,
> `ASSISTENTE_SOCIALE_EST`.

---

## 1. Login e MFA

- [x] Login riuscito con utente operativo
- [x] Logout e login successivo senza perdita credenziali
- [x] MFA: se attiva, richiesta corretta del codice OTP
- [x] MFA: accesso completato correttamente dopo OTP
- [x] Verifica che l’utente test non sia `SUPER_ADMIN`


---

## 2. Assegnazioni minore

### 2.1 Vista globale

- [ ] Aprire `Amministrazione > Assegnazioni Minori`
- [ ] Creare una nuova assegnazione utente → minore
- [ ] Verificare che la riga compaia in tabella con stato `Attiva`

### 2.2 Vista dalla scheda minore

- [ ] Aprire la scheda del minore assegnato
- [ ] Aprire tab `Accesso al minore`
- [ ] Verificare che compaia lo stesso utente presente nella vista globale

### 2.3 Vista dalla scheda utente

- [ ] Aprire `Amministrazione > Utenti`
- [ ] Aprire la modale `Minori assegnati`
- [ ] Verificare che compaia lo stesso minore

### 2.4 Revoca / sincronizzazione

- [ ] Revocare o deselezionare l’assegnazione
- [ ] Verificare che la modifica si rifletta in:
  - [ ] `Assegnazioni Minori`
  - [ ] `Minore > Accesso al minore`
  - [ ] `Utente > Minori assegnati`

---

## 3. Scheda minore completa

### 3.1 Utente assegnato con permesso sensibile

- [ ] Usare utente assegnato al minore
- [ ] Assicurarsi che abbia `minor_profiles.read`
- [ ] Aprire `GET UI scheda minore`
- [ ] Verificare accesso completo a:
  - [ ] anagrafica
  - [ ] profilo
  - [ ] contatti
  - [ ] documenti visibili
  - [ ] storico

### 3.2 Utente assegnato senza `minor_profiles.read`

- [ ] Usare utente assegnato al minore ma senza `minor_profiles.read`
- [ ] Tentare apertura scheda completa
- [ ] Atteso: `403`
- [ ] Atteso: messaggio esplicativo su assegnazione e permesso sensibile

### 3.3 Utente non assegnato

- [ ] Usare utente senza assegnazione attiva al minore
- [ ] Tentare apertura scheda
- [ ] Atteso: `403`

---

## 4. Contatti minore

### 4.1 Creazione

- [ ] Utente assegnato con `minor_contacts.create`
- [ ] Creare un contatto
- [ ] Verificare salvataggio corretto

### 4.2 Modifica

- [ ] Utente assegnato con `minor_contacts.update`
- [ ] Modificare un contatto esistente
- [ ] Verificare persistenza della modifica

### 4.3 Restrizione accesso

- [ ] Utente non assegnato tenta creare/modificare contatto
- [ ] Atteso: `403`

---

## 5. Documenti minore

### 5.1 Upload

- [ ] Utente assegnato con `attachments.upload`
- [ ] Caricare un documento
- [ ] Verificare stato sicurezza iniziale corretto

### 5.2 Preview / download

- [ ] Utente assegnato con `attachments.read`
- [ ] Aprire preview documento
- [ ] Scaricare documento

### 5.3 ABAC documentale

- [ ] Tentare accesso a documento `clinical` con utente senza abilitazione ABAC/classificazione
- [ ] Atteso: `403`

### 5.4 Audit e storico

- [ ] Verificare presenza evento preview nello storico minore
- [ ] Verificare presenza evento download nello storico minore
- [ ] Verificare presenza eventi in `Audit Log`

---

## 6. Modulo Uscite

### 6.1 Utente assegnato

- [ ] Utente assegnato con `minor_exits.create`
- [ ] Creare una nuova uscita
- [ ] Verificare `201` / salvataggio UI corretto

### 6.2 Utente non assegnato

- [ ] Utente con permesso `minor_exits.create` ma senza assegnazione minore
- [ ] Tentare creazione uscita
- [ ] Atteso: `403`
- [ ] Atteso: messaggio che cita permessi di ruolo + assegnazione attiva

### 6.3 Ciclo completo

- [ ] Modificare uscita esistente (`minor_exits.update`)
- [ ] Segnare uscita come `Fuori struttura`
- [ ] Segnare rientro
- [ ] Annullare un’uscita pianificata
- [ ] Eliminare uscita (`minor_exits.delete`)

---

## 7. Modulo Attività

### 7.1 Utente assegnato

- [ ] Utente assegnato con `minor_activities.create`
- [ ] Creare una nuova attività
- [ ] Verificare salvataggio corretto

### 7.2 Utente non assegnato

- [ ] Utente con `minor_activities.create` ma senza assegnazione al minore
- [ ] Tentare creazione attività
- [ ] Atteso: `403`
- [ ] Atteso: messaggio che cita permessi di ruolo + assegnazione attiva

### 7.3 Ciclo completo

- [ ] Modificare attività (`minor_activities.update`)
- [ ] Eliminare attività (`minor_activities.delete`)

---

## 8. Audit e storico

- [ ] Aprire `Audit Log`
- [ ] Verificare eventi per:
  - [ ] accesso scheda minore
  - [ ] storico minore
  - [ ] preview documento
  - [ ] download documento
  - [ ] modifica permessi/assegnazioni se effettuate

- [ ] Verificare che lo storico minore mostri:
  - [ ] data/ora
  - [ ] utente
  - [ ] `operation_summary` leggibile

---

## 9. Coerenza finale dati

- [ ] Refresh pagina dopo operazioni principali
- [ ] Verificare che non siano spariti:
  - [ ] utenti
  - [ ] minori
  - [ ] strutture
  - [ ] assegnazioni

- [ ] Verificare che i dati restino coerenti tra:
  - [ ] lista minori
  - [ ] scheda minore
  - [ ] assegnazioni minore
  - [ ] vista utenti

---

## 10. Esito collaudo

- [ ] Tutti i casi bloccanti superati
- [ ] Bug riscontrati annotati con:
  - [ ] ruolo utente
  - [ ] minore coinvolto
  - [ ] permesso atteso
  - [ ] comportamento osservato
  - [ ] screenshot / endpoint se disponibile

