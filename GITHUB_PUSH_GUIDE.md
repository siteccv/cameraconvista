# GitHub Push Guide

## Scopo

Questo file deve restare nel progetto anche in fase di export.
Serve a evitare ogni volta ricostruzioni manuali del flusso `commit` / `push`.

## Repository Canonico

- Repository GitHub: `https://github.com/siteccv/cameraconvista.git`
- Remote operativo atteso: `github`
- Branch operativo atteso: `main`

## Regola Operativa

- I commit devono essere intenzionali.
- Non usare auto-commit ciechi su tutto il worktree.
- Non pushare `.env`, `BACKUP/`, `node_modules/`, `dist/`, `coverage/`, `test-results/`.

## Procedura Standard

### 1. Verifica e bootstrap del remote

```bash
bash scripts/bootstrap-github-remote.sh
```

### 2. Preflight prima del push

```bash
bash scripts/preflight-github-push.sh
```

### 3. Commit e push

```bash
git status -sb --ignored
git diff --stat
git add <file pertinenti>
git commit -m "messaggio chiaro"
git push github main
```

### 4. Verifica post-push

```bash
git ls-remote github refs/heads/main
```

## Export Project

Se il progetto viene esportato senza remote Git configurati:

1. inizializzare o recuperare il repository Git
2. eseguire `bash scripts/bootstrap-github-remote.sh`
3. autenticarsi con un account GitHub che abbia permessi di scrittura sul repo

Il progetto esportato deve mantenere almeno:

- questo file `GITHUB_PUSH_GUIDE.md`
- `scripts/bootstrap-github-remote.sh`
- `scripts/preflight-github-push.sh`
- i riferimenti in `DNA/`

## Troubleshooting

### Errore 403 su push

Sintomo:

```text
remote: Permission to siteccv/cameraconvista.git denied to <account>.
fatal: unable to access ...
```

Causa:

- l'account GitHub autenticato localmente non ha permessi di scrittura sul repository

Verifiche:

```bash
gh auth status
git remote -v
gh repo view --json nameWithOwner,defaultBranchRef
```

Soluzione:

- usare un account GitHub con accesso write/admin al repo `siteccv/cameraconvista`
- poi rieseguire `gh auth setup-git`

Fallback operativo documentato nel progetto:

```bash
set -a
source .env
set +a
AUTH=$(printf 'x-access-token:%s' "$GITHUB_TOKEN" | base64)
git -c http.https://github.com/.extraheader="AUTHORIZATION: basic $AUTH" push github main
```

Note:

- usa il `GITHUB_TOKEN` locale senza salvarlo nel remote Git
- va usato solo se il push standard su `github` fallisce con `403`
- non stampare mai il token in chiaro nei log o in chat

### Remote `github` mancante

```bash
bash scripts/bootstrap-github-remote.sh
```

### Branch sbagliato

```bash
git branch --show-current
git checkout main
```
