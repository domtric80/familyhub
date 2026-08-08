# FamilyHub · Uso operativo scarico geografia

Data: 2026-06-21

## Scopo

Questo documento descrive come usare lo scarico geografico raw → canonicale:

- da CLI Laravel
- tramite API amministrative
- con logica guidata per livello

## Concetto operativo

La pipeline è separata in due momenti:

1. `sync`:
   - acquisisce e valida i dati sorgente
   - popola le tabelle raw
2. `load`:
   - trasferisce i dati raw nelle tabelle canonicali applicative

Questo approccio permette:

- auditabilità
- controllo qualità prima della pubblicazione
- caricamenti parziali e progressivi

## Prerequisito

Prima di eseguire uno scarico, deve esistere almeno un run raw valido.

Esempi:

```powershell
docker compose exec app php artisan familyhub:geo-sync --source=seed --scope=italy_admin_seed --dry-run
docker compose exec app php artisan familyhub:geo-sync --source=istat --scope=italy_admin_csv --dry-run --file=/var/www/html/tests/Fixtures/istat-cities-sample.csv
docker compose exec app php artisan familyhub:geo-sync --source=geonames --scope=full --dry-run
```

## Comando CLI

File:

- `C:\Projects\FamilyHUB\backend\app\Console\Commands\GeoLoadCommand.php`

Comando:

```powershell
docker compose exec app php artisan familyhub:geo-load
```

## Opzioni disponibili

- `--run-id=` run raw specifico
- `--latest` usa l’ultimo run della sorgente
- `--source=` `geonames | seed | istat`
- `--level=` `countries | regions | provinces | cities`
- `--recursive` scarica anche tutti i figli dal livello corrente
- `--continent=` filtro continente
- `--country-key=` chiave sorgente nazione
- `--region-key=` chiave sorgente regione
- `--province-key=` chiave sorgente provincia

## Casi d’uso CLI

### 1. Scarica solo nazioni da GeoNames

```powershell
docker compose exec app php artisan familyhub:geo-load --latest --source=geonames --level=countries
```

### 2. Scarica solo nazioni del continente Europa

```powershell
docker compose exec app php artisan familyhub:geo-load --latest --source=geonames --level=countries --continent=EU
```

### 3. Scarica regioni italiane da seed

```powershell
docker compose exec app php artisan familyhub:geo-load --latest --source=seed --level=regions --country-key=IT
```

### 4. Scarica regione + province + città

```powershell
docker compose exec app php artisan familyhub:geo-load --latest --source=istat --level=regions --country-key=IT --recursive
```

### 5. Scarica solo città di una provincia

```powershell
docker compose exec app php artisan familyhub:geo-load --latest --source=istat --level=cities --province-key=IT-15-NA
```

## API amministrative

Documentate in:

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

Endpoint:

- `GET /api/admin/geography-load/runs`
- `GET /api/admin/geography-load/options/continents`
- `GET /api/admin/geography-load/options/countries`
- `GET /api/admin/geography-load/options/regions`
- `GET /api/admin/geography-load/options/provinces`
- `GET /api/admin/geography-load/options/cities`
- `POST /api/admin/geography-load/execute`

## Logica di selezione

### Step guidato

1. selezionare il run
2. selezionare la sorgente
3. opzionalmente il continente
4. selezionare la nazione
5. selezionare la regione
6. selezionare la provincia
7. scegliere se scaricare:
   - solo il livello corrente
   - il livello corrente più tutti i discendenti

### Regola pratica

- `recursive=false` = scarico puntuale
- `recursive=true` = comportamento “Scarica completo”

## Note importanti

- `geonames` oggi popola il livello nazioni con filtro continente
- `seed` e `istat` oggi sono i principali sorgenti per regioni/province/città
- il loader fa merge rispettando i vincoli unici del modello canonico
- lo storico ANPR resta separato e non entra in questo loader

## Verifica rapida

Dopo uno scarico riuscito è consigliato verificare:

```powershell
docker compose exec app php artisan tinker --execute="dump(App\Models\Country::count(), App\Models\Region::count(), App\Models\Province::count(), App\Models\City::count());"
```

## Sicurezza operativa

- eseguire lo scarico solo da run già validati
- evitare caricamenti massivi non controllati su sorgenti incomplete
- preferire `--level` puntuale durante le prime fasi di collaudo
- usare `--recursive` solo quando il contenuto raw del nodo selezionato è stato verificato
