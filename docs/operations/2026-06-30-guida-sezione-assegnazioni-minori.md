# Guida operativa - Sezione Assegnazioni Minori

Data: 2026-06-30
Ambito: amministrazione / coordinamento / controllo accessi ai casi

## 1. Scopo della sezione

La sezione `Assegnazioni Minori` serve a collegare utenti operativi a specifici minori.

Questa sezione e' uno dei punti centrali del modello di sicurezza applicativo, perche' determina quali utenti non privilegiati possono operare su un caso concreto.

Serve per:

- assegnare utenti a un minore
- revocare o chiudere assegnazioni
- verificare chi e' abilitato a operare sul singolo caso
- supportare il modello RBAC + assegnazione puntuale

---

## 2. Regola fondamentale

L'assegnazione minore non sostituisce il ruolo.

Le `Assegnazioni Minori` servono ad aggiungere un perimetro operativo puntuale al ruolo gia' posseduto dall'utente.

In pratica:
- il ruolo dice **cosa** l'utente puo' fare
- l'assegnazione al minore dice **su quale minore** puo' farlo

---

## 3. Cosa non va chiesto di nuovo

La sezione non deve ridefinire il ruolo dell'utente.

Il ruolo e' gia' assegnato a livello utente/struttura.

Questa sezione deve lavorare in modo semplice su:
- struttura
- utente
- minore
- validita' temporale dell'assegnazione
- stato attivo / non attivo

Non deve duplicare la logica RBAC.

---

## 4. Ruoli privilegiati e assegnazioni

I ruoli privilegiati attuali sono:
- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

Questi ruoli possono operare senza assegnazione puntuale al minore.

Conseguenza importante:
- l'assenza di un record in `Assegnazioni Minori` non significa automaticamente assenza di accesso

La sezione mostra soprattutto le assegnazioni manuali necessarie per i ruoli non privilegiati.

---

## 5. Casi d'uso principali

### 5.1 Educatore assegnato a uno o piu' minori

Caso tipico:
- il ruolo consente lettura/scrittura su moduli operativi
- l'assegnazione attiva abilita l'operativita' sul minore specifico

### 5.2 Professionista che segue solo alcuni minori

Caso tipico:
- pediatra, psicologo o altra figura segue solo una parte dei minori della struttura
- l'assegnazione serve a limitare correttamente il perimetro

### 5.3 Coordinatore o direttore

Puo' avere accesso anche senza assegnazione manuale puntuale.

---

## 6. Coerenza con la scheda Minore

La sezione `Assegnazioni Minori` e la tab `Accesso al minore` nella scheda del minore devono risultare coerenti.

Se mostrano dati diversi, non e' un tema puramente grafico:
- puo' esserci una discrepanza nel contratto dati
- puo' esserci una differenza tra assegnazioni manuali e accessi privilegiati

La UI deve aiutare a distinguere questi due piani.

---

## 7. Regole UX importanti

La UI deve far capire chiaramente che:

- l'assegnazione non cambia il ruolo
- l'assegnazione non concede permessi che il ruolo non possiede
- l'assegnazione abilita il perimetro del minore per chi ha gia' il ruolo corretto
- alcuni ruoli privilegiati possono non comparire tra le assegnazioni manuali

---

## 8. Modello operativo consigliato

Dal punto di vista dell'usabilita', la gestione deve essere semplice.

Pattern consigliati:
- assegnazione da vista utente
- assegnazione da vista minore
- operazioni bulk per struttura, quando necessarie

Esempio pratico:
- seleziono una struttura
- vedo i minori della struttura
- assegno uno o piu' minori a un professionista

---

## 9. Contenuti minimi del tasto Informazioni

La guida contestuale deve spiegare:

1. a cosa serve la sezione
2. differenza tra ruolo e assegnazione
3. perche' alcuni utenti possono accedere anche senza assegnazione manuale
4. come leggere lo stato attivo / validita'
5. perche' questa sezione impatta direttamente Uscite, Attivita' e scheda Minore

---

## 10. Nota per QA e supporto

Se un utente ha assegnazione attiva ma non riesce a operare, va verificato anche il ruolo.

Se un utente riesce a operare senza assegnazione manuale, va verificato se appartiene a un ruolo privilegiato.
