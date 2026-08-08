# FamilyHub · Strategia provider geografia

Data: 2026-06-21

## Obiettivo

Gestire l'import geografico con logica semplice:

1. l'utente sceglie continente
2. l'utente sceglie nazione
3. il backend risolve il provider migliore
4. se esiste un provider paese-specifico attivo e default, usa quello
5. altrimenti usa un provider generico

## Modello dati

### `geography_providers`

Catalogo provider disponibili.

Campi principali:

- `code`
- `name`
- `type`
- `driver`
- `mode`
- `format`
- `source_path`
- `source_url`
- `auth_type`
- `auth_config_json`
- `priority`
- `is_active`

### `country_geography_provider`

Associazione provider ↔ nazione.

Campi principali:

- `country_id`
- `geography_provider_id`
- `is_default`
- `priority`
- `is_active`

## Regola di risoluzione

Per una nazione:

1. cercare provider associati attivi
2. ordinare per:
   - `is_default desc`
   - `priority asc`
3. se presente, usare il primo
4. se non presente, fallback su provider globali `type=generic` attivi ordinati per priorità

## Convenzione iniziale proposta

- `ISTAT` per Italia
- `GEONAMES` come fallback generale

## Modalità supportate

### `local_file`

Usare quando il provider legge un file locale.

Campi attesi:

- `source_path`
- `format`

### `remote_file`

Usare quando il provider scarica un file remoto.

Campi attesi:

- `source_url`
- `format`

### `api`

Usare quando il provider interroga un endpoint remoto.

Campi attesi:

- `source_url`
- `auth_type`
- `auth_config_json`

## Regola progettuale

La configurazione provider deve restare concreta e operativa.
Non usare JSON libero generico per descrivere il trasporto della sorgente se può essere espresso con campi espliciti.

## Nota importante

Questo documento definisce solo la base dati e la logica di risoluzione.
L'esecuzione dell'import per provider-specific driver sarà introdotta nello step successivo.

## Esecuzione on-demand

Endpoint operativo:

- `POST /api/admin/geography-imports`

Payload minimo:

- `country_id` oppure `country_iso_code`
- `provider_id` opzionale per override manuale

Logica:

1. il backend risolve la nazione
2. il backend risolve il provider attivo migliore
3. esegue l'import reale dal provider scelto
4. aggiorna le tabelle canoniche (`countries`, `regions`, `provinces`, `cities`)
5. registra un `geo_import_run` tecnico

Stato attuale:

- `ISTAT`: importa Italia con popolamento completo di regioni, province e citt?, leggendo da `source_path` o `source_url`
- `GEONAMES`: importa e aggiorna la sola anagrafica nazione; non fornisce ancora suddivisioni amministrative canoniche

