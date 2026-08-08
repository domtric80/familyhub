# Nota di sviluppo - Sesso biologico e identita' di genere

Data: 2026-06-23  
Priorita': ALTA - impatta il modello dati del Minore

Aggiornamento stato: 2026-07-01

---

## Contesto

Il sistema gestisce minori in carico, inclusi pre-adolescenti e adolescenti. In questo
contesto la distinzione tra **sesso biologico** e **identita' di genere** resta corretta,
rilevante e da mantenere come scelta architetturale.

I due concetti non sono sinonimi e vanno trattati come campi separati e indipendenti.

---

## Stato attuale del backend

Al **2026-07-01** la parte backend originariamente richiesta risulta **sostanzialmente implementata**:

- CRUD `biological_sexes` presente
- lookup `biological-sexes` presente
- tabella `biological_sexes` presente
- FK nullable `biological_sex_id` su `minors` presente
- request `StoreMinorRequest` / `UpdateMinorRequest` aggiornate
- modello `Minor` aggiornato con relazione `biologicalSex`

Riferimenti tecnici:

- `C:\Projects\FamilyHUB\backend\routes\api.php`
- `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\Admin\BiologicalSexController.php`
- `C:\Projects\FamilyHUB\backend\app\Http\Controllers\Api\LookupController.php`
- `C:\Projects\FamilyHUB\backend\app\Models\Minor.php`
- `C:\Projects\FamilyHUB\backend\database\migrations\2026_06_28_100000_create_biological_sexes_and_add_fk_to_minors.php`

---

## Decisione di prodotto confermata

Restano valide le seguenti regole:

1. `biological_sex_id` e `gender_identity_id` sono indipendenti
2. entrambi i campi sono nullable
3. nessuna derivazione automatica tra sesso biologico e identita' di genere
4. i valori devono provenire da anagrafiche canoniche
5. il dato e' sensibile e va trattato con attenzione lato autorizzazioni e audit

---

## Stato della nota

Questa nota non rappresenta più un TODO backend aperto.

Va trattata come:

- nota architetturale / di dominio
- riferimento per QA, UX e sviluppo futuro

---

## Azioni residue possibili

Eventuali passi futuri non bloccanti possono riguardare:

- affinamento UX dei form
- aiuti contestuali lato frontend
- revisione della visibilita' del dato in base ai permessi sensibili
