# Richiesta UX 042 · Flusso canonico Educatore ↔ Utente applicativo

Data: 2026-06-28
Stato: READY_FOR_UX_ALIGNMENT

## 1. Obiettivo

Evitare che il team UX continui a trattare:

- `Educatore` come anagrafica professionale
- `Utente con ruolo educatore` come oggetto separato e indipendente

senza regole di collegamento.

## 2. Decisione funzionale

Per le figure educative il flusso canonico è:

1. prima si crea il professionista (`Educatore`)
2. poi, se serve accesso al software, si crea o collega l'utente

## 3. Impatto UX

La UX deve smettere di proporre una creazione utente educatore “cieca”.

Quando l'operatore crea un utente che deve agire come educatore:

1. il sistema deve chiedere se esiste già un educatore non associato
2. se sì, proporre collegamento
3. se no, consentire creazione contestuale dell'entità educatore

## 4. Regola UX tassativa

Non è accettabile che l'interfaccia consenta facilmente questo esito:

- utente con ruolo educatore
- educatore anagrafico separato
- nessun collegamento tra i due

## 5. Flussi da progettare

### A. Creazione educatore senza account

UI richiesta:

- pagina Educatori già esistente
- nessun obbligo di account
- stato chiaro: “nessun account collegato”

### B. Creazione utente educatore con educatore esistente

UI richiesta:

- nel form utente, se il profilo o il ruolo operativo è educatore, mostrare step/alert dedicato
- domanda esplicita:
  - “Vuoi collegare un educatore già censito?”
- lista selezionabile di educatori senza account

### C. Creazione utente educatore senza educatore esistente

UI richiesta:

- opzione “crea anche anagrafica educatore”
- mini-form o wizard contestuale con i campi dominio minimi necessari

## 6. Stati UI obbligatori

Il team UX deve prevedere indicatori visivi chiari:

- educatore senza account
- account collegato
- utente con ruolo educatore ma senza entità educatore collegata
- possibile duplicato rilevato

## 7. Matching duplicati

La UX non deve fare merge automatici.

Può solo mostrare suggerimenti di candidati simili basati su:

- nome
- cognome
- email
- eventuale codice fiscale

Sempre con conferma umana.

## 8. Tabella / badge consigliati

Nella lista educatori aggiungere in modo esplicito:

- colonna `Account`
  - `Non collegato`
  - `Collegato`
- colonna `Accesso software`
  - `No`
  - `Sì`

Nella lista utenti aggiungere:

- colonna `Entità educatore`
  - `Non collegata`
  - `Collegata`

## 9. Comportamento atteso su Timesheet

La UX deve assumere questa regola:

- un educatore senza account non compila timesheet
- il timesheet è disponibile solo se esistono:
  - account utente
  - assegnazione alla struttura
  - collegamento a entità educatore

## 10. Checklist UX team

- [ ] distinguere sempre anagrafica educatore e account utente
- [ ] introdurre flusso di collegamento educatore esistente
- [ ] introdurre opzione di creazione contestuale educatore
- [ ] mostrare stato di collegamento in liste e dettagli
- [ ] non consentire UX ambigua che favorisca record doppi
- [ ] restituire proposta concreta di wizard o modal guidata

## 11. Documento di riferimento

Leggere anche:

- `C:\Projects\FamilyHUB\docs\architecture\2026-06-28-staff-member-user-linking-flow.md`

## 12. Richiesta al team UX

Creare risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-28-042-educator-user-linking-canonical-flow-response.md`
