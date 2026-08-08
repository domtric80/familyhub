# Handoff UX/API — Campo etichetta documento minore

Data: 2026-07-03  
Area: `Minori > Documenti` + select documenti collegati in altri moduli  
Priorità: Alta

## Obiettivo

Rendere i documenti del minore leggibili in UI senza dipendere dal solo nome tecnico del file caricato.

## Nuovo campo backend

`MinorDocument.label`

Campo opzionale testuale, pensato come etichetta leggibile utente.

## Upload documento

Endpoint:

- `POST /api/minors/{minor}/documents`

Il backend accetta ora:

```json
label: "Decreto affidamento provvisorio"
```

Se `label` è omesso, il backend usa come fallback il nome file senza estensione.

## Response

Ogni `MinorDocument` include ora:

- `label`

## Regola UI obbligatoria

Quando la UI deve mostrare un documento del minore in:

- select
- tabella
- modal
- blocco collegamento provvedimento

deve usare questa logica:

1. `doc.label`
2. fallback `doc.attachment.original_name`

## Form upload documenti

Il form di upload deve esporre un campo:

- label consigliata: `Nome documento`

Precompilazione consigliata:

- nome file senza estensione

L’utente può modificarlo prima del salvataggio.

## Moduli impattati

- `Minori > Documenti`
- `Avvicinamenti > Provvedimento autorizzativo`
- `Minori > Scheda caso` quando si collegano decreto / cartella vaccinale

## QA minima

- caricare documento con label personalizzata
- verificare `label` nella response
- verificare che select collegamento documento mostri la label
- verificare fallback corretto se label è null
