# Guida operativa - Sezione Audit Log

Data: 2026-06-30
Ambito: amministrazione / sicurezza / controllo / conformita'

## 1. Scopo della sezione

La sezione `Audit Log` serve a consultare la traccia delle operazioni rilevanti eseguite nel sistema.

Questa sezione e' fondamentale per:

- sicurezza applicativa
- accountability degli operatori
- ricostruzione eventi
- verifiche interne
- controlli su accessi a dati sensibili e documenti

---

## 2. Che cosa deve tracciare l'audit

L'audit deve registrare almeno:

- autenticazioni riuscite e fallite
- logout
- cambi ruolo e permessi
- creazione, modifica e revoca assegnazioni
- accessi ai dati dei minori
- preview e download documenti
- modifiche a dati sensibili o anagrafiche chiave

---

## 3. Formato logico minimo

Ogni evento deve poter essere letto almeno con queste informazioni:

- data e ora
- indirizzo IP
- utente
- operazione
- oggetto coinvolto
- eventuale struttura
- eventuali valori prima/dopo, dove rilevante

Esempi:
- admin ha modificato i permessi del ruolo X
- utente Y ha letto il documento Z del minore K
- utente Y ha scaricato il documento Z

---

## 4. Audit generale vs storico del minore

Occorre distinguere:

### 4.1 Audit generale

Vista amministrativa trasversale di tutto il sistema.

### 4.2 Storico del minore

Vista focalizzata sugli eventi che riguardano un singolo minore.

Il secondo non sostituisce il primo: e' una vista specializzata sul medesimo principio di tracciabilita'.

---

## 5. Regole UX importanti

La UI dell'audit deve aiutare l'utente a:

- capire subito cosa e' successo
- distinguere lettura, modifica, download, revoca, login fallito
- filtrare per utente, struttura, tipo evento, risorsa, periodo
- vedere il dettaglio di un evento senza perdersi nei payload grezzi

---

## 6. Valore della sezione

`Audit Log` non e' una pagina tecnica per sviluppatori soltanto.

E' una sezione operativa per:
- amministratori
- responsabili di struttura
- sicurezza
- supporto applicativo

Per questo il linguaggio deve restare leggibile e descrittivo.

---

## 7. Export e analisi

L'audit deve poter supportare anche:
- export CSV
- analisi mirata su intervalli temporali
- preset rapidi per eventi di sicurezza

Esempi di preset:
- login falliti
- accessi documentali
- modifiche permessi
- accessi ai minori

---

## 8. Contenuti minimi del tasto Informazioni

La guida contestuale deve spiegare:

1. a cosa serve l'audit
2. differenza tra audit generale e storico del minore
3. quali eventi vengono tracciati
4. come leggere i filtri e i preset
5. perche' preview e download documenti sono distinti

---

## 9. Nota per QA e supporto

Se un comportamento utente e' dubbio, l'audit deve essere uno dei primi punti da controllare.

Se un evento manca del tutto, il problema non e' UX ma di copertura backend dell'audit.
