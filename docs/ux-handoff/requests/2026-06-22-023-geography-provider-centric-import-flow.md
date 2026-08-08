# Richiesta UX 023 · Geografia provider-centric con import dati integrato

Data: 2026-06-22

## Stato

OPEN

## Priorità

ALTA

## Motivo

L’attuale UX geografia è concettualmente errata e genera confusione operativa.

Oggi l’interfaccia espone separatamente:

- `Sinc. geografia`
- `Scarico geografia`
- `Provider geografia`
- `Import geografia`

Questa separazione non è coerente con il flusso reale richiesto dal progetto.

## Principio corretto

Per l’utente amministrativo il flusso deve essere:

1. configurare / consultare il `Provider geografia`
2. usare quel provider per `Importare dati`

Quindi:

- `Provider geografia` è il punto centrale
- `Import dati` è una funzione interna del provider
- non devono esistere due voci di menu separate chiamate `Scarico geografia` e `Import geografia`

## Obiettivo UX

Far capire in modo immediato:

- da quale fonte arrivano i dati geografici
- per quali nazioni quella fonte è valida
- quale livello di granularità supporta
  - solo nazione
  - nazione + regioni
  - nazione + regioni + province
  - nazione + regioni + province + città
- come si avvia il popolamento del database

## Razionale di business

La geografia non è un dato decorativo.
È un dato identificativo ad alta criticità.

Se un operatore scrive male una città estera o italiana:

- si crea disallineamento con documenti del minore
- si propagano errori burocratici
- si riduce l’affidabilità del dato anagrafico

La UX deve quindi incentivare sempre:

- selezione da anagrafica certa
- import da provider ufficiale o controllato
- minimizzazione dell’input manuale libero

## Decisione di menu

### Menu da mantenere

- `Anagrafiche > Geografia`
- `Anagrafiche > Provider geografia`
- `Anagrafiche > Sincronizzazione geografia` solo come console tecnica / avanzata

### Menu da rimuovere

- `Anagrafiche > Scarico geografia`
- `Anagrafiche > Import geografia`

### Sostituzione

L’azione di import deve vivere dentro:

- pagina `Provider geografia`
- oppure dettaglio provider
- oppure tab dedicata del provider

Non come pagina separata di primo livello nel menu.

## Nuovo modello pagina: `Provider geografia`

La pagina deve diventare il centro operativo unico.

### Tab obbligatorie

1. `Provider`
2. `Associazioni nazioni`
3. `Import dati`

## Tab 1 · `Provider`

Tabella provider con colonne:

- `Codice`
- `Nome`
- `Tipo`
- `Driver`
- `Modalità sorgente`
- `Formato`
- `URL / Path`
- `Priorità`
- `Attivo`
- `Copertura`
- `Livelli supportati`
- `Azioni`

### Azioni tabella

- `Modifica provider`
- `Apri import`
- `Apri associazioni`

### Form provider corretto

L’attuale form mostrato in UI è insufficiente perché espone solo dati “anagrafici” del provider e non i dati davvero operativi.

Il form deve esporre esplicitamente:

- `Codice`
- `Nome`
- `Tipo`
- `Driver`
- `Modalità sorgente`
  - `local_file`
  - `remote_file`
  - `api`
- `Formato`
  - `csv`
  - `zip`
  - `json`
  - `xml`
- `Path locale`
- `URL sorgente`
- `Tipo autenticazione`
- `Configurazione autenticazione`
- `Priorità`
- `Attivo`
- `Note`

## Regola UX fondamentale sul form provider

Non mostrare `Config JSON` generico come unico punto di configurazione della sorgente.

La sorgente deve essere comprensibile da operatore umano tramite campi espliciti:

- `Path locale`
- `URL sorgente`
- `Formato`
- `Modalità`

JSON tecnico solo come configurazione avanzata di autenticazione o parametri speciali.

## Tab 2 · `Associazioni nazioni`

Serve a rispondere alla domanda:

`Per una data nazione, quale provider useremo?`

### Componenti obbligatori

- select `Continente`
- select `Nazione`
- tabella `Provider associati`
- azione `Associa provider`

### Tabella associazioni

Colonne:

- `Provider`
- `Tipo`
- `Default`
- `Priorità`
- `Attivo`
- `Livelli supportati`
- `Azioni`

Azioni:

- `Imposta default`
- `Modifica`
- `Rimuovi`

## Tab 3 · `Import dati`

Questa tab sostituisce operativamente le attuali pagine separate `Scarico geografia` e `Import geografia`.

### Flusso obbligatorio

1. selezione `Continente`
2. selezione `Nazione`
3. visualizzazione del `Provider risolto`
4. visualizzazione dei `Livelli supportati`
5. azione `Importa dati nel database`

### Informazioni obbligatorie prima del click

- `Provider usato`
- `Driver`
- `Origine dati`
  - URL oppure path
- `Livelli importabili`
- `Ultimo import`
- `Stato provider`

### Risultato obbligatorio dopo l’import

- `Provider usato`
- `Nazione importata`
- `Nazioni importate`
- `Regioni importate`
- `Province importate`
- `Città importate`
- `Warning backend`
- `Errore backend`, se presente

## Comportamento per provider specifici

### Caso `ISTAT`

Se la nazione selezionata è `IT`:

- mostrare provider risolto `ISTAT`
- mostrare granularità completa:
  - `Nazione`
  - `Regioni`
  - `Province`
  - `Città`

### Caso `GEONAMES`

Se la nazione usa provider generico `GEONAMES`:

- mostrare chiaramente che oggi supporta solo:
  - `Nazione`
- mostrare come non disponibili:
  - `Regioni`
  - `Province`
  - `Città`

La UI non deve mai far credere che un provider generico stia popolando città o province se il backend non lo supporta.

## Console tecnica separata

La `Sincronizzazione geografia` può restare, ma solo come console tecnica / amministrativa avanzata.

Non deve essere il punto principale per l’operatore che vuole popolare anagrafiche geografiche.

### Posizionamento semantico consigliato

- mantenerla sotto geografia
- etichettarla come:
  - `Sincronizzazione geografia (tecnica)`

## Endpoint backend rilevanti

### Provider

- `GET /api/admin/geography-providers`
- `POST /api/admin/geography-providers`
- `PUT /api/admin/geography-providers/{provider}`
- `DELETE /api/admin/geography-providers/{provider}`

### Mapping provider ↔ nazione

- `GET /api/admin/countries/{country}/geography-providers`
- `POST /api/admin/countries/{country}/geography-providers`
- `PUT /api/admin/countries/{country}/geography-providers/{provider}`
- `DELETE /api/admin/countries/{country}/geography-providers/{provider}`

### Import operativo

- `POST /api/admin/geography-imports`

## Cosa il team UX deve correggere subito

- [ ] rimuovere la voce menu `Scarico geografia`
- [ ] rimuovere la voce menu `Import geografia`
- [ ] mantenere `Provider geografia` come unico punto funzionale di import
- [ ] trasformare la pagina provider in hub operativo
- [ ] esporre campi reali di sorgente provider
- [ ] mostrare chiaramente i livelli supportati per provider
- [ ] separare console tecnica sync dal normale flusso di popolamento

## Nota finale

Questa richiesta supera sul piano UX il vecchio impianto documentato nelle richieste:

- `020`
- `021`
- `022`

Per la parte geografia operativa, il riferimento attivo da ora è questa richiesta `023`.
