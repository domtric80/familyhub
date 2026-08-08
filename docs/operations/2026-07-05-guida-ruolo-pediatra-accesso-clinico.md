# Guida operativa - Ruolo Pediatra e accesso ai dati clinici

Data: 2026-07-05
Ambito: ruoli, documenti clinici, assegnazioni minore

## 1. Cosa può fare il Pediatra

Il ruolo `PEDIATRA` è pensato per il lavoro sanitario sul minore.

Può:

- leggere la scheda minore
- leggere il profilo minore
- leggere documenti clinici

## 2. Condizione obbligatoria

L'accesso non è globale.

Il pediatra vede i documenti clinici solo se:

1. ha il ruolo `PEDIATRA`
2. è assegnato in modo attivo al minore
3. il documento appartiene a una classificazione che lo ammette

## 3. Cosa non deve aspettarsi l'operatore

Il ruolo `PEDIATRA` non equivale a coordinatore o direttore.

Non abilita automaticamente:

- gestione ruoli
- gestione avvicinamenti familiari
- diario educativo
- accesso a documenti giudiziari

## 4. Se il pediatra non vede il documento clinico

Verificare:

1. utente con ruolo corretto
2. assegnazione attiva al minore
3. documento classificato correttamente come `clinical`
4. nessun errore di configurazione locale del ruolo

## 5. Messaggio consigliato per help contestuale

`Il pediatra può consultare i dati clinici solo per i minori a cui è assegnato.`
