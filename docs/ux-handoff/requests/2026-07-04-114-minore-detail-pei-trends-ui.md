# Handoff UX/API - Scheda minore: dashboard trend PEI

Data: 2026-07-04
Ambito: frontend `MinoreDetailPage` / tab `Anagrafica`
Priorita: alta

## Obiettivo

Mostrare subito nella scheda del minore un riepilogo operativo del PEI, senza obbligare l'utente ad aprire il tab `Profilo`.

## Sorgente dati

Endpoint gia disponibile:
- `GET /api/minors/{minor}`

Payload gia disponibile nel contratto OpenAPI:
- campo `pei_trends`

## Posizionamento UI

Inserire il blocco **prima** dei campi anagrafici nella tab `Anagrafica` della scheda minore.

Ordine visuale:
1. card `Trend PEI`
2. dati anagrafici classici

## Contenuto della card

### Riga KPI

Mostrare 5 KPI:
- `PEI attivi` = `pei_trends.summary.active_peis`
- `Obiettivi` = `pei_trends.summary.total_objectives`
- `Completati` dentro sottotitolo del KPI obiettivi = `pei_trends.summary.completed_objectives`
- `Avanzamento medio` = `pei_trends.summary.average_progress_percent`
- `Eventi da Attivita` = `pei_trends.summary.linked_activity_events`
- `Eventi da Diario` = `pei_trends.summary.linked_journal_events`

### Lista andamento obiettivi

Per ogni elemento di `pei_trends.objective_trends` mostrare:
- `objective_title`
- badge `objective_code` se presente
- badge stato `status`
- percentuale attuale `current_progress_percent`
- data ultimo aggiornamento `last_progress_at`
- sparkline/mini-chart usando `series[].progress_percent`
- contatore numero eventi = `series.length`

### Eventi recenti PEI

Per ogni elemento di `pei_trends.recent_events` mostrare:
- badge sorgente:
  - `minor_activity` => `Attivita`
  - `minor_journal_entry` => `Diario educativo`
  - altro => `Aggiornamento manuale`
- badge stato `status`
- `progress_percent`
- `source_label`
- `notes` se presente
- `logged_at`
- `actor.display_name` se presente

## Stati UI

### Nessun dato

Se `pei_trends` e' assente oppure `pei_trends.summary.total_objectives = 0`:
- mostrare alert neutro
- testo: `Nessun trend PEI disponibile: crea un PEI con almeno un obiettivo per vedere l'andamento educativo operativo.`

### Dati presenti

Mostrare card completa con KPI + obiettivi + eventi recenti.

## Note implementative

- Non introdurre form o azioni di modifica in questa card.
- La card e' solo consultiva.
- Il dettaglio editing PEI resta nel tab `Profilo`.
- La mini-chart puo' essere SVG inline; non e' richiesta una libreria chart esterna.

## QA atteso

Verificare questi casi:
1. minore senza PEI => alert vuoto
2. minore con PEI ma senza eventi => KPI presenti, lista obiettivi presente, eventi recenti vuoti
3. minore con PEI collegato a Attivita e Diario => contatori valorizzati e sorgente corretta
4. nessun regressione sui campi anagrafici sottostanti
