# Richiesta UX 029 · Geografia provider: driver guidato e fix validazione URL

Data: 2026-06-22

## Stato

OPEN

## Priorità

ALTA

## Motivo

È emerso un problema funzionale importante nella configurazione provider geografia:

- una URL ISTAT corretta veniva rifiutata in salvataggio
- il campo `driver` era esposto come testo libero, ma in realtà rappresenta una capacità backend supportata e non deve essere digitato manualmente

## Correzione concettuale

### `driver`

`driver` non è una nota tecnica editabile liberamente.

È una scelta guidata fra driver backend supportati:

- `istat`
- `geonames`

La UI non deve mostrare un input testo libero per `driver`.

Deve mostrare un `select`.

## Effetto della scelta driver

Quando l’utente seleziona il driver, la UI deve precompilare/indirizzare:

### `ISTAT`

- `type = country_specific`
- `mode = remote_file` oppure altra modalità configurata dall’operatore
- `format = csv`
- `auth_type = none`

### `GeoNames`

- `type = generic`
- `mode = remote_file`
- `format = txt`
- `auth_type = none`

## Fix validazione

Per provider `remote_file` semplici, come ISTAT con CSV remoto:

- `auth_type` non deve più bloccare il salvataggio se non compilato manualmente
- la UI può considerare `none` come default implicito

## Implicazioni UX

Il form provider deve essere più guidato e meno “tecnico libero”.

### Obbligatorio

- `Driver` come select
- `Formato` coerente col driver
- `URL sorgente` chiaro
- `Tipo autenticazione` mostrato solo quando serve davvero o comunque con default comprensibile

### Da evitare

- campo testo libero per `driver`
- errori generici che fanno sembrare errata una URL valida quando il problema è un altro campo

## Riferimento API

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## Verifica richiesta al team UX

Confermare di aver recepito che:

1. `driver` è una select e non un campo testo
2. `ISTAT` usa normalmente URL remota CSV valida
3. `auth_type` di default per file remoti semplici è `none`
