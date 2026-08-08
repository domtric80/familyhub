> **STATO DOCUMENTO: PARZIALMENTE SUPERATO**
>
> La parte relativa a `Task 083` resta valida.
> La parte relativa a `Task 084` va letta con prudenza perche' il punto:
>
> - `Modifica backend RBAC | in attesa team backend`
>
> non e' piu' attuale.
>
> Il backend RBAC e' stato verificato e aggiornato successivamente.
>
> Documenti aggiornati di riferimento:
>
> - `C:/Projects/FamilyHUB/docs/dev-notes/2026-07-02-rbac-diagnosi-avvicinamenti-diario.md`
> - `C:/Projects/FamilyHUB/docs/ux-handoff/requests/2026-07-02-084-avvicinamenti-diario-permission-and-endpoint-alignment.md`

# Risposta UX Handoff — Task 083 + 084

Data: 2026-07-02  
Task: 083 (gap roadmap), 084 (allineamento permessi/endpoint)

---

## Task 083 — Info panel v1 funzionale

### Azione eseguita

Aggiunta sezione **"Stato funzionale"** nell'InfoDrawer di:

- `AvvicinamentiPage` (`/avvicinamenti`)
- `DiarioPage` (`/diario`)

I pannelli mostrano ora un alert `alert-info` che comunica esplicitamente:

**Avvicinamenti:**
> Modulo v1 funzionale. Questa sezione gestisce gli avvicinamenti già pianificati o consuntivati. Le funzioni avanzate (provvedimento autorizzativo con scadenza, reazione del minore, note riservate, trend evolutivo) saranno abilitate in step successivi.

**Diario educativo:**
> Modulo v1 funzionale. Questa sezione registra voci diario puntuali del minore. Il registro strutturato di turno, la firma di chiusura, il passaggio consegne e le segnalazioni urgenti saranno introdotti in un'evoluzione successiva.

### Non aggiunto

Nessuna CTA o label che implichi workflow avanzati (`firma`, `chiusura turno`, `rinnovo provvedimento`, `trend`, ecc.) — coerente con le indicazioni del task.

---

## Task 084 — Allineamento permessi ed endpoint

### Verifica client API

Gli endpoint nel client API (`api.ts`) erano già corretti:

| Operazione | Endpoint attuale |
|---|---|
| List avvicinamenti | `GET /approaches` ✅ |
| Create | `POST /approaches` ✅ |
| Update | `PUT /approaches/{id}` ✅ |
| Delete | `DELETE /approaches/{id}` ✅ |
| List diario | `GET /journals` ✅ |
| Create | `POST /journals` ✅ |
| Update | `PUT /journals/{id}` ✅ |
| Delete | `DELETE /journals/{id}` ✅ |

**Nessuna modifica al client API necessaria.**

### Permessi nell'InfoDrawer

L'InfoDrawer di entrambe le pagine usa già la nomenclatura corretta:

- `minor_approaches.read/create/update/delete`
- `minor_journals.read/create/update/delete`

Non sono presenti alias obsoleti (`approaches.view`, `*.write`, ecc.).

### Nota sui 403 ricevuti in precedenza

I 403 con messaggio `Permesso insufficiente: minor_approaches.read.` confermano che il backend usa correttamente questa nomenclatura. Il frontend la recepisce e la visualizza senza modifiche. La causa dei 403 è la mancata assegnazione del permesso al ruolo dell'utente di test — questione backend (vedi nota dev `2026-07-02-rbac-minor-approaches-journals-note.md`).

---

## Stato

| Item | Stato |
|---|---|
| Info panel v1 funzionale in AvvicinamentiPage | ✅ implementato |
| Info panel v1 funzionale in DiarioPage | ✅ implementato |
| Endpoint client API | ✅ già corretti |
| Nomenclatura permessi UI | ✅ già corretta |
| Modifica backend RBAC | ⏳ in attesa team backend |
