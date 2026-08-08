# Richiesta UX 021 ? Import geografia on-demand per nazione

Data: 2026-06-21

## Obiettivo

Sostituire il flusso operativo basato su `run`/`dataset` con un flusso comprensibile:

1. selezione continente
2. selezione nazione
3. visualizzazione provider risolto
4. avvio import

## Endpoint backend

### Avvio import

- `POST /api/admin/geography-imports`

Body:

```json
{
  "country_id": 1
}
```

Oppure:

```json
{
  "country_iso_code": "IT"
}
```

Override manuale provider:

```json
{
  "country_id": 1,
  "provider_id": 2
}
```

## Contratto response

```json
{
  "message": "Import geografico completato.",
  "data": {
    "country": {
      "id": 1,
      "iso_code": "IT",
      "name": "Italia"
    },
    "provider": {
      "id": 2,
      "code": "ISTAT",
      "name": "ISTAT Italia",
      "driver": "istat",
      "mode": "local_file",
      "format": "csv"
    },
    "run": {
      "id": 14,
      "status": "completed",
      "scope": "on_demand_country",
      "summary": {}
    },
    "raw": {
      "countries": 1,
      "regions": 20,
      "provinces": 107,
      "cities": 7904
    },
    "loaded": {
      "countries": 1,
      "regions": 20,
      "provinces": 107,
      "cities": 7904
    },
    "warning": null
  }
}
```

## Regole UX obbligatorie

- Non mostrare pi? come scelta primaria il selettore `run`.
- Non chiedere all?utente di capire `dataset amministrativo`, `run #7`, `seed`, `full`.
- L?azione primaria ?: `Importa dati della nazione selezionata`.
- Mostrare sempre il provider effettivamente usato nel riepilogo risultato.
- Se il backend ritorna `warning`, mostrarlo come alert informativo.
- Se il backend ritorna `422`, mostrare il messaggio testuale senza reinterpretazioni.

## Copy minima suggerita

- Titolo pagina: `Import geografia`
- Campo 1: `Continente`
- Campo 2: `Nazione`
- Riepilogo provider: `Provider utilizzato`
- CTA primaria: `Importa nel database`

## Permessi

- Visibilit? pagina / esecuzione: `geography_sync.run`

## Nota importante

Per ora il backend supporta:

- Italia con provider `ISTAT` e popolamento completo di regioni/province/citt?
- altre nazioni con provider generico `GEONAMES` e aggiornamento della sola anagrafica nazione

La UX non deve promettere funzionalit? di livello regionale/provinciale/citt? per provider generici se il backend non le espone.
