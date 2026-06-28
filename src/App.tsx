/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from './supabaseClient';
import { loadRazorpayScript, createRazorpayOrder } from './services/razorpayService';
import { defaultProducts, defaultVideos, defaultTestimonials, defaultDownloads, defaultSolutions } from './data';
import { 
  CreditCard, 
  Coins, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Gift, 
  Sparkles, 
  Info, 
  IndianRupee,
  Smartphone,
  ExternalLink,
  QrCode,
  Building2,
  Wallet,
  Check
} from 'lucide-react';

import Layout from './components/Layout';
import Home from './components/Home';
import Features from './components/Features';
import Pricing from './components/Pricing';
import DownloadCenter from './components/DownloadCenter';
import Tutorials from './components/Tutorials';
import AboutUs from './components/AboutUs';
import Contact from './components/Contact';
import CustomerPortal from './components/CustomerPortal';
import SoftwareDetails from './components/SoftwareDetails';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentFailure from './components/PaymentFailure';
import PaymentVerification from './components/PaymentVerification';
import { TranslationProvider } from './components/TranslationContext';
import { useAdmin } from './components/AdminContext';
import { AdminDashboard } from './components/AdminDashboard';
import { logPageView, logEvent, logGA4Event } from './utils/analytics';
import SEOSchema from './components/SEOSchema';

let isInitialAuthCheckDone = false;

