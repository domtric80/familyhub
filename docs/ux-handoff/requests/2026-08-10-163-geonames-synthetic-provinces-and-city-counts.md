# Handoff UX/API — GeoNames, province sintetiche e conteggi città

Data: 2026-08-10  
Destinatario: UX / Frontend  
Ambito: `Anagrafiche > Geografia`

## Contesto

Per alcune nazioni importate da GeoNames (es. Cameroon, ma anche alcune aree della Francia), il dataset **non fornisce sempre il livello provincia/admin2** per ogni città.

In questi casi il backend non perde il dato:
- crea/usa una provincia sintetica con `code = "00"`
- collega lì le città che non hanno una provincia GeoNames affidabile

## Nuovo comportamento backend

### Naming esplicito per i livelli sintetici

I record sintetici non si chiamano più:
- `Provincia 00`
- `Regione 00`

ma:
- `Provincia non classificata (GeoNames)`
- `Regione non classificata (GeoNames)`

Questo serve a evitare che l’utente pensi a un errore di import.

## Nuovi campi utili per la UI

### `GET /api/admin/regions?country_id={id}`
Ogni regione ora espone anche:
- `provinces_count`

### `GET /api/admin/provinces?region_id={id}`
Ogni provincia ora espone anche:
- `cities_count`

Inoltre l’elenco province è ordinato:
1. prima per `cities_count desc`
2. poi per `name asc`

Effetto pratico:
- la provincia sintetica con più città compare in alto
- in paesi come Cameroon l’utente trova subito il contenitore giusto

## Caso reale verificato

Esempio Cameroon:
- le città sono presenti nel DB
- molte sono aggregate in `Provincia non classificata (GeoNames)` perché GeoNames non valorizza `admin2`

Esempio reale:
- `Far North` → `Provincia non classificata (GeoNames)` → `2696` città
- `North` → `Provincia non classificata (GeoNames)` → `1634` città
- `West` → `Provincia non classificata (GeoNames)` → `1620` città

Quindi:
- import corretto
- visibilità da migliorare in UI

## Cosa deve fare UX

### Tabella Province
Mostrare una colonna:
- `N. città`

e valorizzarla con `cities_count`

### Etichetta province sintetiche
Se `code === "00"` oppure `name` contiene `non classificata (GeoNames)`:
- mostrare badge o hint tipo:
  - `Dato aggregato GeoNames`

### Hint utente consigliato
Se una provincia è sintetica:
- “GeoNames non fornisce la provincia amministrativa per tutte le città di questa area; i comuni sono raccolti in questo contenitore tecnico.”

### Tabella Regioni
Mostrare anche:
- `N. province`

usando `provinces_count`

## Obiettivo UX

L’utente non deve interpretare:
- `Provincia non classificata (GeoNames)`

come un bug,

ma come:
- contenitore tecnico di città importate correttamente da una sorgente esterna incompleta sul livello amministrativo intermedio.

