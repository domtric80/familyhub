# Risposta UX — Handoff 134: Auth Session Timeout e Login Context

Data: 2026-07-13  
Stato: implementato

---

## Ricognizione stato pre-esistente

Prima dell'handoff, il frontend aveva già:
- `LoginContextResponse` tipo in `types/index.ts`
- `authApi.loginContext()` in `services/api.ts`
- `login_context_token` nel body di `LoginRequest`
- `LoginPage.tsx` completo: mount chiama loginContext, submit disabilitato finché token non arriva, 419 gestito con rimessaggio automatico del contesto
- Interceptor 401 in `api.ts`: localStorage clear + redirect `/login`

---

## Fix applicati

### 1. Interceptor 401 — esclusione rotte `/auth/` (`services/api.ts`)

**Problema:** l'interceptor scattava anche su `POST /auth/login` (credenziali errate = 401), causando un reload inatteso della pagina login mentre l'utente stava ancora vedendo il messaggio di errore.

**Fix:**

```ts
const url = err.config?.url ?? ''
const isAuthRoute = url.includes('/auth/')
if (err.response?.status === 401 && !isAuthRoute) {
  const msg = (err.response?.data as Record<string, unknown>)?.message as string | undefined
  sessionStorage.setItem('auth_expired_message', msg ?? 'Sessione scaduta. Accedi nuovamente.')
  localStorage.removeItem('access_token')
  window.location.href = '/login'
}
```

- Rotte `/auth/*` escluse dal redirect automatico (gestite dai chiamanti)
- Il messaggio backend (es. `Sessione scaduta per inattività oltre 60 minuti.`) viene salvato in `sessionStorage` prima del redirect

### 2. Messaggio sessione scaduta in LoginPage (`LoginPage.tsx`)

Al mount, la pagina legge `sessionStorage` e mostra un alert warning distinto dall'errore credenziali:

```tsx
const msg = sessionStorage.getItem('auth_expired_message')
if (msg) {
  setSessionMsg(msg)
  sessionStorage.removeItem('auth_expired_message')
}
```

Rendering:

```tsx
{sessionMsg && (
  <div className='alert alert-warning' role='alert'>
    <strong>Sessione terminata</strong> — {sessionMsg}
  </div>
)}
```

Il messaggio è giallo (warning), non rosso — distingue visivamente una sessione scaduta da credenziali errate.

---

## Comportamento finale

| Scenario | Comportamento UI |
|----------|-----------------|
| Login con credenziali errate (401 da `/auth/login`) | Errore rosso nella pagina login, nessun reload |
| Sessione scaduta per inattività (401 da qualsiasi altra chiamata) | Logout + redirect `/login` + banner giallo con messaggio backend |
| Sessione scaduta per durata massima 8h | Stesso del precedente |
| Pagina login aperta >10 min (419) | Errore rosso + rigenera automaticamente login_context_token |
| Submit prima che loginContext risponda | Pulsante disabilitato |

---

## Vincoli rispettati

- Nessuna chiamata aggiuntiva al backend
- Nessun polling o timer sul frontend per la scadenza (la scadenza è rilevata alla prima chiamata 401)
- Toast non usato per il messaggio di sessione scaduta: dopo redirect il ToastContainer non è montato, quindi si usa sessionStorage → alert nella login page
