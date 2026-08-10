# 2026-08-10 — Fix memoria pagina Educatori

## Problema
Aprendo `Educatori`, il frontend invocava `GET /api/lookups/cities` senza filtri.
Dopo l'import geografico GeoNames, il lookup città era diventato troppo pesante e il backend esauriva i 128 MB di memoria PHP.

## Root cause
- `EducatoriPage` caricava tutte le città in `Promise.all` all'avvio pagina.
- `LookupController::cities()` restituiva l'intero dataset città con relazioni `province.region.country`.

## Correzione applicata
- `LookupController::cities()` ora supporta ricerca controllata (`q`, `id`, `limit`, filtri geografici).
- senza filtri non restituisce più l'intero dataset, ma `[]`.
- `EducatoriPage` usa ora ricerca asincrona per `birth_city_id`.
- in modifica record, la città salvata resta risolta tramite parametro `id`.

## Verifica
- Test aggiunto: `backend/tests/Feature/CityLookupApiTest.php`
- Eseguito con successo in container Docker.
