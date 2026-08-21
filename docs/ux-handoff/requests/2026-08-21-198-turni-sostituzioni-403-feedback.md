# UX Handoff 198 - Turni: errore 403 mascherato nello storico sostituzioni

Data: 2026-08-21  
Priorita: alta  
Tipo: bugfix frontend  
Ambito: `Turni > Pianificazione > Sostituzioni turno`

## Problema

Quando il backend nega l'accesso allo storico sostituzioni con risposta HTTP `403`, il frontend intercetta l'errore senza mostrarlo e lascia `substHistory` vuoto.

La modale mostra quindi:

`Nessuna sostituzione registrata.`

Questo messaggio e falso: la UI non ha verificato che lo storico sia vuoto, ma non ha il permesso per leggerlo.

Codice interessato:

`frontend/src/pages/turni/PianificazionePage.tsx`, funzione `openSubstModal()`.

Comportamento attuale:

```typescript
try {
  const history = await shiftAssignmentsApi.substitutions(a.id)
  setSubstHistory(history)
} catch {
  // 403 -> history vuoto, nessun blocco
}
```

## Rischio

- informazione operativa ingannevole;
- impossibilita per l'utente di distinguere storico vuoto da permesso insufficiente;
- diagnosi errata durante QA e assistenza;
- incoerenza con la gestione centralizzata degli errori API.

## Correzione richiesta

Gestire separatamente almeno questi stati:

1. caricamento in corso;
2. storico caricato con record;
3. storico caricato correttamente ma vuoto;
4. accesso negato (`403`);
5. errore generico di caricamento.

Per `403` mostrare nella modale un messaggio esplicito e accessibile, ad esempio:

`Non disponi del permesso necessario per consultare lo storico delle sostituzioni.`

Non mostrare `Nessuna sostituzione registrata` in caso di errore.

Per altri errori mostrare:

`Impossibile caricare lo storico delle sostituzioni. Riprova oppure contatta l'assistenza.`

## Indicazioni implementative

- usare `apiError(error)` per ottenere status e messaggio normalizzati;
- aggiungere uno stato dedicato, ad esempio `substHistoryError`;
- azzerare l'errore a ogni nuova apertura della modale;
- non inserire stack trace, URL tecnici o payload nel messaggio utente;
- non usare un toast come unica comunicazione: l'errore deve restare visibile nella sezione storico della modale;
- non modificare le regole RBAC o gli endpoint backend;
- non simulare uno storico vuoto quando la richiesta fallisce.

## Criteri di accettazione

### Caso 1 - Storico disponibile

- API `200` con record;
- la tabella mostra i record restituiti.

### Caso 2 - Storico realmente vuoto

- API `200` con array vuoto;
- la UI mostra `Nessuna sostituzione registrata.`

### Caso 3 - Permesso insufficiente

- API `403`;
- la UI mostra il messaggio di permesso insufficiente nella modale;
- la UI non mostra il messaggio di storico vuoto;
- nessun dettaglio tecnico e presente a video.

### Caso 4 - Errore non autorizzativo

- API `500`, errore di rete o risposta non valida;
- la UI mostra il messaggio generico persistente;
- l'utente puo chiudere e riaprire la modale per riprovare.

### Caso 5 - Nuova apertura

- chiudere una modale terminata in errore;
- aprire un'altra assegnazione;
- il precedente messaggio non deve restare visibile durante la nuova richiesta.

## Verifiche obbligatorie

- `npm run build` superato;
- prova manuale dei quattro esiti API `200 con record`, `200 vuoto`, `403` ed errore generico;
- verifica navigazione da tastiera e annuncio accessibile del messaggio;
- nessuna regressione su creazione e annullamento sostituzione.

## Risposta richiesta

Creare:

`docs/ux-handoff/responses/2026-08-21-198-turni-sostituzioni-403-feedback-response.md`

La risposta deve indicare:

- file modificati;
- gestione implementata per ciascuno stato;
- risultato della build;
- esito dei cinque criteri di accettazione;
- eventuali limiti residui.
