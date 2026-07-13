import fs from 'fs';
import path from 'path';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  updatedDate: string;
  readTime: string;
  category: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
}

export interface SEOSoftwareContent {
  id: string;
  name: string;
  introduction: string;
  whatIs: string;
  whoShouldUse: string;
  benefits: string[];
  advantages: string[];
  disadvantages: string[];
  modules: string[];
  industries: string[];
  howItWorks: string;
  comparison: string;
  bestPractices: string[];
  suitableFor: string;
  faq: { q: string; a: string }[];
  conclusion: string;
}

// Map path slugs to raw seo IDs
export function mapSlugToSeoId(slug: string): string {
  const mapping: Record<string, string> = {
    'retail_billing': 'sol-retail',
    'supermarket_pos': 'sol-supermarket',
    'grocery_billing': 'sol-grocery',
    'medical_store': 'sol-medical',
    'restaurant_pos': 'sol-restaurant',
    'mobile_shop': 'sol-mobile',
    'electronics_shop': 'sol-electronics',
    'transport_erp': 'sol-transport',
    'hospital_erp': 'sol-hospital',
    'laboratory_erp': 'sol-diagnostic',
    'school_erp': 'sol-school',
    'enterprise_erp': 'sol-erp-warehouse',
    'hotel_erp': 'sol-hotel',
    'repairing_erp': 'sol-repairing'
  };
  return mapping[slug] || slug;
}

function stripInterfacesForSEO(code: string): string {
  let result = code;
  while (true) {
    const match = result.match(/(?:export\s+)?interface\s+\w+\s*\{/);
    if (!match || match.index === undefined) break;
    
    const startIdx = match.index;
    let braceCount = 1;
    let i = startIdx + match[0].length;
    while (i < result.length && braceCount > 0) {
      if (result[i] === '{') braceCount++;
      else if (result[i] === '}') braceCount--;
      i++;
    }
    result = result.substring(0, startIdx) + result.substring(i);
  }
  return result;
}

function cleanTsToJsForSEO(code: string): string {
  let js = stripInterfacesForSEO(code);
  
  // Replace imports of assets with simple string assignments
  js = js.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/g, 'const $1 = "$2";');
  
  // Target precise type annotations in declaration lines
  js = js.replace(/:\s*SEOSoftwareContent\s*=/g, ' =');
  js = js.replace(/:\s*Record<[^>]+>\s*=/g, ' =');
  js = js.replace(/:\s*BlogPost\s*\[\s*\]\s*=/g, ' =');
  js = js.replace(/:\s*BlogPost\s*=/g, ' =');
  
  // Strip the specific function by name using indexOf
  const funcIdx = js.indexOf('function getSeoSoftwareDetails');
  if (funcIdx !== -1) {
    js = js.substring(0, funcIdx);
  }
  
  // Strip export keywords
  js = js.replace(/export\s+/g, '');
  
  return js;
}

// Dynamically load blog posts from src/data/blogData.ts safely without image import errors
export function loadBlogPosts(projectRoot: string): BlogPost[] {
  try {
    const filePath = path.join(projectRoot, 'src', 'data', 'blogData.ts');
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const code = fs.readFileSync(filePath, 'utf-8');
    const js = cleanTsToJsForSEO(code);
    
    const wrapped = `${js}; return BLOG_POSTS;`;
    const getPosts = new Function(wrapped);
    return getPosts() || [];
  } catch (err) {
    console.error("Error dynamically loading blog posts for SEO:", err);
    return [];
  }
}

// Dynamically load software profiles from src/utils/seoSoftwareData.ts safely
export function loadSoftwareData(projectRoot: string): Record<string, SEOSoftwareContent> {
  try {
    const filePath = path.join(projectRoot, 'src', 'utils', 'seoSoftwareData.ts');
    if (!fs.existsSync(filePath)) {
      return {};
    }
    const code = fs.readFileSync(filePath, 'utf-8');
    const js = cleanTsToJsForSEO(code);
    
    const wrapped = `${js}; return seoSoftwareDataMap;`;
    const getMap = new Function(wrapped);
    return getMap() || {};
  } catch (err) {
    console.error("Error dynamically loading software data for SEO:", err);
    return {};
  }
}

// Core public routes to pre-render for SEO
const PUBLIC_ROUTES = [
  '/',
  '/features',
  '/pricing',
  '/downloads',
  '/tutorials',
  '/about',
  '/contact',
  '/blog',
  '/privacy-policy',
  '/refund-policy',
  '/disclaimer'
];

export function isPublicPageRoute(urlPath: string): boolean {
  let p = urlPath.split('?')[0].split('#')[0];
  if (p.endsWith('/') && p !== '/') {
    p = p.slice(0, -1);
  }
  if (PUBLIC_ROUTES.includes(p)) {
    return true;
  }
  if (p.startsWith('/blog/')) {
    return true;
  }
  if (p.startsWith('/software/')) {
    return true;
  }
  return false;
}

