# Handoff UX — Box Informazioni sezione Avvicinamenti

Data: 2026-07-02  
Area: `Minori > Avvicinamenti familiari`  
Priorità: alta  
Tipo richiesta: guida contestuale + contenuti informativi obbligatori

## 1. Obiettivo

La sezione `Avvicinamenti familiari` deve avere box informativi chiari e leggibili, per ridurre errori operativi e aiutare l’utente a capire:

1. cosa può fare nella pagina
2. quali dati sta compilando
3. come leggere autorizzazioni, reazioni e sospensioni
4. perché alcune azioni o campi possono non essere visibili

Questi contenuti non sono facoltativi.

## 2. Pattern UX richiesto

La pagina deve prevedere:

- bottone o icona `Informazioni`
- apertura `InfoDrawer` o pannello laterale coerente col pattern già usato nel progetto
- box sintetici anche inline nei punti critici del form

## 3. Drawer principale

Il drawer principale deve contenere questi blocchi:

### A cosa serve questa sezione

> Questa sezione gestisce gli avvicinamenti familiari del minore: incontri in struttura, telefonate, videochiamate, uscite autorizzate e altri passaggi di riavvicinamento. Ogni record aiuta a tracciare obiettivi, autorizzazioni, osservazioni e sviluppi del percorso.

### Quali dati vengono gestiti

- minore coinvolto
- tipologia di avvicinamento
- contatto/familiare o figura di riferimento
- supervisore
- date pianificate ed effettive
- provvedimento autorizzativo
- osservazioni sulla reazione del minore
- esito, prossimi passi, eventuale sospensione

### Perché potresti non vedere alcune azioni

> Alcune funzioni dipendono dal tuo ruolo, dalla struttura in cui operi e dall’eventuale assegnazione al minore. Le note riservate non sono visibili a tutti e alcune modifiche possono essere limitate a figure di coordinamento o cliniche.

### Come leggere gli stati

- `Pianificato`: l’avvicinamento è stato programmato ma non ancora eseguito
- `In corso`: l’attività è in svolgimento o aperta
- `Completato`: l’avvicinamento si è concluso
- `Sospeso`: il percorso è stato fermato con motivazione
- `Annullato`: l’evento non si svolgerà

### Come leggere il provvedimento autorizzativo

- `Attivo`: il provvedimento è valido
- `Rinnovo in scadenza`: la validità si avvicina alla soglia di alert
- `Scaduto`: il provvedimento non è più valido

Testo guida:

> Lo stato del provvedimento è calcolato automaticamente dal backend in base alla scadenza e ai giorni di preavviso configurati.

### Come compilare la reazione del minore

> Le osservazioni sono divise in tre fasi: prima, durante e dopo l’avvicinamento. Per ogni fase si seleziona un livello sintetico e, quando necessario, si aggiunge una nota di contesto.

Valori da mostrare:

- molto negativa
- negativa
- neutra
- positiva
- molto positiva

### Note riservate

> Alcune note sono riservate a figure specifiche, come psicologo o coordinamento. Se non sei autorizzato, il sistema può nascondere il contenuto o non mostrare il campo di compilazione.

### Perché questa sezione è importante

> La sezione aiuta la struttura a documentare il percorso di riavvicinamento in modo coerente, verificabile e condivisibile tra le figure autorizzate. È utile sia per il lavoro educativo quotidiano sia per il monitoraggio del caso nel tempo.

## 4. Box inline obbligatori nel form

### Provvedimento autorizzativo

Posizione:

- sopra i campi provvedimento

Testo:

> Inserisci gli estremi del provvedimento che autorizza questo avvicinamento. La scadenza viene usata per mostrare alert di rinnovo.

### Osservazione della reazione

Posizione:

- sopra i campi delle tre fasi

Testo:

> Compila queste informazioni per descrivere l’andamento dell’incontro e il vissuto del minore nelle diverse fasi.

### Contenuto riservato

Posizione:

- sopra i campi riservati

Testo:

> Questa area può essere visibile solo ad alcuni profili autorizzati.

### Sospensione del percorso

Posizione:

- sopra i campi di sospensione

Testo:

> Usa questa sezione solo quando il percorso deve essere interrotto o congelato. La motivazione è obbligatoria.

## 5. Box informativi in lista

### Empty state

> Non risultano ancora avvicinamenti per i filtri selezionati. Puoi cambiare i filtri oppure registrare un nuovo evento se sei autorizzato.

### Filtro stato autorizzazione

> Filtra gli avvicinamenti in base alla validità del provvedimento autorizzativo.

### Badge note riservate

Se `has_reserved_notes = true` ma l’utente non può leggere il contenuto:

- mostrare badge `Note riservate presenti`
- non mostrare anteprima del testo

## 6. Regole finali

- non usare copy tecnico da sviluppatore
- non esporre codici permesso nel drawer utente finale
- usare questo documento insieme a:
  - `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-085-avvicinamenti-family-workflow-v2-contract.md`
  - `C:\Projects\FamilyHUB\frontend\src\components\common\InfoDrawer.tsx`
