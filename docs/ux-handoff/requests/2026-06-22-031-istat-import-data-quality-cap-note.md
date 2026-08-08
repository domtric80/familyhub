# UX Handoff 031 - Import ISTAT: qualità dati e nota CAP

Data: 2026-06-22
Team destinatario: UX / Frontend
Ambito: Geografia > Provider > Import dati

## Contesto
Il backend importa correttamente il dataset ufficiale ISTAT dei comuni italiani.
Dopo il fix parser, il caricamento canonico produce:
- 20 regioni
- 107 province
- 7896 comuni
- 0 comuni senza codice catastale

## Nota importante sui CAP
Il file ufficiale ISTAT usato dal provider `ISTAT` **non contiene il CAP**.
Di conseguenza:
- il backend salva `postal_code = null` per i comuni importati da questo provider;
- l'assenza del CAP **non è un errore di import**;
- in UI non va mostrato come anomalia tecnica del parser.

## Richiesta UX
Nella vista `Import dati` e/o nelle viste anagrafiche geografiche:
1. mostrare un testo informativo quando il provider risolto è `ISTAT`;
2. testo suggerito: `Il dataset ufficiale ISTAT non include il CAP. Il comune e il codice catastale sono completi; il CAP potrà essere integrato da un provider dedicato.`
3. evitare warning rossi o messaggi di errore quando il solo campo mancante è il CAP per provider ISTAT.

## Nessun cambio API
Nessuna variazione endpoint o payload rispetto alle specifiche già consegnate.
Il cambiamento è solo nella qualità del parsing backend e nella semantica da comunicare all'utente.
