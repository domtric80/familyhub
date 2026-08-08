# Feature Request — Accompagnatori uscita: struttura relazionale multi-ruolo

Data: 2026-06-28
Priorità: MEDIA — attualmente aggirato lato frontend, impatta tracciabilità e integrità dati

---

## Problema attuale

Il campo `accompanied_by` su `minor_exits` è una stringa libera (`VARCHAR`).
Con la modifica frontend del 2026-06-28 viene compilata automaticamente con i nomi
degli accompagnatori selezionati, ma rimane un campo testuale senza integrità referenziale.

Limiti concreti:

- Non è possibile avere più accompagnatori su una stessa uscita in modo strutturato
- Non è possibile distinguere il **ruolo** dell'accompagnatore (educatore, tutore, altra figura)
- Se un educatore viene rimosso dall'anagrafica, il legame con le uscite passate è perso
- Impossibile fare query su "quante uscite ha accompagnato l'educatore X" senza parsing testuale
- Tutori legali e contatti del minore non hanno FK verso la tabella `minor_contacts`

---

## Soluzione proposta

### Nuova tabella: `minor_exit_accompaniers`

```sql
CREATE TABLE minor_exit_accompaniers (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    exit_id         BIGINT UNSIGNED NOT NULL,
    person_type     ENUM('staff_member', 'minor_contact', 'external') NOT NULL,
    staff_member_id BIGINT UNSIGNED NULL,     -- FK se person_type = 'staff_member'
    minor_contact_id BIGINT UNSIGNED NULL,    -- FK se person_type = 'minor_contact'
    external_name   VARCHAR(255) NULL,        -- solo se person_type = 'external'
    notes           TEXT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_exit_acc_exit    FOREIGN KEY (exit_id)          REFERENCES minor_exits(id) ON DELETE CASCADE,
    CONSTRAINT fk_exit_acc_staff   FOREIGN KEY (staff_member_id)  REFERENCES staff_members(id) ON DELETE SET NULL,
    CONSTRAINT fk_exit_acc_contact FOREIGN KEY (minor_contact_id) REFERENCES minor_contacts(id) ON DELETE SET NULL,

    INDEX idx_exit_id (exit_id),
    INDEX idx_staff_member_id (staff_member_id),
    INDEX idx_minor_contact_id (minor_contact_id)
);
```

### Modifiche a `minor_exits`

- Il campo `accompanied_by` può rimanere come campo legacy/denormalizzato per compatibilità
  backward, oppure essere rimosso in una migrazione successiva.
- Aggiungere relazione `HasMany` in `MinorExit` model → `MinorExitAccompaniers`

### Endpoint API

```
GET    /api/minor-exits/{id}/accompaniers        → lista accompagnatori
POST   /api/minor-exits/{id}/accompaniers        → aggiunge accompagnatore
DELETE /api/minor-exits/{id}/accompaniers/{acc}  → rimuove accompagnatore
```

Oppure gestire gli accompagnatori inline nel payload di create/update dell'uscita:

```json
{
  "facility_id": 1,
  "minor_id": 5,
  ...
  "accompaniers": [
    { "person_type": "staff_member",  "staff_member_id": 12 },
    { "person_type": "minor_contact", "minor_contact_id": 7 },
    { "person_type": "external",      "external_name": "Avv. Rossi Giovanni" }
  ]
}
```

---

## Impatto frontend

Il frontend è già stato aggiornato (2026-06-28) per supportare multi-accompagnatori
con selezione per tipo (Educatore / Contatto minore / Altra figura).

Attualmente il risultato viene serializzato come stringa nel campo `accompanied_by`.
Non appena il backend implementa la struttura relazionale, il frontend dovrà:

1. Leggere `accompaniers[]` dalla risposta GET `/minor-exits/{id}`
2. Inviare `accompaniers[]` nel payload POST/PUT invece di `accompanied_by` stringa
3. Rimuovere la serializzazione/deserializzazione testuale

---

## Note

- Fino all'implementazione backend, il frontend usa `accompanied_by` stringa
  con formato: `"Cognome Nome (CODICE) [Educatore]; Bianchi Maria (Tutore legale) [Tutore/Contatto]"`
- Questo garantisce leggibilità nei report anche prima della migrazione
- La migrazione dati da `accompanied_by` stringa → tabella relazionale
  dovrà essere manuale o tramite script di parsing

---

## Dipendenze

- `staff_members` table (esistente)
- `minor_contacts` table (esistente)
- `minor_exits` table (esistente)
