# FamilyHub ? Guida funzionale delle sezioni del sito

Data: 2026-07-02  
Destinazione: documentazione commerciale, presentazione progetto, onboarding utenti e stakeholder

## 1. Obiettivo del documento
Questo documento descrive in modo semplice e leggibile le principali sezioni del sito FamilyHub, spiegando:
- a cosa serve ogni area
- con quali dati ? collegata
- quali figure organizzative la usano
- quale valore produce nel lavoro quotidiano

Non ? una guida tecnica per sviluppatori e non usa il linguaggio dei permessi interni come chiave principale di lettura.

## 2. Logica generale dell?applicativo
FamilyHub ? pensato come piattaforma gestionale per strutture che seguono minori e devono coordinare:
- anagrafiche e profili individuali
- attivit? operative quotidiane
- uscite, incontri e relazioni familiari
- documenti e tracciabilit?
- organizzazione del personale e responsabilit? di accesso

Il cuore del sistema ? il minore: quasi tutte le sezioni del sito ruotano attorno al caso individuale, alla struttura di appartenenza e agli operatori autorizzati a intervenire.

## 3. Sezioni del sito

### Dashboard
- **A cosa serve:** Offre una vista iniziale dell?applicativo e orienta rapidamente l?utente verso i moduli di lavoro pi? importanti.
- **A cosa ? collegata:** Profilo utente, stato MFA, accessi rapidi ai moduli principali, indicatori di contesto.
- **Chi la usa:** Direzione, coordinamento, operatori, amministrazione.
- **Valore operativo:** Riduce il tempo di orientamento e aiuta a capire subito dove operare.

### Minori
- **A cosa serve:** Rappresenta il nucleo del sistema: anagrafica, profilo, contatti, documenti, storico e accessi al singolo minore.
- **A cosa ? collegata:** Scheda anagrafica, profilo caso, contatti, documenti, storico eventi, assegnazioni al minore.
- **Chi la usa:** Educatori, coordinatori, psicologi, direzione, figure autorizzate.
- **Valore operativo:** Centralizza la gestione del caso e garantisce continuit? operativa.

### Uscite
- **A cosa serve:** Gestisce tutte le uscite del minore dalla struttura, sia pianificate sia consuntivate, con monitoraggio del rientro.
- **A cosa ? collegata:** Minore, tipo uscita, destinazione, accompagnatori, orari, stato, esito rientro, alert ritardo, follow-up.
- **Chi la usa:** Educatori, coordinatori, direzione.
- **Valore operativo:** Permette controllo operativo, tracciabilit? dei movimenti, gestione delle anomalie di rientro e continuit? delle azioni successive.

### Attivit?
- **A cosa serve:** Registra attivit? educative, organizzative o di accompagnamento collegate al percorso del minore.
- **A cosa ? collegata:** Minore, tipo attivit?, data/ora, responsabile, presenza, supporto richiesto, logistica, stato, esito e follow-up.
- **Chi la usa:** Educatori, coordinatori, equipe educativa.
- **Valore operativo:** Consente di leggere il lavoro educativo nel tempo, pianificare il percorso e monitorare in modo pi? concreto esecuzione, supporto e continuit?.

### Avvicinamenti familiari
- **A cosa serve:** Gestisce incontri e step di avvicinamento tra il minore e figure di riferimento autorizzate.
- **A cosa ? collegata:** Minore, tipo avvicinamento, contatto coinvolto, supervisore, date, stato, esito, prossimi passi, provvedimento autorizzativo, osservazioni di reazione, eventuale sospensione.
- **Chi la usa:** Educatori, coordinatori, psicologi, direzione.
- **Valore operativo:** Supporta la gestione relazionale del caso, la tracciabilit? degli incontri e il monitoraggio del percorso familiare nel tempo. Modulo in evoluzione con guida contestuale dedicata.

### Diario educativo
- **A cosa serve:** Raccoglie osservazioni e note educative sul minore in modo strutturato e auditabile.
- **A cosa ? collegata:** Minore, tipo voce, data osservazione, titolo, contenuto, priorità, umore, follow-up, passaggio consegne, informazioni di turno.
- **Chi la usa:** Educatori, coordinatori, equipe educativa.
- **Valore operativo:** Crea memoria operativa del caso, aiuta il passaggio informativo tra operatori e introduce un primo tracciato strutturato del turno educativo.

