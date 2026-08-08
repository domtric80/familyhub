# Guida operativa - Tab Caso del minore

Data: 2026-07-06  
Area: `Minori > Dettaglio minore > Caso`

## Scopo

Il tab Caso raccoglie i riferimenti amministrativi e sanitari del minore, evitando inserimenti liberi quando il dato deve essere selezionato da anagrafica o da documenti gia presenti.

## Campi gestiti

- `Struttura di provenienza`: selezione da strutture censite
- `Autorita giudiziaria`: selezione da anagrafica enti emittenti filtrata su tribunali
- `Numero procedimento`: testo strutturato
- `Prossima udienza`: data
- `Medico di base`: selezione da professionisti censiti nella struttura
- `Pediatra`: selezione da professionisti censiti nella struttura
- `ASL di riferimento`: selezione da anagrafica enti emittenti filtrata su ASL
- `Cartella vaccinale`: selezione da documenti sanitari del minore

## Regole importanti

- la cartella vaccinale non deve mostrare documenti non sanitari
- medico di base e pediatra devono essere scelti da elenchi filtrati, non scritti a mano
- i campi ente devono usare anagrafiche coerenti, non valori testuali liberi

## Fonte dati frontend

Per popolare i menu del tab Caso usare:

- `GET /api/minors/{minor}/case-options`

Per i documenti del minore, se serve una lista dedicata, sono disponibili anche:

- `GET /api/minors/{minor}/documents?medical_only=true`
- `GET /api/minors/{minor}/documents?document_type_code=MEDICAL_REPORT`

## Nota per il team operativo

Se un menu risulta vuoto, il problema non e necessariamente il minore:

- potrebbe mancare l'anagrafica sorgente
- potrebbe mancare il professionista con qualifica corretta
- potrebbe non essere presente un documento sanitario classificato correttamente
