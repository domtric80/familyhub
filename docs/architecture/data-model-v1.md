# FamilyHub Data Model v1

## Obiettivo

Questo documento definisce il modello dati relazionale iniziale di FamilyHub con focus su:

- sicurezza by design
- multi-struttura
- manutenibilità nel tempo
- normalizzazione delle anagrafiche operative
- storicizzazione immutabile dei fatti rilevanti

## Principi

### 1. Separazione tra operativo e storico

- Le tabelle operative sono normalizzate e usano chiavi esterne verso master data riusabili.
- Le tabelle storiche non devono dipendere esclusivamente da anagrafiche mutate nel tempo.
- Nei record storicizzati i dati rilevanti vengono copiati come snapshot immutabile.

### 2. Multi-struttura nativa

- Le entità principali sono legate a `facility_id`.
- Un utente può avere ruoli diversi in strutture diverse.
- La tabella cardine del controllo accessi è `user_facility_roles`.

### 3. Sicurezza applicativa

- I dati sensibili vengono separati quando necessario.
- Le tabelle di audit sono append-only.
- Le anagrafiche testuali duplicate vanno evitate quando possono essere master data.

### 4. Convenzioni

- nomi tabelle al plurale
- snake_case per colonne
- PK `id`
- FK `<entita>_id`
- timestamp Laravel standard dove utile
- `deleted_at` solo su entità operative dove la soft delete è giustificata

## Blocchi del modello

### Organizzazione

- `organizations`
- `facilities`

Relazione:

- una `organization` possiede molte `facilities`

### Anagrafiche territoriali

- `countries`
- `regions`
- `provinces`
- `cities`
- `geo_source_files`
- `geo_import_runs`
- `geo_import_run_steps`
- `geo_import_issues`
- `geo_entity_mappings`
- `geo_sync_decisions`
- `geo_source_snapshots`

Relazione:

- una `country` ha molte `regions`
- una `region` ha molte `provinces`
- una `province` ha molte `cities`

Queste tabelle evitano valori testuali ripetuti in anagrafiche sensibili.
Le prime quattro sono il master data canonico applicativo; le altre supportano import, qualitÃ , audit e sincronizzazione.

### Sicurezza e accessi

- `users`
- `roles`
- `permissions`
- `role_permissions`
- `user_facility_roles`

Relazioni:

- `roles` N:M `permissions`
- `users` N:M `facilities` con ruolo tramite `user_facility_roles`

Scelta chiave:

- il ruolo non vive direttamente su `users`
- il ruolo è contestuale alla struttura

### Personale

- `staff_members`
- `staff_documents`

Il personale è separato dagli account applicativi:

- un `staff_member` può avere `user_id` collegato
- ma l'anagrafica professionale non coincide con l'account

### Minori

- `minors`
- `minor_profiles`
- `minor_contacts`
- `minor_documents`
- `document_issuers`

Separazione intenzionale:

- `minors` contiene dati anagrafici base
- `minor_profiles` contiene dati più sensibili e riservati

### Allegati

- `attachments`
- `document_types`

Scelta:

- file centralizzati
- bucket privati
- path e hash tracciati
- nessun file nel filesystem pubblico applicativo

### Audit

- `audit_logs`

Questa tabella è storica e immutabile.

Contiene snapshot di:

- attore
- ruolo
- struttura
- azione
- risorsa
- valori prima/dopo

## Specifica relazionale v1

### `organizations`

- `id`
- `name`
- `legal_name`
- `vat_number`
- `tax_code`
- `email`
- `phone`
- `created_at`
- `updated_at`

Vincoli:

- unique opzionale su `vat_number`

### `facilities`

- `id`
- `organization_id`
- `code`
- `name`
- `address_line`
- `city_id`
- `postal_code`
- `capacity`
- `status`
- `created_at`
- `updated_at`

Vincoli:

- FK `organization_id -> organizations.id`
- FK `city_id -> cities.id`
- unique `organization_id + code`

### `countries`

- `id`
- `iso_code`
- `name`
- `created_at`
- `updated_at`

Vincoli:

- unique `iso_code`

### `regions`

- `id`
- `country_id`
- `code`
- `name`
- `created_at`
- `updated_at`

Vincoli:

- FK `country_id -> countries.id`
- unique `country_id + code`

### `provinces`

- `id`
- `region_id`
- `code`
- `name`
- `created_at`
- `updated_at`

Vincoli:

- FK `region_id -> regions.id`
- unique `region_id + code`

### `cities`

- `id`
- `province_id`
- `name`
- `cadastre_code`
- `postal_code`
- `created_at`
- `updated_at`

Vincoli:

- FK `province_id -> provinces.id`
- unique `province_id + name`

