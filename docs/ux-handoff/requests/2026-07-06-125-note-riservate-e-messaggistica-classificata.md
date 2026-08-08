# Handoff UX/API - Note riservate e messaggistica classificata

Data: 2026-07-06  
Area: `Messaggistica interna`, `Note riservate`, `Minori`  
Priorità: alta  
Tipo: decisione concettuale + requisito UI futuro

## 1. Decisione da recepire

Le note sensibili e i thread sensibili riusano le stesse classificazioni documentali:

- `internal`
- `restricted`
- `clinical`
- `judicial`

La UI non deve introdurre una tassonomia parallela.

## 2. Regola di visibilità

La visibilità non dipende dal solo autore.

Non usare modello:

- `solo chi scrive può leggere`

Usare invece:

- permesso modulo
- classificazione ammessa per il ruolo
- struttura coerente
- assegnazione attiva al minore se il contenuto riguarda un minore

## 3. Cosa significa per UX

### 3.1 In creazione nota/thread

L’utente deve scegliere una classificazione tra quelle coerenti con il proprio profilo.

### 3.2 In visualizzazione

La UI deve mostrare badge chiari:

- `Interno`
- `Riservato`
- `Clinico`
- `Giudiziario`

### 3.3 In help contestuale

Testo consigliato:

`La visibilità del contenuto dipende dalla classificazione selezionata e dalle autorizzazioni dell’utente sul minore e sulla struttura.`

## 4. Sicurezza da comunicare senza dettagli tecnici inutili

Messaggio consigliato:

`I contenuti sensibili vengono salvati in forma cifrata e sono visibili solo agli utenti autorizzati dal sistema.`

Non mostrare:

- dettagli su chiavi
- algoritmi
- terminologia tecnica superflua all’operatore finale

## 5. Coerenza con i documenti

UX deve considerare note e messaggi sensibili come estensione della stessa policy già usata per i documenti.

In pratica:

- chi può vedere documenti `clinical` può vedere anche note/thread `clinical`
- chi non può vedere `judicial` non deve vedere note/thread `judicial`

## 6. Impatto futuro sulle schermate

Quando il backend esporrà questa evoluzione, UX dovrà prevedere:

- select classificazione in creazione nota sensibile
- select classificazione in creazione thread sensibile o thread minore
- badge classificazione in lista e dettaglio
- blocchi informativi coerenti con la policy documentale

## 7. Nota importante

La cifratura non cambia il comportamento UX di base:

- il frontend invia testo normale via TLS
- il backend cifra a riposo
- il frontend riceve solo contenuti già autorizzati e decifrati dal backend
