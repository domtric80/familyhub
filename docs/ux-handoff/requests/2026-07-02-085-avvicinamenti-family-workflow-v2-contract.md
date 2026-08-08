# Handoff UX/API — Avvicinamenti familiari v2

Data: 2026-07-02  
Area: `Minori > Avvicinamenti familiari`  
Priorità: alta  
Tipo richiesta: evoluzione backend + contratto UI vincolante

## 1. Obiettivo

Portare il modulo `Avvicinamenti` oltre il semplice evento operativo e introdurre il primo layer di dominio reale:

- provvedimento/autorizzazione
- alert rinnovo
- reazione del minore `prima / durante / dopo`
- note riservate
- sospensione motivata
- base dati per grafico trend

## 2. Nuovi endpoint

### Trend evolutivo

- `GET /api/approaches/trend`

Query supportate:

- `facility_id`
- `minor_id`
- `date_from`
- `date_to`

Response:

- `summary`
- `monthly_series`
- `reaction_distribution`

## 3. Endpoint esistenti ampliati

Restano invariati:

- `GET /api/approaches`
- `POST /api/approaches`
- `GET /api/approaches/{approach}`
- `PUT /api/approaches/{approach}`
- `PATCH /api/approaches/{approach}`
- `DELETE /api/approaches/{approach}`

Ma `list/detail/create/update` ora supportano anche i campi v2.

## 4. Nuovi campi dominio

### 4.1 Provvedimento / autorizzazione

- `authorization_reference`
- `authorization_issued_at`
- `authorization_expires_at`
- `authorization_renewal_alert_days`

Campi calcolati in response:

- `authorization_status`: `active | expiring | expired | null`
- `authorization_needs_renewal`: boolean

### 4.2 Reazione del minore

Per ogni fase:

- `pre_reaction_level`
- `pre_reaction_notes`
- `during_reaction_level`
- `during_reaction_notes`
- `post_reaction_level`
- `post_reaction_notes`

Valori ammessi per i livelli:

- `very_negative`
- `negative`
- `neutral`
- `positive`
- `very_positive`

### 4.3 Note riservate

- `reserved_psychologist_notes`
- `reserved_coordinator_notes`

Flags response:

- `can_view_reserved_psychologist_notes`
- `can_view_reserved_coordinator_notes`
- `has_reserved_notes`

### 4.4 Sospensione motivata

- `status` ora ammette anche `suspended`
- `suspension_reason`
- `suspended_at`
- `suspended_by_user_id`
- `suspension_signed_at`

## 5. Regole backend che UX deve rispettare

### 5.1 Filtri lista

`GET /api/approaches` supporta ora anche:

- `authorization_status=active`
- `authorization_status=expiring`
- `authorization_status=expired`

### 5.2 Sicurezza note riservate

Il frontend non deve assumere di poter leggere i campi note.

Se l’utente non è autorizzato:

- il backend restituisce il campo a `null`
- il frontend deve mostrare solo:
  - assenza campo
  - oppure badge `Contenuto riservato`

Non deve mai mostrare editor aperti di default per utenti non autorizzati.

### 5.3 Validazioni

- `authorization_expires_at >= authorization_issued_at`
- se `status = suspended` allora `suspension_reason` obbligatoria
- se esiste `suspension_reason` allora `suspended_at` obbligatorio
- le note riservate possono essere scritte solo da ruoli autorizzati

## 6. Layout UX richiesto

### 6.1 Lista

La tabella lista deve aggiungere colonne/badge:

- stato avvicinamento
- stato autorizzazione
- scadenza autorizzazione
- presenza note riservate
- esito reazione finale (`post_reaction_level`)

### 6.2 Form create/edit

Il form non deve più essere solo “evento base”.

Va diviso in blocchi:

1. **Dati incontro**
   - minore
   - tipologia
   - contatto
   - supervisore
   - titolo
   - obiettivo
   - luogo
   - date pianificate / effettive
   - stato

2. **Provvedimento autorizzativo**
   - riferimento
   - data emissione
   - data scadenza
   - giorni alert rinnovo

3. **Reazione del minore**
   - prima: livello + note
   - durante: livello + note
   - dopo: livello + note

4. **Esito operativo**
   - note esito
   - prossimi passi

5. **Area riservata**
   - note psicologo
   - note coordinatore
   - mostrare solo se i flag permesso/ruolo lo consentono

6. **Sospensione**
   - visibile quando `status = suspended` oppure in blocco collapsable
   - motivazione
   - data/ora sospensione
   - data/ora firma responsabile

### 6.3 Trend

Nuova card/pannello nella pagina o nel dettaglio minore:

- KPI summary
- serie mensile
- distribuzione reazioni

UX non deve inventare calcoli lato client: usare soltanto `GET /api/approaches/trend`.

## 7. Copy funzionale da usare

### Testo sezione

“Questa sezione gestisce gli avvicinamenti familiari del minore, comprese autorizzazioni, osservazioni di reazione e sospensioni motivate.”

### Alert scadenza

- `active` → “Provvedimento attivo”
- `expiring` → “Rinnovo in scadenza”
- `expired` → “Provvedimento scaduto”

## 8. Cosa UX non deve fare

- non creare workflow firma digitale avanzata non presente
- non introdurre step wizard non richiesti
- non mostrare note riservate a ruoli non autorizzati
- non hardcodare mapping diversi per i reaction level

## 9. Documenti sorgente

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\MinorApproachController.php`
- `C:\Projects\FamilyHUB\docs\architecture\2026-07-02-gap-analysis-avvicinamenti-diario-educativo.md`
