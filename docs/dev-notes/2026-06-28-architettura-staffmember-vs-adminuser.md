# Architettura — StaffMember vs AdminUser: rischio duplicati e mancato collegamento

Data: 2026-06-28
Priorità: ALTA — impatta integrità dati, tracciabilità operativa e UX accompagnatori uscite
Segnalato da: frontend team

---

## Problema

Nel sistema attuale esistono **due percorsi separati** per registrare la stessa persona fisica:

| Percorso | Tabella | Scopo |
|---|---|---|
| Menu → Organizzazione → Educatori | `staff_members` | Anagrafica professionale (codice, qualifica, struttura) |
| Menu → Amministrazione → Utenti + Assegnazioni | `users` + `user_facility_roles` | Identità digitale (login, ruolo operativo) |

Il collegamento tra i due è `staff_members.user_id` (nullable FK verso `users`).

### Scenario problematico concreto

1. L'amministratore crea **Rossi Mario** come educatore da menu Organizzazione → StaffMember creato, `user_id = NULL`
2. L'amministratore crea **Rossi Mario** come utente da menu Amministrazione + assegna ruolo "educatore" → User creato, nessun record in `staff_members` collegato
3. Risultato: **due record** per la stessa persona, non collegati
4. Conseguenza operativa: nella selezione degli accompagnatori per le uscite, Rossi Mario potrebbe:
   - Non apparire (se StaffMember non ha `user_id` → nessuna assegnazione → escluso dal cross-join)
   - Apparire due volte (se qualcuno ha creato entrambi i record)
   - Apparire con nomi/dati discordanti

---

## Domande per sviluppo

1. **Qual è il flusso canonico previsto?** Creare prima l'utente e poi lo staff member collegandolo, oppure creare prima lo staff member e poi l'account utente?

2. **`staff_members.user_id` deve essere obbligatorio?** Se ogni membro del personale deve avere un account, dovrebbe essere NOT NULL. Se invece esistono figure solo anagrafiche (senza accesso), il nullable è corretto ma va documentato.

3. **Il ruolo in `user_facility_roles` e la `qualification` in `staff_members` sono allineati?** Un utente con ruolo "educatore" in `user_facility_roles` corrisponde sempre a un `staff_member` con `qualification = 'educatore'`?

4. **Esiste o è prevista una vista/endpoint che restituisce già il join** `staff_members + user_facility_roles` per una struttura, filtrato per ruolo e stato attivo?

---

## Impatto attuale sul frontend

La pagina Uscite (accompagnatori) attualmente costruisce la lista personale tramite:

```
assignmentApi.list({ is_active: true })
  → filtra per facility_id
  → cross-join con staffMemberApi (su user_id)
  → raggruppa per role.name
```

Questo significa che **vengono mostrati solo i membri del personale che hanno sia un record in `staff_members` con `user_id` valorizzato, sia un'assegnazione attiva in `user_facility_roles`**.

Chi ha solo il record `staff_members` (senza `user_id`) non appare.
Chi ha solo l'assegnazione (senza record `staff_members`) appare ma senza codice dipendente.

---

## Soluzioni proposte

### Opzione A — Flusso unico obbligatorio (consigliata)
Vincolare a livello applicativo che la creazione di un utente con ruolo operativo (non super_admin/admin) **richieda** la creazione contestuale o il collegamento a un record `staff_members`. La UI potrebbe guidare l'amministratore in un wizard unico.

### Opzione B — Endpoint dedicato lato backend
Aggiungere un endpoint `/api/admin/facilities/{id}/staff-with-roles` che restituisce già il join:

```json
[
  {
    "staff_member_id": 12,
    "user_id": 5,
    "employee_code": "EDU001",
    "first_name": "Mario",
    "last_name": "Rossi",
    "role": { "code": "educatore", "name": "Educatore" },
    "is_active": true
  }
]
```

Il frontend userebbe questo endpoint invece di fare il cross-join client-side.

### Opzione C — Normalizzazione `staff_members.user_id` NOT NULL
Se ogni membro del personale deve avere un account, rendere `user_id` NOT NULL e aggiungere un vincolo UNIQUE. Aggiornare la migrazione e la validazione Laravel.

---

## Nota per il frontend

Fino a chiarimento dall'architettura backend, il frontend implementa il cross-join client-side (opzione di fallback). Appena disponibile l'endpoint dedicato (Opzione B), verrà migrato con una modifica minima a `api.ts`.
