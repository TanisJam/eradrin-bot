# 🚀 Deployment Guide - Eradrin Bot

This guide covers deployment options for Eradrin Bot, with special focus on **Coolify** deployment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Coolify Deployment (Recommended)](#coolify-deployment-recommended)
- [Docker Compose Deployment](#docker-compose-deployment)
- [Manual Docker Deployment](#manual-docker-deployment)
- [Environment Variables](#environment-variables)
- [Persistence & Volumes](#persistence--volumes)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))
- ✅ Discord Client ID
- ✅ Discord Guild (Server) ID
- ✅ Google Gemini API Key ([Google AI Studio](https://makersuite.google.com/app/apikey))
- ✅ Git repository with your code

---

## Coolify Deployment (Recommended)

[Coolify](https://coolify.io) is a self-hosted Heroku/Netlify alternative. This is the recommended deployment method.

### Step 1: Create New Resource

1. Log in to your Coolify dashboard
2. Click **+ New Resource**
3. Select **Public Repository** or **Private Repository** (if using GitHub/GitLab)

### Step 2: Configure Repository

**Repository Settings:**
- **Repository URL**: `https://github.com/your-username/eradrin-bot.git`
- **Branch**: `main` or `develop`
- **Build Pack**: Select **Dockerfile**
- **Dockerfile Location**: `./Dockerfile` (default)

### Step 3: Environment Variables

Add the following environment variables in Coolify:

```bash
# Required
CLIENT_ID=your_discord_client_id_here
TOKEN=your_discord_bot_token_here
GUILD_ID=your_discord_guild_id_here
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
NODE_ENV=production
```

**Important:** Click **Save** after adding each variable.

### Step 4: Configure Volumes (Persistent Storage)

**⚠️ CRITICAL: Configure volumes to persist your database!**

In Coolify, go to **Volumes** section and add:

| Volume Name | Source Path | Destination Path | Description |
|-------------|-------------|------------------|-------------|
| `eradrin-db` | `/data/eradrin-bot/database.sqlite` | `/app/database.sqlite` | SQLite database |
| `eradrin-knowledge` | `/data/eradrin-bot/knowledge` | `/app/knowledge` | Knowledge base (optional) |

**Alternative syntax** (if using YAML configuration):

```yaml
volumes:
  - /data/eradrin-bot/database.sqlite:/app/database.sqlite
  - /data/eradrin-bot/knowledge:/app/knowledge:ro
```

### Step 5: Resource Limits (Optional but Recommended)

Set resource limits to prevent overconsumption:

```yaml
resources:
  limits:
    cpus: '1.0'
    memory: 512M
  reservations:
    cpus: '0.25'
    memory: 128M
```

### Step 6: Deploy

1. Click **Deploy** button
2. Monitor the build logs
3. Wait for the status to show **Running** (green)

### Step 7: Verify Deployment

**Check logs:**
```bash
# In Coolify, go to Logs tab and verify:
✅ "Eradrin is online!"
✅ "Database connection established"
✅ No error messages
```

**Test in Discord:**
- Use `/ping` command
- Bot should respond with "Pong!" and statistics

---

## Docker Compose Deployment

For self-hosted deployment using Docker Compose:

### Step 1: Clone Repository

```bash
git clone https://github.com/your-username/eradrin-bot.git
cd eradrin-bot
```

### Step 2: Create .env File

```bash
cp .env.example .env
nano .env  # or vim, code, etc.
```

Add your credentials:

```bash
CLIENT_ID=your_discord_client_id
TOKEN=your_discord_bot_token
GUILD_ID=your_discord_guild_id
GEMINI_API_KEY=your_gemini_api_key
```

### Step 3: Build and Run

```bash
# Build the image
docker compose build

# Start the bot
docker compose up -d

# Check logs
docker compose logs -f eradrin-bot
```

### Step 4: Stop/Restart

```bash
# Stop
docker compose down

# Restart
docker compose restart

# Update and redeploy
git pull
docker compose up -d --build
```

---

## Manual Docker Deployment

For deployment without Docker Compose:

### Step 1: Build Image

```bash
docker build -t eradrin-bot .
```

### Step 2: Run Container

```bash
docker run -d \
  --name eradrin-bot \
  --restart unless-stopped \
  -e CLIENT_ID=your_client_id \
  -e TOKEN=your_bot_token \
  -e GUILD_ID=your_guild_id \
  -e GEMINI_API_KEY=your_api_key \
  -e NODE_ENV=production \
  -v $(pwd)/database.sqlite:/app/database.sqlite \
  -v $(pwd)/knowledge:/app/knowledge:ro \
  eradrin-bot
```

### Step 3: Manage Container

```bash
# View logs
docker logs -f eradrin-bot

# Stop
docker stop eradrin-bot

# Start
docker start eradrin-bot

# Remove
docker rm -f eradrin-bot
```

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `CLIENT_ID` | ✅ Yes | Discord Application Client ID | `123456789012345678` |
| `TOKEN` | ✅ Yes | Discord Bot Token | `MTIzNDU2Nzg5MDEyMzQ1Njc4.GhIjKl.MnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrSt` |
| `GUILD_ID` | ✅ Yes | Discord Server (Guild) ID | `987654321098765432` |
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API Key | `AIzaSyA...` |
| `NODE_ENV` | ❌ No | Node environment | `production` |

**Security Note:** Never commit `.env` files to git. Always use environment variables or secrets management.

---

## Persistence & Volumes

### Database (`database.sqlite`)

**Location in container:** `/app/database.sqlite`

**What it stores:**
- User data
- Ping history
- Knowledge base embeddings
- Impersonation characters

**⚠️ IMPORTANT:**
- This file MUST be persisted as a volume
- Without persistence, all data is lost on container restart
- Backup regularly!

### Knowledge Base (`knowledge/`)

**Location in container:** `/app/knowledge`

**What it stores:**
- Player character information
- Campaign stories
- Custom knowledge for RAG system

**Recommended:** Mount as read-only (`:ro`) in production

### Backup Strategy

```bash
# Backup database
cp database.sqlite database.backup.$(date +%Y%m%d).sqlite

# In Coolify, you can use the backup feature or set up a cron job
# to copy the volume data regularly
```

---

## Troubleshooting

### Bot Not Starting

**Check logs:**
```bash
# Coolify: Use the Logs tab
# Docker Compose: docker compose logs -f
# Docker: docker logs -f eradrin-bot
```

**Common issues:**

1. **"Missing environment variables"**
   - Solution: Verify all required env vars are set in Coolify

2. **"Error logging in the bot"**
   - Solution: Check TOKEN is valid and bot has proper intents

3. **"Cannot find module"**
   - Solution: Rebuild the image (`docker compose build --no-cache`)

4. **"Database locked"**
   - Solution: Ensure only one instance is running

### Database Issues

**"Database connection failed"**
- Verify volume is properly mounted
- Check file permissions (should be writable by user `node`)
- In Coolify, ensure volume path exists on host

**"Lost all data after restart"**
- Volume not configured! See [Step 4 in Coolify Deployment](#step-4-configure-volumes-persistent-storage)

### Commands Not Working

**"This interaction failed"**
- Run `pnpm deploy:commands` to register slash commands
- Wait 1-2 minutes for Discord to sync commands globally

**"Unknown command"**
- Commands might not be registered
- Check bot has `applications.commands` scope

### Performance Issues

**High memory usage:**
- Adjust resource limits in docker-compose.yaml
- In Coolify: Set memory limits in Resource Limits section

**Slow responses:**
- Check Gemini API rate limits
- Verify network connectivity

---

## Updating the Bot

### Coolify

1. Push changes to your git repository
2. In Coolify, click **Redeploy** button
3. Monitor build logs
4. Verify bot reconnects

### Docker Compose

```bash
git pull
docker compose down
docker compose up -d --build
```

### Manual Docker

```bash
git pull
docker stop eradrin-bot
docker rm eradrin-bot
docker build -t eradrin-bot .
# Run container again (see Manual Docker Deployment)
```

---

## Health Checks

The Docker image includes a basic health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "process.exit(0)" || exit 1
```

**In Coolify:**
- Health check runs automatically
- Container will restart if unhealthy
- Check health status in dashboard

---

## Additional Resources

- **Discord.js Guide**: https://discordjs.guide/
- **Coolify Documentation**: https://coolify.io/docs
- **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review logs carefully
3. Ensure all environment variables are correct
4. Verify volumes are properly configured

For Coolify-specific issues, consult the [Coolify Discord](https://discord.gg/coolify).

---

**Last Updated:** 2025-10-10
**Author:** TanisJam
