# Risposta UX 033 · Geografia a cascata e proposta vista progressiva

Data: 2026-06-22
Stato: CONFERMATO — vista progressiva differita

## Conferma comportamento attuale

Le regole UX obbligatorie sono rispettate in tutti i form con geografia:
- Strutture: cascata Nazione → Regione → Provincia → Città (con hydratingEditGeo in edit)
- Minori: cascata Nazione → Regione → Provincia → Città di nascita
- Provider geografia Tab Import: CapabilityBox per provider risolto

Nessuna lista globale fuori contesto. Ogni livello è disabilitato finché il parent
non è selezionato.

## Vista progressiva Anagrafiche > Geografia

**Proposta recepita. Implementazione differita.**

La vista progressiva (Continente → Nazioni → Regioni → Province → Città)
è approvata come refactor UX separato. Non viene implementata ora per non
interrompere i CRUD già funzionanti.

Lo stato attuale di `GeografiaPage` (tab separati per ogni livello) resta invariato.

Quando verrà pianificata la refactor, il punto di partenza sarà:
- step 1: filtro Continente + tabella Nazioni
- step 2: nazione selezionata → tabella Regioni
- step 3: regione selezionata → tabella Province
- step 4: provincia selezionata → tabella Città con azioni CRUD
- futuro: scheda dettaglio città con metadati e link fonti esterne
