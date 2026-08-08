# Followup - Bug upload documenti: PortableVisibilityConverter not found

Data: 2026-06-28
Riferimento: `2026-06-23-bug-upload-flysystem-s3.md`
Severita': ALTA - blocca completamente l'upload di documenti dai minori

Aggiornamento verifica: 2026-07-01

---

## Stato

Il bug e' stato segnalato il 2026-06-23. Al 2026-06-28 risultava ancora aperto in
ambiente di test.

Al **2026-07-01** la situazione risulta invece **verificata come risolta**:

- il pacchetto `league/flysystem-aws-s3-v3` risulta presente in `composer.json`
- la configurazione `s3` / MinIO risulta valorizzata in `.env`
- il comando di smoke test storage introdotto nel backend verifica con successo:
  - scrittura
  - lettura
  - cancellazione
- la verifica reale su disk `s3` configurato verso MinIO e' passata senza errori

Il vecchio errore:

```
Class "League\Flysystem\AwsS3V3\PortableVisibilityConverter" not found
```

non risulta piu' riproducibile nell'ambiente locale Docker corrente.

## Verifiche effettuate

Stato verificato:

- [x] `league/flysystem-aws-s3-v3` presente
- [x] Configurazione MinIO verificata
- [x] Verifica operativa reale su disk `s3` eseguita con successo
- [x] Comando backend disponibile: `php artisan familyhub:storage-smoke --disk=s3`

Nota:
- l'ambiente di sviluppo attuale usa `FILESYSTEM_DISK=s3` con MinIO, non `local`

## Impatto funzionale

Ad oggi non risultano bloccate per questo bug:

- upload documenti dal profilo minore
- future funzionalita' basate su storage S3/MinIO

## Nota frontend

Il frontend non necessita modifiche. La richiesta `multipart/form-data`
viene inviata correttamente all'endpoint.

Se dovessero emergere nuovi problemi di upload, il primo controllo consigliato e':

```bash
php artisan familyhub:storage-smoke --disk=s3
```