### Educatori / Operatori
- **A cosa serve:** Gestisce l?anagrafica del personale operativo collegato alle strutture.
- **A cosa ? collegata:** Dati operatore, qualifica, stato, struttura di riferimento, eventuale collegamento a utente applicativo.
- **Chi la usa:** Amministrazione, coordinamento, direzione.
- **Valore operativo:** Separa il profilo professionale dall?account applicativo e migliora governabilit? nel tempo.

### Turni
- **A cosa serve:** Gestisce la pianificazione settimanale del personale per struttura H24, con modelli turno e controllo coperture minime.
- **A cosa ? collegata:** Strutture, operatori, calendario settimanale, fasce orarie standard, coperture minime richieste.
- **Chi la usa:** Coordinatori, referenti struttura, direzione, amministrazione.
- **Valore operativo:** Consente di verificare scoperture, assegnare il personale e garantire la continuita' del presidio educativo.

### Timesheet e presenze
- **A cosa serve:** Trasforma la pianificazione dei turni in consuntivo reale di presenza, distinguendo tra turno previsto, timbrature effettuate e ore approvate.
- **A cosa ? collegata:** Turni pianificati, eventi presenza, operatori, struttura, anomalie, rettifiche, audit e export amministrativi.
- **Chi la usa:** Educatori, coordinatori, direzione, amministrazione.
- **Valore operativo:** Consente di verificare scostamenti, approvare straordinari, tracciare le presenze reali e preparare i dati per paghe o report interni.

### Organizzazioni
- **A cosa serve:** Definisce il livello istituzionale o gestionale sopra le strutture operative.
- **A cosa ? collegata:** Ragione sociale, contatti, strutture collegate.
- **Chi la usa:** Amministrazione centrale, super admin.
- **Valore operativo:** Utile in scenari multi-ente o multi-struttura.

### Strutture
- **A cosa serve:** Gestisce le case famiglia, comunit? o sedi operative in cui vengono inseriti minori e operatori.
- **A cosa ? collegata:** Codice struttura, organizzazione, indirizzo, geografia, capienza, stato.
- **Chi la usa:** Amministrazione, direzione, coordinamento.
- **Valore operativo:** ? il contenitore organizzativo principale del sistema.

### Utenti applicativi
- **A cosa serve:** Gestisce gli account che accedono al software.
- **A cosa ? collegata:** Anagrafica account, email, stato, MFA, ruoli, assegnazioni a strutture.
- **Chi la usa:** Amministrazione, IT, direzione autorizzata.
- **Valore operativo:** Controlla chi pu? entrare nel sistema e con quale profilo operativo.

### Assegnazioni struttura
- **A cosa serve:** Collega utenti, ruoli e strutture.
- **A cosa ? collegata:** Utente, struttura, ruolo, stato assegnazione.
- **Chi la usa:** Amministrazione e coordinamento organizzativo.
- **Valore operativo:** Costruisce il perimetro organizzativo dell?utente nel software.

### Assegnazioni minori
- **A cosa serve:** Collega figure operative specifiche ai singoli minori quando serve un perimetro pi? puntuale.
- **A cosa ? collegata:** Utente, minore, struttura, validit? assegnazione, stato.
- **Chi la usa:** Coordinamento, direzione, amministrazione autorizzata.
- **Valore operativo:** Permette accessi mirati solo ai casi realmente seguiti.

### Audit log
- **A cosa serve:** Raccoglie le operazioni sensibili svolte nel sistema.
- **A cosa ? collegata:** Data, IP, utente, azione, risorsa, dettaglio prima/dopo.
- **Chi la usa:** Direzione, controllo interno, sicurezza, auditing.
- **Valore operativo:** Rende verificabile chi ha fatto cosa, quando e su quali dati.

### KPI Sicurezza
- **A cosa serve:** Mostra indicatori sintetici relativi a sicurezza, accessi e audit.
- **A cosa ? collegata:** Login falliti, accessi documentali, variazioni permessi, altri KPI audit.
- **Chi la usa:** Direzione, IT, controllo, compliance.
- **Valore operativo:** Aiuta il monitoraggio proattivo del comportamento applicativo.

### Geografia
- **A cosa serve:** Gestisce continenti, nazioni, regioni, province e citt? usati come base canonica nei form.
- **A cosa ? collegata:** Nazioni, regioni, province, citt?, codici amministrativi, CAP dove disponibili.
- **Chi la usa:** Amministrazione dato, coordinamento, supporto applicativo.
- **Valore operativo:** Riduce errori di digitazione e garantisce coerenza documentale e amministrativa.

