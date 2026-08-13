# Guida sezione Policy documentale ABAC

Data: 2026-08-13

## Scopo

La sezione `Policy documentale ABAC` serve a governare **chi puo vedere cosa** nei contenuti sensibili del sistema.

Questa sezione non sostituisce i permessi modulo. Li completa.

Il modello corretto e:

- `RBAC` = accesso alla funzione
- `ABAC` = accesso effettivo al contenuto classificato

## Regola fondamentale

Un utente puo accedere a un documento o a una nota solo se supera **tutti** i controlli necessari:

1. permesso RBAC della funzione
2. policy ABAC della classificazione
3. eventuale assegnazione attiva al minore

Se uno di questi livelli fallisce, l'accesso viene negato.

## Classificazioni attuali

Le classificazioni attualmente previste sono:

- `internal`
- `restricted`
- `clinical`
- `judicial`

Ogni classificazione puo avere regole diverse per:

- lettura / preview
- download

## Azioni da distinguere sempre

La UI e il backend devono trattare come azioni distinte:

- `preview`
- `read`
- `download`
- `upload`
- `update metadata`
- `delete`

In particolare:

- leggere o visualizzare non significa automaticamente poter scaricare
- poter scaricare non puo esistere senza lettura della stessa classificazione

## Ruoli privilegiati e ruoli standard

Esistono ruoli privilegiati che bypassano l'assegnazione attiva al minore per l'accesso documentale:

- `SUPER_ADMIN`
- `DIRETTORE`
- `COORDINATORE`

Tutti gli altri ruoli seguono la regola ordinaria:

- classificazione ammessa
- permesso RBAC corretto
- assegnazione attiva al minore, se il contenuto riguarda un minore

## Cosa puo fare l'amministratore nella sezione

L'amministratore puo:

- vedere la matrice generale ruolo -> classificazione -> azione
- aprire la policy documentale di un singolo ruolo
- assegnare classificazioni leggibili a un ruolo
- assegnare classificazioni scaricabili a un ruolo
- verificare se il ruolo ha bypass assegnazione minore
- verificare il comportamento `deny by default` sulle nuove classificazioni

## Regola deny by default

Una classificazione nuova resta:

- negata in lettura
- negata in download

finche la policy non viene configurata esplicitamente.

Questa regola evita aperture accidentali su nuovi contenuti sensibili.

## Differenza tra matrice e policy ruolo

### Matrice accesso documenti

Serve per avere una vista globale.

Mostra:

- tutti i ruoli
- tutte le classificazioni
- stato lettura
- stato download
- regola assegnazione
- eventuale bypass del ruolo

### Policy documentale del ruolo

Serve per configurare il singolo ruolo.

Mostra:

- permessi RBAC base del ruolo
- classificazioni leggibili
- classificazioni scaricabili
- regola assegnazione applicata al ruolo

## Estensione del modello ABAC

Le stesse classificazioni vengono riusate anche per:

- documenti del minore
- note classificate del minore
- documenti staff
- thread di messaggistica interna classificata

Questo e importante: il sistema non deve inventare policy parallele separate per ogni modulo sensibile.

## Cosa non deve fare l'operatore amministrativo

Non deve:

- dedurre a mano i bypass
- assumere che `read = download`
- modificare i ruoli senza capire la classificazione
- dare per scontato che una nuova classificazione sia gia aperta

## Esempi pratici

### Educatore

Caso tipico:

- puo leggere `internal`
- puo essere negato sul download se manca `attachments.download`
- per i documenti del minore richiede assegnazione attiva

### Psicologo

Caso tipico:

- puo leggere `clinical`
- puo scaricare `clinical` solo se la policy lo consente
- per documenti e note del minore richiede assegnazione attiva, salvo ruolo privilegiato

### Coordinatore

Caso tipico:

- puo avere bypass assegnazione minore
- non vede automaticamente tutto: la classificazione deve comunque ammetterlo

## Relazione con audit e sicurezza

Le operazioni documentali rilevanti devono restare auditabili, in particolare:

- preview
- download
- modifica policy ruolo
- modifica classificazioni

La trasparenza della policy ABAC serve anche a spiegare perche un accesso e stato consentito o negato.

## Riferimenti

- `C:\Projects\FamilyHUB\docs\operations\2026-06-30-guida-sezione-documenti.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-168-abac-document-policy-clarity-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-175-abac-master-handoff.md`
- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`
