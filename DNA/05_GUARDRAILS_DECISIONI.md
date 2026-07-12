# 05 - Guardrails e Decisioni

## Scopo

Raccogliere le regole non negoziabili e le decisioni gia prese che l'agent non deve ignorare.

## Pulizia arretrata (da fare in branch dedicato, NON di fretta)

Audit completo del 2026-07-12 (4 agenti, sola lettura): progetto sano, 0 vulnerabilita, RLS ON su tutte le 23 tabelle, parita admin/user integra, nessun dato di catalogo hardcoded, nessun segreto committato. Gia corretti (commit `c4f0976`): email fallback SEO sbagliata + `nanoid` dichiarata. Restano, a bassa priorita, da fare solo in branch separato con build/test verdi:

- **~24 file UI orfani** (`client/src/components/ui/*` mai importati: alert, aspect-ratio, avatar, breadcrumb, carousel, chart, collapsible, command, context-menu, drawer, dropdown-menu, form, hover-card, input-otp, menubar, navigation-menu, pagination, progress, resizable, table, toggle, toggle-group) + `client/src/lib/supabase.ts` (client browser mai usato, l'app passa dal server) + asset `attached_assets/colli_home.png` + riga singleton morta `server/supabase-storage.ts` `export const supabaseStorage`. Rimuovendoli si possono togliere ~17 dipendenze UI da package.json (recharts, embla-carousel-react, cmdk, vaul, react-resizable-panels, input-otp, react-hook-form, e vari @radix-ui/*). CERTO ma da fare incrementale, con build/test ad ogni passo.
- **Duplicazioni minori** (solo manutenibilita, non bug): `parseLegacyDayString`/label-giorni tra `Footer.tsx` e `footerSettingsUtils.ts`; `isBcryptHash` tra `helpers.ts` e `colli-admin-utils.ts`; `formatDate` inline in 4 pagine invece di `lib/formatters.ts`.
- **NON toccare:** feature-flag `PRIVATE_DINNER_ENABLED=false` (+ `cena.tsx`) e' voluto/riattivabile, non morto.

## Azione owner (fuori dal codice)

- **Chiave Google Maps** in `client/src/pages/dove-siamo.tsx`: e' client-side (deve stare nel codice per far funzionare la mappa embed). Metterla in sicurezza = restringerla per referrer/dominio nel pannello Google Cloud Console, non nel repo.

## Guardrails forti

- Il sito e live
- Il codice e la fonte di verita primaria
- `DNA/` serve a ridurre errori, non a duplicare il repo
- Lo storico non operativo non deve restare nel percorso documentale attivo
- Non creare nuovi file `.md` paralleli con lo stesso scopo
- Non fare refactor larghi o estetici senza richiesta
- Non modificare logiche di business senza richiesta
- Non toccare deploy, sync o invii email senza richiesta
- Non esporre segreti, token o chiavi

## Decisioni gia prese

- L'entry point per l'agent e `README_OPERATIVO.md`
- `GITHUB_PUSH_GUIDE.md` resta in root per export e operativita
- `DNA/` deve restare corta e canonica
- `scripts/` e la cartella unica per build e utility operative
- `BookingDialog` resta condiviso
- La logica `PRIVATE_DINNER_ENABLED` controlla la sottopagina cena
- Il SEO resta separato perche e sistema tecnico sensibile

## Cosa non duplicare

- Documentazione operativa in piu posti
- Flussi auth admin
- Logiche publish/snapshot
- Route o pagine admin gia esistenti con stessa funzione
- Script di build o push paralleli senza motivo

## Quando aggiornare DNA

Aggiorna `DNA/` solo se cambia:

- architettura reale
- flusso critico
- workflow GitHub/deploy/backup
- comportamento Supabase/sync/snapshot
- guardrail operativo
- decisione stabile che l'agent deve conoscere

## Quando non aggiornare DNA

Non aggiornare `DNA/` per:

- micro-cambi grafici
- refusi UI
- spiegazioni narrative lunghe
- elenchi file-per-file senza valore operativo
- analisi una tantum

## Come deve comportarsi l'agent

1. leggere `README_OPERATIVO.md`
2. selezionare solo i file `DNA` pertinenti
3. verificare il codice reale
4. dichiarare eventuali mismatch tra docs e codice
5. trattare note storiche e audit passati come materiale secondario, recuperabile da Git o backup
6. tenere la documentazione asciutta, non enciclopedica
