# Richiesta UX 018 — Geography bulk load wizard + fix console sync

## Contesto
- Backend disponibile su `http://localhost:8100/api`.
- Il team frontend non deve più dedurre il comportamento.
- Implementare esattamente i flussi descritti sotto.

## Obiettivi
1. Rendere leggibili `issue` e `decisioni` nella console sync.
2. Aggiungere uno scarico guidato dei dati geografici raw verso le tabelle canonicali.
3. Supportare il pulsante `Scarica completo` dal nodo selezionato.

## Console sync — adeguamenti obbligatori
### Stato ultimo run
- aggiungere metrica `Decisioni`
- mantenere il pulsante `Apri dettaglio run`

### Storico run
Per ogni riga mostrare:
- `Run ID`
- `Avvio`
- `Fine`
- `Scope`
- `Sorgenti`
- `Stato`
- `Issue`
- `Raw`
- `Pubblicati`
- `Warning`
- `Decisioni`
- `Azioni`

### Azioni riga storico
Mostrare due pulsanti distinti:
- `Issue`
- `Decisioni`

### Navigazione tab
- click su `Issue` → apre il tab `Issue qualità` del run scelto
- click su `Decisioni` → apre il tab `Decisioni` del run scelto
- click su `Apri dettaglio run` nello stato ultimo run → apre `Issue qualità`

## Nuovo modulo UI: Scarico geografia
Realizzare un pannello o pagina admin dedicata, separata dal CRUD geografico manuale.

Titolo:
- `Scarico geografia`

Permessi:
- lettura opzioni: `geography_sync.read`
- esecuzione scarico: `geography_sync.run`

## Wizard richiesto
Step sequenziali:
1. selezione `Run`
2. selezione `Sorgente`
3. selezione `Continente` se disponibile
4. selezione `Nazione`
5. selezione `Regione`
6. selezione `Provincia`
7. scelta azione di scarico

## Regole UX
- ogni step è disabilitato finché non è valorizzato il parent
- ad ogni cambio parent, azzerare i figli
- mostrare loading dedicato per ogni select
- gestire gli stati `empty`, `error`, `loading`
- se la sorgente non espone continenti, nascondere lo step continente

## Azioni da implementare
### Scarica nazioni
- filtro opzionale per continente
- esegue solo il caricamento delle nazioni

### Scarica regioni
- richiede una nazione selezionata
- esegue solo il caricamento delle regioni della nazione

### Scarica province
- richiede una regione selezionata
- esegue solo il caricamento delle province della regione

### Scarica città
- richiede una provincia selezionata
- esegue solo il caricamento delle città della provincia

### Scarica completo
Pulsante distinto.
Comportamento:
- se il contesto corrente è `continente` → carica nazioni + discendenti disponibili del continente
- se il contesto corrente è `nazione` → carica regioni + province + città
- se il contesto corrente è `regione` → carica province + città
- se il contesto corrente è `provincia` → carica città

## API da usare
### Run disponibili
- `GET /admin/geography-load/runs`

### Options
- `GET /admin/geography-load/options/continents?run_id={id}&source={source}`
- `GET /admin/geography-load/options/countries?run_id={id}&source={source}&continent_code={code?}`
- `GET /admin/geography-load/options/regions?run_id={id}&source={source}&country_key={key}`
- `GET /admin/geography-load/options/provinces?run_id={id}&source={source}&region_key={key}`
- `GET /admin/geography-load/options/cities?run_id={id}&source={source}&province_key={key}`

### Execute
- `POST /admin/geography-load/execute`

Esempio payload:
```json
{
  "run_id": 7,
  "source": "istat",
  "level": "regions",
  "recursive": false,
  "country_key": "IT"
}
```

Campi possibili:
- `run_id`
- `source`: `geonames | seed | istat`
- `level`: `countries | regions | provinces | cities`
- `recursive`: `true | false`
- `continent_code`
- `country_key`
- `region_key`
- `province_key`

## Response execute
```json
{
  "message": "Scarico completato con successo.",
  "data": {
    "countries": 0,
    "regions": 20,
    "provinces": 107,
    "cities": 7896,
    "level": "regions",
    "recursive": true
  }
}
```

## Copy minimo
- `Nessun dato disponibile per questa selezione`
- `Scarico completato con successo`
- `Seleziona prima una nazione`
- `Seleziona prima una regione`
- `Seleziona prima una provincia`

## Risposta attesa dal team UX
Nel file risposta indicare:
- pagina o route frontend creata
- file toccati
- mapping preciso di ogni endpoint usato
- gestione loading/error/empty per ogni select
- gestione del pulsante `Scarica completo`
