# UX handoff response — 191

**Data risposta:** 2026-08-19
**Handoff:** 191 — Bacheca e circolari di struttura
**Stato:** implementato

---

## Nuovi tipi (`frontend/src/types/index.ts`)

```typescript
FacilityBulletin       // id, facility_id, title, body, status: DRAFT|PUBLISHED|ARCHIVED,
                       // expires_at?, published_at?, target_roles: Role[], is_acknowledged,
                       // acknowledged_at?, acknowledgement_count?
FacilityBulletinWrite  // facility_id, title, body, expires_at?, target_role_ids?
```

## Nuove API (`frontend/src/services/api.ts`)

```typescript
bulletinApi: { list, unreadCount, get, acknowledge }
// endpoint: /bulletins, /bulletins/unread-count, /bulletins/{id}, /bulletins/{id}/acknowledge

bulletinAdminApi: { list, create, get, update, publish, archive }
// endpoint: /admin/facility-bulletins[/{id}[/publish|/archive]]
```

## Nuova pagina — `BachecaPage` (`/bacheca`)

Vista utente:
- Elenco circolari da `GET /api/bulletins`, filtrabile per struttura
- Badge contatore circolari non lette (PUBLISHED + !is_acknowledged) nell'intestazione pagina
- Tabella: titolo, pubblicata il, scadenza, stato, presa visione (con data se confermata)
- Le righe non ancora prese in visione vengono evidenziate (font-weight bold)
- Click "Leggi" → modal dettaglio con corpo completo, destinatari, stato presa visione
- Pulsante "Prendi visione" visibile solo se `status === 'PUBLISHED' && !is_acknowledged`
- Presa visione idempotente: secondo click non causa errore UX

## Nuova pagina — `BachecaAdminPage` (`/admin/bacheca`)

Vista gestione (tre tab: Bozze / Pubblicate / Archiviate):

**Tab Bozze:**
- Crea nuova circolare: struttura (select), titolo, corpo (textarea), scadenza, ruoli destinatari (checkbox multipla)
- Modifica bozza
- Pulsante "Pubblica" con conferma esplicita ("irreversibile")

**Tab Pubblicate:**
- Read-only: titolo, data pubblicazione, scadenza, contatore letture
- Pulsante "Archivia"
- Alert nel modal dettaglio: "immutabile — per correzioni archiviare e creare nuova circolare"

**Tab Archiviate:**
- Solo consultazione (nessuna azione)

## Vincoli rispettati

- Corpo e titolo cifrati a riposo → mai inclusi in toast (toast contiene solo "Bozza creata", "Circolare pubblicata", ecc.)
- Destinatari = ruoli della struttura via checkbox; nessun selettore di singoli utenti
- Bozze non visibili agli utenti senza gestione (accesso via `/api/bulletins`, non `/api/admin/...`)
- Circolari pubblicate → immutabili: form chiuso, solo archiviazione
- Pubblicazione con conferma modale esplicita

## File modificati / creati

| File | Tipo |
|---|---|
| `frontend/src/types/index.ts` | Modifica (FacilityBulletin, FacilityBulletinWrite) |
| `frontend/src/services/api.ts` | Modifica (bulletinApi, bulletinAdminApi) |
| `frontend/src/pages/bacheca/BachecaPage.tsx` | Nuovo |
| `frontend/src/pages/admin/BachecaAdminPage.tsx` | Nuovo |
| `frontend/src/App.tsx` | Modifica (route /bacheca, /admin/bacheca) |
| `frontend/src/layout/sidebar/menuItems.ts` | Modifica (Bacheca in Organizzazione, Gestione bacheca in Amministrazione) |
