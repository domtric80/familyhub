# UX Handoff 032 - Cascata geografica nei form minori

Data: 2026-06-22
Team destinatario: UX / Frontend
Ambito: Form minori, lookup geografia, anagrafiche città

## Modifica richiesta dal backend
Sono stati corretti gli endpoint:
- `GET /api/lookups/cities?province_id={id}`
- `GET /api/admin/cities?province_id={id}`

Ora il backend filtra realmente le città per `province_id`.

## Comportamento atteso UI
Nel form `Minori > Nuovo/Modifica` la nascita va gestita con cascata obbligata:
1. `Nazione di nascita`
2. `Regione di nascita`
3. `Provincia di nascita`
4. `Città di nascita`

## Regole UX
- finché non è selezionata la nazione, regione disabilitata
- finché non è selezionata la regione, provincia disabilitata
- finché non è selezionata la provincia, città disabilitata
- a ogni cambio padre, azzerare i figli
- non mostrare mai liste città globali fuori contesto provincia

## Messaggi placeholder consigliati
- `Seleziona prima una nazione`
- `Seleziona prima una regione`
- `Seleziona prima una provincia`

## Note implementative
Il form minori è già stato aggiornato lato codice per usare la gerarchia geografica. Verificare che il layout finale del team UX rispetti questo flusso e non reintroduca select globali.