export default function App() {
  const { isAdminMode } = useAdmin();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [successPaymentState, setSuccessPaymentState] = useState<{
    orderId: string;
    paymentId: string;
    amount: number;
    productName: string;
  } | null>(null);
  const [failureErrorMessage, setFailureErrorMessage] = useState<string>('');
  const [selectedSoftwareId, setSelectedSoftwareId] = useState<string>('prod-billing-pro');
  const [user, setUser] = useState<any>(null);
  const [portalInitialView, setPortalInitialView] = useState<'dashboard' | 'tickets' | 'new-ticket' | 'profile' | 'payments' | 'invoices' | 'notifications'>('dashboard');
  const [products, setProducts] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [solutions, setSolutions] = useState<any[]>([]);
  const [totalDownloads, setTotalDownloads] = useState<number>(1420);
  const [videos, setVideos] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; type: 'success' | 'info' | 'error' }>>([]);
  const [cartItem, setCartItem] = useState<{
    id: string;
    name: string;
    category: string;
    selectedPlanId: string;
  } | null>(null);

  const handleAddToCartAndChoosePrice = (planId: string) => {
    const pId = planId || 'prod-billing-pro';
    
    // Check if it is a specific solution details from Download Center (e.g., matching sol-*)
    const foundSolution = solutions?.find((s: any) => s.id === pId);
    let productName = '';
    let isSolution = false;
    let price = 3000;
    let originalPrice = 6999;
    let features: string[] = [];
    let description = '';
    let icon = '🛍️';
    
    if (foundSolution) {
      productName = foundSolution.title;
      isSolution = true;
      price = Number(foundSolution.price?.replace(/[^0-9]/g, '')) || 3000;
      originalPrice = 6999;
      features = foundSolution.features || [];
      description = foundSolution.description || '';
      icon = foundSolution.icon || '🛍️';
    } else {
      const foundProduct = products?.find((p: any) => p.id === pId);
      productName = foundProduct?.name || (pId === 'prod-billing-enterprise' ? 'BSP Suryatech GST Enterprise Suite' : 'BSP Suryatech Retail Billing Pro');
      price = foundProduct?.price || 3000;
      originalPrice = foundProduct?.originalPrice || 6999;
      features = foundProduct?.features || [];
      description = foundProduct?.description || 'Offline Billing and Invoice Automation platform.';
    }
    
    setCartItem({
      id: pId,
      name: productName,
      category: 'Billing & POS Software',
      selectedPlanId: pId,
      price,
      originalPrice,
      features,
      isSolution,
      description,
      icon
    } as any);
    
    addNotification(`Added ${productName} to Cart! Select details in the Cart layout below.`, 'success');
    setCurrentPage('pricing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Checkout modal states (Simulated Secure Checkout Gateway)
  const [checkoutActive, setCheckoutActive] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{
    orderId: string;
    amount: number;
    keyId: string;
    productName: string;
    productId?: string;
    couponCode?: string;
  } | null>(null);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isRedirectingToRazorpay, setIsRedirectingToRazorpay] = useState(false);
  const [checkoutMop, setCheckoutMop] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [checkoutUpiMethod, setCheckoutUpiMethod] = useState<'vpa' | 'qr'>('qr');
  const [checkoutCardNo, setCheckoutCardNo] = useState('4111 1111 1111 1111');
  const [checkoutCardExpiry, setCheckoutCardExpiry] = useState('12/28');
  const [checkoutCardCvv, setCheckoutCardCvv] = useState('123');
  const [checkoutUpiId, setCheckoutUpiId] = useState('surya@okaxis');
  const [checkoutBank, setCheckoutBank] = useState('SBI');
  const [checkoutWallet, setCheckoutWallet] = useState('paytm');
  const [merchantUpiId, setMerchantUpiId] = useState('surajsurya.koo7@okaxis');

  // Initialize Google Analytics and setup global click tracking delegation
  useEffect(() => {

    const handleGlobalClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      
      // Traverse up to find an anchor tag, button, or clickable div/span
      while (target && target !== document.body) {
        const href = target.getAttribute('href') || '';
        const id = target.id || '';
        const textContent = (target.textContent || '').trim();
        const textLower = textContent.toLowerCase();
        const idLower = id.toLowerCase();
        const hrefLower = href.toLowerCase();
        
        // 1. WhatsApp click
        if (
          hrefLower.includes('wa.me') || 
          hrefLower.includes('whatsapp.com') || 
          hrefLower.includes('api.whatsapp.com') ||
          idLower.includes('whatsapp') ||
          textLower.includes('whatsapp')
        ) {
          logGA4Event('whatsapp_click', {
            button_text: textContent || 'WhatsApp Quick Chat',
            destination_url: href || 'https://wa.me/919516916415',
          });
          
          // If this WhatsApp click also doubles as a demo/quote request (such as the "WhatsApp Quote" box)
          if (textLower.includes('quote') || textLower.includes('demo')) {
            logGA4Event('demo_request', {
              button_text: textContent || 'WhatsApp Quote Demo Request',
              destination_url: href || 'https://wa.me/919516916415',
            });
          }
          break;
        }

        // 2. Call click (tel: links or helpline components)
        if (
          hrefLower.startsWith('tel:') || 
          textLower.includes('95169 16415') || 
          textLower.includes('9958742200') ||
          textLower.includes('9516916415') ||
          idLower.includes('helpline') ||
          idLower.includes('phone') ||
          (textLower.includes('call') && (textLower.includes('us') || textLower.includes('now') || textLower.includes('support')))
        ) {
          logGA4Event('call_click', {
            button_text: textContent || 'Call Support Line',
            destination_url: href || 'tel:+919516916415',
          });
          break;
        }

        // 3. Buy Now clicks (purchasing / checkout initiation)
        if (
          textLower.includes('buy now') ||
          textLower.includes('buy secure') ||
          textLower.includes('checkout') ||
          textLower.includes('purchase') ||
          textLower.includes('proceed to secure') ||
          textLower.includes('lifetime license key') ||
          idLower.includes('checkout') ||
          idLower.includes('buy')
        ) {
          logGA4Event('buy_now_click', {
            button_text: textContent || 'Buy Now / Initiate Checkout',
            destination_url: href || '',
          });
          break;
        }

        // 4. Demo request clicks (specific button selectors or walkthrough plays)
        if (
          textLower.includes('request demo') ||
          textLower.includes('watch demo') ||
          textLower.includes('video walkthrough') ||
          textLower.includes('youtube demo') ||
          textLower.includes('setup demo') ||
          idLower.includes('demo')
        ) {
          logGA4Event('demo_request', {
            button_text: textContent || 'Demo Request Walkthrough',
            destination_url: href || '',
          });
          break;
        }

        // 5. Pricing page or plan selector button clicks
        if (
          textLower.includes('pricing') ||
          textLower.includes('plans') ||
          textLower.includes('view pricing') ||
          textLower.includes('select plan') ||
          textLower.includes('select & configure') ||
          textLower.includes('choose') ||
          idLower.includes('pricing') ||
          idLower.includes('nav-item-pricing')
        ) {
          logGA4Event('pricing_button_click', {
            button_text: textContent || 'Pricing Selection Plan Click',
            destination_url: href || '',
          });
          break;
        }

        // 6. Direct Software Download
        if (
          hrefLower.endsWith('.zip') ||
          hrefLower.endsWith('.exe') ||
          idLower.includes('download-link') ||
          textLower.includes('download setup') ||
          textLower.includes('download trial')
        ) {
          logGA4Event('software_download', {
            software_name: textContent || id || 'direct-download',
            download_type: textLower.includes('trial') ? 'Trial' : 'Stable',
            destination_url: href || '',
            button_text: textContent || 'Download Setup Link',
          });
          break;
        }

        // 7. Standard Legacy YouTube logs compatibility
        if (href && (href.includes('youtube.com') || href.includes('youtu.be') || href.includes('@bspsuryatech'))) {
          logEvent('youtube_click', 'social', href);
          break;
        }

        target = target.parentElement;
      }
    };

    document.addEventListener('click', handleGlobalClick, { passive: true });
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  // Automatically track every page view & route change
  useEffect(() => {
    const currentPath = window.location.pathname;
    logPageView(currentPath);

    // Track pricing page visits
    if (currentPage === 'pricing') {
      logEvent('pricing_visited', 'engagement', 'Pricing Page');
    }

    // Track software detail page visits
    if (currentPage === 'software-details' && selectedSoftwareId) {
      logEvent('software_detail_visited', 'engagement', selectedSoftwareId);
    }
  }, [currentPage, selectedSoftwareId]);

  // Load active session from local storage / Supabase on mount
  useEffect(() => {
    console.log("App Component: Initializing direct serverless session load...");
    
    // 1) First check if there resides a login-redirect OAuth callback exchange code in the address bar
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      console.log('App: Found Google SSO authentication redirect code. Exchanging for active session...');
      supabase.auth.exchangeCodeForSession(code)
        .then(({ data, error }) => {
          if (error) {
            console.error('App: Google SSO exchange code error:', error.message);
            addNotification('Google Authentication failed: ' + error.message, 'error');
          } else {
            console.log('App: Google SSO session completed successfully!', data);
            // Clean browser address strings
            window.history.replaceState({}, document.title, '/');
            addNotification('Successfully logged in with Google SSO!', 'success');
            
            // Check if there are profiles to load
            if (data.user) {
              supabase.from('customer_profiles').select('*').eq('user_id', data.user.id).single()
                .then(({ data: profile }) => {
                  const u = {
                    id: data.user!.id,
                    email: data.user!.email,
                    name: profile?.client_name || data.user!.user_metadata?.full_name || data.user!.user_metadata?.name || data.user!.email?.split('@')[0],
                    role: 'customer',
                    profile: profile || null
                  };
                  setUser(u);
                  handleNavigatePage('portal');
                })
                .catch((profileErr: any) => {
                  console.warn("App: Non-blocking customer profiles look up error on Google login redirect:", profileErr);
                  const u = {
                    id: data.user!.id,
                    email: data.user!.email,
                    name: data.user!.user_metadata?.full_name || data.user!.user_metadata?.name || data.user!.email?.split('@')[0],
                    role: 'customer',
                    profile: null
                  };
                  setUser(u);
                  handleNavigatePage('portal');
                });
            }
          }
        })
        .catch(err => {
          console.error('App: Exception in Google OAuth callback stream handler:', err);
        });
    }

    // 2) Load standard Supabase Session if it is logged active
    const checkSupabaseSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session && session.user) {
          console.log("App: Restored functional Supabase single sign-on user ID:", session.user.id);
          
          // Query customer Profile
          const { data: profile } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          const u = {
            id: session.user.id,
            email: session.user.email,
            name: profile?.client_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
            role: 'customer',
            profile: profile || null
          };
          setUser(u);
          localStorage.setItem('bsp_token', session.access_token);
        } else {
          // Backward compatible token fallback
          const localToken = localStorage.getItem('bsp_token');
          if (localToken && !isInitialAuthCheckDone) {
            console.log("App: Local storage authentication fallback active, but no active Supabase session found.");
          }
        }
        isInitialAuthCheckDone = true;
      } catch (err) {
        console.warn("App: Exception restoring serverless user session on mount:", err);
      }
    };

    checkSupabaseSession();

    // 3) Hook up a single onAuthStateChange listener to keep auth state perfectly reactive
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`App: Supabase Auth state changed event [${event}]`);
      if (session && session.user) {
        try {
          const { data: profile } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          const u = {
            id: session.user.id,
            email: session.user.email,
            name: profile?.client_name || session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
            role: 'customer',
            profile: profile || null
          };
          setUser(u);
          localStorage.setItem('bsp_token', session.access_token);
        } catch (e) {
          console.warn("App: Exception syncing user profile on auth change event:", e);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('bsp_token');
      }
    });

    // Check deep links or manual redirection paths
    const path = window.location.pathname;
    if (path === '/payment-verification' || window.location.hash === '#/payment-verification') {
      setCurrentPage('payment-verification');
    } else if (path === '/features') {
      setCurrentPage('features');
    } else if (path === '/pricing') {
      setCurrentPage('pricing');
    } else if (path === '/downloads') {
      setCurrentPage('downloads');
    } else if (path === '/tutorials') {
      setCurrentPage('tutorials');
    } else if (path === '/about') {
      setCurrentPage('about');
    } else if (path === '/contact') {
      setCurrentPage('contact');
    } else if (path === '/portal') {
      setCurrentPage('portal');
    } else if (path.startsWith('/software/')) {
      const prodId = path.replace('/software/', '');
      setSelectedSoftwareId(prodId);
      setCurrentPage('software-details');
    }

    // Handle back/forward buttons using HTML5 history popstate
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/' || currentPath === '') {
        setCurrentPage('home');
      } else if (currentPath === '/payment-verification') {
        setCurrentPage('payment-verification');
      } else if (currentPath === '/features') {
        setCurrentPage('features');
      } else if (currentPath === '/pricing') {
        setCurrentPage('pricing');
      } else if (currentPath === '/downloads') {
        setCurrentPage('downloads');
      } else if (currentPath === '/tutorials') {
        setCurrentPage('tutorials');
      } else if (currentPath === '/about') {
        setCurrentPage('about');
      } else if (currentPath === '/contact') {
        setCurrentPage('contact');
      } else if (currentPath === '/portal') {
        setCurrentPage('portal');
      } else if (currentPath.startsWith('/software/')) {
        const prodId = currentPath.replace('/software/', '');
        setSelectedSoftwareId(prodId);
        setCurrentPage('software-details');
      }
    };
    window.addEventListener('popstate', handlePopState);

    // Fetch master catalogs
    fetchProducts();
    fetchTestimonials();
    fetchDownloads();
    fetchVideos();
    fetchSolutions();

    // Custom event listener for instant updates when edited in admin panel
    const handleProductsUpdated = () => {
      fetchProducts();
    };
    window.addEventListener('products_updated', handleProductsUpdated);

    const pollInterval = setInterval(() => {
      fetchProducts();
      fetchVideos();
      fetchSolutions();
    }, 8000); // Polling index catalogs periodically

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('products_updated', handleProductsUpdated);
      window.removeEventListener('popstate', handlePopState);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Fetch latest downloads automatically when navigating to the Download Center page
  useEffect(() => {
    if (currentPage === 'downloads') {
      fetchDownloads();
      fetchSolutions();
    }
  }, [currentPage]);

  // Handle SEO-friendly hash routing with deep link fallback
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/software/')) {
        const slug = hash.replace('#/software/', '');
        // Match the slug or direct ID on loaded products
        const matched = products.find((p: any) => p.id === slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug);
        if (matched) {
          setSelectedSoftwareId(matched.id);
          setCurrentPage('software-details');
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    if (products && products.length > 0) {
      handleHashChange();
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [products]);

  // Listen for dynamic automated checkout events from external components or Customer Portal
  useEffect(() => {
    const handleAutomatedCheckoutTrigger = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (detail && detail.productId) {
        handleInitiateSimulatedCheckout(detail.productId);
      }
    };
    window.addEventListener('trigger_automated_checkout', handleAutomatedCheckoutTrigger);
    return () => window.removeEventListener('trigger_automated_checkout', handleAutomatedCheckoutTrigger);
  }, [user?.id, products?.length, solutions?.length]);

  const fetchProducts = async () => {
    let loaded = false;
    try {
      console.log("App: Querying products directly from Supabase DB...");
      const { data: sbData, error: sbError } = await supabase.from('products').select('*');
      if (sbData && !sbError) {
        if (sbData.length > 0) {
          const parsedProducts = sbData.map(item => ({
            ...item,
            price: item.price ? Number(item.price) : (item.id === 'prod-billing-pro' ? 999 : 2999),
            originalPrice: item.original_price ? Number(item.original_price) : (item.id === 'prod-billing-pro' ? 2499 : 4999),
            downloadUrl: item.download_url || item.downloadUrl,
            connectedPlan: item.connected_plan || item.connectedPlan,
            category: item.category || 'Retail & POS Billing',
            fullDescription: item.full_description || item.fullDescription || item.description || '',
            systemRequirements: item.system_requirements || item.systemRequirements || '',
            licenseInfo: item.license_info || item.licenseInfo || '',
            demoVideoUrl: item.demo_video_url || item.demoVideoUrl || '',
            gallery: typeof item.gallery === 'string' ? JSON.parse(item.gallery) : (Array.isArray(item.gallery) ? item.gallery : []),
            features: typeof item.features === 'string' ? JSON.parse(item.features) : (item.features || []),
            manualUrl: item.manual_url || item.manualUrl,
            status: item.status || 'active'
          }));
          setProducts(parsedProducts);
        } else {
          setProducts([]);
        }
        loaded = true;
      } else {
        if (sbError) console.log("App: Supabase products table fetch error:", sbError.message);
      }
    } catch (err) {
      console.warn('Products load from Supabase exception:', err);
    }

    if (!loaded) {
      try {
        console.log("App: Fetching products fallback from Express API...");
        const res = await fetch('/api/products');
        if (res.ok) {
          const apiData = await res.json();
          if (apiData && apiData.length > 0) {
            const parsedProducts = apiData.map((item: any) => ({
              ...item,
              price: item.price ? Number(item.price) : (item.id === 'prod-billing-pro' ? 999 : 2999),
              originalPrice: item.original_price || item.originalPrice ? Number(item.original_price || item.originalPrice) : (item.id === 'prod-billing-pro' ? 2499 : 4999),
              downloadUrl: item.download_url || item.downloadUrl,
              connectedPlan: item.connected_plan || item.connectedPlan,
              category: item.category || 'Retail & POS Billing',
              fullDescription: item.full_description || item.fullDescription || item.description || '',
              systemRequirements: item.system_requirements || item.systemRequirements || '',
              licenseInfo: item.license_info || item.licenseInfo || '',
              demoVideoUrl: item.demo_video_url || item.demoVideoUrl || '',
              gallery: typeof item.gallery === 'string' ? JSON.parse(item.gallery) : (Array.isArray(item.gallery) ? item.gallery : []),
              features: typeof item.features === 'string' ? JSON.parse(item.features) : (item.features || []),
              manualUrl: item.manual_url || item.manualUrl,
              status: item.status || 'active'
            }));
            setProducts(parsedProducts);
            loaded = true;
          }
        }
      } catch (apiErr) {
        console.warn('Products load from Local Express API exception:', apiErr);
      }
    }

    if (!loaded) {
      console.log("App: Falling back to static client-side defaultProducts");
      setProducts(defaultProducts);
    }
  };

  const fetchVideos = async () => {
    try {
      console.log("App: Fetching videos directly from Supabase DB...");
      const { data, error } = await supabase.from('video_tutorials').select('*');
      if (data && !error && data.length > 0) {
        const mapped = data.map((v: any) => ({
          id: v.id,
          title: v.title,
          duration: v.duration,
          youtubeId: v.youtube_id || v.youtubeId || '',
          thumbnail: v.thumbnail,
          description: v.description
        }));
        setVideos(mapped);
      } else {
        if (error) console.log("App: Supabase video tutorials table fallback error:", error.message);
        setVideos(defaultVideos);
      }
    } catch (err) {
      console.warn('Videos load exception. Using static defaults:', err);
      setVideos(defaultVideos);
    }
  };

  const fetchTestimonials = async () => {
    try {
      console.log("App: Fetching testimonials direct from Supabase...");
      const { data, error } = await supabase.from('testimonials').select('*');
      if (data && !error && data.length > 0) {
        setTestimonials(data);
      } else {
        if (error) console.log("App: Supabase testimonials table empty or missing, using local default:", error.message);
        setTestimonials(defaultTestimonials);
      }
    } catch (err) {
      console.warn('Testimonial loading exception. Using static defaults:', err);
      setTestimonials(defaultTestimonials);
    }
  };

  const fetchDownloads = async () => {
    try {
      console.log("App: Fetching release downloads info fallback direct from Supabase...");
      const { data, error } = await supabase.from('downloads_info').select('*');
      if (data && !error && data.length > 0) {
        const formatted = data.map(item => ({
          ...item,
          releaseNotes: typeof item.releaseNotes === 'string' ? JSON.parse(item.releaseNotes) : (item.release_notes || item.releaseNotes || [])
        }));
        setDownloads(formatted);
        const counts = formatted.reduce((sum, item) => sum + (item.download_count || item.downloadCount || 0), 0);
        setTotalDownloads(counts || 1420);
      } else {
        if (error) console.log("App: Supabase downloads table empty or missing, using local default:", error.message);
        setDownloads(defaultDownloads);
        setTotalDownloads(1420);
      }
    } catch (err) {
      console.warn('Downloads load exception. Using static defaults:', err);
      setDownloads(defaultDownloads);
      setTotalDownloads(1420);
    }
  };

  const fetchSolutions = async () => {
    try {
      console.log("App: Loading Download Center software products directly from solutions datastore...");
      const { data: sbData, error: sbError } = await supabase.from('solutions').select('*');
      let solutionsList = sbData;
      
      if (sbError || !solutionsList) {
        console.log("App: Fallback to local Express API for solutions...");
        const localRes = await fetch('/api/solutions');
        if (localRes.ok) {
          solutionsList = await localRes.json();
        }
      }

      if (solutionsList && solutionsList.length > 0) {
        const mapped = solutionsList.map((item: any) => {
          let featuresArr: string[] = [];
          if (Array.isArray(item.features)) {
            featuresArr = item.features;
          } else if (typeof item.features === 'string') {
            try {
              const parsed = JSON.parse(item.features);
              featuresArr = Array.isArray(parsed) ? parsed : [];
            } catch {
              featuresArr = item.features.split('\n').map((f: string) => f.trim()).filter(Boolean);
            }
          }
          
          const titleVal = item.title || item.name || '';
          const categoryVal = item.category || 'Billing Software';
          const priceVal = typeof item.price === 'number' 
            ? '₹' + item.price.toLocaleString() 
            : (item.price ? (item.price.toString().startsWith('₹') ? item.price : '₹' + item.price.toString()) : '₹3,000');

          return {
            id: item.id,
            mappedPlanId: item.mappedPlanId || item.id,
            title: titleVal,
            category: categoryVal,
            subtitle: item.subtitle || (item.is_featured ? 'FEATURED PRODUCT' : categoryVal.toUpperCase()),
            description: item.description || '',
            price: priceVal,
            features: featuresArr.length > 0 ? featuresArr : ['GST Invoicing', 'Barcode Scanner Support', 'Thermal Printer Setup', 'Offline Database State'],
            icon: item.icon || item.logo_url || '🛍️',
            badge: item.badge || (item.is_featured ? 'Featured' : (item.is_new_arrival ? 'New' : (item.is_bestseller ? 'Bestseller' : 'Active'))),
            badgeColor: item.badgeColor || (item.is_featured ? 'emerald' : (item.is_new_arrival ? 'blue' : (item.is_bestseller ? 'rose' : 'emerald'))),
            exeUrl: item.exeUrl || item.trial_download_url || item.setup_exe_url || item.download_url || '',
            status: item.status || (item.is_hidden ? 'inactive' : 'active'),
            displayOrder: item.displayOrder !== undefined ? item.displayOrder : (item.display_order !== undefined ? item.display_order : 10)
          };
        });
        
        console.log("App: Dynamic solutions generated successfully from solutions:", mapped);
        setSolutions(mapped);
      } else {
        setSolutions(defaultSolutions);
      }
    } catch (err: any) {
      console.warn("Solutions mapping pipeline exception:", err?.message || err);
      setSolutions(defaultSolutions);
    }
  };

  // Toast notifications helpers
  const [userLicenses, setUserLicenses] = useState<any[]>([]);

  const fetchUserLicenses = async (userOverride?: any) => {
    const currentUser = userOverride || user;
    if (!currentUser) {
      setUserLicenses([]);
      return;
    }
    try {
      console.log("App: Loading owner system licenses direct from Supabase...");
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', currentUser.id);

      if (data && !error) {
        const mapped = data.map(item => ({
          ...item,
          licenseKey: item.license_key,
          expiresAt: item.expires_at,
          productId: item.product_id,
          productName: item.product_name,
          orderId: item.order_id,
          userId: item.user_id,
          createdAt: item.created_at
        }));
        setUserLicenses(mapped || []);
      } else {
        if (error) console.log("App: Supabase licenses fetch error:", error.message);
        setUserLicenses([]);
      }
    } catch (err) {
      console.warn('Licenses load exception:', err);
      setUserLicenses([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserLicenses();
    } else {
      setUserLicenses([]);
    }
  }, [user]);

  const addNotification = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNavigatePage = (page: string) => {
    if (page.startsWith('software-details:')) {
      const parts = page.split(':');
      setSelectedSoftwareId(parts[1]);
      setCurrentPage('software-details');
      window.history.pushState({}, '', `/software/${parts[1]}`);
      return;
    }
    if (page === 'portal') {
      setPortalInitialView('dashboard');
    }

    const canonicalPaths: Record<string, string> = {
      home: '/',
      features: '/features',
      pricing: '/pricing',
      downloads: '/downloads',
      tutorials: '/tutorials',
      about: '/about',
      contact: '/contact',
      portal: '/portal',
      'payment-verification': '/payment-verification'
    };

    const targetPath = canonicalPaths[page] || '/';
    window.history.pushState({}, '', targetPath);
    setCurrentPage(page);
  };

  const handleLoginSuccess = (token: string, userData: any) => {
    localStorage.setItem('bsp_token', token);
    const updatedUser = {
      ...userData,
      role: userData.role || 'customer'
    };
    setUser(updatedUser);

    // Check if there is a pending checkout redirect saved in localStorage before login
    const pendingJson = localStorage.getItem('checkout_pending_after_login');
    if (pendingJson) {
      try {
        const pending = JSON.parse(pendingJson);
        localStorage.removeItem('checkout_pending_after_login');
        addNotification('Restoring your checkout request...', 'info');
        setTimeout(() => {
          handleInitiateSimulatedCheckout(pending.selectedPlanId, pending.appliedCoupon, updatedUser, {
            customerMobile: pending.customerMobile,
            customerCompany: pending.customerCompany,
            customerGst: pending.customerGst
          });
        }, 600);
        return;
      } catch (_) {}
    }

    handleNavigatePage('portal');
  };

  const handleLogout = () => {
    localStorage.removeItem('bsp_token');
    setUser(null);
    setCurrentPage('home');
    addNotification('Logged out successfully', 'info');
  };

  // Product downloader with auth and trial vs paid access guards
  const handleTriggerTrialDownload = async (prodId: string, isFull: boolean = false) => {
    if (!user) {
      addNotification('Customer registration is required before downloading Suryatech installations.', 'info');
      localStorage.setItem('portal_auth_tab', 'register');
      setCurrentPage('portal');
      return;
    }

    // Resolve product ID mapping dynamically
    let productId = prodId;
    if (prodId.toLowerCase().includes('enterprise') || prodId.toLowerCase().includes('plan-enterprise')) {
      productId = 'prod-billing-enterprise';
    } else if (prodId.toLowerCase().includes('pro') || prodId.toLowerCase().includes('plan-retail-pro')) {
      productId = 'prod-billing-pro';
    }

    if (isFull) {
      // Check if they own active license for this product
      const ownsLicense = userLicenses.some(lic => 
        lic.productId === prodId || 
        lic.productId === productId ||
        lic.productId === 'prod-billing-pro' ||
        lic.productId === 'prod-billing-enterprise' ||
        (lic.productName && lic.productName.toLowerCase().includes(prodId.toLowerCase())) ||
        (lic.productName && prodId.toLowerCase().includes(lic.productName.toLowerCase()))
      );
      if (!ownsLicense) {
        addNotification(`"${productId.includes('enterprise') ? 'Suryatech GST Enterprise Suite' : 'Suryatech Retail Billing Pro'}" is a Paid Software. Redirecting to the Pricing / Purchase page...`, 'error');
        setCurrentPage('pricing');
        return;
      }
    }

    // Start setup payload download
    addNotification(`Initiating ${isFull ? 'Full Version' : 'Free Trial'} Windows (.EXE) installation download...`, 'success');
    
    // Serve the real POS executable setup if they complete payment (isFull version download is active)
    try {
      console.log("App: Triggering binary download setup of:", prodId);
      
      let cleanId = prodId.toLowerCase();
      // Inspect owned licenses to find a matching one and get the real productName to resolve the correct setup download file format
      const matchingLic = userLicenses.find(lic => 
        lic.productId === prodId || 
        lic.id === prodId ||
        (lic.productName && lic.productName.toLowerCase().includes(prodId.toLowerCase())) ||
        (lic.productName && prodId.toLowerCase().includes(lic.productName.toLowerCase()))
      );
      if (matchingLic && matchingLic.productName) {
        cleanId = (cleanId + " " + matchingLic.productName.toLowerCase()).trim();
      }

      // Look up matching solution to retrieve precise exeUrl format
      const matchedSol = solutions.find(s => 
        s.id === prodId || 
        (s.mappedPlanId && s.mappedPlanId === prodId) ||
        (s.title && s.title.toLowerCase() === prodId.toLowerCase()) ||
        (s.title && prodId.toLowerCase().includes(s.title.toLowerCase())) ||
        (s.title && s.title.toLowerCase().includes(prodId.toLowerCase()))
      ) || defaultSolutions.find(s => 
        s.id === prodId || 
        (s.mappedPlanId && s.mappedPlanId === prodId) ||
        (s.title && s.title.toLowerCase() === prodId.toLowerCase()) ||
        (s.title && prodId.toLowerCase().includes(s.title.toLowerCase())) ||
        (s.title && s.title.toLowerCase().includes(prodId.toLowerCase()))
      );

      // Construct standard fallback if no solution found
      let fallbackExeName = prodId;
      if (cleanId.includes('restaurant')) fallbackExeName = 'BSP-Restaurant-POS-KOT-v1.0.0';
      else if (cleanId.includes('mobile')) fallbackExeName = 'Mobile-Shop-Billing-v1.0.0';
      else if (cleanId.includes('electronics')) fallbackExeName = 'Electronics-Shop-Billing-v1.0.0';
      else if (cleanId.includes('transport') || cleanId.includes('safewheels')) fallbackExeName = 'SafeWheels-ERP-v1.0.0';
      else if (cleanId.includes('hospital') || cleanId.includes('clinic')) fallbackExeName = 'Hospital-Management-ERP-v3.0.0';
      else if (cleanId.includes('diagnostic') || cleanId.includes('lab') || cleanId.includes('laboratory')) fallbackExeName = 'Laboratory-Management-ERP-v3.0.0';
      else if (cleanId.includes('school')) fallbackExeName = 'School-Management-ERP-v3.0.0';
      else if (cleanId.includes('hotel')) fallbackExeName = 'Hotel-Management-ERP-v3.0.0';
      else if (cleanId.includes('repairing') || cleanId.includes('electrical')) fallbackExeName = 'BSP-SuryaTech-Flow-ERP-v1.0.0';
      else if (cleanId.includes('medical')) fallbackExeName = 'Medical-Store-ERP-v3.0.0';
      else if (cleanId.includes('grocery')) fallbackExeName = 'BSP-Mart-POS-v1.0.0';
      else if (cleanId.includes('supermarket')) fallbackExeName = 'BSP-Mart-POS-v1.0.0';
      else if (cleanId.includes('billing-pro') || cleanId.includes('retail') || cleanId.includes('pro')) fallbackExeName = 'BSP-Mart-POS-v1.0.0';
      else if (cleanId.includes('enterprise') || cleanId.includes('warehouse') || cleanId.includes('inventory') || cleanId.includes('erp')) fallbackExeName = 'Inventory-Management-ERP-v3.0.0';
      
      let directUrl = matchedSol?.exeUrl || `https://bspsuryatech.in/downloads/${fallbackExeName}`;
      if (directUrl) {
        // Strip out any unwanted setup / setup.exe / exe extensions to format perfectly
        directUrl = directUrl
          .replace(/\.Setup\.exe\.zip$/i, '.zip')
          .replace(/\.Setup\.zip$/i, '.zip')
          .replace(/\.Setup\.exe$/i, '.zip')
          .replace(/\.exe\.zip$/i, '.zip')
          .replace(/\.Setup$/i, '')
          .replace(/\.exe$/i, '');
      }
      if (directUrl && !directUrl.toLowerCase().endsWith('.zip')) {
        directUrl = `${directUrl}.zip`;
      }

      // Format final download name to match clean zip structure BSP-Mart-POS-v1.0.0.zip
      let finalDownloadName = '';
      if (directUrl) {
        const urlParts = directUrl.split('/');
        finalDownloadName = urlParts[urlParts.length - 1];
      } else {
        finalDownloadName = fallbackExeName;
      }

      finalDownloadName = finalDownloadName
        .replace(/\.Setup\.exe\.zip$/i, '.zip')
        .replace(/\.Setup\.zip$/i, '.zip')
        .replace(/\.Setup\.exe$/i, '.zip')
        .replace(/\.exe\.zip$/i, '.zip')
        .replace(/\.exe$/i, '.zip')
        .replace(/\.Setup$/i, '');

      if (!finalDownloadName.toLowerCase().endsWith('.zip')) {
        finalDownloadName = finalDownloadName + '.zip';
      }

      console.log("App: Clean direct download URL resolved for setup:", directUrl, "Saving as:", finalDownloadName);

      // Track the download in Google Analytics 4
      logGA4Event('software_download', {
        software_name: prodId,
        download_type: isFull ? 'Full' : 'Trial',
        destination_url: directUrl,
        button_text: isFull ? 'DOWNLOAD FULL VERSION' : 'DOWNLOAD TRIAL',
      });

      // Create a temporary anchor element to trigger high-speed direct stream securely and safely in iframes
      const link = document.createElement('a');
      link.href = directUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('download', finalDownloadName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      console.warn("Exception packaging installation blob client-side:", e);
    }

    setTimeout(() => {
      fetchDownloads();
      addNotification('Download started successfully! Launch the setup in folder to run offline.', 'success');
    }, 2000);
  };

  // Direct serverless order validation helper to dispatch licenses, orders, invoices, payments, and notifications
  const verifyOrderInDatabase = async (
    orderId: string,
    productId: string,
    productName: string,
    amount: number,
    paymentId: string,
    status: 'success' | 'failed',
    paymentMethod: string,
    couponCode?: string,
    userOverride?: any
  ) => {
    const currentUser = userOverride || user;
    if (!currentUser) return;
    console.log("App: Committing order payment transaction status directly to Supabase with ID:", orderId);
    
    try {
      // Fetch user profile info first for invoice documentation
      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      // 1. Write payment record
      const orderRecord = {
        id: orderId,
        user_id: currentUser.id,
        user_email: currentUser.email,
        user_name: currentUser?.name || currentUser?.email?.split('@')[0],
        product_id: productId,
        product_name: productName,
        amount: amount,
        coupon_code: couponCode || null,
        status: status === 'success' ? 'completed' : 'pending', // "completed" or "pending" as requested
        payment_id: paymentId,
        created_at: new Date().toISOString()
      };

      const { error: orderErr } = await supabase.from('orders').insert(orderRecord);
      if (orderErr) {
        console.error("Direct order write returned DB error:", orderErr.message);
      }

      if (status === 'success') {
        // 2. Generate and write customer licensing records
        const licenseKey = 'BSP-' + Array.from({length: 4}, () => Math.random().toString(36).substr(2, 5).toUpperCase()).join('-');
        
        const licenseRecord = {
          id: 'lic_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          user_id: currentUser.id,
          user_email: currentUser.email,
          order_id: orderId,
          product_id: productId,
          product_name: productName,
          license_key: licenseKey,
          status: 'active',
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiration
          created_at: new Date().toISOString()
        };

        const { error: licErr } = await supabase.from('licenses').insert(licenseRecord);
        if (licErr) {
          console.error("Direct license write returned DB error:", licErr.message);
        }

        // 3. Write payment verification confirmation metadata
        const invoiceNumber = 'INV-' + Date.now().toString().substr(-6) + '-' + Math.floor(10 + Math.random() * 90);
        const paymentRecord = {
          id: 'pay_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          invoice_number: invoiceNumber,
          transaction_id: paymentId,
          payment_method: paymentMethod,
          amount: amount,
          payment_date: new Date().toISOString(),
          status: 'success',
          order_id: orderId,
          user_id: currentUser.id
        };

        const { error: payErr } = await supabase.from('payments').insert(paymentRecord);
        if (payErr) {
          console.error("Direct payment write returned error:", payErr.message);
        }

        // 4. Generate detail GST Compliant Client Invoice
        const gstAmount = parseFloat((amount * 0.18).toFixed(2)); // 18% GST calculation
        const netAmount = parseFloat((amount - gstAmount).toFixed(2));
        const invoiceRecord = {
          id: 'inv_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          invoice_number: invoiceNumber,
          order_id: orderId,
          user_id: currentUser.id,
          client_name: profile?.client_name || currentUser?.name || currentUser?.email?.split('@')[0],
          business_name: profile?.business_name || 'Retail Enterprise Partner',
          email_address: currentUser.email,
          contact_number: profile?.contact_number || '9999999999',
          amount: amount,
          gst_amount: gstAmount,
          net_amount: netAmount,
          product_name: productName,
          license_key: licenseKey,
          created_at: new Date().toISOString()
        };

        const { error: invErr } = await supabase.from('invoices').insert(invoiceRecord);
        if (invErr) {
          console.error("Direct invoice write returned error:", invErr.message);
        }

        // 5. Dispatch customized portal notifications
        const notificationRecord = {
          id: 'not_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          user_id: currentUser.id,
          title: 'Suryatech Subscription Serial Dispatched!',
          message: `Your BSP Suryatech software serial subscription key for ${productName} was activated successfully. Key: ${licenseKey}`,
          type: 'success',
          read: false,
          created_at: new Date().toISOString()
        };

        const { error: notErr } = await supabase.from('notifications').insert(notificationRecord);
        if (notErr) {
          console.error("Direct notification dispatch returned error:", notErr.message);
        }

        addNotification('Payment success! Serial keys and invoice dispatched.', 'success');
      } else {
        addNotification('Payment verification status: Failed.', 'error');
      }
      
      // Refresh user states
      await fetchUserLicenses(currentUser);
    } catch (dbErr: any) {
      console.warn("Serverless direct insertion fallback active for transactions:", dbErr.message);
      // Fallback local memory list update if tables don't exist yet
      if (status === 'success') {
        addNotification('Simulated verification fallback success!', 'success');
      }
    }
  };

  // Order initialization and direct Razorpay same-tab redirection (Requirement 1, 2)
  const handleInitiateSimulatedCheckout = async (
    productId: string, 
    couponCode?: string, 
    userOverride?: any,
    extraBillingDetails?: {
      customerMobile?: string;
      customerCompany?: string;
      customerGst?: string;
    }
  ) => {
    const currentUser = userOverride || user;
    if (!currentUser) {
      addNotification('Please log in or register to purchase a license plan.', 'info');
      setPortalInitialView('dashboard');
      handleNavigatePage('portal');
      return;
    }

    if (checkoutLoading) {
      return;
    }

    setCheckoutLoading(true);
    setIsRedirectingToRazorpay(false);
    addNotification('Initializing secure manual activation booking...', 'info');

    try {
      // Resolve product pricing locally
      let resolvedName = '';
      let resolvedPrice = 3000;
      
      const selectedProduct = products.find((p: any) => p.id === productId);
      if (selectedProduct) {
        resolvedName = selectedProduct.name;
        resolvedPrice = selectedProduct.price;
      } else {
        // Check solution catalogs
        const selectedSol = solutions.find((s: any) => s.id === productId);
        if (selectedSol) {
          resolvedName = selectedSol.title;
          resolvedPrice = Number(selectedSol.price?.replace(/[^0-9]/g, '')) || 3000;
        } else {
          resolvedName = productId === 'prod-billing-enterprise' ? 'BSP Suryatech GST Enterprise Suite' : 'BSP Suryatech Retail Billing Pro';
          resolvedPrice = 3000;
        }
      }

      let finalAmount = resolvedPrice;
      if (couponCode) {
        try {
          const resVal = await fetch('/api/coupons/validate-checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
              code: couponCode,
              productId,
              orderAmount: resolvedPrice,
              email: currentUser.email
            })
          });
          if (resVal.ok) {
            const valData = await resVal.json();
            finalAmount = valData.finalAmount;
            console.log('[CHECKOUT LOG] Verified coupon discount applied. Final price: INR ', finalAmount);
          } else {
            const errData = await resVal.json().catch(() => ({}));
            const errMsg = errData.error || 'The applied coupon code is invalid or has expired.';
            addNotification(`Coupon Error: ${errMsg}`, 'error');
            setCheckoutLoading(false);
            return;
          }
        } catch (valErr: any) {
          console.warn('[CHECKOUT WARNING] Coupon verification error:', valErr);
        }
      }

      // 1. Create the pending order on the backend to obtain a secure Order Reference
      const token = localStorage.getItem('bsp_token') || localStorage.getItem('supabase_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json; charset=utf-8' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let generatedOrderId = 'ORD-BSP-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      try {
        const res = await fetch('/api/orders/create', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            productId,
            couponCode: couponCode || '',
            quantity: 1,
            customerName: currentUser.name || currentUser.email?.split('@')[0] || '',
            customerEmail: currentUser.email,
            customerMobile: extraBillingDetails?.customerMobile || '',
            customerCompany: extraBillingDetails?.customerCompany || '',
            customerGst: extraBillingDetails?.customerGst || '',
          })
        });

        if (res.ok) {
          const orderData = await res.json();
          if (orderData && orderData.orderId) {
            generatedOrderId = orderData.orderId;
            console.log('[CHECKOUT LOG] Order registered on backend successfully:', generatedOrderId);
          }
        } else {
          console.warn('[CHECKOUT WARNING] Backend order creation returned non-ok. Falling back to local offline-friendly ID.');
        }
      } catch (fetchErr: any) {
        console.warn('[CHECKOUT EXCEPTION] Backend order creation unreachable or offline. Falling back to safe offline-friendly ID:', fetchErr.message || fetchErr);
      }

      // 2. Clear previous draft and save the draft transaction pre-fill logs to localStorage
      localStorage.setItem('bsp_pending_manual_activation', JSON.stringify({
        orderId: generatedOrderId,
        amount: finalAmount,
        productId,
        productName: resolvedName,
        customerName: currentUser.name || currentUser.email?.split('@')[0] || '',
        customerEmail: currentUser.email,
        customerMobile: extraBillingDetails?.customerMobile || '',
        customerCompany: extraBillingDetails?.customerCompany || '',
        customerGst: extraBillingDetails?.customerGst || '',
        timestamp: new Date().toISOString()
       }));

      // 3. Try integrating the REAL Razorpay Checkout Overlay dynamically (Dual-Mode Overlay System)
      try {
        addNotification('Loading secure transactional interface...', 'info');
        const scriptLoaded = await loadRazorpayScript();
        if (scriptLoaded) {
          const amountInPaise = finalAmount * 100;
          let rzpOrderId: string | undefined = undefined;
          let razorpayKey = 'rzp_live_T1nYz3RnnW4F0o'; // User provided gateway key for BSP Suryatech

          try {
            const orderResponse = await createRazorpayOrder(amountInPaise);
            if (orderResponse && (orderResponse.id || orderResponse.order_id)) {
              rzpOrderId = orderResponse.id || orderResponse.order_id;
              razorpayKey = orderResponse.key || orderResponse.key_id || razorpayKey;
              console.log('[RAZORPAY SUCCESS] Backend pre-checkout order initiated:', rzpOrderId);
            }
          } catch (fetchErr: any) {
            console.warn('[RAZORPAY FALLBACK] Backend order pre-creation failed. Launching Razorpay direct checkout mode: ', fetchErr.message || fetchErr);
          }

          addNotification(rzpOrderId ? 'Payment order generated. Opening secure overlay...' : 'Opening secure payment overlay...', 'success');
          
          const options: any = {
            key: razorpayKey,
            amount: amountInPaise,
            currency: 'INR',
            name: 'BSP Suryatech',
            description: 'BSP Suryatech Billing Software Purchase',
            image: "https://bspsuryatech.in/logo.png",
            prefill: {
              name: currentUser.name || currentUser.username || '',
              email: currentUser.email || '',
              contact: extraBillingDetails?.customerMobile || '',
            },
            theme: {
              color: '#3b82f6',
            },
            handler: async (response: any) => {
              console.log('[RAZORPAY DIRECT SUCCESS]', response);
              addNotification('Payment received! Instantly activating your license...', 'success');
              
              try {
                // Re-fetch current user:
                const { data: authData } = await supabase.auth.getUser();
                const freshUser = authData?.user;
                if (!freshUser) {
                  throw new Error('Authenticated user profile was not found.');
                }

                const updatedUser = {
                  id: freshUser.id,
                  email: freshUser.email,
                  name: freshUser.user_metadata?.full_name || freshUser.user_metadata?.name || freshUser.email?.split('@')[0],
                  role: 'customer'
                };
                setUser(updatedUser);

                // Call direct serverless order validation helper to insert order and license directly:
                await verifyOrderInDatabase(
                  generatedOrderId,
                  productId,
                  resolvedName,
                  finalAmount,
                  response.razorpay_payment_id || response.razorpay_order_id || 'manual',
                  'success',
                  'Razorpay Online Payment',
                  couponCode,
                  updatedUser
                );
                
                addNotification('License instantly approved & generated! Look below.', 'success');
                setPortalInitialView('licenses');
                handleNavigatePage('portal');
              } catch (apiErr: any) {
                console.error('[INSTANT VERIFY API ERROR]', apiErr);
                addNotification('Payment captured, but transaction registration failed: ' + apiErr.message, 'error');
                setPortalInitialView('orders');
                handleNavigatePage('portal');
              }
              
              setCheckoutLoading(false);
              setIsRedirectingToRazorpay(false);
            },
            modal: {
              ondismiss: () => {
                console.log('[RAZORPAY DISMISSED BY USER]');
                addNotification('Checkout cancelled by user.', 'info');
                setCheckoutLoading(false);
                setIsRedirectingToRazorpay(false);
              }
            }
          };

          // If standard backend pre-order succeeded, pass 'order_id'
          if (rzpOrderId) {
            options.order_id = rzpOrderId;
          }

          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', (resp: any) => {
            console.error('[RAZORPAY FAILURE]', resp.error);
            addNotification(`Payment unsuccessful: ${resp.error.description || 'Decline'}`, 'error');
          });
          rzp.open();
          setCheckoutLoading(false);
          return; // Successfully handled via Live Pop-up Overlay!
        }
      } catch (sdkError: any) {
        console.warn('[RAZORPAY AUTOMATIC MODAL SYSTEM UNAVAILABLE - FALLBACK TRIGGERED]', sdkError);
      }

      // 4. Elegant Fallback to Hosted Custom Payment Link & Manual Activation Code Submission
      addNotification('Instant popup unavailable. Redirecting to manual UPI/card secure receipt gateway...', 'success');
      
      // Mark as redirecting to render secure redirection layout helper inside modal
      setIsRedirectingToRazorpay(true);

      // Delay briefly so the notification can be read, then redirect securely
      setTimeout(() => {
        try {
          window.location.href = 'https://razorpay.me/@bspsuryatech';
        } catch (redirectErr) {
          console.error('[REDIRECT FAILURE]', redirectErr);
        }
      }, 1200);

    } catch (e: any) {
      console.error('[ACTIVATION REDIRECT ERROR]', e);
      addNotification(e.message || 'Verification connection issues. Please try again.', 'error');
      setIsRedirectingToRazorpay(false);
      setCheckoutLoading(false);
    }
  };

  // Complete simulated/manual pay status
  const handleCompleteSimulatedPayment = async (status: 'success' | 'failed') => {
    if (!checkoutData) return;

    setCheckoutLoading(true);
    const paymentId = status === 'success' 
      ? 'pay_SIM_' + Math.random().toString(36).substr(2, 10).toUpperCase() 
      : 'pay_FAILED_' + Date.now();

    let selectedPaymentMethod = 'UPI';
    if (status === 'success') {
      if (checkoutMop === 'card') {
        selectedPaymentMethod = 'Card';
      } else if (checkoutMop === 'upi') {
        selectedPaymentMethod = checkoutUpiMethod === 'vpa' ? `UPI_VPA_${checkoutUpiId}` : 'UPI_QR';
      } else if (checkoutMop === 'netbanking') {
        selectedPaymentMethod = `Netbanking_${checkoutBank}`;
      } else if (checkoutMop === 'wallet') {
        selectedPaymentMethod = `Wallet_${checkoutWallet}`;
      }
    }

    try {
      // Notify secure local Express API verification of manual status simulation
      const token = localStorage.getItem('bsp_token');
      let backendSuccess = false;

      try {
        console.log("[PAYMENT LOG] Instantly verifying simulated payment via local Express API (/api/orders/verify)...");
        const response = await fetch('/api/orders/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            orderId: checkoutData.orderId,
            status,
            paymentMethod: selectedPaymentMethod
          })
        });

        if (response.ok) {
          const resData = await response.json();
          console.log("[PAYMENT LOG] Local Express API verified simulated payment successfully. Verification Result:", resData);
          addNotification('Payment verified by secure local engine successfully!', 'success');
          backendSuccess = true;
        } else {
          const errText = await response.text();
          console.warn("[PAYMENT LOG] Local Express API returned non-ok status for verification:", response.status, errText);
        }
      } catch (eVer: any) {
        console.warn("[PAYMENT LOG] Local Express API verification unreachable/errored. Parsing offline-first safety sync:", eVer.message || eVer);
      }

      // If backend verification didn't process successfully, invoke client-side direct Supabase fallback sync
      if (!backendSuccess) {
        console.log("[PAYMENT LOG] Invoking client-side direct database write fallback to ensure serial generation...");
        await verifyOrderInDatabase(
          checkoutData.orderId,
          checkoutData.productId || 'prod-billing-pro',
          checkoutData.productName,
          checkoutData.amount,
          paymentId,
          status,
          selectedPaymentMethod,
          checkoutData.couponCode
        );
      } else {
        // Explicitly trigger client-side license reload if backend successfully synchronized
        await fetchUserLicenses();
      }

      setCheckoutActive(false);
      setCheckoutData(null);
      setCurrentPage('portal');
    } catch (err: any) {
      console.error(err);
      addNotification('Payment verification encounter error: ' + err.message, 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (isAdminMode) {
    return (
      <AdminDashboard 
        user={user} 
        onLogout={handleLogout} 
        onAddNotification={addNotification} 
      />
    );
  }

  return (
    <TranslationProvider user={user}>
      <SEOSchema 
        currentPage={currentPage} 
        productId={selectedSoftwareId} 
        products={products} 
        solutions={solutions} 
      />
      <Layout 
        currentPage={currentPage}
        onPageChange={handleNavigatePage} 
        user={user}
        onLogout={handleLogout}
        notifications={notifications}
        removeNotification={removeNotification}
        cartItem={cartItem}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full"
            id={`page-${currentPage}`}
          >
          {currentPage === 'home' && (
            <Home 
              onPageChange={handleNavigatePage} 
              products={products}
              onTriggerTrialDownload={handleTriggerTrialDownload}
              testimonials={testimonials}
            />
          )}

          {currentPage === 'features' && (
            <Features onPageChange={handleNavigatePage} />
          )}

          {currentPage === 'pricing' && (
            <Pricing 
              onPageChange={handleNavigatePage}
              products={products}
              user={user}
              onInitiateSimulatedCheckout={handleInitiateSimulatedCheckout}
              cartItem={cartItem}
              setCartItem={setCartItem}
            />
          )}

          {currentPage === 'downloads' && (
            <DownloadCenter 
              downloads={downloads}
              totalDownloads={totalDownloads}
              onTriggerTrialDownload={handleTriggerTrialDownload}
              onPageChange={handleNavigatePage}
              onAddToCart={handleAddToCartAndChoosePrice}
              solutions={solutions}
            />
          )}

          {currentPage === 'tutorials' && (
            <Tutorials videos={videos} />
          )}

          {currentPage === 'about' && (
            <AboutUs />
          )}

          {currentPage === 'contact' && (
            <Contact onAddNotification={addNotification} />
          )}

          {currentPage === 'software-details' && (
            <SoftwareDetails 
              productId={selectedSoftwareId}
              products={products}
              solutions={solutions}
              onPageChange={handleNavigatePage}
              onTriggerTrialDownload={handleTriggerTrialDownload}
              onInitiateSimulatedCheckout={handleAddToCartAndChoosePrice}
              user={user}
            />
          )}

          {currentPage === 'portal' && (
            <CustomerPortal 
              user={user}
              onLoginSuccess={handleLoginSuccess}
              onAddNotification={addNotification}
              onPageChange={handleNavigatePage}
              onTriggerTrialDownload={handleTriggerTrialDownload}
              initialView={portalInitialView}
            />
          )}

          {currentPage === 'payment-success' && successPaymentState && (
            <PaymentSuccess 
              orderId={successPaymentState.orderId}
              paymentId={successPaymentState.paymentId}
              amount={successPaymentState.amount}
              productName={successPaymentState.productName}
              onGoToDashboard={() => {
                setPortalInitialView('dashboard');
                handleNavigatePage('portal');
                window.dispatchEvent(new Event('reload_customer_datastore'));
              }}
            />
          )}

          {currentPage === 'payment-failure' && (
            <PaymentFailure 
              errorMessage={failureErrorMessage}
              onRetry={() => {
                handleNavigatePage('pricing');
              }}
              onGoBack={() => {
                handleNavigatePage('home');
              }}
            />
          )}

          {currentPage === 'payment-verification' && (
            <PaymentVerification 
              user={user}
              onPageChange={handleNavigatePage}
              onAddNotification={addNotification}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {checkoutLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md animate-fade-in" id="full-page-instant-activation-loader">
          <div className="flex flex-col items-center bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center space-y-6">
            {isRedirectingToRazorpay ? (
              <>
                <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400">
                  <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-sans font-black text-white text-xl tracking-tight">Redirecting to Razorpay Secure Portal</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-sm mx-auto">
                    We are initiating your secure license booking record. You will be redirected to complete payment with UPI, Card, Netbanking, or Wallet.
                  </p>
                </div>

                {/* Secure Redirection Direct Fallback Link */}
                <div className="w-full space-y-3">
                  <a 
                    href="https://razorpay.me/@bspsuryatech"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      addNotification('Opening Razorpay secure portal...', 'info');
                    }}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>Proceed to Razorpay Link</span>
                  </a>
                  
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('https://razorpay.me/@bspsuryatech');
                      addNotification('URL copied. You can paste and pay on any browser tab!', 'success');
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-350 border border-slate-750 text-[10px] font-mono font-bold uppercase rounded-xl transition cursor-pointer"
                  >
                    🔗 Copy Payment Link URL
                  </button>
                </div>

                <div className="w-full border-t border-slate-800/80 pt-4 flex flex-col gap-2 font-sans">
                  <button 
                    onClick={() => {
                      setIsRedirectingToRazorpay(false);
                      setCheckoutLoading(false);
                      handleNavigatePage('portal');
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-extrabold hover:underline cursor-pointer"
                  >
                    I have completed my payment. Go to My Orders & Submit Proof
                  </button>
                  <button 
                    onClick={() => {
                      setIsRedirectingToRazorpay(false);
                      setCheckoutLoading(false);
                    }}
                    className="text-[10px] text-slate-500 hover:text-red-400 font-mono font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    ⚠️ Cancel Activation Redirection
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <h3 className="font-bold text-white text-lg font-sans tracking-tight">Booking Lifetime License</h3>
                <p className="text-xs text-slate-400 font-mono">Preregistering secure system activation booking order...</p>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
    </TranslationProvider>
  );
}
