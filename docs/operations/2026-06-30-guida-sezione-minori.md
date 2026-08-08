# Guida operativa - Sezione Minori

Data: 2026-06-30
Ambito: operatori applicativi / coordinamento / amministrazione

## 1. Scopo della sezione

La sezione `Minori` e' il punto centrale per:

- consultare l'elenco dei minori censiti nel sistema
- aprire la scheda completa del singolo minore
- gestire i dati anagrafici e di profilo
- collegare contatti, documenti, storico e accessi puntuali
- verificare chi puo' operare su uno specifico minore

Questa sezione tratta dati ad alta sensibilita'.
Ogni accesso deve quindi rispettare sia le regole RBAC sia le regole di assegnazione al minore.

---

## 2. Distinzione fondamentale: elenco vs scheda completa

### 2.1 Elenco minori

L'elenco serve a:

- cercare un minore
- vedere i dati minimi di contesto
- aprire la scheda dettaglio

### 2.2 Scheda completa del minore

La scheda completa espone dati piu' sensibili e richiede regole piu' restrittive.

Per aprire la scheda completa servono entrambe le condizioni:

1. permesso RBAC `minor_profiles.read`
2. assegnazione attiva al minore

Eccezione:
- i ruoli privilegiati di sistema non richiedono assegnazione puntuale al minore

Ruoli privilegiati attuali:
- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

---

## 3. Regola di sicurezza da ricordare

Nella sezione `Minori` i permessi non bastano da soli.

In generale, un utente operativo deve soddisfare entrambe le condizioni:

- avere il permesso RBAC corretto
- essere assegnato in modo attivo al minore

Questa regola vale anche per moduli collegati come:

- `Uscite`
- `Attivita'`
- parti sensibili dei `Contatti`
- lettura piena della scheda minore

Per i documenti, oltre a RBAC e assegnazione, si applicano anche regole ABAC sui tag documentali.

---

## 4. Tab della scheda minore

### 4.1 `Anagrafica`

Contiene i dati identificativi e amministrativi del minore.

In alto alla scheda e' presente anche una dashboard sintetica PEI che mostra:

- numero di PEI attivi
- numero totale obiettivi e completati
- avanzamento medio
- eventi collegati da `Attivita'` e `Diario educativo`
- andamento nel tempo dei singoli obiettivi

Esempi:
- codice minore
- nome e cognome
- dati di nascita
- riferimenti territoriali
- stato gestionale

### 4.2 `Profilo`

Contiene informazioni di profilo e contesto del caso.

Questa area e' sensibile e ricade nel perimetro di accesso della scheda completa.

Contenuti attuali:

- background familiare
- storia di vita
- stili di apprendimento
- interessi
- hobby
- punti di forza
- fattori di rischio
- indicatori di crisi

Le note cliniche riservate non devono essere trattate come testo libero "generico":
sono dati sensibili e devono essere visibili solo a chi e' autorizzato dalla piattaforma.

### 4.3 `Caso legale e sanitario`

Contiene i riferimenti di caso:

- luogo e provenienza all'ingresso
- decreto o ordinanza di affidamento
- autorita' giudiziaria e numero procedimento
- prossima udienza
- medico di base
- pediatra
- ASL di riferimento
- cartella vaccinale collegata

Serve a evitare errori manuali ripetuti su dati burocratici e sanitari del minore.

### 4.4 `Diagnosi / DSM`

Contiene le diagnosi strutturate collegate al minore.

Per ogni diagnosi il sistema puo' gestire:

- codice interno diagnosi
- etichetta diagnosi
- codice DSM
- data diagnosi
- data revisione
- indicazione di diagnosi primaria
- stato attiva/non attiva

Questa area e' ad altissima sensibilita'.
Ogni modifica deve essere tracciata nello storico del minore e nell'audit amministrativo.

### 4.5 `PEI`

Contiene il Piano Educativo Individualizzato.

Per ogni PEI il sistema puo' gestire:

- titolo
- sintesi
- data inizio
- data revisione
- data fine
- stato
- stato firma digitale
- data firma

Ogni PEI puo' avere piu' obiettivi strutturati con:

- codice obiettivo
- titolo
- descrizione
- scadenza
- percentuale avanzamento
- operatore responsabile

#### Storico PEI firmato

Il PEI non va interpretato come semplice scheda modificabile.

Ogni aggiornamento rilevante produce uno storico dedicato che conserva:

- versione del PEI
- stato del piano in quel momento
- stato firma digitale
- data firma
- fotografia degli obiettivi collegati
- autore della modifica

Questo consente di ricostruire l'evoluzione del piano nel tempo.

#### Avanzamento obiettivi nel tempo

Ogni obiettivo PEI mantiene anche una propria timeline di avanzamento.

Per ogni variazione il sistema registra:

- percentuale avanzamento
- stato dell'obiettivo
- autore dell'aggiornamento
- data e ora della variazione

Questo permette di costruire grafici e timeline reali, non solo vedere l'ultimo valore salvato.

### 4.6 `Bisogni`

Contiene i bisogni categorizzati del minore.

