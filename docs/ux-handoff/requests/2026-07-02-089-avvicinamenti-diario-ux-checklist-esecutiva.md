# Handoff UX — Checklist esecutiva Avvicinamenti + Diario educativo

Data: 2026-07-02  
Destinazione: team UX / frontend  
Priorità: alta  
Stato: da implementare e poi restituire con verifica puntuale

## 1. Obiettivo

Questa checklist traduce in attività esecutive concrete i contratti già prodotti per:

- `Avvicinamenti familiari`
- `Diario educativo`

Il team UX deve usarla come lista di controllo finale.

## 2. Avvicinamenti familiari — Checklist

### 2.1 Header pagina

- [ ] pulsante o icona `Informazioni`
- [ ] apertura drawer coerente con `InfoDrawer`
- [ ] copy sezione coerente con handoff 085/086

### 2.2 Lista

- [ ] colonna stato avvicinamento
- [ ] colonna stato autorizzazione
- [ ] colonna scadenza autorizzazione
- [ ] colonna/badge note riservate presenti
- [ ] colonna esito reazione finale
- [ ] filtro `authorization_status`
- [ ] empty state allineato

### 2.3 Form

- [ ] blocco dati incontro
- [ ] blocco provvedimento autorizzativo
- [ ] blocco reazione minore
- [ ] blocco esito operativo
- [ ] blocco note riservate
- [ ] blocco sospensione

### 2.4 Box informativi inline

- [ ] box `Provvedimento autorizzativo`
- [ ] box `Osservazione della reazione`
- [ ] box `Contenuto riservato`
- [ ] box `Sospensione del percorso`

### 2.5 Vincoli

- [ ] non mostrare note riservate se il backend le restituisce `null`
- [ ] non creare trend lato client
- [ ] usare `GET /api/approaches/trend`

## 3. Diario educativo — Checklist

### 3.1 Header pagina

- [ ] pulsante o icona `Informazioni`
- [ ] drawer con guida sezione
- [ ] copy coerente con handoff 087/088

### 3.2 Lista

- [ ] colonna priorità
- [ ] colonna umore
- [ ] colonna follow-up
- [ ] colonna handover
- [ ] filtro `priority_level`
- [ ] filtro `mood_level`
- [ ] filtro `handover_required`
- [ ] empty state allineato

### 3.3 Form

- [ ] blocco dati base
- [ ] blocco priorità e contesto
- [ ] blocco registro turno
- [ ] blocco follow-up
- [ ] blocco handover

### 3.4 Box informativi inline

- [ ] box priorità
- [ ] box registro turno
- [ ] box follow-up
- [ ] box handover

### 3.5 Summary/KPI

- [ ] card riepilogo priorità
- [ ] card follow-up richiesti
- [ ] card handover pendenti
- [ ] andamento giornaliero
- [ ] usare solo `GET /api/journals/summary`

## 4. Output che UX deve restituire

Quando il team UX dichiara il lavoro completato deve restituire:

1. elenco file frontend toccati
2. schermate implementate
3. punti checklist completati
4. punti ancora bloccati
5. eventuali divergenze rispetto al contratto

## 5. Riferimenti obbligatori

- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-085-avvicinamenti-family-workflow-v2-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-086-avvicinamenti-information-boxes-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-087-diario-educativo-v2-contract.md`
- `C:\Projects\FamilyHUB\docs\ux-handoff\requests\2026-07-02-088-diario-educativo-information-boxes-contract.md`
