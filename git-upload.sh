#!/usr/bin/env bash

# Lightweight git helper for local pushes.
# Intentionally simple and manual to avoid template noise.

set -e

REPO_PATH="/Users/filipihadji/Documents/Designer Brasil /Mosca Tee/mosca-tee-_-editor-de-design-online-grátis---200"
BRANCH="main"

cd "$REPO_PATH" || { echo "Repository path not found: $REPO_PATH"; exit 1; }

echo "Repository: $REPO_PATH"
echo "Branch: $BRANCH"

echo
echo "1) Showing status and diff (press enter to continue)"
git status --short
echo
git --no-pager diff --stat
read -r -p "Stage all changes and continue? [y/N] " confirm
if [[ $confirm != "y" && $confirm != "Y" ]]; then
	echo "Aborted. No changes were pushed."
	exit 0
fi

git add .

read -r -p "Commit message (leave empty for default): " msg
if [[ -z "$msg" ]]; then
	msg="chore: update files"
fi
git commit -m "$msg" || echo "No changes to commit."

read -r -p "Push to origin/$BRANCH now? [y/N] " pushit
if [[ $pushit == "y" || $pushit == "Y" ]]; then
	git push origin "$BRANCH"
	echo "Pushed to origin/$BRANCH"
else
	echo "Skipped push. You can run: git push origin $BRANCH"
fi

echo "Done."
