# 🤖 CLAUDE.md - Project Context & Rules

> **CRITICAL:** Read this ENTIRE file before making ANY changes to this project!

---

## 📋 PROJECT OVERVIEW

**Project Name:** Claude Max  
**Purpose:** Self-hosted Claude API interface with project management, RAG, and local LLM support  
**Owner:** Jeff (@kicksum)  
**Last Updated:** October 24, 2025

---

## 🏗️ ARCHITECTURE

### Two Separate Environments

```
┌─────────────────────────────────────┐
│ Windows 11 Laptop (Development PC)  │
│ - Run Claude Code here              │
│ - Edit code locally                 │
│ - Push to GitHub                    │
└──────────────┬──────────────────────┘
               │
               ↓ SSH / Git
               │
┌──────────────▼──────────────────────┐
│ Ubuntu Server (192.168.1.8)         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ DEV Environment                 │ │
│ │ Location: ~/claude-max-dev      │ │
│ │ Frontend: http://192.168.1.8:3001│ │
│ │ Backend:  http://192.168.1.8:8001│ │
│ │ Branch: development / master    │ │
│ │ Purpose: Active development     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ PROD Environment                │ │
│ │ Location: ~/claude-max-mvp      │ │
│ │ Frontend: http://192.168.1.8:3000│ │
│ │ Backend:  http://192.168.1.8:8000│ │
│ │ Branch: master                  │ │
│ │ Purpose: Live production        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## ⚠️ CRITICAL RULES

### 🚨 RULE #1: NEVER EDIT PROD DIRECTLY

```
❌ NEVER: cd ~/claude-max-mvp && edit files
✅ ALWAYS: cd ~/claude-max-dev && edit files
```

**Why:** PROD is production. Users are using it. Don't break it.

**Exception:** None. Zero. Nada. If PROD is broken, fix it in DEV and promote.

### 🚨 RULE #2: ALWAYS VERIFY YOUR LOCATION

Before making ANY changes:

```bash
pwd  # Where am I?

# Should see:
/home/jeff/claude-max-dev  ✅ Good!

# Should NOT see:
/home/jeff/claude-max-mvp  ❌ STOP! Wrong location!
```

### 🚨 RULE #3: CHECK GIT STATUS BEFORE & AFTER

```bash
# Before changes
git status  # Should be clean

