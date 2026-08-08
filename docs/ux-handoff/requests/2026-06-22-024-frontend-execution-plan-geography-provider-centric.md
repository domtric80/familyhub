# Richiesta UX 024 · Piano esecutivo frontend geografia provider-centric

Data: 2026-06-22

## Stato

OPEN

## Priorità

ALTA

## Ambito

Questa richiesta traduce la richiesta concettuale `023` in attività frontend concrete.

## File frontend da correggere

### Menu sidebar

- `C:\Projects\FamilyHUB\frontend\src\layout\sidebar\menuItems.ts`

### Routing

- `C:\Projects\FamilyHUB\frontend\src\App.tsx`

### API geografia

- `C:\Projects\FamilyHUB\frontend\src\services\api.ts`

### Pagine coinvolte

- `C:\Projects\FamilyHUB\frontend\src\pages\anagrafiche\ProviderGeografiaPage.tsx`
- `C:\Projects\FamilyHUB\frontend\src\pages\anagrafiche\ImportGeografiaPage.tsx`
- `C:\Projects\FamilyHUB\frontend\src\pages\anagrafiche\ScaricaGeografiaPage.tsx`
- `C:\Projects\FamilyHUB\frontend\src\pages\anagrafiche\GeografiaSyncPage.tsx`

## Obiettivo operativo

Il frontend deve mostrare un solo flusso utente normale:

- `Provider geografia`
  - tab `Provider`
  - tab `Associazioni nazioni`
  - tab `Import dati`

## Modifiche obbligatorie

### 1. Menu

Nel menu `Anagrafiche`:

#### Mantenere

- `Geografia`
- `Provider geografia`
- `Sinc. geografia`

#### Rinominare

- `Sinc. geografia` → `Sincronizzazione geografia (tecnica)`

#### Rimuovere

- `Scarico geografia`
- `Import geografia`

## 2. Routing

In `App.tsx`:

### Route da mantenere

- `/anagrafiche/geografia`
- `/anagrafiche/geografia-sync`
- `/anagrafiche/provider-geografia`

### Route da dismettere

- `/anagrafiche/scarico-geografia`
- `/anagrafiche/import-geografia`

Nota:

- se servono temporaneamente per compatibilità, reindirizzare entrambe a `/anagrafiche/provider-geografia`
- non devono più comparire nel menu

## 3. Pagina `ProviderGeografiaPage`

La pagina deve diventare hub operativo unico.

### Tab obbligatorie

1. `Provider`
2. `Associazioni nazioni`
3. `Import dati`

### Tab `Provider`

Tabella colonne minime:

- `Codice`
- `Nome`
- `Tipo`
- `Driver`
- `Modalità`
- `Formato`
- `URL / Path`
- `Priorità`
- `Attivo`
- `Livelli supportati`
- `Azioni`

### Azioni obbligatorie

- `Nuovo provider`
- `Modifica provider`
- `Apri import`
- `Apri associazioni`

### Form provider corretto

Il form attuale è insufficiente.

Campi obbligatori da esporre:

- `Codice`
- `Nome`
- `Tipo`
- `Driver`
- `Modalità sorgente`
- `Formato`
- `Path locale`
- `URL sorgente`
- `Tipo autenticazione`
- `Config autenticazione`
- `Priorità`
- `Attivo`
- `Note`

### Regola

`Config JSON` non deve essere il campo principale della sorgente.
I campi reali di configurazione devono essere espliciti.

## 4. Tab `Associazioni nazioni`

Componenti minimi:

- select `Continente`
- select `Nazione`
- tabella `Provider associati alla nazione`

Tabella colonne:

- `Provider`
- `Tipo`
- `Default`
- `Priorità`
- `Attivo`
- `Livelli supportati`
- `Azioni`

Azioni:

- `Associa provider`
- `Modifica`
- `Rimuovi`
- `Imposta default`

## 5. Tab `Import dati`

Questo sostituisce funzionalmente `Scarico geografia` e `Import geografia`.

### Flusso obbligatorio

1. selezione `Continente`
2. selezione `Nazione`
3. visualizzazione `Provider risolto`
4. visualizzazione `Livelli supportati`
5. click `Importa dati nel database`

### Dati da mostrare prima del click

- `Provider usato`
- `Driver`
- `Sorgente`
- `Formato`
- `Livelli importabili`
- `Ultimo import`

### Risultato da mostrare dopo il click

- `Provider usato`
- `Nazione importata`
- `Nazioni`
- `Regioni`
- `Province`
- `Città`
- `Warning`
- `Errore`

## 6. Stati provider da rappresentare

### `ISTAT`

Visualizzare come:

- provider paese-specifico Italia
- supporta:
  - `Nazione`
  - `Regioni`
  - `Province`
  - `Città`

### `GEONAMES`

Visualizzare come:

- provider generico fallback
- supporta attualmente:
  - `Nazione`

Non supporta:

- `Regioni`
- `Province`
- `Città`

## 7. API da usare

### Provider

- `GET /api/admin/geography-providers`
- `POST /api/admin/geography-providers`
- `PUT /api/admin/geography-providers/{provider}`
- `DELETE /api/admin/geography-providers/{provider}`

### Associazioni

- `GET /api/admin/countries/{country}/geography-providers`
- `POST /api/admin/countries/{country}/geography-providers`
- `PUT /api/admin/countries/{country}/geography-providers/{provider}`
- `DELETE /api/admin/countries/{country}/geography-providers/{provider}`

### Import

- `POST /api/admin/geography-imports`

## 8. Divieti

- Non usare più il dataset/run selector come flusso principale utente.
- Non usare più le pagine `Scarico geografia` e `Import geografia` come entrypoint normali.
- Non promettere import di città/province per provider che non lo supportano.

## 9. Deliverable richiesto al team UX/frontend

- [ ] menu corretto
- [ ] route corrette
- [ ] pagina provider trasformata in hub operativo
- [ ] rimozione pagine duplicate dal flusso principale
- [ ] form provider con campi operativi veri
- [ ] tab import con provider risolto e livelli supportati
