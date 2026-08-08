# Bug - Upload documento: PortableVisibilityConverter not found

Data: 2026-06-23  
Severita': ALTA - bloccava completamente l'upload di documenti  
Componente: Backend / Laravel / Storage

Aggiornamento stato: 2026-07-01

---

## Stato storico

Il bug originario segnalava l'errore:

```text
Class "League\Flysystem\AwsS3V3\PortableVisibilityConverter" not found
```

in fase di upload documenti.

All'origine, le cause ipotizzate erano:

1. dipendenza Flysystem S3 assente o incompatibile
2. autoload non aggiornato
3. configurazione storage S3/MinIO incoerente

---

## Stato attuale

Al **2026-07-01** questo bug va considerato **chiuso / non più riproducibile** nell'ambiente
Docker locale corrente.

Verifiche eseguite:

- dipendenza `league/flysystem-aws-s3-v3` presente nel backend
- configurazione `FILESYSTEM_DISK=s3` e variabili MinIO valorizzate
- smoke test storage eseguito con successo sul disk reale `s3`
- nessun errore recente correlato nei log Laravel

Comando di verifica disponibile:

```bash
php artisan familyhub:storage-smoke --disk=s3
```

---

## Riferimento operativo

Per il follow-up aggiornato e la verifica di chiusura:

- `C:\Projects\FamilyHUB\docs\dev-notes\2026-06-28-bug-upload-flysystem-s3-followup.md`

---

## Nota

Questa nota viene mantenuta come traccia storica del bug originario, ma non deve più essere
considerata un bug aperto.
