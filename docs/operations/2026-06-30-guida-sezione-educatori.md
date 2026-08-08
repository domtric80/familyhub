# Guida operativa - Sezione Educatori

Data: 2026-06-30
Ambito: organizzazione / personale / operativita' educativa

## 1. Scopo della sezione

La sezione `Educatori` serve a gestire l'anagrafica professionale delle figure educative che operano nella struttura.

Questa sezione descrive la persona come risorsa organizzativa, non soltanto come account di accesso.

---

## 2. Distinzione fondamentale: educatore anagrafico vs utente applicativo

Un `Educatore` non coincide automaticamente con un `Utente`.

### 2.1 Educatore anagrafico

Rappresenta la figura professionale o il membro del personale nella struttura.

### 2.2 Utente applicativo

Rappresenta l'identita' digitale che accede al software.

Principio corretto:
- prima si crea o si censisce l'educatore come entita' professionale
- poi, se necessario, si collega o crea l'utente applicativo

---

## 3. Quando serve il collegamento utente

Il collegamento con un account applicativo serve quando l'educatore deve:
- accedere al software
- vedere minori assegnati
- operare su attivita', uscite o documenti secondo i permessi previsti
- usare funzionalita' collegate a turni o timesheet, quando disponibili

Un educatore senza utente resta una risorsa organizzativa valida ma non puo' fare login.

---

## 4. Relazione con ruoli e permessi

La sezione `Educatori` non assegna direttamente i permessi applicativi.

I permessi derivano da:
- account utente
- ruolo assegnato
- struttura di riferimento
- eventuale assegnazione puntuale ai minori

Questa distinzione deve essere sempre chiara in UI.

---

## 5. Regole UX importanti

La UI della sezione `Educatori` deve far capire che:

- l'anagrafica educatore e l'account utente sono collegabili ma distinti
- creare un educatore non significa creare automaticamente un login
- assegnare un ruolo a un utente non sostituisce l'anagrafica educatore

---

## 6. Contenuti minimi del tasto Informazioni

La guida contestuale deve spiegare:

1. a cosa serve la sezione
2. differenza tra educatore anagrafico e utente applicativo
3. quando serve collegare un account
4. rapporto con ruoli, struttura e minori
5. perche' questa sezione non sostituisce `Utenti`

---

## 7. Nota per QA e supporto

Se un educatore esiste anagraficamente ma non accede al software, va verificato:
- se esiste l'account utente
- se il collegamento e' presente
- se il ruolo e' assegnato correttamente nella struttura
