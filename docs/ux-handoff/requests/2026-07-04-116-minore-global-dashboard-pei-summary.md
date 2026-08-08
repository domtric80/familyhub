# Handoff UX/API - Dashboard globale minore con sintesi PEI

Data: 2026-07-04
Priorita: alta
Ambito: scheda dettaglio minore
File target frontend: `frontend/src/pages/minori/MinoreDetailPage.tsx`

## Obiettivo

La dashboard PEI non deve vivere solo nella tab `Anagrafica`.
Serve anche un riepilogo globale del minore, visibile da tutte le tab della scheda, per dare subito contesto operativo a chi entra.

## Posizionamento obbligatorio

Inserire una card `Dashboard minore`:
- sotto il page title / breadcrumb
- sopra il blocco con le tab
- sempre visibile indipendentemente dalla tab attiva

## Contenuto obbligatorio della card globale

### Badge di contesto
Mostrare sempre:
- `Struttura`
- `Stato`
- `Documenti`
- `Contatti`

### KPI PEI sintetici
Mostrare sempre 6 KPI:
- `PEI attivi`
- `Obiettivi`
- `Completati`
- `Avanzamento medio`
- `Eventi attivit?`
- `Eventi diario`

Sorgente dati:
- `minor.pei_trends.summary`
- `minor.documents.length`
- `minor.contacts.length`
- `minor.facility.name`
- `minor.minor_status.name`

## Regole UX

- Questa card e' un riepilogo compatto, non sostituisce il dettaglio in `Anagrafica`.
- La card non deve avere azioni di editing.
- La card deve usare fallback `?` per valori testuali mancanti.
- I contatori mancanti devono mostrare `0`.
- Non fare richieste API aggiuntive: usare solo il payload gia caricato della scheda minore.

## Relazione con la tab `Anagrafica`

La tab `Anagrafica` continua a mostrare:
- card completa `Trend PEI`
- andamento obiettivi
- eventi recenti PEI
- righe anagrafiche dettagliate

La dashboard globale serve solo come livello 1 di lettura rapida.

## QA checklist per UX

### Visibilita globale
- [ ] La card appare prima delle tab
- [ ] Cambiando tab la card resta visibile
- [ ] La card non duplica il dettaglio esteso degli obiettivi

### Coerenza dati
- [ ] `PEI attivi` coincide con il riepilogo del tab `Anagrafica`
- [ ] `Obiettivi` coincide con il riepilogo del tab `Anagrafica`
- [ ] `Avanzamento medio` coincide con il riepilogo del tab `Anagrafica`
- [ ] `Documenti` coincide con il numero documenti caricati in tab `Documenti`
- [ ] `Contatti` coincide con il numero contatti nella tab `Contatti`

### Fallback
- [ ] se struttura non e' valorizzata mostra `?`
- [ ] se stato non e' valorizzato mostra `?`
- [ ] se non ci sono documenti mostra `0`
- [ ] se non ci sono contatti mostra `0`
- [ ] se `pei_trends` manca, i KPI PEI devono restare a `0`

## Note implementative

- Il riepilogo globale e la card completa PEI devono convivere.
- Non spostare il dettaglio PEI fuori da `Anagrafica`.
- Non introdurre grafici nella card globale: solo badge + KPI sintetici.
