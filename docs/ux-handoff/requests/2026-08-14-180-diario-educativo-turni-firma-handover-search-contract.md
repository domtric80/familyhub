# Handoff UX/API — Diario educativo: turni, firma applicativa, consegne e ricerca

Data: 2026-08-14
Area: `Minori > Diario educativo`
Priorità: alta
Stato backend: disponibile, UI da integrare

## Obiettivo

Completare il Diario educativo come registro operativo di turno senza simulare funzioni legali non presenti. Il flusso reale è:

1. un operatore apre un turno per una struttura;
2. collega le osservazioni dei minori al turno aperto;
3. registra eventuali consegne;
4. il destinatario registra la presa visione con il proprio account;
5. l'operatore autorizzato chiude il turno; il sistema registra la firma applicativa e blocca le voci collegate.

La firma disponibile è `authenticated_application_signature`: identifica l'utente autenticato, data/ora e audit. **Non chiamarla firma digitale qualificata né firma elettronica qualificata.**

## Endpoint nuovi

### Turni diario

| Azione | Endpoint | Permesso |
| --- | --- | --- |
| Elenco turni | `GET /api/journals/shifts?facility_id={id}&status=open|closed&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD` | `minor_journals.read` nella struttura |
| Apri turno | `POST /api/journals/shifts` | `minor_journals.create` nella struttura |
| Chiudi e firma turno | `POST /api/journals/shifts/{shiftId}/close` | `minor_journals.update` nella struttura |
| Registra presa visione | `POST /api/journals/{journalId}/acknowledge-handover` | `minor_journals.read` + accesso al minore |

### Aprire un turno

```json
{
  "facility_id": 12,
  "started_at": "2026-08-14T07:00:00+02:00",
  "title": "Turno mattina"
}
```

`ended_at` e `title` sono opzionali in apertura. `opened_by_user_id` è sempre valorizzato dal backend con l'utente autenticato: non inviarlo dalla UI.

### Chiudere un turno

```json
{
  "ended_at": "2026-08-14T14:00:00+02:00",
  "closing_notes": "Consegne completate al turno pomeridiano."
}
```

La risposta espone:

```json
{
  "closed_at": "2026-08-14T14:02:15+02:00",
  "closed_by_user_id": 41,
  "closure_signature_type": "authenticated_application_signature",
  "entries_count": 8
}
```

Se il turno è già chiuso l'API restituisce `422`. Dopo la chiusura nessuna voce collegata può essere aggiornata o eliminata (`422`). UI: disabilitare subito i pulsanti di modifica/eliminazione quando `journal_shift.closed_at` è valorizzato.

## Modifica al form voce diario

### Campo aggiuntivo

`minor_journal_shift_id` è opzionale. Se selezionato, il turno deve appartenere alla stessa struttura del minore e deve essere aperto.

```json
{
  "minor_id": 44,
  "minor_journal_shift_id": 310,
  "journal_entry_type_id": 2,
  "observed_at": "2026-08-14T09:20:00+02:00",
  "title": "Osservazione colazione",
  "content": "..."
}
```

La UI deve proporre soltanto i turni `open` della struttura selezionata. Il campo è facoltativo per preservare le registrazioni retrospettive e i dati preesistenti.

### Presa visione consegne

Rimuovere dal form create/edit i campi:

- `handover_read_at`
- `handover_read_by_user_id`

Non sono più campi scrivibili dal client. Quando una voce ha `handover_required = true` e `handover_read_at = null`, mostrare il pulsante **“Prendi visione”**. Il pulsante chiama `POST /api/journals/{journalId}/acknowledge-handover`, senza body.

La risposta aggiornata contiene `handover_read_at`, `handover_read_by_user_id` e la relazione `handover_read_by`.

## Ricerca e filtri lista

`GET /api/journals` supporta ora anche:

- `search`: ricerca full-text backend su titolo, contenuto e sezioni operative;
- `date_from`, `date_to`;
- `minor_journal_shift_id`;
- `handover_pending=true`: solo consegne richieste ma non lette.

La UI non deve filtrare localmente la ricerca, né costruire il testo di ricerca lato client.

## Interfaccia richiesta

1. aggiungere un tab/pannello `Turni diario` nella pagina Diario educativo, filtrato per struttura e intervallo date;
2. mostrare stato `Aperto` o `Chiuso e firmato`, orario apertura/chiusura, operatore apertura/chiusura e numero voci;
3. nel dettaglio turno mostrare un chiaro avviso: “la chiusura blocca le voci collegate”; richiedere conferma esplicita prima della chiamata di chiusura;
4. nel dettaglio voce, mostrare badge `Turno chiuso e firmato` e bloccare le azioni di modifica/eliminazione;
5. nella lista rendere disponibile ricerca testuale e filtro `Consegne da leggere`;
6. mostrare il pulsante di presa visione solo se la consegna è pendente e l'utente può leggere il minore.

## Audit e privacy

Il backend registra audit per apertura turno, chiusura/firma e presa visione consegna. L'UI non deve chiedere né trasmettere dati di firma, impronte, OTP o password aggiuntive.

## Contratto aggiornato

La fonte definitiva API è `docs/api/openapi.yaml`. Sostituisce, per gli aspetti sopra indicati, i campi di presa visione manuale descritti nel precedente handoff Diario educativo v2.
