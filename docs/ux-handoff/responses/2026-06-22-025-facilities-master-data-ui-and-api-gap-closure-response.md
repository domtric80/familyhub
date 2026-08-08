# Risposta UX 025 · Facilities master data UI and API gap closure

Data: 2026-06-22
Stato: IMPLEMENTATO

## Cosa è stato fatto

StrutturePage riscritta con cascata geografica completa e tabella arricchita.

## Cascata geografica nel form

Nazione → Regione → Provincia → Città.
API usate: adminCountryApi.list(), adminRegionApi.list(countryId),
adminProvinceApi.list(regionId), adminCityApi.list(provinceId).
Ogni livello è disabilitato finché il parent non è selezionato.
Cambio parent resetta i livelli figli. Loading state per-livello.

## Tabella

Aggiornata con colonne: Regione (city.province.region.name),
Provincia (city.province.name), Città (city.name).

## Edit/Delete — stato al momento dell'implementazione

PUT/DELETE /facilities/{id} non erano ancora disponibili alla data 025.
I pulsanti erano disabilitati con banner esplicito. Sbloccati con task 026.

## Nota

Nessuna promessa di funzionalità per endpoint non disponibili.
