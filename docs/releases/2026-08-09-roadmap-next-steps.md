# FamilyHub ? Roadmap operativa prossimi step

Data: 2026-08-09
Stato: roadmap condivisa post-blocco timesheet rettifiche

---

## Sequenza concordata

Ordine di lavoro:

1. completamento `Turni / Timesheet` fase 2 avanzata
2. passaggio al blocco `Messaggistica interna cifrata`
3. passaggio al blocco `Documentale evoluto`

---

## Step 1 ? Turni / Timesheet fase 2 avanzata

### 1A. Coda revisione rettifiche
- elenco admin/coordinatore delle rettifiche `pending`
- filtri per struttura, operatore, periodo, stato
- KPI rapidi: pendenti, approvate, rifiutate, tempo medio revisione

### 1B. Lock contabile mensile
- chiusura mensile per struttura
- blocco modifica entry e rettifiche dopo lock
- audit dedicato su lock/unlock

### 1C. Export amministrativo evoluto
- export mensile con colonna rettifiche
- export dettaglio verifiche/revisioni
- preset per payroll / consulente lavoro

### 1D. Dashboard timesheet coordinatore
- anomalie aperte
- ore straordinarie
- assenze riconciliate
- rettifiche da approvare

---

## Step 2 ? Messaggistica interna cifrata

### 2A. Partecipanti backend completi
- endpoint partecipanti mancanti
- composizione conversazioni per struttura / minore / tema
- controllo RBAC + ABAC coerente

### 2B. Scope messaggi allineati ai tag documentali
- `clinical`
- `legal`
- `education`
- `general`
- mapping visibile e amministrabile

### 2C. Audit messaggistica
- creazione messaggio
- lettura messaggio sensibile
- modifica stato lettura/presa visione

### 2D. Guida utente + handoff UX
- box informazioni sezione
- contratto API finale
- checklist QA completa

---

## Step 3 ? Documentale evoluto

### 3A. Gestione ABAC amministrabile da UI
- rendere esplicita la matrice ruolo/classificazione
- visibilit? `preview` vs `download`
- fallback chiari per nuovi tag/classificazioni

### 3B. Workflow documento
- bozza
- in verifica
- approvato
- archiviato / revocato
- audit su transizioni stato

### 3C. KPI documentali
- documenti in verifica
- documenti scaduti / in scadenza
- documenti previewati
- documenti scaricati

### 3D. Release package
- release notes GitHub
- README/versioning remoto riallineato
- checklist deploy ambiente nuovo

---

## Nota importante

Il repository locale ? avanti rispetto a `origin/master`.

Prima di dichiarare chiusa la release pubblica bisogna:

1. verificare UX sugli handoff aperti
2. fare eventuale commit finale del prossimo blocco
3. push verso GitHub
4. aggiornare release notes GitHub e README remoto
