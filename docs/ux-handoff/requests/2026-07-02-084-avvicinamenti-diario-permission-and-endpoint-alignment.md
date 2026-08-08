# Handoff UX/API — Allineamento permessi e endpoint Avvicinamenti / Diario

Data: 2026-07-02  
Area: `Minori > Avvicinamenti` / `Minori > Diario educativo`  
Priorità: alta  
Tipo richiesta: bugfix di allineamento terminologico

## 1. Obiettivo

Correggere una discrepanza tra:

- nomi permesso mostrati in UI / note UX
- nomi permesso ed endpoint realmente esposti dal backend

## 2. Backend canonico

### Avvicinamenti

Permessi reali:

- `minor_approaches.read`
- `minor_approaches.create`
- `minor_approaches.update`
- `minor_approaches.delete`

Endpoint reali:

- `GET /api/approaches`
- `POST /api/approaches`
- `GET /api/approaches/{approach}`
- `PUT /api/approaches/{approach}`
- `PATCH /api/approaches/{approach}`
- `DELETE /api/approaches/{approach}`

### Diario educativo

Permessi reali:

- `minor_journals.read`
- `minor_journals.create`
- `minor_journals.update`
- `minor_journals.delete`

Endpoint reali:

- `GET /api/journals`
- `POST /api/journals`
- `GET /api/journals/{journal}`
- `PUT /api/journals/{journal}`
- `PATCH /api/journals/{journal}`
- `DELETE /api/journals/{journal}`

## 3. Cosa non è corretto usare

Non usare più in documentazione o UI:

- `approaches.view`
- `approaches.create`
- `approaches.update`
- `approaches.delete`
- `journals.view`
- `journals.create`
- `journals.update`
- `journals.delete`
- `GET /minor-approaches`
- `GET /minor-journals`
- permessi sintetici tipo `*.write`

Il backend non usa questi nomi.

## 4. Impatto richiesto lato UX

- aggiornare eventuali testi guida / info drawer / help panel
- mantenere le chiamate API già allineate a `/api/approaches` e `/api/journals`
- non aprire bug backend quando il 403 riporta `minor_approaches.*` o `minor_journals.*`: quei nomi sono corretti

## 5. Stato

Backend: allineato  
Frontend API client: allineato  
Bug da correggere: terminologia UI/documentazione
