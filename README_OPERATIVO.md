# README OPERATIVO

## Scopo

Questo e il punto di ingresso obbligatorio per qualsiasi agent.
Serve a capire come lavorare nel progetto senza ricostruire ogni volta tutto da zero e senza usare `DNA/` come duplicato del codice.

## Gerarchia di verita

1. Codice reale
2. Questo file
3. `DNA/`

Se documentazione e codice divergono, vale il codice. La documentazione va poi riallineata.

## Cosa leggere prima di lavorare

1. Questo file
2. Solo i file `DNA` pertinenti al task
3. Il codice realmente coinvolto

## Struttura documentale canonica

- `README_OPERATIVO.md`
  Entry point operativo per l'agent
- `GITHUB_PUSH_GUIDE.md`
  Workflow Git/GitHub persistente anche in export
- `DNA/`
  Contesto operativo canonico e sintetico

## File DNA da usare

- `DNA/01_MAPPA_TECNICA.md`
  Stack, entrypoint, percorsi, componenti critici
- `DNA/02_LOGICHE_CRITICHE.md`
  Flussi applicativi e comportamenti da non rompere
- `DNA/03_DATI_SYNC_SUPABASE.md`
  Database, snapshot, sync, storage, Supabase
- `DNA/04_OPERATIONS_DEPLOY_GITHUB.md`
  Dev, build, test, backup, deploy, GitHub
- `DNA/05_GUARDRAILS_DECISIONI.md`
  Vincoli, decisioni prese, cosa non duplicare o rifare
- `DNA/06_SEO.md`
  SEO server-side, sitemap, canonical, hreflang, JSON-LD
- `DNA/CCV_COLLI_INTEGRATION.md`
  Scheda tecnica viva per integrazione CCV Colli: vetrina `/colli` e menu QR `/colli/menu`

## Regole operative per l'agent

1. Non usare `DNA/` come sostituto del codice.
2. Leggere solo i file `DNA` pertinenti al task.
3. Non usare materiale storico come fonte di verita corrente.
4. Non creare documentazione parallela con lo stesso scopo in piu posti.
5. Aggiornare `DNA/` solo quando cambia una logica, un vincolo o un workflow reale.
6. Non gonfiare `DNA/` con dettagli di UI, liste file-per-file o note narrative inutili.

## Vincoli forti del progetto

- Il sito e live.
- Non lanciare sync Google Sheets, email reali o scritture admin senza richiesta esplicita.
- Non modificare logiche di business senza richiesta.
- Non fare refactor larghi se non richiesti.
- Non esporre segreti o token.
- Non committare `.env`, backup o artefatti generati.

## Fatti operativi correnti

- Branch operativo: `main`
- Remote GitHub atteso: `github`
- Repo canonico: `https://github.com/siteccv/cameraconvista.git`
- Porta locale standard: `5001`
- Build script: `scripts/build.ts`
- Backup operativo locale: file compresso unico `BACKUP/Backup_<giorno> <Mese>_<HH.MM>`.

## Quando aggiornare la documentazione

Aggiornare `DNA/` se cambia:

- architettura reale
- logica critica
- flusso Supabase/sync/snapshot
- workflow deploy/GitHub/backup
- regole non negoziabili
- decisioni operative che l'agent deve conoscere prima di toccare il codice

Non aggiornare `DNA/` per:

- micro-cambi UI
- descrizioni estetiche
- dettagli ovvi leggibili direttamente dai file
- note temporanee o analisi storiche
