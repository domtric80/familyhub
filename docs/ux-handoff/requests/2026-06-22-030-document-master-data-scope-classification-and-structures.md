# Richiesta UX 030 · Anagrafiche documentali e strutture riallineate

Data: 2026-06-22

## Stato

OPEN

## Priorità

ALTA

## Motivo

Sono stati corretti tre problemi funzionali:

1. `Strutture` mancava nel perimetro operativo delle `Anagrafiche`
2. `Classificazioni documenti` era una pagina solo lettura
3. `Scope` nei `Tipi documento` era testo libero, quindi semanticamente pericoloso

## Decisioni applicate

### 1. Strutture

La pagina strutture è raggiungibile anche da:

- `Anagrafiche > Strutture`

Non solo da:

- `Amministrazione > Strutture`

### 2. Classificazioni documenti

Le classificazioni documentali non sono più da considerare configurazione backend non editabile.

Ora esiste una vera anagrafica CRUD dedicata, con:

- codice
- nome
- descrizione
- ruoli ammessi
- stato attivo/disattivo

### 3. Scope documento

`Scope` non è più un input testuale nel form `Tipi documento`.

Ora è una anagrafica dedicata selezionabile.

Questo evita varianti libere come:

- `minore`
- `minor`
- `min`
- ecc.

## Nuove anagrafiche

### Scope documento

Nuova anagrafica:

- `Anagrafiche > Scope documento`

Campi:

- `code`
- `name`
- `description`
- `is_active`

### Classificazioni documentali

Campi:

- `code`
- `name`
- `description`
- `allowed_role_codes`
- `is_active`

## Impatti UI obbligatori

### Tipi documento

Nel form:

- `Scope` deve essere `select`
- le opzioni arrivano da lookup / anagrafica `document scopes`

### Classificazioni documentali

La pagina deve essere CRUD reale, non informativa.

Per i ruoli ammessi:

- usare selezione multipla guidata
- non usare testo libero

## Contratti API da usare

Riferimento ufficiale:

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

Endpoint principali:

- `GET /api/lookups/document-scopes`
- `GET /api/admin/document-scopes`
- `POST /api/admin/document-scopes`
- `PUT /api/admin/document-scopes/{document_scope}`
- `DELETE /api/admin/document-scopes/{document_scope}`
- `GET /api/admin/document-classifications`
- `POST /api/admin/document-classifications`
- `PUT /api/admin/document-classifications/{document_classification}`
- `DELETE /api/admin/document-classifications/{document_classification}`

## Verifica richiesta al team UX

Confermare di aver recepito che:

1. `scope` non è più testo libero
2. `classificazioni documentali` è una anagrafica CRUD
3. `strutture` è anche una voce di lavoro nel gruppo `Anagrafiche`
