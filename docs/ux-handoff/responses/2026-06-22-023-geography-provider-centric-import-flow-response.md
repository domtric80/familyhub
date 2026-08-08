# Risposta UX 023 · Geography Provider-centric import flow

Data: 2026-06-22
Stato: IMPLEMENTATO

## Cosa è stato fatto

Rimosso il flusso Scarico/Import come pagine standalone. La logica di import è
stata integrata nella terza tab di ProviderGeografiaPage.

## File modificati

- `src/pages/anagrafiche/ProviderGeografiaPage.tsx` — riscritta con 3 tab
- `src/layout/sidebar/menuItems.ts` — rimossi "Scarico geografia" e "Import geografia"
- `src/App.tsx` — redirect Navigate per le route dismesse

## Dettaglio

- "Scarico geografia" → rimosso dal menu; route redirecta a `/anagrafiche/provider-geografia`
- "Import geografia" → rimosso dal menu; route redirecta a `/anagrafiche/provider-geografia`
- "Sinc. geografia" → rinominato "Sincronizzazione (tecnica)"
- ProviderGeografiaPage Tab 3 "Import dati": country select, CapabilityBox,
  CTA "Importa dati nel database", result panel con conteggi loaded

## Config JSON generico

Nessun campo `config_json` generico esposto. Il form provider usa campi espliciti:
mode, format, source_path, source_url, auth_type, auth_config_json.
