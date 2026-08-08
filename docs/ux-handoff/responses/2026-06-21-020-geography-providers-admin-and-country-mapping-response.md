# Risposta UX 020 — Provider geografia e mapping provider-nazione

## Stato
Implementato ✅ — `tsc --noEmit` 0 errori

---

## File toccati

| File | Modifica |
|------|----------|
| `src/types/index.ts` | Aggiunti `GeoProvider`, `GeoProviderWrite`, `CountryProviderMapping`, `CountryProviderMappingWrite`, `GeoProviderType` |
| `src/services/api.ts` | Aggiunto `adminGeoProvidersApi` con 8 metodi |
| `src/pages/anagrafiche/ProviderGeografiaPage.tsx` | **Nuova pagina** con due tab |
| `src/App.tsx` | Route `/anagrafiche/provider-geografia` |
| `src/layout/sidebar/menuItems.ts` | Voce menu "Provider geografia" |

---

## Route e menu

```
/anagrafiche/provider-geografia  →  ProviderGeografiaPage
```

Menu (visibile con `geography_providers.read`):
- Scarico geografia
- Provider geografia ← nuovo

---

## API usate

| Metodo | Endpoint | Quando |
|--------|----------|--------|
| GET | `/admin/geography-providers` | Mount pagina |
| POST | `/admin/geography-providers` | Nuovo provider |
| PUT | `/admin/geography-providers/{id}` | Modifica provider |
| DELETE | `/admin/geography-providers/{id}` | Elimina provider |
| GET | `/admin/countries/{id}/geography-providers` | Cambio nazione nel tab Associazioni |
| POST | `/admin/countries/{id}/geography-providers` | Associa provider |
| PUT | `/admin/countries/{id}/geography-providers/{pid}` | Modifica associazione |
| DELETE | `/admin/countries/{id}/geography-providers/{pid}` | Rimuovi associazione |

---

## Tab Provider

Tabella con colonne: Codice, Nome, Tipo, Driver, Priorità, Attivo, Nazioni associate, Azioni.

CRUD completo via modal:
- Form: codice, nome, tipo (select generic/country_specific), driver, priorità, attivo, config JSON (textarea monospace con validazione), note
- Delete con avviso: se provider ha nazioni associate, il backend ritorna 409 → toast.error esplicito

---

## Tab Associazioni per nazione

- Select nazione in cima (lista da `GET /admin/countries`)
- Tabella mapping: Provider, Tipo, Default, Priorità, Attivo, Override config, Azioni
- Modal associazione: provider (select), priorità, checkbox default + attivo, config override JSON
- Nel modal di modifica, il provider è in sola lettura (campo disabilitato)
- Il backend resetta automaticamente gli altri default della stessa nazione quando si imposta `is_default: true`

---

## Permessi applicati

| Operazione | Permesso |
|------------|----------|
| Visibilità pagina | `geography_providers.read` |
| Nuovo/Associa | `geography_providers.create` |
| Modifica | `geography_providers.update` |
| Elimina/Rimuovi | `geography_providers.delete` |

---

## Gestione stati

| Stato | Gestione |
|-------|----------|
| loading provider | Spinner centrato |
| empty provider | Alert info |
| error provider | Alert danger |
| loading nazione mappings | Spinner centrato |
| empty mappings | Alert info |
| 409 su delete provider | toast.error con messaggio esplicito |
| JSON config non valido | `Input invalid` + FormFeedback inline |
| forbidden | Alert warning su intera pagina |
