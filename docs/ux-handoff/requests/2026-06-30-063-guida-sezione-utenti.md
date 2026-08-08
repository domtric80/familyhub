# Handoff UX/API - Guida contestuale sezione Utenti

Data: 2026-06-30
Priorita': alta
Ambito: frontend / UX / help contestuale / gestione identita' digitali

## 1. Obiettivo

Realizzare la guida contestuale della sezione `Utenti`, spiegando in modo chiaro il rapporto tra account applicativo, ruolo RBAC e struttura.

Questa guida deve anche recepire una nuova regola backend appena consolidata:
- per una stessa struttura, un utente puo' avere un solo ruolo attivo alla volta

---

## 2. Fonte contenuto

Frontend puo' usare come base:

- `C:\Projects\FamilyHUB\docs\operations\2026-06-30-guida-sezione-utenti.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\responses\2026-06-30-057-gestione-ruolo-utente-e-filtro-assegnazioni-attive-response.md`

---

## 3. Concetto da spiegare chiaramente in UI

### 3.1 Messaggio chiave

Testo suggerito:

> Un utente e' l'identita' digitale che accede al sistema. Il suo ruolo operativo viene assegnato nel contesto di una struttura e determina i permessi disponibili.

### 3.2 Regola nuova da mostrare

Testo suggerito:

> Per ogni struttura puo' esistere un solo ruolo attivo per lo stesso utente. Il cambio ruolo sostituisce il ruolo attivo precedente, non ne aggiunge un secondo.

---

## 4. Cosa spiegare nella guida UI

### 4.1 A cosa serve la sezione

> La sezione Utenti consente di creare, aggiornare e proteggere gli account che accedono all'applicativo.

### 4.2 Utente vs anagrafica professionale

> L'account applicativo non coincide automaticamente con l'anagrafica del professionista o del membro del personale. Le due entita' possono essere collegate ma hanno finalita' diverse.

### 4.3 MFA e sicurezza

> L'attivazione, la conferma e il reset della MFA sono controlli di sicurezza e incidono direttamente sull'accesso al sistema.

---

## 5. Pattern UX da rispettare

### 5.1 Cambio ruolo

La UI deve trasmettere che il cambio ruolo:
- aggiorna il ruolo attivo
- non crea una seconda identita' operativa parallela sulla stessa struttura

### 5.2 Ruoli storici o revocati

La UI deve evitare di mescolare in modo ambiguo:
- ruolo attivo corrente
- ruoli storici / revocati

### 5.3 Refresh permessi

Dopo operazioni sensibili sul ruolo, UX deve tenere presente che il profilo utente va riallineato rispetto a `/auth/me`.

---

## 6. Microcopy utili

### 6.1 Box info su ruolo nella modal utente

> Il ruolo attivo e' unico per struttura. Se lo cambi, il sistema sostituisce il ruolo operativo attuale.

### 6.2 Box info su MFA

> La MFA protegge l'accesso all'account. Il reset MFA richiede una nuova configurazione da parte dell'utente.

### 6.3 Box info su stato account

> Un account disattivato non puo' accedere al sistema anche se mantiene dati storici e assegnazioni pregresse.

---

## 7. Cose da non comunicare male

UX non deve dare a intendere che:
- un utente puo' avere liberamente piu' ruoli attivi nella stessa struttura
- il ruolo e' scollegato dalla struttura
- MFA sia una preferenza cosmetica

---

## 8. Output atteso dal team frontend

- pulsante `Informazioni` nella sezione `Utenti`
- guida contestuale allineata alla regola del ruolo unico attivo per struttura
- microcopy chiari su MFA, stato account e cambio ruolo
- distinzione leggibile tra ruolo attivo e storico
