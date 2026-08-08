# Handoff UX/API - Ruoli e documenti: trasparenza obbligatoria su ABAC

Data: 2026-07-05  
Area: `Ruoli`, `Documenti`, `Scheda minore > Documenti`, guide contestuali  
Priorità: alta  
Tipo: correzione concettuale + requisito UX obbligatorio

## 1. Problema da correggere

Il sistema documentale non può essere rappresentato come puro RBAC.

Per l’utilizzatore deve essere chiaro:

- quali ruoli possono accedere a quali classificazioni documentali
- dove leggere questa informazione
- come si comporta un ruolo nuovo creato dall’amministratore

## 2. Decisione da riflettere in UI

### 2.1 Distinzione corretta

- `RBAC` = accesso al software, ai moduli, ai CRUD, ai dati applicativi
- `ABAC documentale` = accesso effettivo ai documenti in base a:
  - classificazione documento
  - ruolo effettivo dell’utente nella struttura
  - assegnazione attiva al minore
  - policy backend

Il ruolo non sostituisce ABAC.  
Il ruolo è uno degli attributi usati dalla policy documentale.

## 3. Che cosa UX deve aggiungere

### 3.1 Pagina `Ruoli`

Ogni ruolo deve avere anche una sezione:

- `Accesso documentale`

Contenuto minimo:

- classificazioni documento accessibili
- stato permesso documentale base
- note di restrizione
- avviso su assegnazione attiva al minore

### 3.2 Form creazione/modifica ruolo

La UI deve separare in modo esplicito:

1. `Permessi ruolo (RBAC)`
2. `Policy documentale`

### 3.3 Scheda documenti minore

Nel box informazioni va spiegato:

- perché un ruolo può vedere il minore ma non un documento
- che il blocco non dipende solo dal permesso modulo
- che l’accesso documentale dipende da policy documentale + classificazione + assegnazione minore

## 4. Cosa NON deve fare UX

- non deve rappresentare ABAC come una semplice colonna RBAC
- non deve mostrare classificazioni documento come testo decorativo
- non deve lasciare implicito il rapporto tra ruolo e classificazioni

## 5. Stato backend aggiornato

Ora esistono due endpoint distinti:

- `GET /api/admin/document-access-matrix`
- `GET /api/admin/roles/{role}/document-policy`
- `PUT /api/admin/roles/{role}/document-policy`

### Differenza tra i due

`document-access-matrix`

- serve a leggere la matrice complessiva di tutti i ruoli
- è utile per pagina informativa/amministrativa globale

`roles/{role}/document-policy`

- serve a leggere e modificare la visibilità documentale di un ruolo specifico
- è l’endpoint da usare nel form dettaglio ruolo

## 6. Regola UX obbligatoria per ruoli nuovi

Quando si crea o modifica un ruolo, la UI deve prevedere due step distinti:

1. `Permessi ruolo (RBAC)`
2. `Classificazioni documentali`

Se manca il secondo step, l’amministratore non può capire quali documenti il ruolo vedrà davvero.

## 7. Comportamento richiesto nel form ruolo

Nel dettaglio ruolo mostrare:

- stato `attachments.read`
- stato `attachments.upload`
- elenco classificazioni con checkbox
- nota fissa: `Per i documenti del minore l’accesso effettivo richiede anche l’assegnazione attiva al minore.`

## 8. Messaggio chiave da mostrare agli amministratori

`I permessi di ruolo controllano l’accesso alle funzioni del sistema.`

`L’accesso ai documenti sensibili è regolato anche da policy documentali basate su classificazione, ruolo effettivo e assegnazione al minore.`
