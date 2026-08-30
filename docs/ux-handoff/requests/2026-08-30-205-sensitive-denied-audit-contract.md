# Handoff UX — Audit accessi negati su dati sensibili

Data: 2026-08-30  
Richiesta: 205  
Priorità: Alta  
Area: Audit, sicurezza, messaggistica, minori, avvicinamenti, diario educativo.

## Sintesi

Il backend registra ora in modo esplicito gli accessi non autorizzati (`401`/`403`) verso API sensibili. L'evento audit usa `action = denied` e una descrizione parlante in `operation_summary`.

Questa modifica serve a rendere tracciabili anche i tentativi falliti di accesso a dati sensibili, non solo le operazioni riuscite.

## API impattate

Il middleware audit copre anche questi prefissi:

- `/api/internal-messages/*`
- `/api/approaches/*`
- `/api/journals/*`

Restano coperti i prefissi già presenti:

- `/api/admin/*`
- `/api/minors*`
- `/api/exits*`
- `/api/activities*`

## Payload audit

`GET /api/admin/audit-logs`

Esempio evento:

```json
{
  "id": 1201,
  "facility_id": 1,
  "minor_id": 2,
  "actor_user_id": 7,
  "actor_display_name": "Utente Test",
  "actor_role_name": "EDUCATORE",
  "action": "denied",
  "resource_type": "internal-messages",
  "resource_id": "15",
  "resource_label": "api/internal-messages/threads/15",
  "operation_summary": "Utente Test ha tentato un accesso non autorizzato. Risorsa: la conversazione interna #15. Esito HTTP: 403.",
  "ip_address": "127.0.0.1",
  "new_values_json": {
    "status_code": 403,
    "method": "GET",
    "path": "api/internal-messages/threads/15",
    "payload": {}
  },
  "occurred_at_utc": "2026-08-30T12:00:00Z"
}
```

## Regole privacy

Nei payload audit vengono redatti contenuti testuali sensibili, inclusi:

- `message_body`
- `body`
- `notes`
- `reserved_notes`
- `psychologist_notes`
- `coordinator_notes`
- `clinical_notes`
- `diagnosis_notes`

La UI Audit non deve ricostruire o mostrare testi sensibili da altri campi.

## Modifica UI richiesta

Pagina Admin → Audit:

1. Aggiungere/gestire filtro azione `denied` se arriva dai filtri backend.
2. Mostrare `denied` come stato rosso o warning alto: “Accesso negato”.
3. Nel drawer dettaglio mostrare:
   - data;
   - IP;
   - utente;
   - ruolo;
   - risorsa;
   - `operation_summary`;
   - `new_values_json.status_code`;
   - `new_values_json.path`.
4. Non mostrare payload redatti come contenuto utile: se valore `***redacted***`, visualizzare “contenuto oscurato”.

## QA richiesto

- Utente non partecipante apre una conversazione interna: compare 403 lato UI e audit `denied` lato admin.
- Utente senza ABAC clinical tenta accesso a thread clinical: audit `denied`.
- Utente senza permesso apre Diario o Avvicinamenti: audit `denied`.
- Export CSV audit contiene `denied` senza testi sensibili.
- La pagina Audit non mostra stato vuoto se l'utente non ha `audit_logs.read`: deve mostrare 403 leggibile.

## Nota tecnica

Il frontend non deve creare audit client-side. Tutto l'audit è generato dal backend.
