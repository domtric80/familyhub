## Handoff UX/API - Preview XLSX strutturata + permesso download allegati

Data: 2026-08-08  
Area: `Documenti minore`, `Documenti staff`, `Ruoli`, `Accesso documentale`  
Priorita: alta  
Tipo: security hardening + chiarimento UX

### 1. Preview XLSX

Per i file `.xlsx` il backend ora espone una **preview strutturata server-side**.

Obiettivo:

- permettere consultazione del contenuto
- evitare di inviare il file originale al browser quando serve solo la preview

Endpoint nuovi:

- `GET /api/minors/{minor}/documents/{document}/preview-structured`
- `GET /api/admin/staff-members/{staff_member}/documents/{document}/preview-structured`

Uso UI:

- se il documento è `xlsx`, il viewer deve usare questi endpoint
- la risposta è JSON read-only con elenco fogli e celle
- non trattarla come download o blob

### 2. Download separato

Il download resta distinto dalla preview:

- preview = `attachments.read`
- download = `attachments.download`

Quindi il frontend deve prevedere il caso:

- documento visibile in preview
- ma download non consentito

### 3. Pagina Ruoli / RBAC

Nella vista ruolo il team UX deve mostrare separatamente:

- lettura documenti
- download allegati
- upload documenti

Non vanno più sintetizzati in un solo stato “accesso documenti”.

### 4. Matrice documentale

La matrice admin deve distinguere:

- `Lettura effettiva`
- `Download effettivo`

Per ogni classificazione/tag.

### 5. Messaggi utente consigliati

- Preview consentita ma download negato:
  - `Puoi consultare il documento, ma il download non è consentito per il tuo ruolo o per questa classificazione.`
- File non supportato da preview strutturata:
  - `Questo file non supporta l’anteprima strutturata.`

### 6. Note sicurezza

La preview strutturata attuale è disponibile per `xlsx`.

Per i file `xls` legacy:

- nessuna preview strutturata
- mantenere comportamento restrittivo