Categorie attuali:

- fisici
- emotivi
- cognitivi
- relazionali
- spirituali

Per ogni bisogno il sistema puo' gestire:

- titolo
- descrizione
- priorita'
- stato
- responsabile
- eventuale documento allegato gia' presente tra i documenti del minore

### 4.7 `Contatti`

Contiene i riferimenti relazionali del minore.

La modifica dei contatti richiede permessi specifici:
- `minor_contacts.create`
- `minor_contacts.update`

### 4.8 `Documenti`

Contiene i documenti associati al minore.

L'accesso documentale non dipende solo dal ruolo, ma anche dai tag dei documenti e dalle regole ABAC.
Un utente puo' vedere un minore ma non necessariamente tutti i documenti del minore.

### 4.9 `Accesso al minore`

Mostra chi e' assegnato al minore.

Serve per:
- capire quali utenti hanno assegnazione attiva
- distinguere accesso strutturale privilegiato da assegnazione puntuale
- fare QA sui casi di accesso negato

Nota importante:
- un ruolo privilegiato puo' operare senza apparire come assegnazione manuale puntuale
- quindi "nessuna assegnazione visibile" non significa automaticamente "nessun accesso possibile"

### 4.10 `Storico`

Mostra gli eventi del minore.

Lo storico deve essere letto come traccia operativa del caso e come vista specializzata dell'audit riferita al minore.

Esempi di eventi ora attesi:

- apertura scheda minore
- apertura storico minore
- caricamento documento
- preview documento
- download documento
- aggiornamento profilo
- aggiornamento scheda caso
- creazione/modifica/eliminazione diagnosi
- creazione/modifica PEI
- creazione/modifica/eliminazione obiettivo PEI
- consultazione storico PEI
- consultazione timeline avanzamento obiettivo PEI
- creazione/modifica/eliminazione bisogno

---

## 5. Messaggi di errore: come interpretarli

### 5.1 Errore 403 sulla scheda minore

Significato:
- manca assegnazione attiva al minore
- oppure manca il permesso sensibile `minor_profiles.read`
- oppure entrambe le cose

Messaggio consigliato:

> Non puoi aprire la scheda completa di questo minore: verifica assegnazione attiva e permesso sensibile `minor_profiles.read`.

### 5.2 Errore 403 su Uscite o Attivita'

Significato:
- il ruolo non possiede il permesso richiesto
- oppure l'utente non e' assegnato al minore

Messaggio consigliato:

> Operazione non consentita: verifica permessi di ruolo e assegnazione attiva al minore.

---

## 6. Casi d'uso principali

### 6.1 Educatore assegnato

Puo' operare sui minori che gli sono stati assegnati, nei limiti dei permessi RBAC del suo ruolo.

### 6.2 Professionista specialista assegnato

Puo' accedere ai soli minori assegnati.
Per i documenti clinici o specialistici si applicano anche i tag ABAC.

### 6.3 Coordinatore / Direttore / Super Admin

Possono attraversare il perimetro minori della struttura senza assegnazione puntuale, ma devono comunque avere i permessi funzionali del modulo.

---

## 7. Regole UX da rispettare

La UI della sezione `Minori` deve sempre aiutare l'utente a capire:

- se si trova nell'elenco o nella scheda completa
- se un'azione e' bloccata per mancanza di permesso o di assegnazione
- che i documenti seguono regole ulteriori rispetto alla scheda del minore
- che l'assegnazione manuale al minore non coincide con il ruolo

---

## 8. Pattern informativo richiesto

La sezione `Minori` deve avere un pulsante `Informazioni` contestuale.

Contenuti minimi del pannello informativo:

1. a cosa serve la sezione
2. differenza tra elenco e scheda completa
3. chi puo' accedere
4. quando serve assegnazione al minore
5. come funziona il rapporto tra RBAC e ABAC documentale
6. come leggere la tab `Accesso al minore`
7. come interpretare i principali messaggi 403
8. quali dati sensibili vengono tracciati nello storico e nell'audit

---

## 9. Nota operativa per QA e supporto

Se compare una discrepanza tra:

- pagina `Assegnazioni Minori`
- tab `Accesso al minore` nella scheda minore

non va trattata come semplice anomalia grafica.
Va verificato il contratto dati restituito dai due endpoint, perche' la coerenza tra queste viste e' essenziale per il modello di sicurezza.

## Dashboard globale minore

Prima delle tab della scheda e' presente una card sintetica di riepilogo che permette di capire subito:

- in quale struttura si trova il minore
- qual e' lo stato gestionale attuale
- quanti documenti e contatti sono gia' presenti
- qual e' il quadro sintetico del PEI

Questa card serve alla lettura rapida trasversale e resta visibile mentre si navigano le diverse tab del minore.

## Trend PEI in dashboard

Nella scheda del minore il sistema espone anche indicatori sintetici sui PEI: numero PEI attivi, numero obiettivi, avanzamento medio e ultimi eventi collegati ad Attività e Diario educativo.

Questi trend servono a leggere il lavoro educativo nel tempo, non solo a conservare dati descrittivi.

