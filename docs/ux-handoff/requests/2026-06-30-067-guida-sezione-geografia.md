# Handoff UX/API - Guida contestuale sezione Localizzazione / Geografia

Data: 2026-06-30
Priorita': alta
Ambito: frontend / UX / help contestuale / dati territoriali canonici

## 1. Obiettivo

Realizzare la guida contestuale della sezione `Localizzazione` / `Geografia`, spiegando che questa area governa il dato territoriale canonico dell'intero applicativo.

La guida deve anche chiarire il rapporto tra `Provider Geografia` e `Import dati`, per evitare confusione UX.

---

## 2. Fonte contenuto

Frontend puo' usare come base:

- `C:\Projects\FamilyHUB\docs\operations\2026-06-30-guida-sezione-geografia.md`

---

## 3. Messaggio chiave da spiegare

Testo suggerito:

> I dati geografici del sistema non devono essere scritti liberamente quando devono essere riutilizzati. Questa sezione mantiene il database territoriale canonico su cui si appoggiano strutture, minori e anagrafiche correlate.

---

## 4. Contenuti minimi della guida

### 4.1 A cosa serve la sezione

> La sezione Geografia consente di mantenere, importare e controllare i dati territoriali usati da tutto il software.

### 4.2 Provider vs Import dati

> Il provider definisce la fonte e la modalita' di lettura del dato. L'import usa quel provider per popolare o aggiornare il database applicativo.

### 4.3 Gerarchia geografica

> I dati devono essere letti e filtrati secondo una gerarchia coerente: continente, nazione, regione, provincia, citta'.

### 4.4 Impatto sul resto del software

> Errori in questa sezione possono propagarsi a strutture, minori, staff, documenti e moduli amministrativi.

---

## 5. Pattern UI consigliato

Blocchi suggeriti:
- `A cosa serve`
- `Dati canonici`
- `Provider e import`
- `Gerarchia geografica`
- `Impatto sul resto del sistema`

---

## 6. Output atteso dal team frontend

- pulsante `Informazioni` nella sezione `Geografia`
- guida contestuale chiara su dato canonico, provider e import
- microcopy che eviti di far percepire import e provider come funzioni scollegate
