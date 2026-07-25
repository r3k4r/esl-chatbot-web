# App Hosting

Hosting for the Express/Bun backend server itself.

---

## For Development / Sharing With Frontend Devs

**Option A — Render (free)**
- Free tier: 750 hrs/mo (enough for 1 service)
- Auto-deploys on git push
- Caveat: spins down after 15 min of inactivity → slow cold start (~30s)
- Good enough for frontend devs to test against

**Option B — Railway (recommended if budget allows)**
- $5 trial credit, then ~$5–10/mo depending on usage
- No spin-down, always on
- Best DX: environment variable management is excellent
- Bun is supported natively

### Recommendation
- Use **Render free tier** while in active development (no cost, acceptable cold starts)
- Switch to **Railway** when frontend devs complain about cold starts or when you're close to launch

---

## For Production

| Service | Cost | Notes |
|---------|------|-------|
| **Railway** ⭐ | ~$10–20/mo | Best DX, Bun support, easy scaling |
| DigitalOcean App Platform | $5–12/mo | Simple, predictable, good support |
| Fly.io | ~$5–15/mo | More control, persistent VMs, good for WebSockets (Phase 9) |
| AWS ECS / Fargate | Variable | Overkill until significant scale |

**Recommendation for production: Railway or DigitalOcean App Platform**
- Railway if you prioritize DX and fast iteration
- DigitalOcean if you want predictable billing and are already using DO for DB/storage

---

## Deployment Notes

### Bun on hosting platforms
Most platforms (Railway, Render, Fly) support Bun natively or via Dockerfile.

Minimal `Dockerfile` when needed:
```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bunx prisma generate
EXPOSE 8000
CMD ["bun", "start"]
```

### Environment Variables
Set all `.env` variables in the platform dashboard or via Infisical (see [secrets.md](./secrets.md)).
Never commit `.env` to git.

### Health Check
The server exposes a health endpoint. Point your hosting platform's health check at:
```
GET /health
```

### Database Migrations on Deploy
Run migrations as part of your deploy pipeline, not in the app startup code:
```bash
bunx prisma migrate deploy && bun start
```

---

## Region
Deploy the backend in **eu-central-1 (Frankfurt)** or the closest available region
to match your Neon database. Keeping app and DB in the same region cuts latency
significantly.