// Generate the complete HTML content and metadata for a specific route
export function generateSeoPage(urlPath: string, projectRoot: string) {
  let p = urlPath.split('?')[0].split('#')[0];
  if (p.endsWith('/') && p !== '/') {
    p = p.slice(0, -1);
  }

  const canonicalUrl = `https://bspsuryatech.in${p}`;
  const today = new Date().toISOString().split('T')[0];

  // Base Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BSP Suryatech",
    "url": "https://bspsuryatech.in",
    "logo": "https://bspsuryatech.in/assets/images/bsp_logo.png",
    "sameAs": [
      "https://www.youtube.com/@BSPSuryatech"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-9752317823",
      "contactType": "customer support",
      "areaServed": "IN",
      "availableLanguage": ["en", "hi"]
    }
  };

  // Breadcrumb Generator helper
  const makeBreadcrumbs = (items: { name: string, item: string }[]) => {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items.map((x, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": x.name,
        "item": x.item
      }))
    };
  };

  // 1. HOME PAGE
  if (p === '/' || p === '') {
    const title = "BSP Suryatech - Offline Business Billing, GST & POS Software";
    const description = "Premium offline-first billing & inventory software for supermarkets, retail shops, pharmacies, hotels, transport, and schools in India. GST compliant and lifetime licenses.";
    const schemaJson = [
      organizationSchema,
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "BSP Suryatech",
        "url": "https://bspsuryatech.in",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://bspsuryatech.in/blog?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ];

    const rootHtml = `
      <main style="font-family: system-ui, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; line-height: 1.6; color: #334155;">
        <header style="text-align: center; padding: 60px 20px; background: #0f172a; color: white; border-radius: 12px; margin-bottom: 40px;">
          <h1 style="font-size: 2.5rem; margin-bottom: 20px;">BSP Suryatech - Smart Offline Billing & ERP Solutions</h1>
          <p style="font-size: 1.2rem; max-width: 800px; margin: 0 auto;">Empower your retail business with ultra-fast, offline-first Windows billing software that keeps checkout queues moving with zero internet lag. Pay once, use forever.</p>
          <div style="margin-top: 30px;">
            <a href="/downloads" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; margin-right: 15px; display: inline-block;">Download Free Trial</a>
            <a href="/pricing" style="background: #475569; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">View Lifetime Pricing</a>
          </div>
        </header>

        <section style="margin-bottom: 50px;">
          <h2 style="font-size: 1.8rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 25px; color: #0f172a;">Why Choose BSP Suryatech Desktop ERP?</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h3 style="color: #2563eb; margin-bottom: 10px;">100% Secure Offline Database</h3>
              <p>Your business transaction records, sales journals, and customer ledgers reside permanently on your local computer hard disk. Complete data privacy and no dependency on active Wi-Fi.</p>
            </div>
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h3 style="color: #2563eb; margin-bottom: 10px;">Sub-2ms High-speed Checkout</h3>
              <p>Execute product lookups, barcode scans, and receipt spooling instantaneously. Ideal for busy retail environments, minimizing customer checkout queues.</p>
            </div>
            <div style="background: #f8fafc; padding: 25px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <h3 style="color: #2563eb; margin-bottom: 10px;">One-time Lifetime License</h3>
              <p>Eliminate expensive monthly software rentals and subscriptions. Invest in your business once and own the billing engine permanently with lifetime updates.</p>
            </div>
          </div>
        </section>

        <section style="margin-bottom: 50px;">
          <h2 style="font-size: 1.8rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 25px; color: #0f172a;">Complete Suite of Industry Specific Softwares</h2>
          <ul style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; padding-left: 0; list-style: none;">
            <li><a href="/software/retail_billing" style="color: #2563eb; font-weight: bold; text-decoration: none;">✔ Retail Billing Software</a></li>
            <li><a href="/software/supermarket_pos" style="color: #2563eb; font-weight: bold; text-decoration: none;">✔ Supermarket POS Software</a></li>
            <li><a href="/software/grocery_billing" style="color: #2563eb; font-weight: bold; text-decoration: none;">✔ Gym Management Software</a></li>
            <li><a href="/software/medical_store" style="color: #2563eb; font-weight: bold; text-decoration: none;">✔ Medical Store Billing Software</a></li>
            <li><a href="/software/restaurant_pos" style="color: #2563eb; font-weight: bold; text-decoration: none;">✔ Restaurant POS & KOT Software</a></li>
            <li><a href="/software/mobile_shop" style="color: #2563eb; font-weight: bold; text-decoration: none;">✔ Mobile Shop Billing Software</a></li>
            <li><a href="/software/electronics_shop" style="color: #2563eb; font-weight: bold; text-decoration: none;">✔ Electronics Showroom Software</a></li>
            <li><a href="/software/transport_erp" style="color: #2563eb; font-weight: bold; text-decoration: none;">✔ Transport Management Software</a></li>
            <li><a href="/software/hospital_erp" style="color: #2563eb; font-weight: bold; text-decoration: none;">✔ Hospital & Clinic ERP Software</a></li>
            <li><a href="/software/school_erp" style="color: #2563eb; font-weight: bold; text-decoration: none;">✔ School ERP Management Suite</a></li>
          </ul>
        </section>

        <section style="background: #f1f5f9; padding: 40px; border-radius: 12px; margin-bottom: 50px;">
          <h2 style="font-size: 1.8rem; margin-bottom: 20px; color: #0f172a; text-align: center;">Frequently Asked Questions</h2>
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 1.1rem; color: #0f172a;">Is BSP Suryatech billing software completely offline?</h3>
            <p>Yes. All databases, items, stocks, invoice logs, and customer registries are saved directly on your Windows PC hard drive. Daily checkout operations do not require any active internet connection.</p>
          </div>
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 1.1rem; color: #0f172a;">Are there any monthly or yearly renewal fees?</h3>
            <p>No. Standard licenses are sold as one-time lifetime purchases. You pay once and own the system permanently, saving thousands of rupees in recurring annual SaaS subscriptions.</p>
          </div>
        </section>
      </main>
    `;

    return { title, metaDescription: description, canonicalUrl, ogTags: "", twitterTags: "", rootHtml, schemaJson };
  }

  // 2. FEATURES PAGE
  if (p === '/features') {
    const title = "BSP Suryatech Software Features - Invoicing, Inventory, GST Reports";
    const description = "Discover the advanced features of BSP Suryatech desktop billing software: fast checkout, batch tracking, expiry alerts, offline security, GSTR-1 Excel reports.";
    const schemaJson = [
      organizationSchema,
      makeBreadcrumbs([
        { name: "Home", item: "https://bspsuryatech.in/" },
        { name: "Features", item: canonicalUrl }
      ])
    ];

    const rootHtml = `
      <main style="font-family: system-ui, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; line-height: 1.6; color: #334155;">
        <header style="padding: 40px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 40px;">
          <h1 style="font-size: 2.2rem; color: #0f172a; margin-bottom: 10px;">Core Features of BSP Suryatech ERP</h1>
          <p style="font-size: 1.1rem; color: #64748b;">Comprehensive tools engineered to streamline your store inventory, billing lanes, accounting, and government compliance.</p>
        </header>

        <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin-bottom: 50px;">
          <div style="background: white; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <h2 style="font-size: 1.3rem; color: #2563eb; margin-bottom: 15px;">1. Point of Sales Invoicing</h2>
            <p>Fast dual-mode billing for standard tax invoices or estimates. Features comprehensive thermal slip customizations, barcode printing, discount rules, cashier drawer popups, and instant bill print spools.</p>
          </div>
          <div style="background: white; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <h2 style="font-size: 1.3rem; color: #2563eb; margin-bottom: 15px;">2. Stock & Inventory Control</h2>
            <p>Track warehouse and shelf counts with precise precision. Automated stock alerts notify you when items hit critical reorder points, preventing stockouts of fast-moving products.</p>
          </div>
          <div style="background: white; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <h2 style="font-size: 1.3rem; color: #2563eb; margin-bottom: 15px;">3. Batch-wise Expiry Safeguards</h2>
            <p>Essential for medical stores and food hubs. Track products by unique manufacturer batches and expiration periods. Color-coded alerts flag upcoming expiries, and the checkout blocks expired drug sales.</p>
          </div>
          <div style="background: white; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <h2 style="font-size: 1.3rem; color: #2563eb; margin-bottom: 15px;">4. Multi-user LAN Sync</h2>
            <p>Run multiple checkout lanes, inventory counters, and administrative desks simultaneously. Sync data seamlessly over a standard local area network (LAN) router without active internet.</p>
          </div>
        </section>
      </main>
    `;

    return { title, metaDescription: description, canonicalUrl, ogTags: "", twitterTags: "", rootHtml, schemaJson };
  }

  // 3. PRICING PAGE
  if (p === '/pricing') {
    const title = "Software Pricing & Licenses - BSP Suryatech";
    const description = "Transparent lifetime pricing with no monthly fees. Get BSP Suryatech billing software licenses starting at just ₹3,000 one-time. Download free trial.";
    const schemaJson = [
      organizationSchema,
      makeBreadcrumbs([
        { name: "Home", item: "https://bspsuryatech.in/" },
        { name: "Pricing", item: canonicalUrl }
      ])
    ];

    const rootHtml = `
      <main style="font-family: system-ui, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; line-height: 1.6; color: #334155;">
        <header style="text-align: center; padding: 50px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 40px;">
          <h1 style="font-size: 2.2rem; color: #0f172a; margin-bottom: 10px;">One-Time Pricing, Lifetime License</h1>
          <p style="font-size: 1.1rem; color: #64748b; max-width: 700px; margin: 0 auto;">No monthly fees, no yearly renewals, no hidden charges. Choose the ideal license package for your retail, wholesale or industrial enterprise.</p>
        </header>

        <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px; margin-bottom: 50px;">
          <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 30px; text-align: center; background: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);">
            <h2 style="font-size: 1.5rem; margin-bottom: 10px;">Starter Billing</h2>
            <p style="font-size: 2.5rem; font-weight: bold; color: #0f172a; margin: 20px 0;">₹999</p>
            <p style="color: #64748b; margin-bottom: 25px;">One-time lifetime payment</p>
            <ul style="text-align: left; padding-left: 20px; margin-bottom: 30px; space-y: 10px;">
              <li>Fast Offline Billing Console</li>
              <li>Thermal receipt layouts</li>
              <li>Simple Inventory tracking</li>
              <li>Offline database backups</li>
            </ul>
            <a href="/contact" style="background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: block;">Buy Starter License</a>
          </div>

          <div style="border: 2px solid #2563eb; border-radius: 12px; padding: 30px; text-align: center; background: white; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); position: relative;">
            <span style="background: #2563eb; color: white; padding: 5px 12px; font-size: 0.8rem; font-weight: bold; border-radius: 12px; position: absolute; top: -15px; left: 50%; transform: translateX(-50%); text-transform: uppercase;">Most Popular</span>
            <h2 style="font-size: 1.5rem; margin-bottom: 10px;">Retailer Pro</h2>
            <p style="font-size: 2.5rem; font-weight: bold; color: #2563eb; margin: 20px 0;">₹3,000</p>
            <p style="color: #64748b; margin-bottom: 25px;">One-time lifetime payment</p>
            <ul style="text-align: left; padding-left: 20px; margin-bottom: 30px; space-y: 10px;">
              <li>Everything in Starter Billing</li>
              <li>GST CGST/SGST splitting</li>
              <li>HSN Code directory & categories</li>
              <li>Export GSTR-1 Excel reports</li>
              <li>Barcode Sticker design & print utility</li>
              <li>Supplier purchase orders & accounts</li>
            </ul>
            <a href="/contact" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: block;">Buy Pro License</a>
          </div>

          <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 30px; text-align: center; background: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);">
            <h2 style="font-size: 1.5rem; margin-bottom: 10px;">Enterprise Suite</h2>
            <p style="font-size: 2.5rem; font-weight: bold; color: #0f172a; margin: 20px 0;">Custom</p>
            <p style="color: #64748b; margin-bottom: 25px;">One-time licensing quotes</p>
            <ul style="text-align: left; padding-left: 20px; margin-bottom: 30px; space-y: 10px;">
              <li>Everything in Retailer Pro</li>
              <li>Multi-terminal LAN sync setups</li>
              <li>Multi-location warehouse transits</li>
              <li>Manufacturing Bill of Materials (BOM)</li>
              <li>Advanced customer loyalty credit matrix</li>
            </ul>
            <a href="/contact" style="background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: block;">Request ERP Quote</a>
          </div>
        </section>
      </main>
    `;

    return { title, metaDescription: description, canonicalUrl, ogTags: "", twitterTags: "", rootHtml, schemaJson };
  }

  // 4. DOWNLOADS PAGE
  if (p === '/downloads') {
    const title = "Download Center - BSP Suryatech Software Free Trials";
    const description = "Download fully functional free evaluation trials of BSP Suryatech Billing, POS, and ERP software for Windows. Start professional invoicing today.";
    const schemaJson = [
      organizationSchema,
      makeBreadcrumbs([
        { name: "Home", item: "https://bspsuryatech.in/" },
        { name: "Downloads", item: canonicalUrl }
      ])
    ];

    const rootHtml = `
      <main style="font-family: system-ui, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; line-height: 1.6; color: #334155;">
        <header style="padding: 40px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 40px;">
          <h1 style="font-size: 2.2rem; color: #0f172a; margin-bottom: 10px;">Download Center - Free Windows trials</h1>
          <p style="font-size: 1.1rem; color: #64748b;">Get fully functional free desktop evaluation setups for your business. Works natively on Windows 7, 8, 10, and 11.</p>
        </header>

        <section style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 40px;">
          <h2 style="font-size: 1.6rem; color: #0f172a; margin-bottom: 15px;">BSP Mart Billing & POS Software Setup</h2>
          <p style="max-width: 600px; margin: 0 auto 25px; color: #475569;">The main evaluation package for retail shops, provision stores, supermarkets, grocery kiosks, and general merchants.</p>
          <a href="https://bspsuryatech.in/downloads/BSP-Mart-POS-v1.0.0.zip" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 6px; font-size: 1.1rem; display: inline-block; box-shadow: 0 4px 6px rgba(37,99,235,0.2);">Download BSP Mart POS Setup (Zip)</a>
        </section>
      </main>
    `;

    return { title, metaDescription: description, canonicalUrl, ogTags: "", twitterTags: "", rootHtml, schemaJson };
  }

  // 5. TUTORIALS PAGE
  if (p === '/tutorials') {
    const title = "Video Tutorials & Training Guides - BSP Suryatech";
    const description = "Learn how to use BSP Suryatech software with our step-by-step video training tutorials. Master batch tracking, GST settings, and thermal printing.";
    const schemaJson = [
      organizationSchema,
      makeBreadcrumbs([
        { name: "Home", item: "https://bspsuryatech.in/" },
        { name: "Tutorials", item: canonicalUrl }
      ])
    ];

    const rootHtml = `
      <main style="font-family: system-ui, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; line-height: 1.6; color: #334155;">
        <header style="padding: 40px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 40px;">
          <h1 style="font-size: 2.2rem; color: #0f172a; margin-bottom: 10px;">Suryatech Video Academy & Tutorials</h1>
          <p style="font-size: 1.1rem; color: #64748b;">Step-by-step video instructions to help you master thermal receipt alignment, item imports, and GSTR summaries creation.</p>
        </header>

        <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px; margin-bottom: 50px;">
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background: #0f172a; height: 180px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
              [Thermal Printer Setup Guide]
            </div>
            <div style="padding: 20px;">
              <h3 style="color: #0f172a; margin-bottom: 10px;">How to Setup 3-Inch Thermal Printers</h3>
              <p style="font-size: 0.9rem; color: #475569;">Detailed guidance to configure Epson, TVS, Rongta, and Xprinter drivers, align margins, and automate cash drawer openings.</p>
            </div>
          </div>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background: #0f172a; height: 180px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
              [Barcode Scanner Configuration]
            </div>
            <div style="padding: 20px;">
              <h3 style="color: #0f172a; margin-bottom: 10px;">Setting Up USB Barcode Scanners</h3>
              <p style="font-size: 0.9rem; color: #475569;">Learn how to map single-dimension laser or 2D QR scanners to trigger direct item additions in billing lanes.</p>
            </div>
          </div>
        </section>
      </main>
    `;

    return { title, metaDescription: description, canonicalUrl, ogTags: "", twitterTags: "", rootHtml, schemaJson };
  }

  // 6. ABOUT PAGE
  if (p === '/about') {
    const title = "About BSP Suryatech - Pioneers of Offline ERP Systems";
    const description = "Meet BSP Suryatech, founded by Suraj Suryavanshi. We design secure, high-speed, offline-first billing software for small and medium businesses in India.";
    const schemaJson = [
      organizationSchema,
      makeBreadcrumbs([
        { name: "Home", item: "https://bspsuryatech.in/" },
        { name: "About Us", item: canonicalUrl }
      ])
    ];

    const rootHtml = `
      <main style="font-family: system-ui, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; line-height: 1.6; color: #334155;">
        <header style="padding: 40px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 40px;">
          <h1 style="font-size: 2.2rem; color: #0f172a; margin-bottom: 10px;">About BSP Suryatech</h1>
          <p style="font-size: 1.1rem; color: #64748b;">Pioneering secure, lightning-fast, offline-first business ledger and POS systems for Indian merchants.</p>
        </header>

        <section style="margin-bottom: 40px;">
          <p style="font-size: 1.1rem; margin-bottom: 20px;">Founded by software developer and retail consultant <strong>Suraj Suryavanshi</strong>, BSP Suryatech specializes in local Windows-based database systems that serve checkout registers with unmatched durability. Unlike subscription cloud software that compromises privacy and fails during internet blackouts, our desktop systems reside permanently under your physical control.</p>
          <p style="font-size: 1.1rem;">Headquartered in Raipur, Chhattisgarh, we are proud to serve thousands of small grocery stores, multi-lane departmental supermarkets, retail chemist shops, Ayurvedic distribution networks, and logistics contractors across India.</p>
        </section>
      </main>
    `;

    return { title, metaDescription: description, canonicalUrl, ogTags: "", twitterTags: "", rootHtml, schemaJson };
  }

  // 7. CONTACT PAGE
  if (p === '/contact') {
    const title = "Contact Us - BSP Suryatech Customer Support";
    const description = "Get in touch with BSP Suryatech for free software demos, license activation, and technical support. Phone, email, and location details.";
    const schemaJson = [
      organizationSchema,
      makeBreadcrumbs([
        { name: "Home", item: "https://bspsuryatech.in/" },
        { name: "Contact", item: canonicalUrl }
      ])
    ];

    const rootHtml = `
      <main style="font-family: system-ui, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; line-height: 1.6; color: #334155;">
        <header style="padding: 40px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 40px;">
          <h1 style="font-size: 2.2rem; color: #0f172a; margin-bottom: 10px;">Contact BSP Suryatech Support & Sales</h1>
          <p style="font-size: 1.1rem; color: #64748b;">Book a free remote AnyDesk demo or get instant license key assistance from our product experts.</p>
        </header>

        <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; margin-bottom: 50px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 30px; border-radius: 8px;">
            <h2 style="color: #0f172a; font-size: 1.4rem; margin-bottom: 20px;">Sales & Support Contacts</h2>
            <p style="margin-bottom: 10px;"><strong>📞 Phone / WhatsApp:</strong> +91-9752317823</p>
            <p style="margin-bottom: 10px;"><strong>✉ Email:</strong> surajsurya.koo7@gmail.com</p>
            <p style="margin-bottom: 10px;"><strong>📍 Location:</strong> Raipur, Chhattisgarh, India</p>
            <p style="margin-bottom: 10px;"><strong>💻 Remote Assistance:</strong> Available via AnyDesk & TeamViewer</p>
          </div>
          <div>
            <h2 style="color: #0f172a; font-size: 1.4rem; margin-bottom: 20px;">Leave Us a Message</h2>
            <form style="display: flex; flex-direction: column; gap: 15px;">
              <input type="text" placeholder="Full Name" style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;" />
              <input type="email" placeholder="Email Address" style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;" />
              <textarea placeholder="Your Message..." rows="4" style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;"></textarea>
              <button type="button" style="background: #2563eb; color: white; padding: 12px; font-weight: bold; border: none; border-radius: 6px; cursor: pointer;">Submit Message</button>
            </form>
          </div>
        </section>
      </main>
    `;

    return { title, metaDescription: description, canonicalUrl, ogTags: "", twitterTags: "", rootHtml, schemaJson };
  }

  // 8. PRIVACY POLICY
  if (p === '/privacy-policy') {
    const title = "Privacy Policy - BSP Suryatech Data Protection";
    const description = "Read the BSP Suryatech Privacy Policy. Learn how we safeguard your personal data and protect your private offline business records.";
    const schemaJson = [
      organizationSchema,
      makeBreadcrumbs([
        { name: "Home", item: "https://bspsuryatech.in/" },
        { name: "Privacy Policy", item: canonicalUrl }
      ])
    ];

    const rootHtml = `
      <main style="font-family: system-ui, sans-serif; padding: 20px; max-width: 1000px; margin: 0 auto; line-height: 1.6; color: #334155;">
        <header style="padding: 40px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 40px;">
          <h1 style="font-size: 2.2rem; color: #0f172a; margin-bottom: 10px;">Privacy Policy</h1>
          <p style="font-size: 1rem; color: #64748b;">Last Updated: July 10, 2026</p>
        </header>

        <article style="space-y: 20px;">
          <h2>Our Absolute Commitment to Your Privacy</h2>
          <p>At BSP Suryatech, we are fully committed to protecting your privacy and business data. Since our core desktop billing applications operate entirely offline, we never collect, store, or access your transaction, customer, or inventory data.</p>
          
          <h3>1. Offline-First Desktop Software Data</h3>
          <p>All transaction details, stock entries, customer databases, tax records, and configuration logs are stored exclusively on your local computer or chosen storage drive. We have no backend access to this data, nor do we run background telemetry services that upload your business logs.</p>

          <h3>2. Web Platform & Account Information</h3>
          <p>When you create an account, register your license, purchase a subscription, or submit a support ticket on our website, we collect minimal personal details (such as business name, email address, phone number, and billing region) to process transactions and provide remote installation assistance.</p>
        </article>
      </main>
    `;

    return { title, metaDescription: description, canonicalUrl, ogTags: "", twitterTags: "", rootHtml, schemaJson };
  }

  // 9. REFUND POLICY
  if (p === '/refund-policy') {
    const title = "Refund & Cancellation Policy - BSP Suryatech";
    const description = "Understand the Refund and Cancellation guidelines of BSP Suryatech. We offer free software trials so you can evaluate before purchase.";
    const schemaJson = [
      organizationSchema,
      makeBreadcrumbs([
        { name: "Home", item: "https://bspsuryatech.in/" },
        { name: "Refund Policy", item: canonicalUrl }
      ])
    ];

    const rootHtml = `
      <main style="font-family: system-ui, sans-serif; padding: 20px; max-width: 1000px; margin: 0 auto; line-height: 1.6; color: #334155;">
        <header style="padding: 40px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 40px;">
          <h1 style="font-size: 2.2rem; color: #0f172a; margin-bottom: 10px;">Refund & Cancellation Policy</h1>
          <p style="font-size: 1rem; color: #64748b;">Last Updated: July 10, 2026</p>
        </header>

        <article style="space-y: 20px;">
          <h2>Our Refund Principles</h2>
          <p>At BSP Suryatech, we want our clients to be completely satisfied with their software licensing. Because we operate under a direct try-before-you-buy model, we provide fully functional free evaluation setups in our Download Center.</p>
          
          <h3>Evaluation and Purchasing</h3>
          <p>We highly encourage all prospective clients to download, install, and test the software trials on their own Windows systems before purchasing a license. This ensures complete system and hardware printer compatibility before transaction finalization.</p>

          <h3>Refund Eligibility</h3>
          <p>Once a license key is digitally activated and linked to your business profile, refunds are not issued. However, if you purchase a license and decide not to activate it, you may contact our billing department within 7 days for credit or return adjustments.</p>
        </article>
      </main>
    `;

    return { title, metaDescription: description, canonicalUrl, ogTags: "", twitterTags: "", rootHtml, schemaJson };
  }

  // 10. DISCLAIMER
  if (p === '/disclaimer') {
    const title = "Legal Disclaimer & Terms of Use - BSP Suryatech";
    const description = "BSP Suryatech official business disclaimer, terms of licensing, hardware support liabilities, and data compliance guidelines.";
    const schemaJson = [
      organizationSchema,
      makeBreadcrumbs([
        { name: "Home", item: "https://bspsuryatech.in/" },
        { name: "Disclaimer", item: canonicalUrl }
      ])
    ];

    const rootHtml = `
      <main style="font-family: system-ui, sans-serif; padding: 20px; max-width: 1000px; margin: 0 auto; line-height: 1.6; color: #334155;">
        <header style="padding: 40px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 40px;">
          <h1 style="font-size: 2.2rem; color: #0f172a; margin-bottom: 10px;">Disclaimer & Terms of Use</h1>
          <p style="font-size: 1rem; color: #64748b;">Last Updated: July 10, 2026</p>
        </header>

        <article style="space-y: 20px;">
          <h2>Legal Terms of Use Agreement</h2>
          <p>By purchasing any software, service, subscription, or digital product from BSP Suryatech, the customer agrees to the terms and conditions outlined below.</p>
          
          <h3>1. Data Security & Storage Responsibility</h3>
          <p>All database records are stored exclusively on your local computer hard drive. BSP Suryatech bears zero liability or responsibility for any direct or indirect loss of business data, transaction logs, or invoice records due to system crashes, hardware failures, virus infections, or negligent physical machine security.</p>

          <h3>2. Software Customizations & Compatibility</h3>
          <p>Our software configurations are standardized. Any requested customized changes to printer formats, sales templates, or database grids outside our pre-packaged catalog may be subject to additional service fee estimations.</p>
        </article>
      </main>
    `;

    return { title, metaDescription: description, canonicalUrl, ogTags: "", twitterTags: "", rootHtml, schemaJson };
  }

  // 11. BLOG LISTING PAGE
  if (p === '/blog') {
    const title = "BSP Suryatech Official Business & Retail Blog";
    const description = "Read expert guides, operational tutorials, GST compliance updates, and tech tips for supermarkets, pharmacies, and small retail businesses in India.";
    const schemaJson = [
      organizationSchema,
      makeBreadcrumbs([
        { name: "Home", item: "https://bspsuryatech.in/" },
        { name: "Blog", item: canonicalUrl }
      ])
    ];

    const blogs = loadBlogPosts(projectRoot);
    const blogListingsHTML = blogs.map(b => `
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <span style="font-size: 0.8rem; font-weight: bold; color: #2563eb; text-transform: uppercase;">${b.category}</span>
        <h3 style="font-size: 1.3rem; margin: 10px 0; color: #0f172a;"><a href="/blog/${b.slug}" style="color: #0f172a; text-decoration: none;">${b.title}</a></h3>
        <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 15px;">${b.excerpt}</p>
        <span style="font-size: 0.8rem; color: #94a3b8;">${b.date} • ${b.readTime}</span>
      </div>
    `).join('\n');

    const rootHtml = `
      <main style="font-family: system-ui, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; line-height: 1.6; color: #334155;">
        <header style="padding: 40px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 40px; text-align: center;">
          <h1 style="font-size: 2.2rem; color: #0f172a; margin-bottom: 10px;">BSP Suryatech Business & Retail Blog</h1>
          <p style="font-size: 1.1rem; color: #64748b; max-width: 700px; margin: 0 auto;">Expert operational blueprints, GSTR tax alignment methods, and hardware setups to accelerate business checkout counters.</p>
        </header>

        <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px; margin-bottom: 50px;">
          ${blogListingsHTML}
        </section>
      </main>
    `;

    return { title, metaDescription: description, canonicalUrl, ogTags: "", twitterTags: "", rootHtml, schemaJson };
  }

  // 12. INDIVIDUAL BLOG ARTICLES
  if (p.startsWith('/blog/')) {
    const slug = p.replace('/blog/', '');
    const blogs = loadBlogPosts(projectRoot);
    const post = blogs.find(b => b.slug === slug);

    if (post) {
      const title = post.metaTitle || `${post.title} | BSP Suryatech Blog`;
      const description = post.metaDescription || post.excerpt;
      const schemaJson = [
        organizationSchema,
        makeBreadcrumbs([
          { name: "Home", item: "https://bspsuryatech.in/" },
          { name: "Blog", item: "https://bspsuryatech.in/blog" },
          { name: post.title, item: canonicalUrl }
        ]),
        {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "description": post.excerpt,
          "author": {
            "@type": "Person",
            "name": post.author || "Suraj Suryavanshi"
          },
          "datePublished": post.date ? new Date(post.date).toISOString().split('T')[0] : today,
          "dateModified": post.updatedDate ? new Date(post.updatedDate).toISOString().split('T')[0] : today,
          "mainEntityOfPage": canonicalUrl
        }
      ];

      // Convert basic markdown paragraphs and lists to beautiful HTML strings
      const bodyHtml = post.content
        .split('\n\n')
        .map(block => {
          const trimmed = block.trim();
          if (trimmed.startsWith('# ')) {
            return `<h1 style="font-size: 2.2rem; color: #0f172a; margin-top: 30px; margin-bottom: 15px;">${trimmed.replace('# ', '')}</h1>`;
          }
          if (trimmed.startsWith('## ')) {
            return `<h2 style="font-size: 1.6rem; color: #0f172a; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">${trimmed.replace('## ', '')}</h2>`;
          }
          if (trimmed.startsWith('### ')) {
            return `<h3 style="font-size: 1.25rem; color: #0f172a; margin-top: 25px; margin-bottom: 10px;">${trimmed.replace('### ', '')}</h3>`;
          }
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const listItems = trimmed.split(/\n[*+-]\s+/).map(li => `<li>${li.replace(/^[*+-]\s+/, '')}</li>`).join('\n');
            return `<ul style="padding-left: 20px; margin-bottom: 20px;">${listItems}</ul>`;
          }
          if (trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.startsWith('3. ')) {
            const listItems = trimmed.split(/\n\d+\.\s+/).map(li => `<li>${li.replace(/^\d+\.\s+/, '')}</li>`).join('\n');
            return `<ol style="padding-left: 20px; margin-bottom: 20px;">${listItems}</ol>`;
          }
          return `<p style="margin-bottom: 20px; color: #334155; font-size: 1.05rem; line-height: 1.7;">${trimmed}</p>`;
        })
        .join('\n');

      const rootHtml = `
        <main style="font-family: system-ui, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #334155;">
          <header style="padding: 40px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 40px;">
            <span style="font-size: 0.85rem; font-weight: bold; color: #2563eb; text-transform: uppercase;">${post.category}</span>
            <h1 style="font-size: 2.2rem; color: #0f172a; margin-top: 10px; margin-bottom: 15px; line-height: 1.3;">${post.title}</h1>
            <p style="font-size: 1.1rem; color: #64748b; margin-bottom: 20px; font-style: italic;">${post.excerpt}</p>
            <div style="font-size: 0.85rem; color: #94a3b8;">
              Published by <strong>${post.author}</strong> on <span>${post.date}</span> (Updated: <span>${post.updatedDate || post.date}</span>) • <span>${post.readTime}</span>
            </div>
          </header>

          <article>
            ${bodyHtml}
          </article>
        </main>
      `;

      return { title, metaDescription: description, canonicalUrl, ogTags: "", twitterTags: "", rootHtml, schemaJson };
    }
  }

  // 13. INDIVIDUAL SOFTWARE PAGES
  if (p.startsWith('/software/')) {
    const slug = p.replace('/software/', '');
    const seoId = mapSlugToSeoId(slug);
    const softwareData = loadSoftwareData(projectRoot);
    const soft = softwareData[seoId];

    if (soft) {
      const title = `${soft.name} - Offline Lifetime Billing Software | BSP Suryatech`;
      const description = soft.introduction || `Download standard offline-first ${soft.name} for Windows PC. Handle client billing counters, inventory stock levels, and tax logs with 0 dependencies.`;
      const schemaJson = [
        organizationSchema,
        makeBreadcrumbs([
          { name: "Home", item: "https://bspsuryatech.in/" },
          { name: "Software", item: "https://bspsuryatech.in/downloads" },
          { name: soft.name, item: canonicalUrl }
        ]),
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": soft.name,
          "description": soft.introduction,
          "brand": {
            "@type": "Brand",
            "name": "BSP Suryatech"
          },
          "offers": {
            "@type": "Offer",
            "url": canonicalUrl,
            "priceCurrency": "INR",
            "price": "3000.00",
            "priceValidUntil": "2027-12-31",
            "itemCondition": "https://schema.org/NewCondition",
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "BSP Suryatech"
            }
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": soft.faq.map(f => ({
            "@type": "Question",
            "name": f.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": f.a
            }
          }))
        }
      ];

      const benefitsHTML = soft.benefits.map(b => `<li>${b}</li>`).join('\n');
      const modulesHTML = soft.modules.map(m => `<li>${m}</li>`).join('\n');
      const faqHTML = soft.faq.map(f => `
        <div style="margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
          <h3 style="font-size: 1.1rem; color: #0f172a; margin-bottom: 5px;">${f.q}</h3>
          <p style="color: #475569;">${f.a}</p>
        </div>
      `).join('\n');

      const rootHtml = `
        <main style="font-family: system-ui, sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; line-height: 1.6; color: #334155;">
          <header style="padding: 40px 0; border-bottom: 1px solid #e2e8f0; margin-bottom: 40px;">
            <span style="font-size: 0.85rem; font-weight: bold; color: #2563eb; text-transform: uppercase;">Professional Desktop ERP</span>
            <h1 style="font-size: 2.2rem; color: #0f172a; margin-top: 10px; margin-bottom: 15px;">${soft.name}</h1>
            <p style="font-size: 1.15rem; color: #475569; line-height: 1.6;">${soft.introduction}</p>
            <div style="margin-top: 25px;">
              <a href="/downloads" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Download Setup file</a>
              <a href="/contact" style="background: #e2e8f0; color: #0f172a; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; margin-left: 10px; display: inline-block;">Request AnyDesk Demo</a>
            </div>
          </header>

          <section style="margin-bottom: 40px;">
            <h2 style="font-size: 1.6rem; color: #0f172a; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">What is ${soft.name}?</h2>
            <p style="font-size: 1.05rem; margin-bottom: 20px;">${soft.whatIs}</p>
            <p style="font-size: 1.05rem;"><strong>Who Should Use:</strong> ${soft.whoShouldUse}</p>
          </section>

          <section style="margin-bottom: 40px; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px;">
              <h2 style="font-size: 1.3rem; color: #0f172a; margin-bottom: 15px;">Key Business Benefits</h2>
              <ul style="padding-left: 20px; space-y: 10px;">
                ${benefitsHTML}
              </ul>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px;">
              <h2 style="font-size: 1.3rem; color: #0f172a; margin-bottom: 15px;">Included Modules</h2>
              <ul style="padding-left: 20px; space-y: 10px;">
                ${modulesHTML}
              </ul>
            </div>
          </section>

          <section style="margin-bottom: 40px;">
            <h2 style="font-size: 1.6rem; color: #0f172a; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">How It Works & Setup Guides</h2>
            <p style="font-size: 1.05rem;">${soft.howItWorks}</p>
            <p style="font-size: 1.05rem; margin-top: 15px;"><strong>Product Comparison:</strong> ${soft.comparison}</p>
          </section>

          <section style="margin-bottom: 40px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 30px; border-radius: 12px;">
            <h2 style="font-size: 1.6rem; color: #0f172a; margin-bottom: 25px; text-align: center;">Frequently Asked Questions (FAQ)</h2>
            ${faqHTML}
          </section>

          <section style="margin-bottom: 40px;">
            <p style="font-size: 1.1rem; font-weight: bold; color: #0f172a;">Conclusion</p>
            <p>${soft.conclusion}</p>
          </section>
        </main>
      `;

      return { title, metaDescription: description, canonicalUrl, ogTags: "", twitterTags: "", rootHtml, schemaJson };
    }
  }

  // Fallback default
  return {
    title: "BSP Suryatech",
    metaDescription: "Premium SaaS portal and customer billing dashboard for BSP Suryatech Windows Billing, Inventory, GST, and POS software.",
    canonicalUrl,
    ogTags: "",
    twitterTags: "",
    rootHtml: `<div style="text-align: center; padding: 50px;"><h1>BSP Suryatech</h1><p>Premium Billing & ERP Software</p></div>`,
    schemaJson: organizationSchema
  };
}

