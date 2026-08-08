# Guida operativa - Sezione Localizzazione / Geografia

Data: 2026-06-30
Ambito: amministrazione / dati canonici / qualita' del dato

## 1. Scopo della sezione

La sezione `Localizzazione` o `Geografia` serve a governare le anagrafiche territoriali canoniche del sistema.

Questa sezione e' fondamentale per garantire:
- coerenza del dato
- riuso corretto dei riferimenti territoriali
- riduzione degli errori manuali
- allineamento documentale e amministrativo

---

## 2. Principio chiave: niente testo libero per dati riusabili

Dati come:
- continente
- nazione
- regione
- provincia
- citta'

non devono essere lasciati a scrittura libera quando fanno parte del modello riusabile.

Devono essere scelti da anagrafiche canoniche o importati da provider affidabili.

---

## 3. A cosa serve davvero la sezione

La sezione `Geografia` non e' solo consultazione.

Serve a:
- mantenere il dizionario territoriale dell'applicativo
- popolare e correggere i riferimenti geografici
- governare provider e import dati
- assicurare che strutture, minori, educatori e altre entita' usino riferimenti coerenti

---

## 4. Provider geografici

I provider geografici servono a recuperare dati territoriali da fonti esterne attendibili.

La loro funzione e' permettere importazioni controllate nel database applicativo.

Concetto corretto:
- `Provider Geografia` -> definisce da dove e come leggere il dato
- `Import dati` -> usa quel provider per popolare o aggiornare il database canonico

---

## 5. Import dati e qualita' del dato

L'import geografico deve essere pensato come strumento di qualita'.

Serve per evitare errori come:
- citta' scritte male
- provincie errate
- riferimenti incongruenti nei documenti
- difficolta' di correlazione amministrativa

---

## 6. Regole UX importanti

La UI della sezione `Geografia` deve far capire che:

- il dato territoriale e' una base canonica dell'intero software
- provider e import non sono funzioni separate senza legame
- l'import deve essere leggibile come popolamento del database applicativo
- i filtri gerarchici devono rispettare il rapporto continente -> nazione -> regione -> provincia -> citta'

---

## 7. Contenuti minimi del tasto Informazioni

La guida contestuale deve spiegare:

1. a cosa serve la sezione
2. perche' i dati territoriali non devono essere scritti liberamente
3. differenza tra provider e import dati
4. perche' il database geografico e' centrale per tutto il software
5. come leggere la gerarchia geografica

---

## 8. Nota per QA e supporto

Se un form mostra filtri geografici incoerenti, il problema non e' solo estetico: puo' riflettersi su dati errati in minori, strutture, staff e documenti.
