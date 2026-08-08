# FamilyHUB — Checklist test di rilascio

Da eseguire su ambiente di staging prima di ogni rilascio in produzione.
Usa un account di test con ruolo **super_admin** salvo dove indicato diversamente.

---

## 1. Autenticazione

- [ ] Login con credenziali corrette → reindirizza a Dashboard
- [ ] Login con password errata → messaggio di errore, nessun accesso
- [ ] Login con account disattivato → errore chiaro
- [ ] MFA obbligatorio: se l'account ha MFA attivo, compare la schermata codice TOTP
- [ ] Codice TOTP corretto → accesso
- [ ] Codice TOTP errato → errore, nessun accesso
- [ ] Logout → reindirizza a Login, sessione invalidata (F5 non riporta alla dashboard)

---

## 2. Dashboard

- [ ] Carica senza errori
- [ ] I widget mostrano dati reali (non placeholder)
- [ ] Menu laterale visibile e completo

---

## 3. Menu e navigazione

- [ ] Sezioni collassabili: clicca ogni titolo di sezione (PRINCIPALE, MINORI, ecc.) → si collassa/espande
- [ ] Sottomenu **Localizzazione** espandibile: voci Geografia, Sync, Provider visibili
- [ ] Sottomenu **Documenti** espandibile: voci Tipo, Classificazione, Scope visibili
- [ ] Sottomenu **Minore** (Impostazioni) espandibile: voci Stati, Generi, Sesso visibili
- [ ] Voce attiva evidenziata nel menu al cambio pagina
- [ ] Logo in alto a sinistra → clic porta a Dashboard

---

## 4. Modulo Minori

### Lista
- [ ] Tabella minori si carica
- [ ] Paginazione funzionante (se presente)
- [ ] Link "Dettaglio" apre la pagina corretta

### Creazione
- [ ] Apri **Nuovo minore**
- [ ] Compila: nome, cognome, data di nascita, codice fiscale
- [ ] Seleziona **Sesso biologico** (campo separato)
- [ ] Seleziona **Identità di genere** (campo separato)
- [ ] Verifica che i due campi siano indipendenti (cambiare uno non cambia l'altro)
- [ ] Salva → minore creato, toast di conferma
- [ ] Verifica che entrambi i valori siano visibili nel dettaglio

### Dettaglio
- [ ] Tab **Anagrafica**: mostra `Sesso biologico` e `Genere` come righe distinte
- [ ] Se uno dei due è vuoto → cella vuota, nessun errore
- [ ] Tab **Contatti**: lista contatti visibile
- [ ] Tab **Documenti**: lista documenti visibile

### Modifica
- [ ] Apri modifica di un minore esistente
- [ ] I campi `Sesso biologico` e `Identità di genere` sono precompilati con i valori salvati
- [ ] Modifica un valore e salva → aggiornato correttamente

### Caricamento documento
- [ ] Nella tab Documenti di un minore: carica un file PDF
- [ ] Upload completato senza errori (se si riceve errore Flysystem/S3 → bug noto, segnalare)
- [ ] Documento visibile in lista dopo upload

---

## 5. Amministrazione

### Organizzazioni
- [ ] Lista organizzazioni si carica
- [ ] Crea nuova organizzazione → salvata
- [ ] Modifica → aggiornata
- [ ] Elimina (se nessun minore collegato) → rimossa

### Strutture
- [ ] Lista strutture si carica
- [ ] Crea nuova struttura con geografia a cascata:
  - Seleziona Nazione → Regione si popola
  - Seleziona Regione → Provincia si popola
  - Seleziona Provincia → Città si popola
- [ ] Salva → struttura creata
- [ ] Apri modifica struttura esistente → i 4 select geografici mostrano i valori salvati
- [ ] Cambia Nazione → Regione/Provincia/Città si resettano

### Utenti
- [ ] Lista utenti si carica
- [ ] Crea utente → salvato
- [ ] Modifica ruolo → aggiornato
- [ ] Disattiva utente → stato cambia
- [ ] Reset MFA (se presente il pulsante) → operazione confermata

### Assegnazioni
- [ ] Lista assegnazioni si carica
- [ ] Crea assegnazione educatore ↔ minore
- [ ] Revoca assegnazione

---

## 6. Impostazioni — Localizzazione

### Geografia
- [ ] Pagina si carica senza tab separati (vista progressiva unica)
- [ ] Select Nazione → popola lista regioni nella tabella
- [ ] Select Regione → popola lista province
- [ ] Select Provincia → popola lista città
- [ ] Selezione città → pannello dettaglio con mappa OSM visibile
- [ ] CRUD: aggiungi/modifica/elimina a ogni livello

### Sync (Sincronizzazione tecnica)
- [ ] Pagina visibile solo per utenti con permesso `geography_sync.read`
- [ ] Console di sincronizzazione si carica

### Provider
- [ ] Pagina visibile solo per utenti con permesso `geography_providers.read`
- [ ] Tab Provider: lista provider geografici
- [ ] Tab Mappature: lista mappature per paese
- [ ] Tab Import: selezione provider e avvio import

---

## 7. Impostazioni — Documenti

### Tipo documento
- [ ] Lista tipi si carica
- [ ] Crea/modifica/elimina

### Classificazione
- [ ] Lista classificazioni si carica
- [ ] Crea/modifica/elimina

### Scope documento
- [ ] Lista scope si carica
- [ ] Crea/modifica/elimina

---

## 8. Impostazioni — Minore

### Stati minore
- [ ] Lista stati si carica
- [ ] Crea/modifica/elimina

### Generi (identità di genere)
- [ ] Lista generi si carica
- [ ] Crea nuovo: codice `NB`, nome `Non binario` → salvato
- [ ] Modifica/elimina

### Sesso biologico
- [ ] Lista valori si carica
- [ ] Crea: codice `M`, nome `Maschio` → salvato
- [ ] Crea: codice `F`, nome `Femmina` → salvato
- [ ] Crea: codice `I`, nome `Intersex` → salvato
- [ ] Crea: codice `NS`, nome `Non specificato` → salvato
- [ ] Banner informativo "distinto da identità di genere" visibile nella pagina

---

## 9. Impostazioni — Ruoli e permessi

- [ ] Lista ruoli si carica
- [ ] Matrice permessi visibile e modificabile
- [ ] Salva permessi → aggiornati

---

## 10. Sicurezza

### Profilo utente
- [ ] Dati profilo visibili
- [ ] Modifica nome/email → salvato

### Configurazione MFA
- [ ] Pagina si carica
- [ ] QR code generato se MFA non attivo
- [ ] Attivazione MFA con app TOTP funzionante
- [ ] Codici di recupero visualizzati/rigenerabili

---

## 11. Permessi e accesso negato

- [ ] Accedi come utente con ruolo **educatore** (non super_admin)
- [ ] Voci di menu con permessi specifici (Sync, Provider) non visibili
- [ ] Accesso diretto all'URL `/anagrafiche/geografia-sync` → redirect o 403

---

## 12. Comportamento generale

- [ ] Nessuna console browser con errori rossi durante la navigazione normale
- [ ] Nessuna pagina bianca inaspettata
- [ ] Toast di conferma/errore compaiono dopo ogni operazione CRUD
- [ ] F5 su qualsiasi pagina → pagina si ricarica correttamente (non 404)
- [ ] Sidebar collassabile: click su icona toggle → menu si collassa/espande

---

## Note post-test

Dopo ogni sessione di test annota qui eventuali anomalie con:
- URL pagina
- Azione eseguita
- Errore/comportamento osservato
- Browser e versione

