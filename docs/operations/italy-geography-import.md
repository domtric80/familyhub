# Import geografia Italia completa

Data: 2026-06-22

## Obiettivo

Popolare il database canonico con:

- nazione
- regioni
- province
- città

usando un dataset ISTAT completo.

## Stato backend

Il backend supporta:

- provider `ISTAT`
- sorgente `local_file` oppure `remote_file`
- formato `csv` oppure `zip`
- import on-demand tramite `POST /api/admin/geography-imports`

## Configurazione consigliata

In `C:\Projects\FamilyHUB\backend\.env`:

```dotenv
GEOGRAPHY_ISTAT_MODE=local_file
GEOGRAPHY_ISTAT_FORMAT=zip
GEOGRAPHY_ISTAT_SOURCE_PATH=C:\Datasets\istat\italia-amministrativa.zip
```

Oppure sorgente remota:

```dotenv
GEOGRAPHY_ISTAT_MODE=remote_file
GEOGRAPHY_ISTAT_FORMAT=csv
GEOGRAPHY_ISTAT_SOURCE_URL=https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv
```

Se il file è già CSV:

```dotenv
GEOGRAPHY_ISTAT_MODE=local_file
GEOGRAPHY_ISTAT_FORMAT=csv
GEOGRAPHY_ISTAT_SOURCE_PATH=C:\Datasets\istat\italia-amministrativa.csv
```

URL verificata:

- `https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv`

## Applicazione configurazione

Eseguire:

```bash
php artisan db:seed --class=GeographyProviderSeeder --force
```

Questo aggiorna il provider `ISTAT` con la configurazione letta dalle variabili ambiente.

## Avvio import

Chiamata API:

```json
POST /api/admin/geography-imports
{
  "country_iso_code": "IT"
}
```

## Risultato atteso

Con dataset completo il backend deve valorizzare:

- `loaded.countries = 1`
- `loaded.regions > 0`
- `loaded.provinces > 0`
- `loaded.cities > 0`

## Nota importante

La completezza della banca dati dipende dal dataset fornito al provider `ISTAT`.
Se il file sorgente contiene solo un campione o un estratto, il database conterrà solo quel sottoinsieme.
