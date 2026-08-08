# Dev Note - Gap enforcement RBAC e audit permessi

Data: 2026-06-29  
Priorita': ALTA - segnalazione originaria da validare prima del collaudo

Aggiornamento stato: 2026-07-01

---

## Contesto originario

Durante i test operativi era emersa la percezione che un utente "admin" riuscisse a
creare minori anche senza permessi apparentemente assegnati nella matrice RBAC mostrata
dal frontend.

La nota originale ipotizzava:

1. bypass implicito lato backend
2. route senza middleware permessi
3. incoerenza tra matrice UI e controlli reali

---

## Stato verificato al 2026-07-01

La situazione oggi va letta in modo più preciso:

### 1. Il backend applica middleware permessi sulle route sensibili principali

Esempi già presenti:

- `POST /api/minors` -> `permission.api:minors.create`
- `GET /api/minors/{minor}` -> `permission.api:minor_profiles.read`
- `POST /api/exits` -> `permission.api:minor_exits.create`
- `POST /api/activities` -> `permission.api:minor_activities.create`
- `GET /api/admin/minors/{minor}/assigned-users` -> endpoint presente
- `GET /api/admin/users/{user}/assigned-minors` -> endpoint presente

Quindi la parte "endpoint non implementato / route senza controllo" della nota originaria
non è più corretta come fotografia attuale.

### 2. Il vero nodo era anche semantico, non solo tecnico

Molta confusione nasceva da:

- differenza tra ruoli privilegiati e ruoli normali
- necessità di assegnazione attiva al minore per alcuni moduli
- incoerenza storica tra stato frontend e record ruolo/struttura duplicati

Quest'ultimo punto è stato corretto con:

- vincolo ruolo unico attivo per struttura
- filtro `/auth/me` sui soli ruoli attivi

### 3. Lato minori, uscite e attività l'enforcement è stato ulteriormente irrigidito

Sono stati allineati:

- `minor_profiles.read`
- `minor_contacts.create/update`
- `minor_exits.read/create/update/delete`
- `minor_activities.read/create/update/delete`

con controllo permesso + regole di accesso al minore dove previsto.

---

## Cosa resta valido di questa nota

La nota resta utile come memoria di tre rischi reali:

1. **disallineamento tra frontend e backend sul significato dei ruoli**
2. **necessità di testare sempre con utenti non privilegiati**
3. **necessità di auditare chiaramente gli accessi sensibili**

---

## Cosa non è più corretto

Al 2026-07-01 non sono più corrette queste affermazioni della versione originaria:

- "`GET /api/admin/minors/{id}/assigned-users` -> 404"
- "`GET /api/admin/users/{id}/assigned-minors` -> 404"
- "`POST /api/admin/users/{user}/minor-assignments/bulk-sync` -> probabilmente 404"
- "le route operative `/api/minors` non hanno enforcement RBAC"

---

## Stato della nota

Questa nota non va più considerata come bug aperto puro.

Va riclassificata come:

- nota storica di allineamento RBAC
- riferimento per regressioni e collaudo

---

## Regressioni ancora consigliate

Restano comunque sensati questi test di regressione:

- utente non privilegiato senza `minors.create` -> `POST /api/minors` deve restituire `403`
- utente senza `minor_profiles.read` -> apertura scheda completa minore deve restituire `403`
- utente non assegnato al minore con `minor_exits.create` -> `POST /api/exits` deve restituire `403`
- utente non assegnato al minore con `minor_activities.create` -> `POST /api/activities` deve restituire `403`
- utente senza classificazione documentale adeguata -> preview/download documento sensibile deve restituire `403`

---

## Riferimenti correlati

- `C:\Projects\FamilyHUB\docs\dev-notes\2026-06-30-vincolo-ruolo-unico-per-utente.md`
- `C:\Projects\FamilyHUB\docs\qa\2026-06-29-checklist-rbac-accesso-minori.md`
