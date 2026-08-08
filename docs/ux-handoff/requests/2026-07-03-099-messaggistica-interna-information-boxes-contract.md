# Handoff UX — Box Informazioni sezione Messaggistica interna

Data: 2026-07-03  
Area: `Team > Messaggistica interna`  
Priorità: alta  
Tipo richiesta: guida contestuale + contenuti informativi obbligatori

## 1. Obiettivo

La sezione deve spiegare in modo semplice:

- a cosa serve la messaggistica interna
- differenza tra conversazione di struttura e conversazione su minore
- perché alcuni utenti o minori possono non essere selezionabili
- come funziona la protezione dei messaggi

## 2. Drawer principale Informazioni

Il drawer deve contenere almeno i blocchi qui sotto.

### A cosa serve questa sezione

> Questa sezione consente al team di condividere comunicazioni interne operative in modo riservato, tracciato e coerente con la struttura o con uno specifico minore.

### Tipi di conversazione

- `Conversazione di struttura`
- `Conversazione riservata sul minore`

Testo:

> Le conversazioni di struttura servono al coordinamento del team. Le conversazioni sul minore sono riservate a chi è autorizzato a operare su quel minore.

### Partecipanti

> Puoi selezionare solo utenti compatibili con la struttura scelta. Nelle conversazioni sul minore, la lista può restringersi ulteriormente.

### Riservatezza

> I messaggi vengono salvati in forma cifrata e sono accessibili solo agli utenti autorizzati.

### Perché potresti non vedere alcune azioni

> Le azioni disponibili dipendono dal tuo ruolo, dalla struttura in cui operi e, quando presente, dall’assegnazione al minore.

## 3. Box inline obbligatori

### Box tipo conversazione

Posizione:

- sopra il campo `thread_type`

Testo:

> Scegli “di struttura” per comunicazioni interne generali del team oppure “sul minore” per una conversazione collegata a uno specifico caso.

### Box partecipanti

Posizione:

- sopra la selezione multipla partecipanti

Testo:

> L’elenco dei partecipanti cambia in base alla struttura selezionata e può restringersi ulteriormente se la conversazione riguarda un minore.

### Box sicurezza

Posizione:

- sopra il composer o nel pannello dettaglio conversazione

Testo:

> Evita di condividere informazioni non pertinenti. Tutte le operazioni rilevanti su questa sezione sono tracciate.

## 4. Empty state

### Lista vuota

> Non risultano ancora conversazioni interne per i filtri selezionati.

### Nessun partecipante disponibile

> Non ci sono utenti selezionabili con i criteri correnti.

### Nessun messaggio

> La conversazione è stata creata ma non contiene ancora messaggi visibili.

## 5. Regole finali

- non esporre codici permesso tecnici all’utente finale
- non usare termini da sviluppatore come “payload”, “RBAC” o “decrypt”
- usare linguaggio operativo semplice
- seguire anche:
  - `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-03-098-messaggistica-interna-cifrata-v1-contract.md`
