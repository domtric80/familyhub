# Risposta UX 032 · Cascata geografica nei form minori

Data: 2026-06-22
Stato: GIÀ IMPLEMENTATO — nessuna modifica necessaria

## Verifica effettuata

`MinoreFormPage` ha già la cascata completa:
- Nazione di nascita
- Regione di nascita (disabilitata finché non selezionata nazione)
- Provincia di nascita (disabilitata finché non selezionata regione)
- Città di nascita (filtrata per province_id)

Cambio padre resetta i figli: al cambio nazione → region_id=null, province_id=null,
birth_city_id=null. Stesso pattern a ogni livello.

API usata per città: `adminCityApi.list(provinceId)` → `GET /api/admin/cities?province_id={id}`

## Placeholder

I placeholder mostrati corrispondono allo stato del parent:
- nazione non selezionata → "Seleziona prima una nazione"
- regione non selezionata → "Seleziona prima una regione"
- provincia non selezionata → "Seleziona prima una provincia"

## Nessuna lista globale

La città non viene mai mostrata come lista globale fuori contesto provincia.
