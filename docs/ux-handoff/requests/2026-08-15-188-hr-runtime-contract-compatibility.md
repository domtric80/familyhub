# 188 — Compatibilità runtime contratti HR

**Stato:** implementato lato backend — nessuna attività frontend richiesta.

Le API HR mantengono i campi canonici descritti nei contratti 182–185 e accettano anche gli alias già usati dall'interfaccia:

- certificazioni: `certification_type_id`, `document_id`, `issue_date`, `expiry_date`, `reference`;
- requisiti struttura: `certification_type_id`, `is_mandatory`, `advance_notice_days`;
- profilo professionale: `skill_id`, `language_id`, `specialization_id` nei rispettivi array.

La dashboard HR restituisce inoltre i KPI `total_staff`, `active_staff`, `staff_without_account` e `missing_requirements`, oltre ai nomi e agli identificativi piatti necessari alle tre tabelle alert. I campi canonici restano disponibili per retrocompatibilità.

Nessuna schermata deve inviare o visualizzare i campi tecnici canonici se usa già gli alias sopra indicati.
