# FamilyHub · Stato anagrafiche strutture

Data: 2026-06-22

## Stato corrente

Le strutture esistono già come entità di dominio e come anagrafica amministrativa.

### Backend disponibile

- lettura elenco
- creazione
- dettaglio singola struttura
- modifica
- eliminazione con blocchi di integrità applicativa

### Frontend disponibile

- elenco strutture
- creazione struttura
- modifica struttura
- eliminazione struttura
- cascata geografica nazione → regione → provincia → città

### Correzione applicata

È stato corretto il comportamento della modifica struttura:

- in edit la cascata geografica non deve più azzerare regione/provincia/città già presenti
- la tabella mostra anche la `Nazione`, oltre a regione/provincia/città

## Criticità attuale

La parte strutture è ora sostanzialmente allineata sul CRUD base.

Restano però aspetti da presidiare:

- permessi frontend più espliciti per pulsanti/azioni
- eventuale disattivazione separata dalla cancellazione fisica
- refinement UX del form amministrativo

## Direzione corretta

Le strutture devono usare la geografia canonica del sistema.

Quindi:

- nessun testo libero per città
- nessun select città globale non contestualizzato
- usare cascata:
  - nazione
  - regione
  - provincia
  - città

## Dipendenza con geografia provider-centric

La qualità dell’anagrafica strutture dipende direttamente dalla qualità del popolamento geografia.

Per questo motivo:

- prima si consolida il flusso geografia provider-centric
- poi si collega la pagina strutture alla geografia canonica importata
