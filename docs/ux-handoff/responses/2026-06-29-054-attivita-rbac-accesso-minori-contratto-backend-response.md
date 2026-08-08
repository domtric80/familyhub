# Risposta UX 054 · Modulo Attività — RBAC e accesso ai minori

Data: 2026-06-29  
Stato: IMPLEMENTATO

## 1. Checklist

- [x] Messaggio 403 su AttivitaPage aggiornato con formula che copre permesso e assegnazione
- [x] Permessi corretti `minor_activities.*` già usati dagli endpoint backend
- [x] Regola accesso al minore documentata per QA
- [x] Nota su ruoli privilegiati e utenti di test

---

## 2. Modulo Attività — messaggio 403

**File:** `frontend/src/pages/attivita/AttivitaPage.tsx` — `handleSave` catch block

Prima della modifica:
```ts
setFormMsg(ae.message ?? 'Errore salvataggio')
```

Dopo la modifica (task 054):
```ts
// 403 da attività: può essere permesso mancante O assegnazione al minore non attiva.
// Il backend non distingue nel codice HTTP — messaggio neutro che copre entrambi.
const msg = ae.status === 403
  ? 'Operazione non consentita: verifica permessi di ruolo e assegnazione attiva al minore.'
  : (ae.message ?? 'Errore salvataggio')
setFormMsg(msg)
```

Il messaggio appare nel banner del form modale attività.

---

## 3. Permessi richiesti dal modulo Attività

| Operazione              | Permesso RBAC                |
|-------------------------|------------------------------|
| Elenco / dettaglio      | `minor_activities.read`      |
| Creazione               | `minor_activities.create`    |
| Modifica                | `minor_activities.update`    |
| Eliminazione            | `minor_activities.delete`    |

Oltre al permesso RBAC, il backend richiede assegnazione attiva al minore:
- `is_active = true`
- `valid_from <= oggi`
- `valid_to IS NULL OR valid_to >= oggi`

Ruoli esenti dall'obbligo di assegnazione puntuale: `SUPER_ADMIN`, `DIRETTORE`, `COORDINATORE`.

---

## 4. Comportamento atteso per il frontend

### Elenco attività

Il backend filtra già i risultati in base alla visibilità dell'utente: un utente senza accesso
a un minore non vede neppure le sue attività in elenco. Il frontend non deve applicare filtri
aggiuntivi lato client — la lista restituita è già autorizzata.

### Select minori nel form nuova attività

La select dei minori è popolata da `GET /api/minors` che restituisce solo i minori visibili
all'utente corrente. Il fatto che un minore compaia nella select **non garantisce** che
l'utente possa creare attività su di esso: il backend esegue comunque la validazione RBAC +
assegnazione al momento del `POST`.

### Pulsanti modifica / elimina

Possono essere mostrati in base ai permessi UI (`minor_activities.update` e
`minor_activities.delete` dalle `capabilities`). Il backend esegue comunque il check finale.

---

## 5. Note per i test QA

Non usare `admin@familyhub.local` per testare i limiti operativi — è `SUPER_ADMIN`.

Casi da verificare con utente operativo (es. `EDUCATORE`):

| Caso | Setup | Atteso |
|------|-------|--------|
| A — operatore assegnato | `minor_activities.create` + assegnazione attiva | `201` |
| B — operatore non assegnato | `minor_activities.create` + nessuna assegnazione | `403` + messaggio specifico |
| C — ruolo privilegiato | `COORDINATORE` senza assegnazione puntuale | accesso consentito |
