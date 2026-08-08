# Handoff UX/API - Minori - Storico PEI firmato e timeline avanzamento obiettivi

Data: 2026-07-03  
Area: `Minori > Dettaglio minore > PEI`  
Priorita: Alta

## Obiettivo

Rendere il PEI una sezione storicizzata e consultabile nel tempo, non una semplice scheda con ultimo stato.

Il backend ora espone:

- storico versionato del PEI
- timeline dell'avanzamento per singolo obiettivo

## Endpoint nuovi

### Storico PEI

- `GET /api/minors/{minor}/peis/{pei}/history`

Restituisce una lista ordinata desc per data/id.

Ogni elemento contiene:

- `id`
- `event_type`
- `version_number`
- `snapshot`
- `metadata`
- `actor`
- `created_at`

### Timeline avanzamento obiettivo

- `GET /api/minors/{minor}/peis/{pei}/objectives/{objective}/progress`

Restituisce una lista ordinata desc per data/id.

Ogni elemento contiene:

- `id`
- `progress_percent`
- `status`
- `notes`
- `actor`
- `created_at`

## Regola UX principale

Dentro la sezione `PEI` devono esserci due livelli di lettura:

1. stato corrente del PEI
2. storico evolutivo del PEI

Dentro il dettaglio di ogni obiettivo devono esserci:

1. dati correnti dell'obiettivo
2. timeline di avanzamento nel tempo

## Proposta UI obbligatoria

### Blocco lista PEI

Per ogni PEI mostrare:

- titolo
- stato
- stato firma digitale
- ultima revisione
- CTA `Apri`

### Dettaglio PEI

Tab o accordion interni:

- `Dati PEI`
- `Obiettivi`
- `Storico PEI`

### Tab `Storico PEI`

Mostrare tabella o timeline con colonne minime:

- data/ora
- versione
- evento
- utente
- sintesi operazione

Se disponibile drawer laterale:

- dettaglio snapshot
- confronto snapshot precedente / corrente

### Obiettivi

Per ogni obiettivo mostrare:

- titolo
- responsabile
- stato
- avanzamento
- CTA `Storico avanzamento`

### Drawer o modal `Storico avanzamento`

Colonne minime:

- data/ora
- avanzamento %
- stato
- utente
- note

## Eventi backend da tradurre in label UX

### Storico PEI

- `minor_pei_created` → `PEI creato`
- `minor_pei_updated` → `PEI aggiornato`
- `minor_pei_objective_created` → `Obiettivo PEI aggiunto`
- `minor_pei_objective_updated` → `Obiettivo PEI aggiornato`
- `minor_pei_objective_deleted` → `Obiettivo PEI eliminato`

## Note importanti di integrazione

### 1. `snapshot`

Il campo `snapshot` contiene la fotografia completa del PEI al momento dell'evento:

- dati PEI
- firma
- elenco obiettivi
- avanzamento registrato in quel momento

UX non deve interpretarlo come testo grezzo:

- può usarlo per drawer diff
- può usarlo per pannello “versione storica”

### 2. `version_number`

Da usare come riferimento leggibile:

- `Versione 1`
- `Versione 2`
- `Versione 3`

### 3. Ordinamento

Le liste arrivano già ordinate dal più recente al più vecchio.

## QA minima per UX

- creare PEI
- aggiungere obiettivo
- aggiornare PEI
- aggiornare avanzamento obiettivo
- verificare che `GET /history` aumenti di evento e versione
- verificare che `GET /progress` aggiunga una nuova riga timeline
- verificare che il tab storico resti leggibile anche con molti eventi

## Nota per documentazione utente finale

Nel pulsante `Informazioni` della sezione PEI aggiungere testo chiaro:

- ogni modifica al PEI viene tracciata
- la firma del PEI è storicizzata
- l’avanzamento degli obiettivi è consultabile nel tempo
- lo storico serve per verifiche educative, coordinamento e audit interno
