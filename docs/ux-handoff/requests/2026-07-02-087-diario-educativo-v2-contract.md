# Handoff UX/API — Diario educativo v2

Data: 2026-07-02  
Area: `Minori > Diario educativo`  
Priorità: alta  
Tipo richiesta: estensione dominio + contratto UI vincolante

## 1. Obiettivo

Evolvere il modulo `Diario educativo` da semplice testo libero a prima base di `registro educativo di turno`.

Questa versione introduce:

- livello priorità `verde / giallo / rosso`
- umore sintetico
- sezioni strutturate su alimentazione / igiene / sonno
- passaggio consegne con presa visione
- endpoint KPI/summary per grafici e indicatori

## 2. Nuovo endpoint

### KPI e andamento

- `GET /api/journals/summary`

Query supportate:

- `facility_id`
- `minor_id`
- `date_from`
- `date_to`

Response:

- `summary`
- `daily_series`

## 3. Endpoint esistenti ampliati

- `GET /api/journals`
- `POST /api/journals`
- `GET /api/journals/{journal}`
- `PUT /api/journals/{journal}`
- `PATCH /api/journals/{journal}`
- `DELETE /api/journals/{journal}`

Nuovi filtri lista:

- `priority_level`
- `mood_level`
- `handover_required`

## 4. Nuovi campi dominio

### 4.1 Priorità operativa

- `priority_level`

Valori ammessi:

- `green`
- `yellow`
- `red`

### 4.2 Umore

- `mood_level`

Valori ammessi:

- `very_negative`
- `negative`
- `neutral`
- `positive`
- `very_positive`

### 4.3 Registro turno strutturato

- `nutrition_summary`
- `hygiene_summary`
- `sleep_summary`

### 4.4 Follow-up

- `follow_up_required`
- `follow_up_notes`

Regola:

- se `follow_up_required = true`, allora `follow_up_notes` obbligatorio

### 4.5 Passaggio consegne

- `handover_required`
- `handover_notes`
- `handover_read_at`
- `handover_read_by_user_id`

Regole:

- se `handover_required = true`, allora `handover_notes` obbligatorio
- se esiste `handover_read_at`, allora `handover_read_by_user_id` obbligatorio

## 5. Layout UX richiesto

### 5.1 Lista

Colonne minime:

- data/ora osservazione
- minore
- tipologia
- titolo
- priorità
- umore
- follow-up
- handover
- ultimo aggiornamento/autore

### 5.2 Form create/edit

Il form va diviso in blocchi:

1. **Dati base**
   - minore
   - tipologia voce
   - data/ora osservazione
   - titolo
   - contenuto principale

2. **Priorità e contesto**
   - priorità
   - umore

3. **Registro turno**
   - alimentazione
   - igiene
   - sonno

4. **Follow-up**
   - flag follow-up
   - note follow-up

5. **Passaggio consegne**
   - flag handover richiesto
   - note handover
   - data/ora presa visione
   - utente che ha preso visione

### 5.3 Summary/KPI

Nuova card o pannello con:

- numero totale voci
- conteggio verde/giallo/rosso
- numero follow-up aperti
- handover richiesti
- handover pendenti
- andamento giornaliero

UX deve usare `GET /api/journals/summary` e non creare KPI lato client.

## 6. Copy funzionale

### Testo sezione

“Questa sezione raccoglie osservazioni educative, eventi di turno, segnalazioni prioritarie e passaggi di consegne relativi al minore.”

### Priorità

- `green` → “Ordinaria”
- `yellow` → “Attenzione”
- `red` → “Urgente”

### Handover

- se richiesto ma non letto → “Presa visione in attesa”
- se letto → “Presa visione registrata”

## 7. Vincoli UX

- non simulare firma digitale se il workflow non esiste ancora
- non introdurre chat o messaggistica cifrata in questa fase
- non trasformare il summary in report libero lato frontend

## 8. Sorgenti

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
- `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\MinorJournalController.php`
- `C:\Projects\FamilyHUB\docs\architecture\2026-07-02-gap-analysis-avvicinamenti-diario-educativo.md`
