# Guida operativa — Incidenti e segnalazioni

## A cosa serve

Il modulo registra eventi critici relativi a un minore e ne documenta la gestione fino alla chiusura. Sono incluse cadute, aggressioni, autolesionismo, fughe/allontanamenti e crisi; ulteriori tipologie possono essere censite nell'anagrafica amministrativa.

## Registrazione

L'operatore seleziona:

- minore;
- tipologia incidente;
- gravità verde, gialla o rossa;
- data e ora;
- eventuale luogo;
- descrizione;
- azioni immediate adottate;
- necessità di comunicazione a una autorità esterna.

Alla conferma l'incidente entra nello stato `Segnalato`. I testi sensibili vengono cifrati nel database.

## Escalation

1. Il coordinatore o referente effettua la prima revisione.
2. Il direttore effettua la revisione direttiva.
3. Se necessario, il direttore registra una o più comunicazioni verso autorità censite.
4. Coordinamento o direzione compilano la root cause analysis.
5. Il direttore chiude il caso quando i prerequisiti sono completi.

Il sistema impedisce salti di stato e registra autore, data, stato precedente, stato successivo e note.

## Root cause analysis

La RCA contiene:

- causa radice;
- misure correttive;
- eventuale responsabile appartenente alla stessa struttura;
- scadenza;
- data di completamento.

La chiusura richiede una RCA. Se l'incidente richiede comunicazione esterna, la chiusura richiede anche almeno una notifica registrata.

## Autorità esterne

La funzione `Precompila segnalazione` produce i dati necessari per il documento destinato all'autorità selezionata. Non invia email, PEC o documenti automaticamente. Dopo l'invio effettivo il direttore registra autorità, data, riferimento e note.

## Sicurezza e audit

- accesso RBAC più assegnazione al minore;
- nessun permesso incidenti per `ADMIN_IT`;
- contenuti narrativi cifrati a riposo;
- nessuna cancellazione fisica degli incidenti;
- timeline append-only;
- ogni operazione nello storico minore e nell'audit globale.
