# UX Handoff 033 - Geografia a cascata e proposta vista progressiva

Data: 2026-06-22
Team destinatario: UX / Frontend
Ambito: `Anagrafiche > Geografia`, `Admin > Strutture`

## Fix già applicati
Il backend ora supporta correttamente i filtri:
- `GET /api/admin/regions?country_id={id}`
- `GET /api/admin/provinces?region_id={id}`
- `GET /api/admin/cities?province_id={id}`

Le schermate `Strutture` e `Geografia` sono state corrette per evitare liste globali fuori contesto.

## Regole UX obbligatorie
In tutti i form con geografia amministrativa:
1. selezione `Nazione`
2. selezione `Regione` filtrata per nazione
3. selezione `Provincia` filtrata per regione
4. selezione `Città` filtrata per provincia

Non mostrare mai:
- province globali se non è selezionata la regione
- regioni globali se non è selezionata la nazione
- città globali se non è selezionata la provincia

## Proposta approvata da valutare
L'utente propone di trasformare `Anagrafiche > Geografia` in una vista progressiva a filtri, più chiara dell'attuale sistema a tab.

### Flusso desiderato
- step 1: filtro `Continente` + tabella `Nazioni`
- step 2: scelta nazione -> la vista passa a `Regioni`
- step 3: scelta regione -> la vista passa a `Province`
- step 4: scelta provincia -> la vista passa a `Città`
- step finale città: azioni `modifica`, `cancella`, `aggiungi`

### Evoluzione futura richiesta
Sulla singola città potrà esserci una scheda dettaglio con:
- metadati geografici
- link o dati da fonti esterne (`Wikipedia`, `OpenData`, provider geografici)
- eventuali operazioni di arricchimento dati

## Decisione di progetto
Per ora è stato corretto il comportamento attuale.
La vista progressiva completa va considerata una `refactor UX dedicata`, da pianificare come attività separata per non rompere i CRUD già funzionanti.
