# Handoff UX/API — Ripartenza UX dopo fix TypeScript frontend e preview documenti

Data: 2026-07-03  
Area: cross-modulo frontend  
Priorità: alta  
Tipo richiesta: avviso operativo di riallineamento

## 1. Obiettivo

Confermare al team UX che il frontend locale è tornato in stato compilabile e che il ticket sulle librerie preview documenti non è più bloccante.

## 2. Stato aggiornato

Sono stati completati questi interventi:

- eseguito `npm install` nel container `frontend`
- rese disponibili le librerie `mammoth` e `xlsx` richieste dalla preview documenti
- aggiunti type shim locali per `mammoth` e `xlsx`
- riallineati alcuni tipi TypeScript frontend rispetto ai payload reali backend
- corretti alcuni punti di nullability che impedivano la build

## 3. Esito verifica

La build frontend locale ora è **verde**:

```bash
docker compose exec -T frontend sh -lc "npm run build"
```

Esito atteso:

- compilazione TypeScript completata
- build Vite completata

## 4. Cosa UX può fare ora

Il team UX può procedere con:

- verifica della modale preview documenti
- sviluppo/affinamento UI sui moduli già consegnati
- integrazione del nuovo modulo `Messaggistica interna`
- QA visuale senza assumere che il problema sia ancora “dipendenze mancanti”

## 5. Cosa UX non deve più considerare aperto

Non trattare più come bug aperto:

- “mancano mammoth/xlsx”
- “serve npm install per sbloccare preview”

Questa parte è stata verificata e risolta nell’ambiente Docker locale corrente.

## 6. Note residue per UX

Restano solo warning non bloccanti di bundling:

- chunk JS grandi
- opportunità futura di code splitting/manual chunks

Questi warning **non bloccano** build, QA o sviluppo UX corrente.

## 7. File di riferimento

- `C:\Projects\FamilyHUB\frontend\src\types\vendor-preview-libs.d.ts`
- `C:\Projects\FamilyHUB\docs\dev-notes\2026-07-03-frontend-preview-libs-install-and-existing-ts-debt.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-07-03-098-document-preview-modal-response.md`

## 8. Azione richiesta a UX

- verificare la preview di:
  - PDF
  - immagini
  - DOCX
  - XLSX
- segnalare eventuali bug residui come:
  - rendering contenuto
  - layout modale
  - comportamento preview/download

e **non** come problema di installazione dipendenze.
