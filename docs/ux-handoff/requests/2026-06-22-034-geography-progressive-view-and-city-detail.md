# Richiesta UX 034 — Geografia progressiva e dettaglio città

## Stato
- Backend già pronto per filtri gerarchici:
  - `GET /admin/regions?country_id={id}`
  - `GET /admin/provinces?region_id={id}`
  - `GET /admin/cities?province_id={id}`
- Frontend deve usare solo questi endpoint filtrati.

## Obiettivo UX
- Sostituire la vecchia navigazione a tab `Nazioni / Regioni / Province / Città` con **una sola vista progressiva**.
- La pagina deve guidare l’utente nella gerarchia:
  - `Nazione -> Regione -> Provincia -> Città`
- L’utente non deve mai vedere righe fuori contesto geografico.

## Comportamento richiesto

### 1. Filtri in testata
- Mostrare tre select in cascata:
  - `Nazione`
  - `Regione`
  - `Provincia`
- Regole:
  - se non è selezionata la nazione, regione è disabilitata
  - se non è selezionata la regione, provincia è disabilitata
  - al cambio nazione si azzerano regione, provincia, città selezionata
  - al cambio regione si azzerano provincia e città selezionata
  - al cambio provincia si azzera la città selezionata

### 2. Tabella unica progressiva
- La tabella cambia contenuto in base al livello attivo:
  - nessuna nazione selezionata -> lista nazioni
  - nazione selezionata, nessuna regione -> lista regioni di quella nazione
  - regione selezionata, nessuna provincia -> lista province di quella regione
  - provincia selezionata -> lista città di quella provincia
- Ogni riga deve avere:
  - azione `Apri`
  - azione `Modifica`
  - azione `Elimina`
- Per le città aggiungere anche:
  - azione `Dettaglio`

### 3. Dettaglio città
- Quando l’utente seleziona una città, sotto la tabella mostrare un pannello dettaglio con:
  - nome città
  - provincia
  - regione
  - nazione
  - codice catastale
  - CAP
- Mostrare anche collegamenti esterni:
  - OpenStreetMap
  - Wikipedia

### 4. Mappa città
- Il pannello dettaglio città deve includere una mappa embedded.
- Provider default:
  - `OpenStreetMap / Nominatim`
- Configurazione frontend prevista:
  - `VITE_CITY_MAP_PROVIDER=osm`
  - opzionale `VITE_MAPTILER_KEY` per provider futuri
- Se le coordinate non sono trovate:
  - mostrare warning chiaro
  - lasciare disponibili i link esterni

## Regole importanti
- Non mostrare regioni italiane se la nazione selezionata è Francia.
- Non mostrare province globali se la regione selezionata è Lazio.
- Non mostrare città globali se la provincia selezionata è specifica.
- Nessuna query “full list” lato UI quando il livello padre è noto.

## API da usare

### Nazioni
- `GET /admin/countries`
- `POST /admin/countries`
- `PUT /admin/countries/{id}`
- `DELETE /admin/countries/{id}`

### Regioni
- `GET /admin/regions?country_id={id}`
- `POST /admin/regions`
- `PUT /admin/regions/{id}`
- `DELETE /admin/regions/{id}`

### Province
- `GET /admin/provinces?region_id={id}`
- `POST /admin/provinces`
- `PUT /admin/provinces/{id}`
- `DELETE /admin/provinces/{id}`

### Città
- `GET /admin/cities?province_id={id}`
- `POST /admin/cities`
- `PUT /admin/cities/{id}`
- `DELETE /admin/cities/{id}`

## Note implementative
- La pagina non deve duplicare logiche della sezione `Provider Geografia`.
- `Provider Geografia` resta area di alimentazione dati esterni.
- `Geografia` resta area di consultazione e CRUD gerarchico del dato canonico interno.

## Verifica attesa da UX
- UX deve confermare esplicitamente che:
  - la pagina non usa più tab separate
  - i filtri sono davvero in cascata
  - ogni livello mostra solo i record coerenti con il padre selezionato
  - il dettaglio città contiene mappa e link esterni
