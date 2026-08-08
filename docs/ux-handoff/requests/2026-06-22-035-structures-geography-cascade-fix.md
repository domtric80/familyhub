# Richiesta UX 035 — Fix cascata geografica in anagrafica strutture

## Problema da correggere
- Nel form `Modifica struttura`, dopo la selezione di una regione venivano mostrate province di altre regioni.
- Il form deve usare la stessa cascata coerente adottata in `Minori` e `Geografia`.

## Regola obbligatoria
- I select sono vincolati gerarchicamente:
  - `Nazione -> Regione -> Provincia -> Città`

## Comportamento richiesto
- `Nazione` carica solo le regioni di quella nazione
- `Regione` carica solo le province di quella regione
- `Provincia` carica solo le città di quella provincia
- Al cambio del valore padre, tutti i figli si resettano

## API da usare
- `GET /admin/regions?country_id={id}`
- `GET /admin/provinces?region_id={id}`
- `GET /admin/cities?province_id={id}`

## Verifica UX
- Testare almeno questi casi:
  - `Italia -> Lazio` mostra solo province del Lazio
  - `Francia` non mostra regioni italiane
  - il cambio nazione resetta regione, provincia e città
