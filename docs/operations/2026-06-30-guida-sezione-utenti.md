# Guida operativa - Sezione Utenti

Data: 2026-06-30
Ambito: amministrazione / governance accessi / identita' digitali

## 1. Scopo della sezione

La sezione `Utenti` serve a gestire le identita' digitali che accedono al software.

Questa sezione governa:

- creazione e modifica account applicativi
- stato attivo / disattivo dell'utente
- MFA e sicurezza di accesso
- assegnazione del ruolo operativo per struttura
- collegamento eventuale con figure professionali o personale

Questa sezione non serve a descrivere il personale in senso anagrafico completo: serve a gestire l'accesso al sistema.

---

## 2. Distinzione fondamentale: utente, ruolo, struttura

Nella sezione `Utenti` bisogna distinguere sempre tre piani:

### 2.1 Utente

E' l'identita' digitale che effettua login.

### 2.2 Ruolo

Definisce quali permessi RBAC l'utente possiede.

### 2.3 Struttura

Il ruolo e' assegnato nel contesto di una struttura.

Conseguenza pratica:
- non esiste un ruolo "globale" generico senza contesto operativo
- i permessi vanno letti sempre nel rapporto utente + struttura + ruolo attivo

---

## 3. Regola importante: un solo ruolo attivo per struttura

Per ogni coppia:
- utente
- struttura

puo' esistere un solo ruolo attivo alla volta.

Questa regola e' importante per evitare:
- permessi ambigui
- comportamento incoerente tra frontend e backend
- duplicazioni difficili da interpretare

Conseguenza UX:
- il cambio ruolo deve essere letto come sostituzione del ruolo attivo nella struttura, non come aggiunta di un secondo ruolo attivo parallelo

---

## 4. Cosa fa questa sezione

La sezione `Utenti` deve permettere di:

- creare un nuovo account
- modificare dati base dell'account
- attivare/disattivare l'utente
- richiedere o reimpostare MFA
- assegnare o cambiare il ruolo nella struttura
- consultare assegnazioni strutturali e ruolo attivo

---

## 5. Cosa non deve fare questa sezione

La sezione `Utenti` non deve essere confusa con:

- anagrafica staff completa
- timesheet
- assegnazioni ai minori
- matrice documentale ABAC

Queste sono superfici collegate ma distinte.

---

## 6. MFA e sicurezza

La sezione `Utenti` incide direttamente sulla sicurezza del sistema.

Operazioni sensibili:
- forzare MFA richiesta
- reimpostare MFA utente
- disattivare un account
- cambiare ruolo operativo

Queste operazioni devono essere tracciate in audit.

---

## 7. Collegamento con staff o professionisti

Quando l'utente rappresenta una figura professionale reale, puo' esistere un collegamento con la relativa entita' anagrafica.

Principio corretto:
- prima esiste la figura professionale / staff member
- poi, se serve accesso al software, si crea o collega l'utente

La presenza di un utente non sostituisce automaticamente l'anagrafica professionale.

---

## 8. Regole UX importanti

La UI della sezione `Utenti` deve far capire che:

- un utente e' un account di accesso
- il ruolo attivo e' legato alla struttura
- non si possono avere due ruoli attivi contemporanei nella stessa struttura
- il cambio ruolo sostituisce il precedente attivo
- MFA e stato utente sono controlli di sicurezza, non semplici preferenze

---

## 9. Contenuti minimi del tasto Informazioni

La guida contestuale deve spiegare:

1. a cosa serve la sezione
2. differenza tra utente, ruolo e struttura
3. regola del ruolo unico attivo per struttura
4. effetto di MFA, reset MFA e disattivazione account
5. differenza tra account applicativo e anagrafica professionale

---

## 10. Nota per QA e supporto

Se un utente mostra permessi incoerenti, va verificato:
- ruolo attivo nella struttura
- eventuali record storici o revocati
- refresh del profilo `/auth/me`
- stato MFA e stato attivo dell'account
