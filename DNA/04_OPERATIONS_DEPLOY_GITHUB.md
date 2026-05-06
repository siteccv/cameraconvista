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

- oggi `npm run audit` puo restare l'unico punto rosso noto per vulnerabilita moderate transitive
- non dichiarare verde pieno se `audit` non lo e davvero

## Playwright

Se manca il browser:

- `npx playwright install chromium`

Per smoke su server built locale:

- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5002 npm run test:e2e`

## Backup

Formato:

- `BACKUP/Backup_<giorno>_<Mese>_<HH-MM>.tar`

Escludere almeno:

- `.git`
- `node_modules`
- `dist`
- `BACKUP`
- `coverage`
- `test-results`
- `playwright-report`
- `.env`
- `.env.*`

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
