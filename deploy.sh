#!/bin/bash

set -e

echo "🚀 Deploying to GitHub..."

# Fetch latest from GitHub to ensure we have current state
git fetch origin main 2>/dev/null || true

# Check if there are uncommitted changes
if git status --porcelain | grep -q .; then
  echo "📝 Committing changes..."
  git add -A
  
  # Generate timestamp for commit message
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  git commit -m "Auto-sync: $TIMESTAMP"
fi

# Check if there are commits to push (local HEAD ahead of origin/main)
if git rev-list origin/main..HEAD 2>/dev/null | grep -q .; then
  echo "📤 Pushing to main..."
  git push origin main
  echo "✅ Deployment complete!"
else
  echo "✅ Already synced with GitHub"
fi
