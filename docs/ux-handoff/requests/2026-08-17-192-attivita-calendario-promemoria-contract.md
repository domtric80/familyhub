# 192 — Attività: calendario e promemoria

**Stato:** backend implementato e testato; pronto per integrazione UX asincrona.
**Area UX:** Attività → calendario; header/dashboard → promemoria personali.

## Calendario

`GET /api/activities/calendar?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&facility_id={id}&minor_id={id}`

- `date_from` e `date_to` sono obbligatori;
- intervallo massimo: 62 giorni;
- il backend restituisce solo attività di minori accessibili all'utente;
- UX non deve caricare tutte le attività per poi filtrare nel browser;
- navigazione mensile: richiedere solo l'intervallo visibile del calendario.

## Promemoria

- `GET /api/activities/reminders/mine?pending_only=true`;
- `GET /api/activities/{activityId}/reminders` per chi può aggiornare l'attività;
- `POST /api/activities/{activityId}/reminders`;
- `DELETE /api/activities/{activityId}/reminders/{id}`;
- `POST /api/activities/{activityId}/reminders/{id}/acknowledge`.

Il destinatario è un `user` applicativo, mai un nome testuale. Il backend accetta il destinatario solo se possiede `minor_activities.read` e accesso attivo al minore dell'attività.

## Comportamento UX

1. Calendario mensile con eventi per orario, minore, tipologia e stato.
2. Click evento apre il dettaglio già esistente, senza duplicare il form attività.
3. Nel dettaglio attività, chi può aggiornare può aggiungere un promemoria scegliendo utente e data/ora precedenti all'inizio previsto.
4. Il destinatario vede solo i propri promemoria; quelli scaduti ma non confermati restano evidenziati.
5. `Prendi visione` è idempotente; dopo la conferma il promemoria resta nello storico.
6. Nessun testo sensibile deve essere copiato in notifiche browser: mostrare solo titolo attività, data e collegamento autenticato.

Schemi: `MinorActivityReminder` e `MinorActivityReminderWrite` in `docs/api/openapi.yaml`.

## Verifiche backend completate

- calendario limitato a 62 giorni e filtrato con `MinorAccessService`;
- creazione consentita solo per destinatari attivi con accesso al minore;
- elenco personale dei promemoria;
- presa visione idempotente;
- impossibilità di eliminare un promemoria già confermato;
- audit di creazione, eliminazione e presa visione.
