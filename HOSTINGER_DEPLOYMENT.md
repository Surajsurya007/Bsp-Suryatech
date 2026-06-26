# BSP Suryatech — Hostinger Production Deployment Guide & Readiness Checklist

This deployment manual provides the concrete steps, configurations, and migration files to cleanly deploy your high-performance React (Vite) + Node.js (Express) full-stack system onto a Hostinger VPS or custom cloud architecture.

---

## 📋 Table of Contents
1. **Hostinger VPS Deployment Guide**
2. **Production Environment Variables Template**
3. **Database Schema Setup (Supabase / PostgreSQL)**
4. **Production Configuration (PM2 & Nginx)**
5. **Media Storage and Uploads Management**
6. **Pre-Flight Launch Verification Checklist**

---

## 1. Hostinger VPS Deployment Guide

Your full-stack application operates on an Express backend hosting a React single-page frontend. To run this efficiently on Hostinger VPS under your domain name:

### Step 1: Pre-requisites & Hosting Setup
1. Log in to your Hostinger hPanel and navigate to **VPS Dashboard**.
2. Opt for an **Ubuntu (22.04 LTS or 24.04 LTS)** OS template.
3. Ensure you have SSH access. Run:
   ```bash
   ssh root@YOUR_VPS_IP
   ```

### Step 2: Runtime Environment Installation
Update system packages and install Node.js (v18+ or v20+ recommended), npm, and Git:
```bash
# Update Packages
sudo apt update && sudo apt upgrade -y

# Install Node.js LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Installations
node -v
npm -v
```

### Step 3: Clone and Build Code Base
1. Clone your project code or upload the ZIP package directly to `/var/www/bsp-suryatech`.
2. Run installation and build scripts:
   ```bash
   cd /var/www/bsp-suryatech
   npm install --omit=dev
   npm run build
   ```
3. Establish your persistent dynamic directories to house local uploaded files on Hostinger:
   ```bash
   mkdir -p uploads/images uploads/pdfs uploads/videos downloads/software
   chmod -R 775 uploads downloads
   ```

---

## 2. Production Environment Variables Template

Create a secure `.env` file inside your Hostinger production server root directory (`/var/www/bsp-suryatech/.env`). 

> ⚠️ **IMPORTANT**: Never commit your active `.env` file to public code repositories.

```env
# ==========================================
# BSP Suryatech — Hostinger Production Configuration
# ==========================================

NODE_ENV=production
PORT=3000

# Server Host Binding (Set to localhost for Nginx reverse proxy)
HOST=127.0.0.1

# JWT Token Cryptographic Secret (Replace with a random 64-char string)
JWT_SECRET=your_production_secure_jwt_secret_here

# Admin Panel Credentials
ADMIN_EMAIL=your_admin_email_here@example.com
ADMIN_PASSWORD=your_production_secure_password_here

# ==========================================
# Supabase Cloud Database Integration
# ==========================================
# Paste your Supabase project parameters below to allow full master-slave dual writes
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 3. Database Schema Setup (Supabase / PostgreSQL)

Run the following SQL migration script in your **Supabase Dashboard > SQL Editor** to establish proper indexes, tables, and system tables.

```sql
-- =========================================================
-- BSP SURYATECH — PRODUCTION SCHEMA MIGRATION
-- =========================================================

-- Enable UUID Extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Products Catalog Table with Status & Manual Fields
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    size VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) NULL,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT NOT NULL,
    download_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    connected_plan VARCHAR(255) NULL,
    category VARCHAR(255) NULL DEFAULT 'Retail & POS Billing',
    full_description TEXT NULL,
    system_requirements TEXT NULL,
    license_info TEXT NULL,
    demo_video_url VARCHAR(255) NULL,
    gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
    manual_url VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- 2. Video Tutorials Setup Table 
CREATE TABLE IF NOT EXISTS public.video_tutorials (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    youtube_id VARCHAR(255) NOT NULL,
    thumbnail VARCHAR(255) NOT NULL,
    description TEXT NULL
);

