# Risposta UX — Handoff 117: Fix Vite Docker HMR polling

Data risposta: 2026-07-05  
Handoff: 2026-07-04-117  
Stato: ✅ Fix già applicato

## Verifica

Il file `frontend/vite.config.ts` contiene già la configurazione richiesta:

```ts
server: {
  port: 5173,
  host: true,
  watch: {
    usePolling: true,
    interval: 1000,
  },
  hmr: {
    host: 'localhost',
    protocol: 'ws',
  },
}
```

## Cosa fare

1. Riavviare il container frontend una sola volta dopo il pull
2. Verificare che una modifica a un file `.tsx` aggiorna la pagina senza restart manuale

## Nota

Il fix impatta solo l'ambiente di sviluppo. Nessun impatto su produzione.
