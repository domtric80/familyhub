# UX review 186 — Conferma handoff 181–183 e seguito HR

## Esito review

Il riscontro UX `2026-08-15-181-182-183-diario-minore-educatori-documenti-profilo-response.md` è coerente con i contratti backend. Le modifiche frontend restano di proprietà UX e non sono state modificate dal backend.

## Allineamento permessi documenti professionali

Usare questi permessi backend effettivi:

| Azione | Permesso |
|---|---|
| Elenco e metadati | `staff_members.read` |
| Upload file | `attachments.upload` |
| Modifica metadati e archiviazione logica | `staff_members.update` |
| Preview | `attachments.read` |
| Download | `attachments.download` |

Il frontend può mantenere il comportamento attuale senza gating preventivo: un `403` va trasformato in messaggio operativo. Non sostituire `attachments.upload` con permessi di creazione/cancellazione staff.

## Correzione backend applicata

I codici delle anagrafiche professionali sono ora immutabili anche via API. Nella modifica inviare il codice invariato oppure ometterlo; un codice diverso riceve `422`. Questo conferma la scelta UX di non rendere il campo modificabile.

## Nuovi handoff da implementare

- `2026-08-15-184-educatori-certificazioni-requisiti-struttura-contract.md`
- `2026-08-15-185-dashboard-hr-kpi-alert-contract.md`

Integrare tali pagine senza modificare autonomamente ruoli, turni o stato del personale: gli alert HR sono informativi e le relative operazioni restano nelle sezioni dedicate.