### Supporto sincronizzazione geografica

Per rendere la geografia manutenibile nel tempo e alimentabile da sorgenti esterne affidabili,
il dominio geografico viene esteso con un sottosistema di acquisizione e quality control.

### `geo_source_files`

- `id`
- `source_system`
- `dataset_code`
- `dataset_name`
- `source_url`
- `storage_disk`
- `storage_path`
- `file_name`
- `mime_type`
- `file_size_bytes`
- `sha256`
- `downloaded_at`
- `published_at`
- `is_active`
- `created_at`
- `updated_at`

Vincoli:

- unique `source_system + dataset_code + sha256`

### `geo_import_runs`

- `id`
- `run_uuid`
- `trigger_mode`
- `scope`
- `status`
- `started_at`
- `finished_at`
- `source_file_count`
- `raw_record_count`
- `normalized_record_count`
- `published_record_count`
- `issue_count`
- `error_count`
- `summary_json`
- `initiated_by_user_id`
- `created_at`
- `updated_at`

Vincoli:

- FK `initiated_by_user_id -> users.id`

### `geo_import_run_steps`

- `id`
- `geo_import_run_id`
- `step_code`
- `status`
- `started_at`
- `finished_at`
- `records_in`
- `records_out`
- `message`
- `metrics_json`
- `created_at`
- `updated_at`

Vincoli:

- FK `geo_import_run_id -> geo_import_runs.id`

### `geo_import_issues`

- `id`
- `geo_import_run_id`
- `severity`
- `issue_type`
- `entity_level`
- `source_system`
- `source_record_key`
- `target_table`
- `target_record_id`
- `message`
- `details_json`
- `is_blocking`
- `resolved_at`
- `resolution_notes`
- `created_at`
- `updated_at`

Vincoli:

- FK `geo_import_run_id -> geo_import_runs.id`

### `geo_entity_mappings`

- `id`
- `entity_level`
- `source_system`
- `source_record_key`
- `source_parent_key`
- `target_table`
- `target_record_id`
- `match_strategy`
- `confidence_score`
- `is_manual_override`
- `created_at`
- `updated_at`

Vincoli:

- unique `entity_level + source_system + source_record_key`

### `geo_sync_decisions`

- `id`
- `geo_import_run_id`
- `entity_level`
- `action`
- `target_table`
- `target_record_id`
- `source_system`
- `source_record_key`
- `before_json`
- `after_json`
- `reason_code`
- `executed`
- `created_at`
- `updated_at`

Vincoli:

- FK `geo_import_run_id -> geo_import_runs.id`

### `geo_source_snapshots`

- `id`
- `geo_import_run_id`
- `entity_level`
- `target_table`
- `target_record_id`
- `snapshot_json`
- `created_at`

Vincoli:

- FK `geo_import_run_id -> geo_import_runs.id`

### `users`

- `id`
- `uuid`
- `email`
- `password`
- `first_name`
- `last_name`
- `is_active`
- `mfa_required`
- `last_login_at`
- `email_verified_at`
- `remember_token`
- `created_at`
- `updated_at`

Vincoli:

- unique `uuid`
- unique `email`

### `roles`

- `id`
- `code`
- `name`
- `description`
- `is_system`
- `created_at`
- `updated_at`

Vincoli:

- unique `code`

### `permissions`

- `id`
- `code`
- `resource`
- `action`
- `description`
- `created_at`
- `updated_at`

Vincoli:

- unique `code`
- unique `resource + action`

### `role_permissions`

- `id`
- `role_id`
- `permission_id`
- `created_at`
- `updated_at`

Vincoli:

- FK `role_id -> roles.id`
- FK `permission_id -> permissions.id`
- unique `role_id + permission_id`

### `user_facility_roles`

- `id`
- `user_id`
- `facility_id`
- `role_id`
- `valid_from`
- `valid_to`
- `is_active`
- `assigned_by_user_id`
- `created_at`
- `updated_at`

Vincoli:

- FK `user_id -> users.id`
- FK `facility_id -> facilities.id`
- FK `role_id -> roles.id`
- FK `assigned_by_user_id -> users.id`

### `document_types`

- `id`
- `code`
- `name`
- `scope`
- `created_at`
- `updated_at`

Vincoli:

- unique `code`

### `contact_types`

- `id`
- `code`
- `name`
- `created_at`
- `updated_at`

Vincoli:

- unique `code`

### `staff_members`

- `id`
- `facility_id`
- `user_id`
- `employee_code`
- `first_name`
- `last_name`
- `birth_date`
- `birth_city_id`
- `tax_code`
- `email`
- `phone`
- `qualification`
- `status`
- `created_at`
- `updated_at`
- `deleted_at`

