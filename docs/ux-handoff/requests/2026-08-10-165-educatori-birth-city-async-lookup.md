# 165 — Educatori: lookup città nascita asincrono

## Contesto
La pagina `Educatori` non deve più caricare l'intero archivio città all'apertura. Con GeoNames il dataset è troppo grande e causava errore backend `Allowed memory size exhausted`.

## Cosa cambia per UX
- Il campo `Città nascita` non è più una select completa precaricata.
- Ora è composto da:
  - input testuale di ricerca
  - select risultati caricata dinamicamente
- La ricerca parte quando l'utente scrive almeno 2 caratteri.
- Il backend restituisce al massimo 25 risultati per query.
- In modifica record, la città già salvata viene comunque precaricata e mantenuta selezionabile.

## Comportamento API
Endpoint: `GET /api/lookups/cities`

Parametri supportati:
- `q`: testo di ricerca su nome città
- `id`: forza il caricamento della città già selezionata
- `limit`: massimo risultati (backend clamp 1..100, default 25)
- `province_id` / `region_id` / `country_id`: filtri opzionali supportati dal backend

Regole:
- senza filtri e senza query -> `[]`
- con `id` -> restituisce la città selezionata
- con `q` -> restituisce elenco ridotto per ricerca

## Impatto atteso frontend
- Nessun preload massivo di città
- Nessuna dipendenza da cache locale completa
- UX più chiara anche su dataset geografici molto grandi
