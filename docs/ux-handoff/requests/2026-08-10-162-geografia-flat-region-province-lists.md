# Handoff UX/API — Geografia lista piatta regioni/province per dataset grandi

Data: 2026-08-10  
Destinatario: UX / Frontend  
Ambito: `Anagrafiche > Geografia`

## Problema osservato

Dopo import GeoNames di nazioni grandi (es. Francia), il backend aveva ancora endpoint lista gerarchici troppo pesanti:
- `GET /api/admin/regions?country_id=...`
- `GET /api/admin/provinces?region_id=...`

Le risposte includevano relazioni annidate non necessarie:
- regioni con `provinces.cities`
- province con `cities`

Effetto pratico:
- la UI poteva restare vuota o sembrare bloccata anche se i dati erano presenti nel DB
- il problema era più evidente con nazioni grandi importate da GeoNames

## Stato backend corretto

Ora gli endpoint lista sono **flat**:

### `GET /api/admin/regions?country_id={id}`
Ritorna:
- regione
- relazione `country`

Non ritorna più:
- `provinces`
- `cities`

### `GET /api/admin/provinces?region_id={id}`
Ritorna:
- provincia
- relazione `region.country`

Non ritorna più:
- `cities`

## Cosa deve aspettarsi UX

La pagina `Geografia` deve continuare a lavorare in caricamento progressivo:
1. carica nazioni
2. selezione nazione ? carica regioni
3. selezione regione ? carica province
4. selezione provincia ? carica città

Nessuna lista deve aspettarsi dati figli già annidati nella risposta.

## Nota importante

Verifica reale sul database attuale:
- `France` presente
- `regions = 13`
- `provinces = 109`
- `cities = 78571`

Quindi se la UI ancora non mostra i dati dopo questo fix, il punto da controllare lato frontend è:
- gestione errori silenziosi nei loader `loadRegions()` / `loadProvinces()`
- refresh dello stato dopo selezione nazione/regione
