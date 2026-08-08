# Guida operativa - Sezione Attivita'

Data: 2026-06-30
Ambito: operatori educativi / coordinamento / programmazione attivita'

## 1. Scopo della sezione

La sezione `Attivita'` serve a registrare, pianificare e consultare le attivita' collegate al minore.

Questa area deve supportare:

- tracciamento delle attivita' svolte o programmate
- lettura del percorso educativo e operativo
- continuita' tra lavoro educativo, coordinamento e storico del caso

Le attivita' sono dati operativi del caso e devono seguire regole autorizzative rigorose.

---

## 2. Modello di autorizzazione

Per lavorare sul modulo `Attivita'`, in generale servono entrambe le condizioni:

1. permesso RBAC corretto del modulo `minor_activities.*`
2. assegnazione attiva al minore

Eccezione:
- i ruoli privilegiati di sistema non richiedono assegnazione puntuale al minore

Ruoli privilegiati attuali:
- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

---

## 3. Permessi richiesti

### 3.1 Lettura attivita'

Permesso richiesto:
- `minor_activities.read`

### 3.2 Creazione attivita'

Permesso richiesto:
- `minor_activities.create`

### 3.3 Modifica attivita'

Permesso richiesto:
- `minor_activities.update`

### 3.4 Cancellazione attivita'

Permesso richiesto:
- `minor_activities.delete`

Nota:
- per i ruoli non privilegiati, il permesso da solo non basta
- serve anche assegnazione attiva al minore

---

## 4. Errore 403: significato corretto

Nel modulo `Attivita'`, un `403` puo' significare:
- permesso mancante nel ruolo
- assegnazione al minore non attiva
- entrambe le condizioni

Messaggio da usare:

> Operazione non consentita: verifica permessi di ruolo e assegnazione attiva al minore.

---

## 5. Casi d'uso principali

### 5.1 Educatore assegnato

Puo' operare sulle attivita' del minore assegnato, nei limiti dei permessi del proprio ruolo.

### 5.2 Operatore non assegnato

Anche se possiede il permesso del modulo, riceve `403`.

### 5.3 Coordinatore / Direttore / Super Admin

Possono operare senza assegnazione manuale puntuale, ma solo nei limiti dei permessi funzionali del modulo.

---

## 6. Regole UX importanti

La UI della sezione `Attivita'` deve spiegare chiaramente che:

- l'attivita' e' sempre riferita a un minore
- vedere il minore non implica automaticamente poter salvare l'attivita'
- il motivo del blocco puo' dipendere da ruolo o assegnazione
- i ruoli privilegiati sono una categoria distinta

---

## 7. Contenuti minimi del tasto Informazioni

La guida contestuale deve spiegare:

1. a cosa serve il modulo
2. chi puo' inserire o modificare un'attivita'
3. quali permessi si applicano
4. quando serve assegnazione al minore
5. come leggere un eventuale `403`
6. differenza tra ruoli operativi e ruoli privilegiati

---

## 8. Nota per QA e supporto

Se un utente legge correttamente altre aree del minore ma non salva un'attivita', va verificato:
- permesso `minor_activities.create` o `update`
- assegnazione attiva al minore
- ruolo privilegiato o non privilegiato
