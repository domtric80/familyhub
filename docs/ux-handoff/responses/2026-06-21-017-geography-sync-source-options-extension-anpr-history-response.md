# Response — UX Handoff 017: Estensione sorgenti console sync con storico ANPR

**Data:** 2026-06-21  
**Handoff:** 017  
**Stato:** ✅ Implementato

---

## Modifiche applicate

**File:** `src/pages/anagrafiche/GeografiaSyncPage.tsx`

### Select sorgente aggiornato

Opzioni presenti nel modal "Avvia verifica":

| Valore inviato | Label visualizzata |
|---|---|
| `` (vuoto) | Tutte (default) |
| `geonames` | geonames |
| `seed` | seed |
| `istat` | istat |
| `anpr_history` | Storico ANPR |

### Auto-scope per `anpr_history`

Quando l'utente seleziona "Storico ANPR", il campo scope viene automaticamente impostato a `history_only`:

```ts
onChange={(e) => {
  const src = e.target.value || null
  setAvviaForm((p) => ({
    ...p,
    source: src,
    scope: src === 'anpr_history' ? 'history_only' : p.scope,
  }))
}}
```

L'utente può comunque sovrascrivere manualmente lo scope dopo la pre-selezione.

### Select scope (invariato, già presente)

Opzioni: `full`, `italy_admin_seed`, `italy_admin_csv`, `history_only`, vuoto = tutti.

---

## Verifica

- Valore inviato al backend: `"source": "anpr_history"` ✅
- Label visualizzata: `Storico ANPR` ✅
- Auto-scope: `history_only` ✅
- Nessuna regressione sulle altre opzioni ✅
- `npx tsc --noEmit` → 0 errori ✅