# After changes  
git status  # Shows what you changed
git diff    # Review the changes
```

### 🚨 RULE #4: DON'T COMMIT USER DATA

Files that should NEVER be in Git:
- `backend/uploads/*` - User uploaded files
- `*.log` - Log files
- `*.sqlite` - Database files
- `.env` files with secrets

---

## 🔄 STANDARD WORKFLOW

### For Feature Development

```bash
# 1. Start in DEV
cd ~/claude-max-dev

# 2. Create feature branch
git checkout -b feature/my-new-feature

# 3. Make changes (you or Claude Code)
# ... edit files ...

# 4. Test locally
cd frontend && npm run dev
# Open http://192.168.1.8:3001 and test

# 5. Commit changes
git add .
git commit -m "feat: clear description of what changed"

# 6. Push to GitHub
git push origin feature/my-new-feature

# 7. Merge to master/development
git checkout master
git merge feature/my-new-feature
git push origin master

# 8. Promote to PROD
cd ~/claude-scripts
./promote-to-prod.sh

# 9. Verify PROD works
# Open http://192.168.1.8:3000 and test
```

### For Bug Fixes

```bash
# Same as above, but use branch name:
git checkout -b fix/description-of-bug
```

### For Emergency PROD Fixes

If PROD is completely broken and DEV takes too long:

```bash
# 1. Fix in DEV first anyway
cd ~/claude-max-dev
# ... make fix ...
git commit -m "fix: emergency fix for [problem]"
git push origin master

# 2. Quick deploy to PROD
cd ~/claude-max-mvp
git pull origin master
docker compose restart

# 3. Test immediately
curl http://localhost:8000/api/conversations
```

---

## 📁 PROJECT STRUCTURE

```
claude-max-dev/ (or claude-max-mvp/)
├── backend/
│   ├── src/
│   │   ├── index.js              # Main Express server
│   │   ├── routes/               # API endpoints
│   │   │   ├── conversations.js
│   │   │   ├── messages.js
│   │   │   ├── projects.js
│   │   │   └── rag.js
│   │   └── services/
│   │       ├── claude.service.js   # Anthropic API
│   │       ├── ollama.service.js   # Local LLM
│   │       ├── rag.service.js      # RAG functionality
│   │       └── embedding.service.js
│   ├── uploads/                  # ⚠️ User files (not in Git!)
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── page.js          # Main React component
│   │   ├── lib/
│   │   │   └── api.js           # API client functions
│   │   └── components/
│   │       └── FileUpload.jsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml           # ⚠️ Different in DEV vs PROD!
└── database/
    └── migrations/              # SQL migration files
```

---

## 🔧 KEY TECHNOLOGIES

- **Frontend:** Next.js 14, React, TailwindCSS
- **Backend:** Node.js, Express, PostgreSQL
- **AI:** Anthropic Claude API, Ollama (local)
- **Infrastructure:** Docker, Docker Compose
- **Database:** PostgreSQL (in Docker)
- **Git:** GitHub for version control

---

## 🎯 COMMON TASKS

### Start Development Server

```bash
cd ~/claude-max-dev

# Option 1: Docker (recommended)
docker compose up -d

# Option 2: Local dev (faster iteration)
cd frontend && npm run dev
cd backend && npm run dev
```

### View Logs

```bash
cd ~/claude-max-dev
docker compose logs -f

# Or specific service:
docker compose logs -f frontend
docker compose logs -f backend
```

### Database Access

```bash
cd ~/claude-max-dev

# Access PostgreSQL
docker compose exec postgres psql -U claude -d claude_max

# Backup database
docker compose exec postgres pg_dump -U claude claude_max > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U claude -d claude_max
```

### Run Migrations

```bash
cd ~/claude-max-dev/database/migrations

# Migrations are run automatically by promote-to-prod.sh
# Or manually:
cat migration.sql | docker compose exec -T postgres psql -U claude -d claude_max
```

---

## 🚀 DEPLOYMENT

### Automated (Recommended)

```bash
cd ~/claude-scripts
./promote-to-prod.sh
```

**What it does:**
1. ✅ Checks for uncommitted changes
2. ✅ Shows what's being promoted
3. ✅ Backs up PROD database
4. ✅ Merges DEV → PROD
5. ✅ Preserves PROD's docker-compose.yml
6. ✅ Runs database migrations
7. ✅ Rebuilds containers
8. ✅ Health checks
9. ✅ Shows summary

### Manual (If Script Fails)

```bash
# 1. Backup PROD database
cd ~/claude-max-mvp
docker compose exec postgres pg_dump -U claude claude_max > ~/backup-$(date +%Y%m%d).sql

# 2. Pull latest code
git pull origin master

# 3. Rebuild and restart
docker compose down
docker compose build --no-cache
docker compose up -d

# 4. Verify
curl http://localhost:8000/api/conversations
```

---

## 🐛 DEBUGGING TIPS

### Frontend Issues

```bash
# Check browser console (F12)
# Look for React errors, API call failures

# Check Next.js logs
cd ~/claude-max-dev/frontend
npm run dev
# Watch terminal for errors
```

### Backend Issues

```bash
# Check backend logs
cd ~/claude-max-dev
docker compose logs -f backend

# Common issues:
# - Database connection failed → Check PostgreSQL is running
# - API key invalid → Check .env file
# - Port already in use → Change port in docker-compose.yml
```

### Database Issues

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Reset database (⚠️ loses data!)
docker compose down -v
docker compose up -d
```

---

## 📝 GIT BRANCHING STRATEGY

```
master (or main)
├─ feature/new-feature      # New features
├─ fix/bug-description      # Bug fixes
├─ refactor/description     # Code refactoring
└─ chore/description        # Maintenance tasks
```

### Branch Naming

```bash
# Features
git checkout -b feature/add-dark-mode
git checkout -b feature/export-conversations

# Fixes
git checkout -b fix/project-assignment-bug
git checkout -b fix/memory-leak

# Refactoring
git checkout -b refactor/cleanup-api-code

# Chores
git checkout -b chore/update-dependencies
```

---

## 🔑 ENVIRONMENT VARIABLES

### DEV (.env)

```bash
# Backend
DATABASE_URL=postgresql://claude:password@postgres:5432/claude_max
ANTHROPIC_API_KEY=sk-ant-...
OLLAMA_HOST=http://192.168.1.7:11434
RAG_HOST=http://192.168.1.16:8000

# Frontend
NEXT_PUBLIC_API_URL=http://192.168.1.8:8001
```

### PROD (.env)

```bash
# Backend
DATABASE_URL=postgresql://claude:password@postgres:5432/claude_max
ANTHROPIC_API_KEY=sk-ant-...
OLLAMA_HOST=http://192.168.1.7:11434
RAG_HOST=http://192.168.1.16:8000

# Frontend
NEXT_PUBLIC_API_URL=http://192.168.1.8:8000
```

**⚠️ Notice:** Only the API URLs differ between DEV and PROD!

---

## 🤖 WORKING WITH CLAUDE CODE

### When Using Claude Code

**Always specify the environment:**

```
❌ "Add Ollama support"
✅ "Add Ollama support to DEV environment (~/claude-max-dev)"

❌ "Fix this bug"
✅ "Fix this bug in ~/claude-max-dev/frontend/src/app/page.js"

❌ "Update the database"
✅ "Update the DEV database in ~/claude-max-dev"
```

### After Claude Makes Changes

```bash
# Always verify:
pwd                    # Am I in DEV?
git status            # What changed?
git diff              # Review changes
npm run dev           # Test it!
git add .             # Stage changes
git commit -m "..."   # Commit
```

### If Claude Edited Wrong Environment

```bash
cd ~/claude-max-mvp  # If in PROD by mistake

# Undo everything:
git restore .

# Then tell Claude:
"You edited PROD by mistake. Please make those changes in DEV instead (~/claude-max-dev)"
```

---

## 🎨 CODE STYLE GUIDELINES

### JavaScript/React

- Use `const` for everything unless you need `let`
- Use arrow functions: `const func = () => {}`
- Use async/await, not `.then()`
- Add JSDoc comments to functions
- Use descriptive variable names

### Commits

```bash
# Good commits:
git commit -m "feat: add project assignment dropdown"
git commit -m "fix: resolve React state bug in handleAssignToProject"
git commit -m "refactor: improve API error handling"
git commit -m "docs: update README with deployment instructions"

# Bad commits:
git commit -m "fixed stuff"
git commit -m "update"
git commit -m "asdf"
```

### Types of commits:

- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring
- `docs:` Documentation
- `style:` Formatting, whitespace
- `test:` Adding tests
- `chore:` Maintenance

---

## 📚 USEFUL COMMANDS CHEAT SHEET

```bash
# Check where you are
pwd

# Check git status
git status

# See recent commits
git log --oneline -10

# See what changed in a file
git diff filename

# Undo uncommitted changes
git restore filename
git restore .  # All files

# Start DEV servers
cd ~/claude-max-dev && docker compose up -d

# Restart PROD
cd ~/claude-max-mvp && docker compose restart

# View logs
docker compose logs -f

# Deploy to PROD
cd ~/claude-scripts && ./promote-to-prod.sh

# Backup database
docker compose exec postgres pg_dump -U claude claude_max > backup.sql
```

---

## 🆘 EMERGENCY CONTACTS

- **Owner:** Jeff
- **GitHub Repo:** https://github.com/kicksum/claude-max-dev
- **Issues:** Create a GitHub issue or start a Claude conversation with this file

---

## 📖 KNOWN ISSUES & GOTCHAS

### 1. React State Async Issue

**Problem:** After updating state, the variable still has the old value  
**Solution:** Return data from functions, don't rely on state immediately

```javascript
// ❌ Wrong
await loadData();
const data = stateVariable;  // Old value!

// ✅ Correct
const data = await loadData();  // Fresh value immediately
```

### 2. Docker Port Conflicts

**Problem:** `Error: Port 3000 already in use`  
**Solution:** Check if another service is running

```bash
sudo lsof -i :3000
# Kill the process or change port in docker-compose.yml
```

### 3. Database Connection Fails

**Problem:** `Error: connect ECONNREFUSED postgres:5432`  
**Solution:** Wait for PostgreSQL to fully start

```bash
docker compose up -d postgres
sleep 5
docker compose up -d
```

### 4. Frontend Shows 404

**Problem:** Next.js routing not working  
**Solution:** Check `frontend/src/app/` structure, rebuild

```bash
cd ~/claude-max-dev/frontend
rm -rf .next
npm run build
docker compose restart frontend
```

---

## 🎓 LEARNING RESOURCES

- **Next.js Docs:** https://nextjs.org/docs
- **React Docs:** https://react.dev
- **Anthropic API:** https://docs.anthropic.com
- **Docker Compose:** https://docs.docker.com/compose
- **Ollama:** https://ollama.ai/docs

---

## ✅ PRE-FLIGHT CHECKLIST

Before starting work, verify:

- [ ] I'm in DEV environment (`pwd` shows `claude-max-dev`)
- [ ] Git status is clean (`git status`)
- [ ] I know what I'm changing and why
- [ ] I've read the relevant code sections
- [ ] I have a plan to test my changes
- [ ] I know how to rollback if something breaks

Before deploying to PROD, verify:

- [ ] Changes tested thoroughly in DEV
- [ ] All tests pass (if you have tests)
- [ ] Git commits have clear messages
- [ ] Database backup exists (script does this)
- [ ] I'm ready to monitor PROD after deployment
- [ ] I know how to rollback if needed

---

## 🔄 VERSION HISTORY

- **v1.0** (Oct 24, 2025): Initial CLAUDE.md created after successful project debugging session
- Added: Project architecture, rules, workflows, common tasks
- Added: Deployment procedures, debugging tips, gotchas

---

## 💡 FINAL REMINDERS

1. **DEV first, PROD later.** Always.
2. **Test before you deploy.** Every time.
3. **Commit often with clear messages.** Future-you will thank you.
4. **When in doubt, ask questions.** Better safe than sorry.
5. **Claude has no memory between conversations.** Paste this file at the start!

---

**Last Updated:** October 24, 2025  
**Maintained By:** Jeff & Claude  
**Next Review:** When things change significantly

---

## 📞 AT THE START OF EVERY CONVERSATION

**Paste this into Claude:**

```
I'm working on the Claude Max project. Here's the context:

[paste entire CLAUDE.md file]

Current task: [describe what you need to do]
Environment: [DEV or PROD]
Location: [current directory]
```

This ensures Claude knows the rules and context! 🎯
---

## 🆕 RECENT UPDATES

### v1.1.0 - Conversation Context & Model Tracking (Oct 31, 2025)

**Major Features Added:**

1. **Full Conversation Context** ✅
   - Models now receive entire conversation history
   - Multi-turn conversations work naturally
   - AI remembers everything said in the chat
   - No more "I don't have that information" errors

2. **Model Tracking & Badges** ✅
   - Every response shows which model generated it
   - Visual badges: ☁️ for Claude, 🖥️ for local models
   - Database tracks `model_used` for each message
   - Easy to see costs per model

3. **Model Persistence** ✅
   - Model selection saves per conversation
   - Switching conversations remembers your model choice
   - No more resetting to default

4. **UI Improvements** ✅
   - Subtle, transparent file upload area
   - Balanced input/upload sizing
   - Better visual hierarchy

**Database Changes:**
```sql
-- New column tracks which model generated each response
ALTER TABLE messages ADD COLUMN model_used VARCHAR(100);
CREATE INDEX idx_messages_model_used ON messages(model_used);

-- Conversations now persist model selection
-- conversations.model column is now actively used
```

**Files Modified:**
- `backend/src/routes/messages.js` - Full conversation history logic
- `backend/src/services/conversation.service.js` - Model tracking support
- `frontend/src/app/page.js` - Model badges and persistence
- `frontend/src/components/FileUpload.css` - Subtle styling
- `database/migrations/001_add_model_tracking.sql` - Schema updates

**Testing:**
```bash
# Test conversation context
You: "My name is Jeff"
AI: [responds]
You: "What's my name?"
AI: "Your name is Jeff" ✅

# Test model persistence
1. Select llama3:8b
2. Send message
3. Switch conversations
4. Return - should still show llama3:8b ✅

# Test model badges
- Every AI response shows model badge ✅
```

**Performance Notes:**
- Input tokens increased (2-10x for long conversations)
- Output quality significantly improved
- Cost impact acceptable for better responses
- Can limit history depth if needed (see messages.js line 157)

**Known Issues:**
- None currently identified

**Rollback:**
If needed, restore from backups created during deployment:
```bash
cd ~/claude-max-dev/backups/[timestamp]/
cp * ../../backend/src/routes/
docker compose restart
```

---
