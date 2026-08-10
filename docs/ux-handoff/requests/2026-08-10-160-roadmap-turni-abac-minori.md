# UX Handoff — 2026-08-10 — Roadmap condivisa `Turni / Timesheet` + `ABAC documenti/note` + `Modulo Minori`

## Scopo del documento

Questo documento non introduce un singolo delta UI/API già chiuso, ma definisce la **roadmap operativa condivisa** che backend e UX devono seguire nei prossimi step.

Serve per:

- allineare il team sul prossimo ordine di sviluppo
- evitare lavorazioni frontend scollegate dalla reale disponibilità backend
- chiarire cosa va progettato prima, cosa dopo e quali dipendenze esistono tra i moduli

## Ordine di esecuzione concordato

L’ordine approvato è il seguente:

1. `Turni / Timesheet`
2. `ABAC documenti / note`
3. `Modulo Minori`

Motivo:

- `Turni / Timesheet` è il prossimo blocco più operativo e vicino all’uso quotidiano
- `ABAC` deve diventare leggibile e amministrabile via interfaccia prima di ampliare ancora i dati sensibili
- `Modulo Minori` va completato subito dopo, ma su una base di permessi e audit più chiara

---

## Fase 1 — Turni / Timesheet

### Obiettivo funzionale

Trasformare il modulo turni in un vero sistema operativo di pianificazione + consuntivazione:

- il coordinatore pianifica i turni
- l’educatore vede i propri turni
- il sistema distingue tra pianificato ed effettivo
- il sistema evidenzia scostamenti, firme e anomalie

### Step roadmap

#### 1.1 Modello dati definitivo

Backend da completare:

- modello `turno pianificato`
- modello `turno effettivo`
- fabbisogno minimo per struttura / fascia / giorno
- assegnazione educatore al turno
- eventi di presenza / assenza / sostituzione

Impatto UX:

- non progettare ancora schermate “finali” di consuntivazione finché il backend non espone chiaramente la distinzione tra:
  - `planned shift`
  - `actual shift`

#### 1.2 Anagrafica modello turno

Funzionalità attese:

- nome turno
- orario inizio
- orario fine
- flag attraversamento mezzanotte
- numero minimo operatori richiesti
- eventuale colore / codice visuale

UX dovrà prevedere:

- CRUD anagrafica modelli turno
- form molto semplice
- lista leggibile per struttura / organizzazione

#### 1.3 Pianificazione settimanale struttura

Funzionalità attese:

- vista settimanale coordinatore
- assegnazione rapida operatori
- controllo copertura minima per turno
- indicatori visivi di copertura completa / incompleta

UX dovrà progettare:

- planner settimanale struttura
- interazioni rapide di assegnazione
- warning chiari su turni scoperti

#### 1.4 Vista personale educatore

Funzionalità attese:

- settimana personale dell’operatore
- elenco turni assegnati
- stato turno
- eventuali cambi o sostituzioni

UX dovrà prevedere:

- vista semplice, non da coordinatore
- focus su “i miei turni”
- zero funzioni amministrative inutili in questo pannello

#### 1.5 Consuntivazione turno

Funzionalità attese:

- entrata reale
- uscita reale
- pause
- note operative
- firma di chiusura turno

UX dovrà progettare:

- schermata o drawer di chiusura turno
- stato chiaro:
  - aperto
  - in corso
  - chiuso
  - firmato

#### 1.6 Scostamenti e anomalie

Funzionalità attese:

- ritardo
- assenza
- straordinario
- copertura insufficiente
- sostituzione educatore

UX dovrà prevedere:

- badge / alert chiari
- reportistica operativa
- visualizzazione differenza tra previsto e reale

#### 1.7 Audit e sicurezza

Backend atteso:

- audit su creazione turno
- audit su modifica assegnazione
- audit su firma turno
- audit su modifiche presenza/assenza/scostamento

UX dovrà solo:

- mostrare lo stato
- non costruire logiche autonome
- attendere contratto backend puntuale per eventuale pagina audit modulo turni

### Deliverable UX attesi per Fase 1

UX dovrà prepararsi a ricevere handoff separati per:

- anagrafica modelli turno
- planner settimanale coordinatore
- settimana personale educatore
- chiusura / firma turno
- gestione scostamenti

### Vincolo importante

Il frontend non deve trattare `turno pianificato` e `turno effettivo` come la stessa entità logica.

Questa distinzione è fondamentale per:

- audit
- timesheet
- straordinari
- assenze
- copertura struttura

---

## Fase 2 — ABAC documenti / note

### Obiettivo funzionale

Rendere finalmente **trasparente e gestibile da interfaccia** la matrice di accesso ai dati sensibili.

Oggi la logica backend esiste già in parte, ma l’utilizzatore non ha una vista chiara del tipo:

- “chi vede cosa”
- “chi può solo leggere”
- “chi può scaricare”
- “chi può vedere clinico o giudiziario”

### Step roadmap

#### 2.1 Censimento classificazioni

Classificazioni oggi previste o già usate:

- `internal`
- `restricted`
- `clinical`
- `judicial`

Possibili evoluzioni future:

- nuove classi documentali
- nuovi scope note riservate

UX dovrà preparare:

- vista tabellare o matrice
- nomenclatura molto chiara

