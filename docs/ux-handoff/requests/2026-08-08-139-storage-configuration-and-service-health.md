# 2026-08-08-139-storage-configuration-and-service-health

## Contesto
Dopo la formalizzazione di `FamilyHub v1.0.0`, il prossimo passo amministrativo richiesto è introdurre:
1. configurazione storage documentale da interfaccia
2. pagina health servizi con stato dei componenti operativi

Questa richiesta è preventiva e serve a preparare UX in vista dell'implementazione backend `v1.1.x`.

## Obiettivo UX
Creare una nuova area `Amministrazione > Sistema` con due pagine:
- `Configurazione Storage`
- `Health Servizi`

## Pagina 1 — Configurazione Storage

### Obiettivo utente
Consentire all'amministratore di:
- vedere se il sistema usa configurazione `ENV` o `DB`
- definire configurazioni storage compatibili `S3`
- testare la connessione
- attivare una configurazione come predefinita

### Tabella elenco
Colonne minime:
- nome configurazione
- provider
- bucket
- endpoint
- regione
- path style sì/no
- stato attivo sì/no
- default sì/no
- ultimo test
- esito ultimo test
- sorgente (`ENV` / `DB`)
- azioni

### Form configurazione
Campi:
- nome configurazione
- codice
- provider (`MinIO`, `AWS S3`, `S3 compatibile`)
- bucket
- region
- endpoint
- use path style endpoint
- access key
- secret key
- prefisso opzionale
- attiva sì/no
- default sì/no

### Requisiti UX sicurezza
- access key e secret key sempre mascherate dopo il primo salvataggio
- mai mostrare in chiaro i valori persistiti
- pulsante `mostra` non previsto per segreti già salvati
- se l'utente modifica il secret, il campo deve apparire vuoto/placeholder e salvare solo il nuovo valore
- warning esplicito se la configurazione attiva sostituirà quella attuale

### Azioni riga
- modifica
- testa connessione
- attiva come predefinita
- disattiva

## Pagina 2 — Health Servizi

### Obiettivo utente
Consentire all'amministratore di capire subito se l'ecosistema tecnico è operativo.

### Widget/tabella servizi
Servizi iniziali:
- API backend
- PostgreSQL
- Redis
- Queue worker
- Scheduler
- Storage documentale attivo
- Antivirus ClamAV
- SMTP
- MinIO console solo se applicabile

### Per ogni riga mostrare
- nome servizio
- stato con pallino (`verde`, `giallo`, `rosso`, `grigio`)
- ultimo controllo
- latenza/durata
- messaggio sintetico
- dettaglio espandibile

### Azioni pagina
- aggiorna stato
- esegui check manuale

## Comportamenti UX obbligatori
- se il backend dice `source = ENV`, mostrare banner informativo: configurazione runtime letta da file ambiente
- se il backend dice `source = DB`, mostrare banner informativo: configurazione runtime amministrata da pannello
- gli errori di test storage devono essere mostrati in forma leggibile ma senza esporre segreti
- i dettagli health non devono mostrare password, token o chiavi

## Stato API atteso da UX
Questa pagina dipenderà da futuri endpoint dedicati backend. UX non deve inventare payload; attenderà il contratto finale quando il backend implementerà il modulo.

## Nota importante
La scelta sicurezza è già vincolata:
- i segreti storage saranno cifrati nel DB lato backend
- UX non deve progettare pattern che richiedano la rilettura in chiaro dei secret persistiti
