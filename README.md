# TicketShop MVP

German ticket shop + organizer panel (WAW Media / Frankfurt), modeled on ulaznice.de / MojaKarta IA — **not** a visual clone.

## Stack

- Nuxt 3 + Vue 3 + TypeScript + Tailwind
- **SQLite** via `sql.js` (WASM) → `.data/ticketshop.sqlite` (migrates JSON from `data/` on first boot)
- seats.io embed + Stripe Checkout (keys via **Admin → Settings**)
- Auth: **bcrypt** passwords + **httpOnly session cookie**
- Email: nodemailer SMTP / Resend / log stub
- PWA lite scanner (`/manifest.webmanifest` + `/sw.js`)

> **Note:** `better-sqlite3` needs native `make`/gyp; this environment uses `sql.js` instead. Same SQLite file format goal; swap to better-sqlite3/Prisma when build tools are available.

## Quick start

```bash
cd /workspace/ticketshop-mvp
npm install
npm run dev
```

Open **http://localhost:3000**.

### Logins (seeded)

| Email | Password | Role |
|-------|----------|------|
| `admin@ticketshop.local` | `admin` | full admin |
| `scanner@ticketshop.local` | `scanner` | QR scanner only |
| `client@ticketshop.local` | `client` | events / orders / payouts |

Open any-password demo is **off** unless `ALLOW_DEMO_LOGIN=true` **and** `NODE_ENV !== production`.

## Admin → Settings (paste keys here)

1. **seats.io** — Workspace Public Key, Secret Key, Region (`eu`/`na`/…)
2. **Per event** — Chart Key + Event Key on Combined events
3. **Stripe** — Publishable, Secret, Webhook Secret → `POST /api/checkout/webhook`
4. **Stripe Connect** — Platform + Connected account IDs (skeleton; payouts show mock split by commission %)
5. **E-Mail** — provider `log` | `smtp` | `resend` + From / SMTP or Resend API key (PDF tickets on fulfill)
6. **OTP VPOS** — optional stub
7. **Firma** — name, address, HRB, Steuernummer, USt-Id → Impressum / AGB / Datenschutz
8. **Commerce** — hold minutes (default 20), commission %, site URL

Secrets are **masked** after save. Never returned on `/api/public/*`.

## Public flows

| Route | Purpose |
|-------|---------|
| `/` `/archive` | Events (from SQLite / seed) |
| `/event/[slug]` | seats.io chart if workspace key set |
| `/checkout` | Stripe Checkout if keys set, else mock pay |
| `/checkout/success` | QR + PDF |
| `/ticket-find` | Find tickets (captcha word: `ticket`) |
| `/page/impressum` `/page/agb` `/page/datenschutz` | Legal from company settings |
| `/admin/scanner` | PWA-installable door scanner |

## Env list (`.env.example`)

| Var | Purpose |
|-----|---------|
| `NODE_ENV` | `development` / `production` |
| `ALLOW_DEMO_LOGIN` | `true` only for open demo login in non-prod |
| `NUXT_PUBLIC_SEATS_WORKSPACE_KEY` | optional fallback (prefer Settings) |
| `STRIPE_SECRET_KEY` | optional fallback |
| `NUXT_PUBLIC_SITE_URL` | public URL for redirects |
| `PORT` / `HOST` | listen bind |

## Deploy notes (Hetzner / Fly)

1. **Build:** `npm ci && npm run build` → run `.output/server/index.mjs` (Node 20+).
2. **TLS:** terminate with Caddy/nginx or Fly HTTPS; set `commerce.siteUrl` to `https://…`.
3. **Webhook:** Stripe Dashboard → `https://YOUR_DOMAIN/api/checkout/webhook` + paste `whsec_…` in Settings.
4. **Persistence:** mount volume for `.data/` (SQLite) — without it, DB resets on redeploy.
5. **Secrets:** prefer env/vault in production; Settings UI is fine for MVP/staging.
6. **Hetzner:** CX22+ VPS, Docker or systemd, Caddy for TLS, daily `cp .data/ticketshop.sqlite` backup.
7. **Fly.io:** `fly launch`, volume for `.data`, secrets via `fly secrets set`, health check `/`.
8. **seats.io / Stripe:** create real accounts → paste keys in Admin → Settings (no code change).
9. **Legal:** replace placeholders with lawyer-reviewed DE texts; fill Firma fields first.
10. **SMTP:** set From domain SPF/DKIM before live ticket mail.

## Ops

- Scanner `/admin/scanner` — installable PWA; manual code or camera
- Monitoring — failed payments, seats sync errors, hold release
- Payouts — mock platform/organizer split; Connect IDs in Settings
- Hold reaper client interval → `POST /api/holds/release-expired`

## Project layout

```
pages/            shop + admin
server/api/       auth, settings, checkout, webhook, holds, tickets, scanner
server/utils/     db (sql.js), store, settings, auth, mail, seatsio, tickets
.data/            ticketshop.sqlite (runtime)
data/             JSON seed (migrated once)
public/           manifest, sw.js, icons
```

## Shipped vs blocked on external accounts

| Feature | Status |
|---------|--------|
| SQLite persistence + JSON migrate | Shipped (sql.js) |
| bcrypt + session cookies | Shipped |
| Email SMTP/Resend wiring + log fallback | Shipped (needs real SMTP/Resend key to send) |
| PWA scanner | Shipped |
| Stripe Connect fields + mock split | Shipped (live transfers need Stripe Connect account) |
| DE legal templates + Firma tokens | Shipped (lawyer review still required) |
| seats.io live chart/book | Wiring ready — needs seats.io workspace |
| Stripe Checkout + webhook verify | Wiring ready — needs Stripe account |
| Domain / TLS / hosting | Docs only — needs your domain |

## License / demo

Internal WAW Media demo. Do not scrape or copy third-party shop CSS/images.

## Sitzplan (seats.io) — how it works

1. Create a free/paid account at [seats.io](https://www.seats.io) (Region **EU** for Germany).
2. Draw a seating chart → publish → create an **Event** for that chart → copy **Event Key**.
3. In TicketShop: **Admin → Settings → seats.io** paste **Workspace Public Key**, **Secret Key**, Region `EU`.
4. **Admin → Events → Edit** (type **Combined**): paste **Event Key** (and optional Chart Key). Never use `demo-*` placeholders.
5. Buyer opens `/event/[slug]` → live Sitzplan → selects seats → hold → checkout.

If Workspace Key is set but Event Key is missing/`demo-*`, the shop shows the **Placeholder** (category buttons) instead of the English seats.io error “The seating chart could not be loaded”.

## Import events from ulaznice.de

Upcoming events (title, date, venue, prices, description, poster) can be pulled without their seats.io keys:

```bash
# Write data/events-ulaznice.json
npm run import:ulaznice

# Replace seed data/events.json
npm run import:ulaznice:seed

# Push into a running instance (login as admin)
IMPORT_BASE=https://ticketshop-mvp.onrender.com \
  IMPORT_EMAIL=admin@ticketshop.local IMPORT_PASSWORD=admin \
  npm run import:ulaznice:push
```

Or in the admin UI after deploy: **Events → Import ulaznice.de** (`POST /api/admin/import-ulaznice`).

Imported events are `type: simple`. To enable Sitzplan later, switch to Combined and attach **your** seats.io Event Key (do not reuse ulaznice/Boommedia workspace keys).
