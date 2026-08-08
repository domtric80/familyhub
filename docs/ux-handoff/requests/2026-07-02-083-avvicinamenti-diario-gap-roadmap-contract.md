# Handoff UX/API — Gap roadmap Avvicinamenti e Diario educativo

Data: 2026-07-02  
Area: `Minori > Avvicinamenti` / `Minori > Diario educativo`  
Priorità: alta  
Tipo richiesta: chiarimento stato modulo + prevenzione false assunzioni UX

## 1. Obiettivo

Questo documento non introduce nuove API immediate.

Serve a chiarire al team UX che:

- le pagine `Avvicinamenti` e `Diario educativo` esistono
- i rispettivi backend CRUD esistono
- ma i moduli sono oggi da considerare `v1 funzionale`, non `copertura completa del dominio`

La UI non deve quindi raccontare implicitamente che il requisito prodotto è stato interamente chiuso.

## 2. Stato attuale da riflettere in UI

### 2.1 Avvicinamenti

La pagina attuale copre:

- elenco
- filtri base
- creazione/modifica/eliminazione
- tipologia
- contatto coinvolto
- supervisore
- date pianificate/effettive
- stato
- note esito
- prossimi passi

Non copre ancora:

- provvedimento autorizzativo con scadenza
- alert rinnovo
- reazione del minore prima/durante/dopo
- note riservate psicologo/coordinatore
- trend evolutivo grafico
- sospensione motivata con firma responsabile

### 2.2 Diario educativo

La pagina attuale copre:

- elenco
- filtri base
- creazione/modifica/eliminazione voce
- tipologia voce
- data osservazione
- contenuto libero
- follow-up

Non copre ancora:

- registro turno strutturato
- alimentazione / igiene / sonno / umore come campi dedicati
- segnalazioni urgenti verde/giallo/rosso
- firma digitale di chiusura turno
- passaggio consegne con presa visione
- ricerca full-text
- messaggistica interna cifrata

## 3. Regola UX obbligatoria

Fino a nuova specifica:

- non introdurre etichette che lascino intendere la presenza di workflow avanzati inesistenti
- non aggiungere CTA “firma”, “chiusura turno”, “sospendi”, “rinnovo provvedimento”, “trend”, “messaggi cifrati” se non esiste il relativo supporto backend
- se si inseriscono card placeholder o badge roadmap, devono essere marcati come:
  - `Funzione pianificata`
  - `Non ancora disponibile`

## 4. Indicazione per contenuti informativi

Nel bottone/info panel della sezione, la UI può spiegare:

### Avvicinamenti

“Questa sezione gestisce i singoli eventi di avvicinamento già pianificati o consuntivati. Le funzioni avanzate autorizzative ed evolutive saranno abilitate in step successivi.”

### Diario educativo

“Questa sezione registra voci diario puntuali del minore. Il registro strutturato di turno, la firma di chiusura e il passaggio consegne saranno introdotti in un’evoluzione successiva.”

## 5. Impatto sulle pagine già implementate

Le pagine attuali possono restare attive.

Occorre però evitare che il loro naming o i testi descrittivi facciano pensare che:

- `Avvicinamenti` sia già una pratica familiare completa
- `Diario educativo` sia già il giornale di turno completo

## 6. Nessun cambio API in questo task

Questo documento non cambia:

- endpoint
- payload
- codici risposta
- permessi backend

Serve esclusivamente ad allineare il significato funzionale delle schermate già costruite.

## 7. Documento di riferimento

Per la roadmap e il dettaglio completo dei gap usare:

- `C:\Projects\FamilyHUB\docs\architecture\2026-07-02-gap-analysis-avvicinamenti-diario-educativo.md`
