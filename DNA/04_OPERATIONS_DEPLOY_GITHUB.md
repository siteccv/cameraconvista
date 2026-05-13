# 04 - Operations, Deploy e GitHub

## Scopo

Raccogliere i workflow operativi che l'agent deve conoscere prima di eseguire comandi, backup, build o push.

## Avvio locale

- Standard operativo: `PORT=5001 npm run dev`
- Default codice se `PORT` manca: `5000`

## Build e start

- Build: `npm run build`
- Il build usa `scripts/build.ts`
- Start production-like: `PORT=5002 npm run start` oppure porta desiderata

## Check e test

Controlli principali:

- `npm run check`
- `npm run lint`
- `npm run format:check`
- `npm run test`
- `npm run build`
- `npm run test:e2e`

Target completo disponibile:

- `npm run check:all`

Nota operativa:

- non dichiarare verde pieno se `audit` non lo e davvero;
- il blocco audit emerso durante il consolidamento Colli e stato risolto il 2026-05-13 aggiornando `express-rate-limit` a `^8.5.1`, che porta `ip-address` a `10.2.0`;
- il fix e stato applicato senza `--force`.

Ultima suite completa eseguita il 2026-05-13 dopo fix audit, ottimizzazione Supabase Storage e allineamento mobile Colli:

- `npm run check`: OK
- `npm run lint`: OK
- `npm run format:check`: OK
- `npm test`: OK, 3 file e 7 test
- `npm run test:coverage`: OK, 3 file e 7 test
- `npm run build`: OK, con warning PostCSS gia noto
- `npm run test:e2e`: OK, 22/22
- `npm run colli:db:check`: OK, read-only, nessuna scrittura
- `npm run audit`: OK, 0 vulnerabilita

Quindi la pipeline locale richiesta dal progetto risulta verde. Resta solo il warning PostCSS non bloccante gia noto durante build.

## Playwright

Se manca il browser:

- `npx playwright install chromium`

Per smoke su server built locale:

- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5002 npm run test:e2e`

## Backup

Formato operativo richiesto:

- archivio sorgente: `BACKUP/Backup_<giorno> <Mese>_<HH.MM>.tar.gz`
- snapshot DB associato: `BACKUP/Backup_<giorno> <Mese>_<HH.MM>_db_state.json`

Backup finale corrente:

- `BACKUP/Backup_13 Maggio_22.52.tar.gz`
- `BACKUP/Backup_13 Maggio_22.52_db_state.json`

Regola: mantenere in `BACKUP/` solo l'archivio operativo finale e lo snapshot DB finale piu recenti, salvo richiesta esplicita di conservare storici.

Escludere almeno dai backup sorgente:

- `.git`
- `node_modules`
- `dist`
- `BACKUP`
- `coverage`
- `test-results`
- `playwright-report`

Gestione env:

- `.env` e file env operativi non devono essere versionati;
- `.env` deve restare nella cartella progetto per l'uso locale;
- nei backup locali operativi puo essere incluso, cosi il progetto resta ripristinabile senza reinserire manualmente le variabili essenziali;
- non stampare mai segreti, token o chiavi nei report.

I backup restano locali salvo richiesta esplicita contraria.

## GitHub

Fatti operativi:

- Repo: `https://github.com/siteccv/cameraconvista.git`
- Remote atteso: `github`
- Branch atteso: `main`

Workflow persistente:

- leggere `GITHUB_PUSH_GUIDE.md`
- usare `scripts/bootstrap-github-remote.sh`
- usare `scripts/preflight-github-push.sh`

Strategia commit/push:

- usare commit normale delle differenze reali;
- non sostituire manualmente il progetto remoto;
- non usare force push;
- non versionare `.env`, `BACKUP/`, `node_modules`, `dist`, `coverage`, `test-results` o artefatti generati;
- commit e push solo su autorizzazione esplicita dell'utente.

Se il push standard fallisce con `403`, usare il fallback documentato in `GITHUB_PUSH_GUIDE.md`.

## Deploy concettuale

Non confondere:

- deploy applicazione
- publish contenuti dentro il CMS

Il publish interno aggiorna i contenuti pubblici ma non sostituisce il deploy del codice.

## Variabili rilevanti

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_DB_URL`
- `RESEND_API_KEY`
- `EVENT_REQUEST_EMAIL`
- `OPENAI_API_KEY`
- `PLAYWRIGHT_BASE_URL`
- `GITHUB_TOKEN`

## Regole pratiche per l'agent

1. Prima di commit o push: `git status -sb --ignored` e `git diff --stat`
2. Prima di toccare workflow: verificare riferimenti reali in `package.json`, `scripts/` e `.github/workflows/`
3. Non eseguire sync, publish o email reali senza richiesta esplicita
