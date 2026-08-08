# Architettura - Note riservate e messaggistica cifrata con classificazioni documentali riusate

Data: 2026-07-06  
Ambito: `Messaggistica interna`, `Note riservate`, `Minori`, `Sicurezza applicativa`

## 1. Decisione architetturale

FamilyHub riusa per note e messaggistica sensibile la stessa tassonomia già adottata per i documenti:

- `internal`
- `restricted`
- `clinical`
- `judicial`

Questa scelta evita la duplicazione di regole tra:

- documenti
- note
- thread di messaggistica

e rende coerente la matrice di visibilità.

## 2. Regola di accesso

L’accesso alle note e ai thread sensibili non è `owner_only`, salvo casi specifici di bozza privata futura.

La regola è:

`Visibilità nota/thread = RBAC modulo + classificazione ammessa + contesto struttura + eventuale assegnazione attiva al minore`

Quindi:

- se un ruolo può vedere documenti `clinical`, può vedere anche note/thread `clinical`
- se un ruolo non è ammesso per `judicial`, non può leggere note/thread `judicial`

## 3. Distinzione dei contenuti

### 3.1 Contenuti operativi

- classificazione: `internal`
- uso: coordinamento team, consegne, note non cliniche

### 3.2 Contenuti riservati

- classificazione: `restricted`
- uso: osservazioni sensibili non cliniche, note riservate di coordinamento

### 3.3 Contenuti clinici

- classificazione: `clinical`
- uso: note psicologiche, sanitarie, valutazioni cliniche condivise con ruoli autorizzati

### 3.4 Contenuti giudiziari

- classificazione: `judicial`
- uso: appunti operativi strettamente legati a provvedimenti o valutazioni legali ad accesso ristretto

## 4. Messaggistica interna: modello v2 proposto

### 4.1 Thread

L’attuale thread deve evolvere per includere:

- `classification_code` nullable per thread di struttura
- `classification_code` obbligatorio per thread legati a dati sensibili o minore
- `visibility_mode` con default `classified`

Valori previsti:

- `classified`
- futuro eventuale `private_draft`

### 4.2 Messaggi

Ogni messaggio eredita la classificazione del thread.

Non si consiglia una classificazione diversa messaggio-per-messaggio nella prima versione, per evitare complessità inutile.

## 5. Note riservate: modello v2 proposto

Per tutte le note sensibili nuove del dominio minore si raccomanda un pattern uniforme:

- `minor_id`
- `facility_id`
- `classification_code`
- `body_encrypted`
- `created_by_user_id`
- `updated_by_user_id`
- `created_at`
- `updated_at`

Questo schema deve essere riutilizzabile per:

- note cliniche
- note riservate coordinatore
- future note giudiziarie

## 6. Enforcement applicativo

### 6.1 Perimetro struttura

L’utente deve avere permesso modulo sulla struttura.

### 6.2 Classificazione

L’utente deve risultare ammesso dalla classificazione, usando la stessa matrice documentale già prevista per i documenti.

### 6.3 Minore

Se il contenuto è riferito a un minore:

- serve assegnazione attiva al minore

salvo eventuali eccezioni sistemiche già definite per ruoli ad altissima autorizzazione.

## 7. Audit obbligatorio

Per note e messaggistica sensibile vanno tracciati almeno:

- apertura thread
- apertura nota
- creazione thread
- invio messaggio
- creazione nota
- modifica nota
- eventuale export/download allegato

Il log deve includere:

- data/ora
- IP
- utente
- classificazione
- minore se presente
- operazione descrittiva

## 8. Non obiettivi

Questa decisione non introduce ancora:

- cifratura end-to-end client-to-client
- private note visibili solo all’autore come modello primario
- classificazioni per singolo messaggio dentro lo stesso thread

## 9. Motivazione

Questa architettura è preferibile perché:

- riduce errori di configurazione
- semplifica la UX
- mantiene coerenza con la matrice documentale
- rende audit e formazione molto più leggibili
