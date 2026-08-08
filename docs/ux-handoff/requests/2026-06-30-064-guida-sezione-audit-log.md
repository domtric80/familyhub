# Handoff UX/API - Guida contestuale sezione Audit Log

Data: 2026-06-30
Priorita': alta
Ambito: frontend / UX / help contestuale / sicurezza e conformita'

## 1. Obiettivo

Realizzare la guida contestuale della sezione `Audit Log`, rendendo leggibile a un utente amministrativo un contenuto che altrimenti rischia di apparire troppo tecnico.

La guida deve aiutare a capire che l'audit non e' rumore tecnico, ma la traccia operativa e di sicurezza del sistema.

---

## 2. Fonte contenuto

Frontend puo' usare come base:

- `C:\Projects\FamilyHUB\docs\operations\2026-06-30-guida-sezione-audit-log.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-29-050-document-preview-audit-and-admin-audit-page-detail-response.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-29-051-audit-export-show-and-backend-presets-response.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-29-052-staff-document-audit-and-security-kpis-response.md`

---

## 3. Concetti da spiegare chiaramente in UI

### 3.1 Messaggio chiave

Testo suggerito:

> L'Audit Log registra le operazioni rilevanti di sicurezza e di gestione dati, permettendo di ricostruire chi ha fatto cosa, quando e su quale risorsa.

### 3.2 Distinzione importante

Testo suggerito:

> Lo storico del minore e' una vista focalizzata sugli eventi di un singolo caso; l'Audit Log e' la vista amministrativa generale dell'intero sistema.

---

## 4. Cosa spiegare nella guida UI

### 4.1 A cosa serve la sezione

> La sezione Audit Log consente di controllare accessi, modifiche e operazioni sensibili svolte nell'applicativo.

### 4.2 Tipi di eventi

La guida deve citare esempi concreti:
- login falliti
- login riusciti
- modifiche permessi
- accessi ai minori
- preview documenti
- download documenti
- cambi ruolo

### 4.3 Perche' preview e download sono diversi

> La visualizzazione di un documento e il suo scaricamento sono operazioni distinte e devono essere tracciate separatamente.

---

## 5. Pattern UI consigliato

### 5.1 Posizione del pulsante

Inserire `Informazioni` nell'header della sezione `Audit Log`.

### 5.2 Formato consigliato

Preferibile:
- drawer laterale ampio

Alternativa:
- modal ampia

### 5.3 Blocchi contenuto consigliati

1. `A cosa serve`
2. `Quali eventi traccia`
3. `Come leggere i filtri`
4. `Preset rapidi`
5. `Dettaglio evento`
6. `Storico minore vs audit generale`

---

## 6. Microcopy utili

### 6.1 Box info in testata

> L'audit registra eventi rilevanti di sicurezza, accesso e modifica dati. Usa i filtri per ricostruire rapidamente un evento.

### 6.2 Nota sul dettaglio evento

> Il dettaglio mostra il contesto dell'operazione, inclusi utente, IP, risorsa e variazioni rilevanti.

### 6.3 Nota sui preset

> I preset aiutano a concentrarsi rapidamente su eventi di sicurezza o accessi documentali senza impostare ogni filtro manualmente.

---

## 7. Cose da non semplificare male

UX non deve rappresentare l'audit come:
- semplice cronologia tecnica non importante
- elenco di errori di sistema
- log solo per sviluppatori

L'audit e' parte integrante del modello di sicurezza e governance.

---

## 8. Output atteso dal team frontend

- pulsante `Informazioni` nella sezione `Audit Log`
- guida contestuale leggibile per profili amministrativi
- microcopy chiari su filtri, preset e dettaglio evento
- evidenza corretta della differenza tra audit generale e storico minore
