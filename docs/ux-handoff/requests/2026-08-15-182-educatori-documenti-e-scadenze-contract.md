# UX handoff 182 — Educatori: documenti professionali e scadenze

**Stato:** backend pronto per integrazione UX.
**Modulo:** Organizzazione → Educatori → dettaglio professionista.
**Dipendenze:** `staff_members.read`, `staff_members.update`, `attachments.upload`, `attachments.read`, `attachments.download`.

## Obiettivo UX

La scheda di un professionista deve avere il tab **Documenti professionali**. I documenti appartengono alla persona (`staff_member`), non all'account applicativo (`user`): un educatore puo quindi avere documenti anche senza credenziali di accesso.

## Flusso obbligatorio

1. Caricare un file con tipologia documento, data rilascio, eventuale data scadenza e stato amministrativo.
2. Mostrare subito lo stato tecnico `In verifica`: il file e in quarantena e non puo essere aperto, visualizzato o scaricato.
3. Aggiornare la lista; consentire preview/download solo quando `attachment.security_status` e `clean` e l'utente possiede il relativo permesso.
4. La modifica aggiorna **solo** data rilascio, data scadenza e stato amministrativo. Non esiste sostituzione silenziosa del file.
5. Per un file aggiornato, caricare un nuovo documento e archiviare logicamente il precedente. L'archiviazione non cancella il file e deve chiedere conferma.

## Endpoint

| Operazione | Metodo e URL | Permesso |
|---|---|---|
| Elenco | `GET /api/admin/staff-members/{staff_member}/documents` | `staff_members.read` |
| Caricamento multipart | `POST /api/admin/staff-members/{staff_member}/documents` | `attachments.upload` |
| Dettaglio | `GET /api/admin/staff-members/{staff_member}/documents/{document}` | `staff_members.read` |
| Modifica metadati | `PUT /api/admin/staff-members/{staff_member}/documents/{document}` | `staff_members.update` |
| Archiviazione logica | `DELETE /api/admin/staff-members/{staff_member}/documents/{document}` | `staff_members.update` |
| KPI/lista scadenze | `GET /api/admin/staff-documents/expiry-summary?facility_id={id}` | `staff_members.read` |

Per preview/download restano invariati gli endpoint esistenti. Il backend restituisce `423` se il file non e `clean`: non trasformare l'errore in un download forzato.

## Campi e stati

| Campo | Regola UX |
|---|---|
| `document_type_id` | Select obbligatoria da anagrafica Tipi documento. Mai input testuale libero. |
| `file` | Obbligatorio al solo caricamento; applicare limiti di formato/dimensione dichiarati dal backend. |
| `issue_date` | Opzionale. |
| `expiry_date` | Opzionale; se presente non puo precedere `issue_date`. |
| `status_code` | Select dall'anagrafica Stati documento staff. Default backend `VALID`. |
| `attachment.security_status` | Badge tecnico: `pending` = In verifica, `clean` = Disponibile, ogni altro valore = Bloccato. |
| `expiry_status` | Badge calcolato: `no_expiry`, `valid`, `expiring`, `expired`. Non modificabile dalla UI. |
| `days_until_expiry` | Numero backend, `null` senza scadenza. |

## Schermata scadenze

Nel tab Documenti e nella dashboard organizzativa mostrare i tre KPI backend: **Scaduti**, **In scadenza**, **Validi**. La soglia di preavviso e server-side (`STAFF_DOCUMENT_EXPIRY_ALERT_DAYS`, default 30): la UI non deve inserire un selettore giorni ne calcolare badge autonomi.

La tabella deve includere: professionista, struttura, tipo documento, file, data rilascio, scadenza, giorni alla scadenza, stato amministrativo, stato tecnico file, azioni consentite. I record archiviati non vengono restituiti dagli endpoint operativi.

## Audit e informazioni

Caricamento, modifica e archiviazione generano audit con precedente/successivo per date e stato. Preview e download restano auditati separatamente. Nel box **Informazioni** spiegare che: (1) il file e utilizzabile solo dopo scansione; (2) l'archiviazione preserva la retention; (3) la scadenza e un alert e non blocca ancora automaticamente i turni.

## Non implementare lato UX

- nessun upload diretto verso S3/MinIO;
- nessuna sostituzione del binario con `PUT`;
- nessun calcolo locale di scadenza o bypass della quarantena;
- nessuna cancellazione fisica del file.
