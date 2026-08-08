# Risposta UX

- `Request ID`: 2026-06-19-007
- `Stato`: DONE

## 1. Presa in carico

Richiesta recepita. Il flusso di quarantena è un cambiamento comportamentale rilevante: nessun download immediato dopo upload.

## 2. Interpretazione UX

Dopo l'upload un documento entra in stato `pending`. Solo quando `security_status = clean` il download è consentito. Gli altri stati (`infected`, `rejected`) devono essere visualizzati con badge chiari e il download bloccato. Il `423` è il codice HTTP da gestire quando il backend blocca il download per quarantena.

## 3. Pagine/componenti coinvolti

- `src/pages/minori/MinoreDetailPage.tsx` — sezione `DocumentiTab`
  - badge `security_status` per ogni documento
  - pulsante download attivo solo se `security_status === 'clean'`
  - gestione risposta `423` con messaggio "Documento in verifica sicurezza"
  - gestione `422` upload per mime type non consentito o dimensione eccessiva

## 4. Stato implementazione

**Fatto:**
- `Attachment` in `types/index.ts` ha già i campi `security_status`, `security_notes`, `scanned_at`, `quarantined_at`, `released_at`, `scanner_engine`
- `DocumentiTab` mostra badge `SecurityBadge` per ogni documento basato su `attachment.security_status`
- pulsante download disabilitato se `security_status !== 'clean'` (con null come clean per compatibilità legacy)
- gestione `423` nel download handler: messaggio "Documento in verifica sicurezza — download non disponibile"
- gestione `422` upload con dettaglio campi errore già presente

## 5. Testi UI adottati

| `security_status` | Badge / Testo UI |
|---|---|
| `pending` | 🟡 In verifica sicurezza |
| `clean` | 🟢 Verificato |
| `infected` | 🔴 Bloccato — rischio sicurezza |
| `rejected` | ⛔ Non rilasciabile |

## 6. Dubbi / blocchi

- Il `423 Locked` è restituito da `/download` oppure già da `GET /minors/{minor}/documents`? Capire se la lista documenti già include lo stato o se occorre un fetch separato.
- Dopo quanto tempo mediamente un documento passa da `pending` a `clean`? Utile per decidere se implementare polling UI o semplicemente indicare all'utente di ricaricare.

## 7. Esito

`IN_PROGRESS`

## 8. Note per verifica backend

- Confermare che `attachment.security_status` sia presente nella response di `POST /minors/{minor}/documents` e in `GET /minors/{minor}/documents`
- Confermare il codice HTTP preciso restituito da download bloccato per quarantena (`423` o altro)
- Confermare i tipi MIME e la dimensione massima consentiti per l'upload
