# Running Fete Store Manager on a VPS

This app runs as a single Node/Express process that serves the REST API and the built React frontend from one place. A lightweight Caddy reverse proxy sits in front of it, which keeps the deployment simple.

```
Browser ──▶ Caddy (:80/:443) ──▶ Node server (:8080) ──▶ fete_store.db (SQLite file)
                                   │
                                   └─ serves frontend/dist (static React app)
```

> Security note: the original auth model is kept as-is. PINs are stored in plaintext and the session lives only in the browser. That is fine for a trusted internal deployment, but it is not hardened for the public internet.

## Recommended deployment

Use this path for a simple VPS setup. There is no Docker workflow in the supported deployment anymore.

### 1. Provision the server

On an Ubuntu 22.04/24.04 VPS, install the basics:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Create the app user and copy the repo onto the server:

```bash
sudo useradd --system --create-home --home-dir /opt/fete-store --shell /bin/bash fete || true
sudo mkdir -p /opt/fete-store
sudo chown -R fete:fete /opt/fete-store
cd /opt/fete-store
sudo -u fete git clone <your-repo-url> .
```

### 2. Create the database

The app uses a single SQLite file. Create it once:

```bash
cd /opt/fete-store
node db/init-sqlite.cjs
```

This creates the database file at /opt/fete-store/fete_store.db with schema and demo data.

### 3. Build the frontend and install server dependencies

```bash
cd /opt/fete-store/frontend
npm install
npm run build

cd /opt/fete-store/server
npm install
```

### 4. Run the app as a service

```bash
sudo cp /opt/fete-store/deploy/fete-store.service /etc/systemd/system/fete-store.service
sudo systemctl daemon-reload
sudo systemctl enable --now fete-store
journalctl -u fete-store -f
```

### 5. Configure Caddy

Replace your domain and copy the config:

```bash
sudo tee /etc/caddy/Caddyfile >/dev/null <<'CADDY'
your-domain.example.com {
    handle /api* {
        reverse_proxy 127.0.0.1:8080
    }

    root * /opt/fete-store/frontend/dist
    try_files {path} {path}/ /index.html
    file_server
}
CADDY

sudo systemctl reload caddy
```

Point your domain's DNS A record at the VPS IP, then open the firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'WWW Full'
sudo ufw enable
```

Visit https://your-domain.example.com and log in with alice@charity.org / 1234.

## Updating after code changes

```bash
cd /opt/fete-store && git pull
cd frontend && npm install && npm run build
cd ../server && npm install
sudo systemctl restart fete-store
sudo systemctl reload caddy
```

## Backing up the database

The whole database is one file: /opt/fete-store/fete_store.db. Back it up while the app is stopped or use SQLite's online backup:

```bash
sqlite3 /opt/fete-store/fete_store.db ".backup /opt/backups/fete_store-$(date +%F).db"
```

## Local development

From the repo root:

```bash
npm install
npm run dev
```

The API runs on port 8080 and the Vite frontend runs on http://localhost:5173.

If the database file does not exist yet, create it first:

```bash
node db/init-sqlite.cjs
```

## How the pieces fit together

- server/src/index.ts sets up the global Retool database connection, auto-discovers the backend handlers in backend/fete, and exposes each as POST /api/<functionName>.
- server/src/db.ts opens fete_store.db, which is the single SQLite database file used by the app.
- frontend/hooks/backend/fete.ts is a small fetch client that posts to /api/<functionName>.
- In production, the Node server also serves frontend/dist with an SPA fallback, so the API and app share one origin.
