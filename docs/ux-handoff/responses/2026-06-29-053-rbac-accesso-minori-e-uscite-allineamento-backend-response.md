# Risposta UX 053 · Allineamento RBAC, accesso minori e modulo Uscite

Data: 2026-06-29  
Stato: IMPLEMENTATO

## 1. Checklist

- [x] Parsing `response.assignments` già corretto nel layer API (non è necessaria modifica)
- [x] Fallback su `/admin/minor-assignments?minor_id=X` ancora attivo come retrocompatibilità
- [x] Messaggio 403 su UscitePage aggiornato con formula che copre entrambe le cause
- [x] Regole RBAC + assegnazione attiva documentate per il team QA

---

## 2. Stato attuale parsing assegnazioni

**File:** `frontend/src/services/api.ts` — `minorAssignmentApi.assignedUsers` e `assignedMinors`

Il parsing leggeva già `response.assignments` tramite i tipi `MinorAssignedUsersResponse` e
`UserAssignedMinorsResponse`. Il codice attuale è:

```ts
// GET /admin/minors/{minor}/assigned-users → { minor, assignments[] }
const r = await http.get<MinorAssignedUsersResponse>(`/admin/minors/${minorId}/assigned-users`)
return Array.isArray(r.data?.assignments) ? r.data.assignments : []
```

```ts
// GET /admin/users/{user}/assigned-minors → { user, assignments[] }
const r = await http.get<UserAssignedMinorsResponse>(`/admin/users/${userId}/assigned-minors`)
return Array.isArray(r.data?.assignments) ? r.data.assignments : []
```

Il fallback su `/admin/minor-assignments?minor_id=X` entra solo su `404`, mai su risposta
valida del nuovo endpoint. Ora che il backend ha implementato gli endpoint aggregati, il
fallback non viene più attivato per le assegnazioni.

---

## 3. Regola di accesso al minore (sintesi per QA)

Il backend applica due livelli in sequenza:

1. **RBAC** — il ruolo dell'utente deve possedere il permesso richiesto per la struttura
2. **Assegnazione attiva al minore** — l'utente deve avere una riga in `minor_user_assignments`
   con `is_active = true`, `valid_from <= oggi`, `valid_to IS NULL OR valid_to >= oggi`

Fanno eccezione i ruoli privilegiati configurati lato backend:
- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

Questi ruoli bypossano il secondo livello (assegnazione puntuale) ma non il primo (RBAC).

---

## 4. Modulo Uscite — messaggio 403

**File:** `frontend/src/pages/uscite/UscitePage.tsx` — `handleSave` catch block

Prima della modifica:
```ts
setSaveError(err.message ?? 'Errore salvataggio uscita')
```

Dopo la modifica (task 053):
```ts
// 403 può significare permesso mancante OPPURE assegnazione al minore non attiva.
// Il backend non distingue i due casi nello status code, quindi usiamo un messaggio
// esplicito che copre entrambe le cause.
const msg = err.status === 403
  ? 'Operazione non consentita: verifica permessi di ruolo e assegnazione attiva al minore.'
  : (err.message ?? 'Errore salvataggio uscita')
setSaveError(msg)
```

Il messaggio appare nel banner rosso del form modale dell'uscita, sopra i campi.

---

## 5. Permessi richiesti dal modulo Uscite

| Operazione              | Permesso RBAC         |
|-------------------------|-----------------------|
| Visualizzazione uscita  | `minor_exits.read`    |
| Creazione uscita        | `minor_exits.create`  |
| Modifica / transizioni  | `minor_exits.update`  |
| Eliminazione            | `minor_exits.delete`  |

Oltre al permesso, il backend richiede assegnazione attiva al minore (salvo ruoli privilegiati).

---

## 6. Note per i test QA

**Non usare `admin@familyhub.local` per testare i limiti operativi.** L'utente bootstrap
è `SUPER_ADMIN` e bypassa il controllo di assegnazione al minore — i test darebbero sempre
esito permissivo, falsando i risultati.

Utenti consigliati per testare i limiti:
- `EDUCATORE` — deve avere assegnazione attiva al minore per operare
- `PSICOLOGO`
- `ASSISTENTE_SOCIALE_EST`

Casi da verificare:
- educatore assegnato con `minor_exits.create` → `POST /api/minor-exits` → `201`
- educatore non assegnato con `minor_exits.create` → `POST /api/minor-exits` → `403`
  (frontend mostra: "Operazione non consentita: verifica permessi di ruolo e assegnazione attiva al minore.")
- scheda `Minore > Accesso al minore` coerente con `Amministrazione > Assegnazioni Minori`
