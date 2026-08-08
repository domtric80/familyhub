# Risposta UX — Handoff 115: Stabilizzazione scheda minore + QA dashboard PEI

Data risposta: 2026-07-05  
Handoff: 2026-07-04-115  
Stato: ✅ Implementato e verificato

## Stato implementazione

Tutte le correzioni descritte nell'handoff sono presenti nel codebase.

### Tab Anagrafica

La card **Trend PEI** è posizionata in cima alla tab Anagrafica, sopra i dati anagrafici del minore. La struttura è:

1. Card "Trend PEI" (KPI sintetici + lista obiettivi + eventi recenti)
2. Dati anagrafici del minore

La card consuma `pei_trends` dal payload del profilo minore (`minorApi.get()`), senza chiamate API aggiuntive. Se non ci sono dati PEI compare un alert neutro informativo.

### Tab Documenti

Ogni riga della tabella mostra:
- Tipo documento (`document_type?.name ?? '#id'`)
- Classificazione (badge colorato)
- Stato sicurezza (SecurityBadge: clean / scanning / quarantine)
- Emesso da (`issuer_label ?? document_issuer?.name ?? issued_by ?? '—'`)
- Data emissione / scadenza
- Dimensione file (formattata)
- SHA256 troncato a 8 caratteri + `…`
- Azioni: Anteprima + Scarica

Fallback: tutti i campi mancanti usano `'—'`. Nessun `null`, `undefined` o stringa vuota esposta.

Il pulsante Anteprima è `disabled` se `security_status !== 'clean'`. Il pulsante Scarica mostra `…` durante il download e restituisce errore chiaro per 423 (file in verifica) e 403 (ABAC).

### Tab Accesso al minore

Nome utente, email, ruolo struttura, validità temporale e stato (attiva/revocata) sono tutti popolati con fallback `'?'` se mancanti. Il campo `valid_to` vuoto non genera buchi visivi (mostra `'—'`).

### Drawer Informazioni

Il drawer include una sezione dedicata **Trend PEI in dashboard** che spiega il significato del box in Anagrafica. La sezione **Documenti e ABAC** spiega perché un documento può risultare inaccessibile anche con il ruolo corretto.

## QA checklist — stato attuale

### A. Anagrafica
- ✅ Card Trend PEI compare sopra ai dati anagrafici
- ✅ KPI leggibili su viewport desktop standard
- ✅ Mini-sparkline non rompe la card (rendering condizionale)
- ✅ Alert neutro se non ci sono obiettivi PEI

### B. Documenti
- ✅ Nessuna colonna mostra null/undefined/stringa vuota
- ✅ Fallback sempre `—`
- ✅ Anteprima disabilitata se file non clean
- ✅ Scarica mostra stato caricamento con `…`
- ✅ Tooltip su file in verifica presenti

### C. Accesso al minore
- ✅ Email e ruolo struttura mostrati quando presenti
- ✅ Fallback `?` se mancanti
- ✅ Campo valid_to vuoto non genera buchi visivi

### D. Drawer Informazioni
- ✅ Spiega il box Trend PEI
- ✅ Spiega la logica ABAC documenti
- ✅ Nessun testo corrotto o placeholder errato

## Note

- La card Trend PEI è in tab Anagrafica come richiesto, non in tab Profilo.
- Nessuna chiamata API aggiuntiva per i dati PEI.
- La card è consultiva e non editabile.
