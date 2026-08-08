# Handoff UX/API - Guida contestuale sezione Documenti

Data: 2026-06-30
Priorita': alta
Ambito: frontend / UX / help contestuale / accessi documentali

## 1. Obiettivo

Realizzare la guida contestuale della sezione `Documenti`, con enfasi sulla differenza tra autorizzazione RBAC e controllo ABAC documentale.

Questa e' una delle sezioni piu' delicate dell'applicativo: il rischio maggiore e' che l'utente pensi che il ruolo o la visibilita' del minore bastino per vedere tutto.

Non e' cosi'.

---

## 2. Fonte contenuto

Frontend puo' usare come base:

- `C:\Projects\FamilyHUB\docs\operations\2026-06-30-guida-sezione-documenti.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-29-050-document-preview-audit-and-admin-audit-page-detail-response.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-29-052-staff-document-audit-and-security-kpis-response.md`

---

## 3. Concetto da spiegare chiaramente in UI

### 3.1 Messaggio chiave

Testo suggerito:

> L'accesso ai documenti segue regole piu' restrittive rispetto alla semplice visibilita' delle anagrafiche. Un utente puo' vedere un minore ma non poter consultare tutti i suoi documenti.

### 3.2 Distinzione da mostrare

La guida deve spiegare due livelli:

- `RBAC`: cosa il ruolo puo' fare in generale
- `ABAC`: quali documenti puo' realmente vedere o scaricare in base a tag, classificazioni e contesto

---

## 4. Contenuti minimi da mostrare nella guida

### 4.1 A cosa serve la sezione

> La sezione Documenti consente di consultare, classificare, visualizzare e scaricare documenti applicativi, nel rispetto delle regole di sicurezza e tracciabilita'.

### 4.2 Che cosa significa ABAC

> Alcuni documenti seguono regole di accesso basate sui loro attributi, ad esempio tag e classificazioni. Per questo motivo documenti diversi possono avere visibilita' diversa anche per lo stesso utente.

### 4.3 Preview vs download

> La sola anteprima di un documento e il download del file sono operazioni distinte e vengono entrambe tracciate.

### 4.4 Audit

> Ogni accesso documentale sensibile puo' essere registrato per finalita' di sicurezza, controllo e conformita'.

---

## 5. Pattern UI consigliato

### 5.1 Posizione del pulsante

Inserire `Informazioni` nell'header della pagina `Documenti`.

### 5.2 Formato consigliato

Preferibile:
- drawer laterale ampio

Alternativa:
- modal ampia

### 5.3 Blocchi contenuto consigliati

1. `A cosa serve`
2. `Come funziona l'accesso`
3. `RBAC e ABAC`
4. `Preview e download`
5. `Audit e tracciabilita'`
6. `Errori frequenti`

---

## 6. Microcopy utili

### 6.1 Box info in lista o dettaglio documento

Testo suggerito:

> La disponibilita' di un documento dipende sia dai permessi del ruolo sia dalle regole di sicurezza documentale applicate al file.

### 6.2 Nota in prossimita' di preview/download

> Preview e download sono operazioni distinte e possono essere soggette a controlli diversi.

### 6.3 Nota su audit

> Gli accessi documentali sensibili sono tracciati per finalita' di sicurezza.

---

## 7. Cose da non semplificare in UI

UX non deve comunicare concetti del tipo:
- "se vedi il minore, vedi i documenti"
- "il ruolo basta a leggere tutto"
- "preview e download sono equivalenti"

Queste semplificazioni sarebbero scorrette rispetto al backend.

---

## 8. Output atteso dal team frontend

- pulsante `Informazioni` nella sezione `Documenti`
- guida contestuale che spieghi bene RBAC vs ABAC
- box informativi leggeri su preview/download/audit
- nessuna semplificazione fuorviante del modello documentale
