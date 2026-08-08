# Risposta UX handoff — Task 098-099
# Messaggistica interna — Lista thread + Nuova conversazione

Data: 2026-07-03
File: `pages/messaggi/MessaggiPage.tsx`, `types/index.ts`, `services/api.ts`, `layout/sidebar/menuItems.ts`, `App.tsx`

---

## Stato: ✅ Implementato (fase 1 — lista e creazione)

### Nuovi tipi in `types/index.ts`

- `ThreadType = 'facility' | 'minor'`
- `MessageParticipantOption` — opzioni partecipanti da `/options/participants`
- `MessageParticipant` — partecipante effettivo in un thread
- `InternalMessage` — singolo messaggio
- `InternalMessageThread` — thread con metadata, partecipanti, ultimo messaggio
- `InternalMessageThreadWrite` — payload creazione thread

### Nuovi metodi in `services/api.ts` (`internalMessageApi`)

- `listThreads(params?)` → `GET /api/internal-messages/threads`
- `getThread(id)` → `GET /api/internal-messages/threads/{id}`
- `createThread(data)` → `POST /api/internal-messages/threads`
- `sendMessage(threadId, body)` → `POST /api/internal-messages/threads/{id}/messages`
- `markRead(threadId)` → `POST /api/internal-messages/threads/{id}/mark-read`
- `participantOptions(params)` → `GET /api/internal-messages/options/participants`

### Pagina `MessaggiPage.tsx` — `/messaggi`

**Filtri:**
- Struttura, tipo conversazione (tutte / di struttura / sul minore), minore

**Lista thread (tabella):**
- Oggetto + topic, badge tipo, struttura, minore, numero partecipanti, ultimo messaggio, badge non letti (rosso)
- Click su riga → naviga a `/messaggi/{id}` (vista dettaglio — prossima fase)

**Modale nuova conversazione (3 blocchi):**
1. Dati base: struttura, tipo, minore (solo se `thread_type = minor`), oggetto, topic
2. Partecipanti: lista da `GET /options/participants`, ricaricata automaticamente al cambio struttura/minore/tipo
3. Primo messaggio: textarea obbligatoria

**Regole UX rispettate:**
- Campo minore visibile solo se `thread_type = minor`
- Dataset partecipanti si aggiorna dinamicamente
- Gestione 403 e 422 con messaggi in italiano
- Il creatore viene aggiunto automaticamente dal backend (non mostrato in UI)

**InfoDrawer:** tipi conversazione, partecipanti, riservatezza, azioni disponibili

**Sidebar:** voce "Messaggistica" aggiunta nella sezione "Organizzazione" (icona `chat`)

**Route:** `/messaggi` aggiunta in `App.tsx`

---

## Non implementato in questa fase (prossima sessione)

| Item | Endpoint |
|------|----------|
| Vista dettaglio conversazione | `GET /api/internal-messages/threads/{id}` |
| Timeline messaggi | campo `messages[]` nel response |
| Composer nuovo messaggio | `POST /api/internal-messages/threads/{id}/messages` |
| Segna come letto | `POST /api/internal-messages/threads/{id}/mark-read` |
| Route `/messaggi/:id` | da creare con `MessaggioDetailPage.tsx` |

---

## Build TypeScript

0 errori. ✅
