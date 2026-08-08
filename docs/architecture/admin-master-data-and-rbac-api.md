# FamilyHub · API amministrative per anagrafiche e RBAC

Data: 2026-06-20

## Obiettivo

Abilitare la gestione backend reale di:

- anagrafiche operative semplici
- utenti applicativi
- ruoli applicativi
- matrice permessi RBAC

Questo documento descrive lo stato implementato lato backend e l'ordine di adozione previsto lato UX.

## Ambito implementato

### Anagrafiche operative CRUD

Sono ora disponibili endpoint amministrativi CRUD per:

- `document_types`
- `contact_types`
- `minor_statuses`
- `gender_identities`

Le cancellazioni sono protette con risposta `409 Conflict` quando il record è già referenziato da dati applicativi.

### Utenti applicativi

Sono disponibili:

- elenco utenti
- creazione utente
- dettaglio utente
- modifica utente
- disattivazione utente
- reset MFA utente

Nota:

- la disattivazione del proprio utente autenticato è bloccata
- se un utente viene aggiornato con `mfa_required = false`, i segreti MFA vengono rimossi

### Ruoli e permessi RBAC

Sono disponibili:

- elenco ruoli
- creazione ruolo
- dettaglio ruolo
- modifica ruolo
- eliminazione ruolo
- lettura matrice permessi ruolo
- aggiornamento matrice permessi ruolo

Il catalogo permessi resta centralizzato nella tabella `permissions`.
La matrice viene gestita tramite `role_permissions`.

## Modello logico

### Cataloghi

- `permissions`
  - catalogo atomico dei permessi
  - chiave semantica: `resource.action`

- `roles`
  - ruolo applicativo
  - può essere `is_system = true|false`

### Relazioni

- `role_permissions`
  - relazione molti-a-molti tra ruolo e permesso

- `user_facility_roles`
  - assegnazione contestuale utente ↔ struttura ↔ ruolo
  - supporta validità temporale e attivazione/disattivazione

## Stato autorizzativo

Gli endpoint sono esposti sotto:

- `auth:sanctum`
- `admin.api`
- `audit.api`

Questa fase abilita le API. La granularità per permesso puntuale sulle singole route potrà essere irrigidita nel passo successivo.

## Effetti sul frontend / UX

Le pagine che prima erano in sola consultazione o con azioni disabilitate possono ora essere collegate ad API reali:

- `Anagrafiche > Tipi documento`
- `Anagrafiche > Tipi contatto`
- `Anagrafiche > Stati minore`
- `Anagrafiche > Generi`
- `Anagrafiche > Ruoli`
- `Admin > Utenti`

## Fonte contrattuale

La specifica ufficiale delle API è:

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

## Prossimi passi consigliati

1. collegare UX a questi endpoint
2. completare CRUD assegnazioni utente-struttura-ruolo
3. aggiungere enforcement per-permission sulle singole route amministrative
4. affrontare in seguito CRUD geografia, che richiede più cautele su dataset e gerarchie
