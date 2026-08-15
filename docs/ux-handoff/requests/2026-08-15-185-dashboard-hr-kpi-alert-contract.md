# UX handoff 185 — Dashboard HR: KPI e alert operativi

**Stato:** backend pronto per integrazione.
**Endpoint:** `GET /api/admin/staff-hr-dashboard?facility_id={id}`. Il parametro struttura è facoltativo; senza filtro il backend restituisce il quadro aggregato.

## Obiettivo pagina

Creare una dashboard **HR** separata da Timesheet, dedicata allo stato anagrafico e documentale del personale. La pagina non modifica dati e non blocca automaticamente turni.

## KPI da mostrare

Usare esclusivamente `kpis` backend:

- personale totale e attivo;
- professionisti senza utenza applicativa;
- professionisti senza competenze / lingue registrate;
- documenti scaduti e in scadenza;
- certificazioni scadute e in scadenza;
- requisiti certificativi mancanti.

Non ricalcolare scadenze o conformità nel browser. La soglia documentale è `configuration.document_expiry_alert_days` ed è governata dal server.

## Alert e navigazione

Le tre liste `alerts.documents`, `alerts.certifications` e `alerts.missing_requirements` contengono al massimo 20 elementi, già ordinati per urgenza. Ogni riga deve portare alla scheda professionista o, per requisito mancante, alla sezione certificazioni del professionista. I badge `expired`, `expiring`, `revoked`, `missing` devono essere mostrati con testo comprensibile e non solo colore.

## Informazioni

Inserire il box: “La dashboard evidenzia scadenze e requisiti da verificare. Non modifica turni, ruoli o accessi al sistema.” La consultazione è auditata dal backend. Non mostrare codici tecnici di permesso.

## Non fare

- non sommare o filtrare localmente i KPI;
- non dedurre che un professionista senza account sia inattivo;
- non disabilitare persone o turni da questa pagina;
- non visualizzare file/documenti dall’alert: navigare alla scheda, dove valgono i normali permessi.
