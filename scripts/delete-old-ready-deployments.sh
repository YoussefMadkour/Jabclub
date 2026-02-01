#!/bin/bash

# Script to delete old READY deployments that are not the current production deployment
# Usage: ./scripts/delete-old-ready-deployments.sh [--dry-run] [--yes]

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

echo "🔍 Finding old READY deployments (excluding current production) for projects: ${PROJECTS[*]}"
echo ""

# Temporary file to store deployment IDs to delete
TEMP_FILE=$(mktemp)
trap "rm -f $TEMP_FILE" EXIT

# Temporary file to store current production deployment ID
PROD_FILE=$(mktemp)
trap "rm -f $PROD_FILE" EXIT

TOTAL_OLD=0

for PROJECT in "${PROJECTS[@]}"; do
  echo "📦 Checking project: $PROJECT"
  
  # Get all READY deployments for this project
  READY_DEPLOYMENTS=$(vercel ls "$PROJECT" --status READY --yes 2>/dev/null | grep -E "^  [0-9]|https://" | grep "https://" || true)
  
  if [ -z "$READY_DEPLOYMENTS" ]; then
    echo "   ✅ No READY deployments found"
    echo ""
    continue
  fi
  
  # Extract URLs from the output
  URLS=$(echo "$READY_DEPLOYMENTS" | grep -oE "https://[^[:space:]]+" || true)
  
  if [ -z "$URLS" ]; then
    echo "   ✅ No READY deployments found"
    echo ""
    continue
  fi
  
  # Find the current production deployment
  # The production deployment is typically the one with the main project alias
  # (e.g., jabclub-youssef-madkours-projects.vercel.app without hash)
  echo "   🔍 Identifying current production deployment..."
  CURRENT_PROD_ID=""
  FIRST_URL=$(echo "$URLS" | head -1)
  
  # Check each deployment to find the one with the main project alias
  while IFS= read -r URL; do
    if [ -n "$URL" ]; then
      # Get deployment details
      INSPECT_OUTPUT=$(vercel inspect "$URL" 2>&1)
      DEPLOYMENT_ID=$(echo "$INSPECT_OUTPUT" | grep -E "dpl_" | sed 's/.*dpl_/dpl_/' | sed 's/[[:space:]]*$//' | head -1 || true)
      
      # Check if this deployment has the main project alias (without hash)
      # Main alias format: project-name-youssef-madkours-projects.vercel.app
      MAIN_ALIAS=$(echo "$INSPECT_OUTPUT" | grep -E "Aliases" -A 10 | grep -E "https://${PROJECT}-youssef-madkours-projects\.vercel\.app" || true)
      
      if [ -n "$MAIN_ALIAS" ] && [ -n "$DEPLOYMENT_ID" ]; then
        CURRENT_PROD_ID="$DEPLOYMENT_ID"
        echo "   ✅ Found current production: $DEPLOYMENT_ID ($URL)"
        echo "$DEPLOYMENT_ID" > "$PROD_FILE"
        break
      fi
    fi
  done <<< "$URLS"
  
  # If we didn't find production by alias, use the first (most recent) deployment as production
  if [ -z "$CURRENT_PROD_ID" ] && [ -n "$FIRST_URL" ]; then
    echo "   ⚠️  Could not identify production by alias, using most recent deployment as production"
    INSPECT_OUTPUT=$(vercel inspect "$FIRST_URL" 2>&1)
    CURRENT_PROD_ID=$(echo "$INSPECT_OUTPUT" | grep -E "dpl_" | sed 's/.*dpl_/dpl_/' | sed 's/[[:space:]]*$//' | head -1 || true)
    if [ -n "$CURRENT_PROD_ID" ]; then
      echo "   ✅ Using most recent as production: $CURRENT_PROD_ID ($FIRST_URL)"
      echo "$CURRENT_PROD_ID" > "$PROD_FILE"
    fi
  fi
  
  if [ -z "$CURRENT_PROD_ID" ]; then
    echo "   ⚠️  Could not identify production deployment, skipping this project"
    echo ""
    continue
  fi
  
  # Now collect all other READY deployments (excluding production)
  COUNT=0
  while IFS= read -r URL; do
    if [ -n "$URL" ]; then
      echo -n "   🔍 Inspecting: $URL ... "
      INSPECT_OUTPUT=$(vercel inspect "$URL" 2>&1)
      DEPLOYMENT_ID=$(echo "$INSPECT_OUTPUT" | grep -E "dpl_" | sed 's/.*dpl_/dpl_/' | sed 's/[[:space:]]*$//' | head -1 || true)
      
      if [ -n "$DEPLOYMENT_ID" ] && [[ "$DEPLOYMENT_ID" =~ ^dpl_ ]]; then
        # Skip if this is the current production
        if [ "$DEPLOYMENT_ID" != "$CURRENT_PROD_ID" ]; then
          echo "Found: $DEPLOYMENT_ID (old)"
          echo "$DEPLOYMENT_ID" >> "$TEMP_FILE"
          COUNT=$((COUNT + 1))
        else
          echo "Skipped: $DEPLOYMENT_ID (current production)"
        fi
      else
        echo "Failed"
      fi
    fi
  done <<< "$URLS"
  
  if [ $COUNT -gt 0 ]; then
    echo "   ⚠️  Found $COUNT old READY deployment(s) to delete"
    TOTAL_OLD=$((TOTAL_OLD + COUNT))
  else
    echo "   ✅ No old READY deployments found (only production exists)"
  fi
  
  echo ""
done

if [ $TOTAL_OLD -eq 0 ]; then
  echo "✅ No old READY deployments found across all projects!"
  exit 0
fi

# Read all deployment IDs
DEPLOYMENT_IDS=$(cat "$TEMP_FILE" 2>/dev/null | tr '\n' ' ' || echo "")

if [ -z "$DEPLOYMENT_IDS" ]; then
  echo "⚠️  No deployment IDs could be extracted"
  exit 1
fi

echo "📊 Summary:"
echo "   Total old READY deployments to delete: $TOTAL_OLD"
echo "   Current production deployments (protected):"
if [ -f "$PROD_FILE" ] && [ -s "$PROD_FILE" ]; then
  cat "$PROD_FILE" | sed 's/^/      - /'
else
  echo "      (Could not identify)"
fi
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
  echo "⚠️  WARNING: This will delete $TOTAL_OLD old READY deployment(s)"
  echo "   Current production deployments will NOT be deleted"
  read -p "   Are you sure you want to continue? (yes/no): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Deletion cancelled"
    exit 0
  fi
fi

echo ""
echo "🗑️  Deleting old READY deployments..."

# Delete deployments in batches (Vercel CLI may have limits)
for DEPLOYMENT_ID in $DEPLOYMENT_IDS; do
  if [ -n "$DEPLOYMENT_ID" ]; then
    echo "   Deleting: $DEPLOYMENT_ID"
    vercel remove "$DEPLOYMENT_ID" --yes 2>&1 | grep -v "^Vercel CLI" || true
  fi
done

echo ""
echo "✅ Deletion process completed!"
echo "   Run 'vercel ls <project> --status READY' to verify"
