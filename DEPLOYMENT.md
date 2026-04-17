# WebiGeeks Backend — Deployment Steps (Render + MongoDB Atlas)

## Prerequisites
- Node.js 20+
- A Render account → [render.com](https://render.com)
- A MongoDB Atlas account → [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

---

## Step 1 — Set Up MongoDB Atlas

### 1a — Create a free cluster
1. Sign in to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Click **Create** → Choose **M0 Free** tier
3. Select a cloud provider and region (pick **Singapore** for India-based users)
4. Click **Create Deployment**

### 1b — Create a database user
1. Go to **Security → Database Access → Add New Database User**
2. Set authentication method: **Password**
3. Username: `webigeeks-admin` (or any name)
4. Password: generate a strong password — **save it somewhere**
5. Role: **Atlas admin**
6. Click **Add User**

### 1c — Allow network access
1. Go to **Security → Network Access → Add IP Address**
2. Click **Allow Access from Anywhere** → this sets `0.0.0.0/0`
   > Render uses dynamic IPs so you cannot whitelist a specific IP on the free plan
3. Click **Confirm**

### 1d — Get the connection string
1. Go to **Deployment → Database → Connect**
2. Choose **Drivers**
3. Driver: **Node.js**, Version: **5.5 or later**
4. Copy the connection string — it looks like:
   ```
   mongodb+srv://webigeeks-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password from Step 1b
6. Add the database name before the `?`:
   ```
   mongodb+srv://webigeeks-admin:YOURPASSWORD@cluster0.xxxxx.mongodb.net/webigeeks_prep?retryWrites=true&w=majority
   ```
7. Save this full string — you'll need it as `MONGO_URI` in Render

---

## Step 2 — Generate Secure Secrets

Run this in your terminal to generate JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run it **twice** — save both outputs:
- First output → `JWT_SECRET`
- Second output → `ADMIN_JWT_SECRET`

---

## Step 3 — Create a GitHub Repo

```bash
# Inside the backend/ folder
git init
git add .
git commit -m "feat: WebiGeeks API initial commit"
```

Go to [github.com/new](https://github.com/new):
- Repository name: `webigeeks-backend`
- Visibility: **Private** (recommended — contains your server code)
- Click **Create repository**

```bash
git remote add origin https://github.com/YOUR_USERNAME/webigeeks-backend.git
git branch -M main
git push -u origin main
```

---

## Step 4 — Create a Render Web Service

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Click **Connect a repository** → authorize GitHub → select `webigeeks-backend`
3. Fill in the service settings:

| Setting | Value |
|---|---|
| **Name** | `webigeeks-api` |
| **Region** | Singapore (or Ohio for US) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

---

## Step 5 — Set Environment Variables

In Render → scroll down to **Environment Variables** → add each one:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `HOST` | `0.0.0.0` |
| `MONGO_URI` | *(full Atlas connection string from Step 1d)* |
| `JWT_SECRET` | *(first 64-char hex from Step 2)* |
| `ADMIN_JWT_SECRET` | *(second 64-char hex from Step 2)* |
| `ADMIN_EMAIL` | `admin@webigeeks.com` ← your admin login email |
| `ADMIN_PASSWORD` | *(choose a strong password — this is your admin panel login)* |
| `CLIENT_ORIGIN` | *(your Netlify URL — add after frontend is deployed, e.g. `https://webigeeks.netlify.app`)* |

> ⚠️ Never put real secrets in code or commit a `.env` file. All secrets live in Render's dashboard.

---

## Step 6 — Deploy

Click **Create Web Service**.

Render will:
1. Clone the repo
2. Run `npm install`
3. Run `npm start` → which connects to MongoDB and starts the Express server

Wait 2–5 minutes. Your API URL will look like:
```
https://webigeeks-api.onrender.com
```

Test it:
```
GET https://webigeeks-api.onrender.com/api/health
```

Expected response:
```json
{ "status": "ok", "message": "WebiGeeks API is running.", "dbStatus": "connected" }
```

---

## Step 7 — Seed the Database (one-time)

After the first successful deploy, populate MongoDB with all questions:

1. Render Dashboard → your service → **Shell** tab
2. Run:
   ```bash
   npm run seed
   ```
3. You should see:
   ```
   Connected to: mongodb+srv://...
   ✅ Seed complete:
      Inserted: 125
      Updated:  0
      Errors:   0
   ```

This only needs to be run once. It's safe to re-run (uses upsert).

---

## Step 8 — Update CORS After Frontend Deploy

Once your Netlify URL is known, go to:
Render → your service → **Environment** → update `CLIENT_ORIGIN`:

```
CLIENT_ORIGIN = https://webigeeks.netlify.app
```

Click **Save Changes** → Render auto-redeploys.

---

## Step 9 — Custom Domain (optional)

1. Render → Service Settings → **Custom Domains → Add Custom Domain**
2. Enter: `api.webigeeks.com`
3. Add a `CNAME` record in your DNS: `api.webigeeks.com` → `webigeeks-api.onrender.com`
4. Update `CLIENT_ORIGIN` on Render if you also set a custom domain for the frontend

---

## Redeployment

Every `git push` to `main` triggers an automatic redeploy on Render.

```bash
git add .
git commit -m "fix: update something"
git push
```

---

## Free Plan Notes

| Limitation | Details |
|---|---|
| **Cold starts** | Free tier spins down after 15 min of inactivity → first request after that takes ~50 seconds |
| **Fix for cold starts** | Use [cron-job.org](https://cron-job.org) — create a job that pings `https://webigeeks-api.onrender.com/api/health` every **14 minutes** |
| **Always-on** | Upgrade to **Starter plan ($7/mo)** to eliminate cold starts |

---

## Verifying the Deploy

- [ ] `GET /api/health` → `{ "status": "ok", "dbStatus": "connected" }`
- [ ] `GET /api/questions/html` → returns question array
- [ ] `POST /api/auth/register` → creates a pending user
- [ ] `POST /api/admin/login` → returns admin token
- [ ] Admin can approve students
- [ ] Approved user can login and progress saves correctly

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `dbStatus: "disconnected"` | Check `MONGO_URI` is correct; check Atlas Network Access allows `0.0.0.0/0` |
| `Cannot connect to port` | Check `HOST` is `0.0.0.0` and `PORT` is `10000` in Render env vars |
| CORS errors from frontend | Ensure `CLIENT_ORIGIN` exactly matches your Netlify URL (no trailing slash) |
| 401 on all requests | Check `JWT_SECRET` env var is set; old tokens become invalid when secret changes |
| Seed fails | Check `MONGO_URI` is correct and the database user has write permissions |
| Build fails on Render | Check build logs; usually a missing `package.json` field or syntax error |
