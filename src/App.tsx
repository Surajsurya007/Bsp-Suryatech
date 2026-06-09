/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
import { TranslationProvider } from './components/TranslationContext';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [user, setUser] = useState<any>(null);
  const [portalInitialView, setPortalInitialView] = useState<'dashboard' | 'tickets' | 'new-ticket' | 'profile' | 'payments' | 'invoices' | 'notifications'>('dashboard');
  const [products, setProducts] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [totalDownloads, setTotalDownloads] = useState<number>(1420);
  const [videos, setVideos] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; type: 'success' | 'info' | 'error' }>>([]);

  // Checkout modal states (Simulated Razorpay Checkout Gateway)
  const [checkoutActive, setCheckoutActive] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{
    orderId: string;
    amount: number;
    keyId: string;
    productName: string;
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

  // Load active session from local storage on mount
  useEffect(() => {
    const token = localStorage.getItem('bsp_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Expired token session');
      })
      .then(userData => {
        setUser(userData);
        addNotification(`Logged in as ${userData.name}`, 'info');
      })
      .catch(() => {
        localStorage.removeItem('bsp_token');
        setUser(null);
      });
    }

    // Fetch master catalogs
    fetchProducts();
    fetchTestimonials();
    fetchDownloads();
    fetchVideos();

    const pollInterval = setInterval(() => {
      fetchProducts();
      fetchVideos();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, []);

  // Fetch latest downloads automatically when navigating to the Download Center page
  useEffect(() => {
    if (currentPage === 'downloads') {
      fetchDownloads();
    }
  }, [currentPage]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch {
      console.warn('Unable to load master products indices');
    }
  };

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      if (res.ok) setVideos(await res.json());
    } catch {
      console.warn('Unable to load master videos playlist');
    }
  };

  const fetchTestimonials = async () => {
    try {
      const res = await fetch('/api/testimonials');
      if (res.ok) setTestimonials(await res.json());
    } catch {
      console.warn('Unable to load client testimonials');
    }
  };

  const fetchDownloads = async () => {
    try {
      const res = await fetch('/api/downloads');
      if (res.ok) {
        const d = await res.json();
        setDownloads(d.downloads);
        setTotalDownloads(d.totalDownloads);
      }
    } catch {
      console.warn('Unable to fetch version releases');
    }
  };

  // Toast notifications helpers
  const [userLicenses, setUserLicenses] = useState<any[]>([]);

  const fetchUserLicenses = async () => {
    const token = localStorage.getItem('bsp_token');
    if (!token) {
      setUserLicenses([]);
      return;
    }
    try {
      const res = await fetch('/api/customer/licenses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUserLicenses(await res.json());
      }
    } catch {
      console.warn('Could not fetch active user licenses');
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
    if (page === 'portal') {
      setPortalInitialView('dashboard');
    }
    setCurrentPage(page);
  };

  const handleLoginSuccess = (token: string, userData: any) => {
    localStorage.setItem('bsp_token', token);
    setUser(userData);
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

    // Resolve product ID mapping
    let productId = 'prod-billing-pro';
    if (prodId.toLowerCase().includes('enterprise')) {
      productId = 'prod-billing-enterprise';
    }

    if (isFull) {
      // Check if they own active license for this product
      const ownsLicense = userLicenses.some(lic => lic.productId === productId);
      if (!ownsLicense) {
        addNotification(`"${productId === 'prod-billing-enterprise' ? 'Suryatech GST Enterprise Suite' : 'Suryatech Retail Billing Pro'}" is a Paid Software. Redirecting to the Pricing / Purchase page...`, 'error');
        setCurrentPage('pricing');
        return;
      }
    }

    // Start setup payload download
    addNotification(`Initiating ${isFull ? 'Full Version' : 'Free Trial'} Windows (.EXE) installation download...`, 'success');
    window.open(`/api/downloads/setup/${prodId}`, '_blank');
    
    setTimeout(() => {
      fetchDownloads();
      addNotification('Download started successfully! Launch the setup in folder to run offline.', 'success');
    }, 2000);
  };

  // Razorpay order initialization and Profile Completion guard
  const handleInitiateSimulatedCheckout = async (productId: string, couponCode?: string) => {
    const token = localStorage.getItem('bsp_token');
    if (!token) {
      addNotification('Please log in or register to purchase a license plan.', 'info');
      setPortalInitialView('dashboard');
      handleNavigatePage('portal');
      return;
    }

    addNotification('Verifying your billing profile details...', 'info');
    try {
      // 1. Fetch customer profile info to verify completion status
      const profileRes = await fetch('/api/customer/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!profileRes.ok) {
        throw new Error('Could not access profile records');
      }

      const profile = await profileRes.json();
      
      // Determine if profile fields are completed
      const isProfileCompleted = 
        profile.clientName && 
        profile.businessName && 
        profile.contactNumber && 
        profile.businessAddress && 
        profile.city && 
        profile.state && 
        profile.pincode;

      if (!isProfileCompleted) {
        addNotification('Please complete your billing profile details before proceeding to purchase.', 'error');
        setPortalInitialView('profile');
        handleNavigatePage('portal');
        return;
      }

      // 2. Profile is completed! Directly initialize official order and launch official live Razorpay Gateway pop-up!
      addNotification('Billing profile verified successfully. Loading secure checkout...', 'info');
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, couponCode })
      });

      if (res.ok) {
        const orderInitData = await res.json();
        setCheckoutData(orderInitData);
        setCheckoutActive(true);
        
        // Directly trigger the official live Razorpay Gateway UI popover
        await launchOfficialRazorpaySDK(orderInitData);
      } else {
        const err = await res.json();
        addNotification(err.error || 'Checkout initialization failed', 'error');
      }
    } catch (e: any) {
      addNotification('Network error starting checkout transaction: ' + e.message, 'error');
    }
  };

  // Complete simulated pay status
  const handleCompleteSimulatedPayment = async (status: 'success' | 'failed') => {
    if (!checkoutData) return;

    setCheckoutLoading(true);
    const token = localStorage.getItem('bsp_token');
    const paymentId = status === 'success' 
      ? 'pay_RZPSIM_' + Math.random().toString(36).substr(2, 10).toUpperCase() 
      : undefined;

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
      const res = await fetch('/api/orders/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: checkoutData.orderId,
          paymentId,
          status,
          paymentMethod: selectedPaymentMethod
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCheckoutActive(false);
        setCheckoutData(null);
        await fetchUserLicenses();
        addNotification('Razorpay Payment success! Serial keys dispatched.', 'success');
        setCurrentPage('portal');
      } else {
        const err = await res.json();
        addNotification(err.error || 'Verification failed', 'error');
        setCheckoutActive(false);
      }
    } catch {
      addNotification('Sever connection failed verifying payment', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const launchOfficialRazorpaySDK = async (data: {
    orderId: string;
    amount: number;
    keyId: string;
    productName: string;
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
      addNotification('Failed to load Razorpay library. Please check your internet connection or use the simulated payment option.', 'error');
      return;
    }

    try {
      const options = {
        key: data.keyId,
        amount: data.amount * 100, // standard Amount in paise
        currency: 'INR',
        name: 'Bsp Suryatech',
        description: `Billing Software License for ${data.productName}`,
        image: 'https://images.unsplash.com/photo-1554165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=200',
        handler: async function (response: any) {
          addNotification('Payment authorized successfully by Razorpay! Dispatched to Suryatech secure servers for sync...', 'success');
          
          const token = localStorage.getItem('bsp_token');
          try {
            const res = await fetch('/api/orders/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                orderId: data.orderId,
                paymentId: response.razorpay_payment_id || 'pay_RZPLIVE_' + Math.random().toString(36).substr(2, 10).toUpperCase(),
                status: 'success',
                paymentMethod: 'Razorpay_Live_Gateway_Portal'
              })
            });
            if (res.ok) {
              setCheckoutActive(false);
              setCheckoutData(null);
              await fetchUserLicenses();
              addNotification('Transaction successfully validated! Your license and invoice registers are activated.', 'success');
              handleNavigatePage('portal');
            } else {
              addNotification('Razorpay Verification failed on server sync.', 'error');
            }
          } catch {
            addNotification('Network sync error validating gateway transaction with server.', 'error');
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
      <Layout 
        currentPage={currentPage}
        onPageChange={handleNavigatePage} 
        user={user}
        onLogout={handleLogout}
        notifications={notifications}
        removeNotification={removeNotification}
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
            />
          )}

          {currentPage === 'downloads' && (
            <DownloadCenter 
              downloads={downloads}
              totalDownloads={totalDownloads}
              onTriggerTrialDownload={handleTriggerTrialDownload}
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
            <AdminPortal 
              onAddNotification={addNotification}
              onPageChange={handleNavigatePage}
              onRefreshDownloads={fetchDownloads}
              videos={videos}
              onRefreshVideos={fetchVideos}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </Layout>
    </TranslationProvider>
  );
}