### Sync / Import geografia / Provider
- **A cosa serve:** Governa il caricamento e l?aggiornamento della base geografica da fonti esterne.
- **A cosa ? collegata:** Provider, mapping paese-provider, sorgenti dati, import, esiti, anomalie.
- **Chi la usa:** Amministrazione dato, IT, backoffice.
- **Valore operativo:** Serve a mantenere una base geografica affidabile senza inserimenti manuali massivi.

### Documenti - Tipi, Classificazioni, Ambiti, Enti rilascio
- **A cosa serve:** Raccoglie le anagrafiche che regolano il modello documentale.
- **A cosa ? collegata:** Tipo documento, classificazione, ambito, ente rilascio, stati documentali.
- **Chi la usa:** Amministrazione dato, compliance, direzione.
- **Valore operativo:** ? fondamentale per ordine, ricerca, sicurezza e coerenza dei documenti.

### Minore - Stati, Generi, Sesso biologico
- **A cosa serve:** Raccoglie le anagrafiche riusabili per la gestione coerente del profilo del minore.
- **A cosa ? collegata:** Stati del minore, identit? di genere, sesso biologico.
- **Chi la usa:** Amministrazione dato, equipe, direzione.
- **Valore operativo:** Evita testo libero e rende il dato riusabile nel tempo.

### Ruoli
- **A cosa serve:** Definisce i ruoli applicativi e la loro funzione organizzativa.
- **A cosa ? collegata:** Ruolo, descrizione, matrice di abilitazioni.
- **Chi la usa:** Amministrazione, IT, direzione.
- **Valore operativo:** Consente di adattare il software al modello organizzativo reale della struttura.

### Tipi contatto
- **A cosa serve:** Normalizza le categorie di contatto collegate al minore.
- **A cosa ? collegata:** Madre, padre, tutore, referente, avvocato, servizi, altri contatti strutturati.
- **Chi la usa:** Amministrazione dato, equipe operativa.
- **Valore operativo:** Migliora qualit? del dato, filtri e chiarezza del caso.

### Tipi uscita / Tipi attivit? / Tipi avvicinamento / Tipi voce diario
- **A cosa serve:** Permettono di classificare gli eventi operativi con valori coerenti e riusabili.
- **A cosa ? collegata:** Cataloghi applicativi riusabili nei moduli operativi.
- **Chi la usa:** Amministrazione dato, coordinamento.
- **Valore operativo:** Sostengono statistiche, filtri, export e lettura omogenea degli eventi.

### Qualifiche e stati operatori / stati struttura / stati documenti staff
- **A cosa serve:** Gestiscono i dizionari di stato e classificazione per operatori, strutture e documenti staff.
- **A cosa ? collegata:** Qualifiche professionali, stati operatore, stati struttura, stati documenti del personale.
- **Chi la usa:** Amministrazione, HR operativo, coordinamento.
- **Valore operativo:** Supportano qualit? del dato e processi interni nel tempo.

### Profilo utente e MFA
- **A cosa serve:** Gestisce la sicurezza individuale dell?account.
- **A cosa ? collegata:** Dati account, stato MFA, recovery codes, configurazione sicurezza.
- **Chi la usa:** Tutti gli utenti abilitati.
- **Valore operativo:** Rafforza la sicurezza degli accessi e la responsabilit? personale.

## 4. Come spiegare i permessi all?utilizzatore finale
Per l?utente finale non ? utile vedere nomi tecnici di permesso come `minor_profiles.read` o `minor_exits.update`.
La comunicazione corretta dentro l?app deve usare messaggi come:
- ?Puoi consultare questa sezione ma non modificarla.?
- ?Per intervenire su questo minore devi essere associato al suo caso.?
- ?Questa funzione ? riservata al coordinamento o all?amministrazione.?
- ?Alcuni documenti sono visibili solo a figure autorizzate.?

## 5. Indicazione per le future guide contestuali
Ogni sezione del sito dovrebbe avere un pannello `Informazioni` molto sintetico, costruito cos?:
1. cosa puoi fare qui
2. quali dati gestisce questa pagina
3. quando potresti non vedere alcune azioni
4. perch? questa sezione ? importante nel processo della struttura

Guida gi? prodotta per:

- `C:\Projects\FamilyHUB\docs\operations\2026-07-02-guida-sezione-avvicinamenti-familiari.md`
- `C:\Projects\FamilyHUB\docs\operations\2026-07-02-guida-sezione-diario-educativo.md`

## 6. Nota sullo stato di avanzamento
Alcune sezioni del prodotto sono gi? operative in modo completo, mentre altre sono oggi presenti in forma iniziale (`v1`) e verranno estese nei prossimi step. Questo documento descrive il senso funzionale delle sezioni e non sostituisce la roadmap tecnica o la gap analysis.
