# UX fix 187 — Build TypeScript: account collegato nel dettaglio educatore

## Blocco rilevato

Il build frontend fallisce con:

```text
src/pages/educatori/EducatoreDetailPage.tsx(150,36):
Property 'display_name' does not exist on type 'AdminUser'.
```

## Correzione richiesta

In `EducatoreDetailPage.tsx`, sostituire il riferimento:

```ts
staff.user?.display_name
```

con un valore composto dai campi realmente contrattualizzati:

```ts
staff.user ? `${staff.user.first_name} ${staff.user.last_name}`.trim() : ...
```

Mantenere il fallback già presente per `user_id` senza relazione caricata e per nessun account collegato.

## Non modificare il tipo API

`AdminUser` espone `first_name` e `last_name`; il backend non garantisce `display_name` nella risposta staff. Non aggiungere un campo fittizio al type per mascherare la discrepanza.

## Verifica richiesta

Eseguire nel container frontend:

```bash
npm run build
```

e registrare l’esito nel prossimo file response UX.
