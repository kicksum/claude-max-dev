#!/bin/bash
# deploy-conversation-context.sh
# Deploys conversation context and model tracking updates to claude-max-dev
# Date: 2025-10-29

set -e  # Exit on error

echo "🚀 Claude Max - Conversation Context Deployment"
echo "================================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check we're in DEV
CURRENT_DIR=$(pwd)
if [[ ! "$CURRENT_DIR" =~ claude-max-dev$ ]]; then
    echo -e "${RED}❌ ERROR: Not in claude-max-dev directory!${NC}"
    echo "Current directory: $CURRENT_DIR"
    echo "Please run: cd ~/claude-max-dev && ./deploy-conversation-context.sh"
    exit 1
fi

echo -e "${GREEN}✅ Confirmed: Running in DEV environment${NC}"
echo ""

# Check if update files exist
if [ ! -f "001_add_model_tracking.sql" ]; then
    echo -e "${RED}❌ ERROR: 001_add_model_tracking.sql not found${NC}"
    echo "Please place all update files in ~/claude-max-dev/"
    exit 1
fi

if [ ! -f "messages.js" ] || [ ! -f "conversation.service.js" ]; then
    echo -e "${RED}❌ ERROR: Updated backend files not found${NC}"
    echo "Please place messages.js and conversation.service.js in ~/claude-max-dev/"
    exit 1
fi

echo -e "${BLUE}📦 Files found:${NC}"
echo "  - 001_add_model_tracking.sql"
echo "  - messages.js"
echo "  - conversation.service.js"
echo ""

# Confirm with user
echo -e "${YELLOW}⚠️  This will:${NC}"
echo "  1. Run database migration (add model_used column)"
echo "  2. Backup current backend files"
echo "  3. Update backend routes and services"
echo "  4. Restart Docker containers"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "🗄️  STEP 1: Database Migration"
echo "================================"

# Check if PostgreSQL is running
if ! docker compose ps postgres | grep -q "Up"; then
    echo -e "${RED}❌ ERROR: PostgreSQL container not running${NC}"
    echo "Please start containers: docker compose up -d"
    exit 1
fi

echo "Running migration..."
cat 001_add_model_tracking.sql | docker compose exec -T postgres psql -U claude -d claude_max

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database migration complete${NC}"
else
    echo -e "${RED}❌ Migration failed!${NC}"
    exit 1
fi

echo ""
echo "💾 STEP 2: Backup Current Files"
echo "================================"

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

cp backend/src/routes/messages.js "$BACKUP_DIR/messages.js.backup"
cp backend/src/services/conversation.service.js "$BACKUP_DIR/conversation.service.js.backup"

echo -e "${GREEN}✅ Backups saved to: $BACKUP_DIR${NC}"

echo ""
echo "🔄 STEP 3: Update Backend Files"
echo "================================"

cp messages.js backend/src/routes/messages.js
cp conversation.service.js backend/src/services/conversation.service.js

echo -e "${GREEN}✅ Backend files updated${NC}"

echo ""
echo "🐳 STEP 4: Restart Containers"
echo "================================"

echo "Restarting backend..."
docker compose restart backend

# Wait for backend to be healthy
echo "Waiting for backend to start..."
sleep 5

# Health check
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/api/conversations)

if [ "$HEALTH_CHECK" == "200" ]; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check returned: $HEALTH_CHECK${NC}"
    echo "Check logs: docker compose logs -f backend"
fi

echo ""
echo "🧪 STEP 5: Verification"
echo "================================"

# Check if model_used column exists
MODEL_COLUMN_CHECK=$(docker compose exec -T postgres psql -U claude -d claude_max -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='messages' AND column_name='model_used';")

if [[ $MODEL_COLUMN_CHECK =~ "model_used" ]]; then
    echo -e "${GREEN}✅ Database: model_used column exists${NC}"
else
    echo -e "${RED}❌ Database: model_used column NOT found${NC}"
fi

# Check if files updated
if grep -q "BUILD FULL CLAUDE MESSAGE HISTORY" backend/src/routes/messages.js; then
    echo -e "${GREEN}✅ Code: Conversation context enabled${NC}"
else
    echo -e "${YELLOW}⚠️  Code: Conversation context may not be enabled${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo "1. Test conversation context:"
echo "   - Open http://192.168.1.8:3001"
echo "   - Start a chat and say 'My name is Jeff'"
echo "   - Then ask 'What's my name?'"
echo "   - Claude should respond with 'Jeff'"
echo ""
echo "2. Check backend logs:"
echo "   docker compose logs -f backend | grep 'Sending.*messages to Claude'"
echo "   Should show: 'Sending X messages to Claude (full history)'"
echo ""
echo "3. Apply frontend patches from IMPLEMENTATION_GUIDE.md"
echo "   (Model badges and persistence require frontend changes)"
echo ""
echo "4. If everything works, promote to PROD:"
echo "   cd ~/claude-scripts && ./promote-to-prod.sh"
echo ""
echo "📁 Backups saved to: $BACKUP_DIR"
echo ""
echo "🆘 To rollback:"
echo "   cp $BACKUP_DIR/* backend/src/routes/"
echo "   docker compose restart backend"
echo ""
