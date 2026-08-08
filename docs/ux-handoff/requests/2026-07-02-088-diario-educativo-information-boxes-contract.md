# Handoff UX — Box Informazioni sezione Diario educativo

Data: 2026-07-02  
Area: `Minori > Diario educativo`  
Priorità: alta  
Tipo richiesta: guida contestuale + contenuti informativi obbligatori

## 1. Obiettivo

La sezione `Diario educativo` deve avere un drawer `Informazioni` e box contestuali che aiutino a capire:

- cosa registrare
- come usare priorità e umore
- quando attivare follow-up o handover
- perché la pagina è importante nel lavoro educativo

## 2. Drawer principale

Il drawer deve contenere almeno questi blocchi.

### A cosa serve questa sezione

> Questa sezione raccoglie osservazioni educative, eventi del turno, segnalazioni di attenzione e passaggi di consegne relativi al minore.

### Quali dati vengono gestiti

- data e ora dell’osservazione
- titolo e contenuto
- priorità operativa
- umore osservato
- alimentazione, igiene, sonno
- follow-up
- passaggio consegne

### Come usare la priorità

- `Ordinaria` (`green`)
- `Attenzione` (`yellow`)
- `Urgente` (`red`)

Testo:

> Usa la priorità per indicare quanto l’informazione richiede attenzione operativa.

### Come usare l’umore

Valori:

- molto negativo
- negativo
- neutro
- positivo
- molto positivo

Testo:

> L’umore serve a sintetizzare l’osservazione emotiva del minore nel momento registrato.

### Follow-up

> Attiva il follow-up quando la voce richiede un controllo successivo, una verifica o un intervento di continuità.

### Passaggio consegne

> Usa il passaggio consegne quando la voce deve essere formalmente portata all’attenzione del turno o della figura successiva.

### Perché potresti non vedere alcune azioni

> Le azioni disponibili dipendono dal tuo ruolo, dalla struttura in cui operi e dall’eventuale assegnazione al minore.

## 3. Box inline obbligatori

### Box priorità

Posizione:

- sopra `priority_level`

Testo:

> Seleziona la priorità operativa della voce.

### Box registro turno

Posizione:

- sopra `nutrition_summary`, `hygiene_summary`, `sleep_summary`

Testo:

> Compila questi campi quando vuoi trasformare la voce in una registrazione più strutturata del turno educativo.

### Box follow-up

Posizione:

- sopra i campi follow-up

Testo:

> Se richiedi un follow-up, devi spiegare cosa dovrà essere verificato o ripreso.

### Box handover

Posizione:

- sopra i campi handover

Testo:

> Usa questa area per formalizzare il passaggio di consegne e l’eventuale presa visione.

## 4. Lista e summary

### Empty state

> Non risultano ancora voci diario per i filtri selezionati.

### Box summary

Testo:

> I riepiloghi mostrano l’andamento delle osservazioni registrate, la distribuzione delle priorità e i passaggi di consegne ancora da leggere.

## 5. Regole finali

- non usare termini tecnici da sviluppatore
- non esporre codici RBAC nel drawer utente finale
- seguire anche:
  - `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-087-diario-educativo-v2-contract.md`
  - `C:\Projects\FamilyHUB\frontend\src\components\common\InfoDrawer.tsx`
