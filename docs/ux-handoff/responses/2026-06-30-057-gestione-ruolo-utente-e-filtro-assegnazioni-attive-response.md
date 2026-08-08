# Risposta UX 057 · Gestione ruolo utente e filtro assegnazioni attive

Data: 2026-06-30  
Stato: IMPLEMENTATO (con limitazioni backend documentate)

---

## 1. Sintesi interventi

| Area | Intervento | File |
|------|-----------|------|
| UtentiPage — modal crea | Rimossa selezione ruolo (troppo presto nel flusso) | `UtentiPage.tsx` |
| UtentiPage — modal modifica | Aggiunta sezione Ruolo: select pre-valorizzato + pulsante Cambia | `UtentiPage.tsx` |
| UtentiPage — lista | Mostrato solo il ruolo attivo (`is_active !== false`) | `UtentiPage.tsx` |
| ProfiloPage | Filtrati ruoli attivi nella card "Ruoli e strutture" | `ProfiloPage.tsx` |
| DashboardPage | Filtrati ruoli attivi nel riepilogo | `DashboardPage.tsx` |
| MinoreDetailPage | Ruolo dell'operatore letto dal primo record attivo | `MinoreDetailPage.tsx` |
| AuthContext | `hasRole()` ora filtra `is_active !== false` | `AuthContext.tsx` |
| Types | `FacilityRole` aggiornato con `is_active`, `valid_from`, `valid_to` | `types/index.ts` |

---

## 2. Flusso cambio ruolo (modal Modifica utente)

Il modal mostra il select "Ruolo" **sempre**, indipendentemente dallo stato delle assegnazioni.

Logica `handleAssignRole`:

1. Cerca il **primo record** in `user_facility_roles` (attivo o revocato)
2. Se esiste → `PUT /admin/user-facility-roles/{id}` con `role_id` nuovo, `is_active: true`, `valid_to: null`
   → aggiorna in place, nessun nuovo record creato
3. Se non esiste (utente mai assegnato) → `POST /admin/user-facility-roles` con `facility_id: facilities[0].id`
4. Il select è pre-valorizzato con il ruolo attivo corrente

```ts
// Esempio: cambio ruolo con UPDATE
await assignmentApi.update(anyAssignment.id, {
  user_id:     editTarget.id,
  facility_id: facilityId,
  role_id:     editRoleId,        // ← solo questo cambia
  valid_from:  anyAssignment.valid_from ?? today,
  valid_to:    null,              // riattiva se era revocato
  is_active:   true,
})
```

---

## 3. Filtraggio ruoli attivi — regola universale

In tutti i punti che mostrano ruoli utente, la regola è:

```ts
user_facility_roles.filter((fr) => fr.is_active !== false)
```

Il confronto `!== false` (non `=== true`) gestisce il caso in cui `is_active` sia `undefined`
(record legacy senza il campo) trattandolo come attivo.

---

## 4. Problema aperto: duplicazione record — richiede fix backend

### Sintomo osservato

Durante i test, chiamate multiple a "Cambia ruolo" hanno generato record duplicati
nella tabella `user_facility_roles` (stesso utente, stessa struttura, ruoli diversi o uguali).

### Causa

Il backend accetta `POST /admin/user-facility-roles` anche quando esiste già un record
attivo per la coppia `(user_id, facility_id)`. Non c'è vincolo di unicità.

### Impatto RBAC

Con due ruoli attivi sulla stessa struttura, il backend calcola `capabilities.permissions`
in modo imprevedibile. Il frontend mostra solo il primo ruolo attivo, ma il backend
potrebbe applicare permessi da entrambi o dal solo primo trovato.

### Richiesta al backend (vedi dev-note dedicata)

File: `docs/dev-notes/2026-06-30-vincolo-ruolo-unico-per-utente.md`

1. **Unique constraint** (obbligatorio):
   ```sql
   CREATE UNIQUE INDEX uq_user_facility_roles_active
     ON user_facility_roles (user_id, facility_id)
     WHERE is_active = true;
   ```

2. **`GET /auth/me`** deve restituire solo record con `is_active = true`
   in `user_facility_roles` (attualmente restituisce anche i revocati)

3. **`DELETE /admin/user-facility-roles/{id}`** per pulizia record duplicati
   (attualmente non esiste)

---

## 5. Login MFA — flow a due step

Implementato il flusso corretto:

- Step 1 (`credentials`): email + password, errore rosso solo per credenziali errate
- Step 2 (`otp`): banner blu informativo (`alert-info`), campo OTP, errore rosso solo se il codice è sbagliato
- Nessun errore rosso al passaggio da step 1 a step 2

```ts
if (needsOtp && step === 'credentials') {
  setStep('otp')   // transizione silenziosa, nessun errore
} else if (step === 'otp' && (needsOtp || ae.status === 422)) {
  setError('Codice non valido o scaduto. Riprova.')
}
```

---

## 6. Tab Uscite e Attività in MinoreDetailPage

Aggiunti due tab "Uscite" e "Attività" nella scheda minore che mostrano solo
i record relativi al minore corrente (filtro per `minor_id`).

- Entrambi i tab sono read-only (la modifica avviene nelle pagine dedicate)
- Gestione 404 neutro se il backend non ha ancora dati
- Colonne: Tipo / Destinazione o Titolo / Date / Stato

---

## 7. Messaggi 403 contestuali

Aggiornati in `UscitePage` e `AttivitaPage`:

```ts
const msg = err.status === 403
  ? 'Operazione non consentita: verifica permessi di ruolo e assegnazione attiva al minore.'
  : (err.message ?? 'Errore salvataggio')
```

---

## 8. Note QA

- Per testare il cambio ruolo: usare un utente con una sola assegnazione attiva
- Non usare `admin@familyhub.local` (SUPER_ADMIN bypassa tutti i check)
- Verificare che dopo cambio ruolo il token venga ricaricato (`GET /auth/me`) per
  aggiornare `capabilities` — se il frontend non ricarica la pagina o non chiama
  `refresh()`, i permessi visibili potrebbero restare quelli vecchi fino al prossimo login
- Il campo "Ruolo" nel modal mostra "— Seleziona ruolo —" se `lookupsApi.roles()`
  fallisce al caricamento: verificare che `GET /lookups/roles` sia accessibile senza
  permessi speciali
