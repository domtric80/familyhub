# Handoff UX/API - Default documentale del ruolo COORDINATORE

Data: 2026-07-06  
Area: `Ruoli`, `Accesso documentale`, `Documenti minore`, `Note classificate`, `Messaggistica classificata`  
Priorita: alta  
Tipo: chiarimento funzionale + allineamento UX

## 1. Decisione funzionale approvata

Default ufficiale del ruolo `COORDINATORE`:

- vede i documenti `internal`
- vede i documenti `restricted`
- non vede i documenti `clinical` di default
- puo vedere i documenti `clinical` solo se la classificazione viene abilitata da pannello amministrativo

Questa stessa logica si riflette anche su:

- note classificate del minore
- messaggistica interna classificata

perche il backend usa la stessa classificazione documentale come base ABAC.

## 2. Stato backend

Il backend e gia coerente con questa decisione:

- `COORDINATORE` e ammesso a `restricted`
- `COORDINATORE` non e ammesso a `clinical`
- il pannello policy per ruolo consente di aggiungere o rimuovere classificazioni per ogni ruolo

Endpoint gia disponibili:

- `GET /api/admin/document-access-matrix`
- `GET /api/admin/roles/{role}/document-policy`
- `PUT /api/admin/roles/{role}/document-policy`

## 3. Comportamento UX richiesto

### Pagina matrice accesso documentale

Per il ruolo `COORDINATORE` la UI deve mostrare chiaramente:

- `internal` = consentito
- `restricted` = consentito
- `clinical` = non consentito di default
- `judicial` = non consentito di default

### Editor policy del ruolo

Nel dettaglio policy di `COORDINATORE`:

- `clinical` deve comparire come classificazione disponibile ma non assegnata di default
- se l'amministratore la abilita, il backend la rendera effettiva

### Testi guida / box informazioni

Evitare formule ambigue tipo:

- "il coordinatore vede tutti i documenti"

Usare invece formule esplicite tipo:

- "Il coordinatore vede i documenti operativi e riservati della struttura. I documenti clinici richiedono abilitazione esplicita nella policy documentale del ruolo."

## 4. Impatto su frontend

Il frontend non deve hardcodare eccezioni locali.

Deve leggere la situazione reale dagli endpoint:

- matrice complessiva: `GET /api/admin/document-access-matrix`
- dettaglio ruolo: `GET /api/admin/roles/{role}/document-policy`

## 5. Nota importante

Se un coordinatore apre un minore e non vede un documento `clinical`, questo non e un bug UX:

- e il comportamento corretto di default

Se invece il pannello admin abilita `clinical` sul ruolo `COORDINATORE`, allora:

- il coordinatore potra vedere contenuti `clinical`
- restano comunque validi gli altri controlli di assegnazione al minore dove previsti
