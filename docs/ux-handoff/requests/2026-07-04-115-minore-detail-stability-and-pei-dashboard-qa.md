# Handoff UX/API - Stabilizzazione scheda minore + dashboard PEI

Data: 2026-07-04
Priorita: alta
Ambito: `frontend/src/pages/minori/MinoreDetailPage.tsx`
Stato backend: gia disponibile

## Obiettivo

Consolidare definitivamente la scheda dettaglio minore prima di ulteriori evoluzioni UX.
Questo handoff serve a evitare regressioni su:
- tab Anagrafica
- tab Documenti
- tab Accesso al minore
- drawer Informazioni
- dashboard PEI in testata scheda

## Cosa e' stato corretto lato frontend tecnico

1. Ripristinati fallback `nullish` corretti (`??`) in piu punti dove il rendering era stato corrotto.
2. Ripristinati i valori reali nei campi documento, contatti e assegnazioni utenti.
3. Ripristinati i placeholder visivi coerenti con `?`.
4. Ripristinate etichette e testi italiani nella scheda minore.
5. Inserita card `Trend PEI` in alto nella tab `Anagrafica`.
6. Aggiornato il drawer `Informazioni` con spiegazione della dashboard PEI.

## Contratto UX da rispettare

### Tab `Anagrafica`
Ordine obbligatorio:
1. card `Trend PEI`
2. righe anagrafiche del minore

### Card `Trend PEI`
Blocchi obbligatori:
- KPI sintetici
- lista obiettivi con andamento
- eventi recenti PEI

### Tab `Documenti`
La tab deve mostrare correttamente, per ogni riga:
- tipo documento
- classificazione
- stato sicurezza
- ente emittente
- data emissione
- data scadenza
- dimensione file
- SHA256 troncato
- azioni anteprima/scarica

Se un campo non esiste, mostrare sempre `?`.
Non mostrare stringhe vuote, `null`, `undefined` o placeholder incoerenti.

### Tab `Accesso al minore`
La tab deve mostrare correttamente:
- nome utente
- email utente
- ruolo struttura
- validita temporale
- stato attiva/revocata

Se un campo non esiste, mostrare `?`.

## QA checklist obbligatoria per UX

### A. Anagrafica
- [ ] La card `Trend PEI` compare sopra ai dati anagrafici
- [ ] I KPI sono leggibili e non collassano su viewport standard desktop
- [ ] Il grafico mini-sparkline non rompe la card
- [ ] Se non ci sono obiettivi PEI compare l'alert neutro

### B. Documenti
- [ ] Nessuna colonna mostra `null`, `undefined`, stringa vuota o caratteri corrotti
- [ ] I fallback mostrano sempre `?`
- [ ] Il pulsante Anteprima si disabilita se il file non e' `clean`
- [ ] Il pulsante Scarica mostra stato di caricamento coerente
- [ ] I tooltip su file in verifica sono leggibili

### C. Accesso al minore
- [ ] Email e ruolo struttura vengono mostrati quando presenti
- [ ] Se mancano dati viene mostrato `?`
- [ ] La data `valid_to` vuota non genera buchi visivi

### D. Drawer Informazioni
- [ ] Spiega anche il significato del box Trend PEI
- [ ] Non contiene testi corrotti o placeholder errati

## Note per il team UX

- Non riscrivere la logica della card PEI: il frontend deve solo consumare `pei_trends` dal payload gia esistente.
- Non introdurre chiamate API aggiuntive per la card PEI.
- Non spostare la card nel tab `Profilo`: deve stare in `Anagrafica`.
- La card e' consultiva, non editabile.

## Smoke check tecnico eseguito

- Verifica TypeScript locale: `tsc --noEmit` eseguito con esito positivo.

## File interessato

- `C:\Projects\FamilyHUBrontend\src\pages\minori\MinoreDetailPage.tsx`
