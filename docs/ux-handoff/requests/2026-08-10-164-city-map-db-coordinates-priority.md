# Handoff UX — mappa città con priorità coordinate DB

Data: 2026-08-10  
Destinatario: UX / Frontend  
Ambito: `Geografia`, `Dettaglio città`

## Comportamento richiesto

Per la visualizzazione mappa città, il frontend deve usare questo ordine:

1. **Coordinate già presenti nel DB** (`city.latitude`, `city.longitude`)
2. solo se mancanti, fallback a geocoding esterno (Nominatim / OSM)

## Motivo

Alcune città esistono nel database con coordinate affidabili provenienti da GeoNames, ma la ricerca testuale su OpenStreetMap non sempre restituisce o centra correttamente il risultato.

Esempio reale verificato:
- `Abtsee`
- coordinate DB presenti
- ricerca testuale OSM non affidabile

## Effetto atteso in UI

### Se coordinate DB presenti
- mostrare direttamente la mappa
- link OpenStreetMap verso coordinate (`mlat/mlon`), non solo ricerca testuale
- opzionale hint:
  - `Coordinate lette dal database geografico`

### Se coordinate DB assenti
- usare geocoding esterno
- opzionale hint:
  - `Coordinate stimate tramite geocoding esterno`

### Se geocoding fallisce e DB non ha coordinate
- mostrare fallback già esistente:
  - mappa non disponibile
  - link esterno OSM/Wikipedia

## Nota funzionale

Questo non cambia i dati salvati, migliora solo l'affidabilità della visualizzazione mappa.
