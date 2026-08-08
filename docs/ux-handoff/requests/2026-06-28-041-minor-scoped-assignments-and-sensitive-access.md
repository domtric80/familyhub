# Richiesta UX 041 · Assegnazioni per-minore e accesso dati sensibili

Data: 2026-06-28
Stato: READY_FOR_UX_ALIGNMENT

## 1. Contesto

Il modello attuale distingue:

- assegnazioni di accesso alla struttura (`user ↔ facility ↔ role`)
- anagrafiche personale (`staff_members`)

Questa richiesta introduce un nuovo livello:

- assegnazione di uno specifico utente a uno specifico minore

Esempio reale:

- un pediatra può operare in una struttura
- ma deve vedere solo alcuni minori della struttura

## 2. Impatto UX

Il team UX deve smettere di usare il termine generico “assegnazioni” come concetto unico.

Da ora in avanti ci sono **due famiglie distinte**:

### A. Assegnazioni struttura

Servono per:

- dare accesso al software
- assegnare ruolo nella struttura
- definire permessi RBAC

### B. Assegnazioni minore

Servono per:

- limitare visibilità e operatività a minori specifici
- limitare documenti sensibili e clinici ai soli operatori assegnati

## 3. Regola UX tassativa

Il team UX non deve rappresentare “assegnazione utente alla struttura” e “assegnazione utente al minore” nella stessa schermata come se fossero lo stesso oggetto.

Devono esistere UI distinte.

## 4. Nuova area funzionale richiesta

### Modulo: `Assegnazioni Minori`

Possibili entrypoint UX accettabili:

- da scheda minore
- da menu amministrativo dedicato
- da pagina utente con tab dedicata “Minori assegnati”

## 5. Schermate richieste

### 5.1 Lista assegnazioni per-minore

Tabella con colonne minime:

- struttura
- minore
- utente assegnato
- ruolo di assegnazione sul minore
- livello accesso
- validità da/a
- stato attivo
- assegnato da
- azioni

Filtri obbligatori:

- struttura
- minore
- utente
- ruolo assegnazione
- stato attivo

Azioni obbligatorie:

- crea
- modifica
- revoca
- dettaglio

### 5.2 Scheda minore — sezione operatori assegnati

Dentro la scheda del minore deve esistere una sezione dedicata:

- elenco utenti assegnati al minore
- ruolo nel contesto del minore
- livello accesso
- periodo validità
- pulsante aggiungi
- pulsante modifica
- pulsante revoca

### 5.3 Scheda utente — sezione minori assegnati

Dentro la scheda utente/admin utente:

- lista minori assegnati
- struttura
- ruolo sul minore
- livello accesso
- stato

## 6. Form creazione / modifica

Campi richiesti:

- struttura
- minore
- utente
- ruolo assegnazione minore
- livello accesso
- valid_from
- valid_to
- attivo
- note

Regole UX:

- nessun testo libero per ruolo assegnazione
- nessun testo libero per livello accesso
- `minore` filtrato per struttura selezionata
- `utente` filtrato per struttura selezionata

## 7. Stati e messaggi

Il team UX deve prevedere stati espliciti:

- nessun minore assegnato
- nessun utente assegnabile
- permesso insufficiente
- utente non autorizzato a vedere il minore
- documento clinico non accessibile per mancanza assegnazione

## 8. Effetto sulla UX delle liste minori

Il team UX deve prepararsi a due modalità di lista:

- utente che vede tutti i minori della struttura
- utente che vede solo i minori assegnati

Questo significa:

- la lista minori non deve assumere che tutti vedano gli stessi record
- badge/filtro “solo assegnati a me” è consigliato

## 9. Effetto sulla UX documenti sensibili

Per documenti con classificazione sensibile/clinica:

- non basta il ruolo
- serve anche assegnazione valida al minore

La UX deve quindi gestire:

- pulsante download non disponibile
- messaggio chiaro: “Accesso negato: minore non assegnato al tuo profilo operativo”

## 10. Correzione concettuale rispetto a risposte UX recenti

Nelle risposte più recenti compare il rischio di confondere:

- `user ↔ facility ↔ role`
- `user ↔ minor`

Il team UX deve correggere il lessico applicativo:

- **Assegnazioni struttura**
- **Assegnazioni minore**

## 11. Checklist UX team

- [ ] separare visivamente e semanticamente i due tipi di assegnazione
- [ ] progettare lista amministrativa assegnazioni minore
- [ ] progettare sezione assegnati nella scheda minore
- [ ] progettare sezione minori assegnati nella scheda utente
- [ ] prevedere stati di accesso negato su minore e documenti clinici
- [ ] non usare testo libero per ruolo assegnazione e livello accesso
- [ ] restituire proposta UI senza reinterpretare il dominio

## 12. File da verificare

Il team UX deve leggere anche:

- `C:\Projects\FamilyHUB\docs\architecture\2026-06-28-minor-scoped-access-control.md`
- `C:\Projects\FamilyHUB\docs\dev-notes\2026-06-28-architettura-staffmember-vs-adminuser.md`

## 13. Richiesta al team UX

Creare risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-28-041-minor-scoped-assignments-and-sensitive-access-response.md`

La risposta deve dichiarare in modo esplicito:

1. come separeranno “assegnazione struttura” e “assegnazione minore”
2. dove comparirà la gestione assegnazioni minore
3. come segnaleranno il blocco accesso ai documenti clinici
4. come mostreranno la lista minori per utenti `assigned_only`
