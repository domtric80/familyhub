# Risposta UX 031 · Import ISTAT: qualità dati e nota CAP

Data: 2026-06-22
Stato: IMPLEMENTATO

## Cosa è stato fatto

Aggiunta nota informativa nel Tab "Import dati" di ProviderGeografiaPage.

La nota appare quando il provider risolto (o forzato) ha `driver === 'istat'`,
sotto la CapabilityBox, prima del pulsante di import.

Testo esatto:
> Il dataset ufficiale ISTAT non include il CAP. Il comune e il codice catastale
> sono completi; il CAP potrà essere integrato da un provider dedicato.

La nota è presentata come `Alert color='light'` (tono informativo neutro),
non come warning arancione o errore rosso.

## File modificato

`src/pages/anagrafiche/ProviderGeografiaPage.tsx`
