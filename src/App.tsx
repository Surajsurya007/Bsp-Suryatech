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
import { TranslationProvider } from './components/TranslationContext';

export default function App() {
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
    let price = 1999;
    let originalPrice = 6999;
    let features: string[] = [];
    let description = '';
    let icon = '🛍️';
    
    if (foundSolution) {
      productName = foundSolution.title;
      isSolution = true;
      price = Number(foundSolution.price?.replace(/[^0-9]/g, '')) || 1999;
      originalPrice = 6999;
      features = foundSolution.features || [];
      description = foundSolution.description || '';
      icon = foundSolution.icon || '🛍️';
    } else {
      const foundProduct = products?.find((p: any) => p.id === pId);
      productName = foundProduct?.name || (pId === 'prod-billing-enterprise' ? 'BSP Suryatech GST Enterprise Suite' : 'BSP Suryatech Retail Billing Pro');
      price = foundProduct?.price || 1999;
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
  const [checkoutMop, setCheckoutMop] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [checkoutUpiMethod, setCheckoutUpiMethod] = useState<'vpa' | 'qr'>('qr');
  const [checkoutCardNo, setCheckoutCardNo] = useState('4111 1111 1111 1111');
  const [checkoutCardExpiry, setCheckoutCardExpiry] = useState('12/28');
  const [checkoutCardCvv, setCheckoutCardCvv] = useState('123');
  const [checkoutUpiId, setCheckoutUpiId] = useState('surya@okaxis');
  const [checkoutBank, setCheckoutBank] = useState('SBI');
  const [checkoutWallet, setCheckoutWallet] = useState('paytm');
  const [merchantUpiId, setMerchantUpiId] = useState('surajsurya.koo7@okaxis');

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
          if (localToken) {
            console.log("App: Local storage authentication fallback active, but no active Supabase session found.");
          }
        }
      } catch (err) {
        console.warn("App: Exception restoring serverless user session on mount:", err);
      }
    };

    checkSupabaseSession();

    // Fetch master catalogs
    fetchProducts();
    fetchTestimonials();
    fetchDownloads();
    fetchVideos();
    fetchSolutions();

    const pollInterval = setInterval(() => {
      fetchProducts();
      fetchVideos();
      fetchSolutions();
    }, 8000); // Polling index catalogs periodically

    return () => clearInterval(pollInterval);
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
  }, [user, products, solutions]);

  const fetchProducts = async () => {
    try {
      console.log("App: Querying products directly from Supabase DB...");
      const { data: sbData, error: sbError } = await supabase.from('products').select('*');
      if (sbData && !sbError && sbData.length > 0) {
        const parsedProducts = sbData.map(item => ({
          ...item,
          price: 1999,
          originalPrice: 6999,
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
        if (sbError) console.log("App: Supabase products table fetch error:", sbError.message);
        setProducts(defaultProducts);
      }
    } catch (err) {
      console.warn('Products load exception. Using static defaults:', err);
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
      console.log("App: Fetching solutions direct from Supabase...");
      const { data, error } = await supabase.from('solutions').select('*');
      if (data && !error && data.length > 0) {
        const parsed = data.map((item: any) => ({
          ...item,
          price: 'INR 1,999'
        }));
        setSolutions(parsed);
      } else {
        console.log("App: Supabase solutions table empty, missing or gave error, loading from local Express API (/api/solutions)...", error?.message || "");
        const localRes = await fetch('/api/solutions');
        if (localRes.ok) {
          const localData = await localRes.json();
          const parsed = localData.map((item: any) => ({
            ...item,
            price: 'INR 1,999'
          }));
          setSolutions(parsed);
        } else {
          setSolutions(defaultSolutions);
        }
      }
    } catch (err: any) {
      console.warn("Solutions load exception, attempting local Express API fallback...", err?.message || err);
      try {
        const localRes = await fetch('/api/solutions');
        if (localRes.ok) {
          const localData = await localRes.json();
          const parsed = localData.map((item: any) => ({
            ...item,
            price: 'INR 1,999'
          }));
          setSolutions(parsed);
        } else {
          setSolutions(defaultSolutions);
        }
      } catch (innerErr) {
        setSolutions(defaultSolutions);
      }
    }
  };

  // Toast notifications helpers
  const [userLicenses, setUserLicenses] = useState<any[]>([]);

  const fetchUserLicenses = async () => {
    if (!user) {
      setUserLicenses([]);
      return;
    }
    try {
      console.log("App: Loading owner system licenses direct from Supabase...");
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', user.id);

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
      return;
    }
    if (page === 'portal') {
      setPortalInitialView('dashboard');
    }
    setCurrentPage(page);
  };

  const handleLoginSuccess = (token: string, userData: any) => {
    localStorage.setItem('bsp_token', token);
    const updatedUser = {
      ...userData,
      role: 'customer'
    };
    setUser(updatedUser);
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
    
    // Simulate high-fidelity binary download client-side instantly via standard anchor Blob
    try {
      console.log("App: Triggering direct binary Blob packaging for EXE download setup of:", prodId);
      const exeName = prodId.endsWith('.exe') ? prodId : `BSPSuryatech_${prodId}_v${prodId.includes('enterprise')? '5.0.3':'4.2.1'}_Setup.exe`;
      const blob = new Blob(["BSP Suryatech Retail Billing installation setup executable file stream. Runs 100% offline."], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exeName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
    couponCode?: string
  ) => {
    console.log("App: Committing order payment transaction status directly to Supabase with ID:", orderId);
    
    try {
      // Fetch user profile info first for invoice documentation
      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // 1. Write payment record
      const orderRecord = {
        id: orderId,
        user_id: user.id,
        user_email: user.email,
        user_name: user?.name || user?.email?.split('@')[0],
        product_id: productId,
        product_name: productName,
        amount: amount,
        coupon_code: couponCode || null,
        status: status, // "success" or "failed"
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
          user_id: user.id,
          user_email: user.email,
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
          user_id: user.id
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
          user_id: user.id,
          client_name: profile?.client_name || user?.name || user?.email?.split('@')[0],
          business_name: profile?.business_name || 'Retail Enterprise Partner',
          email_address: user.email,
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
          user_id: user.id,
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
      await fetchUserLicenses();
    } catch (dbErr: any) {
      console.warn("Serverless direct insertion fallback active for transactions:", dbErr.message);
      // Fallback local memory list update if tables don't exist yet
      if (status === 'success') {
        addNotification('Simulated verification fallback success!', 'success');
      }
    }
  };

  // Order initialization and Profile Completion guard
  const handleInitiateSimulatedCheckout = async (productId: string, couponCode?: string) => {
    if (!user) {
      addNotification('Please log in or register to purchase a license plan.', 'info');
      setPortalInitialView('dashboard');
      handleNavigatePage('portal');
      return;
    }

    if (checkoutLoading) {
      // Prevent duplicate payment requests
      return;
    }

    addNotification('Verifying your billing profile details...', 'info');
    try {
      // 1. Fetch customer profile info directly from Supabase DB to verify completion status
      console.log("App: Querying customer profile completion indices for ID:", user.id);
      const { data: profile, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no profile rows found
        throw new Error(error.message);
      }
      
      // Determine if profile fields are completed
      const isProfileCompleted = profile && 
        profile.client_name && 
        profile.business_name && 
        profile.contact_number && 
        profile.business_address && 
        profile.city && 
        profile.state && 
        profile.pincode;

      if (!isProfileCompleted) {
        addNotification('Please complete your billing profile details before proceeding to purchase.', 'error');
        setPortalInitialView('profile');
        handleNavigatePage('portal');
        return;
      }

      // 2. Profile is completed! Start secure checkout sequence
      setCheckoutLoading(true);
      addNotification('Loading secure Razorpay gateway module...', 'info');

      // Resolve product pricing locally
      let resolvedName = '';
      let resolvedPrice = 1999;
      
      const selectedProduct = products.find((p: any) => p.id === productId);
      if (selectedProduct) {
        resolvedName = selectedProduct.name;
        resolvedPrice = selectedProduct.price;
      } else {
        // Check solution catalogs
        const selectedSol = solutions.find((s: any) => s.id === productId);
        if (selectedSol) {
          resolvedName = selectedSol.title;
          resolvedPrice = Number(selectedSol.price?.replace(/[^0-9]/g, '')) || 1999;
        } else {
          resolvedName = productId === 'prod-billing-enterprise' ? 'BSP Suryatech GST Enterprise Suite' : 'BSP Suryatech Retail Billing Pro';
          resolvedPrice = 1999;
        }
      }

      let finalAmount = resolvedPrice;
      if (couponCode) {
        try {
          const { data: couponData } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', couponCode)
            .maybeSingle();
          if (couponData && couponData.discountPercent) {
            finalAmount = Math.ceil(resolvedPrice * (1 - couponData.discountPercent / 100));
          }
        } catch (_) {}
      }

      // Load Razorpay checkout.js script dynamically
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Could not load Razorpay payment gateway script. Please verify your internet connection.');
      }

      // Calculate amount in Paise
      const amountInPaise = Math.round(finalAmount * 100);

      // Call Supabase Edge Function to generate the Razorpay Order
      addNotification('Requesting secure order signature from bank gateways...', 'info');
      const orderResponse = await createRazorpayOrder(amountInPaise);

      // Validate returned order response properties
      const orderId = orderResponse.id || orderResponse.order_id;
      if (!orderId) {
        throw new Error('Failed to retrieve a valid transaction order reference from server.');
      }

      // Initialize billing prefills
      const prefillName = profile.client_name || user.name || user.email?.split('@')[0] || '';
      const prefillEmail = user.email || '';
      const prefillContact = profile.contact_number || '9999999999';

      addNotification('Opening secure payment gateway desk...', 'success');

      const options: any = {
        key: orderResponse.key || orderResponse.key_id || 'rzp_test_placeholder',
        amount: orderResponse.amount || amountInPaise,
        currency: orderResponse.currency || 'INR',
        name: 'BSP Suryatech',
        description: resolvedName,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            setCheckoutLoading(true);
            addNotification('Payment authorized successfully. Generating license certificates...', 'info');
            console.log('[RAZORPAY SUCCESS] Response payload:', response);

            const gatewayPaymentId = response.razorpay_payment_id || `pay_rzp_${Date.now()}`;
            const gatewayOrderId = response.razorpay_order_id || orderId;

            // Save transaction and generate products license keys inside database
            await verifyOrderInDatabase(
              gatewayOrderId,
              productId,
              resolvedName,
              finalAmount,
              gatewayPaymentId,
              'success',
              'Razorpay',
              couponCode
            );

            // Populate state for the success receipt display
            setSuccessPaymentState({
              orderId: gatewayOrderId,
              paymentId: gatewayPaymentId,
              amount: finalAmount,
              productName: resolvedName
            });

            setCheckoutLoading(false);
            handleNavigatePage('payment-success');
            addNotification('License serial activated and dispatched successfully!', 'success');
          } catch (handlerErr: any) {
            console.error('[RAZORPAY HANDLER ERROR]', handlerErr);
            setFailureErrorMessage(handlerErr.message || 'Transaction was successful but we could not write back the active license details. Please contact helpline support with your payment ID.');
            setCheckoutLoading(false);
            handleNavigatePage('payment-failure');
          }
        },
        prefill: {
          name: prefillName,
          email: prefillEmail,
          contact: prefillContact
        },
        theme: {
          color: '#2563EB'
        },
        modal: {
          ondismiss: () => {
            console.log('[RAZORPAY MODAL DISMISSED] Checkout closed before completion.');
            addNotification('Payment checkout cancelled.', 'info');
            setCheckoutLoading(false);
          }
        }
      };

      // Instantiates Razorpay modal
      const rzp = new (window as any).Razorpay(options);

      // Listen for runtime payment errors or banking blockages
      rzp.on('payment.failed', (failResponse: any) => {
        console.error('[RAZORPAY TRANSACTION FAILURE]', failResponse.error);
        const reason = failResponse.error.description || failResponse.error.reason || 'Payment failed on gateway client.';
        
        // Save failed record for safety/audit tracking
        verifyOrderInDatabase(
          orderId,
          productId,
          resolvedName,
          finalAmount,
          failResponse.error.metadata?.payment_id || `failed_${Date.now()}`,
          'failed',
          'Razorpay',
          couponCode
        ).catch(() => {});

        setFailureErrorMessage(reason);
        setCheckoutLoading(false);
        handleNavigatePage('payment-failure');
        addNotification(`Payment failed: ${reason}`, 'error');
      });

      rzp.open();
      // Remove overlay spinner while the user interacts with the payment dialog iframe
      setCheckoutLoading(false);

    } catch (e: any) {
      console.error('[RAZORPAY INITIATION PROCESS EXCEPTION]', e);
      setCheckoutLoading(false);
      setFailureErrorMessage(e.message || 'Verification connection issues. Please try again.');
      addNotification('Error initiating Razorpay transaction: ' + (e.message || 'network connection timeout'), 'error');
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

  return (
    <TranslationProvider user={user}>
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
        </motion.div>
      </AnimatePresence>

      {checkoutLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in" id="full-page-instant-activation-loader">
          <div className="flex flex-col items-center bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <h3 className="font-bold text-white text-lg font-sans tracking-tight">Activating License</h3>
            <p className="text-xs text-slate-400 font-mono">Syncing database & generating license serial keys...</p>
          </div>
        </div>
      )}
    </Layout>
    </TranslationProvider>
  );
}
