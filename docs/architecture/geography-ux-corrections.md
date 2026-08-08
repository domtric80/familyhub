# FamilyHub · Correzione concettuale UX geografia

Data: 2026-06-22

## Problema rilevato

L’applicazione espone più voci e più pagine che rappresentano concetti diversi ma parzialmente sovrapposti:

- sincronizzazione tecnica
- scarico da raw
- import on-demand
- provider

Questo modello è corretto come distinzione interna backend, ma è sbagliato come esperienza utente amministrativa.

## Distinzione corretta

### Backend

Il backend può mantenere concetti distinti:

- `sync`
- `load`
- `import`
- `provider resolution`

### Frontend amministrativo

L’utente non deve vedere tutti questi strati come funzioni separate di primo livello.

Per l’utente amministrativo il modello corretto è:

- configurare un provider
- associare il provider alla nazione
- importare i dati tramite provider

## Decisione

Il frontend deve essere provider-centric.

Quindi:

- `Provider geografia` = pagina principale
- `Import dati` = tab/azione interna a provider geografia
- `Sincronizzazione geografia` = console tecnica
- `Scarico geografia` = non più esposta come funzione autonoma
- `Import geografia` = non più esposta come funzione autonoma

## Motivazione sul dato città

Il dato città è critico per documenti e identità del minore.
L’operatore non deve essere spinto a scrivere testo libero quando è disponibile una fonte ufficiale o controllata.

Il sistema deve favorire:

- dati importati da provider affidabili
- lookup certi
- riduzione degli errori ortografici e amministrativi
