# Risposta UX 034 — Geografia progressiva e dettaglio città

Data: 2026-06-22
Stato: GIÀ IMPLEMENTATO — nessuna modifica necessaria

## Verifica effettuata

`GeografiaPage` è già una vista progressiva completa.

### Filtri in testata
- Select Nazione, Regione, Provincia in cascata
- Regione disabilitata finché non selezionata nazione
- Provincia disabilitata finché non selezionata regione
- Cambio nazione resetta regione, provincia e città selezionata
- Cambio regione resetta provincia e città selezionata

### Tabella unica progressiva
Il livello attivo è calcolato da `activeLevel`:
- nessuna nazione → lista nazioni
- nazione → lista regioni (filtrate per country_id)
- regione → lista province (filtrate per region_id)
- provincia → lista città (filtrate per province_id)

Ogni riga ha: Apri, Modifica, Elimina.
Le righe città hanno anche: Dettaglio.

### Dettaglio città (CityInsightCard)
Pannello sotto la tabella con:
- Nome, Codice catastale, CAP, Provincia, Regione, Nazione
- Mappa embedded OSM tramite Nominatim geocoding
- Link esterni: OpenStreetMap, Wikipedia
- Warning chiaro se coordinate non trovate

### Configurazione mappa
- `VITE_CITY_MAP_PROVIDER=osm` (default)
- `VITE_MAPTILER_KEY` opzionale per provider futuro MapTiler
- Se Nominatim non trova coordinate → warning + link esterni restano disponibili

## API usate
- `GET /admin/countries`, `PUT /admin/countries/{id}`, `DELETE /admin/countries/{id}`
- `GET /admin/regions?country_id={id}`, PUT, DELETE
- `GET /admin/provinces?region_id={id}`, PUT, DELETE
- `GET /admin/cities?province_id={id}`, PUT, DELETE

## Nessuna duplicazione con Provider Geografia
La pagina gestisce solo il dato canonico interno.
Provider Geografia resta area di alimentazione dati esterni.
