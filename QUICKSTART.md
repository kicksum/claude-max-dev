# 🚀 QUICKSTART - Get Running in 5 Minutes

## Step 1: Get Your Anthropic API Key

1. Go to https://console.anthropic.com
2. Create an account or sign in
3. Navigate to API Keys
4. Create a new API key
5. Copy it (starts with `sk-ant-...`)

## Step 2: Copy Files to Max VM

On your workstation:
```bash
# If you have the files locally, SCP them to Max:
scp -r claude-max-mvp jeff@max-ip:~/
```

Or on Max VM:
```bash
# Clone or download the files
cd ~
# Files should be in ~/claude-max-mvp/
```

## Step 3: Configure

```bash
cd ~/claude-max-mvp

# Create .env from template
cp .env.example .env

# Edit and add your API key
nano .env
```

Change these lines in `.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
DB_PASSWORD=YourSecurePassword123!
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

## Step 4: Deploy!

```bash
# Run the deployment script
./deploy.sh
```

That's it! The script will:
- ✅ Check dependencies
- ✅ Build containers
- ✅ Start all services
- ✅ Show you the URL

## Step 5: Access Claude Max

Open your browser to: **http://max-ip:3000**

(Replace `max-ip` with your VM's IP address, or use `localhost` if browsing from Max)

## 🎉 You're Done!

- Click **"+ New Chat"** to start
- Select your model (Haiku for cheap, Sonnet for balanced, Opus for premium)
- Start chatting with unlimited Claude!

## 💡 Common Commands

```bash
# View logs
docker compose logs -f

# Restart everything
docker compose restart

# Stop everything
docker compose down

# Check service status
docker compose ps
```

## 📊 Check Costs

Every message shows you:
- Tokens used (input ↑ / output ↓)
- Cost per message
- Running total for the conversation

Total cost appears in the sidebar for each conversation!

## 🆘 Need Help?

Check the full README.md for troubleshooting and advanced features.

---

**You're now saving $60-80/month!** 🎊
