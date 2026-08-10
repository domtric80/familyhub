# Handoff UX/API — fix lista nazioni + chiarimento import GeoNames Francia

Data: 2026-08-10  
Destinatario: UX / Frontend  
Ambito: `Provider Geografia`, `Anagrafiche > Geografia`

## Stato backend

È stato corretto il backend di `GET /api/admin/countries`.

### Problema risolto
- Dopo gli import GeoNames massivi, l'endpoint lista nazioni andava in `HTTP 500`
- causa: eager loading completo di `regions.provinces.cities` sulla lista paesi
- effetto: dropdown nazioni vuoti o pagina Geografia bloccata

### Comportamento corretto atteso ora
- `GET /api/admin/countries` restituisce **solo la lista piatta delle nazioni**
- regioni / province / città vanno sempre caricate con chiamate progressive dedicate

## Chiarimento funzionale importante

Ci sono **due flussi distinti**:

### 1. Import nazioni del mondo
Usa il provider globale GeoNames configurato su:
- `countryInfo.txt`

Endpoint:
- `POST /api/admin/geography-providers/{provider}/import-countries`

Uso UI:
- pulsante “globo / importa nazioni del mondo” sul provider globale GeoNames

### 2. Import gerarchia geografica di una singola nazione
Usa:
- provider paese-specifico associato alla nazione, oppure
- provider forzato aperto dal tab Provider → “Apri import”

Endpoint:
- `POST /api/admin/geography-imports`

Payload esempio:
```json
{
  "country_id": 77,
  "provider_id": 3
}
```

## Verifica backend eseguita

Verifica reale su database attuale:
- provider `GEO_FR`
- nazione `FR / France`
- import completato con successo

Esito:
- `regions`: 13
- `provinces`: 109
- `cities`: 81598

Quindi:
- il flusso GeoNames Francia lato backend è operativo
- se la UI non mostra la nazione o non consente il lancio, il primo punto da verificare è il caricamento della lista paesi e lo stato del provider selezionato

## Cosa deve fare UX

- trattare `adminCountryApi.list()` come **lista piatta**
- non aspettarsi più il campo `regions` dentro ogni country
- lasciare separati e ben etichettati i due flussi:
  - `Importa nazioni`
  - `Importa dati geografici della nazione`

## Messaggio UX consigliato

Sul provider globale GeoNames:
- “Importa tutte le nazioni del mondo”

Sul tab Import dati:
- “Importa regioni, province e città della nazione selezionata usando il provider risolto o quello forzato”

