# Handoff UX/API 159 · GeoNames global countries import

Data: `2026-08-09`
Owner backend: Codex
Ambito: `Anagrafiche > Provider Geografia`

## Obiettivo

Aggiungere una funzione semplice e dedicata per:

- importare automaticamente tutte le nazioni del mondo
- partendo da un provider `GeoNames` configurato con `countryInfo.txt`

Questo serve a evitare configurazioni manuali complesse quando l’obiettivo è solo popolare l’anagrafica `countries`.

## Nuovo endpoint backend

### `POST /api/admin/geography-providers/{provider}/import-countries`

Avvia l’import globale di tutte le nazioni da un provider `geonames` configurato come sorgente nazioni.

### Response `201`

```json
{
  "message": "Import nazioni completato.",
  "data": {
    "provider": {
      "id": 1,
      "code": "GEONAMES",
      "name": "GeoNames Generic",
      "driver": "geonames",
      "mode": "remote_file",
      "format": "txt"
    },
    "run": {
      "id": 12,
      "status": "completed",
      "scope": "on_demand_global_countries",
      "summary": {
        "source": "geonames",
        "dataset": "countries_bulk_import",
        "countries_parsed": 252,
        "created_countries": 200,
        "updated_countries": 52
      }
    },
    "raw": {
      "countries": 252,
      "regions": 0,
      "provinces": 0,
      "cities": 0
    },
    "loaded": {
      "countries": 252,
      "regions": 0,
      "provinces": 0,
      "cities": 0
    },
    "stats": {
      "created_countries": 200,
      "updated_countries": 52
    }
  }
}
```

### Response `422`

Esempio quando il provider è un dump paese `zip`:

```json
{
  "message": "Il provider GEONAMES è configurato come dump paese. Per importare tutte le nazioni usa un provider GeoNames con sorgente countryInfo.txt."
}
```

## Regola funzionale

Questo endpoint è pensato solo per provider GeoNames “globali nazioni”.

Configurazione attesa:

- `driver = geonames`
- `format = txt`
- `source_url = https://download.geonames.org/export/dump/countryInfo.txt`

Oppure equivalente locale:

- `mode = local_file`
- `source_path = .../countryInfo.txt`

## Impatto UX richiesto

## 1. Tab Provider

Per ogni provider `geonames` con sorgente `countryInfo.txt`:

- aggiungere azione dedicata, per esempio:
  - `Importa nazioni`
- l’azione deve essere distinta da:
  - import per singola nazione
  - associazione provider-nazione

### 2. Visibilità bottone

Mostrare il bottone `Importa nazioni` solo se:

- `driver === 'geonames'`
- `format === 'txt'`
- la sorgente primaria è `countryInfo.txt` o equivalente file locale testuale

Non mostrare questo bottone per provider `zip` paese-specifici.

### 3. Conferma utente

Prima della chiamata, mostrare conferma chiara:

> Verranno create o aggiornate le nazioni del mondo nell’anagrafica globale.  
> Non verranno importate regioni, province o città.

### 4. Risultato UI

Dopo successo:

- toast verde: `Import nazioni completato`
- box risultato con:
  - nazioni lette (`raw.countries`)
  - nazioni create (`stats.created_countries`)
  - nazioni aggiornate (`stats.updated_countries`)
  - run id

### 5. Error handling

Se backend restituisce `422`, mostrare il messaggio backend così com’è.

Non trasformare il messaggio in copy generico.

## QA minima richiesta a UX

1. Configurare provider GeoNames globale `txt`
2. Verificare presenza bottone `Importa nazioni`
3. Avviare import
4. Verificare response `201`
5. Verificare che l’anagrafica nazioni si popoli
6. Verificare che un provider `zip` non mostri lo stesso bottone oppure restituisca `422` se invocato

## Endpoint correlati

- `GET /api/admin/geography-providers`
- `POST /api/admin/geography-providers/{provider}/import-countries`
- `POST /api/admin/geography-imports`

## Distinzione UX da mantenere

- `Importa nazioni` = popolamento globale tabella `countries`
- `Importa dati nazione` = gerarchia completa di una singola nazione (`regions/provinces/cities`)

Non mischiare i due flussi nella stessa CTA.
