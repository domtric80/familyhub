# Richiesta UX 045 · Correzione assegnazioni minore, rimozione duplicazioni RBAC, flussi bulk

Data: 2026-06-28
Stato: READY_FOR_UX_REALIGNMENT
Priorità: ALTA

## 1. Decisione

La UX attuale della finestra `Nuova assegnazione minore` non è più corretta.

I campi:

- `Ruolo assegnazione`
- `Livello accesso`

devono essere rimossi dalla UX.

Motivo:

- il ruolo utente è già definito a livello struttura
- il livello di accesso ai dati non viene scelto manualmente nell'assegnazione, ma deriva da policy ABAC del sistema

Questa non è una svista grafica: è una correzione di modello applicativo.

## 2. Nuovo significato della schermata

La schermata `Assegnazione minore` deve servire solo a dire:

- quale utente è assegnato
- a quale minore
- in quale struttura
- da quando a quando
- eventuali note

## 3. Nuovo form minimo

Campi ammessi:

- `Struttura`
- `Minore`
- `Utente`
- `Valido dal`
- `Valido al`
- `Assegnazione attiva`
- `Note`

Campi da rimuovere:

- `Ruolo assegnazione`
- `Livello accesso`

## 4. Punto di ingresso dalla scheda minore

Aggiungere una sezione chiara:

- `Accesso al minore`

Contenuti:

- tabella utenti assegnati
- pulsante `Aggiungi utenti`
- revoca assegnazione per singola riga

Nel modal di aggiunta:

- selezione multipla utenti
- una sola validità condivisa
- note opzionali

Obiettivo:

- assegnare più utenti allo stesso minore con un solo passaggio

## 5. Punto di ingresso dalla scheda utente

Nella scheda utente aggiungere tab:

- `Minori assegnati`

Workflow richiesto:

1. selezionare la struttura
2. mostrare tabella minori della struttura
3. aggiungere checkbox per ogni minore
4. supportare selezione multipla
5. pulsante `Salva assegnazioni`

Questo è il flusso principale per figure come:

- pediatra
- psicologo
- consulente esterno

che seguono molti minori della stessa struttura.

## 6. Tabelle UX richieste

### 6.1 Tabella utenti assegnati al minore

Colonne:

- Nome utente
- Email
- Ruolo struttura
- Stato assegnazione
- Valido dal
- Valido al
- Azioni

Nota:

- il ruolo struttura si legge dall'anagrafica utente/assegnazioni struttura
- non si modifica qui

### 6.2 Tabella minori assegnati all'utente

Colonne:

- Checkbox
- Codice minore
- Nome minore
- Struttura
- Stato minore
- Assegnato sì/no

Azioni in alto:

- `Seleziona tutti`
- `Deseleziona tutti`
- `Salva assegnazioni`

## 7. Messaggi da usare

### Assegnazione semplice

- `Utente assegnato al minore con successo.`

### Salvataggio bulk da utente

- `Assegnazioni minori aggiornate con successo.`

### Revoca

- `Assegnazione rimossa con successo.`

## 8. Cosa NON deve fare più il frontend

- non chiedere all'utente di ridefinire il ruolo
- non chiedere all'utente di scegliere il livello dati
- non trattare l'assegnazione minore come un mini-sistema RBAC

## 9. Dipendenze backend attese

Il backend verrà riallineato per supportare:

- payload minimale per assegnazione singola
- sincronizzazione bulk per utente
- sincronizzazione bulk per minore
- esposizione dei ruoli struttura in sola lettura
- enforcement ABAC centrale lato backend

## 10. File di riferimento

- `C:\Projects\FamilyHUB\docs\architecture\2026-06-28-minor-assignment-model-simplification.md`
- `C:\Projects\FamilyHUB\docs\architecture\2026-06-28-minor-scoped-access-control.md`

## 11. Richiesta al team UX

Produrre risposta in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-28-045-minor-assignment-simplification-and-bulk-selection-response.md`
