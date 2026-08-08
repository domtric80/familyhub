# Guida operativa - Sezione Uscite

Data: 2026-06-30
Ambito: operatori educativi / coordinamento / controllo operativo

## 1. Scopo della sezione

La sezione `Uscite` serve a registrare e consultare le uscite del minore dalla struttura.

Questa sezione deve permettere di:

- pianificare o registrare un'uscita
- tracciare orari, stato e note operative
- evidenziare ritardi di rientro
- classificare l'esito del rientro
- gestire eventuali follow-up successivi
- mantenere coerenza tra operativita' quotidiana e storico del minore
- garantire che solo utenti autorizzati possano intervenire sul caso

Le uscite sono dati operativi sensibili, perche' descrivono movimenti del minore e attivita' fuori struttura.

---

## 2. Modello di autorizzazione

Per lavorare sulle uscite non basta vedere il minore.

In generale servono entrambe le condizioni:

1. permesso RBAC corretto del modulo `minor_exits.*`
2. assegnazione attiva al minore

Eccezione:
- i ruoli privilegiati di sistema non richiedono assegnazione puntuale al minore

Ruoli privilegiati attuali:
- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

---

## 3. Permessi richiesti

### 3.1 Lettura uscite

Permesso richiesto:
- `minor_exits.read`

### 3.2 Creazione uscita

Permesso richiesto:
- `minor_exits.create`

### 3.3 Modifica uscita

Permesso richiesto:
- `minor_exits.update`

### 3.4 Cancellazione uscita

Permesso richiesto:
- `minor_exits.delete`

Nota:
- il permesso da solo non basta per i ruoli non privilegiati
- serve anche assegnazione attiva al minore

---

## 4. Casi d'uso principali

### 4.1 Educatore assegnato al minore

Puo' creare, modificare o consultare uscite solo se:
- il ruolo ha il permesso richiesto
- l'assegnazione al minore e' attiva

### 4.2 Operatore con permesso ma non assegnato

Riceve `403`.
Questo e' comportamento corretto.

### 4.3 Coordinatore / Direttore / Super Admin

Possono operare senza assegnazione puntuale, ma solo nei limiti dei permessi funzionali del modulo.

---

## 5. KPI e indicatori operativi

Il backend espone un summary dedicato per la pagina `Uscite`.

Indicatori principali:
- totale uscite
- pianificate
- fuori struttura
- rientrate
- annullate
- aperte in ritardo
- con follow-up richiesto
- rientri ritardati
- rientri critici

Questi valori non vanno ricostruiti a mano lato frontend.

---

## 6. Errore 403: significato corretto

Nel modulo `Uscite`, un `403` non significa solo "permesso mancante".

Puo' significare:
- il ruolo non possiede il permesso richiesto
- oppure l'utente non e' assegnato al minore
- oppure entrambe le condizioni

Messaggio da usare:

> Operazione non consentita: verifica permessi di ruolo e assegnazione attiva al minore.

---

## 7. Regole UX importanti

La UI della sezione `Uscite` deve aiutare l'utente a capire:

- che l'uscita appartiene sempre a un minore specifico
- che il ruolo non basta, se manca assegnazione al minore
- che un errore `403` non va spiegato con un generico "permessi insufficienti"
- che i ruoli privilegiati sono un'eccezione di sistema
- che un'uscita `out` puo' diventare `in ritardo`
- che il rientro puo' richiedere follow-up operativo

---

## 8. Contenuti minimi del tasto Informazioni

Il pannello `Informazioni` della sezione `Uscite` deve spiegare:

1. a cosa serve il modulo
2. chi puo' registrare o modificare un'uscita
3. quali permessi RBAC si applicano
4. quando serve assegnazione attiva al minore
5. perche' puo' comparire un `403`
6. differenza tra ruolo operativo e ruolo privilegiato
7. significato di ritardo e follow-up
8. significato dei KPI di testata

---

## 9. Nota per QA e supporto

Se un utente riesce ad aprire il minore ma non riesce a creare un'uscita, non e' automaticamente un bug.

Va verificato:
- se possiede `minor_exits.create`
- se ha assegnazione attiva al minore
- se e' o non e' un ruolo privilegiato
