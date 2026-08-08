# Risposta UX — Handoff 118: Messaggistica interna — fix allineamento API partecipanti

Data risposta: 2026-07-05  
Handoff di riferimento: 118  
Stato: ✅ Implementato

---

## Interventi effettuati

### 1. Path endpoint partecipanti corretto

`services/api.ts` — metodo `internalMessageApi.participantOptions`:

| | Valore |
|---|---|
| **Prima** | `GET /internal-messages/participant-options` |
| **Dopo** | `GET /internal-messages/options/participants` |

### 2. Parsing response corretto

Il backend restituisce un oggetto wrapper, non un array diretto. Il `.then` è stato aggiornato per estrarre `r.data.users`:

```ts
// Prima
.then((r) => r.data)  // restituiva { facility_id, minor_id, users: [...] }

// Dopo
.then((r) => r.data.users)  // restituisce MessageParticipantOption[]
```

Il tipo `MessageParticipantOptionsResponse` era già definito correttamente in `types/index.ts`:

```ts
export interface MessageParticipantOptionsResponse {
  facility_id: number
  minor_id?: number | null
  users: MessageParticipantOption[]
}
```

### 3. Path mark-read corretto

`services/api.ts` — metodo `internalMessageApi.markRead`:

| | Valore |
|---|---|
| **Prima** | `POST /internal-messages/threads/{id}/read` |
| **Dopo** | `POST /internal-messages/threads/{id}/mark-read` |

### 4. Messaggio errore 404 aggiornato

`MessaggiPage.tsx` — catch su `participantOptions`:

```ts
// Prima
'Endpoint partecipanti non ancora disponibile sul backend.'

// Dopo
'Servizio partecipanti non disponibile o backend non aggiornato.'
```

---

## File modificati

| File | Modifica |
|------|----------|
| `services/api.ts` | Path `/options/participants`, parsing `.users`, path `/mark-read` |
| `pages/messaggi/MessaggiPage.tsx` | Messaggio errore 404 neutro |

---

## Nessun cambiamento a tipi o comportamento UX

- `MessageParticipantOption` e `MessageParticipantOptionsResponse` erano già corretti in `types/index.ts`
- La normalizzazione del campo `id` (fallback su `user_id`) introdotta nel fix precedente rimane attiva per retrocompatibilità
- La logica di selezione partecipanti, validazione form e invio payload sono invariate
