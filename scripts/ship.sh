#!/bin/bash

# --- DeepMind-style Root-Aware Git Automation ---

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Hardware/Path Intelligence: Find the true root of the repo
# This command finds the folder containing the .git directory
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

if [ -z "$REPO_ROOT" ]; then
    echo -e "${RED}❌ Error: This folder is not part of a git repository.${NC}"
    exit 1
fi

# 2. Automatically move to the root so paths are always correct
cd "$REPO_ROOT"

echo -e "${BLUE}🚀 Deployment Pipeline: Working in $REPO_ROOT${NC}"

# 3. Handle Commit Message
COMMIT_MSG=$1
if [ -z "$COMMIT_MSG" ]; then
    echo -e "${BLUE}📝 No commit message provided.${NC}"
    read -p "Enter commit message: " COMMIT_MSG
fi

# 4. Staging
echo -e "${BLUE}📦 Staging changes...${NC}"
git add .

# 5. Committing
echo -e "${BLUE}💾 Committing:${NC} \"$COMMIT_MSG\""
git commit -m "$COMMIT_MSG"

# 6. Pushing
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}☁️  Pushing to origin/$CURRENT_BRANCH...${NC}"
git push origin "$CURRENT_BRANCH"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully shipped to GitHub from $(pwd)${NC}"
else
    echo -e "${RED}❌ Push failed.${NC}"
    exit 1
fi