# Attività — Media con consenso: security design

Data: 2026-08-17

## Decisione

La galleria attività non introduce uno storage parallelo. Ogni foto o video e ogni consenso sono documenti del minore già acquisiti tramite la pipeline protetta esistente: storage S3/MinIO privato, quarantena, scansione antivirus, metadati e ABAC.

`minor_activity_media` collega una attività, un documento media dello stesso minore, un documento di consenso dello stesso minore e l'eventuale revoca.

## Regole fail-closed

1. Il media deve essere JPEG, PNG, WEBP o MP4 e avere `security_status=clean`.
2. Il consenso deve avere allegato `clean`.
3. Entrambi i documenti devono appartenere al minore dell'attività.
4. L'utente deve poter aggiornare l'attività e leggere entrambe le classificazioni ABAC.
5. Un consenso scaduto o revocato rende `can_preview=false`.
6. La API non restituisce URL, bucket o path storage.
7. Preview e download continuano a passare dagli endpoint documentali esistenti, che riapplicano RBAC, ABAC, assegnazione minore e audit.
8. La revoca è conservata e auditata; non elimina il documento né la prova del consenso.

## Privacy by default

- nessuna pubblicazione esterna;
- nessun URL firmato persistente;
- nessun accesso anonimo;
- nessun download implicito dalla galleria;
- la motivazione di revoca è cifrata a riposo.
