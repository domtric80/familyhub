# Educatori anagrafica + separazione da utenti/ruoli

- `Request ID`: 2026-06-28-039  
- `Stato`: OPEN  
- `OpenAPI aggiornata`: `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## 1. Contesto

È stata implementata l’anagrafica `Educatori` usando la tabella backend `staff_members`.

Scelta architetturale da rispettare:
- `Educatori` = anagrafica personale educativo
- `Utenti + Ruoli + Assegnazioni` = accesso software, permessi RBAC e ruolo logico applicativo

Quindi:
- non dobbiamo creare anagrafiche separate per tutti gli altri attori
- per gli altri attori si crea un utente, si assegna un ruolo e il software usa quello

## 2. Impatto frontend

- la route `/educatori` non deve più mostrare placeholder
- deve mostrare una vera anagrafica CRUD
- deve permettere collegamento opzionale a un `utente applicativo`
- non deve gestire i permessi di ruolo dentro la pagina educatori

## 3. Endpoint coinvolti

- `GET /api/admin/staff-members`
- `POST /api/admin/staff-members`
- `GET /api/admin/staff-members/{staff_member}`
- `PUT /api/admin/staff-members/{staff_member}`
- `DELETE /api/admin/staff-members/{staff_member}`

Endpoint di supporto usati dalla UI:
- `GET /api/admin/facilities`
- `GET /api/admin/users`
- `GET /api/lookups/cities`

## 4. Request da supportare

Payload `StaffMemberWrite`:
- `facility_id` obbligatorio
- `user_id` opzionale
- `employee_code` obbligatorio
- `first_name` obbligatorio
- `last_name` obbligatorio
- `birth_date` opzionale
- `birth_city_id` opzionale
- `tax_code` opzionale
- `email` opzionale
- `phone` opzionale
- `qualification` opzionale
- `status` opzionale

## 5. Response da visualizzare

Colonne lista:
- `employee_code`
- `first_name`
- `last_name`
- `facility.name`
- `user.first_name`
- `user.last_name`
- `qualification`
- `status`

## 6. Stati UI da gestire

- loading
- empty
- success create/update/delete
- validation error `422`
- forbidden `403`
- conflict `409` se l’educatore ha documenti collegati

## 7. Regole autorizzative

Permessi backend:
- `staff_members.read`
- `staff_members.create`
- `staff_members.update`
- `staff_members.delete`

## 8. Comportamento atteso

1. utente apre `Educatori`
2. filtra per struttura / stato
3. crea o modifica anagrafica educatore
4. può collegare facoltativamente un utente applicativo esistente
5. se serve dare accesso o ruolo logico, va nella sezione:
   - utenti
   - ruoli
   - assegnazioni

## 9. Checklist UX team

- [ ] placeholder rimosso
- [ ] lista CRUD presente
- [ ] filtri struttura/stato presenti
- [ ] select utente collegato presente
- [ ] nessuna UI di permessi dentro Educatori
- [ ] copy coerente con separazione anagrafica vs accesso software

## 10. Note backend

- controller: `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\Admin\StaffMemberController.php`
- request: `C:\Projects\FamilyHUB\backend\app\Http\Requests\Admin\StoreStaffMemberRequest.php`
- pagina frontend: `C:\Projects\FamilyHUB\frontend\src\pages\educatori\EducatoriPage.tsx`
