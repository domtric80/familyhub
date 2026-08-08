# Richiesta UX 025 · Anagrafiche strutture e chiusura gap UI/API

Data: 2026-06-22

## Stato

OPEN

## Priorità

ALTA

## Obiettivo

Completare la gestione anagrafica delle strutture.

Le strutture non sono una semplice lista.
Sono un’anagrafica chiave del dominio applicativo.

## Stato attuale rilevato

### Frontend

Pagina esistente:

- `C:\Projects\FamilyHUB\frontend\src\pages\admin\StrutturePage.tsx`

Problemi attuali:

- usa un select città piatto, non una cascata geografica
- mostra avvisi che modifica/elimina non sono disponibili
- presenta CRUD percepito come completo ma backend è solo parziale
- colonne lista ancora troppo povere per uso amministrativo

### Backend

Controller:

- `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\Admin\FacilityController.php`

Stato endpoint:

- `GET /api/admin/facilities` → presente
- `POST /api/admin/facilities` → presente
- `PUT /api/admin/facilities/{id}` → non presente
- `DELETE /api/admin/facilities/{id}` → non presente

## Obiettivo UX corretto

La pagina `Strutture` deve supportare chiaramente:

1. elenco strutture
2. creazione struttura
3. modifica struttura
4. disattivazione / eliminazione struttura
5. selezione geografica certa

## Campi anagrafici struttura

### Già presenti

- `organization_id`
- `code`
- `name`
- `address_line`
- `city_id`
- `postal_code`
- `capacity`
- `status`

## Comportamento geografico obbligatorio

La scelta località non deve essere un semplice select città globale.

Serve una cascata:

1. `Nazione`
2. `Regione`
3. `Provincia`
4. `Città`

### Motivazione

Serve coerenza:

- con la geografia canonica importata da provider
- con i dati dei minori
- con i documenti e i riferimenti amministrativi

## Pagina `Strutture`

### Tabella elenco

Colonne obbligatorie:

- `Codice`
- `Nome struttura`
- `Organizzazione`
- `Nazione`
- `Regione`
- `Provincia`
- `Città`
- `Indirizzo`
- `CAP`
- `Capienza`
- `Stato`
- `Azioni`

### Azioni riga

- `Modifica`
- `Disattiva`
- `Elimina`

## Form struttura

Campi obbligatori:

- `Organizzazione`
- `Codice`
- `Nome struttura`
- `Nazione`
- `Regione`
- `Provincia`
- `Città`
- `Indirizzo`
- `CAP`
- `Capienza`
- `Stato`

### Stati suggeriti

- `attiva`
- `sospesa`
- `chiusa`

## UX states

- loading lista
- empty lista
- success create
- success update
- success delete/disattiva
- validation error
- forbidden
- conflict se struttura collegata a record che impediscono eliminazione

## Gap backend da evidenziare

Il team frontend non deve simulare un CRUD completo se il backend non lo offre davvero.

Serve allineamento con backend per introdurre:

- `PUT /api/admin/facilities/{id}`
- `DELETE /api/admin/facilities/{id}`

## API attuali utilizzabili

- `GET /api/admin/facilities`
- `POST /api/admin/facilities`
- `GET /api/admin/organizations`
- `GET /api/lookups/geography`

## API/contratti aggiuntivi richiesti

Per supportare bene la cascata geografica strutture il frontend deve poter usare:

- nazioni
- regioni filtrate per nazione
- province filtrate per regione
- città filtrate per provincia

Se questi endpoint/filtri sono già presenti, usarli.
Se non sono sufficienti, il team backend completerà i contratti.

## Deliverable richiesto al team UX/frontend

- [ ] redesign pagina strutture come vera anagrafica
- [ ] lista con colonne amministrative complete
- [ ] form struttura con cascata geografica
- [ ] nessuna promessa di modifica/eliminazione se API assenti
- [ ] preparazione UI pronta a usare update/delete appena backend li espone
