# UX handoff response — 184, 185, 186, 187

**Data risposta:** 2026-08-15
**Handoff:** 184 (Certificazioni ed requisiti struttura), 185 (Dashboard HR), 186 (UX review + followup), 187 (Build fix display_name)
**Stato:** tutti implementati

---

## Handoff 187 — Build fix TypeScript

**Problema:** `Property 'display_name' does not exist on type 'AdminUser'`
**File:** `frontend/src/pages/educatori/EducatoreDetailPage.tsx`
**Correzione:**
```ts
// Prima (errato)
staff.user?.display_name

// Dopo (corretto)
staff.user ? `${staff.user.first_name} ${staff.user.last_name}`.trim() : ...
```
`AdminUser` espone solo `first_name` e `last_name`. Nessun campo fittizio aggiunto al tipo.

---

## Handoff 184 — Certificazioni e requisiti di struttura

### Nuovi tipi (`frontend/src/types/index.ts`)

- `StaffCertification`, `StaffCertificationWrite`
- `FacilityCertificationRequirement`, `FacilityCertificationRequirementWrite`
- `FacilityCertificationCompliance`, `FacilityCertificationComplianceRow`

### Nuove API (`frontend/src/services/api.ts`)

```typescript
staffCertificationApi: { list, create, update, delete }
facilityCertificationApi: { listRequirements, createRequirement, updateRequirement, deleteRequirement, compliance }
```

### Tab Certificazioni in `EducatoreDetailPage`

- Posizione: 3° tab (tra Documenti professionali e Profilo professionale)
- Lista certificazioni con badge `validity_status`: Valida / In scadenza / Scaduta / Revocata
- Form CRUD: tipo (select da `certification-types` lookup), documento di prova (select dai documenti del professionista), date, riferimento, nota
- Il tipo certificazione **deve essere selezionato** — non è ammesso testo libero
- Il documento di prova è facoltativo e mostra solo file del professionista corrente

### `AnagraficheProfessionaliPage` — 5° tab "Tipi certificazione"

- Aggiunto tab `certification-types` all'anagrafica professionale esistente
- Stesso CRUD degli altri tab (codice immutabile, attiva/disattiva, gestione 409 → proposta disattivazione)
- Route invariata: `/anagrafiche/professionali`

### Nuova pagina `StrutturaDetailPage` (`/admin/strutture/:id`)

Tab **Requisiti certificativi**:
- Lista requisiti della struttura con CRUD
- Campi: tipo certificazione (select), qualifica (select opzionale, "Tutte" se omessa), obbligatorio (checkbox), giorni preavviso, nota
- Pulsante **Dettaglio** aggiunto in ogni riga di `StrutturePage`

Tab **Conformità**:
- KPI: totale verifiche, conformi, non conformi
- Tabella con filtro per stato (`compliant | expiring | expired | missing | revoked`)
- Badge testuali per ogni stato (no solo colore)
- Link **Scheda** → `/educatori/:id` per ogni riga (certif. da correggere nella scheda professionista, non da questa pagina)
- Alert esplicito: la conformità è informativa e non blocca turni

### Vincolo operativo rispettato

Nessuna azione automatica su turni, assegnazioni o accessi. Gli alert sono solo informativi.

---

## Handoff 185 — Dashboard HR

**File:** `frontend/src/pages/admin/DashboardHRPage.tsx`
**Route:** `/admin/hr-dashboard`
**Sidebar:** Amministrazione → "Dashboard HR"

### KPI visualizzati

Tutti estratti da `GET /api/admin/staff-hr-dashboard?facility_id={id}` → `kpis`:
- Personale totale e attivi
- Senza utenza applicativa
- Senza competenze / lingue registrate
- Documenti scaduti e in scadenza
- Certificazioni scadute e in scadenza
- Requisiti certificativi mancanti

Nessun ricalcolo locale — i valori vengono dal backend così come sono.

### Alert operativi

Tre sezioni da `alerts.documents`, `alerts.certifications`, `alerts.missing_requirements`:
- Max 20 elementi per sezione (già ordinati dal backend)
- Badge testuali per stato (Scaduto, In scadenza, Revocato, Mancante)
- Link **Scheda** → `/educatori/:id` su ogni riga
- I file/documenti non sono visualizzabili da questa pagina (rispetto permessi sezione documenti)

### Filtro struttura

Select struttura opzionale. Senza filtro → quadro aggregato. Aggiornamento manuale (pulsante Aggiorna).

### Nota soglia scadenze

La soglia preavviso è `configuration.document_expiry_alert_days` dal backend — mostrata a piè pagina, non ricalcolata lato client.

### Vincoli rispettati

- Nessuna modifica dati da questa pagina
- Professionista senza account ≠ professionista inattivo (non lo si assume)
- Nessun codice tecnico di permesso esposto all'utente

---

## Handoff 186 — UX review (conferma allineamento)

- Review 181–183 confermata dal backend: le modifiche frontend restano valide
- Permessi documenti professionali aggiornati nella risposta 181–183 (già documentati)
- Codici anagrafiche professionali immutabili confermati anche via API: corretto non renderli modificabili in UI
- **Non richiede modifiche frontend aggiuntive**

---

## File modificati / creati

| File | Handoff | Tipo |
|---|---|---|
| `frontend/src/pages/educatori/EducatoreDetailPage.tsx` | 187 + 184 | Modifica (fix display_name + tab Certificazioni) |
| `frontend/src/pages/admin/AnagraficheProfessionaliPage.tsx` | 184 | Modifica (tab certification-types) |
| `frontend/src/pages/admin/StrutturaDetailPage.tsx` | 184 | Nuovo |
| `frontend/src/pages/admin/StrutturePage.tsx` | 184 | Modifica (link Dettaglio) |
| `frontend/src/pages/admin/DashboardHRPage.tsx` | 185 | Nuovo |
| `frontend/src/App.tsx` | 184+185 | Modifica (route) |
| `frontend/src/layout/sidebar/menuItems.ts` | 185 | Modifica (Dashboard HR) |
| `frontend/src/services/api.ts` | 184+185 | Modifica (nuove API) |
| `frontend/src/types/index.ts` | 184+185 | Modifica (nuovi tipi) |
