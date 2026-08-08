# Dev note — Vite in Docker: file watch e HMR

Data: 2026-07-04  
Contesto: ambiente di sviluppo Docker con Vite dev server

---

## Problema

Le modifiche ai file sorgente (`.tsx`, `.ts`) apportate dall'esterno del container Docker **non vengono rilevate automaticamente da Vite**. Il dev server continua a servire la versione vecchia in cache, mostrando errori apparentemente già risolti.

Sintomi tipici:
- Vite mostra un errore di sintassi (`Unexpected token`) su una riga che nel file sorgente risulta corretta
- L'errore non cambia anche dopo aver salvato il file
- HMR (Hot Module Replacement) non si attiva

---

## Causa

Vite usa il file watch del sistema operativo per rilevare i cambiamenti. Su Windows con Docker Desktop (mount WSL2 o bind mount), gli eventi del filesystem **spesso non propagano** al container. Vite non sa che il file è cambiato e usa la versione compilata in memoria.

---

## Soluzione: riavviare il dev server

Nel terminale dove gira il dev server:

```bash
# 1. Ferma il server
Ctrl + C

# 2. Riavvia (pulisce anche la cache Vite in memoria)
npm run dev
```

Se l'errore persiste anche dopo il riavvio, aggiungi `--force` per forzare la ri-pre-bundlizzazione:

```bash
npx vite --force
```

---

## Soluzione strutturale (opzionale)

Abilita il polling nel file `vite.config.ts` per far funzionare il file watch su Docker/WSL:

```ts
// vite.config.ts
export default defineConfig({
  server: {
    watch: {
      usePolling: true,       // rileva modifiche via polling invece di eventi FS
      interval: 1000,         // ogni secondo
    },
  },
  // ...
})
```

> ⚠️ Il polling aumenta leggermente il consumo CPU. Usarlo solo in sviluppo, mai in produzione.

---

## Nota su encoding dei file

Durante lo sviluppo è emerso che alcuni file `.tsx` contenevano byte non validi (es. `\x85` — NEL / ellipsis Windows-1252) che causavano errori di parsing Babel. 

**File interessato:** `MinoreFormPage.tsx` (risolto il 2026-07-04)

Per prevenire future corruzioni, usare sempre UTF-8 senza BOM nell'editor e verificare la configurazione `.editorconfig`:

```ini
[*.{ts,tsx}]
charset = utf-8
end_of_line = lf
```

---

## File corretti in questa sessione (2026-07-04)

| File | Problema | Fix |
|------|----------|-----|
| `services/api.ts` | `internalMessageApi` mancante (export non scritto) | Aggiunto export completo con tutti i metodi |
| `pages/minori/MinoreDetailPage.tsx` | Molte espressioni `{x ? y}` senza ramo `:` | Sostituito con `{x ?? y}` |
| `pages/minori/MinoreFormPage.tsx` | Byte `\x85` (Windows-1252) nel sorgente | Sostituito con `…` UTF-8 |

---

## Stato successivo al fix

Al 2026-07-04 e' stato applicato un fix strutturale in `frontend/vite.config.ts` con polling attivo (`usePolling: true`, `interval: 1000`) e HMR esplicitato su `localhost`.

Questa nota non va quindi letta solo come workaround operativo: il progetto ora include anche la mitigazione tecnica nel repository.
