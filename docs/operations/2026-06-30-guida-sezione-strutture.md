# Guida operativa - Sezione Strutture

Data: 2026-06-30
Ambito: amministrazione / organizzazione / presidio territoriale

## 1. Scopo della sezione

La sezione `Strutture` serve a gestire le sedi operative o strutture che ospitano i minori e in cui lavorano gli operatori.

Questa sezione definisce il contesto organizzativo di molte altre funzioni:

- minori
- utenti e ruoli
- educatori e staff
- assegnazioni operative
- audit e perimetro accessi

---

## 2. Ruolo della struttura nel sistema

La struttura non e' solo un dato anagrafico.

E' un perimetro logico di lavoro che influisce su:
- ruolo attivo dell'utente
- visibilita' dei minori
- assegnazioni operative
- reporting e audit

Conseguenza pratica:
- molte autorizzazioni vanno sempre lette nel contesto della struttura

---

## 3. Dati tipici della struttura

La sezione puo' contenere dati come:
- organizzazione di appartenenza
- codice struttura
- nome struttura
- indirizzo
- localizzazione geografica
- stato operativo
- eventuali parametri di capacita' o contesto

Questi dati devono restare coerenti con il modello geografico canonico dell'applicativo.

---

## 4. Collegamenti con altre sezioni

La sezione `Strutture` e' collegata direttamente a:

- `Utenti` -> ruolo attivo per struttura
- `Minori` -> struttura di presa in carico
- `Educatori` -> appartenenza organizzativa
- `Assegnazioni Minori` -> perimetro operativo
- `Audit Log` -> contesto degli eventi

---

## 5. Regole UX importanti

La UI della sezione `Strutture` deve far capire che:

- modificare una struttura non e' un atto neutro
- la struttura e' un nodo centrale del modello autorizzativo e organizzativo
- i riferimenti geografici devono essere scelti da anagrafiche canoniche, non scritti liberamente

---

## 6. Contenuti minimi del tasto Informazioni

La guida contestuale deve spiegare:

1. a cosa serve la sezione
2. perche' la struttura e' un perimetro logico del sistema
3. quali dati organizzativi e geografici definisce
4. quali moduli dipendono dalla struttura
5. perche' i riferimenti geografici devono essere canonici

---

## 7. Nota per QA e supporto

Se si osservano comportamenti incoerenti su ruoli, minori o assegnazioni, la struttura associata va sempre verificata tra i primi elementi.
