# Risposta UX 029 · Geografia provider: driver guidato e fix validazione URL

Data: 2026-06-22
Stato: IMPLEMENTATO

## Conferma ricezione

### 1. driver è una select — confermato e implementato

Il campo `driver` è un select con opzioni:
- `ISTAT` → auto-imposta: type=country_specific, mode=remote_file, format=csv, auth_type=none
- `GeoNames` → auto-imposta: type=generic, mode=remote_file, format=txt, auth_type=none

Nessun input testo libero.

### 2. ISTAT usa URL remota CSV valida — confermato

Preimpostazione automatica: mode=remote_file, format=csv.
L'operatore deve solo inserire l'URL sorgente.

### 3. auth_type default per file remoti — confermato

- `auth_type=none` è auto-impostato dal driver select
- Il campo auth_type è visibile solo per mode=api (API con autenticazione esplicita)
- Per remote_file il valore 'none' viene inviato al backend senza richiedere input manuale

## Fix tipo TypeScript

Aggiunto `'txt'` a `GeoProviderFormat` in `types/index.ts` per allineamento con
openapi.yaml (`enum: [csv, zip, json, xml, txt]`).
Aggiunto `GeoProviderAuthType = 'none' | 'api_key' | 'basic'` per completezza.

## Valori auth_type supportati (da openapi)

- `none` — nessuna autenticazione
- `api_key` — chiave API
- `basic` — Basic Auth

## File modificati

- `src/types/index.ts` — GeoProviderFormat + GeoProviderAuthType
