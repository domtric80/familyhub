# UX Handoff — Upload documenti Office abilitato lato backend

Data: 2026-07-03
Ambito: Documenti minore / upload allegati
Priorità: Alta

## Cosa è stato corretto

Il backend rifiutava file `DOC/DOCX/XLS/XLSX` con messaggio generico di validazione perché la policy server `DOCUMENT_ALLOWED_MIME_TYPES` consentiva solo:

- `application/pdf`
- `image/jpeg`
- `image/png`

La policy ora include anche:

- `application/msword`
- `application/vnd.ms-excel`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

## Impatto frontend

- Nessun cambio payload API.
- Nessun cambio route.
- Il frontend può continuare a mostrare il messaggio corrente, ma da questo fix in poi `doc`, `docx`, `xls`, `xlsx` non devono più essere considerati formati bloccati lato UI.
- Se nella UI esiste una help text sui formati consentiti, aggiornarla esplicitamente a:
  - PDF
  - JPG / PNG
  - DOC / DOCX
  - XLS / XLSX

## Comportamento atteso

Quando l’utente carica un file Office valido:

1. l’upload viene accettato;
2. il documento entra in stato `pending`;
3. il worker esegue la scansione antivirus;
4. se il file è pulito passa a `clean` e diventa visualizzabile/scaricabile.

## Nota operativa

Se UX continua a vedere il rifiuto dopo il deploy del fix, non è un problema di form:

- verificare che i container `app` e `worker` siano stati ricreati con la nuova env;
- verificare che il browser stia inviando un mime type coerente con il file selezionato.
