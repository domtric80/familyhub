# Bug report — CountryController@index() → HTTP 500

Data: 2026-08-10
Segnalato da: UX / Frontend
Destinatario: Backend (Codex)
Priorità: Alta — blocca la pagina Geografia

---

## Problema

`GET /api/admin/countries` restituisce HTTP 500.

La pagina **Anagrafiche › Geografia** non riesce a caricare la lista nazioni.

---

## Causa individuata

`CountryController::index()` esegue un eager loading completo di tutta la gerarchia geografica:

```php
// ❌ Attuale
Country::query()->with('regions.provinces.cities')->orderBy('name')->get()
```

Con 252 nazioni e migliaia di città per nazione (importate via GeoNames), questa query genera una risposta da centinaia di MB e causa un out-of-memory sul server.

---

## Fix richiesto

Rimuovere l'eager loading dall'endpoint lista nazioni. Il frontend carica regioni/province/città in chiamate separate e progressive (level-by-level), quindi il nesting non serve qui.

```php
// ✅ Corretto
Country::query()->orderBy('name')->get()
```

---

## Contesto

- Import GeoNames eseguito con successo: 252 nazioni, migliaia di città importate
- Endpoint `POST /admin/geography-providers/{id}/import-countries` funziona correttamente
- Solo `GET /admin/countries` è rotto

---

## Impatto frontend

Fino al fix, la pagina Geografia mostra "Errore caricamento (HTTP 500)".
Anche i dropdown nazioni in ProviderGeografiaPage e altri moduli che usano `adminCountryApi.list()` non funzionano.
