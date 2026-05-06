#!/usr/bin/env bash

set -euo pipefail

CANONICAL_REMOTE_NAME="github"
CANONICAL_REMOTE_URL="https://github.com/siteccv/cameraconvista.git"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Errore: la cartella corrente non e un repository Git." >&2
  exit 1
fi

if git remote get-url "$CANONICAL_REMOTE_NAME" >/dev/null 2>&1; then
  current_url="$(git remote get-url "$CANONICAL_REMOTE_NAME")"
  if [[ "$current_url" != "$CANONICAL_REMOTE_URL" ]]; then
    git remote set-url "$CANONICAL_REMOTE_NAME" "$CANONICAL_REMOTE_URL"
    echo "Remote '$CANONICAL_REMOTE_NAME' riallineato a $CANONICAL_REMOTE_URL"
  else
    echo "Remote '$CANONICAL_REMOTE_NAME' gia allineato."
  fi
else
  git remote add "$CANONICAL_REMOTE_NAME" "$CANONICAL_REMOTE_URL"
  echo "Remote '$CANONICAL_REMOTE_NAME' creato: $CANONICAL_REMOTE_URL"
fi

git remote -v | sed -n "/^${CANONICAL_REMOTE_NAME}[[:space:]]/p"
