# Handoff UX/API - Riallineamento ruolo COORDINATORE su area admin e minori

Data: 2026-07-06  
Area: `Amministrazione`, `Minori`, `Assegnazioni minori`, `Utenti/Ruoli di struttura`  
Priorita: alta  
Tipo: fix backend + chiarimento comportamento

## 1. Problema risolto

Il ruolo `COORDINATORE` risultava troppo limitato per l'uso reale:

- non poteva creare un minore
- non poteva aggiornare correttamente dati anagrafici sensibili come il codice fiscale nel flusso operativo
- non poteva gestire assegnazioni minore
- non poteva entrare nelle API admin, anche quando aveva permessi coerenti

## 2. Causa tecnica

La limitazione era doppia:

### A. Matrice permessi troppo stretta

Nel seed RBAC il ruolo `COORDINATORE` non includeva i permessi necessari per:

- creazione minori
- lettura/creazione/aggiornamento assegnazioni minore
- lettura/creazione/aggiornamento utenti e ruoli di struttura
- creazione staff member

### B. Middleware `admin.api` troppo restrittivo

Il middleware consentiva accesso admin solo a:

- `SUPER_ADMIN`
- `ADMIN_IT`

Questo bloccava `COORDINATORE` e `REFERENTE_STRUTTURA` a monte, prima ancora dei controlli route-level.

## 3. Fix applicato

### Accesso area admin

Il middleware `admin.api` ora consente accesso anche a:

- `DIRETTORE`
- `COORDINATORE`
- `REFERENTE_STRUTTURA`

Resta comunque valido il controllo puntuale dei permessi su ogni route.

### Permessi aggiunti a `COORDINATORE`

- `users.create`
- `users.read`
- `users.update`
- `roles.read`
- `user_facility_roles.create`
- `user_facility_roles.read`
- `user_facility_roles.update`
- `user_facility_roles.revoke`
- `staff_members.create`
- `staff_members.read`
- `staff_members.update`
- `minor_user_assignments.create`
- `minor_user_assignments.read`
- `minor_user_assignments.update`
- `minor_user_assignments.revoke`
- `minors.create`
- `minors.read`
- `minors.update`
- `minor_profiles.read`
- `minor_profiles.update`

Il ruolo `REFERENTE_STRUTTURA` e stato riallineato allo stesso perimetro.

## 4. Impatto funzionale atteso nel frontend

Con utente che ha ruolo attivo `COORDINATORE` nella struttura:

- deve poter creare un minore
- deve poter modificare anagrafica minore, incluso `tax_code`
- deve poter aprire e usare la sezione assegnazioni minori
- deve poter assegnare utenti ai minori
- deve poter assegnare un ruolo di struttura a un utente, incluso `COORDINATORE`

## 5. Nota UX

Il frontend non deve più trattare `COORDINATORE` come ruolo solo operativo.

Va considerato un ruolo di coordinamento con accesso a funzioni amministrative di struttura, pur senza i privilegi globali di `SUPER_ADMIN`.

## 6. Verifica backend eseguita

Copertura test aggiunta:

- `tests/Feature/CoordinatorAdminAccessApiTest.php`

Il test verifica con ruolo `COORDINATORE`:

- creazione minore
- aggiornamento `tax_code`
- bulk sync assegnazioni minore
- assegnazione ruolo `COORDINATORE` a un altro utente della struttura
