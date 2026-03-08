#!/bin/bash

set -e

echo "🚀 Deploying to GitHub..."

# Check if there are uncommitted changes
if git status --porcelain | grep -q .; then
  echo "📝 Committing changes..."
  git add -A
  
  # Generate timestamp for commit message
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  git commit -m "Auto-sync: $TIMESTAMP"
  echo "✅ Commit created"
fi

# Push to GitHub (will show "Everything up-to-date" if nothing to push)
echo "📤 Pushing to GitHub..."
git push origin main
echo "✅ Deployment complete!"
