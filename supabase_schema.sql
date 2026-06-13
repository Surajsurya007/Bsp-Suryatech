-- =========================================================================
--             SUPABASE DATABASE SCHEMAS & POLICIES (BSP SURYATECH)
-- =========================================================================
-- Run this block inside your Supabase project's SQL Editor to bootstrap
-- all system tables, primary keys, custom indexes, foreign keys, 
-- and Row Level Security permissions.
-- =========================================================================

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Language Configs Table
CREATE TABLE IF NOT EXISTS public.language_configs (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    flag VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. Customer Profiles Table
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(255) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    business_address TEXT NOT NULL,
    city VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    pincode VARCHAR(50) NOT NULL,
    gst_number VARCHAR(50) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products Table
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
    connected_plan VARCHAR(255) NULL
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    coupon_code VARCHAR(50) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_id VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Licenses Table
CREATE TABLE IF NOT EXISTS public.licenses (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    license_key VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Downloads Info Table
CREATE TABLE IF NOT EXISTS public.downloads_info (
    id VARCHAR(255) PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_size VARCHAR(50) NOT NULL,
    download_url VARCHAR(255) NOT NULL,
    release_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
    download_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    replies JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 8. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    code VARCHAR(50) PRIMARY KEY,
    discount_percent INT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_by TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 9. Testimonials Table
CREATE TABLE IF NOT EXISTS public.testimonials (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    rating INT NOT NULL DEFAULT 5,
    avatar VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Blogs Table
CREATE TABLE IF NOT EXISTS public.blogs (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    date VARCHAR(255) NOT NULL,
    read_time VARCHAR(50) NOT NULL,
    excerpt TEXT NOT NULL,
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) REFERENCES public.products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    rating INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id VARCHAR(255) PRIMARY KEY,
    invoice_number VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    payment_method VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 13. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id VARCHAR(255) PRIMARY KEY,
    invoice_number VARCHAR(255) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    contact_number VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    gst_amount DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    license_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Video Tutorials Table
CREATE TABLE IF NOT EXISTS public.video_tutorials (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    youtube_id VARCHAR(255) NOT NULL,
    thumbnail VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    settings_key VARCHAR(255) PRIMARY KEY,
    settings_val TEXT NOT NULL
);


-- =========================================================================
--                     ROW LEVEL SECURITY (RLS) RULES
-- =========================================================================

-- Enable Row Level Security (RLS) on private/user tables
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Create Public Select Access Rules for Catalogs
ALTER TABLE public.language_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select language_configs" ON public.language_configs;
CREATE POLICY "Public select language_configs" ON public.language_configs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage language_configs" ON public.language_configs;
CREATE POLICY "Admin manage language_configs" ON public.language_configs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select products" ON public.products;
CREATE POLICY "Public select products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage products" ON public.products;
CREATE POLICY "Admin manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.downloads_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select downloads_info" ON public.downloads_info;
CREATE POLICY "Public select downloads_info" ON public.downloads_info FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage downloads_info" ON public.downloads_info;
CREATE POLICY "Admin manage downloads_info" ON public.downloads_info FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select coupons" ON public.coupons;
CREATE POLICY "Public select coupons" ON public.coupons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage coupons" ON public.coupons;
CREATE POLICY "Admin manage coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select testimonials" ON public.testimonials;
CREATE POLICY "Public select testimonials" ON public.testimonials FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage testimonials" ON public.testimonials;
CREATE POLICY "Admin manage testimonials" ON public.testimonials FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select blogs" ON public.blogs;
CREATE POLICY "Public select blogs" ON public.blogs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage blogs" ON public.blogs;
CREATE POLICY "Admin manage blogs" ON public.blogs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select reviews" ON public.reviews;
CREATE POLICY "Public select reviews" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage reviews" ON public.reviews;
CREATE POLICY "Admin manage reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.video_tutorials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select video_tutorials" ON public.video_tutorials;
CREATE POLICY "Public select video_tutorials" ON public.video_tutorials FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage video_tutorials" ON public.video_tutorials;
CREATE POLICY "Admin manage video_tutorials" ON public.video_tutorials FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select system_settings" ON public.system_settings;
CREATE POLICY "Public select system_settings" ON public.system_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin modify system_settings" ON public.system_settings;
CREATE POLICY "Admin modify system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);


-- 2. Customer Profiles RLS Policies
DROP POLICY IF EXISTS "Manage profile" ON public.customer_profiles;
DROP POLICY IF EXISTS "Users can manage own customer_profile" ON public.customer_profiles;
CREATE POLICY "Users can manage own customer_profile" ON public.customer_profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Server fallback manage customer_profiles" ON public.customer_profiles;
CREATE POLICY "Server fallback manage customer_profiles" ON public.customer_profiles
    FOR ALL USING (true) WITH CHECK (true);

-- 3. Orders RLS Policies
DROP POLICY IF EXISTS "Users can view and create own orders" ON public.orders;
CREATE POLICY "Users can view and create own orders" ON public.orders
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Server fallback manage orders" ON public.orders;
CREATE POLICY "Server fallback manage orders" ON public.orders
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Licenses RLS Policies
DROP POLICY IF EXISTS "Users can view own licenses" ON public.licenses;
CREATE POLICY "Users can view own licenses" ON public.licenses
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Server fallback manage licenses" ON public.licenses;
CREATE POLICY "Server fallback manage licenses" ON public.licenses
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Support Tickets RLS Policies
DROP POLICY IF EXISTS "Users can view and manage own support_tickets" ON public.support_tickets;
CREATE POLICY "Users can view and manage own support_tickets" ON public.support_tickets
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Server fallback manage support_tickets" ON public.support_tickets;
CREATE POLICY "Server fallback manage support_tickets" ON public.support_tickets
    FOR ALL USING (true) WITH CHECK (true);

-- 6. Payments RLS Policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Server fallback manage payments" ON public.payments;
CREATE POLICY "Server fallback manage payments" ON public.payments
    FOR ALL USING (true) WITH CHECK (true);

-- 7. Invoices RLS Policies
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices" ON public.invoices
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Server fallback manage invoices" ON public.invoices;
CREATE POLICY "Server fallback manage invoices" ON public.invoices
    FOR ALL USING (true) WITH CHECK (true);

-- 8. Notifications RLS Policies
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications" ON public.notifications
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Server fallback manage notifications" ON public.notifications;
CREATE POLICY "Server fallback manage notifications" ON public.notifications
    FOR ALL USING (true) WITH CHECK (true);


-- =========================================================================
--             DEFAULT DATA SEEDING (BOOTSTRAP VALUES)
-- =========================================================================

-- Seed Language Configs
INSERT INTO public.language_configs (code, name, flag, enabled) VALUES 
('en', 'English', '🇺🇸', true),
('hi', 'हिन्दी (Hindi)', '🇮🇳', true),
('gu', 'ગુજરાતી (Gujarati)', '🇮🇳', true),
('ta', 'தமிழ் (Tamil)', '🇮🇳', true),
('te', 'తెలుగు (Telugu)', '🇮🇳', true)
ON CONFLICT (code) DO NOTHING;

-- Seed Products
INSERT INTO public.products (id, name, version, size, price, original_price, features, description, download_url, connected_plan) VALUES 
('prod-billing-pro', 'BSP Suryatech Retail Billing Pro', 'v4.2.1', '14.8 MB', 999.00, 2499.00, 
'["Retail & Wholesale Billing", "GST Invoice Generation & PDF Export", "Barcode Creation & Fast Scanning", "Inventory Stock Alerts & Tracking", "Customer Ledger & Balances", "Supplier Purchase Tracking", "Thermal Printer Support (58mm/80mm)", "Backup & Automatic Restore Settings", "Profit & Loss Reporting", "Offline Desktop-First Performance"]'::jsonb, 
'All-in-one GST billing and inventory desktop software designed for Kirana stores, pharmacies, electronics shops, supermarkets, and distributors across India. Lightweight, ultra-fast, and runs 100% offline.', 
'https://your-domain.com/downloads/setup-pro.exe', 'prod-billing-pro'),
('prod-billing-enterprise', 'BSP Suryatech GST Enterprise Suite', 'v5.0.3', '22.4 MB', 2999.00, 4999.00, 
'["All features of Retail Billing Pro", "Multi-firm & Multi-branch handling", "Direct GST Portal JSON Export (GSTR-1, GSTR-3B)", "Advanced User Permissions & Roles", "Cloud Auto-Backup Integration", "Custom Print Invoice Customizer Designer", "Premium 24/7 Telephone Support", "API integration with POS Scales"]'::jsonb, 
'Enterprise grade GST compliance and multi-user billing software with multi-firm support, direct GSTR ledger formatting, designable invoices, and automated backup mechanisms.', 
'https://your-domain.com/downloads/setup-enterprise.exe', 'prod-billing-enterprise')
ON CONFLICT (id) DO NOTHING;

-- Seed Coupons
INSERT INTO public.coupons (code, discount_percent, active, expires_by) VALUES 
('SURYA20', 20, true, '2027-12-31 23:59:59+00'),
('INDIA50', 50, true, '2026-12-31 23:59:59+00'),
('STARTUP10', 10, true, '2026-08-30 23:59:59+00')
ON CONFLICT (code) DO NOTHING;

-- Seed Video Tutorials
INSERT INTO public.video_tutorials (id, title, duration, youtube_id, thumbnail, description) VALUES 
('vid-1', 'Complete Software Overview & POS Retail Setup Guide (v4.2.1)', '12:45 Mins', 'bsp_overview_embed', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800', 'A comprehensive complete video tutorial going through initial registration, barcode creation, Adding custom tax items, setting up standard inventory levels, and executing cash bills.'),
('vid-2', 'Configuring Thermal Receipt Printers & Paper Canvas Alignments', '08:30 Mins', 'bsp_printer_embed', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800', 'Step-by-step instructions details covering TVS, Sewoo, Epson, Rongta driver settings, adjusting paper limits parameters, line margins offset spacing, and footer text customizer layouts.'),
('vid-3', 'Bulk Stocks Catalogue Imports Using Excel Sheet Templates', '05:40 Mins', 'bsp_import_embed', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800', 'How to easily compile columns in Excel sheets, configure tax rates, stock minimum levels, barcodes, and upload directly to BSP Suryatech local database with no syntax issues.')
ON CONFLICT (id) DO NOTHING;

-- Seed system helpline
INSERT INTO public.system_settings (settings_key, settings_val) VALUES
('helpline', '+91 95169 16415')
ON CONFLICT (settings_key) DO NOTHING;
