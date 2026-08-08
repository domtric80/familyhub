# Risposta UX Handoff 045 — Semplificazione assegnazioni minore e selezione bulk

**Data risposta:** 2026-06-28  
**Task:** 045 — Minor assignment simplification and bulk user selection

---

## Cosa è stato implementato

### 1. Semplificazione del modello dati (types/index.ts)

Rimossi i tipi `MinorAssignmentRole` e `MinorAccessLevel` e tutti i campi correlati
(`assignment_role_code`, `access_level`) dalle interfacce `MinorAssignment` e `MinorAssignmentWrite`.

Il nuovo modello è più semplice: l'assegnazione collega solo `utente ↔ minore` senza
informazioni di ruolo o livello accesso (questi sono gestiti rispettivamente da RBAC struttura
e ABAC documenti lato backend).

Aggiunte le nuove interfacce per le operazioni bulk:
- `MinorAssignmentBulkSyncFromMinor` — per sincronizzare gli utenti assegnati a un minore
- `MinorAssignmentBulkSyncFromUser` — per sincronizzare i minori assegnati a un utente

### 2. Nuovi endpoint API (services/api.ts)

Aggiunti due metodi a `minorAssignmentApi`:
- `bulkSyncFromMinor(minorId, data)` → `POST /admin/minors/{id}/user-assignments/bulk-sync`
- `bulkSyncFromUser(userId, data)` → `POST /admin/users/{id}/minor-assignments/bulk-sync`

### 3. AssegnazioniMinoriPage.tsx — versione semplificata

Rimossi:
- Costanti `ROLE_LABELS`, `ACCESS_LEVEL_LABELS`, `ACCESS_LEVEL_BADGE`
- Filtro per ruolo assegnazione (`filterRoleCode`)
- Colonne "Ruolo assegnazione" e "Livello accesso" dalla tabella
- Campi `assignment_role_code` e `access_level` dal form
- Warning clinico nel form

Mantenuti:
- Filtri: struttura, minore, utente, solo attive
- Tabella: Minore, Utente, Struttura, Valido dal, Valido al, Stato, Azioni
- Form: Struttura (→ cascade Minore e Utente), Valido dal, Valido al, Attiva, Note
- Modal revoca con data fine validità configurabile
- Banner `apiMissing` per endpoint non ancora disponibile

### 4. Tab "Accesso al minore" in MinoreDetailPage.tsx

Il componente `OperatoriTab` è stato riscritto con logica `AccessoMinoreTab` mantenendo
la stessa chiave `'operatori'` per non rompere la struttura tab.

Nuove funzionalità:
- Tabella mostra: Nome, Email, Ruolo struttura (da `user_facility_roles[0].role.name`), Valido dal, Valido al, Stato, Azioni
- Pulsante "Aggiungi utenti" apre modal multi-selezione
- Modal carica tutti gli utenti via `adminUserApi.list()`, mostra checkbox per selezione multipla
- Campi validità: Valido dal, Valido al (opzionale), Note
- Submit → `bulkSyncFromMinor(minorId, { user_ids, valid_from, ... })`
- Revoca singola → `minorAssignmentApi.revoke(id)` con toast "Assegnazione rimossa con successo."
- Toast bulk: "Accessi al minore aggiornati con successo."

La label del tab è stata aggiornata da "Operatori assegnati" a "Accesso al minore".

---

## Contratto API atteso

```
POST /api/admin/minors/{minorId}/user-assignments/bulk-sync
Body: { user_ids: number[], valid_from: string, valid_to?: string|null, is_active?: boolean, notes?: string|null }
Response: { message: string, assignments: MinorAssignment[] }

POST /api/admin/users/{userId}/minor-assignments/bulk-sync
Body: { facility_id: number, minor_ids: number[], valid_from: string, valid_to?: string|null, is_active?: boolean, notes?: string|null }
Response: { message: string, assignments: MinorAssignment[] }
```

La semantica attesa è "sync" (non append): le assegnazioni non presenti nella lista
vengono revocate; quelle presenti vengono create o riattivate.

---

## Verifica TypeScript

Build `tsc --noEmit` completata con **0 errori**.
