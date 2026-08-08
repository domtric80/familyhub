# Handoff UX/API — Pagina informativa ruoli + pattern guide contestuali

Data: 2026-06-30  
Priorità: alta  
Ambito: frontend / UX / help contestuale applicativo

## 1. Obiettivo

Introdurre una **pagina informativa sui ruoli** e stabilire un pattern fisso per il tasto
`Informazioni` in tutte le sezioni dell’applicazione.

Questa esigenza nasce da un problema reale di comprensione:

- il nome del ruolo non basta a capire il suo comportamento
- esistono ruoli che bypassano l’assegnazione puntuale al minore
- l’utente deve poter capire subito cosa può fare in una sezione e con quali limiti

---

## 2. Nuova pagina frontend da realizzare

### Nome consigliato

- `Guida ai ruoli`
oppure
- `Significato dei ruoli`

### Posizionamento consigliato

- sezione `Ruoli`
- con pulsante / link visibile:
  - `Informazioni sui ruoli`
  - oppure pulsante con icona `i`

### Finalità

Mostrare in modo chiaro:

- significato funzionale di ogni ruolo
- se il ruolo richiede assegnazione manuale ai minori
- se il ruolo è privilegiato
- se la sua RBAC è modificabile

---

## 3. Contenuti da mostrare nella pagina

### 3.1 Testo introduttivo

Messaggio iniziale da rendere bene in UI:

> I ruoli non definiscono solo i permessi visibili nella matrice RBAC.  
> Alcuni ruoli di sistema hanno anche un comportamento speciale rispetto all’accesso ai minori.  
> In particolare, alcuni ruoli possono operare sui minori della struttura senza richiedere assegnazione manuale puntuale.

### 3.2 Tabella ruoli

Campi da mostrare:

- `Codice ruolo`
- `Nome ruolo`
- `Tipo`
  - sistema
  - custom
- `Ruolo privilegiato`
  - sì / no
- `Richiede assegnazione al minore`
  - sì / no
- `RBAC modificabile`
  - sì / no
- `Descrizione funzionale`

### 3.3 Badge visivi

Badge consigliati:

- `Sistema`
- `Custom`
- `Privilegiato`
- `Assegnazione richiesta`
- `RBAC bloccata`
- `RBAC modificabile`

### 3.4 Sezione “Come interpretare i ruoli”

Blocchi testuali consigliati:

- **Ruoli privilegiati**
  - possono operare senza assegnazione puntuale al minore
  - devono comunque avere i permessi RBAC corretti

- **Ruoli operativi**
  - richiedono assegnazione attiva al minore oltre ai permessi

- **Ruoli custom**
  - non diventano privilegiati automaticamente
  - i permessi da soli non bastano a replicare un ruolo di sistema privilegiato

---

## 4. Logica funzionale da riflettere in frontend

### 4.1 Ruoli privilegiati attuali

I ruoli privilegiati correnti sono:

- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

Questi ruoli:
- **non richiedono assegnazione manuale al minore**
- **non devono essere considerati ruoli “normali”**

### 4.2 Ruoli custom

Esempio reale: `REFERENTE_STRUTTURA`

Anche se il ruolo custom ha molti permessi:
- non diventa privilegiato automaticamente
- continua a richiedere assegnazione attiva al minore

Questa distinzione deve essere spiegata esplicitamente nella pagina.

---

## 5. Regola UX proposta per la matrice RBAC

### 5.1 Ruoli con bypass / privilegiati

Per i ruoli:
- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

la matrice permessi deve essere:

- **sola lettura**
oppure
- modificabile solo in area altamente protetta, con warning forte

#### Messaggio da mostrare

> Questo è un ruolo di sistema privilegiato.  
> Oltre ai permessi RBAC, possiede un comportamento speciale nell’accesso ai minori.  
> Per evitare configurazioni incoerenti, la matrice permessi non è modificabile da questa interfaccia.

### 5.2 Ruoli normali / custom

Per ruoli non privilegiati:
- matrice modificabile
- spiegazione:

> Questo ruolo richiede sia i permessi RBAC sia l’assegnazione attiva al minore per operare sulle funzioni sensibili.

---

## 6. Pattern generale: tasto `Informazioni`

Da ora in avanti ogni sezione importante della web application deve avere un punto informativo contestuale.

### 6.1 Pattern UI consigliato

Per ogni pagina/modulo:

- pulsante `Informazioni`
- oppure icona `i`
- posizione consigliata:
  - nell’header della pagina
  - vicino al titolo

### 6.2 Comportamento consigliato

Il click apre:

- drawer laterale
oppure
- modal ampia
oppure
- pagina guida dedicata se il contenuto è esteso

### 6.3 Contenuti minimi per ogni guida contestuale

Ogni guida di sezione deve spiegare:

1. **A cosa serve la sezione**
2. **Chi la usa**
3. **Quali dati mostra o modifica**
4. **Quali permessi o limiti si applicano**
5. **Eventuali regole speciali**
   - assegnazione minore
   - documenti sensibili
   - ruoli privilegiati

---

## 7. Prime sezioni da dotare di guida

Priorità consigliata:

1. `Ruoli`
2. `Minori`
3. `Uscite`
4. `Attività`
5. `Documenti`
6. `Assegnazioni Minori`
7. `Utenti`
8. `Audit Log`

---

## 8. Contenuto iniziale della guida ruoli

Frontend può derivare il primo contenuto statico direttamente dal documento operativo:

- `C:\Projects\FamilyHUB\docs\operations\2026-06-30-mappa-ruoli-e-bypass-accesso-minori.md`

In particolare vanno riportate in UI almeno queste colonne:

| Ruolo | Privilegiato | Richiede assegnazione minore | RBAC modificabile | Significato |
|---|---:|---:|---:|---|
| SUPER_ADMIN | Sì | No | No | Governance totale |
| DIRETTORE | Sì | No | No | Direzione struttura |
| COORDINATORE | Sì | No | No | Coordinamento operativo |
| PSICOLOGO | No | Sì | Sì | Accesso specialistico ai casi assegnati |
| EDUCATORE | No | Sì | Sì | Gestione quotidiana minori assegnati |
| EDUCATORE_NOTTURNO | No | Sì | Sì | Operatività ridotta |
| ASSISTENTE_SOCIALE_EST | No | Sì | Sì | Lettura selettiva |
| SUPERVISORE_ESTERNO | No | Sì / non operativo sul caso | Sì | Reporting |
| ADMIN_IT | No | Non applicabile sui minori | Sì controllata | Gestione tecnica |
| CUSTOM | No (oggi) | Sì | Sì | Dipende dai permessi |

---

## 9. Decisione di prodotto da riflettere

La UI deve aiutare l’utente a capire che:

- **permessi RBAC** e **bypass assegnazione minore** non sono la stessa cosa
- un ruolo custom con permessi ampi non equivale automaticamente a un ruolo privilegiato
- i ruoli privilegiati sono ruoli strutturali di sistema

---

## 10. Output atteso dal team frontend

### Fase 1

- pagina `Informazioni sui ruoli`
- matrice ruoli con badge e spiegazioni
- blocco informativo nella pagina `Ruoli`

### Fase 2

- pattern riusabile `Informazioni`
- componente comune per drawer/modal guida
- progressiva estensione alle altre sezioni applicative

