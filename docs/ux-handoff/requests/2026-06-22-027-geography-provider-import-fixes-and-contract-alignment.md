# Richiesta UX 027 · Geografia provider/import fix e riallineamento contratto

Data: 2026-06-22

## Stato

OPEN

## Priorità

ALTA

## Motivo

Sono stati corretti backend e frontend per eliminare due ambiguità operative nella sezione `Anagrafiche > Provider geografia`:

- errore in salvataggio su `Associazioni nazioni > Associa provider`
- import che poteva ricadere sul provider generico anche quando l’utente apriva il flusso dal provider specifico

## Fix applicati

### 1. Associazione provider a nazione

Backend ora accetta in scrittura sia:

- `geography_provider_id` (campo canonico)
- `provider_id` (alias frontend compatibile)

Inoltre:

- `country_id` viene normalizzato anche dalla route `/admin/countries/{country}/geography-providers`
- i messaggi di validazione sono leggibili lato UI

### 2. Import dalla tab provider

La tab `Import dati` ora deve comunicare esplicitamente:

- se l’utente è arrivato dal pulsante `Apri import` di una riga provider
- quale provider è forzato per l’import corrente
- che, cambiando nazione, il provider può essere ricalcolato

## Contratto API aggiornato

Riferimento ufficiale:

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

### Endpoint coinvolti

- `POST /api/admin/countries/{country}/geography-providers`
- `PUT /api/admin/countries/{country}/geography-providers/{provider}`
- `POST /api/admin/geography-imports`

### Schema aggiornato

Lo schema `CountryGeographyProvider` restituito dal backend non va interpretato come semplice provider con `pivot`, ma come oggetto applicativo con:

- `provider_id`
- `country_id`
- `is_default`
- `priority`
- `is_active`
- `config_override_json`
- `provider`
- `country`

## Cosa deve fare UX

### Tab `Associazioni nazioni`

- usare il contratto OpenAPI aggiornato
- mostrare errore leggibile se manca provider o nazione
- non assumere più una struttura `provider + pivot`

### Tab `Import dati`

- mostrare banner/stato “provider forzato” quando l’utente arriva dal pulsante della riga provider
- mantenere chiaro il flusso:
  - seleziona nazione
  - verifica provider risolto
  - esegui import
- non mostrare messaggi che facciano pensare a import completo se il provider supporta solo `Nazione`

## Verifica richiesta al team UX

Prima di implementare altre modifiche sulla sezione geografia, confermare di avere recepito correttamente:

1. shape reale di `CountryGeographyProvider`
2. distinzione tra `provider forzato` e `provider risolto da mapping`
3. regola che il provider generico, ad oggi, non deve essere rappresentato come capace di importare regioni/province/città
