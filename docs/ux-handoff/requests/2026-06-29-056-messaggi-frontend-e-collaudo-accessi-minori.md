# Handoff UX — Messaggi frontend e collaudo accessi minori

Data: 2026-06-29  
Priorità: media-alta  
Ambito: messaggi UI / collaudo finale

## 1. Messaggio scheda minore

La scheda completa del minore non va interpretata come “semplice lettura base”.

Backend attuale:
- `GET /api/minors/{minor}` richiede `minor_profiles.read`

Messaggio frontend consigliato in caso di `403`:

- “Non puoi aprire la scheda completa di questo minore: verifica assegnazione attiva e permesso sensibile `minor_profiles.read`.”

Questo è più corretto del vecchio messaggio “non risulti assegnato”, perché il problema può dipendere anche dal permesso sensibile.

## 2. Assegnazioni minore / utente

Gli endpoint aggregati restituiscono:

- `GET /api/admin/minors/{minor}/assigned-users` → `assignments[]`
- `GET /api/admin/users/{user}/assigned-minors` → `assignments[]`

Il frontend è stato riallineato per leggere direttamente l’array già normalizzato dal layer API.

## 3. Cosa verificare durante il test UX

### Caso A — scheda minore

- utente assegnato ma senza `minor_profiles.read`
- atteso:
  - il minore può comparire in flussi operativi/lista filtrata
  - la scheda completa restituisce `403`
  - il messaggio deve far capire che serve permesso sensibile

### Caso B — accesso al minore

- la pagina `Amministrazione > Assegnazioni Minori`
- e la tab `Minore > Accesso al minore`
- devono mostrare la stessa realtà dati

### Caso C — utente > minori assegnati

- nella pagina utente, la vista “minori assegnati” deve riflettere il backend reale
- dopo bulk-sync / salvataggio, il reload deve mostrare le assegnazioni attive corrette

## 4. Nota per il team UX

Quando i test riguardano limitazioni reali:
- non usare `admin@familyhub.local`
- usare ruoli operativi reali (`EDUCATORE`, `PSICOLOGO`, ecc.)

Perché il bootstrap user è `SUPER_ADMIN` e falserebbe i risultati.

