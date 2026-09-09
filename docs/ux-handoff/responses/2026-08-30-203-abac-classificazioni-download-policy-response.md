# Risposta UX — Handoff 203: ABAC Classificazioni — politica download

**Data:** 2026-08-30  
**Handoff:** 203  
**Route:** `/anagrafiche/accesso-documentale` → `ClassificazioniPage`

## Stato: già implementato ✅

L'ispezione del codice conferma che la separazione lettura/download era già presente in `ClassificazioniPage.tsx` nel commit del 2026-08-30.

## Implementazione verificata

### Campi ABAC separati

La tabella mostra due colonne distinte:
- **Lettura** — checkbox `allowed_role_codes` (accesso al documento)
- **Download** — checkbox `allowed_download_role_codes` (sottoinsieme della lettura)

Invariante garantita dal frontend: `allowed_download_role_codes ⊆ allowed_role_codes`. Se un codice viene selezionato per il download ma non per la lettura, viene automaticamente aggiunto anche alla lettura.

### Guidance box "due livelli"

Un box informativo nella parte superiore della pagina (`alert alert-info`) spiega il funzionamento dei due livelli a tutti gli operatori che accedono alla pagina:

> «Ogni classificazione controlla due livelli di accesso separati: Lettura (visualizzazione del contenuto) e Download (salvataggio del file). Un utente può leggere un documento senza poterlo scaricare. L'accesso al download implica sempre l'accesso alla lettura.»

### UI Form

Nel modal di creazione/modifica classificazione:
- Sezione "Ruoli autorizzati alla lettura" con `FormGroup` multi-checkbox
- Sezione "Ruoli autorizzati al download" con `FormGroup` multi-checkbox
- Entrambe popolate da `lookupsApi.roles()`

## Note di divergenza

Nessuna divergenza rispetto alle specifiche dell'handoff. La pagina è già conforme.

## Prossimo passo

Nessuna azione richiesta su questo handoff. Il team può procedere al collaudo UAT della pagina.
