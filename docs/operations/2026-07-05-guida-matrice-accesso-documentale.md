# Guida operativa - Matrice accesso documentale

Data: 2026-07-05
Ambito: amministrazione ruoli, visibilità documenti, supporto operativo

## 1. A cosa serve

La matrice accesso documentale serve a capire:

- quali ruoli hanno il permesso documentale di base
- quali classificazioni documento sono compatibili con ogni ruolo
- quando serve anche l’assegnazione attiva al minore

Questa pagina non modifica i permessi.  
Serve a leggere in modo chiaro il comportamento del sistema.

## 2. Regola base

Per i documenti non basta il ruolo.

Il sistema combina:

1. permesso RBAC documentale
2. ruolo ammesso dalla classificazione
3. assegnazione attiva al minore

## 3. Cosa significa in pratica

Un utente può:

- entrare nel software
- vedere la scheda del minore
- vedere il modulo documenti

ma non poter:

- aprire un documento `clinical`
- scaricare un documento `judicial`

se la policy documentale non lo consente.

## 4. Come leggere la matrice

### Permesso documenti

Indica se il ruolo possiede il permesso RBAC di base:

- `attachments.read`

Se questo permesso manca, il ruolo non può accedere ai documenti anche se la classificazione lo ammetterebbe.

### Upload documenti

Indica se il ruolo possiede:

- `attachments.upload`

### Classificazioni leggibili

Mostra per quali classificazioni il ruolo supera anche la regola documentale.

### Assegnazione minore

Per i documenti del minore, anche quando il ruolo è ammesso, resta necessario il collegamento operativo attivo al minore.

## 5. Perché è utile per i ruoli nuovi

Quando si crea un ruolo nuovo, l’amministratore può assegnare i permessi modulo, ma questo non basta a capire l’accesso documentale reale.

La matrice serve proprio a evitare errori come:

- ruolo che vede il modulo documenti ma non i documenti clinici
- ruolo con permessi corretti lato modulo ma escluso dalla classificazione

## 6. Cosa fare se un ruolo non vede un documento

Verificare in ordine:

1. il ruolo ha `attachments.read`
2. la classificazione documento ammette quel ruolo
3. l’utente è assegnato attivamente al minore
4. non ci sono altri blocchi di sicurezza sul file

## 7. Nota importante

La matrice documentale è una vista di spiegazione del sistema.

Non sostituisce:

- pagina Ruoli
- anagrafiche classificazioni documento
- assegnazioni minore

Le collega e le rende comprensibili insieme.
