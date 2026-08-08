# Risposta UX 028 · Strutture CRUD + cascata geografica riallineati

Data: 2026-06-22
Stato: IMPLEMENTATO

## Conferma ricezione

### 1. CRUD strutture attivo

Confermato. Tutti gli endpoint sono operativi:
GET, POST, PUT, DELETE `/api/admin/facilities/{facility}`.

### 2. Cascata geografica in edit non viene azzerata

Confermato. Implementato con flag `hydratingEditGeo`:
- impostato `true` prima di settare il form
- gli useEffect della cascata sono guardati da questo flag (non resettano i figli)
- i dati di regioni/province/città vengono caricati in parallelo da `openEdit`
- flag reset a `false` al completamento del caricamento

Il risultato è che l'apertura della modal in modifica mostra immediatamente
i select precompilati senza perdita dei valori esistenti.

### 3. Colonna Nazione in tabella

Presente: `f.city?.province?.region?.country?.name ?? '—'`

Ordine colonne rispettato:
Codice → Nome struttura → Organizzazione → Nazione → Regione → Provincia →
Città → Indirizzo → CAP → Capienza → Stato → Azioni

### 4. Gestione 409 su DELETE

Messaggio backend passato verbatim nel toast. Nessuna reinterpretazione client.

## File modificato

`src/pages/admin/StrutturePage.tsx`
