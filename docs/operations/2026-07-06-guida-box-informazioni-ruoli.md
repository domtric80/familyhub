# Guida operativa - Box informazioni nella sezione Ruoli

Data: 2026-07-06
Ambito: usabilità amministrativa, ruoli, policy documentale

## 1. A cosa serve

Il box informazioni nella sezione `Ruoli` serve a spiegare una regola importante:

un ruolo non decide da solo tutti i documenti visibili.

## 2. Messaggio chiave

L’amministratore deve sempre leggere questa logica:

1. i permessi RBAC aprono moduli e funzioni
2. le classificazioni documentali definiscono le categorie di documenti visibili
3. per i documenti del minore serve anche assegnazione attiva al minore

## 3. Quando il box è utile

È particolarmente utile quando:

- si crea un ruolo nuovo
- si duplica un ruolo esistente
- un utente vede il minore ma non vede i documenti attesi

## 4. Esempio concreto

Un ruolo può avere:

- `attachments.read`
- accesso al modulo documenti

ma non vedere un documento `clinical` se quella classificazione non è stata abilitata per il ruolo.

## 5. Obiettivo pratico

Questo box riduce errori di configurazione e richieste di assistenza, perché rende esplicita una regola che altrimenti resta nascosta nel backend.
