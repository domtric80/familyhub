# Risposta UX 055 · Perimetro finale RBAC + accesso minori

Data: 2026-06-29  
Stato: RICEVUTO E RECEPITO

## 1. Checklist

- [x] Matrice semantica backend recepita e allineata ai file frontend
- [x] Scheda minore: `GET /api/minors/{minor}` richiede `minor_profiles.read` — già gestito (vedi 056)
- [x] Storico minore: stesso permesso `minor_profiles.read`
- [x] Contatti: usa `minor_contacts.create/update` (non più `minor_profiles.update`)
- [x] Assegnazioni: lettura `response.assignments` già corretta in api.ts
- [x] Messaggi 403 contesto-specifici implementati in UscitePage e AttivitaPage

---

## 2. Regola generale recepita

Il backend applica sempre due livelli per le operazioni sui minori:

1. **RBAC** — il ruolo deve avere il permesso corretto per la struttura  
2. **Assegnazione attiva al minore** — `is_active = true`, `valid_from <= oggi`,
   `valid_to IS NULL OR valid_to >= oggi`  

Eccezione per ruoli privilegiati: `SUPER_ADMIN`, `DIRETTORE`, `COORDINATORE` — bypossano
il secondo livello ma non il primo.

---

## 3. Matrice permessi frontend → backend (aggiornata)

### Scheda minore

| Superficie           | Endpoint                          | Permesso           |
|----------------------|-----------------------------------|--------------------|
| Vista completa       | `GET /api/minors/{minor}`         | `minor_profiles.read` |
| Storico              | `GET /api/minors/{minor}/history` | `minor_profiles.read` |
| Aggiornamento profilo| `PUT/PATCH /api/minors/{minor}/profile` | `minor_profiles.update` |

**Nota:** la scheda completa è considerata "vista sensibile" — include dati anagrafici,
profilo, contatti e documenti visibili. Un educatore assegnato può comparire nei flussi
operativi ma non necessariamente ha `minor_profiles.read` per aprire la scheda completa.

### Contatti

| Operazione        | Permesso               |
|-------------------|------------------------|
| Crea contatto     | `minor_contacts.create` |
| Modifica contatto | `minor_contacts.update` |

Il backend è stato riallineato: non richiede più `minor_profiles.update` per la gestione
contatti. Il frontend usa già `minor_contacts.create/update` come permessi di controllo
nei check di visibilità dei pulsanti.

### Documenti

| Operazione        | Permesso + regola aggiuntiva         |
|-------------------|--------------------------------------|
| Upload            | `attachments.upload` + assegnazione  |
| Preview / download| `attachments.read` + ABAC + assegnazione |

### Attività

| Operazione   | Permesso                  |
|--------------|---------------------------|
| Lista/dettaglio | `minor_activities.read` |
| Crea         | `minor_activities.create` |
| Modifica     | `minor_activities.update` |
| Elimina      | `minor_activities.delete` |

### Uscite

| Operazione          | Permesso              |
|---------------------|-----------------------|
| Lista/dettaglio     | `minor_exits.read`    |
| Crea                | `minor_exits.create`  |
| Modifica/transizioni| `minor_exits.update`  |
| Elimina             | `minor_exits.delete`  |

### Assegnazioni al minore

| Operazione          | Permesso                        |
|---------------------|---------------------------------|
| Elenco              | `minor_user_assignments.read`   |
| Crea                | `minor_user_assignments.create` |
| Bulk-sync           | `minor_user_assignments.update` |
| Revoca              | `minor_user_assignments.revoke` |

---

## 4. Endpoint aggregati assegnazioni (contratto definitivo)

```
GET /api/admin/minors/{minor}/assigned-users
→ { minor: {...}, assignments: MinorAssignment[] }

GET /api/admin/users/{user}/assigned-minors
→ { user: {...}, assignments: MinorAssignment[] }
```

Il frontend legge sempre `response.assignments`. Tipi TypeScript corrispondenti:
- `MinorAssignedUsersResponse` — in `types/index.ts`
- `UserAssignedMinorsResponse` — in `types/index.ts`

---

## 5. Implicazioni UI non ancora implementate

### Distinzione scheda sensibile

Il task 055 chiarisce che un utente con `minor_activities.create` e assegnazione attiva
potrebbe **non** avere `minor_profiles.read`. In questo caso:

- può comparire in flussi operativi (uscite, attività)
- ma non può aprire la scheda completa del minore

Il frontend attualmente non gestisce questo scenario visivamente: se l'utente clicca sul
minore e riceve `403`, vede il messaggio di errore. Un futuro miglioramento potrebbe
limitare il link alla scheda solo per chi ha `minor_profiles.read` nelle capabilities.

**Non implementato in questo sprint — da valutare come task separato.**

---

## 6. Note per i test QA

Costruire una matrice di test con questi profili utente:

| Ruolo         | Assegnazione al minore | `minor_profiles.read` | Atteso su scheda minore |
|---------------|------------------------|------------------------|-------------------------|
| EDUCATORE     | Sì, attiva             | Sì                     | Accesso completo        |
| EDUCATORE     | Sì, attiva             | No                     | `403` con messaggio specifico |
| EDUCATORE     | No                     | Sì                     | `403` (manca assegnazione) |
| COORDINATORE  | No                     | Sì                     | Accesso completo (privilegiato) |

Non usare `admin@familyhub.local` — è `SUPER_ADMIN`, bypassa tutti i controlli operativi.
