# Handoff UX/API 158 · GeoNames country dump import

Data: `2026-08-09`
Owner backend: Codex
Ambito: `Provider Geografia` / `Import dati`

## Obiettivo

Il driver `geonames` non importa più soltanto la nazione da `countryInfo.txt`.

Da questo rilascio il backend supporta, per la singola nazione selezionata:

- import nazione
- import regioni
- import province
- import città
- arricchimento città con metadati GeoNames

## Comportamento backend reale

Quando l’utente esegue `POST /api/admin/geography-imports` con provider `GEONAMES`:

1. legge `countryInfo.txt` per validare e aggiornare la nazione
2. legge `admin1CodesASCII.txt` per le regioni
3. legge `admin2Codes.txt` per province/distretti di livello 2
4. scarica o apre il dump `XX.zip` della nazione selezionata
5. filtra dal dump solo i record GeoNames di tipo populated place (`feature class = P`)
6. salva raw + carica canonico in `countries`, `regions`, `provinces`, `cities`

## Provider config supportata

Il campo `auth_config_json` del provider `geonames` può contenere:

```json
{
  "countries_source_url": "https://download.geonames.org/export/dump/countryInfo.txt",
  "admin1_source_url": "https://download.geonames.org/export/dump/admin1CodesASCII.txt",
  "admin2_source_url": "https://download.geonames.org/export/dump/admin2Codes.txt",
  "country_dump_url_template": "https://download.geonames.org/export/dump/{ISO}.zip"
}
```

Oppure le equivalenti varianti locali:

```json
{
  "countries_source_path": "C:\\path\\countryInfo.txt",
  "admin1_source_path": "C:\\path\\admin1CodesASCII.txt",
  "admin2_source_path": "C:\\path\\admin2Codes.txt",
  "country_dump_source_path_template": "C:\\path\\{ISO}.zip"
}
```

Placeholders supportati:

- `{ISO}` → `FR`
- `{iso}` → `fr`

## Modalità semplice consigliata

Per evitare configurazioni complesse da GUI, il backend ora supporta due casi semplici senza JSON avanzato:

### Caso A · provider globale nazioni

- driver: `geonames`
- mode: `remote_file`
- format: `txt`
- source_url: `https://download.geonames.org/export/dump/countryInfo.txt`

Uso previsto:

- sorgente globale per import/sync delle nazioni del mondo

### Caso B · provider paese-specifico dump GeoNames

- driver: `geonames`
- type: `country_specific`
- mode: `remote_file`
- format: `zip`
- source_url: `https://download.geonames.org/export/dump/{ISO}.zip`

Uso previsto:

- import della gerarchia geografica di una singola nazione non ancora popolata
- arricchimento futuro della nazione selezionata

In questo caso il backend usa automaticamente:

- `countryInfo.txt` come sorgente nazioni
- `admin1CodesASCII.txt`
- `admin2Codes.txt`

anche se non sono esplicitati nella GUI.

## Impatto UX richiesto

### 1. ProviderGeografiaPage · tab Provider

Per provider `geonames`:

- non mostrare più il provider come “solo nazione”
- aggiornare copy capability:
  - `Nazione`
  - `Regioni`
  - `Province`
  - `Città`
- aggiornare help text:
  - il provider GeoNames può popolare la gerarchia geografica della nazione selezionata
  - il CAP può non essere disponibile

### 2. ProviderGeografiaPage · form provider

Nel form provider:

- il driver resta una select chiusa (`istat`, `geonames`)
- `format` per `geonames` può essere `txt` o `zip`
- aggiungere hint pratici già pronti:
  - `countryInfo.txt` → provider globale nazioni
  - `{ISO}.zip` → provider paese-specifico GeoNames
- il blocco configurazione avanzata deve spiegare che:
  - `source_url/source_path` coprono la sorgente primaria
  - `auth_config_json` è opzionale e serve solo per override avanzati

### 3. Tab Import dati

Per provider risolto `geonames`:

- mostrare che il backend importerà tutti i livelli disponibili della nazione
- non mostrare messaggi legacy tipo “solo nazione”
- se il backend restituisce errore di gerarchia canonica esistente, mostrare il messaggio senza reinterpretarlo

### 4. Risultato import

Il box risultato già usa:

- `data.loaded.countries`
- `data.loaded.regions`
- `data.loaded.provinces`
- `data.loaded.cities`

Questi valori ora sono valorizzati anche per `geonames`.

## Dati città disponibili backend

Le città canoniche possono essere arricchite con:

- `geoname_id`
- `latitude`
- `longitude`
- `population`
- `timezone`
- `feature_code`
- `geonames_modified_at`

Nota: questi campi non sono ancora esposti in tutte le schermate frontend, ma il backend li salva.

## QA minima richiesta a UX

1. Aprire `Anagrafiche > Provider Geografia`
2. Verificare che `GeoNames` non appaia più “solo nazione”
3. Eseguire import su una nazione non italiana supportata dal dump
4. Verificare che il risultato mostri contatori > 0 su regioni/province/città
5. Verificare che il testo informativo non parli più di limite “solo nazione”

## Endpoint impattati

- `POST /api/admin/geography-imports`
- `GET /api/admin/geography-providers`
- `PUT /api/admin/geography-providers/{provider}`

## Note backend

- nessun reset dati
- migrazione additiva su tabella `cities`
- mantenuta retrocompatibilità del provider già esistente `GEONAMES`
- protezione attiva: se una nazione ha già gerarchia canonica gestita da provider paese-specifico (es. `ISTAT` per `IT`), GeoNames non può sovrascriverla
