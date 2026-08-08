# Handoff UX/API - Guide contestuali anagrafiche residue

Data: 2026-06-30
Priorita': alta
Ambito: frontend / UX / help contestuale / dizionari applicativi

## 1. Obiettivo

Completare la copertura del pattern `Informazioni` anche sulle anagrafiche residue del sistema, spiegando che questi moduli non sono tabelle tecniche secondarie ma dizionari canonici del dato.

Sezioni da coprire:
- `Tipi Documento`
- `Classificazioni Documento`
- `Tipi Contatto`
- `Stati Minore`
- `Tipi Uscita`
- `Tipi Attivita'`

---

## 2. Fonte contenuto

Frontend puo' usare come base:

- `C:\Projects\FamilyHUB\docs\operations\2026-06-30-guida-anagrafiche-residue.md`

---

## 3. Messaggio chiave comune da spiegare

Testo suggerito:

> Queste anagrafiche definiscono valori riusabili e canonici del software. Servono a evitare testo libero incoerente e a mantenere il dato stabile, filtrabile e correlabile nel tempo.

---

## 4. Contenuto minimo da adattare per ciascuna sezione

### 4.1 A cosa serve la sezione

Ogni guida deve spiegare la finalita' specifica dell'anagrafica.

### 4.2 Perche' non usare testo libero

Ogni guida deve ribadire che il valore viene riusato da piu' moduli e quindi non va lasciato a compilazione arbitraria quando deve essere correlato.

### 4.3 Impatto sul resto del software

Ogni guida deve chiarire che quella anagrafica influisce su:
- form di inserimento
- filtri
- reporting
- audit o classificazioni, quando applicabile

---

## 5. Differenze da rendere bene in UI

### 5.1 Tipi Documento

Messaggio suggerito:

> Definisce la tipologia funzionale del documento e aiuta a organizzare in modo coerente i caricamenti e i filtri documentali.

### 5.2 Classificazioni Documento

Messaggio suggerito:

> Definisce la classificazione del documento e puo' incidere sul perimetro di visibilita' e controllo del contenuto.

### 5.3 Tipi Contatto

Messaggio suggerito:

> Definisce categorie di contatto riusabili per mantenere uniforme la relazione tra persone e casi.

### 5.4 Stati Minore

Messaggio suggerito:

> Definisce gli stati canonici del percorso gestionale del minore, evitando descrizioni variabili e difficili da filtrare.

### 5.5 Tipi Uscita

Messaggio suggerito:

> Definisce le categorie riusabili delle uscite, migliorando controllo operativo e reporting.

### 5.6 Tipi Attivita'

Messaggio suggerito:

> Definisce le categorie riusabili delle attivita', rendendo piu' leggibile e analizzabile il lavoro educativo.

---

## 6. Pattern UI consigliato

Per tutte le sezioni:
- pulsante `Informazioni` nell'header
- drawer o modal coerente con il pattern gia' adottato
- struttura breve e ripetibile

Blocchi suggeriti:
1. `A cosa serve`
2. `Perche' e' importante`
3. `Come impatta il resto del software`

---

## 7. Output atteso dal team frontend

- estensione del pattern `Informazioni` a tutte le anagrafiche residue
- microcopy coerente con il principio del dato canonico
- nessuna rappresentazione che banalizzi queste sezioni come semplici tabelle tecniche
