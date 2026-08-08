# Handoff UX/API - Allineamento accesso clinico ruolo PEDIATRA

Data: 2026-07-05  
Area: `Ruoli`, `Documenti`, `Minori`  
Priorità: alta  
Tipo: riallineamento semantico backend/UI

## 1. Problema corretto

Il ruolo `PEDIATRA` era presente operativamente, ma non risultava ammesso dalla classificazione documentale `clinical`.

Effetto lato utente:

- il pediatra poteva esistere come ruolo assegnato
- poteva avere accesso a schede/minori secondo assegnazione
- ma non vedeva i documenti clinici attesi

Questo non era un problema grafico: era un disallineamento di policy backend.

## 2. Nuova regola backend

Da ora il ruolo `PEDIATRA`:

- è considerato ruolo di sistema
- possiede `attachments.read`
- è ammesso dalla classificazione documento `clinical`
- continua a richiedere assegnazione attiva al minore per l'accesso effettivo ai documenti del minore

## 3. Cosa NON cambia

Il ruolo `PEDIATRA` non deve essere rappresentato in UI come ruolo con accesso totale.

Non ha automaticamente accesso a:

- `Avvicinamenti familiari`
- `Diario educativo`
- classificazioni documentali non consentite

Quindi la UI non deve comunicare "accesso clinico totale", ma:

- `accesso ai documenti clinici dei minori assegnati`

## 4. Comportamento da mostrare in UI

### In pagina `Ruoli`

Per `PEDIATRA` mostrare chiaramente:

- permesso documentale base: sì
- accesso documentale clinico: sì
- condizione: solo su minori assegnati

### In pagina/matrice `Accesso documentale`

La riga `PEDIATRA` deve mostrare per `clinical`:

- `allowed_by_classification = true`
- `effective_read_access = true`
- `effective_read_rule = allowed_if_minor_assignment_active`

## 5. Test funzionale atteso per UX/QA

Scenario minimo:

1. utente con ruolo `PEDIATRA`
2. assegnazione attiva al minore
3. documento classificato `clinical`

Risultato atteso:

- il documento clinico è visibile/apribile

Scenario negativo:

1. stesso ruolo `PEDIATRA`
2. nessuna assegnazione attiva al minore

Risultato atteso:

- documento non accessibile

## 6. Nota importante per la copia informativa

Nelle guide/info-box del sito usare questa formula:

`Il ruolo Pediatra può consultare i documenti clinici solo per i minori a cui è assegnato attivamente.`
