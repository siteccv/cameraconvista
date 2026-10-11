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

- l'account con permesso di scrittura e `siteccv`; sul Mac sono collegati piu account e quello attivo cambia con l'ultimo progetto aperto
- verificare: `gh api repos/siteccv/cameraconvista --jq .permissions.push` deve dare `true`
- se da `false`: `gh auth switch -u siteccv` (se l'account non e collegato: `gh auth login`), poi `gh auth setup-git`

Dal 12/10/2026 non esiste piu un `GITHUB_TOKEN`: l'autenticazione passa solo dalla CLI `gh`. Non scrivere token nel `.env`, nel remote o nei comandi.

### Remote `github` mancante

```bash
bash scripts/bootstrap-github-remote.sh
```

### Branch sbagliato

```bash
git branch --show-current
git checkout main
```
