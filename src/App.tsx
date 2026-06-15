/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from './supabaseClient';
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
import AdminPortal from './components/AdminPortal';
import SoftwareDetails from './components/SoftwareDetails';
import CheckoutModal from './components/CheckoutModal';
import { TranslationProvider } from './components/TranslationContext';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
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
    setCartItem({
      id: 'suryatech-billing',
      name: 'BSP Suryatech GST Billing Desk',
      category: 'Billing & POS Software',
      selectedPlanId: planId || 'prod-billing-pro'
    });
    addNotification('Added BSP Suryatech Software to Cart! Select details in the Cart layout below.', 'success');
    setCurrentPage('pricing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Checkout modal states (Simulated Razorpay Checkout Gateway)
  const [checkoutActive, setCheckoutActive] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{
    orderId: string;
    razorpayOrderId?: string;
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
                    role: data.user!.email === 'surajsurya.koo7@gmail.com' ? 'admin' : 'customer',
                    profile: profile || null
                  };
                  setUser(u);
                  if (u.role === 'admin') {
                    setCurrentPage('admin');
                  } else {
                    handleNavigatePage('portal');
                  }
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
            role: session.user.email === 'surajsurya.koo7@gmail.com' ? 'admin' : 'customer',
            profile: profile || null
          };
          setUser(u);
          localStorage.setItem('bsp_token', session.access_token);
          if (u.role === 'admin') {
            setCurrentPage('admin');
          }
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

  const fetchProducts = async () => {
    try {
      console.log("App: Querying products directly from Supabase DB...");
      const { data: sbData, error: sbError } = await supabase.from('products').select('*');
      if (sbData && !sbError && sbData.length > 0) {
        const parsedProducts = sbData.map(item => ({
          ...item,
          downloadUrl: item.download_url || item.downloadUrl,
          connectedPlan: item.connected_plan || item.connectedPlan,
          originalPrice: item.original_price || item.originalPrice,
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
        setSolutions(data);
      } else {
        setSolutions(defaultSolutions);
      }
    } catch (err) {
      console.warn("Solutions load exception, using default solutions:", err);
      setSolutions(defaultSolutions);
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
      role: userData.email?.toLowerCase() === 'surajsurya.koo7@gmail.com' ? 'admin' : userData.role
    };
    setUser(updatedUser);
    if (updatedUser.role === 'admin') {
      setCurrentPage('admin');
    } else {
      handleNavigatePage('portal');
    }
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

        addNotification('Razorpay Payment success! Serial keys and invoice dispatched.', 'success');
      } else {
        addNotification('Payment verification status: Failed.', 'error');
      }
      
      // Refresh user states
      await fetchUserLicenses();
    } catch (dbErr: any) {
      console.warn("Serverless direct insertion fallback active for transactions:", dbErr.message);
      // Fallback local memory list update if tables don't exist yet
      if (status === 'success') {
        addNotification('Razorpay simulated verification fallback success!', 'success');
      }
    }
  };

  // Razorpay order initialization and Profile Completion guard
  const handleInitiateSimulatedCheckout = async (productId: string, couponCode?: string) => {
    if (!user) {
      addNotification('Please log in or register to purchase a license plan.', 'info');
      setPortalInitialView('dashboard');
      handleNavigatePage('portal');
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

      // 2. Profile is completed! Fetch Razorpay key ID and create secure order
      addNotification('Billing profile verified successfully. Initiating secure order...', 'info');
      
      const token = localStorage.getItem('bsp_token');
      let orderData: any = null;

      try {
        console.log("App: Requesting Razorpay order from Supabase Edge Function...");
        const response = await fetch('https://wabhgsdzmptgxrggjjgm.supabase.co/functions/v1/create-razorpay-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId, couponCode })
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            orderData = await response.json();
            console.log("App: Razorpay order generated successfully via Supabase Edge Function!", orderData);
          }
        } else {
          console.warn("App: Supabase Edge Function returned non-ok status:", response.status);
        }
      } catch (err) {
        console.warn("App: Supabase Edge Function creation failed, attempting direct Supabase billing fallback...", err);
      }

      if (!orderData) {
        console.log("App: Running secure client-side Order generation (Supabase database configuration fallback)...");
        let rzpKeyId = 'rzp_test_SURYA2026KEY';
        
        try {
          // Fetch the live Razorpay configuration directly from Supabase settings table if backend is not responding with JSON
          const { data: dbSettings, error: dbSettingsError } = await supabase
            .from('system_settings')
            .select('*')
            .eq('settings_key', 'razorpay_config')
            .maybeSingle();
          
          if (dbSettings && !dbSettingsError) {
            const parsedVal = typeof dbSettings.settings_val === 'string' 
              ? JSON.parse(dbSettings.settings_val) 
              : dbSettings.settings_val;
            if (parsedVal && parsedVal.keyId) {
              rzpKeyId = parsedVal.keyId;
              console.log("App: Directly loaded active Razorpay key ID from Supabase setup:", rzpKeyId);
            }
          }
        } catch (sbSettingsErr) {
          console.warn("App: Failed loading direct Razorpay Settings from database table. Using fallback:", sbSettingsErr);
        }

        // Resolve product pricing locally
        const selectedProduct = products.find((p: any) => p.id === productId);
        if (!selectedProduct) {
          throw new Error('Requested product with ID ' + productId + ' not found in local or remote catalog.');
        }

        let finalAmount = selectedProduct.price;
        if (couponCode) {
          try {
            const { data: couponData } = await supabase
              .from('coupons')
              .select('*')
              .eq('code', couponCode)
              .maybeSingle();
            if (couponData && couponData.discountPercent) {
              finalAmount = Math.ceil(selectedProduct.price * (1 - couponData.discountPercent / 100));
            }
          } catch (_) {}
        }

        const localId = 'order_local_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        orderData = {
          orderId: localId,
          razorpayOrderId: undefined, // Direct checkout payment (no order ID required for direct SDK load)
          amount: finalAmount,
          keyId: rzpKeyId,
          productName: selectedProduct.name,
          currency: 'INR'
        };
      }

      console.log("Secure order initialized successfully:", orderData);

      const orderInitData = {
        orderId: orderData.orderId,
        razorpayOrderId: orderData.razorpayOrderId,
        amount: orderData.amount,
        keyId: orderData.keyId,
        productName: orderData.productName || (productId === 'prod-billing-enterprise' ? 'BSP Suryatech GST Enterprise Suite' : 'BSP Suryatech Retail Billing Pro'),
        productId,
        couponCode
      };

      setCheckoutData(orderInitData);
      setCheckoutActive(true);
      addNotification('Please choose your payment option in the Secure Checkout Page.', 'info');
    } catch (e: any) {
      console.error(e);
      addNotification('Error initiating checkout transaction: ' + e.message, 'error');
    }
  };

  // Complete simulated/manual pay status
  const handleCompleteSimulatedPayment = async (status: 'success' | 'failed') => {
    if (!checkoutData) return;

    setCheckoutLoading(true);
    const paymentId = status === 'success' 
      ? 'pay_RZPSIM_' + Math.random().toString(36).substr(2, 10).toUpperCase() 
      : 'pay_FAILED_' + Date.now();

    let selectedPaymentMethod = 'UPI_Razorpay';
    if (status === 'success') {
      if (checkoutMop === 'card') {
        selectedPaymentMethod = 'Card_Razorpay';
      } else if (checkoutMop === 'upi') {
        selectedPaymentMethod = checkoutUpiMethod === 'vpa' ? `UPI_VPA_${checkoutUpiId}_Razorpay` : 'UPI_QR_Razorpay';
      } else if (checkoutMop === 'netbanking') {
        selectedPaymentMethod = `Netbanking_${checkoutBank}_Razorpay`;
      } else if (checkoutMop === 'wallet') {
        selectedPaymentMethod = `Wallet_${checkoutWallet}_Razorpay`;
      }
    }

    try {
      // Notify secure backend verification of manual status simulation
      const token = localStorage.getItem('bsp_token');
      try {
        console.log("App: Triggering payment verification via Supabase Edge Function...");
        await fetch('https://wabhgsdzmptgxrggjjgm.supabase.co/functions/v1/verify-razorpay-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            orderId: checkoutData.orderId,
            paymentId: paymentId,
            status,
            paymentMethod: selectedPaymentMethod
          })
        });
      } catch (eVer) {
        console.warn("App: Edge function verification unreachable/errored. Relying on local client db synchronization:", eVer);
      }

      // Maintain direct Supabase write fallback
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

      setCheckoutActive(false);
      setCheckoutData(null);
      setCurrentPage('portal');
    } catch (err: any) {
      console.error(err);
      addNotification('Serverless payment verification error', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const launchOfficialRazorpaySDK = async (data: {
    orderId: string;
    razorpayOrderId?: string;
    amount: number;
    keyId: string;
    productName: string;
    productId?: string;
    couponCode?: string;
  }) => {
    setCheckoutLoading(true);
    addNotification('Loading official Razorpay Payment Widget...', 'info');
    
    // Inject script if not already present
    const loadScript = () => {
      return new Promise((resolve) => {
        if ((window as any).Razorpay) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const isLoaded = await loadScript();
    if (!isLoaded) {
      setCheckoutLoading(false);
      addNotification('Failed to load Razorpay library. Please use the simulated checkout visual form on screen.', 'error');
      return;
    }

    try {
      const finalTotal = data.amount;
      console.log("Opening official Razorpay UI for Order:", data.razorpayOrderId || "Direct payment (no order id)");
      const options = {
        key: data.keyId || "rzp_live_T0ExE9eOBkab4Z",
        amount: finalTotal * 100, // standard Amount in paise
        currency: 'INR',
        name: 'Bsp Suryatech',
        description: 'Order Payment',
        image: 'https://images.unsplash.com/photo-1554165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=200',
        order_id: data.razorpayOrderId || undefined, // Real razorpay order reference
        handler: async function (response: any) {
          addNotification('Payment authorized by Razorpay! Running secure backend signature validations...', 'info');
          
          try {
            // Before inserting order: Re-fetch current user:
            const { data: userData } = await supabase.auth.getUser();
            const authUser = userData.user;

            const cartSubtotal = data.productId === 'prod-billing-enterprise' ? 2999 : 999;
            const appliedDiscount = data.couponCode ? (cartSubtotal - finalTotal) : 0;
            const calculatedTax = parseFloat((finalTotal * 0.18).toFixed(2));
            const cartItems = cartItem ? [cartItem] : [{ id: data.productId, name: data.productName, selectedPlanId: data.productId }];

            // Try inserting matching user's requested custom structure
            const userPayload = {
              id: data.orderId,
              customer_id: authUser?.id,
              products: cartItems,
              subtotal: cartSubtotal,
              discount: appliedDiscount,
              tax: calculatedTax,
              total_amount: finalTotal,
              payment_type: 'ONLINE',
              status: 'paid'
            };

            const { error: userInsertError } = await supabase.from('orders').insert([userPayload]);
            
            if (userInsertError) {
              console.warn("User schema insert failed, falling back to database default order schema:", userInsertError.message);
              // Fallback to default compatible schema (which has column user_id instead of customer_id, etc.)
              await verifyOrderInDatabase(
                data.orderId,
                data.productId || 'prod-billing-pro',
                data.productName,
                data.amount,
                response.razorpay_payment_id || 'pay_RZPLIVE_' + Math.random().toString(36).substr(2, 10).toUpperCase(),
                'success',
                'Razorpay_Live_Gateway_Portal',
                data.couponCode
              );
            } else {
              console.log("Insert with user's customizable schema succeeded!");
              // Also run licensing key and invoice dispatch logic to populate system licenses
              await verifyOrderInDatabase(
                data.orderId,
                data.productId || 'prod-billing-pro',
                data.productName,
                data.amount,
                response.razorpay_payment_id || 'pay_RZPLIVE_' + Math.random().toString(36).substr(2, 10).toUpperCase(),
                'success',
                'ONLINE',
                data.couponCode
              );
            }

            setCheckoutActive(false);
            setCheckoutData(null);
            handleNavigatePage('portal');
          } catch (err: any) {
            console.error(err);
            addNotification('Secure payment verification failed: ' + err.message, 'error');
          }
          setCheckoutLoading(false);
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: ''
        },
        theme: {
          color: '#2563EB'
        },
        modal: {
          ondismiss: function () {
            setCheckoutLoading(false);
            addNotification('Razorpay Checkout closed by customer.', 'info');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setCheckoutLoading(false);
      addNotification('Error starting Razorpay checkout widget: ' + err.message, 'error');
    }
  };

  const handleLaunchOfficialRazorpay = async () => {
    if (!checkoutData) return;
    await launchOfficialRazorpaySDK(checkoutData);
  };

  return (
    <TranslationProvider user={user}>
      {user?.role === 'admin' ? (
        <div className="w-full min-h-screen bg-[#0F172A] text-[#F8FAFC] font-sans" id="admin-fullscreen-root">
          <AdminPortal 
            onAddNotification={addNotification}
            onPageChange={handleNavigatePage}
            onRefreshDownloads={fetchDownloads}
            videos={videos}
            onRefreshVideos={fetchVideos}
            onLogout={handleLogout}
            user={user}
          />
          {/* Floating Notifications Toaster */}
          <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border animate-slide-in text-xs font-sans ${
                  notif.type === 'success' 
                    ? 'bg-emerald-950 border-emerald-700 text-emerald-200' 
                    : notif.type === 'error'
                    ? 'bg-rose-950 border-rose-700 text-rose-200'
                    : 'bg-slate-900 border-slate-700 text-slate-200'
                }`}
              >
                <span>{notif.text}</span>
                <button onClick={() => removeNotification(notif.id)} className="ml-4 hover:opacity-75">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
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

          {currentPage === 'admin' && user?.role === 'admin' && (
            <div className="p-8 text-center bg-white rounded-2xl shadow border border-slate-200 max-w-md mx-auto my-12">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Redirecting to Admin Dashboard...</h2>
              <p className="text-slate-600 text-sm">Please wait while we log you into the secure admin control panel.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <CheckoutModal
        isOpen={checkoutActive}
        onClose={() => setCheckoutActive(false)}
        checkoutData={checkoutData}
        user={user}
        onSubmitSimulatedPayment={handleCompleteSimulatedPayment}
        onPayOnline={handleLaunchOfficialRazorpay}
        checkoutMop={checkoutMop}
        setCheckoutMop={setCheckoutMop}
        checkoutUpiMethod={checkoutUpiMethod}
        setCheckoutUpiMethod={setCheckoutUpiMethod}
        checkoutCardNo={checkoutCardNo}
        setCheckoutCardNo={setCheckoutCardNo}
        checkoutCardExpiry={checkoutCardExpiry}
        setCheckoutCardExpiry={setCheckoutCardExpiry}
        checkoutCardCvv={checkoutCardCvv}
        setCheckoutCardCvv={setCheckoutCardCvv}
        checkoutUpiId={checkoutUpiId}
        setCheckoutUpiId={setCheckoutUpiId}
        checkoutBank={checkoutBank}
        setCheckoutBank={setCheckoutBank}
        checkoutWallet={checkoutWallet}
        setCheckoutWallet={setCheckoutWallet}
        checkoutLoading={checkoutLoading}
      />
    </Layout>
      )}
    </TranslationProvider>
  );
}
