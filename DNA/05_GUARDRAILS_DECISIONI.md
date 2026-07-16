# 05 - Guardrails e Decisioni

## Scopo

Raccogliere le regole non negoziabili e le decisioni gia prese che l'agent non deve ignorare.

## Audit completo 2026-07-12 — esito e pulizia FATTA

Audit completo (4 agenti, sola lettura): progetto sano, 0 vulnerabilita, RLS ON su tutte le 23 tabelle, parita admin/user integra, nessun dato di catalogo hardcoded, nessun segreto committato.

**Fatto in questa sessione (tutto verificato con tsc+build+44 test verdi):**

- Corretti (commit `c4f0976`): email fallback SEO sbagliata (`cameraconvistabologna.it`→`cameraconvista.it`) + `nanoid` dichiarata.
- Pulizia file/deps (branch `cleanup/dead-ui-files`, merge `c6dbb9e`): rimossi 24 file orfani (22 componenti `ui/*` mai importati, `client/src/lib/supabase.ts`, asset `attached_assets/colli_home.png`) + riga singleton morta in `supabase-storage.ts` + 17 dipendenze UI inutilizzate (52 pacchetti in meno, 0 vulnerabilita). La classe `SupabaseStorage` resta (usata). `@radix-ui/react-toggle` resta (usato da `ui/toggle` non piu presente? no: verificato, e' rimasto solo cio' che serve).

**Restano, solo se un domani si vuole (bassa priorita, non bug):**

- Duplicazioni minori di manutenibilita: `parseLegacyDayString`/label-giorni tra `Footer.tsx` e `footerSettingsUtils.ts`; `isBcryptHash` tra `helpers.ts` e `colli-admin-utils.ts`; `formatDate` inline in 4 pagine invece di `lib/formatters.ts`.
- **NON toccare:** feature-flag `PRIVATE_DINNER_ENABLED=false` (+ `cena.tsx`) e' voluto/riattivabile, non morto.

## Fix 2026-07-16 — Colli admin: 500 su ogni salvataggio (retention snapshot)

Sintomo: dal 12/07 ogni modifica al menu Colli (aggiunta prodotto, cambio prezzo, riordino, eliminazione) restituiva `500 Unsupported Supabase Colli query` sul `delete ... colli_menu_snapshots ... not in (... limit $1)`. Il dato si salvava lo stesso (adapter REST non transazionale), ma la UI mostrava errore e non si aggiornava finche non si riapriva l'app. Regressione del commit `332b59a` "Add retention for Colli menu snapshots".

Causa radice: la query di retention (`pruneColliSnapshots`, `server/routes/colli-admin-utils.ts`) non aveva un handler nell'adapter Supabase REST (`server/colli-supabase-adapter.ts`), che accetta solo query note. Il vecchio test copriva solo il testo SQL con un client finto, mai il percorso reale attraverso l'adapter.

Fix (solo codice, nessuna modifica DB/deploy): aggiunto in `colli-supabase-adapter.ts` l'handler `pruneArchivedSnapshots` che traduce la DELETE in select+delete Supabase REST, agendo ESCLUSIVAMENTE su `status='archived'` (mai lo snapshot `active` del pubblico). Aggiunto test `tests/unit/colli-adapter-retention.test.ts` che percorre il flusso reale prune → adapter. Verificato: tsc + lint + 47 test + build verdi. Effetto collaterale storico da ripulire a parte: possibili prodotti Colli duplicati creati da retry sul falso errore.

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
