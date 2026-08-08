# Mappa ruoli — significato funzionale e bypass accesso minori

Data: 2026-06-30  
Stato: riferimento operativo corrente  
Ambito: backend, frontend, UX, QA, onboarding utente

## 1. Scopo

Questo documento chiarisce:

- il significato funzionale dei ruoli applicativi
- quali ruoli hanno **bypass dell’assegnazione puntuale al minore**
- quali ruoli restano soggetti al doppio controllo:
  - permesso RBAC
  - assegnazione attiva al minore

> Nota chiave  
> Il termine “bypass” **non** significa accesso totale.  
> Significa solo che il ruolo **non richiede l’assegnazione puntuale al minore** per operare.  
> Il ruolo deve comunque possedere i permessi RBAC corretti.

---

## 2. Regola tecnica di base

Per le funzioni operative legate ai minori, il backend applica normalmente due livelli:

1. **RBAC**
   - il ruolo deve avere il permesso richiesto

2. **Assegnazione attiva al minore**
   - l’utente deve risultare assegnato al minore
   - condizioni:
     - `is_active = true`
     - `valid_from <= oggi`
     - `valid_to IS NULL OR valid_to >= oggi`

### Eccezione

I ruoli definiti in `minor_access.privileged_role_codes` bypassano il secondo livello.

Configurazione attuale:

- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

File tecnico di riferimento:
- `C:\Projects\FamilyHUB\backend\config\minor_access.php`

---

## 3. Classi di ruolo

### 3.1 Ruoli privilegiati di struttura / direzione

Questi ruoli possono vedere o gestire i minori della struttura senza assegnazione manuale puntuale, **ma solo nei limiti dei permessi RBAC**.

#### `SUPER_ADMIN`

- Ambito: multi-struttura / amministrazione totale
- Uso previsto:
  - bootstrap
  - governance completa
  - gestione tecnica e funzionale globale
- Bypass assegnazione minori: **SÌ**
- Modificabilità RBAC: **NO consigliato**
- Motivo:
  - è ruolo di sistema
  - deve restare coerente e stabile

#### `DIRETTORE`

- Ambito: direzione della singola struttura
- Uso previsto:
  - visione completa casi
  - approvazioni e supervisione
  - accesso pieno ai minori della struttura
- Bypass assegnazione minori: **SÌ**
- Modificabilità RBAC: **NO consigliato**
- Motivo:
  - è ruolo di sistema ad alto impatto
  - la sua semantica non dovrebbe essere alterata localmente

#### `COORDINATORE`

- Ambito: gestione operativa della struttura
- Uso previsto:
  - coordinamento educativo e organizzativo
  - supervisione attività e uscite
  - accesso operativo ai minori della struttura
- Bypass assegnazione minori: **SÌ**
- Modificabilità RBAC: **NO consigliato**
- Motivo:
  - oggi rappresenta di fatto un “coordinatore di struttura”
  - il nome può risultare ambiguo, ma la semantica backend è privilegiata

> Nota semantica  
> Il nome `COORDINATORE` oggi non indica un ruolo “leggero”.  
> Indica un ruolo strutturale con visione operativa ampia sulla struttura.

---

### 3.2 Ruoli operativi con assegnazione puntuale richiesta

Questi ruoli operano sui minori **solo se**:
- hanno il permesso RBAC corretto
- sono assegnati attivamente al minore

#### `PSICOLOGO`

- Ambito: profili psico-clinici
- Bypass assegnazione minori: **NO**
- Uso previsto:
  - accesso specialistico ai minori seguiti
  - non accesso indiscriminato a tutti i casi

#### `EDUCATORE`

- Ambito: operatività educativa quotidiana
- Bypass assegnazione minori: **NO**
- Uso previsto:
  - lavoro quotidiano sui minori assegnati
  - attività, uscite, contatti, documenti secondo permessi

#### `EDUCATORE_NOTTURNO`

- Ambito: presidio notturno e operatività ridotta
- Bypass assegnazione minori: **NO**
- Uso previsto:
  - accesso minimo e mirato
  - mai visione indiscriminata

#### `ASSISTENTE_SOCIALE_EST`

- Ambito: attore esterno in sola lettura selettiva
- Bypass assegnazione minori: **NO**
- Uso previsto:
  - consultazione dei minori effettivamente seguiti

#### `SUPERVISORE_ESTERNO`

- Ambito: vista aggregata / audit / reporting
- Bypass assegnazione minori: **NO**
- Uso previsto:
  - non è un ruolo operativo sul singolo minore

---

### 3.3 Ruoli amministrativi / tecnici

#### `ADMIN_IT`

