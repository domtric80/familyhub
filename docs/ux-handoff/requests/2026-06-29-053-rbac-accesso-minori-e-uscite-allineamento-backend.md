# Handoff UX/API — Allineamento RBAC, accesso minori e modulo Uscite

Data: 2026-06-29  
Priorità: alta  
Ambito: comprensione comportamento backend / riallineamento test UX

## 1. Contesto

Sono stati corretti due disallineamenti distinti:

1. **Scheda minore > Accesso al minore**
   - Il backend risponde con oggetto:
     - `minor`
     - `assignments`
   - Il frontend in precedenza trattava la risposta come array diretto.
   - Effetto osservato: la pagina `Amministrazione > Assegnazioni Minori` mostrava righe corrette, mentre la scheda del minore mostrava “nessun utente”.

2. **Modulo Uscite**
   - Le route erano già protette da RBAC con permessi:
     - `minor_exits.read`
     - `minor_exits.create`
     - `minor_exits.update`
     - `minor_exits.delete`
   - Il controller eseguiva però un secondo check usando codici non presenti nella matrice RBAC (`read_basic`, `edit_operational`).
   - Effetto osservato: utente con permessi corretti a livello route poteva comunque ricevere `403` per mancato accesso al minore.

## 2. Stato corretto backend

### 2.1 Accesso al minore — endpoint aggregati

- `GET /api/admin/minors/{minor}/assigned-users`
  - risposta: oggetto con:
    - `minor`
    - `assignments[]`

- `GET /api/admin/users/{user}/assigned-minors`
  - risposta: oggetto con:
    - `user`
    - `assignments[]`

UX deve quindi leggere **sempre** `response.assignments`.

### 2.2 Regola di accesso ai minori

Il backend applica due livelli:

1. **RBAC**
   - l’utente deve possedere il permesso richiesto per la struttura del minore

2. **Assegnazione attiva al minore**
   - salvo ruoli privilegiati, l’utente deve avere una riga attiva in `minor_user_assignments`
   - condizioni:
     - `is_active = true`
     - `valid_from <= oggi`
     - `valid_to is null OR valid_to >= oggi`

Ruoli privilegiati configurati:
- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

Questi ruoli vedono i minori senza assegnazione puntuale.

## 3. Modulo Uscite — comportamento corretto

Il modulo `Uscite` usa ora controlli coerenti con la matrice RBAC:

- visualizzazione uscita: `minor_exits.read`
- creazione uscita: `minor_exits.create`
- modifica/transizioni: `minor_exits.update`
- eliminazione: `minor_exits.delete`

Oltre al permesso RBAC, il backend richiede anche:
- accesso effettivo al minore tramite assegnazione attiva
- oppure appartenenza a ruolo privilegiato

## 4. Impatto per UX e QA

### 4.1 Cosa aspettarsi ora

- Se una riga compare in `Assegnazioni Minori`, deve comparire anche nella scheda `Minore > Accesso al minore`
- Se un utente ha permesso `minor_exits.create` ma **non** è assegnato al minore, il backend deve restituire `403`
- Se un utente ha permesso `minor_exits.create` **ed è assegnato** al minore, la creazione uscita deve andare a buon fine

### 4.2 Attenzione importante nei test

L’utente bootstrap `admin@familyhub.local` è associato a ruolo `SUPER_ADMIN`.  
Quindi:
- non è un utente valido per collaudare i limiti di accesso “operativi”
- bypassa il vincolo di assegnazione minore per via del ruolo privilegiato

Per i test UX/QA su RBAC e accesso minore usare preferibilmente:
- `EDUCATORE`
- `PSICOLOGO`
- `ASSISTENTE_SOCIALE_EST`
- oppure `ADMIN_IT` se il test riguarda solo area amministrativa senza minori

## 5. Indicazioni per UX

Non è richiesta una modifica grafica obbligatoria immediata, ma è fortemente consigliato che UX tenga conto di queste regole:

- distinguere concettualmente:
  - **permessi di ruolo**
  - **assegnazione al minore**
  - **accesso documentale ABAC**

- evitare messaggi generici tipo “permessi insufficienti” quando il problema reale è:
  - utente non assegnato al minore
  - assegnazione scaduta
  - ruolo non privilegiato

- nei flussi di test, non usare `SUPER_ADMIN` per validare comportamenti restrittivi

## 6. Test backend consigliati

- utente con `minor_exits.create` + assegnazione attiva al minore → `201`
- utente con `minor_exits.create` ma senza assegnazione al minore → `403`
- scheda minore `Accesso al minore` coerente con `GET /api/admin/minor-assignments?minor_id=...`

