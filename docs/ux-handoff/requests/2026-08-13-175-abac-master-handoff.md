# UX Handoff 175 - ABAC documenti e note: master handoff finale

Data: 2026-08-13
Ambito: `Ruoli`, `Matrice accesso documenti`, `Documenti minore`, `Note classificate`, `Messaggistica interna`
Priorita: Alta

## Stato backend

Backend ABAC pronto per il perimetro attuale.

Questo documento chiude il blocco `ABAC documenti / note` lato backend e serve come riferimento unico per UX.

---

## 1. Obiettivo del blocco ABAC

Rendere leggibile e amministrabile da interfaccia la regola:

- chi puo vedere
- chi puo leggere
- chi puo scaricare
- chi puo caricare
- chi puo vedere contenuti clinici o giudiziari

senza lasciare logiche nascoste nel frontend.

---

## 2. Modello corretto da rappresentare in UI

La UI deve mostrare sempre tre livelli distinti:

1. `RBAC`
   - accesso alla funzione o all'endpoint
2. `ABAC`
   - classificazione consentita o negata
3. `Regola assegnazione minore`
   - assegnazione attiva richiesta
   - oppure bypass per ruolo privilegiato

Se questi tre livelli vengono fusi in un solo concetto generico di "permesso documenti", l'utente non capisce piu il comportamento reale.

---

## 3. Sezioni UX coinvolte

### A. `Admin > Matrice accesso documenti`

Documento principale:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-168-abac-document-policy-clarity-contract.md`

Endpoint:

- `GET /api/admin/document-access-matrix`

Questa pagina serve per:

- vista globale di ruoli e classificazioni
- capire i bypass
- capire la differenza lettura vs download

### B. `Admin > Ruoli > Policy documentale`

Documenti principali:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-05-121-document-access-matrix-ui-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-06-123-ruolo-document-policy-editor.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-13-168-abac-document-policy-clarity-contract.md`

Endpoint:

- `GET /api/admin/roles/{role}/document-policy`
- `PUT /api/admin/roles/{role}/document-policy`

Questa pagina serve per:

- configurare classificazioni leggibili
- configurare classificazioni scaricabili
- capire se il ruolo e privilegiato

### C. `Documenti minore`

Documenti principali:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-06-19-005-document-visibility-rules.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-08-144-document-preview-vs-download-rbac-abac-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-09-148-document-policy-read-vs-download-contract.md`

Punti chiave:

- preview e download separati
- controllo combinato RBAC + ABAC
- possibile requisito assegnazione minore

### D. `Note classificate minore`

Documenti principali:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-06-125-note-riservate-e-messaggistica-classificata.md`

Punti chiave:

- le note usano la stessa classificazione documentale
- non esiste una policy parallela separata per le note

### E. `Messaggistica interna classificata`

Documento principale:

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-08-09-157-messaging-classification-abac-contract.md`

Punti chiave:

- i thread hanno `classification_code`
- il backend filtra i partecipanti in base alla classificazione
- la visibilita dei thread sensibili segue la stessa logica ABAC

---

## 4. Endpoint principali da usare

### Lookups e classificazioni

- `GET /api/lookups/document-classifications`
- `GET /api/admin/document-classifications`
- `POST /api/admin/document-classifications`
- `GET /api/admin/document-classifications/{document_classification}`
- `PUT /api/admin/document-classifications/{document_classification}`
- `DELETE /api/admin/document-classifications/{document_classification}`

### Policy amministrativa ABAC

- `GET /api/admin/document-access-matrix`
- `GET /api/admin/roles/{role}/document-policy`
- `PUT /api/admin/roles/{role}/document-policy`

### Documenti minore

- endpoint documentali del minore gia documentati in OpenAPI
- preview e download da trattare come azioni separate

### Note minore

- `GET /api/minors/{minor}/notes`
- `POST /api/minors/{minor}/notes`
- `PUT /api/minors/{minor}/notes/{note}`
- `DELETE /api/minors/{minor}/notes/{note}`

### Messaggistica interna

- `GET /api/internal-messages/threads`
- `POST /api/internal-messages/threads`
- `GET /api/internal-messages/options/participants`

Specifica sorgente:

- `C:\Projects\FamilyHUB\docs\api\openapi.yaml`

---

## 5. Regole UX obbligatorie

### A. Nessuna lista hardcoded di ruoli privilegiati

UX deve leggere i bypass dai payload backend.

### B. Nessuna deduzione locale `read = download`

Lettura e download sono distinti.

### C. Nuove classificazioni = negate di default

La UI deve esplicitare la policy `deny by default`.

### D. Nessuna policy parallela per note e messaggi

Note classificate e thread classificati seguono la stessa tassonomia documentale.

### E. Nessuna logica locale su assegnazione minore

La regola deve arrivare serializzata dal backend.

---

## 6. Checklist finale per UX

- [ ] Pagina matrice accesso documenti basata su `GET /api/admin/document-access-matrix`
- [ ] Pagina policy ruolo documentale basata su `GET/PUT /api/admin/roles/{role}/document-policy`
- [ ] Evidenza grafica di:
  - lettura
  - download
  - bypass assegnazione
  - assegnazione attiva richiesta
- [ ] Messaggio esplicito sulle nuove classificazioni negate di default
- [ ] Documenti minore: preview e download come azioni separate
- [ ] Note minore: select classificazione coerente con document classifications
- [ ] Messaggistica interna: badge classificazione + filtro partecipanti per classificazione

---

## 7. Stato finale del blocco

Con questo handoff il blocco `ABAC documenti / note` puo essere considerato chiuso lato backend per il perimetro attuale.

Questo significa che il prossimo sviluppo puo concentrarsi sul `Modulo Minori`, mantenendo come base:

- policy documentale amministrabile
- lettura/download separati
- note classificate allineate alla stessa matrice
- messaggistica sensibile coerente con ABAC
