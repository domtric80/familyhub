# FamilyHub · Richiesta UX 015 · Console sincronizzazione geografia e qualità dato

Data: 2026-06-21
Stato backend: pianificazione architetturale, non ancora implementato

## 1. Contesto

Il backend introdurrà una pipeline di sincronizzazione della geografia da sorgenti esterne
per mantenere aggiornate:

- nazioni
- regioni
- province
- città

La funzionalità non sostituisce le anagrafiche geografiche CRUD già presenti.
Introduce invece una **console operativa** per:

- vedere ultimo sync
- lanciare sync manuale
- consultare issue qualità
- controllare le decisioni di publish

## 2. Pagina richiesta

### Nome pagina

- `Sincronizzazione geografia`

### Posizione menu

- `Anagrafiche > Geografia > Sincronizzazione`

### Titolo pagina

- `Sincronizzazione geografia`

### Sottosezioni obbligatorie

- `Stato ultimo run`
- `Storico run`
- `Issue qualità`
- `Decisioni di sincronizzazione`

## 3. Permessi e visibilità

La pagina deve essere visibile solo a utenti con permessi dedicati, che il backend introdurrà in seguito.

Preparare la UI per almeno questi capability code:

- `geography_sync.read`
- `geography_sync.run`
- `geography_sync.publish`

Regole:

- senza `geography_sync.read`: voce menu nascosta
- con `geography_sync.read`: accesso sola lettura
- con `geography_sync.run`: pulsante `Avvia verifica`
- con `geography_sync.publish`: pulsante `Pubblica modifiche sicure`

## 4. Endpoint attesi

Questi endpoint non sono ancora implementati, ma UX deve preparare la struttura pagina in modo aderente.

- `GET /api/admin/geography-sync/runs/latest`
- `GET /api/admin/geography-sync/runs`
- `GET /api/admin/geography-sync/runs/{run}`
- `GET /api/admin/geography-sync/runs/{run}/issues`
- `GET /api/admin/geography-sync/runs/{run}/decisions`
- `POST /api/admin/geography-sync/runs`
- `POST /api/admin/geography-sync/runs/{run}/publish`

## 5. Sezione “Stato ultimo run”

### Dati da mostrare

- stato run
- data/ora inizio
- data/ora fine
- durata
- sorgenti coinvolte
- file letti
- record processati
- record creati
- record aggiornati
- record disattivati
- warning count
- error count

### Componenti UI

- card riepilogo
- badge stato:
  - `QUEUED`
  - `RUNNING`
  - `COMPLETED`
  - `COMPLETED_WITH_WARNINGS`
  - `FAILED`
  - `ROLLED_BACK`

### CTA

- `Avvia verifica`
- `Pubblica modifiche sicure`
- `Apri dettaglio run`

## 6. Sezione “Storico run”

### Tabella obbligatoria

Colonne:

- `Run ID`
- `Avvio`
- `Fine`
- `Scope`
- `Sorgenti`
- `Stato`
- `Issue`
- `Creati`
- `Aggiornati`
- `Disattivati`
- `Azioni`

### Azioni riga

- `Dettaglio`
- `Issue`
- `Decisioni`

## 7. Sezione “Issue qualità”

### Filtri obbligatori

- severità
- tipo issue
- livello entità
- sorgente
- solo bloccanti

### Tabella obbligatoria

Colonne:

- `Severità`
- `Tipo`
- `Livello`
- `Sorgente`
- `Chiave sorgente`
- `Messaggio`
- `Bloccante`
- `Stato`

### UX comportamentale

- `critical` e `error` con evidenza forte
- `warning` con evidenza media
- `info` con evidenza leggera

## 8. Sezione “Decisioni di sincronizzazione”

### Tabella obbligatoria

Colonne:

- `Azione`
- `Entità`
- `Tabella target`
- `Record target`
- `Sorgente`
- `Chiave sorgente`
- `Motivo`
- `Eseguita`

### Stato azione

- `create`
- `update`
- `deactivate`
- `skip`
- `manual_review`

## 9. Modali richieste

### Modale “Avvia verifica”

Campi:

- scope
- sorgente
- `dry_run` checkbox

CTA:

- `Avvia`
- `Annulla`

### Modale “Pubblica modifiche sicure”

Messaggio obbligatorio:

- conferma esplicita che saranno pubblicate solo decisioni non bloccate

CTA:

- `Pubblica`
- `Annulla`

## 10. Stati UI obbligatori

- `loading`
- `empty`
- `error`
- `success`
- `run in progress`
- `run failed`
- `run with warnings`

## 11. Errori UI da gestire

- `401`
- `403`
- `422`
- `409`
- `500`

Messaggi:

- mai tecnici se non nel pannello dettaglio
- mostrare sempre un messaggio sintetico e una possibile azione successiva

## 12. Checklist UX

- creare la pagina nel menu corretto
- predisporre badge stato coerenti
- predisporre tabelle con filtri
- prevedere empty state espliciti
- prevedere loading state espliciti
- prevedere permessi/visibilità per CTA
- non inventare campi non presenti nel contratto backend

## 13. Verifica richiesta al team UX

Quando il team UX risponde, deve confermare esplicitamente:

- struttura pagina
- tabelle previste
- badge/stati
- modali
- gestione permessi
- gestione errori

Risposta attesa in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-21-015-geography-source-sync-and-quality-console-response.md`