// Injects the computed SEO headers and the HTML body into raw index.html template
export function injectSeoIntoTemplate(template: string, seo: any): string {
  let html = template;
  
  // Replace title
  html = html.replace(/<title>[^]*?<\/title>/gi, `<title>${seo.title}</title>`);
  
  // Strip old metadata elements to prevent duplication
  html = html.replace(/<meta\s+name="description"\s+content="[^]*?"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+property="og:[^]*?"\s+content="[^]*?"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+name="twitter:[^]*?"\s+content="[^]*?"\s*\/?>/gi, '');
  html = html.replace(/<meta\s+property="twitter:[^]*?"\s+content="[^]*?"\s*\/?>/gi, '');
  html = html.replace(/<link\s+rel="canonical"\s+href="[^]*?"\s*\/?>/gi, '');
  
  // Build new clean responsive SEO tags
  const newTags = `
    <meta name="description" content="${seo.metaDescription}" />
    <link rel="canonical" href="${seo.canonicalUrl}" />
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${seo.ogType || 'website'}" />
    <meta property="og:url" content="${seo.canonicalUrl}" />
    <meta property="og:title" content="${seo.ogTitle || seo.title}" />
    <meta property="og:description" content="${seo.metaDescription}" />
    <meta property="og:image" content="${seo.ogImage || 'https://bspsuryatech.in/assets/images/bsp_logo.png'}" />
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${seo.canonicalUrl}" />
    <meta name="twitter:title" content="${seo.title}" />
    <meta name="twitter:description" content="${seo.metaDescription}" />
    <meta name="twitter:image" content="${seo.ogImage || 'https://bspsuryatech.in/assets/images/bsp_logo.png'}" />
    <!-- JSON-LD Structured Data Schema -->
    <script type="application/ld+json">
      ${JSON.stringify(seo.schemaJson)}
    </script>
  `;
  
  // Place inside <head>
  html = html.replace('</head>', `${newTags}\n</head>`);
  
  // Inject into root div
  const rootDivStr = '<div id="root"></div>';
  const targetRootDiv = `<div id="root">\n${seo.rootHtml}\n</div>`;
  html = html.replace(rootDivStr, targetRootDiv);
  
  return html;
}

