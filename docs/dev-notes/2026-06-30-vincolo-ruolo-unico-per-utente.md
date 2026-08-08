# Dev Note - Vincolo ruolo unico per utente

Data: 2026-06-30  
Priorita': ALTA - problema RBAC attivo in produzione

Aggiornamento stato: 2026-07-01

---

## Problema originario

La tabella `user_facility_roles` permetteva a un utente di avere più record attivi
contemporaneamente sulla stessa struttura. Questo causava:

1. permessi ambigui
2. frontend confuso sul ruolo corrente
3. incoerenza tra stato UI e calcolo backend delle capabilities

---

## Stato attuale

Al **2026-07-01** il problema risulta **corretto backend + bonificato nel DB locale di lavoro**.

Interventi applicati:

### 1. Vincolo DB

Aggiunto unique index parziale sui record attivi:

```sql
CREATE UNIQUE INDEX uq_user_facility_roles_active
  ON user_facility_roles (user_id, facility_id)
  WHERE is_active = true;
```

### 2. Bonifica dati

La migrazione:

- disattiva record scaduti ma ancora attivi
- in caso di più ruoli attivi per `user_id + facility_id`, mantiene solo il più recente
- chiude gli altri come record storici non attivi

### 3. Validazione applicativa

La request backend blocca la creazione di un secondo ruolo attivo sulla stessa struttura.

### 4. `/auth/me`

L'endpoint profilo restituisce solo i ruoli attivi e non scaduti.

---

## Riferimenti tecnici

- `C:\Projects\FamilyHUB\backend\database\migrations\2026_06_30_231500_enforce_unique_active_user_facility_roles.php`
- `C:\Projects\FamilyHUB\backend\app\Http\Requests\Admin\AssignUserFacilityRoleRequest.php`
- `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\AuthController.php`
- `C:\Projects\FamilyHUB\backend\tests\Feature\UserFacilityRoleUniquenessApiTest.php`

---

## Stato della nota

Questa nota non e' più un problema aperto.

Va conservata come:

- traccia tecnica della correzione
- riferimento per futuri regressioni test

---

## Possibili miglioramenti futuri

Resta opzionale, ma utile, valutare:

- endpoint `DELETE /admin/user-facility-roles/{id}` per pulizie amministrative esplicite
- strumenti admin dedicati alla lettura dello storico ruoli per utente
