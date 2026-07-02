# Event Payment App

A simple guest payment page that generates a UPI QR code and logs every
submission (name, relation, amount) to a small backend.

## What's inside

- **server.js** — Express backend. Two main endpoints:
  - `POST /api/submissions` — saves a guest's name/relation/amount
  - `GET /api/submissions` — lists all saved submissions (used by admin.html)
- **public/index.html** — the payment form (your original page, now calls the backend)
- **public/qrpage.html** — shows the UPI QR code after submission
- **public/admin.html** — simple table view of all submissions, for the host
- **data/db.json** — where submissions are stored (a small JSON file via `lowdb`, no database server needed)

## Before you deploy

1. Open `public/index.html` and replace this line with your real UPI ID:

   ```js
   const upiId = "yourupi@bank";
   ```

2. Set an admin password (used to view `/admin.html` and the submissions list).
   Copy `.env.example` to `.env` and edit it:

   ```
   ADMIN_USER=admin
   ADMIN_PASSWORD=pick-a-real-password
   ```

   On Render, set these as **Environment Variables** in the dashboard instead
   of using a `.env` file (see deploy steps below).

## Run locally

```bash
npm install
cp .env.example .env   # then edit .env with your own password
npm start
```

Then open http://localhost:3000 in your browser.
Admin view: http://localhost:3000/admin.html (will prompt for the username/password you set)

## Deploying for free — Render.com

1. Push this folder to a new GitHub repo.
2. Go to https://render.com → sign up (free) → **New +** → **Web Service**.
3. Connect your GitHub repo.
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Under **Environment**, add:
   - `ADMIN_USER` = your chosen admin username
   - `ADMIN_PASSWORD` = your chosen admin password
6. Click **Create Web Service**. Render will give you a public URL like
   `https://your-app.onrender.com` within a couple of minutes.

### Note on data persistence on the free tier

Render's free web services use ephemeral disk — if the service restarts or
redeploys, `data/db.json` resets to empty. For a one-off event this is
usually fine since you'll just check submissions during the event window.
If you need submissions to survive restarts long-term, either:
- Upgrade to a Render paid plan and add a **persistent disk**, or
- Swap the storage for a free hosted database (e.g. a free tier of
  Postgres on Render/Supabase/Neon) — ask and this can be wired up.

## Viewing submissions

Visit `/admin.html` on your deployed URL (e.g.
`https://your-app.onrender.com/admin.html`) to see everyone who has
submitted the form, with name, relation, amount, and timestamp. You'll be
prompted for the `ADMIN_USER` / `ADMIN_PASSWORD` you set.
