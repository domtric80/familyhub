# GeoNames Francia — fix timeout import HTTP

Data: 2026-08-10  
Ambito: import geografico on-demand (`/api/admin/geography-imports`)

## Sintomo

- import città di nazioni piccole/medie (es. Cameroon) completato
- import Francia via GeoNames falliva con:
  - `Maximum execution time of 30 seconds exceeded`

## Diagnosi

Il backend GeoNames Francia è operativo: esecuzione diretta applicativa completata con:
- `regions = 13`
- `provinces = 109`
- `cities = 81598`

Il problema non era il provider né il parsing dei dati, ma il runtime della richiesta HTTP lunga:
- lato applicazione non era forzata la modalità long-running
- lato nginx locale il `proxy_read_timeout` era a `60s`

La Francia richiede più tempo del Cameroon e supera facilmente quei limiti.

## Fix applicati

### Backend
- `OnDemandGeographyImporter::import()` ora prepara il runtime per import lunghi:
  - `set_time_limit(0)`
  - `ini_set('max_execution_time', '0')`
  - `disableQueryLog()`

- stesso approccio aggiunto a:
  - `GeoNamesGlobalCountryImporter::importAllCountries()`

### Nginx
- `infra/nginx/default.conf`
  - `proxy_read_timeout 300s`
  - `proxy_send_timeout 300s`

- `infra/nginx/familyhub.prod.conf`
  - timeout API rialzati a `300s`

## Note operative

- fix pensato per sbloccare subito il flusso attuale via UI
- per dataset molto grandi il passo successivo corretto resta comunque:
  - esecuzione asincrona in coda
  - polling stato run
  - progress UI

## Validazione

Test backend eseguiti con successo:
- `tests/Feature/CountryApiTest.php`
- `tests/Feature/GeographyProviderCountriesImportApiTest.php`
- `tests/Feature/GeographyImportApiTest.php`

