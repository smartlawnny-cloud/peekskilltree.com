#!/usr/bin/env bash
# Atomically bump every version reference in Branch Manager so the PWA self-heal
# never wedges again. Three places must always agree:
#   1. branchmanager/version.json   (server-of-truth)
#   2. branchmanager/index.html     (BUNDLED_VERSION + visible badge fallback)
#   3. branchmanager/sw.js          (CACHE_NAME)
#
# Usage:
#   ./scripts/bump-version.sh                 # auto-bump by 1
#   ./scripts/bump-version.sh 250             # set explicit number
#   ./scripts/bump-version.sh "release notes" # auto-bump + custom notes
#
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION_FILE="branchmanager/version.json"
INDEX="branchmanager/index.html"
SW="branchmanager/sw.js"

CURRENT=$(grep -o '"version": *[0-9]*' "$VERSION_FILE" | grep -o '[0-9]*')

# Decide new version
ARG="${1:-}"
NOTES="${2:-}"
if [[ "$ARG" =~ ^[0-9]+$ ]]; then
  NEW="$ARG"
elif [[ -n "$ARG" ]]; then
  NOTES="$ARG"
  NEW=$((CURRENT + 1))
else
  NEW=$((CURRENT + 1))
fi
[[ -z "$NOTES" ]] && NOTES="version bump"

DATE=$(date +%Y-%m-%d)

echo "Bumping $CURRENT → $NEW"

# 1. version.json
cat > "$VERSION_FILE" <<EOF
{
  "version": $NEW,
  "released": "$DATE",
  "notes": "$NOTES"
}
EOF

# 2. index.html — BUNDLED_VERSION
sed -i.bak -E "s/var BUNDLED_VERSION = [0-9]+;/var BUNDLED_VERSION = $NEW;/" "$INDEX" && rm -f "$INDEX.bak"
# index.html — visible badge fallback (>v###<)
sed -i.bak -E "s/>v[0-9]+<\/span>/>v$NEW<\/span>/" "$INDEX" && rm -f "$INDEX.bak"

# 3. sw.js — CACHE_NAME
sed -i.bak -E "s/branch-manager-v[0-9]+/branch-manager-v$NEW/" "$SW" && rm -f "$SW.bak"

# 4. index.html — bump EVERY per-file ?v= cache-buster on script/link tags
# This makes each deploy pull fresh JS/CSS regardless of browser/SW cache.
sed -i.bak -E "s/(\.(js|css))\?v=[0-9]+/\1?v=$NEW/g" "$INDEX" && rm -f "$INDEX.bak"

# Verify all three agree
V_JSON=$(grep -o '"version": *[0-9]*' "$VERSION_FILE" | grep -o '[0-9]*')
V_HTML=$(grep -o 'BUNDLED_VERSION = [0-9]*' "$INDEX" | grep -o '[0-9]*' | head -1)
V_SW=$(grep -o 'branch-manager-v[0-9]*' "$SW" | grep -o '[0-9]*')

if [[ "$V_JSON" != "$NEW" || "$V_HTML" != "$NEW" || "$V_SW" != "$NEW" ]]; then
  echo "❌ MISMATCH after bump: version.json=$V_JSON  index.html=$V_HTML  sw.js=$V_SW"
  exit 1
fi

echo "✓ version.json: $V_JSON"
echo "✓ index.html:   $V_HTML (BUNDLED_VERSION)"
echo "✓ sw.js:        $V_SW (CACHE_NAME)"
echo ""
echo "Now: git add -A && git commit -m 'v$NEW: $NOTES' && git push"
