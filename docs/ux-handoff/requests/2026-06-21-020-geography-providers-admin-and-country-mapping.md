# Richiesta UX 020 — Provider geografia e mapping provider-nazione

- `Request ID`: 2026-06-21-020
- `Stato`: OPEN
- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 1. Contesto

Il progetto introduce la gestione amministrativa dei provider geografia.

Obiettivo:

- poter definire provider multipli
- associarli a una nazione
- scegliere un provider specifico per l'Italia (es. ISTAT)
- usare un provider generico quando non esiste un provider paese-specifico

## 2. Impatto frontend

Va aggiunto un nuovo sottomenu sotto `Scarico geografia`:

- `Provider geografia`

Sono richieste almeno due pagine/moduli:

1. lista provider
2. mapping provider per nazione

## 3. Endpoint coinvolti

- `GET /api/admin/geography-providers`
- `POST /api/admin/geography-providers`
- `GET /api/admin/geography-providers/{provider}`
- `PUT /api/admin/geography-providers/{provider}`
- `DELETE /api/admin/geography-providers/{provider}`
- `GET /api/admin/countries/{country}/geography-providers`
- `POST /api/admin/countries/{country}/geography-providers`
- `PUT /api/admin/countries/{country}/geography-providers/{provider}`
- `DELETE /api/admin/countries/{country}/geography-providers/{provider}`

## 4. Nuove entità da esporre

### Provider geografia

Campi:

- `code`
- `name`
- `type` = `generic | country_specific`
- `driver`
- `mode` = `local_file | remote_file | api`
- `format` = `csv | zip | json | xml`
- `source_path`
- `source_url`
- `auth_type` = `none | api_key | basic`
- `auth_config_json`
- `priority`
- `is_active`
- `notes`

### Mapping nazione-provider

Campi pivot:

- `is_default`
- `priority`
- `is_active`

## 5. Pagine richieste

### A. Pagina `Provider geografia`

Posizione menu:

- `Anagrafiche`
  - `Scarico geografia`
  - `Provider geografia`

Titolo pagina:

- `Provider geografia`

Tab obbligatorie:

- `Provider`
- `Associazioni per nazione`

### B. Tab `Provider`

Tabella con colonne:

- `Codice`
- `Nome`
- `Tipo`
- `Driver`
- `Priorità`
- `Attivo`
- `Nazioni associate`
- `Azioni`

Azioni:

- `Nuovo provider`
- `Modifica`
- `Elimina`

Form provider:

- `Codice`
- `Nome`
- `Tipo`
- `Driver`
- `Modalità sorgente`
- `Formato`
- `Path locale`
- `URL sorgente`
- `Tipo autenticazione`
- `Config autenticazione JSON`
- `Priorità`
- `Attivo`
- `Note`

### C. Tab `Associazioni per nazione`

UX minima richiesta:

- select nazione
- tabella provider associati a quella nazione
- pulsante `Associa provider`

Tabella mapping:

- `Provider`
- `Tipo`
- `Default`
- `Priorità`
- `Attivo`
- `Override config`
- `Azioni`

Azioni:

- `Associa`
- `Modifica associazione`
- `Rimuovi associazione`
- `Imposta default`

Form associazione:

- `Nazione`
- `Provider`
- `Default`
- `Priorità`
- `Attivo`

## 6. Stati UI da gestire

- loading lista provider
- empty lista provider
- loading associazioni nazione
- empty associazioni nazione
- success create/update/delete
- validation error
- forbidden
- conflict su delete provider associato

## 7. Permessi

- `geography_providers.read`
- `geography_providers.create`
- `geography_providers.update`
- `geography_providers.delete`

## 8. Comportamento atteso

- se un provider è associato a nazioni, la delete può fallire con `409`
- una nazione può avere più provider
- uno solo può essere `default` alla volta
- il backend resetta automaticamente gli altri `default` della stessa nazione

## 9. Checklist UX team

- [ ] nuovo menu `Provider geografia`
- [ ] pagina lista provider
- [ ] CRUD provider completo
- [ ] pagina/section mapping provider-nazione
- [ ] gestione default per nazione
- [ ] errori `409` gestiti
- [ ] permessi applicati

## 10. Note backend

- questa richiesta copre il primo blocco architetturale provider
- il flusso di import vero e proprio userà poi questo mapping per risolvere il provider migliore dopo la scelta nazione
