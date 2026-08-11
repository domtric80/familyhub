# Fix — CasoMinoreTab: cascade geografica nazione/regione/provincia/città

Data: 2026-08-10  
File: `frontend/src/pages/minori/tabs/CasoMinoreTab.tsx`  
Tipo: Bug fix  
Da includere in: Release Notes

---

## Problema

Nel tab **Caso** della scheda minore, il campo "Nazione di ingresso" risultava vuoto: nessuna nazione selezionabile.

---

## Causa

Il componente chiamava `lookupsApi.geography()` → `GET /lookups/geography`, che tenta di restituire l'intera gerarchia geografica annidata (nazioni → regioni → province → città). Con 252 nazioni e migliaia di città importate via GeoNames, la chiamata causava un timeout/OOM sul backend (stessa radice del bug già segnalato su `GET /admin/countries` con eager loading).

L'errore veniva silenziosamente ingoiato dal `.catch(() => {})`, lasciando `geography = []` e quindi nessuna opzione nel select.

---

## Fix

Sostituito il caricamento monolitico con un pattern a livelli (lo stesso già usato in `GeografiaPage`):

| Evento | Chiamata API |
|---|---|
| Apertura form | `GET /admin/countries` (solo nazioni, flat) |
| Selezione nazione | `GET /admin/regions?country_id={id}` |
| Selezione regione | `GET /admin/provinces?region_id={id}` |
| Selezione provincia | `GET /admin/cities?province_id={id}` |

**Pre-popolamento in edit:** quando esiste già un `entry_city_id`, il frontend chiama `GET /admin/cities/{id}` per ottenere la città con le relazioni `province → region → country` annidate, poi carica i livelli in cascata per pre-selezionare correttamente i dropdown.

---

## Azioni richieste a sviluppo

### 1. Verificare risposta di `GET /admin/cities/:id`

Il pre-popolamento in edit dipende da questa risposta:

```json
{
  "id": 63282,
  "name": "Milano",
  "province_id": 1,
  "province": {
    "id": 1,
    "name": "Milano",
    "region_id": 5,
    "region": {
      "id": 5,
      "name": "Lombardia",
      "country": {
        "id": 37,
        "name": "Italy"
      }
    }
  }
}
```

Se l'endpoint non restituisce le relazioni annidate `province.region.country`, il pre-popolamento si azzera silenziosamente e l'utente deve riselezionare manualmente. Verificare che il controller carichi le relazioni necessarie.

### 2. Deprecare `GET /lookups/geography`

L'endpoint restituisce l'intera gerarchia geografica annidata — non scalabile con grandi dataset. Valutare se deprecarlo o limitarlo a un sottoinsieme (es. solo Italia).

---

## Release Notes

> **Fix tab Caso — selezione città di ingresso:** il menu a tendina "Nazione di ingresso" ora si popola correttamente. Il problema era causato da un endpoint geografico che tentava di restituire l'intera gerarchia mondiale in una singola risposta, causando un errore silenziato. La selezione avviene ora a livelli progressivi (nazione → regione → provincia → città).
