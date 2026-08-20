# UX handoff response — 194

**Data risposta:** 2026-08-19
**Handoff:** 194 — Incidenti e segnalazioni
**Stato:** implementato

---

## Nuovi tipi (`frontend/src/types/index.ts`)

```typescript
IncidentType, IncidentTypeWrite
IncidentSeverityOption, IncidentStatusOption, IncidentOptions
IncidentAnalysis
IncidentExternalNotification, IncidentExternalNotificationWrite
IncidentAuthorityReport
Incident, IncidentWrite, IncidentUpdate, IncidentTransitionWrite
```

## Nuove API (`frontend/src/services/api.ts`)

```typescript
incidentApi: { options, list, create, get, update, transition, saveAnalysis, addExternalNotification, getAuthorityReport }
incidentTypeApi: { list, create, update, delete }
```

## Nuova pagina — `IncidentiPage` (`/incidenti`)

- Tabella filtrabile: struttura, minore, gravità (da options), stato (da options), periodo (date_from/date_to)
- Badge gravità colorato da `color` restituito dal backend (green→success, red→danger, else→warning)
- Click su riga → naviga a `/incidenti/:id`
- Pulsante "Nuova segnalazione" → `/incidenti/nuova`
- Box informativo: "Il registro incidenti documenta eventi critici…"

## Nuova pagina — `NuovaSegnalazionePage` (`/incidenti/nuova`)

- Form guidato: struttura, minore (filtrato per struttura), tipo incidente (da `incidentTypeApi.list()`), gravità (da `options.severity_levels`)
- Tutti i campi obbligatori validati prima di inviare
- Preview badge gravità selezionata
- Nessun testo libero per tipo, gravità o stato
- Redirect a `/incidenti/:id` dopo salvataggio

## Nuova pagina — `IncidenteDetailPage` (`/incidenti/:id`)

**Dati incidente:** minore, tipo, data, segnalato da, descrizione

**Analisi RCA:** form con causa radice, fattori contributivi, azioni correttive → `PUT /incidents/{id}/analysis`

**Notifiche esterne:** tabella storico; modal aggiungi con:
- Autorità selezionata da `lookupsApi.documentIssuers()` (mai testo libero)
- Data/ora, metodo (enum), note

**Transizioni stato:**
- Solo `allowed_transitions` restituiti dal backend vengono mostrati come bottoni
- Modal di conferma obbligatorio con campo note (facoltative) prima di ogni transizione
- Nessun calcolo browser delle transizioni valide

**Report autorità:**
- `GET /incidents/{id}/authority-report` → testo precompilato
- Alert prominente: "Nessun invio automatico — la precompilazione è una bozza da rivedere"

## Nuova pagina — `TipiIncidentePage` (`/admin/tipi-incidente`)

- CRUD con tab Attivi / Disattivi
- Codice immutabile dopo creazione
- 409 su delete → "Il tipo è già usato in incidenti esistenti — disattivalo"

## Vincoli rispettati

- Transizioni calcolate solo dal backend (`allowed_transitions`)
- Nessuna cancellazione di incidenti
- Conferma obbligatoria per ogni avanzamento stato
- Gravità/stato visualizzati da `GET /incidents/options`, mai hardcoded
- Autorità da `document_issuers`, nessun testo libero
- Report con alert "Nessun invio automatico" ben visibile

## File modificati / creati

| File | Tipo |
|---|---|
| `frontend/src/types/index.ts` | Modifica |
| `frontend/src/services/api.ts` | Modifica (incidentApi, incidentTypeApi) |
| `frontend/src/pages/incidenti/IncidentiPage.tsx` | Nuovo |
| `frontend/src/pages/incidenti/NuovaSegnalazionePage.tsx` | Nuovo |
| `frontend/src/pages/incidenti/IncidenteDetailPage.tsx` | Nuovo |
| `frontend/src/pages/admin/TipiIncidentePage.tsx` | Nuovo |
| `frontend/src/App.tsx` | Modifica (route) |
| `frontend/src/layout/sidebar/menuItems.ts` | Modifica |
