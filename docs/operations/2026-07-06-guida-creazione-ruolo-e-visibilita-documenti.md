# Guida operativa - Creare un ruolo e decidere quali documenti può vedere

Data: 2026-07-06
Ambito: amministrazione ruoli, policy documentale, supporto utenti admin

## 1. Domanda tipica

`Se creo un ruolo nuovo, come decido quali documenti può vedere?`

Risposta:

Servono due configurazioni separate:

1. permessi RBAC del ruolo
2. classificazioni documentali abilitate al ruolo

## 2. Passo 1 - Permessi ruolo

I permessi RBAC decidono se il ruolo può:

- entrare in un modulo
- leggere dati
- creare o modificare record
- usare il modulo documenti

Permesso base documentale:

- `attachments.read`

## 3. Passo 2 - Classificazioni documentali

Le classificazioni decidono quali categorie di documenti il ruolo può leggere:

- `internal`
- `restricted`
- `clinical`
- `judicial`

## 4. Regola finale

Per i documenti del minore il sistema combina:

1. permesso `attachments.read`
2. classificazione ammessa per il ruolo
3. assegnazione attiva al minore

## 5. Esempio semplice

Ruolo nuovo: `Pediatra territoriale`

- permessi RBAC:
  - `minors.read`
  - `minor_profiles.read`
  - `attachments.read`
- classificazioni:
  - `clinical`

Risultato:

- il ruolo vede i documenti clinici dei minori assegnati

## 6. Errore comune da evitare

Assegnare solo i permessi RBAC e dimenticare la policy documentale.

In quel caso l’utente entra nel modulo ma non trova i documenti attesi.

## 7. Suggerimento pratico

Dopo ogni nuovo ruolo verificare sempre:

- pagina permessi ruolo
- pagina policy documentale ruolo
- assegnazione del ruolo a un minore di test
