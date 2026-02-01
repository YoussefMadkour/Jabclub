#!/bin/bash

# Script to list and delete cancelled Vercel deployments for jabclub and jabclub-api-backend projects
# Usage: ./scripts/delete-cancelled-deployments.sh [--dry-run] [--yes]

# Don't exit on error - we want to continue processing even if one deployment fails
set +e

DRY_RUN=false
AUTO_YES=false
PROJECTS=("jabclub" "jabclub-api-backend")

# Parse arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --yes|-y)
      AUTO_YES=true
      shift
      ;;
    *)
      ;;
  esac
done

echo "🔍 Finding cancelled deployments for projects: ${PROJECTS[*]}"
echo ""

# Temporary file to store deployment IDs
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

TOTAL_CANCELLED=0

for PROJECT in "${PROJECTS[@]}"; do
  echo "📦 Checking project: $PROJECT"
  
  # Get cancelled deployments for this project
  CANCELLED_DEPLOYMENTS=$(vercel ls "$PROJECT" --status CANCELLED --yes 2>/dev/null | grep -E "^  [0-9]|https://" | grep "https://" || true)
  
  if [ -z "$CANCELLED_DEPLOYMENTS" ]; then
    echo "   ✅ No cancelled deployments found"
    echo ""
    continue
  fi
  
  # Extract URLs from the output (extract just the URL part from each line)
  URLS=$(echo "$CANCELLED_DEPLOYMENTS" | grep -oE "https://[^[:space:]]+" || true)
  
  if [ -z "$URLS" ]; then
    echo "   ✅ No cancelled deployments found"
    echo ""
    continue
  fi
  
  COUNT=$(echo "$URLS" | wc -l | tr -d ' ')
  echo "   ⚠️  Found $COUNT cancelled deployment(s)"
  TOTAL_CANCELLED=$((TOTAL_CANCELLED + COUNT))
  
  # Extract deployment IDs from URLs
  while IFS= read -r URL; do
    if [ -n "$URL" ]; then
      echo -n "   🔍 Inspecting: $URL ... "
      # Get deployment ID using vercel inspect (output goes to stderr, so we merge streams)
      # Extract dpl_* ID from the output
      DEPLOYMENT_ID=$(vercel inspect "$URL" 2>&1 | grep -E "dpl_" | sed 's/.*dpl_/dpl_/' | sed 's/[[:space:]]*$//' | head -1 || true)
      
      if [ -n "$DEPLOYMENT_ID" ] && [[ "$DEPLOYMENT_ID" =~ ^dpl_ ]]; then
        echo "Found: $DEPLOYMENT_ID"
        echo "$DEPLOYMENT_ID" >> "$TEMP_FILE"
      else
        echo "Failed"
      fi
    fi
  done <<< "$URLS"
  
  echo ""
done

if [ $TOTAL_CANCELLED -eq 0 ]; then
  echo "✅ No cancelled deployments found across all projects!"
  exit 0
fi

# Read all deployment IDs
DEPLOYMENT_IDS=$(cat "$TEMP_FILE" 2>/dev/null | tr '\n' ' ' || echo "")

if [ -z "$DEPLOYMENT_IDS" ]; then
  echo "⚠️  No deployment IDs could be extracted"
  exit 1
fi

echo "📊 Summary:"
echo "   Total cancelled deployments: $TOTAL_CANCELLED"
echo "   Deployment IDs to delete:"
echo "$DEPLOYMENT_IDS" | tr ' ' '\n' | sed 's/^/      - /'
echo ""

if [ "$DRY_RUN" = true ]; then
  echo "🔍 DRY RUN MODE - No deletions will be performed"
  echo "   To actually delete, run without --dry-run flag"
  exit 0
fi

# Confirm deletion
if [ "$AUTO_YES" = false ]; then
  echo "⚠️  WARNING: This will delete $TOTAL_CANCELLED cancelled deployment(s)"
  read -p "   Are you sure you want to continue? (yes/no): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Deletion cancelled"
    exit 0
  fi
fi

echo ""
echo "🗑️  Deleting cancelled deployments..."

# Delete deployments in batches (Vercel CLI may have limits)
for DEPLOYMENT_ID in $DEPLOYMENT_IDS; do
  if [ -n "$DEPLOYMENT_ID" ]; then
    echo "   Deleting: $DEPLOYMENT_ID"
    vercel remove "$DEPLOYMENT_ID" --yes 2>&1 | grep -v "^Vercel CLI" || true
  fi
done

echo ""
echo "✅ Deletion process completed!"
echo "   Run 'vercel ls <project> --status CANCELLED' to verify"
