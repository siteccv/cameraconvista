#!/usr/bin/env bash

set -euo pipefail

echo "Preflight GitHub push..."
bash scripts/preflight-github-push.sh

if git status --porcelain | grep -q .; then
  echo "Errore: worktree non pulito. Crea/stagia/committa intenzionalmente prima del push." >&2
  exit 1
fi

echo "Push su github/main..."
git push github main
echo "Push completato."
