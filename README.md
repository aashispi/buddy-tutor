# 🦉 Buddy Tutor — AI Study Pal (₹0/month Edition)

**Next.js PWA · Gemini 1.5 Flash (free) · Vercel (free) · Zero backend**

Upload a textbook chapter photo → Buddy teaches it step-by-step with Indian examples, fun quizzes, and infinite patience.

**Total cost for 200 sessions/month: ₹0**

---

## 🏗️ Architecture (why it's free)

```
Browser  →  Vercel Edge (Next.js API routes)  →  Gemini API
                       ↓
              Vercel Postgres (optional, free 256MB)
```

No Railway. No backend server. Everything runs as serverless functions on Vercel's free tier.

| Service | Free tier | Your usage at 200 sessions |
|---------|-----------|---------------------------|
| Vercel (hosting + API) | 100GB bandwidth, unlimited functions | ~50MB → ₹0 |
| Gemini 1.5 Flash | 1,500 req/day = 45,000/month | ~1,000/month → ₹0 |
| Vercel Postgres | 256MB storage, 60 compute hours | <1MB → ₹0 |
| **Total** | | **₹0/month** |

---

## 🚀 Setup in 10 Minutes

### 1. Get free Gemini API key
```
aistudio.google.com → Get API Key → Create API key → Copy it
```

### 2. Clone & run locally
```bash
git clone https://github.com/YOUR_USERNAME/buddy-tutor.git
cd buddy-tutor
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local → paste GEMINI_API_KEY=AIza...

npm run dev
# Open http://localhost:3000
```

### 3. Deploy to Vercel (3 clicks)
```
1. Push to GitHub
2. vercel.com → Import repository
3. Add env var: GEMINI_API_KEY = AIza...
4. Deploy → get your free URL!
```

### 4. Add GitHub Actions auto-deploy
Add one secret in GitHub → Settings → Secrets:
- `VERCEL_TOKEN` → get from vercel.com/account/tokens

Now every `git push main` auto-deploys ✅

---

## 📁 Project Structure

```
buddy-tutor/
├── app/
│   ├── page.tsx              # Home: grade + subject + upload
│   ├── learn/page.tsx        # Chat tutor screen
│   ├── api/
│   │   ├── chat/route.ts     # 🔑 Gemini proxy (server-side, key is safe)
│   │   └── progress/route.ts # Optional: saves to Vercel Postgres
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── BuddyAvatar.tsx
│   ├── ChatBubble.tsx        # Typing animation + quiz UI
│   ├── QuickReplies.tsx
│   ├── StarBurst.tsx
│   └── PWAInstallBanner.tsx
├── lib/
│   ├── store.ts              # Zustand state
│   └── db/migrate.ts         # Optional DB setup
└── .github/workflows/
    └── deploy.yml            # Auto-deploy on push
```

---

## 🔒 Security: Why the API key is safe

`GEMINI_API_KEY` has **no** `NEXT_PUBLIC_` prefix.

→ Next.js never ships it to the browser.
→ Only `/app/api/chat/route.ts` (runs on Vercel's server) can read it.
→ The browser calls `/api/chat` (your own domain), not Gemini directly.

---

## 📱 PWA Features

- Installable on Android via Chrome (Add to Home Screen prompt)
- Offline fallback via service worker
- Full-screen standalone mode (no browser chrome)
- Native camera for textbook photo

---

## ➕ Optional: Add Vercel Postgres (still free)

If you want to save progress/quiz scores:

1. Vercel Dashboard → Storage → Create → Postgres → Connect to project
2. Env vars auto-populate (`POSTGRES_URL` etc.)
3. Run migration: paste SQL from `lib/db/migrate.ts` in Vercel → Storage → Query tab
4. Done — `/api/progress` now saves data

---

## 🔮 When to upgrade (and what to add)

| Threshold | Action |
|-----------|--------|
| >200 sessions/day | Still free! Gemini limit is 1500/day |
| >1,000 sessions/month | Add Railway backend for rate limiting |
| Want phone OTP login | Add Fast2SMS + Railway for session auth |
| Want Play Store app | Wrap with Capacitor (2 commands) |
| >10,000 users | Upgrade Vercel to Pro ($20/month) |
