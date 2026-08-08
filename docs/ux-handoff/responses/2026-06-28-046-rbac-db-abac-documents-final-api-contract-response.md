# Risposta UX Handoff 046 — RBAC struttura + ABAC documenti: contratto API finale

**Data risposta:** 2026-06-28  
**Task:** 046 — RBAC DB + ABAC documents final API contract

---

## Modello implementato

Il frontend adotta il modello a tre livelli separati:

### Livello 1 — RBAC struttura (`user_facility_roles`)

- Ruolo utente definito a livello struttura tramite la tabella `user_facility_roles`
- Gestito da `assignmentApi` (endpoint `/admin/user-facility-roles`)
- Visualizzato in UtentiPage colonna "Ruoli assegnati" e nella tab "Accesso al minore"
  tramite `user.user_facility_roles[0]?.role?.name`
- Il RBAC determina le permission generali dell'utente (cosa può fare nel sistema)

### Livello 2 — ABAC documenti (backend-only)

- Il controllo di accesso ai documenti classificati è interamente gestito dal backend
- Il frontend si limita a mostrare le classificazioni disponibili dalle `capabilities`
  dell'utente autenticato (`GET /auth/me` → `capabilities.document_classifications`)
- Non esiste più alcun campo `access_level` nel modello `MinorAssignment`
- Il frontend non prende decisioni di visibilità basate sull'access level: il backend
  restituisce solo i documenti che l'utente può vedere

### Livello 3 — Assegnazione minore (`minor_assignments`)

- L'assegnazione collega `utente ↔ minore` senza ruolo né livello accesso
- Permette al backend di sapere quali minori un utente può visualizzare
- Campi: `facility_id`, `minor_id`, `user_id`, `valid_from`, `valid_to`, `is_active`, `notes`
- Operazioni disponibili:
  - CRUD singolo: `POST/PUT /admin/minor-assignments`
  - Revoca: `PATCH /admin/minor-assignments/{id}/revoke`
  - Bulk sync da minore: `POST /admin/minors/{id}/user-assignments/bulk-sync`
  - Bulk sync da utente: `POST /admin/users/{id}/minor-assignments/bulk-sync`

---

## Rimozione campi deprecati

Eliminati dall'intera codebase frontend:
- `MinorAssignmentRole` (tipo union)
- `MinorAccessLevel` (tipo union)
- `assignment_role_code` (campo MinorAssignment/MinorAssignmentWrite)
- `access_level` (campo MinorAssignment/MinorAssignmentWrite)
- Tutte le label map `ROLE_LABELS`, `ACCESS_LEVEL_LABELS`, `ACCESS_LEVEL_BADGE`
- Filtro per ruolo assegnazione in AssegnazioniMinoriPage
- Warning "accesso ai dati clinici" nel form assegnazione

---

## Superfici UI aggiornate

| Componente | Cambiamento |
|---|---|
| `types/index.ts` | Rimossi tipi role/access, aggiunto bulk interfaces |
| `services/api.ts` | Aggiunti `bulkSyncFromMinor`, `bulkSyncFromUser` |
| `AssegnazioniMinoriPage` | Tabella e form semplificati (no role, no access_level) |
| `MinoreDetailPage` tab "Accesso al minore" | Mostra ruolo struttura RBAC, bulk select utenti |
| `UtentiPage` | Bottone "Minori assegnati" per bulk sync da utente |

---

## Contratto API finale atteso dal backend

```
# Assegnazioni singole
GET    /api/admin/minor-assignments?facility_id=&minor_id=&user_id=&is_active=
POST   /api/admin/minor-assignments
       Body: { facility_id, minor_id, user_id, valid_from, valid_to?, is_active?, notes? }
PUT    /api/admin/minor-assignments/{id}
PATCH  /api/admin/minor-assignments/{id}/revoke
       Body: { valid_to?: string|null }

# Aggregati
GET    /api/admin/minors/{id}/assigned-users     → MinorAssignment[] (con user embedded)
GET    /api/admin/users/{id}/assigned-minors     → MinorAssignment[] (con minor embedded)

# Bulk sync
POST   /api/admin/minors/{id}/user-assignments/bulk-sync
       Body: { user_ids: number[], valid_from, valid_to?, is_active?, notes? }
       Response: { message: string, assignments: MinorAssignment[] }

POST   /api/admin/users/{id}/minor-assignments/bulk-sync
       Body: { facility_id: number, minor_ids: number[], valid_from, valid_to?, is_active?, notes? }
       Response: { message: string, assignments: MinorAssignment[] }
```

Il campo `MinorAssignment` restituito dagli endpoint non include `assignment_role_code`
né `access_level` — questi campi sono stati rimossi dallo schema.

---

## Verifica TypeScript

Build `tsc --noEmit` completata con **0 errori**.