- Ambito: gestione tecnica e configurativa
- Accesso ai minori: **NO per design**
- Bypass assegnazione minori: **NO**
- Uso previsto:
  - anagrafiche
  - geografia
  - ruoli e permessi
  - configurazione tecnica

---

## 4. Regola di governance per i ruoli con bypass

### Principio proposto

I ruoli con bypass dell’assegnazione minore devono essere considerati **ruoli protetti di sistema**.

### Conseguenza UI/UX consigliata

Per questi ruoli:

- la matrice RBAC deve essere **sola lettura**
- oppure modificabile solo da profili tecnici altamente autorizzati con warning esplicito

### Motivazione

Se un ruolo ha bypass dell’assegnazione minore e contemporaneamente l’utente può alterarne liberamente i permessi:

- si rischia confusione semantica
- si perde prevedibilità funzionale
- si crea un forte rischio di errori di autorizzazione lato organizzazione

### Regola semplice raccomandata

#### Ruoli con bypass
- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

Per questi ruoli:
- **RBAC non modificabile dal frontend applicativo standard**
- descrizione sempre visibile
- badge “Ruolo privilegiato”

#### Ruoli senza bypass
- ruoli operativi
- ruoli custom

Per questi ruoli:
- RBAC modificabile
- comportamento subordinato ad assegnazione minore, salvo futuri flag espliciti

---

## 5. Ruoli custom: regola proposta

I ruoli custom creati dall’utente, ad esempio `REFERENTE_STRUTTURA`, oggi:

- possono avere permessi molto ampi
- ma **non diventano privilegiati automaticamente**
- quindi **non bypassano** l’assegnazione al minore

### Interpretazione corretta

Un ruolo custom con permessi simili a `COORDINATORE` **non equivale** a `COORDINATORE`
se non viene esplicitamente dichiarato come privilegiato.

### Regola di prodotto consigliata

Per i ruoli custom esistono due possibilità future:

#### Opzione A — semplice e sicura

- nessun ruolo custom può avere bypass
- solo i ruoli di sistema lo possiedono

#### Opzione B — più flessibile

- aggiungere un flag esplicito:
  - `bypass_minor_assignment = true|false`
- il flag:
  - può essere attivabile solo da utenti altamente autorizzati
  - deve avere conferma forte e warning

### Raccomandazione

Nel breve periodo, per sicurezza e chiarezza:

- **non** permettere bypass ai ruoli custom
- usare solo ruoli di sistema per i profili privilegiati

---

## 6. Mappa sintetica finale

| Ruolo | Tipo | Bypass assegnazione minore | RBAC modificabile consigliata | Significato operativo |
|---|---|---:|---:|---|
| `SUPER_ADMIN` | Sistema | SÌ | NO | Governance totale multi-struttura |
| `DIRETTORE` | Sistema | SÌ | NO | Direzione completa della struttura |
| `COORDINATORE` | Sistema | SÌ | NO | Coordinamento operativo della struttura |
| `PSICOLOGO` | Operativo | NO | SÌ | Accesso specialistico ai casi assegnati |
| `EDUCATORE` | Operativo | NO | SÌ | Gestione quotidiana dei minori assegnati |
| `EDUCATORE_NOTTURNO` | Operativo | NO | SÌ | Operatività ridotta sui minori assegnati |
| `ASSISTENTE_SOCIALE_EST` | Esterno | NO | SÌ | Lettura selettiva sui casi assegnati |
| `SUPERVISORE_ESTERNO` | Esterno | NO | SÌ | Reporting / vista aggregata |
| `ADMIN_IT` | Tecnico | NO | SÌ controllata | Configurazione tecnica senza accesso minori |
| `CUSTOM_*` | Custom | NO (oggi) | SÌ | Dipende dai permessi assegnati |

---

## 7. Impatto diretto per frontend

Il frontend dovrebbe mostrare sempre, nella pagina ruoli:

- tipo ruolo:
  - sistema / custom
- badge:
  - privilegiato / non privilegiato
- spiegazione testuale:
  - se richiede o meno assegnazione manuale al minore
- stato editabilità:
  - RBAC modificabile / non modificabile

---

## 8. Impatto per utenti finali

Gli utenti devono poter capire subito:

- se il ruolo è “di struttura”
- se il ruolo richiede assegnazione manuale ai minori
- se il ruolo può vedere i minori della struttura senza assegnazione
- se il ruolo è protetto e quindi non va alterato nella matrice permessi

Questo documento deve quindi essere tradotto in:

1. pagina informativa sui ruoli
2. guide contestuali con tasto `Informazioni`
3. tooltip e badge coerenti nella UI

