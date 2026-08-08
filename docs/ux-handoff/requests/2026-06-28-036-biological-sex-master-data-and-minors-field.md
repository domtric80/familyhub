# Richiesta UX 036 — Sesso biologico anagrafico + campo minori

## Stato
- Backend esteso con nuova anagrafica `Sesso biologico`.
- Distinzione tassativa tra:
  - `Sesso biologico`
  - `Identità di genere`

## Nuove API
- `GET /lookups/biological-sexes`
- `GET /admin/biological-sexes`
- `POST /admin/biological-sexes`
- `GET /admin/biological-sexes/{biological_sex}`
- `PUT /admin/biological-sexes/{biological_sex}`
- `DELETE /admin/biological-sexes/{biological_sex}`

## Impatto frontend
### Anagrafica
- La pagina `Sesso biologico` non è più placeholder: ora usa API reali.
- I record hanno campi:
  - `code`
  - `name`
  - `sort_order`
  - `is_active`

### Form minore
- Nel form creazione/modifica minore aggiungere il campo select `Sesso biologico`.
- Il campo usa `GET /lookups/biological-sexes`.
- Il campo è:
  - opzionale
  - indipendente da `Identità di genere`
  - mai derivato automaticamente

### Dettaglio minore
- In anagrafica minore mostrare anche:
  - `Sesso biologico`
  - `Genere`
- I due valori devono apparire come righe distinte.

## Regole UX obbligatorie
- Non fondere mai i due concetti in una sola label.
- Non rinominare `Sesso biologico` in `Genere`.
- Non introdurre logiche automatiche tipo:
  - se sesso = X allora genere = Y
- Se il valore è nullo, mostrare stato vuoto pulito e non errore.

## Payload minori aggiornato
- `POST /minors`
- `PUT /minors/{minor}`

Campo nuovo:
- `biological_sex_id: integer|null`

## Verifica richiesta al team UX
Il team UX deve confermare esplicitamente che:
- la pagina anagrafica `Sesso biologico` usa le API reali
- il form minore mostra entrambi i campi separati
- il dettaglio minore mostra entrambi i valori separati
- nessuna logica automatica collega i due campi