// Generate sitemap.xml dynamically including static routes, blogs, and softwares
export function generateDynamicSitemap(projectRoot: string): string {
  const blogs = loadBlogPosts(projectRoot);
  const softwares = [
    'retail_billing',
    'supermarket_pos',
    'grocery_billing',
    'medical_store',
    'restaurant_pos',
    'mobile_shop',
    'electronics_shop',
    'transport_erp',
    'hospital_erp',
    'laboratory_erp',
    'school_erp',
    'enterprise_erp',
    'hotel_erp',
    'repairing_erp'
  ];
  
  const staticUrls = [
    { loc: 'https://bspsuryatech.in/', freq: 'daily', prio: '1.0' },
    { loc: 'https://bspsuryatech.in/features', freq: 'weekly', prio: '0.8' },
    { loc: 'https://bspsuryatech.in/pricing', freq: 'weekly', prio: '0.9' },
    { loc: 'https://bspsuryatech.in/downloads', freq: 'daily', prio: '0.85' },
    { loc: 'https://bspsuryatech.in/tutorials', freq: 'weekly', prio: '0.75' },
    { loc: 'https://bspsuryatech.in/about', freq: 'monthly', prio: '0.70' },
    { loc: 'https://bspsuryatech.in/contact', freq: 'monthly', prio: '0.70' },
    { loc: 'https://bspsuryatech.in/blog', freq: 'daily', prio: '0.85' },
    { loc: 'https://bspsuryatech.in/privacy-policy', freq: 'monthly', prio: '0.50' },
    { loc: 'https://bspsuryatech.in/refund-policy', freq: 'monthly', prio: '0.50' },
    { loc: 'https://bspsuryatech.in/disclaimer', freq: 'monthly', prio: '0.50' },
  ];

  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 1. Static URLs
  for (const item of staticUrls) {
    xml += `  <url>\n`;
    xml += `    <loc>${item.loc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${item.freq}</changefreq>\n`;
    xml += `    <priority>${item.prio}</priority>\n`;
    xml += `  </url>\n`;
  }

  // 2. Software URLs
  for (const slug of softwares) {
    xml += `  <url>\n`;
    xml += `    <loc>https://bspsuryatech.in/software/${slug}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.80</priority>\n`;
    xml += `  </url>\n`;
  }

  // 3. Blog URLs
  for (const post of blogs) {
    let lastModDate = today;
    if (post.updatedDate) {
      try {
        lastModDate = new Date(post.updatedDate).toISOString().split('T')[0];
      } catch (e) {
        lastModDate = today;
      }
    } else if (post.date) {
      try {
        lastModDate = new Date(post.date).toISOString().split('T')[0];
      } catch (e) {
        lastModDate = today;
      }
    }
    
    xml += `  <url>\n`;
    xml += `    <loc>https://bspsuryatech.in/blog/${post.slug}</loc>\n`;
    xml += `    <lastmod>${lastModDate}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.75</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}
