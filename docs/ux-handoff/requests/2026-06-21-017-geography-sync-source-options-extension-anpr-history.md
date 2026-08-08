# FamilyHub · Richiesta UX 017 · Estensione sorgenti console sync con storico ANPR

Data: 2026-06-21

## Contesto

Il backend supporta ora una nuova sorgente di avvio per la console sync geografia:

- `anpr_history`

Scopo:

- import raw dello storico comuni ANPR
- tracciamento eventi come rename, merge, ceased

## Modifica richiesta

Nella modale `Avvia verifica`, il select `source` deve ora includere:

- `geonames`
- `seed`
- `istat`
- `anpr_history`

## Regole UX

- label suggerita: `Storico ANPR`
- il valore inviato al backend deve restare `anpr_history`
- se l’utente seleziona `anpr_history`, UX può pre-selezionare `scope=history_only`

## Impatto API

Payload `POST /api/admin/geography-sync/runs`:

```json
{
  "source": "anpr_history",
  "scope": "history_only",
  "dry_run": true
}
```

## Verifica richiesta

Il team UX deve confermare:

- aggiornamento select sorgenti
- mapping label/value corretto
- nessuna regressione sulle altre opzioni

Risposta attesa in:

- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-21-017-geography-sync-source-options-extension-anpr-history-response.md`