#### 2.2 Separazione azioni per classificazione

Il backend dovrà esplicitare almeno queste azioni:

- `preview`
- `read`
- `download`
- `upload`
- `update metadata`
- `delete`

UX dovrà evitare UI che mostri un unico generico “accesso ai documenti”.

#### 2.3 Matrice admin ruolo → classificazione → azione

Obiettivo UX:

- una schermata amministrativa leggibile
- non una somma di checkbox senza contesto

Forma consigliata:

- righe = ruoli
- colonne = classificazioni
- sotto-azioni chiare per preview / download / upload / ecc.

#### 2.4 Gestione nuovi tag/classificazioni

Necessità futura già emersa:

- se nasce una nuova classificazione documentale, non deve servire toccare il codice frontend per capirla

UX dovrà progettare:

- schermata classificazioni
- help contestuale
- comportamento leggibile anche per nuovi tag

#### 2.5 Estensione alle note

Le stesse regole ABAC andranno riusate per:

- note cliniche
- note giudiziarie
- note riservate coordinatore / psicologo

UX dovrà considerare da subito che:

- documenti e note non saranno più mondi separati lato policy
- la stessa logica di classificazione deve essere leggibile in entrambi i punti

#### 2.6 Audit ABAC

Backend atteso:

- log preview
- log lettura
- log download
- log tentativi negati

UX dovrà prevedere in futuro:

- filtri audit per classificazione
- lettura semplice del “chi ha visto cosa”

### Deliverable UX attesi per Fase 2

UX dovrà prepararsi a handoff dedicati per:

- matrice permessi documentali
- gestione classificazioni
- visibilità ruoli
- note riservate classificate

### Vincolo importante

RBAC e ABAC non vanno confusi:

- `RBAC` = accesso al modulo / azione applicativa generale
- `ABAC` = accesso al contenuto sensibile in base a classificazione, ruolo, contesto e minore

Il frontend dovrà rappresentare questa differenza in modo chiaro.

---

## Fase 3 — Modulo Minori

### Obiettivo funzionale

Completare la scheda minore rispetto al capitolato, soprattutto nella parte:

- background familiare
- diagnosi / DSM
- PEI
- bisogni categorizzati
- storico / audit

### Step roadmap

#### 3.1 Background familiare

Funzionalità attese:

- narrativa protetta
- storico modifiche
- visibilità controllata

UX dovrà prevedere:

- sezione leggibile ma protetta
- warning su contenuti sensibili

#### 3.2 Diagnosi / DSM

Funzionalità attese:

- diagnosi primaria / secondarie
- date
- note cliniche
- accesso riservato

UX dovrà considerare:

- questa area è più vicina alla logica `clinical`
- quindi dipende direttamente dalla Fase 2

#### 3.3 Bisogni categorizzati

Categorie previste:

- fisici
- emotivi
- cognitivi
- relazionali
- spirituali

Campi attesi:

- priorità
- responsabile
- stato
- note
- allegati

#### 3.4 PEI

Funzionalità attese:

- obiettivi
- responsabile
- scadenza
- stato
- avanzamento

UX dovrà prevedere:

- gestione obiettivi
- progress tracking
- lettura nel tempo

#### 3.5 Collegamenti con altri moduli

PEI dovrà poi dialogare con:

- `Attività`
- `Diario educativo`

Quindi UX non dovrà progettare il PEI come blocco “isolato”.

#### 3.6 Dashboard minore

Elementi da portare in evidenza:

- trend PEI
- bisogni aperti
- scadenze
- eventi rilevanti

### Deliverable UX attesi per Fase 3

UX dovrà prepararsi a handoff per:

- tab background familiare
- tab clinico / diagnosi
- tab PEI
- tab bisogni
- dashboard minore
- storico minore

### Vincolo importante

Ogni nuova sezione del minore dovrà rispettare:

- RBAC modulo
- ABAC contenuti sensibili
- audit accessi e modifiche

---

## Sequenza operativa da seguire

### Sprint logico 1

`Turni / Timesheet`

Priorità immediata:

- `1.1`
- `1.2`
- `1.3`

### Sprint logico 2

`Turni / Timesheet`

- `1.4`
- `1.5`
- `1.6`

### Sprint logico 3

`ABAC documenti / note`

- `2.1`
- `2.2`
- `2.3`

### Sprint logico 4

`ABAC documenti / note`

- `2.4`
- `2.5`
- `2.6`

### Sprint logico 5

`Modulo Minori`

- `3.1`
- `3.2`
- `3.3`

### Sprint logico 6

`Modulo Minori`

- `3.4`
- `3.5`
- `3.6`

---

## Indicazioni per UX

Per ora UX **non deve anticipare UI definitive** su blocchi backend non ancora contrattualizzati nel dettaglio.

UX deve usare questo documento come:

- roadmap di priorità
- riferimento per i prossimi handoff tecnici
- guida per evitare sovrapposizioni o mockup scollegati dalla logica reale

## Indicazioni per backend

Backend userà questa roadmap per produrre, fase per fase:

- handoff UX puntuali
- contratti API reali
- note QA
- regole RBAC / ABAC esplicitate

## Stato del documento

Stato: `attivo`

Questo documento è il riferimento di roadmap fino a quando non verrà sostituito o aggiornato da una nuova versione condivisa.
