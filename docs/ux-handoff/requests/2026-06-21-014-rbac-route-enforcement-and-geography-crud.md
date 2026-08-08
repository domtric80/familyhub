# Richiesta UX 014 · Enforcement RBAC per route + CRUD geografia

Stato: READY_FOR_UX_IMPLEMENTATION
Data: 2026-06-21

## 1. Contesto

Il backend applica ora permission-check puntuali sulle route amministrative e minori.

In parallelo la pagina `Geografia` non è più read-only: espone CRUD gerarchico reale.

## 2. Fonte contrattuale

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 3. Impatto UX

### 3.1 Enforcement RBAC

Il team UX deve considerare che:

- un utente può vedere il menu ma ricevere `403` su route specifiche se il permesso manca
- tutte le chiamate CRUD amministrative devono gestire in modo esplicito il caso `403`
- la UI non deve mostrare messaggi generici; deve distinguere:
  - `403` permesso insufficiente
  - `409` vincolo di dipendenza
  - `422` validazione

### 3.2 Pagina geografia

La pagina:

- `/anagrafiche/geografia`

deve essere considerata pagina CRUD amministrativa attiva.

## 4. Pagina `Geografia`

### Layout obbligatorio

Vista gerarchica:

- nazione
  - regione
    - provincia
      - città

### CTA obbligatorie

- `Nuova nazione`
- `Nuova regione`
- `Nuova provincia`
- `Nuova città`
- `Modifica`
- `Elimina`

## 5. Form per livello

### Nazione

Campi:

- `iso_code`
- `name`

Endpoint:

- `GET /api/admin/countries`
- `POST /api/admin/countries`
- `PUT /api/admin/countries/{country}`
- `DELETE /api/admin/countries/{country}`

### Regione

Campi:

- `country_id`
- `code`
- `name`

Endpoint:

- `GET /api/admin/regions`
- `POST /api/admin/regions`
- `PUT /api/admin/regions/{region}`
- `DELETE /api/admin/regions/{region}`

### Provincia

Campi:

- `region_id`
- `code`
- `name`

Endpoint:

- `GET /api/admin/provinces`
- `POST /api/admin/provinces`
- `PUT /api/admin/provinces/{province}`
- `DELETE /api/admin/provinces/{province}`

### Città

Campi:

- `province_id`
- `name`
- `cadastre_code`
- `postal_code`

Endpoint:

- `GET /api/admin/cities`
- `POST /api/admin/cities`
- `PUT /api/admin/cities/{city}`
- `DELETE /api/admin/cities/{city}`

## 6. Errori UI obbligatori

### `403`

Mostrare:

- messaggio di permesso insufficiente
- nessun retry automatico

### `409`

Messaggi da gestire:

- nazione con regioni collegate
- regione con province collegate
- provincia con città collegate
- città con strutture collegate

### `422`

Visualizzare errori campo-per-campo

## 7. Checklist implementativa UX

- [ ] pagina geografia non più segnata come “backend bloccato”
- [ ] azioni CRUD attive per tutti i 4 livelli
- [ ] gestione `403`, `409`, `422`
- [ ] modali create/edit/delete coerenti con API

## 8. File risposta richiesto

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-21-014-rbac-route-enforcement-and-geography-crud-response.md`
