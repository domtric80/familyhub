# Guida operativa - Sezione Documenti

Data: 2026-06-30
Ambito: operatori / coordinamento / amministrazione / controllo accessi documentali

## 1. Scopo della sezione

La sezione `Documenti` serve a gestire la documentazione applicativa, con particolare attenzione ai documenti collegati ai minori e ai documenti del personale.

Questa sezione deve permettere di:

- caricare e classificare documenti
- consultare preview e contenuti consentiti
- scaricare i file quando autorizzati
- mantenere tracciabilita' completa degli accessi
- applicare controlli di sicurezza piu' rigorosi rispetto alla semplice visibilita' delle anagrafiche

---

## 2. Regola fondamentale: RBAC e ABAC non sono la stessa cosa

Nella sezione `Documenti` non basta il solo ruolo.

L'accesso documentale e' governato da due livelli distinti:

### 2.1 RBAC

Il ruolo dell'utente determina quali funzioni documentali puo' usare in generale.

Esempi:
- vedere elenchi
- aprire dettaglio documento
- caricare o modificare metadata
- scaricare file

### 2.2 ABAC

Per i documenti sensibili, l'accesso effettivo dipende anche da attributi del documento.

Esempi di attributi:
- tag documentali
- classificazione
- scope applicativo
- natura clinica o amministrativa
- contesto del soggetto associato

Quindi un utente puo':
- vedere il minore
- ma non poter leggere tutti i documenti del minore

Questa distinzione deve essere spiegata sempre in UI.

---

## 3. Documenti del minore

Per i documenti collegati a un minore valgono in generale:

1. regole RBAC del modulo documentale
2. regole di assegnazione / perimetro del minore, quando applicabili
3. regole ABAC sui tag e sulle classificazioni del documento

Conseguenza pratica:
- la scheda del minore non garantisce automaticamente pieno accesso documentale

---

## 4. Documenti del personale / staff

Anche i documenti dello staff devono seguire regole di autorizzazione e audit.

Le operazioni sensibili da tracciare includono almeno:
- preview / lettura
- download
- upload
- modifica metadata

---

## 5. Audit obbligatorio nella sezione Documenti

Ogni accesso documentale sensibile deve essere tracciato.

Eventi minimi attesi:
- preview / read documento
- download documento
- upload documento
- modifica permessi o metadata documento

L'audit documentale deve permettere di rispondere a domande come:
- chi ha letto il documento
- quando lo ha letto
- da quale IP
- se lo ha solo visualizzato o anche scaricato

---

## 6. Regole UX importanti

La UI della sezione `Documenti` deve aiutare l'utente a capire che:

- vedere un'entita' non implica vedere tutti i suoi documenti
- documenti diversi possono avere livelli di sensibilita' diversi
- preview e download non sono operazioni equivalenti
- ogni accesso e' tracciato in audit

---

## 7. Errori e blocchi da interpretare correttamente

Se un documento non e' accessibile, il motivo puo' essere:
- permesso RBAC mancante
- tag / classificazione non compatibili con il profilo dell'utente
- perimetro del minore non soddisfatto
- vincolo documentale specifico del backend

La UI deve evitare messaggi vaghi del tipo:
- "errore generico"
- "file non disponibile"

Meglio usare messaggi che spiegano che l'accesso puo' essere limitato dalle regole di sicurezza documentale.

---

## 8. Contenuti minimi del tasto Informazioni

Il pannello `Informazioni` della sezione `Documenti` deve spiegare:

1. a cosa serve la sezione
2. differenza tra accesso anagrafico e accesso documentale
3. che cosa significa controllo ABAC
4. perche' alcuni documenti sono visibili e altri no
5. differenza tra preview e download
6. che ogni accesso e' auditato

---

## 9. Nota per QA e supporto

Se un utente apre correttamente la scheda del minore ma non vede o non scarica un documento, non e' automaticamente un bug.

Va verificato:
- perimetro RBAC
- eventuale assegnazione al minore
- tag e classificazione del documento
- regole ABAC effettive applicate dal backend
- presenza dell'evento in audit
