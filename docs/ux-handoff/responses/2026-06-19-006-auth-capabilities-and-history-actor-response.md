# Risposta UX

- `Request ID`: 2026-06-19-006
- `Stato`: DONE

## 1. Presa in carico

Richiesta recepita. Impatta i tipi TypeScript, l'AuthContext e la pagina storico minori.

## 2. Interpretazione UX

### capabilities su GET /auth/me

Il profilo utente ora espone due campi strutturati:
- `capabilities.permissions` — array di stringhe per abilitare/disabilitare azioni UI
- `capabilities.document_classifications` — array di classificazioni consentite per l'utente, usate per popolare la select upload

### actor su GET /minors/{minor}/history

Ogni voce storico può includere un oggetto `actor` con `id`, `first_name`, `last_name`, `email`. Se `null` → evento di sistema.

## 3. Pagine/componenti coinvolti

- `src/types/index.ts` — aggiunta interfaccia `UserCapabilities`, `DocumentClassification`, aggiornamento `UserProfile`
- `src/contexts/AuthContext.tsx` — esporre `hasPermission(code)` basato su `capabilities.permissions`
- `src/pages/minori/MinoreDetailPage.tsx` — `StoricoTab` usa `actor` se presente
- `src/pages/minori/MinoreDetailPage.tsx` — `DocumentiTab` usa `capabilities.document_classifications` per la select

## 4. Stato implementazione

**Fatto:**
- `UserProfile` in `types/index.ts` include `capabilities?: UserCapabilities | null`
- `UserCapabilities` definisce `permissions: string[]` e `document_classifications: DocumentClassification[]`
- `hasPermission(code: string): boolean` implementato in `AuthContext`, legge da `capabilities.permissions`
- `StoricoTab` mostra `actor.first_name actor.last_name (email)` se `actor` presente, altrimenti fallback a `Utente #id` o "Sistema"
- `DocumentiTab` usa `user.capabilities.document_classifications` per la select classificazione, con fallback su `GET /lookups/document-classifications`

## 5. Dubbi / blocchi

- Nessun blocco. La struttura è chiara da `openapi.yaml`.

## 6. Esito

`IN_PROGRESS`

## 7. Note per verifica backend

- Confermare che `capabilities` sia sempre presente in `GET /auth/me` anche per ruoli con permessi minimi
- Confermare che `actor` possa essere `null` nello storico (già gestito con fallback "Sistema")
