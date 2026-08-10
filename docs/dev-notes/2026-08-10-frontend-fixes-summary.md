# Fix frontend — Riepilogo sessione 2026-08-10

Data: 2026-08-10  
Tipo: Bug fix + miglioramenti UX  
Da includere in: Release Notes

---

## 1. Breadcrumb navigabili — GeografiaPage

**File:** `frontend/src/pages/anagrafiche/GeografiaPage.tsx`

### Problema
I livelli della gerarchia geografica (Nazioni → Regioni → Province → Città) erano visualizzati come badge statici non cliccabili. L'utente non poteva risalire la gerarchia senza usare i dropdown.

### Fix
Sostituiti i badge con un `<ol class="breadcrumb">` navigabile:
- Cliccando "Nazioni" → torna alla lista delle nazioni
- Cliccando il nome nazione → torna alle regioni di quella nazione
- Cliccando il nome regione → torna alle province di quella regione
- Il livello corrente è non cliccabile (classe `active`)

---

## 2. Breadcrumb navigabili — CittaDetailPage

**File:** `frontend/src/pages/anagrafiche/CittaDetailPage.tsx`

### Problema
Nel dettaglio di una città (`/anagrafiche/geografia/citta/:id`), i nodi del breadcrumb (nazione, regione, provincia) erano testo statico non cliccabile.

### Fix
I nodi del breadcrumb sono ora `<button>` che invocano `navigate('/anagrafiche/geografia', { state: { countryId, regionId, provinceId } })` con gli ID appropriati.

`GeografiaPage` legge lo state alla navigazione e pre-seleziona automaticamente i livelli richiesti tramite chiamate API in cascata (`list(countryId)` → `list(regionId)` → `list(provinceId)`), ripristinando la vista corretta senza che l'utente debba ri-navigare manualmente.

---

## 3. Bug encoding caratteri speciali — MessaggioDetailPage

**File:** `frontend/src/pages/messaggi/MessaggioDetailPage.tsx`

### Problema
Caratteri speciali visualizzati come sequenze illeggibili, es. `PULIZIAâ€" allineamento` invece di `PULIZIA — allineamento`.

### Causa
Mojibake: byte UTF-8 re-interpretati come Windows-1252 e risalvati come UTF-8.

Caratteri coinvolti: `…` (ellipsis), `—` (em dash), `è`, `·`

### Fix
Sostituiti tutti i caratteri mojibake con i codepoint Unicode corretti.

**Da includere in Release Notes:**
> Fix encoding caratteri speciali in MessaggioDetailPage — Risolto problema di visualizzazione che mostrava sequenze illeggibili (`â€"`, `â€¦`, `Ã¨`) al posto di trattini, puntini di sospensione e lettere accentate nella pagina di dettaglio conversazione.

---

## 4. OrganizzazioniPage — CRUD completo + fix form

**File:** `frontend/src/pages/admin/OrganizzazioniPage.tsx`

### Problema A: nota stale
La pagina mostrava un alert "Modifica ed Elimina sono predisposte — endpoint backend non ancora disponibili" con i pulsanti disabilitati. Gli endpoint `PUT /admin/organizations/:id` e `DELETE /admin/organizations/:id` erano già presenti in `api.ts` e disponibili sul backend.

### Fix A
Rimosso l'alert, abilitati i pulsanti Modifica ed Elimina con CRUD completo:
- Modifica: modal pre-compilata con i dati esistenti
- Elimina: modal di conferma con gestione errori 403
- Errori campo restituiti dal backend mappati su ogni singolo input

### Problema B: validazione "Nome obbligatorio" anche con campo compilato
`react-hook-form` con `register` non leggeva correttamente il valore dell'`Input` di reactstrap all'interno della Modal (il ref non veniva propagato al nodo DOM sottostante), causando la validazione "required" anche quando il campo era compilato.

### Fix B
Form riscritto con `useState` + controlled inputs (`value/onChange`), coerente con il pattern usato in tutte le altre pagine del progetto. Validazione inline prima del submit, senza dipendenze da react-hook-form.

---

## Azioni richieste a sviluppo

Nessuna modifica backend richiesta per questi fix. Tutti i cambiamenti sono puramente frontend.

Per le Release Notes, includere:
1. Breadcrumb navigabili in pagina Geografia e dettaglio Città
2. Fix encoding caratteri speciali in Messaggistica (dettaglio conversazione)
3. Organizzazioni: abilitati Modifica ed Elimina + fix bug validazione form
