# Proposta architetturale - Anagrafica Driver Geografia

Data: 2026-06-22
Stato: proposta da validare insieme prima di implementare

## Problema attuale
Oggi il provider geografico contiene anche dettagli tecnici di parsing (`driver`, `mode`, `format`, `url/path`).
Questo limita la manutenibilità quando una stessa sorgente può cambiare formato o quando vogliamo introdurre parser configurabili da backoffice.

## Obiettivo
Separare:
- `Provider`: chi fornisce il dato
- `Driver`: come leggere e mappare il dato

## Modello proposto
### 1. Driver catalog
Nuova anagrafica `geography_drivers` con campi tipo:
- `code`
- `name`
- `source_type` (`file`, `http`, `api`)
- `supported_formats` (`csv`, `xlsx`, `json`, `xml`)
- `parser_strategy` (`csv_column_map`, `xlsx_sheet_map`, `json_path_map`, `api_adapter`)
- `config_schema_json`
- `is_system`
- `is_active`

### 2. Provider
`geography_providers` diventa anagrafica sorgente:
- `code`
- `name`
- `type`
- `driver_id`
- `mode`
- `source_url`
- `source_path`
- `auth_type`
- `auth_config_json`
- `priority`
- `is_active`
- `notes`

### 3. Mapping configurabile
Nuova tabella `geography_driver_mappings` o campo JSON versionato, per definire:
- presenza header sì/no
- delimitatore CSV
- sheet name per XLSX
- colonna sorgente -> campo canonico
- regole normalizzazione
- anteprima righe

Campi canonici minimi da mappare:
- `country_iso_code`
- `region_code`
- `region_name`
- `province_code`
- `province_name`
- `vehicle_code`
- `city_istat_code`
- `city_name`
- `cadastre_code`
- `postal_code`

## Flusso UX suggerito
1. L'utente crea o modifica un `Driver`
2. Sceglie `tipo sorgente` e `formato`
3. Carica un file di test o indica URL remoto
4. Il backend legge anteprima righe/colonne
5. L'utente conferma mapping colonna -> campo canonico
6. Il sistema salva il mapping e valida i campi minimi richiesti
7. Il `Provider` usa quel driver per importare i dati

## Vantaggi
- niente driver testuali liberi scritti a mano
- supporto reale a CSV / XLSX / JSON / API
- onboarding semplice di nuovi dataset esteri
- riduzione errori parser hardcoded
- piena tracciabilità del mapping usato per ogni import

## Limiti / decisioni da prendere
- fase 1: solo `csv`, `xlsx`, `json`
- fase 2: `api` con autenticazione
- decidere se il mapping resta JSON o tabelle relazionali
- decidere se un driver è riusabile da più provider o clonato per provider

## Mia raccomandazione
Implementare in 3 step:
1. anagrafica `Driver` solo lettura + select obbligatoria nei provider
2. supporto `csv/json/xlsx` con preview e column mapping
3. wizard completo di test import e validazione dataset

## Dataset candidati
- ISTAT CSV/XLSX Italia
- comuni-json GitHub per JSON di supporto
- GeoNames / MaxMind per generico mondiale

Questa proposta non è ancora implementata: serve tua conferma prima di aprire migration, API e handoff UX dettagliato.
