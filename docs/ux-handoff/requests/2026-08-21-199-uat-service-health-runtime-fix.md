# UX Handoff 199 — Health servizi: correzione semantica runtime

## Stato

Backend e infrastruttura corretti. Nessuna nuova schermata richiesta.

## Endpoint invariati

- `GET /api/admin/system/health`
- `POST /api/admin/system/health/run`

Il contratto JSON e i valori ammessi di `status` restano invariati: `ok`, `warning`, `error`, `not_configured`.

## Comportamento corretto atteso

| `service` | Stato atteso nello stack Docker completo | Nota UX |
|---|---|---|
| `redis` | `ok` | Il backend espone `meta.response = "PONG"`. |
| `queue_worker` | `ok` | Deve restare verde anche quando la coda è vuota. |
| `scheduler` | `ok` | Heartbeat aggiornato ogni minuto dal container dedicato. |
| `antivirus` | `ok` | ClamAV configurato e raggiungibile; il processo HTTP usa la configurazione Docker effettiva. |

## Regole di visualizzazione

- Non cambiare mapping colori o componenti esistenti.
- Mostrare il messaggio restituito dal backend senza dedurre lo stato dal contenuto di `meta`.
- `not_configured` resta corretto solo quando il servizio non è applicabile, per esempio con driver antivirus diverso da `clamav`.
- Dopo `POST /run`, sostituire lo snapshot visualizzato con la risposta più recente.

## Verifica richiesta a UX

1. Aprire `/admin/sistema/health` con tutti i container attivi.
2. Eseguire il controllo manuale.
3. Verificare che Redis, queue worker, scheduler e ClamAV siano verdi.
4. Attendere almeno un minuto senza inviare job e ripetere il controllo: il worker deve restare verde.

## Impatto autenticazione

Nessun impatto UI. Il riavvio dei container non esegue più reset automatici di password o MFA.
