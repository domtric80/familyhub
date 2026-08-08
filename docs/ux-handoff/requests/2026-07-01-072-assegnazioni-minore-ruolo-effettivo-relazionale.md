# Handoff UX/API - Assegnazioni minore: ruolo effettivo relazionale

Data: 2026-07-01
Priorita': alta
Ambito: frontend / UX / API / assegnazioni minore

## 1. Obiettivo

Le assegnazioni minore non devono piu' essere lette come se contenessero un ruolo locale proprio.

Il ruolo dell'utente esiste gia' in forma relazionale nel contesto struttura (`user_facility_roles`) e il backend espone ora in risposta il ruolo effettivo derivato da quella relazione.

---

## 2. Cosa cambia nel contratto API

Le risposte delle assegnazioni minore espongono ora due campi utili al frontend:

- `effective_role_code`
- `effective_role_name`

Questi campi rappresentano il ruolo attivo dell'utente nella struttura dell'assegnazione.

---

## 3. Cosa NON deve fare il frontend

Il frontend non deve:

- chiedere o inviare un ruolo locale nell'assegnazione minore
- trattare l'assegnazione minore come una seconda RBAC
- mostrare campi legacy tecnici come `assignment_role_code` o `access_level`

Questi campi non fanno parte del contratto funzionale da usare in UI.

---

## 4. Come leggere correttamente il modello

Regola corretta:

- `role` / `user_facility_roles` = cosa l'utente puo' fare
- `minor_user_assignment` = su quale minore puo' operare

Questa separazione resta fondamentale.

---

## 5. Implicazioni UX

Nelle viste come:
- `Assegnazioni Minori`
- tab `Accesso al minore`
- vista `Minori assegnati` su utente

il ruolo mostrato deve essere preso da:
- `effective_role_name`

oppure, se serve maggior dettaglio, dalla relazione utente/struttura gia' disponibile.

---

## 6. Compatibilita'

Internamente il backend mantiene ancora campi legacy tecnici per compatibilita' con schema esistente, ma non devono essere considerati parte del modello funzionale.

Per UX/API il contratto valido e' quello relazionale.

---

## 7. QA minimo frontend

1. creare assegnazione minore senza campi ruolo custom
2. verificare che la risposta contenga `effective_role_code`
3. verificare che la risposta contenga `effective_role_name`
4. verificare che non compaiano in UI `assignment_role_code` o `access_level`
5. verificare coerenza del ruolo mostrato con il ruolo attivo dell'utente nella struttura
