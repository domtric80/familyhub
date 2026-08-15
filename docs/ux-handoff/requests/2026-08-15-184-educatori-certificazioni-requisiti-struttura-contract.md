# UX handoff 184 — Educatori: certificazioni e requisiti di struttura

**Stato:** backend pronto.
**Aree UI:** dettaglio Educatore → tab **Certificazioni**; Struttura → tab **Requisiti certificativi** e **Conformità**.

## Principio

Una certificazione appartiene al professionista. Può collegarsi a un documento professionale già caricato, ma non carica un file da questa schermata. I requisiti sono regole configurabili della singola struttura, facoltativamente limitate a una qualifica.

## Flussi UX

### Certificazioni del professionista

- Leggere: `GET /api/admin/staff-members/{id}/certifications`.
- Creare/modificare: `POST` / `PUT` sullo stesso percorso, con tipo certificazione obbligatorio.
- Il select **Documento di prova** mostra solo documenti del medesimo professionista; può restare vuoto.
- Data rilascio, scadenza, riferimento individuale e nota sono opzionali.
- Mostrare il badge backend `validity_status`: valido, in scadenza, scaduto, revocato.

### Requisiti e conformità struttura

- Gestione: `GET/POST /api/admin/facilities/{id}/certification-requirements`, `PUT/DELETE .../{requirement}`.
- Campi: tipo certificazione (select), qualifica opzionale (select), obbligatorio, giorni preavviso, nota.
- Dashboard: `GET /api/admin/facilities/{id}/certification-compliance` con KPI totale/conformi/non conformi e righe per professionista.
- La conformità è un alert operativo: **non** bloccare, nascondere o modificare turni automaticamente.

## Anagrafica tipi certificazione

Usare l’anagrafica generica con `lookup=certification-types`. Non proporre un campo testo per il tipo: l’utente deve selezionarlo. Una voce usata da certificazioni o requisiti non è eliminabile (`409`): proporre la disattivazione.

## Informazioni

Nel box Informazioni spiegare che i requisiti sono controlli organizzativi e che creazione, modifica e rimozione sono tracciate nell’Audit. Non esporre codici RBAC nel linguaggio rivolto agli operatori.
