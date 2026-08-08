# Handoff UX/API - Guida contestuale sezione Minori

Data: 2026-06-30
Priorita': alta
Ambito: frontend / UX / help contestuale / spiegazione modello accessi

## 1. Obiettivo

Realizzare la guida contestuale della sezione `Minori` con pulsante `Informazioni`, in coerenza con il pattern definito nel task 057.

Questa guida e' prioritaria perche' la sezione `Minori` e' il punto in cui l'utente percepisce piu' facilmente confusione tra:

- permessi RBAC
- assegnazione puntuale al minore
- visibilita' documentale ABAC
- ruoli privilegiati di sistema

---

## 2. Fonte contenuto

Il contenuto funzionale della guida puo' essere derivato da:

- `C:\Projects\FamilyHUB\docs\operations\2026-06-30-guida-sezione-minori.md`
- `C:\Projects\FamilyHUB\docs\operations\2026-06-30-mappa-ruoli-e-bypass-accesso-minori.md`

---

## 3. Dove va mostrata la guida

### 3.1 Elenco minori

Inserire pulsante `Informazioni` o icona `i` nell'header della pagina elenco.

### 3.2 Scheda dettaglio minore

Inserire lo stesso pattern anche nella pagina dettaglio del singolo minore, vicino al titolo o alle tab principali.

Motivo:
- l'elenco e la scheda completa hanno regole diverse
- l'utente deve poter leggere l'aiuto anche dal contesto in cui nasce il dubbio

---

## 4. Contenuti minimi da mostrare in UI

La guida deve spiegare in modo semplice ma preciso:

### 4.1 A cosa serve la sezione

Testo suggerito:

> La sezione Minori consente di consultare e gestire le informazioni anagrafiche, operative e documentali dei minori presi in carico dalla struttura.

### 4.2 Differenza tra elenco e scheda completa

Testo suggerito:

> L'elenco mostra i minori disponibili alla consultazione. La scheda completa espone dati piu' sensibili e richiede controlli di accesso aggiuntivi.

### 4.3 Regola di accesso principale

Testo suggerito:

> Per aprire o modificare le aree sensibili non basta il ruolo: in molti casi servono sia il permesso assegnato al ruolo sia un'assegnazione attiva al minore.

### 4.4 Eccezione dei ruoli privilegiati

Testo suggerito:

> Alcuni ruoli di sistema possono operare sui minori della struttura senza assegnazione puntuale. Questa eccezione non si applica automaticamente ai ruoli personalizzati.

### 4.5 Documenti e ABAC

Testo suggerito:

> La visibilita' dei documenti puo' essere piu' restrittiva della visibilita' della scheda minore, perche' i documenti seguono anche regole basate su tag e classificazioni.

---

## 5. Contenuto specifico da mappare sulle tab

Frontend deve spiegare brevemente il significato delle tab:

- `Anagrafica`: dati identificativi e amministrativi
- `Profilo`: informazioni di contesto del caso
- `Contatti`: riferimenti relazionali del minore
- `Documenti`: documentazione soggetta anche a regole ABAC
- `Accesso al minore`: utenti assegnati al minore
- `Storico`: cronologia eventi e operazioni riferite al minore

---

## 6. Punto UX molto importante: tab `Accesso al minore`

La UI deve evitare un'interpretazione errata di questa tab.

### 6.1 Cosa rappresenta

La tab mostra le assegnazioni puntuali al minore.

### 6.2 Cosa NON rappresenta

La tab non rappresenta necessariamente tutti gli utenti che possono tecnicamente operare sul minore.

Esempio:
- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

possono avere accesso per privilegio di sistema anche senza comparire come assegnazione manuale.

### 6.3 Nota da rendere in UI

Testo suggerito:

> Questa tab mostra le assegnazioni manuali al minore. Alcuni ruoli privilegiati di sistema possono accedere senza comparire in questo elenco.

---

## 7. Errori e messaggi da supportare in UX

### 7.1 Scheda minore completa - 403

Messaggio gia' allineato:

> Non puoi aprire la scheda completa di questo minore: verifica assegnazione attiva e permesso sensibile `minor_profiles.read`.

### 7.2 Moduli collegati - 403

Per `Uscite` e `Attivita'` il messaggio gia' allineato e':

> Operazione non consentita: verifica permessi di ruolo e assegnazione attiva al minore.

### 7.3 Miglioramento futuro ancora aperto

Esiste un solo punto aperto emerso dai feedback UX recenti:

- pre-check lato UI prima dell'apertura di una funzione che potrebbe poi rispondere `403`

Stato:
- non implementato in questo sprint
- da valutare come task separato

UX non deve pero' reinventare logiche client-side non confermate dal backend.

---

## 8. Pattern visuale consigliato

### 8.1 Formato

Preferibile:
- drawer laterale ampio

Alternativa:
- modal larga

### 8.2 Struttura contenuto

Blocchi consigliati:

1. `A cosa serve`
2. `Chi puo' accedere`
3. `Come funziona l'accesso`
4. `Documenti e dati sensibili`
5. `Come leggere le assegnazioni`
6. `Errori frequenti`

### 8.3 Badge e infobox utili

Badge consigliati:
- `RBAC`
- `Assegnazione richiesta`
- `Ruolo privilegiato`
- `ABAC documenti`

Infobox consigliato:
- box warning leggero nella tab `Accesso al minore`
- box info nella tab `Documenti`

---

## 9. Nota importante su coerenza dati tra viste

Se la pagina `Assegnazioni Minori` mostra un'assegnazione ma la tab `Accesso al minore` nella scheda del minore non la mostra, il problema non va considerato cosmetico.

UX deve segnalarlo come anomalia di coerenza dati tra superfici, perche' impatta direttamente la comprensione del modello autorizzativo.

---

## 10. Output atteso dal team frontend

### Fase 1

- pulsante `Informazioni` nell'elenco minori
- pulsante `Informazioni` nella scheda dettaglio minore
- drawer/modal con contenuto guida coerente con questo documento

### Fase 2

- micro-help contestuale nelle tab `Accesso al minore` e `Documenti`
- nota esplicita sui ruoli privilegiati
- supporto ai messaggi 403 gia' definiti dal backend
