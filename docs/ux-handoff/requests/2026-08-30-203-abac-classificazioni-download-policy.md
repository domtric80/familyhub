# UX Handoff 203 — Classificazioni documentali: lettura e download separati

Data: 2026-08-30

## Obiettivo

La pagina `Anagrafiche -> Classificazioni doc.` deve permettere di configurare in modo esplicito due livelli ABAC:

1. ruoli che possono leggere/vedere in preview i documenti della classificazione;
2. ruoli che possono scaricare i documenti della classificazione.

Il download non deve mai essere piu ampio della lettura.

## Endpoint coinvolti

### `GET /api/admin/document-classifications`

Restituisce una lista di classificazioni.

Campi nuovi/canonici da usare:

```json
{
  "id": 1,
  "code": "clinical",
  "name": "Clinico",
  "description": "Documento clinico o psicologico con accesso strettamente controllato.",
  "allowed_role_codes": ["SUPER_ADMIN", "DIRETTORE", "PSICOLOGO", "PEDIATRA"],
  "allowed_roles": ["SUPER_ADMIN", "DIRETTORE", "PSICOLOGO", "PEDIATRA"],
  "allowed_download_role_codes": ["SUPER_ADMIN", "DIRETTORE", "PSICOLOGO", "PEDIATRA"],
  "allowed_download_roles": ["SUPER_ADMIN", "DIRETTORE", "PSICOLOGO", "PEDIATRA"],
  "is_active": true
}
```

`allowed_roles` e `allowed_download_roles` restano alias retrocompatibili. Il frontend nuovo deve preferire `allowed_role_codes` e `allowed_download_role_codes`.

### `POST /api/admin/document-classifications`

Payload:

```json
{
  "code": "school_report",
  "name": "Scolastico",
  "description": "Documenti scolastici.",
  "allowed_role_codes": ["SUPER_ADMIN", "COORDINATORE", "EDUCATORE"],
  "allowed_download_role_codes": ["SUPER_ADMIN", "COORDINATORE"],
  "is_active": true
}
```

### `PUT /api/admin/document-classifications/{document_classification}`

Stesso payload del `POST`.

## Regole UX obbligatorie

- Mostrare due gruppi distinti di checkbox:
  - `Ruoli ammessi in lettura`
  - `Ruoli ammessi al download`
- Se l'utente seleziona un ruolo nel gruppo download, quel ruolo deve risultare selezionato anche in lettura.
- Se l'utente deseleziona un ruolo dalla lettura, quel ruolo deve essere deselezionato anche dal download.
- Mostrare una colonna `Ruoli download` nella tabella classificazioni.
- Non usare testo libero per i ruoli: usare solo i ruoli restituiti da `GET /api/lookups/roles`.

## Regole backend gia applicate

- Il backend valida che i codici ruolo esistano.
- Il backend salva `allowed_download_role_codes` solo come sottoinsieme di `allowed_role_codes`.
- Anche se il frontend invia un ruolo in download ma non in lettura, il backend lo scarta.
- Il download effettivo richiede sempre anche RBAC `attachments.download`.

## Impatto su sicurezza

- ABAC decide quali classificazioni documentali un ruolo puo leggere o scaricare.
- RBAC resta il livello funzionale di base:
  - preview: `attachments.read`
  - download: `attachments.download`
  - upload: `attachments.upload`
- Nuove classificazioni restano di fatto deny-by-default finche non vengono associate ai ruoli corretti.

## File frontend gia adeguati nel ramo backend

- `frontend/src/pages/anagrafiche/ClassificazioniPage.tsx`
- `frontend/src/types/index.ts`

## Verifica funzionale richiesta a UX

1. Aprire `Anagrafiche -> Classificazioni doc.`.
2. Creare una classificazione con lettura per `EDUCATORE` e download solo per `COORDINATORE`.
3. Salvare e riaprire la classificazione.
4. Verificare che la tabella mostri separatamente ruoli lettura e ruoli download.
5. Deselezionare `EDUCATORE` dalla lettura e verificare che venga tolto anche dal download se era presente.
