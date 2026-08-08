# Response 049 — Audit module: pages, filters and pagination

**Data risposta:** 2026-06-29
**Riferimento handoff:** 049

---

## AuditPage.tsx — Percorso: `src/pages/admin/AuditPage.tsx`

### Struttura pagina

**Breadcrumb:** Home → Amministrazione → Audit log

**Sezione filtri (Card):**
- Campo testo libero `q` (ricerca full-text)
- Select Struttura (popolata da `facilityApi.list()`)
- Select Utente (popolata da `adminUserApi.list()`)
- Select Azione (popolata da `adminAuditApi.filters().actions`)
- Select Tipo risorsa (popolata da `adminAuditApi.filters().resource_types`)
- Input data `date_from` e `date_to`
- Pulsanti "Cerca" e "Reset"

**Tabella risultati:**
| Colonna | Sorgente |
|---------|----------|
| Data/Ora | `occurred_at_utc` formattato `it-IT` |
| IP | `ip_address` |
| Utente | `actor_display_name` |
| Ruolo | `actor_role_name` |
| Operazione | `operation_summary ?? action` |
| Risorsa | `resource_type: resource_label` oppure solo `resource_type` |
| Minore | `last_name first_name (internal_code)` |
| Struttura | `facility.name` |
| Azioni | pulsante Eye → modal dettaglio |

**Paginazione:**
- Pulsanti "← Precedente" e "Successiva →" disabilitati ai bordi
- Contatore "Pagina X di Y"
- Visibile solo se `last_page > 1`

**Modal dettaglio:**
- Mostra tutti i campi dell'evento in formato label/valore
- Sezioni `old_values_json` e `new_values_json` con `<pre>` JSON formattato
- Toggle con icona X in header

### Gestione API mancante

Se qualsiasi chiamata restituisce HTTP 404 viene impostato il flag `apiMissing = true` che mostra il banner giallo:
> "Il modulo Audit non è ancora disponibile sul backend. La pagina sarà operativa non appena l'API sarà attiva."

Nessun errore bloccante/crash — la pagina è safe da deployare anche prima che il backend implementi gli endpoint.

### Caricamento parallelo al mount

```ts
Promise.all([
  facilityApi.list(),
  adminUserApi.list(),
  adminAuditApi.filters()
])
```

I fallimenti di `filters()` con 404 attivano `apiMissing`; i fallimenti di `facilityApi`/`adminUserApi` sono silenziati (le select restano vuote).

### Ricaricamento automatico al cambio pagina

`useCallback` + `useEffect([load])` garantisce che cambiare `page` ri-esegua automaticamente la query senza bisogno di premere "Cerca".

---

## File modificati in questo ciclo

| File | Modifica |
|------|----------|
| `src/types/index.ts` | Aggiunte `AuditLog`, `AuditLogFilters`, `PaginatedResponse<T>` |
| `src/services/api.ts` | Aggiunto `adminAuditApi` con `list()` e `filters()` |
| `src/pages/admin/AuditPage.tsx` | Creato nuovo file |
| `src/pages/minori/MinoreDetailPage.tsx` | Aggiornato `StoricoTab` con badge colorati, label italiane, display inline di `operation_summary` e `ip_address` da metadata |
| `src/App.tsx` | Aggiunta rotta `/admin/audit` |
| `src/layout/sidebar/menuItems.ts` | Aggiunta voce "Audit log" nel gruppo Amministrazione |
