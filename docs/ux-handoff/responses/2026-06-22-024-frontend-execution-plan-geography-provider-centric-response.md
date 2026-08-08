# Risposta UX 024 · Frontend execution plan geography provider-centric

Data: 2026-06-22
Stato: IMPLEMENTATO

## Cosa è stato fatto

ProviderGeografiaPage riscritta come hub operativo unico a 3 tab.

## Tab 1 — Provider

Tabella: Codice, Nome, Tipo, Driver, Modalità, Formato, URL/Path, Priorità,
Attivo, Livelli supportati, Azioni (modifica / vai associazioni / vai import).

Form modal con campi espliciti:
- Codice, Nome, Tipo, Driver
- Modalità sorgente (local_file / remote_file / api)
- Formato (csv / zip / json / xml)
- Path locale (visibile solo se modalità = local_file)
- URL sorgente (visibile solo se modalità = remote_file | api)
- Tipo autenticazione + Config autenticazione JSON (visibili solo se modalità = api)
- Priorità, Attivo, Note

## Tab 2 — Associazioni nazioni

Country select + tabella mapping con provider, tipo, default, priorità, attivo,
livelli. CRUD associazioni (add / update / delete mapping).

## Tab 3 — Import dati

Country select → CapabilityBox (driver IT/ISTAT → full; altri → GEONAMES country-only)
→ CTA "Importa dati nel database" → POST /admin/geography-imports
→ result panel: provider usato, nazione, conteggi loaded per livello.

## Tipi aggiornati

GeoProvider: rimosso config_json, aggiunti mode, format, source_path, source_url,
auth_type, auth_config_json. GeoProviderMode e GeoProviderFormat come union type.
