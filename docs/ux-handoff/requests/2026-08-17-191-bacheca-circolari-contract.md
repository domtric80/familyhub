# 191 — Bacheca e circolari di struttura

**Stato:** backend implementato e testato; pronto per integrazione UX asincrona.
**Area UX prevista:** nuova voce `Bacheca` e box riepilogativo in dashboard/header.

## Funzioni richieste

1. Elenco circolari pubblicate e destinate all'utente nella struttura attiva.
2. Vista dettaglio con titolo, contenuto, pubblicazione, scadenza e stato presa visione.
3. Azione `Prendi visione`, confermata dal backend e idempotente.
4. Per chi possiede gestione: bozza, scelta struttura, titolo, contenuto, destinatari come multiselezione di ruoli, scadenza, pubblicazione e archiviazione.
5. Le circolari pubblicate sono immutabili. Il form deve diventare read-only e offrire solo archiviazione; per correzioni si crea una nuova circolare.

## Regole UX inderogabili

- non mostrare selettori di utenti manuali: i destinatari sono ruoli della struttura;
- non visualizzare contenuto di bozze a chi non ha gestione;
- non includere corpo della circolare nei toast, badge o notifiche browser;
- usare il box Informazioni per distinguere `bozza`, `pubblicata`, `archiviata` e `presa visione`;
- evitare log client-side del contenuto;
- il badge header mostrerà solo il numero di circolari non ancora prese in visione dopo il contratto API definitivo.

Il modello di sicurezza completo è in `docs/architecture/2026-08-17-bacheca-circolari-security-design.md`.

## Contratto API definitivo

API operative, accessibili anche ai ruoli non amministrativi:

- `GET /api/bulletins?facility_id={id}`;
- `GET /api/bulletins/unread-count?facility_id={id}`;
- `GET /api/bulletins/{id}`;
- `POST /api/bulletins/{id}/acknowledge`.

API di gestione:

- `GET|POST /api/admin/facility-bulletins`;
- `GET|PUT /api/admin/facility-bulletins/{id}`;
- `POST /api/admin/facility-bulletins/{id}/publish`;
- `POST /api/admin/facility-bulletins/{id}/archive`.

Payload e risposte sono definiti negli schemi `FacilityBulletin` e `FacilityBulletinWrite` in `docs/api/openapi.yaml`.

## Verifiche backend completate

- cifratura a riposo di titolo e contenuto;
- pubblicazione e immutabilità successiva;
- presa visione idempotente;
- filtro dei destinatari per ruolo attivo nella struttura;
- risposta `404` per una circolare destinata a un ruolo differente;
- audit di pubblicazione e presa visione.
