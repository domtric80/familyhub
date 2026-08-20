# Farmaci e somministrazioni — Security design

Data: 2026-08-17

## Perimetro

Prima fase del capitolato 6.2:

- scheda farmacologica per minore;
- dosaggio, orari e medico prescrittore relazionali;
- registro somministrazioni con firma dell'educatore;
- alert scadenza piano e rinnovo ricetta.

## Decisioni

- farmaco, unità di dosaggio, via di somministrazione ed esito non sono testo libero;
- il prescrittore è uno `staff_member` della struttura con qualifica `PEDIATRA` o `MEDICO_BASE`;
- la ricetta può collegare un documento clinico già protetto;
- istruzioni e note sono cifrate a riposo;
- il registro somministrazioni è append-only;
- la firma è una firma applicativa autenticata, non viene presentata come firma elettronica qualificata;
- la stessa dose prevista non può essere registrata due volte;
- `ADMIN_IT` non accede ai dati sanitari.

## RBAC

- direzione e pediatra gestiscono i piani;
- educatori diurni/notturni leggono i piani dei minori assegnati e registrano somministrazioni;
- ogni accesso richiede anche assegnazione attiva al minore;
- la ricetta resta soggetta alla policy ABAC documentale quando viene aperta.
