# Sicurezza - Cifratura note riservate e messaggistica interna

Data: 2026-07-06  
Ambito: dati a riposo, dati in transito, gestione chiavi, Vault

## 1. Obiettivo

Proteggere note riservate e messaggi interni contro:

- furto del database
- furto di backup o snapshot
- accessi tecnici non autorizzati ai dati persistiti

La cifratura non sostituisce RBAC/ABAC.  
Serve a proteggere il contenuto quando il dato lascia il perimetro logico dell’applicazione.

## 2. Decisione tecnica

Si adotta un modello di `envelope encryption`.

### 2.1 Come funziona

Per ogni record sensibile:

1. si genera una chiave simmetrica casuale di contenuto
2. il contenuto viene cifrato con questa chiave
3. la chiave di contenuto viene cifrata con una chiave master
4. nel database si salvano:
   - ciphertext del contenuto
   - chiave di contenuto cifrata
   - metadata di algoritmo / key version

## 3. Perché non usare solo asimmetrica pura

L’asimmetrica pura non è la scelta migliore per payload testuali arbitrari e frequenti.

Il modello corretto è:

- cifratura simmetrica per il payload
- protezione della chiave simmetrica tramite chiave master

## 4. Dev, staging, produzione

### 4.1 Locale / sviluppo

Accettabile:

- chiave master in secret runtime Docker / variabile ambiente protetta fuori repository

Non accettabile:

- chiavi hardcoded
- chiavi versionate nel repository

### 4.2 Produzione

Scelta raccomandata:

- HashiCorp Vault

Uso consigliato:

- Vault Transit Engine oppure gestione chiavi centralizzata equivalente

## 5. Dove non salvare la chiave privata/master

Non salvare la chiave:

- nel database applicativo
- in file sotto repository
- in immagini Docker
- in volumi condivisi non protetti

## 6. Astratto applicativo da introdurre

Il backend deve dipendere da una astrazione:

- `KeyProvider`

Implementazioni previste:

- `EnvKeyProvider` per locale/dev
- `VaultKeyProvider` per staging/produzione

## 7. Requisiti minimi dei record cifrati

Ogni record sensibile dovrebbe poter esporre internamente:

- `ciphertext`
- `encrypted_data_key`
- `encryption_key_version`
- `encryption_algorithm`
- `encrypted_at`

## 8. Cifratura in transito

Obbligatoria:

- HTTPS/TLS tra browser e reverse proxy
- TLS tra componenti se separati per rete/host

## 9. Cosa vede il backend

Il backend applicativo decifra solo dopo che:

1. ha verificato permesso modulo
2. ha verificato classificazione
3. ha verificato contesto minore/struttura

Questo minimizza il rischio di decifrare dati per richieste non autorizzate.

## 10. Rotazione chiavi

La soluzione deve supportare:

- versione chiave master
- rotazione progressiva
- re-encryption differita dei record

## 11. Raccomandazione finale

Per FamilyHub:

- sviluppo iniziale: envelope encryption con provider locale a secret runtime
- hardening produzione: Vault come sorgente/autorizzatore delle chiavi

Questa è la soluzione più equilibrata tra sicurezza, manutenibilità e complessità.
