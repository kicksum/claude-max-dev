# Claude Max MVP - Unlimited AI Conversations

Replace Claude Pro Max ($100/month) with your own unlimited system for ~$20-40/month!

## 🎯 Features (MVP)

- ✅ Unlimited Claude conversations
- ✅ Multiple simultaneous chats
- ✅ Real-time token & cost tracking
- ✅ Model selection (Haiku, Sonnet, Opus)
- ✅ Conversation history & search
- ✅ Clean, modern UI
- ✅ PostgreSQL storage
- ✅ Redis caching

## 📋 Prerequisites

- Docker & Docker Compose installed
- Anthropic API key (from console.anthropic.com)
- 4GB RAM, 100GB disk, 4 vCPUs (running on Max VM!)

## 🚀 Quick Start

### 1. Get Your API Key

Visit https://console.anthropic.com and create an API key.

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your API key
nano .env
```

Update these values in `.env`:
```bash
DB_PASSWORD=YourSecurePassword123!
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
JWT_SECRET=your-random-secret-string
```

### 3. Deploy Everything

```bash
# Build and start all services
docker compose up -d

# Watch the logs
docker compose logs -f
```

### 4. Access Claude Max

Open your browser to: **http://localhost:3000**

Or from another machine: **http://max-vm-ip:3000**

## 📊 Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🔧 Management Commands

```bash
# View logs
docker compose logs -f [service_name]

# Restart a service
docker compose restart backend

# Stop everything
docker compose down

# Stop and remove all data (⚠️ DANGER)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build

# Check status
docker compose ps
```

## 💰 Cost Tracking

Every message shows:
- Input tokens
- Output tokens
- Cost per message
- Running conversation total

Compare models:
- **Haiku 3.5**: $1/$5 per million tokens (cheapest!)
- **Sonnet 4**: $3/$15 per million tokens (balanced)
- **Opus 4**: $15/$75 per million tokens (premium)

## 🗄️ Database Access

```bash
# Connect to PostgreSQL
docker exec -it max_db psql -U claude -d claude_max

# Useful queries
SELECT * FROM conversations ORDER BY updated_at DESC LIMIT 10;
SELECT COUNT(*) FROM messages;
SELECT SUM(total_cost) FROM conversations;
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
docker compose logs backend

# Common issue: API key not set
docker compose exec backend env | grep ANTHROPIC
```

### Frontend can't connect to backend
```bash
# Verify backend is running
curl http://localhost:8000/health

# Should return: {"status":"ok","service":"claude-max-api"}
```

### Database connection errors
```bash
# Restart database
docker compose restart postgres

# Check if it's healthy
docker compose ps postgres
```

## 📈 Next Steps (After MVP)

Once you're comfortable with the MVP, add:
1. RAG document integration
2. Semantic search with vectors
3. Advanced analytics dashboard
4. Budget alerts & monitoring
5. Multi-user support

## 🔐 Security Notes

- Change default passwords in `.env`!
- Don't expose ports publicly without authentication
- Keep your API key secret
- Regularly backup your database

## 💾 Backup

```bash
# Backup database
docker exec max_db pg_dump -U claude claude_max > backup.sql

# Restore database
docker exec -i max_db psql -U claude claude_max < backup.sql

# Or just snapshot the whole VM in Proxmox!
```

## 🎉 You Did It!

You're now running your own Claude Pro Max Ultra replacement!

**Monthly cost**: ~$20-40 (just API usage)
**Savings**: ~$60-80/month vs Claude Pro Max
**Annual savings**: ~$720-960! 💰

Enjoy unlimited conversations without usage limits!

---

Built with ❤️ by an infrastructure guy who got tired of hitting usage limits
