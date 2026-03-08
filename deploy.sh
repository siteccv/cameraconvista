#!/bin/bash

set -e

echo "🚀 Deploying to GitHub..."

# Check if there are changes
if git status --porcelain | grep -q .; then
  echo "📝 Committing changes..."
  git add -A
  
  # Generate timestamp for commit message
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  git commit -m "Auto-sync: $TIMESTAMP"
  
  echo "📤 Pushing to main..."
  git push origin main
  
  echo "✅ Deployment complete!"
else
  echo "⏭️  No changes to deploy"
fi
