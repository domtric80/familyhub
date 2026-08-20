# Guida operativa — Media attività con consenso

## A cosa serve

La sezione collega foto e video a una attività del minore mantenendo separati il contenuto e la prova del consenso. I file restano nel documentale protetto e non vengono copiati in una galleria pubblica.

## Procedura

1. Caricare nella sezione Documenti del minore il media e il documento di consenso.
2. Attendere che entrambi risultino verificati dal controllo di sicurezza.
3. Aprire l'attività e scegliere `Aggiungi media`.
4. Selezionare media, consenso ed eventuale data di acquisizione.
5. Verificare lo stato del consenso prima di aprire l'anteprima.

## Stati

- `Valido`: consenso non scaduto e non revocato.
- `Scaduto`: la data di scadenza del documento di consenso è superata.
- `Revocato`: un operatore autorizzato ha registrato la revoca.

## Revoca

La revoca richiede una motivazione. Il sistema cifra la motivazione, disabilita la fruizione dalla galleria e conserva il collegamento per audit. Non vengono cancellati automaticamente né il media né il documento di consenso.

## Sicurezza

- nessun link diretto a S3/MinIO;
- preview tramite API autenticata;
- controllo RBAC, assegnazione al minore e ABAC documentale;
- file ammessi: JPEG, PNG, WEBP e MP4;
- file utilizzabili solo dopo scansione con esito `clean`;
- collegamento e revoca registrati in audit e storico minore.
