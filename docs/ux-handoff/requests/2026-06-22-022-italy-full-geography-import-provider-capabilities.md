# Richiesta UX 022 · Import geografia Italia completa e capacità provider

Data: 2026-06-22

## Obiettivo

Rendere comprensibile all’operatore se il provider selezionato può:

- importare solo la nazione
- importare anche regioni
- importare anche province
- importare anche città

## Contesto backend

L’endpoint operativo resta:

- `POST /api/admin/geography-imports`

Per ora il comportamento reale è:

- `ISTAT` → import completo Italia (`countries`, `regions`, `provinces`, `cities`)
- `GEONAMES` → sola anagrafica nazione

## Requisiti UX

- In pagina `Import geografia`, dopo la scelta della nazione, mostrare un box `Capacità provider`.
- Se la nazione è `IT`, mostrare che il provider operativo è `ISTAT`.
- Se il provider è `ISTAT`, mostrare badge:
  - `Nazione`
  - `Regioni`
  - `Province`
  - `Città`
- Se il provider è generico `GEONAMES`, mostrare badge:
  - `Nazione`
  - `Regioni non disponibili`
  - `Province non disponibili`
  - `Città non disponibili`

## Messaggi obbligatori

### Caso Italia / provider completo

Testo suggerito:

`Questo provider popola il database geografico italiano con regioni, province e città, in base al dataset ISTAT configurato.`

### Caso provider generico

Testo suggerito:

`Questo provider aggiorna solo l'anagrafica della nazione. I livelli amministrativi inferiori non sono disponibili con il provider corrente.`

## Risultato import

Nel pannello risultato mostrare sempre:

- provider usato
- nazione importata
- conteggio nazioni
- conteggio regioni
- conteggio province
- conteggio città

## Vincolo

La UI non deve mai promettere import completo per provider che non lo supportano realmente.
