#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

bash scripts/bootstrap-github-remote.sh >/dev/null

echo "Repository: $(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null || echo 'non rilevato via gh')"
echo "Branch corrente: $(git branch --show-current)"
echo "Remote github: $(git remote get-url github)"
echo
echo "Stato worktree:"
git status -sb --ignored
echo

if ! command -v gh >/dev/null 2>&1; then
  echo "Errore: GitHub CLI 'gh' non installato." >&2
  exit 1
fi

echo "GitHub auth:"
gh auth status
