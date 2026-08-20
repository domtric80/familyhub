# UX handoff response — 192

**Data risposta:** 2026-08-19
**Handoff:** 192 — Attività: calendario e promemoria
**Stato:** implementato

---

## Nuovi tipi (`frontend/src/types/index.ts`)

```typescript
MinorActivityReminder       // id, minor_activity_id, recipient_user_id, remind_at,
                            // acknowledged_at?, is_due, activity?
MinorActivityReminderWrite  // recipient_user_id, remind_at
```

## Nuove API (`frontend/src/services/api.ts`)

```typescript
activityCalendarApi: { list }
// GET /api/activities/calendar?date_from=&date_to=[&facility_id][&minor_id]
// date_from e date_to obbligatori; filtraggio lato backend via MinorAccessService

activityReminderApi: { mine, list, create, delete, acknowledge }
// GET /api/activities/reminders/mine?pending_only=true
// GET|POST /api/activities/{id}/reminders
// DELETE|POST .../reminders/{rid}[/acknowledge]
```

## Nuova pagina — `AttivitaCalendarioPage` (`/attivita/calendario`)

Vista calendario mensile:
- Navigazione mese precedente / successivo con `<ChevronLeft>` / `<ChevronRight>`
- Griglia CSS 7 colonne (Lun–Dom) con padding vuoto per allineamento al giorno della settimana
- Ogni cella mostra max 3 eventi; surplus indicato con "+N altro/i"
- Ogni evento visualizza: ora inizio + titolo, colorato per `status` (planned=cyan, in_progress=yellow, completed=green, cancelled=gray)
- Click su evento → modal dettaglio con sezione promemoria integrata
- Filtri: struttura e minore (select, opzionali)
- Chiamata a `activityCalendarApi.list({ date_from, date_to, ... })` con i 62 giorni del mese; nessun filtro client-side sulle attività
- Nota informativa: "Il calendario mostra solo le attività accessibili al tuo profilo"

### Sezione promemoria nel modal dettaglio (calendario e lista attività)

Il modal dettaglio (sia in `AttivitaCalendarioPage` che in `AttivitaPage`) include una sezione **Promemoria** in fondo:
- Elenco promemoria esistenti: utente destinatario, data/ora, stato (visto / scaduto / futuro)
- Promemori non ancora presi in visione: pulsante ✓ (presa visione) + ✕ (eliminazione)
- Form aggiunta: selettore utente (da lista utenti admin), datetime-local, pulsante Bell
- Alert informativo: "Nessun testo dell'attività viene incluso nelle notifiche browser"
- Presa visione idempotente (secondo click non genera errore UX)

## Nuova pagina — `MieiPromemoriPage` (`/attivita/promemoria`)

Vista personale promemoria:
- Chiama `activityReminderApi.mine(pending_only)` — mostra solo i promemoria del'utente corrente
- Toggle "Solo non presi in visione" (default: attivo)
- Tre sezioni separate: **Scaduti** (border warning), **In attesa**, **Presi in visione**
- Badge contatore promemoria scaduti nell'header
- Ogni riga: titolo attività, data/ora promemoria, stato; bottone CheckCircle per presa visione
- Link a `/attivita` per accedere alla lista (non a singola attività per evitare navigazione diretta)

## Vincoli rispettati

- `date_from` / `date_to` sempre inviati (obbligatori); max 62 giorni (mese + padding)
- Nessun testo dell'attività incluso in toast o notifiche browser
- Destinatario del promemoria = utente (non testo libero)
- Presa visione idempotente: `acknowledge` non blocca se già eseguita

## File modificati / creati

| File | Tipo |
|---|---|
| `frontend/src/types/index.ts` | Modifica (MinorActivityReminder, MinorActivityReminderWrite) |
| `frontend/src/services/api.ts` | Modifica (activityCalendarApi, activityReminderApi) |
| `frontend/src/pages/attivita/AttivitaCalendarioPage.tsx` | Nuovo |
| `frontend/src/pages/attivita/MieiPromemoriPage.tsx` | Nuovo |
| `frontend/src/pages/attivita/AttivitaPage.tsx` | Modifica (sezione promemoria in modal dettaglio) |
| `frontend/src/App.tsx` | Modifica (route /attivita/calendario, /attivita/promemoria) |
| `frontend/src/layout/sidebar/menuItems.ts` | Modifica (Attività espanso in sub-menu con Calendario e Miei promemoria) |
