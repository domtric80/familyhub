# FamilyHub · RBAC enforcement puntuale + CRUD geografia

Data: 2026-06-21

## 1. RBAC enforcement puntuale

È stato introdotto un middleware dedicato:

- `C:\Projects\FamilyHUB\backend\app\Http\Middleware\EnsureApiPermission.php`

Scopo:

- applicare permessi granulari per singola route API
- mantenere i middleware macro (`admin.api`, `minors.api`) come primo filtro
- aggiungere un secondo livello di enforcement basato su `permission code`

## 2. Strategia di controllo

Le route ora possono dichiarare:

- `permission.api:<resource.action>`

oppure:

- `permission.api:<resource.action>,<resolver>`

Il resolver serve a ricavare il `facility_id` quando il permesso è contestuale alla struttura.

Supportati:

- `request:facility_id`
- parametro route modellato con attributo `facility_id`

## 3. Moduli coperti

### Admin

Controlli puntuali aggiunti per:

- utenti
- ruoli
- matrice permessi
- assegnazioni utente-struttura-ruolo
- anagrafiche semplici
- geografia
- organizzazioni
- strutture

### Minori

Controlli puntuali aggiunti per:

- lettura minori
- creazione minori
- modifica minori
- profilo minore
- contatti minore
- upload documenti
- download documenti

## 4. Catalogo permessi esteso

Il seeder RBAC include ora anche:

- `document_types.*`
- `contact_types.*`
- `minor_statuses.*`
- `gender_identities.*`
- `geography.*`
- `roles.*`
- `role_permissions.read`
- `role_permissions.update`
- `user_facility_roles.*`
- `organizations.create`

## 5. CRUD geografia

Sono stati introdotti endpoint amministrativi per:

- nazioni
- regioni
- province
- città

con cancellazione protetta da `409 Conflict` quando esistono dipendenze figlie o riferimenti applicativi.

## 6. Frontend geografia

La pagina geografia è stata trasformata in pagina CRUD gerarchica:

- `C:\Projects\FamilyHUB\frontend\src\pages\anagrafiche\GeografiaPage.tsx`

Operazioni disponibili:

- crea nazione / regione / provincia / città
- modifica ogni livello
- elimina ogni livello con controllo dipendenze

## 7. Fonte contrattuale

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
