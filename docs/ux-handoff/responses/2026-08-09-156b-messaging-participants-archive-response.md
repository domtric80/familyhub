# Risposta UX — Handoff 156b: Messaggistica — partecipanti, filtri, archiviazione

Data: 2026-08-09

---

## Stato: implementato

---

## File modificato

`frontend/src/pages/messaggi/MessaggiPage.tsx`

API e tipi erano già completi:
- `internalMessageApi.listThreads()` → già supportava `topic` e `archived`
- `internalMessageApi.archiveThread()` → già presente
- `InternalMessageThread.archived_at` → già nel tipo

---

## Modifiche implementate

### 1. Filtri lista conversazioni

Aggiunti due nuovi filtri alla barra:

- **Topic** — input testo libero; passa `topic=...` se valorizzato
- **Stato** — select binaria:
  - `Solo attive` (default) → `archived=false`
  - `Solo archiviate` → `archived=true`

Il filtro `archived` viene sempre passato al backend (mai omesso), così il comportamento è prevedibile e coerente con la regola backend: _se omesso, il backend restituisce solo non archiviate_.

Reset azzera anche i nuovi filtri.

### 2. Azione archiviazione

Ogni thread **non archiviato** espone un bottone icona `Archive` nella colonna azioni (accanto ad "Apri"):
- Click → `confirm()` → `POST /internal-messages/threads/{id}/archive`
- Toast success: "Conversazione archiviata."
- Refresh lista: il thread sparisce dalla vista "Solo attive"

I thread già archiviati mostrano il badge `Archiviata` nel campo Oggetto, senza bottone archivia.

### 3. Label partecipanti nel modal

Il formato per ogni voce nel multiselect è ora:

> **Nome Cognome** — Ruolo — email@struttura.local

```tsx
<span className='fw-semibold'>{p.display_name}</span>
{p.role_name && <span className='text-muted ms-1'>— {p.role_name}</span>}
{p.email && <span className='text-muted ms-1'>— {p.email}</span>}
```

L'email viene mostrata solo se il backend la restituisce nel payload `participantOptions`.

### 4. Errore 422 su `participant_user_ids`

L'errore di campo `participant_user_ids` (es. "Uno o più partecipanti non hanno accesso attivo al minore selezionato.") viene ora mostrato inline immediatamente sotto la lista partecipanti, in rosso, anziché nel messaggio generico in cima al modal.

### 5. Partecipanti thread minore

Già corretto dalla sessione precedente: quando `thread_type === 'minor'` e `minor_id` è valorizzato, la chiamata a `participantOptions` include `minor_id`, quindi il backend filtra solo gli utenti con accesso attivo a quel minore.

---

## Checklist QA

- [x] `facility` senza minore → lista partecipanti mostra utenti struttura con ruolo
- [x] `minor` → lista partecipanti mostra solo utenti con accesso attivo al minore
- [x] errore `422 participant_user_ids` mostrato inline sotto la lista partecipanti
- [x] archiviazione rimuove thread dalla vista "Solo attive"
- [x] filtro `archived=true` mostra thread archiviati
- [x] filtro `topic` restringe lista
- [x] thread archiviato: badge "Archiviata" visibile, bottone Archivia non presente