-- 3. License Keys Tracking Table
CREATE TABLE IF NOT EXISTS public.licenses (
    id VARCHAR(255) PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    license_key VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    activated_at TIMESTAMP WITH TIME ZONE NULL,
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    hwid VARCHAR(255) NULL
);

CREATE INDEX IF NOT EXISTS idx_licenses_email ON public.licenses(user_email);
CREATE INDEX IF NOT EXISTS idx_licenses_key ON public.licenses(license_key);

-- 4. Orders Ledger
CREATE TABLE IF NOT EXISTS public.orders (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID DEFAULT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    rzp_payment_id VARCHAR(255) NULL,
    rzp_order_id VARCHAR(255) NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 5. Payments Transaction History Record (Verifiable)
CREATE TABLE IF NOT EXISTS public.payments (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL,
    method VARCHAR(50) NULL,
    rzp_payment_id VARCHAR(255) NULL,
    rzp_signature VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. System Settings Cache Store
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Production Configuration (PM2 & Nginx)

To ensure the application starts automatically on boot and handles browser routing clean refreshes:

### Install PM2 (Process Manager) globally
```bash
sudo npm install -y -g pm2
```

### Start the Full-Stack Server with PM2
Create an `ecosystem.config.js` in your root folder:
```javascript
module.exports = {
  apps: [{
    name: 'bsp-suryatech',
    script: 'dist/server.cjs',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '127.0.0.1'
    }
  }]
};
```
Now launch and configure boot-starter:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Secure Nginx Reverse Proxy & Redirect Fix Configuration
Install and configure Nginx to route domain traffic (`suryatech.com`) safely to your Node API port:
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/bsp_suryatech
```
Paste this clean production block:
```nginx
server {
    listen 80;
    server_name suryatech.com www.suryatech.com;

    # Maximum upload sizes for real EXE and large PDF manual files
    client_max_body_size 150M;

    # Route all traffic to Node Express full-stack engine (which serves the frontend assets and spa fallbacks)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Public Directory Native File Handling
    location /uploads/ {
        alias /var/www/bsp-suryatech/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location /downloads/ {
        alias /var/www/bsp-suryatech/downloads/;
        expires 7d;
        add_header Cache-Control "private, no-transform";
    }
}
```
Link files and test configuration structure:
```bash
sudo ln -s /etc/nginx/sites-available/bsp_suryatech /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Now obtain your free Let's Encrypt SSL certificates for HTTPS:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d suryatech.com -d www.suryatech.com
```

---

## 5. Media Chapters and Production Uploads

Our Node Express backend features optimized, high-payload dynamic file upload routes tailored specifically for Hostinger files and folder trees. Let's document these API routes.

| Upload Category | Admin Endpoint API Path | Local Hostinger Save Directory | Output Public URL |
| :--- | :--- | :--- | :--- |
| **Product Screen Images** | `/api/admin/uploads/image` | `./uploads/images/` | `/uploads/images/filename.png` |
| **PDF User Manuals** | `/api/admin/uploads/pdf` | `./uploads/pdfs/` | `/uploads/pdfs/filename.pdf` |
| **Demo Setup Videos** | `/api/admin/uploads/video` | `./uploads/videos/` | `/uploads/videos/filename.mp4` |
| **Software Installers (EXEs)** | `/api/admin/downloads/software` | `./downloads/software/` | `/downloads/software/filename.exe` |

*Note: All endpoints expect `base64Data` and `filename` parameters in the body to allow standard payload transmissions inside the unified server.*

---

## 6. Pre-Flight Launch Verification Checklist

Run these commands on your VPS terminal to ensure supreme operational security before opening the gateway:

- [ ] Check if PM2 daemon is running green: `pm2 status`
- [ ] Read production log stream: `pm2 logs`
- [ ] Read Nginx access/error files: `tail -f /var/log/nginx/error.log`
- [ ] Confirm no local development loopbacks are visible: `grep -rn "localhost:5173" dist/`
- [ ] Confirm correct database parity checks: Log into Supabase client dashboard and check table count matching (7 tables total).

For detailed evaluations, proceed below to view the official AI Studio Deployment Audit.
