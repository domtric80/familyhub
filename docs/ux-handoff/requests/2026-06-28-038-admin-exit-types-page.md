# Pagina admin Tipi Uscita

- `Request ID`: 2026-06-28-038  
- `Stato`: OPEN  
- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 1. Contesto

È stata implementata lato frontend una nuova pagina amministrativa per l’anagrafica `Tipi Uscita`.

Questa anagrafica serve a evitare valori testuali liberi nei flussi operativi del modulo `Uscite`.

## 2. Impatto frontend

- nuova route: `/anagrafiche/tipi-uscita`
- nuova voce di menu in `Impostazioni > Minore > Tipi uscita`
- pagina CRUD completa con:
  - lista
  - creazione
  - modifica
  - eliminazione

## 3. Endpoint coinvolti

- `GET /api/admin/exit-types`
- `POST /api/admin/exit-types`
- `GET /api/admin/exit-types/{exit_type}`
- `PUT /api/admin/exit-types/{exit_type}`
- `DELETE /api/admin/exit-types/{exit_type}`

## 4. Request da supportare

Payload `OrderedLookupItemWrite`:
- `code` string obbligatorio
- `name` string obbligatorio
- `sort_order` integer opzionale
- `is_active` boolean opzionale

Vincoli UX:
- `code` deve essere mostrato come codice tecnico stabile
- `name` è la label utente
- `sort_order` governa l’ordine nei menu/select
- nessun altro campo libero va inventato

## 5. Response da visualizzare

Colonne tabella:
- `id`
- `code`
- `name`
- `sort_order`
- `is_active`

Azioni:
- modifica
- elimina

## 6. Stati UI da gestire

- loading
- empty
- success create/update/delete
- validation error `422`
- forbidden `403`
- conflict `409` se il tipo uscita è già usato da record operativi

## 7. Regole autorizzative

Permessi backend da rispettare:
- `exit_types.read`
- `exit_types.create`
- `exit_types.update`
- `exit_types.delete`

Il team UX deve verificare che:
- la pagina non mostri azioni distruttive se il permesso manca
- gli errori `403` e `409` siano visualizzati in modo chiaro

## 8. Comportamento atteso

1. utente apre `Impostazioni > Minore > Tipi uscita`
2. visualizza elenco ordinato
3. può creare un nuovo tipo
4. può modificarlo
5. può eliminarlo solo se non è già usato

## 9. Checklist UX team

- [ ] voce menu presente
- [ ] route collegata
- [ ] tabella CRUD presente
- [ ] modale create/edit presente
- [ ] conferma delete presente
- [ ] gestione `403`, `409`, `422`
- [ ] etichette coerenti con modulo `Uscite`

## 10. Note backend

- backend già pronto e operativo
- pagina frontend implementata in:
  - `C:\Projects\FamilyHUB\frontend\src\pages\anagrafiche\TipiUscitaPage.tsx`
- route applicativa:
  - `C:\Projects\FamilyHUB\frontend\src\App.tsx`
- menu:
  - `C:\Projects\FamilyHUB\frontend\src\layout\sidebar\menuItems.ts`
