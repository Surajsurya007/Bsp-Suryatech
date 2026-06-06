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
  ExternalLink
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

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [totalDownloads, setTotalDownloads] = useState<number>(1420);
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
  const [checkoutCardNo, setCheckoutCardNo] = useState('4111 1111 1111 1111');
  const [checkoutCardExpiry, setCheckoutCardExpiry] = useState('12/28');
  const [checkoutCardCvv, setCheckoutCardCvv] = useState('123');

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

  const handleLoginSuccess = (token: string, userData: any) => {
    localStorage.setItem('bsp_token', token);
    setUser(userData);
    setCurrentPage('portal');
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

  // Razorpay simulated order initialization
  const handleInitiateSimulatedCheckout = async (productId: string, couponCode?: string) => {
    const token = localStorage.getItem('bsp_token');
    if (!token) {
      addNotification('Authorization error, please sign in portal.', 'error');
      setCurrentPage('portal');
      return;
    }

    addNotification('Connecting Razorpay Sandbox Secure Gateway...', 'info');
    try {
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
      } else {
        const err = await res.json();
        addNotification(err.error || 'Checkout initialization failed', 'error');
      }
    } catch {
      addNotification('Network error starting checkout transaction', 'error');
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
          status
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

  return (
    <Layout 
      currentPage={currentPage}
      onPageChange={setCurrentPage} 
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
              onPageChange={setCurrentPage} 
              products={products}
              onTriggerTrialDownload={handleTriggerTrialDownload}
              testimonials={testimonials}
            />
          )}

          {currentPage === 'features' && (
            <Features onPageChange={setCurrentPage} />
          )}

          {currentPage === 'pricing' && (
            <Pricing 
              onPageChange={setCurrentPage}
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
            <Tutorials />
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
              onPageChange={setCurrentPage}
              onTriggerTrialDownload={handleTriggerTrialDownload}
            />
          )}

          {currentPage === 'admin' && user?.role === 'admin' && (
            <AdminPortal 
              onAddNotification={addNotification}
              onPageChange={setCurrentPage}
              onRefreshDownloads={fetchDownloads}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* --- RAZORPAY SECURITY SIMULATOR CHECKOUT PORTAL MODAL OVERLAY --- */}
      {checkoutActive && checkoutData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl shrink-0 flex flex-col text-left"
            id="razorpay-simulated-iframe-wrapper"
          >
            {/* Header branding logo */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 px-2.5 bg-blue-600 rounded-lg text-white font-extrabold text-xs">R</div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm tracking-tight leading-none">Razorpay Checkout</span>
                  <span className="text-[9px] text-[#A1A1AA] uppercase block font-bold mt-1 font-mono">Simulators Sandbox Test</span>
                </div>
              </div>
              <button 
                onClick={() => setCheckoutActive(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invoicing summary widget */}
            <div className="bg-slate-100 p-4 border-b border-slate-200/80 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-slate-800 leading-none">{checkoutData.productName}</span>
                <span className="text-[9.5px] text-slate-400 block mt-1">BSP Suryatech Billing Software License</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">Total Amount</span>
                <span className="text-base font-black text-blue-600 font-mono">₹{checkoutData.amount}</span>
              </div>
            </div>

            {/* Sandbox details fields */}
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-[10px] text-amber-800 leading-relaxed">
                <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <p>This payment screen acts as a secure interactive simulated sandbox API loop in absolute compliance with Indian POS mandates.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 font-mono block uppercase">Simulated Debit Card number</label>
                  <input
                    type="text"
                    value={checkoutCardNo}
                    onChange={(e) => setCheckoutCardNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono block uppercase">Expiry Date</label>
                    <input
                      type="text"
                      value={checkoutCardExpiry}
                      onChange={(e) => setCheckoutCardExpiry(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-center text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 font-mono block uppercase">CVV Card mark</label>
                    <input
                      type="password"
                      value={checkoutCardCvv}
                      onChange={(e) => setCheckoutCardCvv(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-center text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* simulated payment gateways buttons triggers */}
              <div className="pt-4 grid grid-cols-2 gap-3 border-t border-slate-100">
                <button
                  onClick={() => handleCompleteSimulatedPayment('failed')}
                  disabled={checkoutLoading}
                  className="py-3 bg-red-50 text-red-650 hover:bg-red-100 text-[10.5px] font-extrabold uppercase rounded-xl transition-all cursor-pointer text-center"
                >
                  Decline Transaction
                </button>
                <button
                  onClick={() => handleCompleteSimulatedPayment('success')}
                  disabled={checkoutLoading}
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-extrabold uppercase rounded-xl transition-all cursor-pointer text-center shadow-md shadow-emerald-100"
                >
                  Authorize Payment
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}
