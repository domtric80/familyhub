# Handoff UX/API - Aggiornamento audit accompagnatori uscita

Data: 2026-07-01
Priorita': media-alta
Ambito: frontend / UX / audit / modulo Uscite

## 1. Obiettivo

Il backend produce ora un audit piu' parlante per la creazione e l'aggiornamento delle uscite quando sono presenti accompagnatori relazionali.

Questo migliora la leggibilita' sia lato Audit Log sia lato storico del minore.

---

## 2. Cosa e' cambiato

Per gli eventi di create/update uscita il backend registra ora summary umani che includono gli accompagnatori in forma leggibile.

### Esempio create

```text
Mario Rossi ha creato l'uscita #55 del minore Luca Bianchi verso Controllo clinico. Accompagnatori: Paolo Interno [staff], Marta Tutrice [contatto minore].
```

### Esempio update

```text
Mario Rossi ha aggiornato l'uscita #55 del minore Luca Bianchi. Accompagnatori prima: Paolo Interno [staff], Marta Tutrice [contatto minore]. Accompagnatori dopo: Avv. Viola [esterno].
```

---

## 3. Dove si riflette

### 3.1 Audit Log

Nei record audit di tipo `minor_exit` il campo `operation_summary` e' ora molto piu' leggibile.

### 3.2 Storico minore

Anche gli eventi storici del minore relativi all'uscita includono metadata piu' ricchi sugli accompagnatori.

---

## 4. Metadata disponibili

Negli eventi create/update uscita sono disponibili payload utili, ad esempio:

- `accompaniers`
- `accompaniers_before`
- `accompaniers_after`

Ogni elemento puo' contenere:

- `person_type`
- `display_name`
- `staff_member_id`
- `minor_contact_id`
- `external_name`
- `notes`

---

## 5. Implicazioni UX

Il frontend puo' ora mostrare audit e storico con testi leggibili senza dover ricostruire lato client i nomi degli accompagnatori a partire da ID grezzi.

Questo vale soprattutto per:
- timeline minore
- pagina Audit Log admin
- drawer dettaglio evento audit

---

## 6. Suggerimento UX

Nelle viste di dettaglio audit/storico, se sono presenti i metadata accompagnatori, e' utile mostrare:

- etichetta tipo (`staff`, `contatto minore`, `esterno`)
- nome leggibile
- confronto prima/dopo nei casi di update

---

## 7. QA minimo frontend

1. creare uscita con accompagnatori multipli
2. verificare summary parlante in audit
3. aggiornare accompagnatori
4. verificare presenza di `prima` / `dopo` nel dettaglio evento
5. verificare che non serva piu' ricostruzione client-side da soli ID