Vincoli:

- FK `facility_id -> facilities.id`
- FK `user_id -> users.id`
- FK `birth_city_id -> cities.id`
- unique `facility_id + employee_code`

### `minors`

- `id`
- `facility_id`
- `internal_code`
- `first_name`
- `last_name`
- `preferred_name`
- `birth_date`
- `birth_city_id`
- `gender`
- `tax_code`
- `entry_date`
- `status`
- `created_at`
- `updated_at`
- `deleted_at`

Vincoli:

- FK `facility_id -> facilities.id`
- FK `birth_city_id -> cities.id`
- unique `facility_id + internal_code`

### `minor_profiles`

- `id`
- `minor_id`
- `family_background`
- `life_history`
- `risk_factors`
- `crisis_indicators`
- `clinical_notes_encrypted`
- `updated_by_user_id`
- `created_at`
- `updated_at`

Vincoli:

- FK `minor_id -> minors.id`
- FK `updated_by_user_id -> users.id`
- unique `minor_id`

### `minor_contacts`

- `id`
- `minor_id`
- `contact_type_id`
- `first_name`
- `last_name`
- `phone`
- `email`
- `city_id`
- `notes`
- `created_at`
- `updated_at`

Vincoli:

- FK `minor_id -> minors.id`
- FK `contact_type_id -> contact_types.id`
- FK `city_id -> cities.id`

### `attachments`

- `id`
- `facility_id`
- `owner_type`
- `owner_id`
- `document_type_id`
- `disk`
- `bucket`
- `path`
- `original_name`
- `mime_type`
- `size_bytes`
- `sha256`
- `is_encrypted`
- `uploaded_by_user_id`
- `created_at`
- `updated_at`

Vincoli:

- FK `facility_id -> facilities.id`
- FK `document_type_id -> document_types.id`
- FK `uploaded_by_user_id -> users.id`
- unique `disk + bucket + path`

### `minor_documents`

- `id`
- `minor_id`
- `document_type_id`
- `attachment_id`
- `document_issuer_id`
- `issued_by`
- `issue_date`
- `expiry_date`
- `classification`
- `classification_code`
- `created_at`
- `updated_at`

Vincoli:

- FK `minor_id -> minors.id`
- FK `document_type_id -> document_types.id`
- FK `attachment_id -> attachments.id`
- FK `document_issuer_id -> document_issuers.id`

### `document_issuers`

- `id`
- `code`
- `name`
- `description`
- `sort_order`
- `is_active`
- `created_at`
- `updated_at`

Vincoli:

- unique `code`

### `staff_documents`

- `id`
- `staff_member_id`
- `document_type_id`
- `attachment_id`
- `issue_date`
- `expiry_date`
- `status`
- `created_at`
- `updated_at`

Vincoli:

- FK `staff_member_id -> staff_members.id`
- FK `document_type_id -> document_types.id`
- FK `attachment_id -> attachments.id`

### `audit_logs`

- `id`
- `facility_id`
- `actor_user_id`
- `actor_display_name`
- `actor_role_name`
- `action`
- `resource_type`
- `resource_id`
- `resource_label`
- `ip_address`
- `user_agent`
- `old_values_json`
- `new_values_json`
- `occurred_at_utc`

Vincoli:

- FK `facility_id -> facilities.id`
- FK `actor_user_id -> users.id`

Regole:

- append-only
- nessun update
- nessun delete
- nessun soft delete

## Pattern per le tabelle storiche future

Le tabelle storiche seguiranno queste regole:

- record immutabili
- snapshot dei dati rilevanti
- campi testuali “scolpiti” al momento dell'evento
- eventuale FK verso la tabella sorgente solo come riferimento secondario

Esempi futuri:

- `care_plan_revisions`
- `journal_entry_snapshots`
- `timesheet_export_snapshots`
- `official_report_snapshots`

## Ordine di implementazione delle migration

1. `organizations`
2. `countries`
3. `regions`
4. `provinces`
5. `cities`
6. `facilities`
7. `users`
8. `roles`
9. `permissions`
10. `role_permissions`
11. `user_facility_roles`
12. `document_types`
13. `contact_types`
14. `staff_members`
15. `minors`
16. `minor_profiles`
17. `minor_contacts`
18. `attachments`
19. `minor_documents`
20. `staff_documents`
21. `audit_logs`

## Decisioni v1

- niente ruolo diretto nella tabella `users`
- niente città o province come testo libero nelle anagrafiche principali
- `minor_profiles` unificata in v1, separabile in futuro
- `audit_logs` pensata già come tabella storica probatoria
- allegati centralizzati e non distribuiti in sottotabelle con storage path ripetuti
