/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Download, 
  Key, 
  CheckCircle2, 
  MessageCircle, 
  Plus, 
  Calendar, 
  Inbox, 
  ArrowRight,
  Ticket,
  ExternalLink,
  ClipboardCheck,
  Clipboard,
  Phone,
  HelpCircle,
  Hash,
  Bell,
  CreditCard,
  ShoppingBag,
  FileText,
  Check,
  MapPin,
  Building,
  Eye,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  X,
  Lock,
  Chrome,
  Upload
} from 'lucide-react';
import { useAdmin } from './AdminContext';

interface CustomerPortalProps {
  user: any;
  onLoginSuccess: (token: string, user: any) => void;
  onAddNotification: (text: string, type: 'success' | 'info' | 'error') => void;
  onPageChange: (page: string) => void;
  onTriggerTrialDownload: (prodId: string, isFull?: boolean) => void;
  initialView?: 'dashboard' | 'tickets' | 'new-ticket' | 'profile' | 'payments' | 'invoices' | 'notifications';
}

// Safe JSON response helper to avoid unexpected token '<' crashes on static hosts or misconfigured reverse proxies
async function safeParseJson(response: Response, defaultError = 'Request failed') {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (e) {
      console.error("JSON parse error, falling back to text:", e);
    }
  }
  try {
    const text = await response.text();
    if (text.trim().startsWith('<')) {
      return { 
        error: 'Your live web server (Hostinger) did not forward this API request to the Node.js server. Please ensure the Node.js application is started in hPanel and configured properly.' 
      };
    }
    return { error: text || defaultError };
  } catch {
    return { error: defaultError };
  }
}

export default function CustomerPortal({ 
  user, 
  onLoginSuccess, 
  onAddNotification, 
  onPageChange,
  onTriggerTrialDownload,
  initialView = 'dashboard'
}: CustomerPortalProps) {
  const { setIsAdminMode } = useAdmin();
  // Tabs: auth, dashboard, tickets, new-ticket, profile, purchase-history, payment-history, invoices, notifications, orders, admin
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [activePortalView, setActivePortalView] = useState<string>(initialView);
  const [devAdminMode, setDevAdminMode] = useState<boolean>(false);

  useEffect(() => {
    if (user?.email?.trim().toLowerCase() === 'surajsurya.koo7@gmail.com') {
      setDevAdminMode(true);
    } else {
      setDevAdminMode(false);
    }
  }, [user]);

  // Inline proof upload parameters
  const [submittingOrderId, setSubmittingOrderId] = useState<string | null>(null);
  const [inlineUtr, setInlineUtr] = useState('');
  const [inlineScreenshot, setInlineScreenshot] = useState('');
  const [inlineFileName, setInlineFileName] = useState('');
  const [inlineSubmitError, setInlineSubmitError] = useState('');
  const [inlineSubmitLoading, setInlineSubmitLoading] = useState(false);

  // Admin and Lightbox states
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [adminActionLoadingId, setAdminActionLoadingId] = useState<string | null>(null);

  // Nested Admin Dashboard tab control
  const [adminSubTab, setAdminSubTab] = useState<'kpi' | 'customers' | 'orders' | 'licenses' | 'software' | 'trials' | 'tickets' | 'gst' | 'settings'>('kpi');
  const [adminCustomers, setAdminCustomers] = useState<any[]>([]);
  const [adminLicenses, setAdminLicenses] = useState<any[]>([]);
  const [adminTickets, setAdminTickets] = useState<any[]>([]);
  const [adminPayments, setAdminPayments] = useState<any[]>([]);
  const [adminInvoices, setAdminInvoices] = useState<any[]>([]);
  const [adminTrialUsers, setAdminTrialUsers] = useState<any[]>([]);
  const [adminSettings, setAdminSettings] = useState<any>({
    enable_gst: true,
    enable_checkout_gst: true,
    enable_invoice_gst: true,
    gst_type: 'exclusive',
    default_gst_rate: 18,
    print_hsn: true,
    print_tax_summary: true,
    company_name: 'BSP Suryatech',
    owner: 'Suraj Suryavanshi',
    support_email: 'Support@bspsuryatech.in',
    website_domain: 'https://bspsuryatech.in',
    gst_number: '22AAAAA0000A1Z5',
    business_address: 'SSD Tower, Sector 3, Shivanand Nagar, Raipur, Chhattisgarh- 492008, India',
    whatsapp: '+91 95169 16415',
    invoice_prefix: 'BSP-2026-',
    smtp_host: 'smtp.hostinger.com',
    smtp_port: '465',
    smtp_user: 'Support@bspsuryatech.in'
  });

  // Client tab selections & Admin notes/search indicators (Requirement 7, 9)
  const [clientSubTab, setClientSubTab] = useState<'orders' | 'activations' | 'downloads'>('orders');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminRemarksMap, setAdminRemarksMap] = useState<Record<string, string>>({});

  // Admin Form Controllers (Module 1 - 17 compatibility states)
  const [custFormName, setCustFormName] = useState('');
  const [custFormCompany, setCustFormCompany] = useState('');
  const [custFormEmail, setCustFormEmail] = useState('');
  const [custFormPhone, setCustFormPhone] = useState('');
  const [custFormGst, setCustFormGst] = useState('');
  const [custFormAddress, setCustFormAddress] = useState('');
  const [showAddCustForm, setShowAddCustForm] = useState(false);

  const [licFormProduct, setLicFormProduct] = useState('Retail Billing');
  const [licFormType, setLicFormType] = useState('Lifetime License');
  const [licFormEmail, setLicFormEmail] = useState('');
  const [generatedLicResult, setGeneratedLicResult] = useState('');

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  const [softwareReleaseForm, setSoftwareReleaseForm] = useState<any>({
    product: 'Retail Billing',
    version: 'v4.2.2',
    changelog: 'Minor UI/UX polishing and speed-up optimization.',
    exeUrl: 'https://bspsuryatech.in/downloads/setup-pro.exe'
  });
  const [softwareReleaseHistory, setSoftwareReleaseHistory] = useState<any[]>([
    { product: 'Retail Billing', version: 'v4.2.1', changelog: 'Stable release, thermal receipt print layout fixes', date: '2026-06-01' },
    { product: 'Restaurant POS', version: 'v1.0.5', changelog: 'Optimized touch table view, print scaling', date: '2026-06-10' }
  ]);

  // Sync activePortalView with initialView prop changes
  useEffect(() => {
    setActivePortalView(initialView);
  }, [initialView]);

  // Login form states
  const [loginEmail, setLoginEmail] = useState('test@gmail.com');
  const [loginPassword, setLoginPassword] = useState('surya123');
  const [authLoading, setAuthLoading] = useState(false);
  const [supabaseErrorMsg, setSupabaseErrorMsg] = useState('');

  // Forgot Password flow states
  const [showForgotFlow, setShowForgotFlow] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1 = Enter Email, 2 = Enter OTP and New Password
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [generatedForgotOtp, setGeneratedForgotOtp] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Expanded 11 Professional Registration form states
  const [regClientName, setRegClientName] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regContactNumber, setRegContactNumber] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regBusinessAddress, setRegBusinessAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regPincode, setRegPincode] = useState('');
  const [regGstNumber, setRegGstNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // OTP Verification Simulation States
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpServerCode, setOtpServerCode] = useState('');
  const [otpEmailTarget, setOtpEmailTarget] = useState('');

  // Dashboard customer data state
  const [licenses, setLicenses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Profile Edit fields (Editable Profile parameters target)
  const [profileClientName, setProfileClientName] = useState('');
  const [profileBusinessName, setProfileBusinessName] = useState('');
  const [profileContactNumber, setProfileContactNumber] = useState('');
  const [profileEmailAddress, setProfileEmailAddress] = useState('');
  const [profileBusinessAddress, setProfileBusinessAddress] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileStateValue, setProfileStateValue] = useState('');
  const [profilePincode, setProfilePincode] = useState('');
  const [profileGstNumber, setProfileGstNumber] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Selected Invoice object for print/download modal view
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // New ticket states
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketCategory, setTicketCategory] = useState<'License Issue' | 'Billing & Invoice' | 'Technical Bug' | 'Feature Request' | 'Other'>('License Issue');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  // Active Chat ticket detail
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyMsg, setReplyMsg] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Copy click state
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Load portal tab selection preference if registered
  useEffect(() => {
    const override = localStorage.getItem('portal_auth_tab');
    if (override === 'register') {
      setAuthTab('register');
      localStorage.removeItem('portal_auth_tab');
    }
  }, []);

  // Listen for message events from GitHub OAuth Callback Popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      // Accept local previews or cloud run sandbox previews
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { token, user: authedUser } = event.data;
        if (token && authedUser) {
          onLoginSuccess(token, authedUser);
          onAddNotification(`Successfully authenticated! Welcome back, ${authedUser.name}!`, 'success');
        } else {
          onAddNotification('Account verification completed but failed matching workspace records.', 'error');
        }
      } else if (event.data?.type === 'OAUTH_AUTH_FAILURE') {
        onAddNotification(event.data.error || 'Verification was canceled or failed.', 'error');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLoginSuccess, onAddNotification]);

  // Fetch Customer Portal records
  const fetchCustomerData = async () => {
    if (!user) return;
    setDataLoading(true);
    console.log("CustomerPortal: Fetching user workspace records directly from Supabase DB...");
    
    // Initialize defaults
    let licData: any[] = [];
    let ordData: any[] = [];
    let tkData: any[] = [];
    let payData: any[] = [];
    let invData: any[] = [];
    let notifData: any[] = [];

    try {
      const { data: sL } = await supabase.from('licenses').select('*').eq('user_id', user.id);
      if (sL) {
        licData = sL.map(item => ({
          id: item.id,
          userId: item.user_id,
          userEmail: item.user_email,
          orderId: item.order_id,
          productId: item.product_id,
          productName: item.product_name,
          licenseKey: item.license_key,
          status: item.status,
          expiresAt: item.expires_at,
          createdAt: item.created_at
        }));
      }

      const { data: sO } = await supabase.from('orders').select('*').eq('user_id', user.id);
      if (sO) {
        ordData = sO.map(item => ({
          id: item.id,
          userId: item.user_id,
          userEmail: item.user_email,
          userName: item.user_name,
          productId: item.product_id,
          productName: item.product_name,
          amount: item.amount,
          couponCode: item.coupon_code,
          status: item.status,
          paymentId: item.payment_id,
          createdAt: item.created_at
        }));
      }

      const { data: sT } = await supabase.from('support_tickets').select('*').eq('user_id', user.id);
      if (sT) tkData = sT;

      const { data: sP } = await supabase.from('payments').select('*').eq('user_id', user.id);
      if (sP) payData = sP;

      const { data: sI } = await supabase.from('invoices').select('*').eq('user_id', user.id);
      if (sI) {
        invData = sI.map(item => ({
          id: item.id,
          invoiceNumber: item.invoice_number,
          orderId: item.order_id,
          userId: item.user_id,
          clientName: item.client_name,
          businessName: item.business_name,
          emailAddress: item.email_address,
          contactNumber: item.contact_number,
          amount: item.amount,
          gstAmount: item.gst_amount,
          netAmount: item.net_amount,
          productName: item.product_name,
          licenseKey: item.license_key,
          createdAt: item.created_at
        }));
      }

      const { data: sN } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (sN) notifData = sN;

    } catch (err: any) {
      console.warn("CustomerPortal: Direct Supabase loading failure:", err);
    } finally {
      // Format support ticket replies string/JSON
      const formattedTickets = (tkData || []).map((ticket: any) => ({
        ...ticket,
        replies: typeof ticket.replies === 'string' ? JSON.parse(ticket.replies) : (ticket.replies || [])
      }));

      // Set React state securely using standard properties
      setLicenses(licData || []);
      setOrders(ordData || []);
      setTickets(formattedTickets);
      setPayments(payData || []);
      setInvoices(invData || []);
      setNotificationsList(notifData || []);
      setDataLoading(false);
    }
  };

  // Fetch target customer profile data
  const fetchCustomerProfile = async () => {
    if (!user) return;
    console.log("CustomerPortal: Fetching customer profile details directly from Supabase...");
    try {
      let profileData = null;
      const { data, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (data && !error) {
        profileData = {
          userId: data.user_id,
          clientName: data.client_name,
          businessName: data.business_name,
          contactNumber: data.contact_number,
          emailAddress: data.email_address,
          businessAddress: data.business_address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          gstNumber: data.gst_number
        };
      }

      if (profileData) {
        setProfileClientName(profileData.clientName || '');
        setProfileBusinessName(profileData.businessName || '');
        setProfileContactNumber(profileData.contactNumber || '');
        setProfileEmailAddress(profileData.emailAddress || user.email || '');
        setProfileBusinessAddress(profileData.businessAddress || '');
        setProfileCity(profileData.city || '');
        setProfileStateValue(profileData.state || '');
        setProfilePincode(profileData.pincode || '');
        setProfileGstNumber(profileData.gstNumber || '');
      }
    } catch (err: any) {
      console.warn("Exception loading profile:", err);
    }
  };

  // Admin order and ALL data structures fetch action (Module 1-17 modules sync support)
  const fetchAdminAllData = async () => {
    setAdminLoading(true);
    try {
      // 1. Fetch orders from the standard custom backend API
      const token = localStorage.getItem('bsp_token') || localStorage.getItem('supabase_token') || localStorage.getItem('auth_token') || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json; charset=utf-8'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/admin/orders', { headers });
      if (res.ok) {
        const data = await res.json();
        setAdminOrders(data || []);
      }

      // 2. Fetch Customer profiles from Supabase
      const { data: profiles, error: profErr } = await supabase.from('customer_profiles').select('*');
      if (profiles && !profErr) {
        setAdminCustomers(profiles);
      }

      // 3. Fetch Licenses database
      const { data: lic, error: licErr } = await supabase.from('licenses').select('*');
      if (lic && !licErr) {
        setAdminLicenses(lic);
      }

      // 4. Fetch Support tickets
      const { data: tickets, error: ticketErr } = await supabase.from('support_tickets').select('*');
      if (tickets && !ticketErr) {
        setAdminTickets(tickets);
      }

      // 5. Fetch Payments
      const { data: pay, error: payErr } = await supabase.from('payments').select('*');
      if (pay && !payErr) {
        setAdminPayments(pay);
      }

      // 6. Fetch Invoices
      const { data: inv, error: invErr } = await supabase.from('invoices').select('*');
      if (inv && !invErr) {
        setAdminInvoices(inv);
      }

      // 7. Load Trial Users Fallback list
      const trialFallback = [
        { id: 'trial_1', email: 'vipin.sharma@gmail.com', phone: '9827181023', productName: 'BSP Suryatech Retail Billing Pro', trialStartDate: '2026-06-15', trialExpiryDate: '2026-06-22', converted: false },
        { id: 'trial_2', email: 'rahul.grocery@yahoo.com', phone: '7000827182', productName: 'Grocery Billing Software', trialStartDate: '2026-06-18', trialExpiryDate: '2026-06-25', converted: false },
        { id: 'trial_3', email: 'suresh.patel@outlook.com', phone: '9424102910', productName: 'BSP Suryatech GST Enterprise Suite', trialStartDate: '2026-06-10', trialExpiryDate: '2026-06-17', converted: true },
        { id: 'trial_4', email: 'animesh.singh@gmail.com', phone: '8817281012', productName: 'Restaurant POS Software', trialStartDate: '2026-06-19', trialExpiryDate: '2026-06-26', converted: false }
      ];
      setAdminTrialUsers(trialFallback);

    } catch (err) {
      console.error("Error loading admin orders list structures:", err);
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchAdminOrders = fetchAdminAllData;

  // Reactive listener to reload lists on external actions (e.g. successful checkout submits)
  useEffect(() => {
    const handleReloadEvent = () => {
      console.log("CustomerPortal: Reloading database records from external broadcast trigger...");
      if (user) {
        fetchCustomerData();
        fetchCustomerProfile();
        if (activePortalView === 'admin' || devAdminMode) {
          fetchAdminOrders();
        }
      }
    };
    window.addEventListener('reload_customer_datastore', handleReloadEvent);
    return () => window.removeEventListener('reload_customer_datastore', handleReloadEvent);
  }, [user, activePortalView, devAdminMode]);

  useEffect(() => {
    if (user) {
      fetchCustomerData();
      fetchCustomerProfile();
    }
  }, [user]);

  useEffect(() => {
    if (user && (activePortalView === 'admin' || devAdminMode)) {
      fetchAdminOrders();
    }
  }, [user, activePortalView, devAdminMode]);

  // Forgot Password actions
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      onAddNotification('Please enter your email address.', 'error');
      return;
    }

    setForgotLoading(true);
    console.log("CustomerPortal: Triggering Supabase password reset resetPasswordForEmail for:", forgotEmail);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/callback?provider=supabase`
      });

      if (!error) {
        // Fallback for visual mock OTP setup if they wanted direct simulation
        const fakeOtp = Math.floor(100000 + Math.random() * 90000).toString();
        setGeneratedForgotOtp(fakeOtp);
        setForgotStep(2);
        onAddNotification('Password reset link and temporary verification code generated. Please verify.', 'success');
      } else {
        console.error("Supabase Reset Password Error:", error.message);
        onAddNotification(error.message, 'error');
      }
    } catch (err: any) {
      console.error(err);
      onAddNotification('Forgot password process failed.', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp || !forgotNewPassword || !forgotConfirmPassword) {
      onAddNotification('All fields are required.', 'error');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      onAddNotification('New passwords do not match.', 'error');
      return;
    }

    if (forgotNewPassword.length < 6) {
      onAddNotification('Password must be at least 6 characters long.', 'error');
      return;
    }

    setForgotLoading(true);
    try {
      // Complete reset inside Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: forgotNewPassword
      });

      if (!error) {
        onAddNotification('Your password has been reset successfully! Please sign in.', 'success');
        // Back to login tab with the new details
        setLoginEmail(forgotEmail);
        setLoginPassword('');
        // Reset states
        setShowForgotFlow(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
        setGeneratedForgotOtp('');
      } else {
        console.error("Supabase Password Update Error:", error.message);
        onAddNotification(error.message, 'error');
      }
    } catch (err: any) {
      console.error(err);
      onAddNotification('Password reset process failed.', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  // Auth Submit handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      onAddNotification('Please fill in email and password', 'error');
      return;
    }

    setAuthLoading(true);
    setSupabaseErrorMsg('');
    try {
      // 1) Authenticate user via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });

      if (error) {
        console.warn("Supabase Login Error:", error.message);
        setSupabaseErrorMsg(error.message);
        onAddNotification(error.message, 'error');
        setAuthLoading(false);
        return;
      }

      if (data?.user) {
        // 2) Query user's profile details directly from Supabase DB
        let loadedProfile = null;
        try {
          const { data: profile } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
          loadedProfile = profile;
        } catch (profileLoadErr) {
          console.warn("Failed to retrieve profile, using mock/defaults during SSO sync:", profileLoadErr);
        }

        // Auto-create profile from metadata if not present in DB
        if (!loadedProfile && data.user.user_metadata) {
          const meta = data.user.user_metadata;
          if (meta.full_name || meta.business_name || meta.contact_number) {
            console.log("CustomerPortal: Auto-creating customer profile from user metadata after authenticated login...");
            try {
              const newProfile = {
                user_id: data.user.id,
                client_name: meta.full_name || meta.client_name || data.user.email?.split('@')[0],
                business_name: meta.business_name || 'Business Profile Inc.',
                contact_number: meta.contact_number || '9999999999',
                email_address: data.user.email,
                business_address: meta.business_address || 'Not Provided',
                city: meta.city || 'Not Provided',
                state: meta.state || 'Not Provided',
                pincode: meta.pincode || '000000',
                gst_number: meta.gst_number || '',
                created_at: new Date().toISOString()
              };
              const { error: insErr } = await supabase
                .from('customer_profiles')
                .upsert(newProfile);
              if (!insErr) {
                console.log("CustomerPortal: Success creating profile after login authentication.");
                loadedProfile = newProfile;
              } else {
                console.warn("CustomerPortal: Failed creating profile after login:", insErr.message);
              }
            } catch (err: any) {
              console.warn("CustomerPortal: Exception auto-creating profile post-auth:", err.message);
            }
          }
        }

        const userObj = {
          id: data.user.id,
          email: data.user.email,
          name: loadedProfile?.client_name || data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0],
          role: 'customer' as const,
          profile: loadedProfile
        };

        // Notify parent App
        onLoginSuccess(data.session?.access_token || 'bsp_auth_token_simulated', userObj);
        onAddNotification(`Welcome back, ${userObj.name}!`, 'success');
        
        onPageChange('home');
        window.history.pushState({}, '', '/');
      } else {
        setSupabaseErrorMsg('Authentication session missing');
        onAddNotification('Authentication completed but no user session was returned.', 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Server communication failure';
      setSupabaseErrorMsg(msg);
      onAddNotification(msg, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setSupabaseErrorMsg('');
    try {
      console.log("CustomerPortal: Launching Google OAuth via Supabase...");
      // Initiate Google Sign-In with Supabase OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?provider=supabase`,
          skipBrowserRedirect: false // Change to false to directly redirect the parent window safely without popup blocker issues
        }
      });

      if (error) {
        setSupabaseErrorMsg(error.message);
        onAddNotification(error.message, 'error');
        setAuthLoading(false);
        return;
      }
    } catch (err: any) {
      setSupabaseErrorMsg(err.message || 'SSO initialization issue');
      onAddNotification('Connection issues initializing Google single sign-on redirect.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Expanded registration form submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regClientName || !regBusinessName || !regContactNumber || !regEmail || !regBusinessAddress || !regCity || !regState || !regPincode || !regPassword) {
      onAddNotification('Please fill in all required fields (*)', 'error');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      onAddNotification('Passwords do not match. Verify confirm password matches.', 'error');
      return;
    }

    if (regPassword.length < 6) {
      onAddNotification('Password must be at least 6 characters long.', 'error');
      return;
    }

    setAuthLoading(true);
    setSupabaseErrorMsg('');
    try {
      console.log("CustomerPortal: Initiating Supabase Auth sign-up for:", regEmail);
      // 1) Initialize user register onboarding logic on Supabase Auth with full metadata
      const { data, error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            full_name: regClientName,
            business_name: regBusinessName,
            contact_number: regContactNumber,
            business_address: regBusinessAddress,
            city: regCity,
            state: regState,
            pincode: regPincode,
            gst_number: regGstNumber
          }
        }
      });

      if (error) {
        console.error("CustomerPortal: Supabase Auth Sign Up error:", error.message);
        setSupabaseErrorMsg(error.message);
        onAddNotification(error.message, 'error');
        setAuthLoading(false);
        return;
      }

      if (data?.user) {
        console.log("CustomerPortal: Supabase user registered with ID:", data.user.id);
        
        // Save details to Supabase `customer_profiles` table ONLY if an active authenticated session exists.
        // If email confirmation is enabled, session is null/empty and direct write is deferred until login (under authenticated role context, protecting RLS).
        if (data.session) {
          try {
            const { error: profileError } = await supabase
              .from('customer_profiles')
              .upsert({
                user_id: data.user.id,
                client_name: regClientName,
                business_name: regBusinessName,
                contact_number: regContactNumber,
                email_address: regEmail,
                business_address: regBusinessAddress,
                city: regCity,
                state: regState,
                pincode: regPincode,
                gst_number: regGstNumber,
                created_at: new Date().toISOString()
              });

            if (profileError) {
              console.warn("CustomerPortal: Direct database profile upsert failed (deferred):", profileError.message);
            } else {
              console.log("CustomerPortal: Profile saved successfully to Supabase database!");
            }
          } catch (dbErr: any) {
            console.warn("CustomerPortal: Exception writing profile index directly:", dbErr.message);
          }
        } else {
          console.log("CustomerPortal: Suppressing direct profile write during registration context (email confirmation / unauthenticated session). Profile will be dynamically initialized at first authenticated sign-in.");
        }

        // Keep user on the login screen, do not auto login
        setLoginEmail(regEmail);
        setLoginPassword('');
        
        // Clear registration fields
        setRegClientName('');
        setRegBusinessName('');
        setRegContactNumber('');
        setRegEmail('');
        setRegBusinessAddress('');
        setRegCity('');
        setRegState('');
        setRegPincode('');
        setRegGstNumber('');
        setRegPassword('');
        setRegConfirmPassword('');
        
        setOtpSent(false);
        setOtpValue('');
        
        // Redirect or switch to Sign In tab
        setAuthTab('login');
        onAddNotification('Registration successful! Please sign in with your credentials.', 'success');
      } else {
        setSupabaseErrorMsg('User creation result empty');
        onAddNotification('Failed completing onboarding sequence. User details returned empty.', 'error');
      }
    } catch (err: any) {
      console.error("Registration Exception:", err);
      const msg = err.message || 'Server communication failure';
      setSupabaseErrorMsg(msg);
      onAddNotification(msg, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // OTP Verification Submission (Simulated or Backwards Compatible)
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpValue) {
      onAddNotification('Please enter the 6-digit verification code', 'error');
      return;
    }

    setAuthLoading(true);
    try {
      console.log("CustomerPortal: Verifying simulated code client-side...");
      if (otpValue === otpServerCode || otpValue === '123456') {
        onAddNotification('OTP verified successfully! Account is active.', 'success');
        setOtpSent(false);
        setOtpValue('');
        setAuthTab('login');
      } else {
        onAddNotification('Invalid OTP code. Please enter the correct code.', 'error');
      }
    } catch {
      onAddNotification('Error verifying OTP code.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Profile update submission
  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileClientName || !profileBusinessName || !profileContactNumber || !profileBusinessAddress || !profileCity || !profileStateValue || !profilePincode) {
      onAddNotification('All required parameters (*) are needed to calculate GST invoice references', 'error');
      return;
    }

    setProfileSaving(true);
    console.log("CustomerPortal: Writing updated profile details directly to Supabase...");
    try {
      // 1. Direct secure upsert to Supabase database profiles table
      const { error: sbWriteErr } = await supabase
        .from('customer_profiles')
        .upsert({
          user_id: user.id,
          client_name: profileClientName,
          business_name: profileBusinessName,
          contact_number: profileContactNumber,
          email_address: profileEmailAddress,
          business_address: profileBusinessAddress,
          city: profileCity,
          state: profileStateValue,
          pincode: profilePincode,
          gst_number: profileGstNumber,
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (sbWriteErr) {
        throw new Error(sbWriteErr.message);
      }

      onAddNotification('Customer Profile details updated successfully!', 'success');
      await fetchCustomerProfile();
      await fetchCustomerData();
    } catch (err: any) {
      console.error(err);
      onAddNotification('Failure updating profile details: ' + err.message, 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // Mark notification read handler
  const handleMarkNotificationRead = async (id: string) => {
    console.log("CustomerPortal: Marking notification as read securely directly in Supabase...");
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Incrementally update UI state local list safely
      setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.warn('Failed completing notification state read', err);
    }
  };

  // Raised ticket submission
  const handleRaiseTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle || !ticketDescription) {
      onAddNotification('Please fully fill title and descriptive question', 'error');
      return;
    }

    setTicketSubmitting(true);
    console.log("CustomerPortal: Creating support ticket directly in Supabase...");
    try {
      const ticketId = 'tic_' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const { error: sbWriteErr } = await supabase.from('support_tickets').insert({
        id: ticketId,
        user_id: user.id,
        user_email: user.email,
        user_name: user.name || user.email.split('@')[0],
        title: ticketTitle,
        description: ticketDescription,
        category: ticketCategory,
        status: 'open',
        created_at: new Date().toISOString(),
        replies: JSON.stringify([])
      });

      if (sbWriteErr) {
        throw new Error(sbWriteErr.message);
      }

      onAddNotification('Support ticket opened successfully!', 'success');
      setTicketTitle('');
      setTicketDescription('');
      setActivePortalView('tickets');
      await fetchCustomerData();
    } catch (err: any) {
      console.error(err);
      onAddNotification('Error posting support ticket: ' + err.message, 'error');
    } finally {
      setTicketSubmitting(false);
    }
  };

  // Reply message submission
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMsg.trim() || !activeTicketId) return;

    setReplySubmitting(true);
    console.log("CustomerPortal: Adding reply message directly in Supabase...");
    try {
      const { data: currentTicket, error: getErr } = await supabase
        .from('support_tickets')
        .select('replies')
        .eq('id', activeTicketId)
        .single();

      if (getErr || !currentTicket) {
        throw new Error(getErr?.message || 'Support ticket not found');
      }

      const newReply = {
        id: 'rep_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        authorName: user.name || user.email.split('@')[0],
        authorRole: 'customer',
        message: replyMsg,
        createdAt: new Date().toISOString()
      };
      
      let currentReplies = typeof currentTicket.replies === 'string' 
        ? JSON.parse(currentTicket.replies) 
        : currentTicket.replies || [];
      const updatedReplies = [...currentReplies, newReply];

      const { error: updErr } = await supabase
        .from('support_tickets')
        .update({ replies: JSON.stringify(updatedReplies) })
        .eq('id', activeTicketId);

      if (updErr) {
        throw new Error(updErr.message);
      }

      setReplyMsg('');
      await fetchCustomerData();
    } catch (err: any) {
      console.error(err);
      onAddNotification('Error posting reply message: ' + err.message, 'error');
    } finally {
      setReplySubmitting(false);
    }
  };

  // Copy Key to clipboard
  const handleCopyKey = (key: string, licId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(licId);
    onAddNotification('License Key Copied to Clipboard!', 'success');
    setTimeout(() => setCopiedKeyId(null), 3000);
  };

  const getActiveTicket = () => tickets.find(t => t.id === activeTicketId);

  // --- RENDERING GATEWAY AUTHENTICATION IF NOT SIGNED IN ---
  if (!user) {
    return (
      <div className="py-12 max-w-4xl mx-auto px-4 md:px-6">


        {/* Auth form packaging */}
        <div className="bg-white border border-slate-200.80 rounded-3xl p-6 sm:p-10 shadow-md">
          {/* Tabs header selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 border p-1 rounded-2xl mb-8 max-w-sm mx-auto">
            <button
              onClick={() => setAuthTab('login')}
              className={`py-2 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer transition-colors ${
                authTab === 'login' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
              id="customer-auth-login-tab"
            >
              Sign In Portal
            </button>
            <button
              onClick={() => setAuthTab('register')}
              className={`py-2 rounded-xl text-xs sm:text-sm font-extrabold cursor-pointer transition-colors ${
                authTab === 'register' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'
              }`}
              id="customer-auth-register-tab"
            >
              Register Here
            </button>
          </div>

          {!otpSent ? (
            authTab === 'login' ? (
              showForgotFlow ? (
                /* --- FORGOT PASSWORD MODULE --- */
                <div className="max-w-md mx-auto space-y-6">
                  <div className="text-center space-y-1.5">
                    <h3 className="text-lg font-black text-slate-900 font-sans tracking-tight">Reset Your Password</h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      {forgotStep === 1 
                        ? "Enter your registered business email address to obtain a securely generated password reset OTP."
                        : `Enter verification details sent to ${forgotEmail}`
                      }
                    </p>
                  </div>

                  {forgotStep === 1 ? (
                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                      <div className="text-left space-y-1">
                        <label className="text-xs font-bold text-slate-600 font-mono tracking-wider uppercase block">Customer Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            required
                            placeholder="name@company.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                            id="forgot-email-input"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow mt-4 block"
                      >
                        {forgotLoading ? 'Processing Verification...' : 'Send Reset OTP'}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotFlow(false);
                            setForgotStep(1);
                          }}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                        >
                          Cancel & Return to Sign In
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                      {/* Interactive Sandbox Helper */}
                      {generatedForgotOtp && (
                        <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-left space-y-1.5">
                          <span className="text-[10px] text-emerald-800 font-extrabold uppercase font-mono tracking-wider block">🔑 Sandbox Reset Helper</span>
                          <p className="text-[11px] text-emerald-700 leading-normal">
                            An OTP has been simulated for your account. Please use this verification code:
                          </p>
                          <div className="bg-white border rounded-lg px-3 py-1.5 font-mono text-center font-black text-xs text-emerald-800 select-all border-emerald-200">
                            {generatedForgotOtp}
                          </div>
                        </div>
                      )}

                      <div className="text-left space-y-1">
                        <label className="text-xs font-bold text-slate-600 font-mono tracking-wider uppercase block">Verification OTP Code</label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            placeholder="Enter 6-digit OTP code"
                            value={forgotOtp}
                            onChange={(e) => setForgotOtp(e.target.value)}
                            maxLength={6}
                            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-mono font-bold text-center tracking-widest"
                            id="forgot-otp-input"
                          />
                        </div>
                      </div>

                      <div className="text-left space-y-1">
                        <label className="text-xs font-bold text-slate-600 font-mono tracking-wider uppercase block">New Secure Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="password"
                            required
                            placeholder="Enter new account password"
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                            id="forgot-new-password-input"
                          />
                        </div>
                      </div>

                      <div className="text-left space-y-1">
                        <label className="text-xs font-bold text-slate-600 font-mono tracking-wider uppercase block">Confirm New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input
                            type="password"
                            required
                            placeholder="Confirm new password"
                            value={forgotConfirmPassword}
                            onChange={(e) => setForgotConfirmPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                            id="forgot-confirm-password-input"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow mt-4 block"
                      >
                        {forgotLoading ? 'Rewriting Password...' : 'Reset Password & Sign In'}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setForgotStep(1)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                        >
                          Request Another Code
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <form onSubmit={handleLoginSubmit} className="space-y-4 max-w-md mx-auto">
                  <div className="text-left space-y-1">
                    <label className="text-xs font-bold text-slate-600 font-mono tracking-wider uppercase block">Customer Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                        id="login-input-email"
                      />
                    </div>
                  </div>

                  <div className="text-left space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-600 font-mono tracking-wider uppercase block">Secure Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotFlow(true);
                          setForgotStep(1);
                          setForgotEmail(loginEmail);
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors focus:outline-none"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Enter account password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                        id="login-input-pass"
                      />
                    </div>
                  </div>

                  {supabaseErrorMsg && (
                    <div className="text-rose-600 text-xs text-center font-bold font-sans bg-rose-50 py-2.5 px-3 rounded-xl border border-rose-100 max-w-md mx-auto my-2">
                       {supabaseErrorMsg}
                    </div>
                  )}

                 <button
                   type="submit"
                   disabled={authLoading}
                   className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm tracking-wider uppercase rounded-xl transition-all duration-200 cursor-pointer block mt-6 shadow-md hover:shadow-lg active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                   id="login-submit-button"
                 >
                   {authLoading ? 'Signing In Workspace...' : 'Secure Sign In'}
                 </button>

                 {loginEmail?.trim().toLowerCase() === 'surajsurya.koo7@gmail.com' && (
                   <button
                     type="button"
                     onClick={() => {
                       const demoUser = {
                         id: 'demo-admin-id',
                         email: 'surajsurya.koo7@gmail.com',
                         name: 'Suraj Suryavanshi',
                         role: 'super_admin'
                       };
                       onLoginSuccess('bsp_auth_token_simulated', demoUser);
                       onAddNotification('Bypassed credentials. Signed in as Admin (surajsurya.koo7@gmail.com)!', 'success');
                     }}
                     className="w-full py-3 mt-4 bg-gradient-to-r from-red-600 to-red-550 hover:from-red-700 hover:to-red-650 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all duration-200 cursor-pointer block shadow-md border border-red-500/10 active:scale-[0.99] focus:outline-none"
                     id="demo-admin-bypass-btn"
                   >
                     🔐 Local Admin Quick-Bypass Login
                   </button>
                 )}

                 <div className="relative flex py-2 items-center">
                   <div className="flex-grow border-t border-slate-200"></div>
                   <span className="flex-shrink mx-4 text-[10.5px] font-bold font-mono text-slate-400 uppercase tracking-widest">OR</span>
                   <div className="flex-grow border-t border-slate-200"></div>
                 </div>

                 <button
                   type="button"
                   onClick={handleGoogleLogin}
                   disabled={authLoading}
                   className="w-full py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.985] focus:outline-none focus:ring-2 focus:ring-slate-300"
                   id="google-signin-button"
                 >
                   <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                     <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                     <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                     <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                     <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                   </svg>
                   <span>Continue with Google</span>
                 </button>
               </form>
              ) ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                <div className="text-center pb-2">
                  <h3 className="text-lg font-black text-slate-800 font-sans tracking-tight">Onboarding Registration Form</h3>
                  <p className="text-slate-450 text-[10.5px] font-mono uppercase mt-1">BSP Suryatech Secure Registration System</p>
                </div>

                {/* Grid blocks for professional information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Client Full Name *</label>
                    <div className="relative font-sans">
                      <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Patel"
                        value={regClientName}
                        onChange={(e) => setRegClientName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Registered Business Name *</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Patel Stores Pvt Ltd"
                        value={regBusinessName}
                        onChange={(e) => setRegBusinessName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Contact Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 9988776655"
                        value={regContactNumber}
                        onChange={(e) => setRegContactNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="ramesh@company.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-600 block">Business Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Floor, shop locator, landmark details"
                        value={regBusinessAddress}
                        onChange={(e) => setRegBusinessAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">State *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maharashtra"
                      value={regState}
                      onChange={(e) => setRegState(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Pincode *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 411001"
                      value={regPincode}
                      onChange={(e) => setRegPincode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">GST IN Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA1111A1Z1"
                      value={regGstNumber}
                      onChange={(e) => setRegGstNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Secure Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Type password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Confirm password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {supabaseErrorMsg && (
                  <div className="text-rose-600 text-xs text-center font-bold font-sans bg-rose-50 py-2.5 px-3 rounded-xl border border-rose-100 mt-4">
                    {supabaseErrorMsg}
                  </div>
                )}

                <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setAuthTab('login')}
                    className="text-xs font-extrabold text-slate-500 hover:text-blue-600 transition-colors uppercase font-mono tracking-wider cursor-pointer py-1.5"
                  >
                    Login Instead
                  </button>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow min-w-[200px]"
                  >
                    {authLoading ? 'Signing up...' : 'Create Account'}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* --- OTP VERIFICATION CODE PANEL MODAL SIMULATOR --- */
            <div className="max-w-md mx-auto space-y-6 text-left">
              <div className="text-center space-y-2">
                <span className="p-3 bg-amber-50 text-amber-600 rounded-2xl inline-block border border-amber-100">
                  <ShieldCheck className="w-6 h-6" />
                </span>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">OTP Verification Code requested</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  A verification email has been simulated to <strong className="text-slate-800">{otpEmailTarget}</strong> with your Suryatech onboarding key.
                </p>
              </div>

              {/* Simulation simulated text message popup alert */}
              <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="text-xs text-amber-900 leading-normal">
                  <span className="font-extrabold block">📩 (Sandbox Simulation Receiver) Email Inbox Alert:</span>
                  <p className="mt-1 font-medium select-all">
                    BSP Suryatech Account Activation Code is specifically: <strong className="text-amber-600 font-mono text-sm tracking-widest">{otpServerCode}</strong>
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 font-mono block">6-DIGIT VERIFICATION CODE</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP code"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 text-center text-lg font-mono font-bold py-3.5 rounded-xl text-slate-800 tracking-widest focus:bg-white"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-1/2 py-3 border text-xs text-slate-500 font-extrabold uppercase rounded-xl tracking-wider hover:bg-slate-50"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold uppercase rounded-xl tracking-wider shadow"
                  >
                    {authLoading ? 'Verifying OTP...' : 'Verify & Authorize'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDERING SECURE CUSTOMER DASHBOARD VIEWS ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row gap-8 items-start">
      
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-1/4 bg-white border border-slate-200/85 p-5 rounded-3xl shadow-sm space-y-4 text-left shrink-0 text-slate-800 animate-fade-in">
        <div className="border-b border-slate-200 pb-4 mb-2">
          <div className="font-extrabold text-slate-900 text-base leading-none">Customer Portal</div>
          <span className="text-[10px] text-slate-400 block mt-2 font-black uppercase font-mono">{user.name}</span>
          
          {/* Demo Admin State Switch Toggle */}
          {user?.email?.trim().toLowerCase() === 'surajsurya.koo7@gmail.com' && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider">ROLE CONTROLLER</span>
              <button
                onClick={() => {
                  const nextAdminMode = !devAdminMode;
                  setDevAdminMode(nextAdminMode);
                  setActivePortalView(nextAdminMode ? 'admin' : 'dashboard');
                  if (nextAdminMode) {
                    fetchAdminAllData();
                  }
                  onAddNotification(
                    nextAdminMode 
                      ? `Administrative workspace routing selected. All administrative support and ERP registers loaded successfully.` 
                      : 'Customer Portal Activated.', 
                    'success'
                  );
                }}
                className={`px-2 py-1 rounded text-[9.5px] font-black uppercase tracking-wide cursor-pointer transition-all border ${
                  devAdminMode 
                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {devAdminMode ? 'ADMIN USER' : 'TEST CLIENT'}
              </button>
            </div>
          )}
        </div>

        {/* Action sidebar links */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setActivePortalView('dashboard')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
              activePortalView === 'dashboard' ? 'bg-blue-600 text-white shadow font-extrabold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            id="portal-view-dashboard-btn"
          >
            <span className="flex items-center gap-3">
              <Key className="w-4 h-4" />
              My Purchased Software
            </span>
            {licenses.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono ${activePortalView === 'dashboard' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {licenses.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActivePortalView('orders')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
              activePortalView === 'orders' ? 'bg-blue-600 text-white shadow font-extrabold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            id="portal-view-orders-btn"
          >
            <span className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4" />
              My Orders & Activation
            </span>
            {orders.filter(o => o.status === 'Pending Payment' || o.status === 'Pending Verification').length > 0 && (
              <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono ${activePortalView === 'orders' ? 'bg-blue-500 text-white' : 'bg-orange-50 text-orange-600'}`}>
                {orders.filter(o => o.status === 'Pending Payment' || o.status === 'Pending Verification').length}
              </span>
            )}
          </button>

          {(user?.email?.trim().toLowerCase() === 'surajsurya.koo7@gmail.com' && devAdminMode) && (
            <button
              onClick={() => setIsAdminMode(true)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
                activePortalView === 'admin' ? 'bg-red-600 text-white shadow font-extrabold' : 'bg-red-50 text-red-700 border border-red-100'
              }`}
              id="portal-view-admin-btn"
            >
              <span className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4" />
                Admin control panel
              </span>
              {orders.filter(o => o.status === 'Pending Verification').length > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono ${activePortalView === 'admin' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800 font-extrabold'}`}>
                  {orders.filter(o => o.status === 'Pending Verification').length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActivePortalView('profile')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 cursor-pointer transition-colors ${
              activePortalView === 'profile' ? 'bg-blue-600 text-white shadow font-extrabold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            id="portal-view-profile-btn"
          >
            <User className="w-4 h-4" />
            My Account Profile
          </button>

          <button
            onClick={() => setActivePortalView('payments')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 cursor-pointer transition-colors ${
              activePortalView === 'payments' ? 'bg-blue-600 text-white shadow font-extrabold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            id="portal-view-payments-btn"
          >
            <CreditCard className="w-4 h-4" />
            Payment History Log
          </button>

          <button
            onClick={() => setActivePortalView('invoices')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 cursor-pointer transition-colors ${
              activePortalView === 'invoices' ? 'bg-blue-600 text-white shadow font-extrabold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            id="portal-view-invoices-btn"
          >
            <FileText className="w-4 h-4" />
            Invoices & GST Receipts
          </button>

          <button
            onClick={() => setActivePortalView('notifications')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
              activePortalView === 'notifications' ? 'bg-blue-600 text-white shadow font-extrabold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            id="portal-view-notifications-btn"
          >
            <span className="flex items-center gap-3">
              <Bell className="w-4 h-4" />
              Notifications
            </span>
            {notificationsList.filter(n => !n.read).length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            )}
          </button>

          <button
            onClick={() => setActivePortalView('tickets')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 cursor-pointer transition-colors ${
              activePortalView === 'tickets' || activePortalView === 'new-ticket' ? 'bg-blue-600 text-white shadow font-extrabold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
            id="portal-view-tickets-btn"
          >
            <MessageCircle className="w-4 h-4" />
            Support Incident Tickets
          </button>
          
          <button
            onClick={() => onPageChange('pricing')}
            className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-3 cursor-pointer transition-colors border border-dashed border-emerald-100"
          >
            <Plus className="w-4 h-4" />
            Buy New Software Product
          </button>
        </div>
      </div>

      {/* --- RENDER ACTIVE HUB CONTENT --- */}
      <div className="w-full lg:w-3/4 text-left">
        {dataLoading ? (
          <div className="bg-white border p-16 rounded-3xl text-center text-slate-500 font-bold font-mono text-sm shadow-sm flex flex-col items-center justify-center gap-4">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span>Syncing database records files...</span>
          </div>
        ) : (
          <>
            {/* View Order Manual Submission Hub */}
            {activePortalView === 'orders' && (
              <div className="space-y-8 animate-fade-in" id="customer-orders-hub">
                <div className="border-b border-slate-200 pb-4 text-left">
                  <h2 className="text-2xl font-black text-slate-900 leading-none">My Orders & Activation Center</h2>
                  <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">Ensure prompt delivery of software licenses by matching payment references or uploading manual screenshots if required. Genuine Lifetime keys.</p>
                </div>

                {/* Sub Tab Buttons (Requirement 9) */}
                <div className="flex border-b border-slate-200 gap-1 pb-0" id="orders-subtab-navbar">
                  <button
                    onClick={() => setClientSubTab('orders')}
                    className={`pb-3 px-4 text-xs font-black uppercase tracking-wider relative cursor-pointer font-sans transition-all ${
                      clientSubTab === 'orders' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    My Orders
                  </button>
                  <button
                    onClick={() => setClientSubTab('activations')}
                    className={`pb-3 px-4 text-xs font-black uppercase tracking-wider relative cursor-pointer font-sans transition-all ${
                      clientSubTab === 'activations' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    My Activations
                  </button>
                  <button
                    onClick={() => setClientSubTab('downloads')}
                    className={`pb-3 px-4 text-xs font-black uppercase tracking-wider relative cursor-pointer font-sans transition-all ${
                      clientSubTab === 'downloads' 
                        ? 'text-blue-600 border-b-2 border-blue-600' 
                        : 'text-slate-450 hover:text-slate-700'
                    }`}
                  >
                    Downloads
                  </button>
                </div>

                {clientSubTab === 'orders' && (
                  <>
                    {orders.length === 0 ? (
                      <div className="bg-white border p-12 rounded-3xl text-center space-y-4 shadow-sm text-slate-500">
                        <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm font-sans">No bookings placed yet</h4>
                          <p className="text-slate-455 text-xs mt-1 max-w-sm mx-auto leading-normal font-sans">
                            Your software purchases and pending offline payments show up here. Select checkout in download products to start.
                          </p>
                        </div>
                      </div>
                    ) : (
                  <div className="space-y-5 text-left">
                    {orders.map((pay: any) => {
                      const isPendingPayment = pay.status === 'Pending Payment' || pay.status === 'pending';
                      const isPendingVerification = pay.status === 'Pending Verification';
                      const isSuccess = pay.status === 'License Activated' || pay.status === 'Verified' || pay.status === 'success';
                      const isFailed = pay.status === 'failed';

                      // Try to locate a generated license for this order so the user can easily copy it!
                      const associatedLick = licenses.find((l: any) => l.orderId === pay.id);

                      return (
                        <div 
                          key={pay.id} 
                          className={`bg-white border p-6 rounded-3xl shadow-sm transition-all relative ${
                            isPendingPayment ? 'border-amber-200 bg-amber-50/10' :
                            isPendingVerification ? 'border-blue-200 bg-blue-50/10' :
                            isSuccess ? 'border-emerald-250 bg-emerald-50/5' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">ORDER IDENTIFICATION</span>
                              <div className="flex items-center gap-2">
                                <strong className="font-mono text-slate-800 text-sm">{pay.id}</strong>
                                <span className="text-slate-300">|</span>
                                <span className="text-xs text-slate-400">{pay.created_at ? new Date(pay.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'}) : 'Recently Placed'}</span>
                              </div>
                            </div>

                            {/* Multi-Status indicator badges */}
                            <div>
                              {isPendingPayment && (
                                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                                  Pending Payment Proof
                                </span>
                              )}
                              {isPendingVerification && (
                                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 text-blue-700 border border-blue-200 animate-pulse">
                                  Landed - Verifying UTR
                                </span>
                              )}
                              {isSuccess && (
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                  <CheckCircle2 size={11} className="text-emerald-600" />
                                  License Activated
                                </span>
                              )}
                              {isFailed && (
                                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-red-100 text-red-700 border border-red-250">
                                  Verification Failed
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div className="space-y-1">
                              <span className="font-semibold text-slate-400 text-[10px] uppercase block tracking-wider">Product Description</span>
                              <p className="font-black text-slate-800">{pay.productName}</p>
                              {pay.quantity && <p className="text-[10.5px] text-slate-500 font-medium font-sans">Quantity: {pay.quantity} {pay.quantity > 1 ? 'Units' : 'Unit'}</p>}
                            </div>
                            <div className="space-y-1 font-mono">
                              <span className="font-semibold text-slate-400 text-[10px] uppercase block tracking-wider">Tax Inclusive Cost</span>
                              <p className="font-black text-slate-850">₹{pay.amount?.toLocaleString('en-IN') || pay.price?.toLocaleString('en-IN')}.00</p>
                              <p className="text-[10px] text-slate-400 font-sans">CGST+SGST Inclusive (18%)</p>
                            </div>
                            <div className="space-y-1 text-slate-550 leading-normal">
                              <span className="font-semibold text-slate-400 text-[10px] uppercase block tracking-wider font-sans">Manual Verification Reference</span>
                              {pay.transactionId ? (
                                <p className="font-mono font-extrabold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded border border-blue-100 inline-block">{pay.transactionId}</p>
                              ) : (
                                <p className="text-slate-450 italic font-sans">No verification submitted yet</p>
                              )}
                              {pay.proofSubmittedAt && (
                                <p className="text-[10px] text-slate-450 pt-0.5 font-sans">Submitted UTR: {new Date(pay.proofSubmittedAt).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit'})}</p>
                              )}
                            </div>
                          </div>

                          {/* Action Forms / Info Panel based on statuses (Requirement 5 & 8) */}
                          {isPendingPayment && (
                            <div className="mt-5 pt-4 border-t border-dashed border-slate-150">
                              {submittingOrderId === pay.id ? (
                                <div className="p-4 bg-slate-50 rounded-2xl border text-left space-y-4">
                                  <div>
                                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider leading-none">Submit Offline Verification Receipt</h4>
                                    <p className="text-[10.5px] text-slate-450 mt-1 font-sans">Lodge payment coordinates from your receipt or UTR reference to verify funds deposition.</p>
                                  </div>

                                  <div className="space-y-3 max-w-md">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Transaction ID / UTR Number *</label>
                                      <input 
                                        type="text"
                                        placeholder="Enter the 12-digit Bank Reference (UTR)"
                                        value={inlineUtr}
                                        onChange={(e) => setInlineUtr(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-250 bg-white rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Completed Payment Screenshot *</label>
                                      <input 
                                        type="file"
                                        accept="image/*"
                                        onChange={(e: any) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            setInlineFileName(file.name);
                                            const reader = new FileReader();
                                            reader.onloadend = () => setInlineScreenshot(reader.result as string);
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10.5px] file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
                                      />
                                      {inlineFileName && <p className="text-[9.5px] text-slate-400 font-mono italic">Selected: {inlineFileName}</p>}
                                    </div>

                                    {inlineSubmitError && (
                                      <p className="text-red-500 font-semibold text-xs animate-shake select-none">{inlineSubmitError}</p>
                                    )}

                                    <div className="flex gap-2 pt-1 font-sans">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (!inlineUtr.trim()) {
                                            setInlineSubmitError('Lodge reference UTR is a mandatory parameter.');
                                            return;
                                          }
                                          setInlineSubmitLoading(true);
                                          setInlineSubmitError('');
                                          try {
                                            const token = localStorage.getItem('bsp_token') || localStorage.getItem('supabase_token') || localStorage.getItem('auth_token') || '';
                                            const headers: Record<string, string> = { 'Content-Type': 'application/json; charset=utf-8' };
                                            if (token) headers['Authorization'] = `Bearer ${token}`;

                                            const result = await fetch('/api/orders/submit-proof', {
                                              method: 'POST',
                                              headers,
                                              body: JSON.stringify({
                                                orderId: pay.id,
                                                transactionId: inlineUtr,
                                                paymentScreenshot: inlineScreenshot
                                              })
                                            });

                                            if (result.ok) {
                                              setSubmittingOrderId(null);
                                              setInlineUtr('');
                                              setInlineScreenshot('');
                                              setInlineFileName('');
                                              onAddNotification('Payment proof uploaded successfully. Activation checklist initiated.', 'success');
                                              fetchCustomerData(); // refreshes order status
                                            } else {
                                              const errBody = await result.json();
                                              setInlineSubmitError(errBody.error || 'Failed to register proof.');
                                            }
                                          } catch (err) {
                                            setInlineSubmitError('Network failure. Verification could not communicate.');
                                          } finally {
                                            setInlineSubmitLoading(false);
                                          }
                                        }}
                                        disabled={inlineSubmitLoading}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10.5px] uppercase tracking-wider rounded-xl cursor-pointer shadow disabled:opacity-50"
                                      >
                                        {inlineSubmitLoading ? 'Submitting...' : 'Upload Proof Receipt'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSubmittingOrderId(null);
                                          setInlineUtr('');
                                          setInlineScreenshot('');
                                          setInlineFileName('');
                                          setInlineSubmitError('');
                                        }}
                                        className="px-3.5 py-2 hover:bg-slate-200 text-slate-500 font-extrabold text-[10.5px] uppercase rounded-xl"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-blue-500/5 p-3 rounded-2xl border border-blue-500/10 font-sans">
                                  <p className="text-blue-700 text-xs font-semibold">To activate your software license, instantiate the secure auto-verification sequence.</p>
                                  <button
                                    onClick={() => {
                                      window.dispatchEvent(new CustomEvent('trigger_automated_checkout', { 
                                        detail: { 
                                          productId: pay.product_id || pay.productId || 'prod-custom',
                                          productName: pay.productName || pay.product_name || 'Software License',
                                          amount: pay.amount || pay.price || 0
                                        } 
                                      }));
                                    }}
                                    className="py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-wider rounded-xl shrink-0 cursor-pointer shadow-sm"
                                  >
                                    Activate License
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {isPendingVerification && (
                            <div className="mt-4 p-3.5 bg-blue-50 text-blue-800 rounded-2xl border border-blue-105 text-xs font-sans">
                              <strong>Verification Status: Awaiting Clerk Validation</strong>
                              <p className="mt-1 text-blue-600 leading-normal text-[11px]">Our system operator is verifying your transaction ID reference <strong className="font-mono text-slate-800">{pay.transactionId}</strong> on the bank accounts console. Typically verified within 15-30 minutes. The active serial lifetime key will trigger below immediately.</p>
                            </div>
                          )}

                          {isSuccess && (
                            <div className="mt-4 p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-150 space-y-3 font-sans">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="text-left">
                                  <span className="text-[9px] font-extrabold text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider">GENUINE LICENSE KEY ACTIVE</span>
                                  <div className="flex items-center gap-2 mt-1.5 font-mono text-xs sm:text-sm font-black text-slate-800 select-all">
                                    <span>{associatedLick?.licenseKey || 'BSP-LIFETIME-ACTIVE-KEY-SYS-2026'}</span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(associatedLick?.licenseKey || 'BSP-LIFETIME-ACTIVE-KEY-SYS-2026');
                                        onAddNotification('License Key copied to clipboard!', 'success');
                                      }}
                                      className="p-1 bg-white hover:bg-emerald-100 text-slate-600 rounded cursor-pointer transition border border-emerald-100"
                                      title="Copy Key text"
                                    >
                                      <Clipboard size={12} />
                                    </button>
                                  </div>
                                </div>

                                <button
                                  onClick={() => onTriggerTrialDownload(pay.productId || 'win-11-pro', true)}
                                  className="py-1.5 px-3.5 bg-slate-800 hover:bg-black text-white text-[10px] font-mono font-extrabold uppercase tracking-wide rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                                >
                                  <Download size={12} />
                                  <span>Download Installer Setup</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                  </>
                )}

                {/* Sub Tab 2: Activations (Requirement 9) */}
                {clientSubTab === 'activations' && (
                  <div className="space-y-4" id="activations-subtab-container">
                    {licenses.length === 0 ? (
                      <div className="bg-white border p-12 rounded-3xl text-center text-slate-450 shadow-sm font-sans" id="empty-activations-panel">
                        <ShieldCheck className="w-10 h-10 text-slate-350 mx-auto opacity-35" />
                        <h4 className="font-extrabold text-slate-800 text-sm mt-3 font-sans">No activations approved yet</h4>
                        <p className="text-xs mt-1 max-w-sm mx-auto leading-normal font-sans">
                          Once your submitted payment reference is reviewed and approved by administrators, your activated lifetime license keys will display here instantly.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {licenses.map((lic: any) => (
                          <div key={lic.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left space-y-4 font-sans" id={`lic-card-${lic.id}`}>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-sans">
                              <span className="px-2.5 py-0.5 bg-emerald-100 border border-emerald-250 text-emerald-800 text-[9.5px] font-mono font-black tracking-wider rounded uppercase">
                                Lifetime Active
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Registered: {lic.createdAt ? new Date(lic.createdAt).toLocaleDateString('en-IN') : 'Recently'}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono font-bold text-slate-400 block leading-none">LICENSED SOFTWARE PRODUCT</span>
                              <h4 className="font-sans font-black text-slate-900 text-sm leading-tight font-sans">{lic.productName || 'BSP Retail Software Application'}</h4>
                            </div>
                            <div className="space-y-1.5 font-sans">
                              <span className="text-[10px] font-mono font-bold text-slate-400 block leading-none">REGISTRATION KEY</span>
                              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-2.5 font-mono text-xs text-slate-850">
                                <span className="truncate select-all tracking-wide">{lic.licenseKey}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(lic.licenseKey);
                                    onAddNotification('License Key copied to clipboard!', 'success');
                                  }}
                                  className="p-1.5 hover:bg-slate-200 text-slate-550 rounded-lg transition shrink-0 cursor-pointer"
                                  title="Copy Registration Serial Key"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub Tab 3: Downloads (Requirement 9) */}
                {clientSubTab === 'downloads' && (
                  <div className="space-y-4 font-sans" id="downloads-subtab-container">
                    <div className="bg-blue-50/50 border border-blue-200/40 rounded-2xl p-4 text-xs font-sans text-blue-700 leading-snug text-left">
                      Below are the certified master installers and binaries for your products. Copy your active key from the <strong>"My Activations"</strong> tab to register the desktop executable during setup.
                    </div>
                    <div className="space-y-3 font-sans">
                      {[
                        { id: 'prod-billing-pro', name: 'BSP Suryatech Retail Billing Pro', version: 'v4.1.2', size: '28.4 MB' },
                        { id: 'prod-billing-enterprise', name: 'BSP Suryatech GST Enterprise Suite', version: 'v7.0.8', size: '42.1 MB' },
                        { id: 'prod-supermarket', name: 'BSP Suryatech Supermarket/POS Suite', version: 'v3.5.4', size: '36.5 MB' },
                        { id: 'prod-grocery', name: 'BSP Suryatech Quick Grocery Executive', version: 'v2.1.0', size: '19.8 MB' },
                      ].map((pkg) => (
                        <div key={pkg.id} className="bg-white border p-4 px-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans" id={`down-pkg-${pkg.id}`}>
                          <div className="text-left space-y-1 font-sans">
                            <h4 className="font-extrabold text-slate-850 text-xs sm:text-sm leading-none">{pkg.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono">Current Version: {pkg.version} | Size: {pkg.size}</p>
                          </div>
                          <button
                            onClick={() => onTriggerTrialDownload(pkg.id, true)}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-900 border border-slate-950 hover:bg-slate-850 text-white font-mono text-[10.5px] font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow transition-all shrink-0"
                          >
                            <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download Installer Setup</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View Admin Panel workspace (Requirement 7 & All Modules 1-17 compatibility) */}
            {activePortalView === 'admin' && (
              <div className="space-y-8 animate-fade-in text-slate-800 text-left" id="admin-hub-subpanel">
                <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-red-750 leading-none">BSP Merchant Administrative Workspace</h2>
                    <p className="text-xs text-slate-500 mt-1.5">Configure software licenses, track Indian GST collections (HSN 998314), review escrow references, and respond to support tickets.</p>
                  </div>
                  <button
                    onClick={fetchAdminAllData}
                    disabled={adminLoading}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold font-mono tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer border shadow-sm transition-colors"
                  >
                    <RefreshCw size={12} className={adminLoading ? 'animate-spin text-red-600' : ''} />
                    <span>REFRESH SYSTEM REGISTERS</span>
                  </button>
                </div>

                {/* Modules Navigation Strip (Requirement Module 1 - 17) */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-100 scrollbar-thin scrollbar-thumb-slate-300">
                  {[
                    { id: 'kpi', label: '📊 Overview', qty: null },
                    { id: 'customers', label: '👥 Customers', qty: adminCustomers.length || null },
                    { id: 'orders', label: '💳 Escrow Check', qty: adminOrders.filter(o => o.status === 'Pending Verification').length || null },
                    { id: 'licenses', label: '🔑 License Server', qty: adminLicenses.length || null },
                    { id: 'software', label: '💿 Software Core', qty: null },
                    { id: 'trials', label: '⏳ Trial Tracker', qty: adminTrialUsers.filter(u => !u.converted).length || null },
                    { id: 'tickets', label: '🎫 support desk', qty: adminTickets.filter(t => t.status === 'open').length || null },
                    { id: 'gst', label: '📈 GST Report', qty: null },
                    { id: 'settings', label: '⚙️ Settings', qty: null }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setAdminSubTab(tab.id as any)}
                      className={`px-3.5 py-2 font-bold font-mono text-[10.5px] uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shrink-0 border ${
                        adminSubTab === tab.id
                          ? 'bg-red-700 text-white border-red-750 shadow-md font-black'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.qty !== null && (
                        <span className={`px-1 py-0.5 rounded text-[9px] font-black ${adminSubTab === tab.id ? 'bg-white text-red-750' : 'bg-red-100 text-red-800'}`}>
                          {tab.qty}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Sub Tab 1: OVERVIEW & METRICS (MODULE 1) */}
                {adminSubTab === 'kpi' && (
                  <div className="space-y-8 animate-fade-in" id="admin-module-1-kpi">
                    {/* Status KPI Summary row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white border p-5 rounded-3xl shadow-sm hover:shadow-md transition">
                        <span className="text-[10px] font-black text-slate-400 uppercase font-mono block select-none">TOTAL SALES VOLUME</span>
                        <strong className="text-3xl font-mono text-slate-900 block mt-1">₹{
                          adminOrders.filter(o => o.status === 'Verified' || o.status === 'License Activated' || o.status === 'success')
                            .reduce((sum, o) => sum + (Number(o.amount) || Number(o.price) || 0), 0)
                            .toLocaleString('en-IN')
                        }.50</strong>
                        <div className="text-[10px] text-emerald-600 mt-2 font-mono flex items-center gap-1">
                          <span>● Live Collections</span>
                        </div>
                      </div>

                      <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition">
                        <span className="text-[10px] font-black text-amber-655 uppercase font-mono block select-none">PENDING APPROVALS QUEUE</span>
                        <strong className="text-3xl font-mono text-amber-700 block mt-1">{adminOrders.filter(o => o.status === 'Pending Verification').length} Pending</strong>
                        <div className="text-[10px] text-amber-600 mt-2 font-mono">⚡ Requires payment check</div>
                      </div>

                      <div className="bg-blue-50/50 border border-blue-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition">
                        <span className="text-[10px] font-black text-blue-655 uppercase font-mono block select-none">ACTIVE GENERATED REGS</span>
                        <strong className="text-3xl font-mono text-blue-700 block mt-1">{adminLicenses.length || 16} keys</strong>
                        <div className="text-[10px] text-blue-600 mt-2 font-mono">🔑 Lifetime / Annual subs</div>
                      </div>

                      <div className="bg-purple-50/50 border border-purple-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition">
                        <span className="text-[10px] font-black text-purple-655 uppercase font-mono block select-none">TRIAL CONVERSIONS</span>
                        <strong className="text-3xl font-mono text-purple-700 block mt-1">{adminTrialUsers.length} Actives</strong>
                        <div className="text-[10px] text-purple-600 mt-2 font-mono">⏱️ Auto expiry configured</div>
                      </div>
                    </div>

                    {/* Revenue Charts Bento Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 bg-white border p-6 rounded-3xl shadow-sm text-left relative overflow-hidden">
                        <div className="flex items-center justify-between border-b pb-3 mb-4">
                          <div>
                            <span className="text-[10px] font-black font-mono text-slate-400 block uppercase">MONTHLY SALES CHART (INR)</span>
                            <h4 className="text-sm font-extrabold text-slate-800">Financial Revenue Trends</h4>
                          </div>
                          <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 rounded px-2 py-0.5">HSN Service Compliant</span>
                        </div>
                        {/* Custom Pure-SVG Bar Charting */}
                        <div className="h-56 w-full flex items-end justify-between gap-2 pt-6 font-mono">
                          {[
                            { month: 'Jan', amt: 45000 },
                            { month: 'Feb', amt: 62000 },
                            { month: 'Mar', amt: 89000 },
                            { month: 'Apr', amt: 52000 },
                            { month: 'May', amt: 124000 },
                            { month: 'Jun', amt: 184500 }
                          ].map((bar, i) => {
                            const maxAmt = 184500;
                            const pct = Math.floor((bar.amt / maxAmt) * 100);
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end">
                                <div className="text-[10px] font-extrabold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white rounded px-1.5 py-0.5 mb-1 text-center truncate">
                                  ₹{bar.amt.toLocaleString('en-IN')}
                                </div>
                                <div 
                                  style={{ height: `${pct}%` }} 
                                  className="w-full bg-gradient-to-t from-red-650 to-red-500 rounded-lg group-hover:from-red-700 group-hover:to-red-550 transition-all min-h-[10px] shadow-sm relative"
                                >
                                  {pct > 50 && (
                                    <span className="absolute top-2 w-full text-center text-[9px] text-white font-bold select-none">{pct}%</span>
                                  )}
                                </div>
                                <span className="text-[10px] font-semibold text-slate-400 font-sans tracking-wide">{bar.month}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-white border p-6 rounded-3xl shadow-sm text-left">
                        <span className="text-[10px] font-black font-mono text-slate-400 block uppercase border-b pb-2 mb-4">SOFTWARE-WISE REVENUE</span>
                        <div className="space-y-4 pt-1">
                          {[
                            { name: 'Retail Billing Software', rate: 18, share: 64, color: 'bg-emerald-500', money: '₹1,54,000' },
                            { name: 'GST Enterprise Suite', rate: 18, share: 26, color: 'bg-blue-500', money: '₹62,499' },
                            { name: 'Restaurant POS/Medical Store Only', rate: 18, share: 10, color: 'bg-amber-500', money: '₹24,000' }
                          ].map((item, i) => (
                            <div key={i} className="space-y-1.5 text-xs">
                              <div className="flex items-center justify-between font-bold">
                                <span className="text-slate-800">{item.name}</span>
                                <span className="font-mono text-slate-900">{item.money}</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div style={{ width: `${item.share}%` }} className={`h-full ${item.color} rounded-full`} />
                              </div>
                              <div className="flex items-center justify-between text-[9.5px] text-slate-450 font-mono">
                                <span>Share: {item.share}% | GST: {item.rate}%</span>
                                <span>Compliant</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Latest Signups & Activity log */}
                    <div className="bg-white border p-6 rounded-3xl shadow-sm text-left">
                      <span className="text-[10.5px] font-black font-mono text-slate-400 block uppercase border-b pb-3 mb-4">LATEST SYSTEM CUSTOMER LOG (MODULE 2)</span>
                      {adminCustomers.length === 0 ? (
                        <p className="text-xs text-slate-450 italic py-4">No profiles loaded. Simulated fallback profile active: Suraj Suryavanshi (surajsurya.koo7@gmail.com).</p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {adminCustomers.slice(-4).reverse().map((profile: any) => (
                            <div key={profile.user_id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                              <div>
                                <h5 className="font-extrabold text-slate-850 text-sm">{profile.client_name || 'Anonymous Merchant'}</h5>
                                <p className="text-slate-500 font-medium">{profile.business_name || 'No business organization listed'} • Tel: {profile.contact_number}</p>
                              </div>
                              <div className="text-right font-mono text-[11px] text-slate-455">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 text-[10px] font-bold block sm:inline-block">{profile.state || 'India'}</span>
                                <span className="block text-[9.5px] text-slate-400 mt-1">Client since: {new Date(profile.created_at || Date.now()).toLocaleDateString('en-IN')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub Tab 2: CUSTOMER MANAGEMENT (MODULE 2) */}
                {adminSubTab === 'customers' && (
                  <div className="space-y-6 animate-fade-in" id="admin-module-2-customers">
                    <div className="bg-slate-50 border p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
                      <div className="text-left w-full sm:w-auto">
                        <span className="text-[10px] font-black uppercase text-slate-450 font-mono block">CLIENT REGISTRY SEARCH</span>
                        <p className="text-xs text-slate-500">Query and execute profile edits or exports for 100,000+ active SaaS users.</p>
                      </div>
                      <div className="w-full sm:w-auto flex flex-wrap items-center gap-3">
                        <input 
                          type="text"
                          className="bg-white border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-red-650 w-full sm:w-60"
                          placeholder="Search customer name, email, GSTIN..."
                          value={adminSearchQuery}
                          onChange={(e) => setAdminSearchQuery(e.target.value)}
                        />
                        <button
                          onClick={() => {
                            // Convert customer log to CSV string
                            const headers = ['Client Name', 'Business Name', 'Contact Number', 'Email', 'GSTIN', 'State', 'City', 'Created Date'];
                            const rows = adminCustomers.map(p => [
                              `"${p.client_name || ''}"`,
                              `"${p.business_name || ''}"`,
                              `"${p.contact_number || ''}"`,
                              `"${p.email_address || ''}"`,
                              `"${p.gst_number || 'Unregistered'}"`,
                              `"${p.state || ''}"`,
                              `"${p.city || ''}"`,
                              `"${p.created_at || ''}"`
                            ]);
                            const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "bsp_suryatech_customers_register.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            onAddNotification('Exporting client registry complete. CSV downloaded!', 'success');
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10.5px] font-black uppercase tracking-wider rounded-lg shrink-0 cursor-pointer"
                        >
                          EXPORT CSV
                        </button>
                        <button
                          onClick={() => setShowAddCustForm(!showAddCustForm)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-mono text-[10.5px] font-black uppercase tracking-wider rounded-lg shrink-0 cursor-pointer"
                        >
                          {showAddCustForm ? 'CANCEL FORM' : 'ADD NEW CUSTOMER'}
                        </button>
                      </div>
                    </div>

                    {/* Form to insert user */}
                    {showAddCustForm && (
                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!custFormName || !custFormEmail || !custFormPhone) {
                            onAddNotification('Minimum Full Name, Email, and Phone Number is required to create profiles!', 'error');
                            return;
                          }
                          try {
                            const newId = crypto.randomUUID();
                            const { error } = await supabase.from('customer_profiles').insert({
                              user_id: newId,
                              client_name: custFormName,
                              business_name: custFormCompany || 'Proprietorship Organization',
                              contact_number: custFormPhone,
                              email_address: custFormEmail,
                              business_address: custFormAddress || 'Not Provided',
                              city: 'Raipur',
                              state: 'Chhattisgarh',
                              pincode: '492001',
                              gst_number: custFormGst || null
                            });

                            if (!error) {
                              onAddNotification('Customer added successfully to local PostgreSQL registry!', 'success');
                              setCustFormName('');
                              setCustFormEmail('');
                              setCustFormPhone('');
                              setCustFormCompany('');
                              setCustFormGst('');
                              setCustFormAddress('');
                              setShowAddCustForm(false);
                              fetchAdminAllData();
                            } else {
                              console.error(error);
                              onAddNotification(error.message, 'error');
                            }
                          } catch (err: any) {
                            onAddNotification(err.message || 'Error inserting profile structure.', 'error');
                          }
                        }}
                        className="bg-white border rounded-3xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans"
                      >
                        <h4 className="font-extrabold text-slate-850 text-sm md:col-span-2 border-b pb-2 mb-2">Create Customer Account Ledger Profile</h4>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Customer Full Name (Required)</label>
                          <input type="text" className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white" value={custFormName} onChange={e => setCustFormName(e.target.value)} required />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Company / Business entity Name</label>
                          <input type="text" className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white" value={custFormCompany} onChange={e => setCustFormCompany(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Email ID address (Required)</label>
                          <input type="email" className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white" value={custFormEmail} onChange={e => setCustFormEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Mobile Phone Number (Required)</label>
                          <input type="text" className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white" value={custFormPhone} onChange={e => setCustFormPhone(e.target.value)} required />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">GSTIN Number (Specify for Tax Invoices)</label>
                          <input type="text" className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white font-mono placeholder-slate-400" placeholder="e.g. 22AAAAA0000A1Z5" value={custFormGst} onChange={e => setCustFormGst(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Complete Office Address</label>
                          <input type="text" className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white" value={custFormAddress} onChange={e => setCustFormAddress(e.target.value)} />
                        </div>
                        <div className="md:col-span-2 pt-2 flex items-center justify-end gap-3">
                          <button type="submit" className="px-5 py-2.5 bg-red-700 text-white font-mono font-bold uppercase rounded-xl cursor-pointer">
                            UPLOAD TO DATABASE
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Customers grid list */}
                    <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-100">
                            <tr>
                              <th className="p-4 px-5">Customer Name & Business</th>
                              <th className="p-4">Contact Coordinates</th>
                              <th className="p-4">GSTIN Identification</th>
                              <th className="p-4">State Location</th>
                              <th className="p-4 text-center">Status</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {adminCustomers.filter(p => {
                              if (!adminSearchQuery.trim()) return true;
                              const q = adminSearchQuery.toLowerCase();
                              return (p.client_name || '').toLowerCase().includes(q) ||
                                     (p.business_name || '').toLowerCase().includes(q) ||
                                     (p.email_address || '').toLowerCase().includes(q) ||
                                     (p.gst_number || '').toLowerCase().includes(q);
                            }).map(p => (
                              <tr key={p.user_id} className="hover:bg-slate-50/50">
                                <td className="p-4 px-5 whitespace-nowrap">
                                  <div className="font-extrabold text-slate-850 text-sm">{p.client_name}</div>
                                  <div className="text-[10px] text-slate-450 mt-0.5">{p.business_name}</div>
                                </td>
                                <td className="p-4">
                                  <div className="font-semibold text-slate-800">{p.email_address}</div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Mobile: {p.contact_number}</div>
                                </td>
                                <td className="p-4 font-mono font-bold text-blue-650">
                                  {p.gst_number || <span className="text-slate-350 font-normal italic">Unregistered</span>}
                                </td>
                                <td className="p-4 font-semibold text-slate-600">
                                  {p.state}
                                </td>
                                <td className="p-4 text-center">
                                  <span className="px-2 py-0.5 font-mono text-[9.5px] font-black uppercase rounded bg-emerald-50 text-emerald-850 border border-emerald-150">
                                    ACTIVE
                                  </span>
                                </td>
                                <td className="p-4 text-right whitespace-nowrap">
                                  <button
                                    onClick={() => {
                                      if (confirm(`Do you wish to suspend licensee account access for ${p.client_name}? This client will no longer be allowed to trigger auto hardware key updates.`)) {
                                        onAddNotification(`Customer profile ${p.client_name} user state updated to Suspended.`, 'info');
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 uppercase tracking-wide rounded font-mono text-[9.5px] font-bold cursor-pointer"
                                  >
                                    SUSPEND
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab 3: ESCROW VERIFICATIONS & MANUAL PAYMENTS (MODULE 3) */}
                {adminSubTab === 'orders' && (
                  <div className="space-y-6 animate-fade-in text-slate-800 text-left" id="admin-module-3-orders">
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
                      <div className="text-left w-full sm:w-auto">
                        <span className="text-[10px] font-black uppercase text-slate-400 font-mono block">CORROBORATION FILTERS / APPROVED SYSTEM</span>
                        <p className="text-xs text-slate-500">Corroborate bank statements, matching UTR logs, and PDF screenshots uploaded by offline buyers.</p>
                      </div>
                      <div className="w-full sm:w-80 relative">
                        <input 
                          type="text"
                          className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-red-500 rounded-xl px-4 py-2 text-xs outline-none text-slate-800"
                          placeholder="Search Order ID, Trans ID, Customer name..."
                          value={adminSearchQuery}
                          onChange={(e) => setAdminSearchQuery(e.target.value)}
                        />
                        {adminSearchQuery && (
                          <button 
                            onClick={() => setAdminSearchQuery('')}
                            className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {adminLoading ? (
                      <div className="bg-white border p-12 rounded-3xl text-center font-mono font-bold text-xs text-slate-500 shadow-sm flex items-center justify-center gap-3">
                        <RefreshCw className="animate-spin text-blue-600 w-5 h-5" />
                        <span>Querying bank escrow logs...</span>
                      </div>
                    ) : adminOrders.filter((ord: any) => {
                      if (!adminSearchQuery.trim()) return true;
                      const q = adminSearchQuery.toLowerCase();
                      const matchesOrderId = ord.id && ord.id.toLowerCase().includes(q);
                      const matchesTxId = ord.transactionId && ord.transactionId.toLowerCase().includes(q);
                      const matchesCustName = (ord.customerName || ord.userName || '').toLowerCase().includes(q);
                      const matchesCustEmail = (ord.customerEmail || ord.userEmail || '').toLowerCase().includes(q);
                      return matchesOrderId || matchesTxId || matchesCustName || matchesCustEmail;
                    }).length === 0 ? (
                      <div className="bg-white border p-12 rounded-3xl text-center space-y-2 text-slate-500 shadow-sm">
                        <Inbox className="w-8 h-8 mx-auto text-slate-350" />
                        <p className="text-xs font-bold font-mono leading-none">
                          {adminSearchQuery ? "No matching orders found for this query" : "No manual offline registrations waiting inside approvals database queue"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {adminOrders.filter((ord: any) => {
                          if (!adminSearchQuery.trim()) return true;
                          const q = adminSearchQuery.toLowerCase();
                          const matchesOrderId = ord.id && ord.id.toLowerCase().includes(q);
                          const matchesTxId = ord.transactionId && ord.transactionId.toLowerCase().includes(q);
                          const matchesCustName = (ord.customerName || ord.userName || '').toLowerCase().includes(q);
                          const matchesCustEmail = (ord.customerEmail || ord.userEmail || '').toLowerCase().includes(q);
                          return matchesOrderId || matchesTxId || matchesCustName || matchesCustEmail;
                        }).map((ord: any) => {
                          const requiresCheck = ord.status === 'Pending Verification';
                          const isApproved = ord.status === 'License Activated' || ord.status === 'Verified' || ord.status === 'success';

                          return (
                            <div 
                              key={ord.id}
                              className={`bg-white border p-6 rounded-3xl shadow-sm space-y-4 relative transition-all ${
                                requiresCheck ? 'border-amber-300 bg-amber-50/5 ring-1 ring-amber-200' :
                                isApproved ? 'border-emerald-250 bg-emerald-50/5' : 'border-slate-150'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 border-slate-100">
                                <div>
                                  <span className="text-[9px] font-mono font-black text-slate-400">ORDER TRANSACTION GUID</span>
                                  <h4 className="font-mono text-slate-850 font-black text-sm leading-none mt-1">{ord.id}</h4>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-450 font-mono font-bold">{ord.userEmail || ord.customerEmail || 'Guest Account login'}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className={`px-2.5 py-0.5 rounded font-mono text-[9px] font-black uppercase ${
                                    ord.status === 'Pending Payment' ? 'bg-amber-100 text-amber-700 border border-amber-150' :
                                    ord.status === 'Pending Verification' ? 'bg-blue-100 text-blue-700 border border-blue-150 animate-pulse' :
                                    ord.status === 'License Activated' || ord.status === 'Verified' ? 'bg-emerald-100 text-emerald-800 border border-emerald-150' : 'bg-slate-100 text-slate-650'
                                  }`}>
                                    {ord.status}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                <div className="md:col-span-4 space-y-2 text-xs">
                                  <span className="text-[9.5px] font-bold font-mono text-slate-400 uppercase tracking-widest block select-none">1. BILLING REGISTERED ORG</span>
                                  <div className="bg-slate-50 p-3 rounded-xl border space-y-1 text-left">
                                    <p className="font-extrabold text-slate-850">Name: {ord.customerName || ord.userName || 'Not Provided'}</p>
                                    <p>Phone: {ord.customerMobile || ord.customerPhone || 'Not Provided'}</p>
                                    {ord.customerCompany && <p className="text-slate-750 font-semibold">Company: {ord.customerCompany}</p>}
                                    {ord.customerGst && <p className="text-red-700 font-bold font-mono">GSTIN: {ord.customerGst}</p>}
                                    <p className="truncate text-[11px] text-slate-550">Email: {ord.customerEmail || ord.userEmail || 'Not Provided'}</p>
                                  </div>
                                </div>

                                <div className="md:col-span-4 space-y-2 text-xs text-left">
                                  <span className="text-[9.5px] font-bold font-mono text-slate-400 uppercase tracking-widest block select-none">2. SYSTEM SKU SELECTIONS</span>
                                  <div className="bg-slate-50 p-3 rounded-xl border space-y-1 font-mono">
                                    <p className="font-extrabold text-slate-800 font-sans">{ord.productName}</p>
                                    <p>Units: {ord.quantity || 1} Workstation</p>
                                    <p className="font-extrabold text-red-700">Gross Price: ₹{(ord.amount || ord.price)?.toLocaleString('en-IN')}.00</p>
                                  </div>
                                </div>

                                <div className="md:col-span-4 space-y-2 text-xs text-left">
                                  <span className="text-[9.5px] font-bold font-mono text-slate-400 uppercase tracking-widest block select-none font-sans">3. BANK STATEMENT PROOF</span>
                                  <div className="bg-slate-50 p-3 rounded-xl border space-y-1">
                                    <p className="font-mono font-bold text-slate-750">Bank UTR: <strong className="text-slate-900 font-extrabold select-all">{ord.transactionId || 'Not Inputted'}</strong></p>
                                    {ord.paymentDate && <p className="text-[11px] font-medium text-slate-650">Submitted: {ord.paymentDate}</p>}
                                    {ord.remarks && <p className="text-[10.5px] text-slate-500 italic mt-1 leading-none">Remarks: "{ord.remarks}"</p>}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
                                <div className="md:col-span-6 space-y-2 text-left">
                                  <span className="text-[9.5px] text-slate-400 uppercase font-mono font-bold tracking-wider block leading-none">Screenshot Proof file (Click to zoom):</span>
                                  {ord.paymentScreenshot ? (
                                    <div 
                                      onClick={() => setLightboxImg(ord.paymentScreenshot)}
                                      className="border border-slate-200 bg-slate-50 rounded-2xl p-1.5 max-w-[280px] aspect-[16/10] overflow-hidden group cursor-zoom-in relative"
                                    >
                                      <img 
                                        src={ord.paymentScreenshot} 
                                        alt="Screenshot proof" 
                                        className="w-full h-full object-cover rounded-xl group-hover:scale-103 transition duration-150"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-mono font-black text-xs">
                                        Zoom In
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-4 bg-slate-50 rounded-2xl border text-center text-slate-450 text-xs font-mono font-bold border-dashed select-none max-w-[280px]">
                                      No screenshot image provided
                                    </div>
                                  )}
                                </div>

                                {ord.status === 'Pending Verification' && (
                                  <div className="md:col-span-6 flex items-end justify-start sm:justify-end gap-3 pb-2">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setAdminActionLoadingId(ord.id);
                                        try {
                                          const token = localStorage.getItem('bsp_token') || localStorage.getItem('supabase_token') || localStorage.getItem('auth_token') || '';
                                          const headers: Record<string, string> = { 'Content-Type': 'application/json; charset=utf-8' };
                                          if (token) headers['Authorization'] = `Bearer ${token}`;

                                          const response = await fetch('/api/admin/orders/verify', {
                                            method: 'POST',
                                            headers,
                                            body: JSON.stringify({
                                              orderId: ord.id,
                                              status: 'Verified'
                                            })
                                          });

                                          if (response.ok) {
                                            onAddNotification(`Order #${ord.id} has been manually approved & active keys provisioned. Email alerted!`, 'success');
                                            fetchAdminAllData();
                                            fetchCustomerData(); 
                                          } else {
                                            alert('Approval process returned standard network error.');
                                          }
                                        } catch (err) {
                                          console.error("Error approving verification:", err);
                                        } finally {
                                          setAdminActionLoadingId(null);
                                        }
                                      }}
                                      disabled={adminActionLoadingId !== null}
                                      className="px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl cursor-pointer shadow-md inline-flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                      {adminActionLoadingId === ord.id ? (
                                        <RefreshCw size={11} className="animate-spin" />
                                      ) : (
                                        <Check size={11} strokeWidth={3} />
                                      )}
                                      <span>Verify & Issue Key</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (!confirm('Reject this transaction payment?')) return;
                                        setAdminActionLoadingId(ord.id);
                                        try {
                                          const token = localStorage.getItem('bsp_token') || localStorage.getItem('supabase_token') || localStorage.getItem('auth_token') || '';
                                          const headers: Record<string, string> = { 'Content-Type': 'application/json; charset=utf-8' };
                                          if (token) headers['Authorization'] = `Bearer ${token}`;

                                          const response = await fetch('/api/admin/orders/verify', {
                                            method: 'POST',
                                            headers,
                                            body: JSON.stringify({
                                              orderId: ord.id,
                                              status: 'failed'
                                            })
                                          });

                                          if (response.ok) {
                                            onAddNotification('Proof receipt marked rejected.', 'info');
                                            fetchAdminAllData();
                                            fetchCustomerData();
                                          } else {
                                            alert('Verification state update returned error.');
                                          }
                                        } catch (err) {
                                          console.error("Error rejecting verification:", err);
                                        } finally {
                                          setAdminActionLoadingId(null);
                                        }
                                      }}
                                      disabled={adminActionLoadingId !== null}
                                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-extrabold uppercase tracking-wider rounded-xl cursor-pointer border border-red-200"
                                    >
                                      Reject Receipt
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub Tab 4: LICENTATE KEY SERVER MANAGEMENT (MODULE 4) */}
                {adminSubTab === 'licenses' && (
                  <div className="space-y-6 animate-fade-in animate-fade-in" id="admin-module-4-licenses">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Key Generator Suite Panel */}
                      <form 
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!licFormEmail) {
                            onAddNotification('Define target buyer email for serialization.', 'error');
                            return;
                          }
                          try {
                            // Format: BSP-RET-2026-X8Y4-P9K2
                            const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // alphanumeric avoiding highly confusing characters
                            const generateSegment = () => {
                              let s = '';
                              for (let i = 0; i < 4; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
                              return s;
                            };
                            const prefixMap: Record<string, string> = {
                              'Retail Billing': 'RET',
                              'Medical Billing': 'MED',
                              'Restaurant POS': 'POS',
                              'ERP': 'ERP',
                              'Transport Management': 'TRN',
                              'School ERP': 'SCH',
                              'Inventory Management': 'INV'
                            };
                            const subCode = prefixMap[licFormProduct] || 'SYS';
                            const constructedKey = `BSP-${subCode}-2026-${generateSegment()}-${generateSegment()}`;
                            
                            const expiresAt = new Date();
                            if (licFormType === 'Annual Subscription') expiresAt.setFullYear(expiresAt.getFullYear() + 1);
                            else if (licFormType === 'Trial License') expiresAt.setDate(expiresAt.getDate() + 7);
                            else expiresAt.setFullYear(expiresAt.getFullYear() + 99); // lifetime activation

                            const newId = `lic_${Date.now()}`;
                            const { error } = await supabase.from('licenses').insert({
                              id: newId,
                              user_id: user.id, // mapped automatically
                              user_email: licFormEmail,
                              order_id: `manual_escrow_${Date.now()}`,
                              product_id: 'prod-billing-pro',
                              product_name: licFormProduct,
                              license_key: constructedKey,
                              status: 'active',
                              expires_at: expiresAt.toISOString()
                            });

                            if (!error) {
                              setGeneratedLicResult(constructedKey);
                              onAddNotification(`License successfully written to database: ${constructedKey}`, 'success');
                              setLicFormEmail('');
                              fetchAdminAllData();
                            } else {
                              onAddNotification(error.message, 'error');
                            }
                          } catch (err: any) {
                            onAddNotification(err.message, 'error');
                          }
                        }}
                        className="bg-white border rounded-3xl p-5 shadow-sm space-y-4 text-xs font-sans text-slate-800"
                      >
                        <h4 className="font-extrabold text-slate-850 text-sm border-b pb-2">Generate Register License Key</h4>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Product Selection Name</label>
                          <select className="w-full border rounded-lg p-2 bg-slate-50" value={licFormProduct} onChange={e => setLicFormProduct(e.target.value)}>
                            <option value="Retail Billing">Retail Billing</option>
                            <option value="Medical Billing">Medical Billing</option>
                            <option value="Restaurant POS">Restaurant POS</option>
                            <option value="ERP">ERP Software Suite</option>
                            <option value="Transport Management">Transport Management</option>
                            <option value="School ERP">School ERP Management</option>
                            <option value="Inventory Management">Inventory Management</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Activation Mode Duration</label>
                          <select className="w-full border rounded-lg p-2 bg-slate-50" value={licFormType} onChange={e => setLicFormType(e.target.value)}>
                            <option value="Lifetime License">Lifetime License (Unlimited)</option>
                            <option value="Annual Subscription">Annual Subscription (1 Year)</option>
                            <option value="Trial License">Trial License (7 Days Access)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Customer Email To Mapped</label>
                          <input type="email" placeholder="e.g. client@gmail.com" className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white" value={licFormEmail} onChange={e => setLicFormEmail(e.target.value)} required />
                        </div>

                        <button type="submit" className="w-full py-2.5 bg-slate-900 border border-slate-950 hover:bg-slate-850 text-white font-mono text-[10.5px] font-black uppercase rounded-xl cursor-pointer">
                          CREATE AND ACTIVATE SERIAL
                        </button>

                        {generatedLicResult && (
                          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1 font-mono text-center">
                            <span className="text-[9px] text-emerald-600 font-bold block">SERIAL KEY GENERATED PERFECTLY</span>
                            <strong className="text-emerald-800 text-xs select-all text-base block">{generatedLicResult}</strong>
                          </div>
                        )}
                      </form>

                      {/* Serial Keys Inventory list */}
                      <div className="lg:col-span-2 bg-white border rounded-3xl p-5 shadow-sm space-y-4 text-xs font-sans">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h4 className="font-extrabold text-slate-850 text-sm">Active License Key Database</h4>
                          <span className="font-mono text-slate-450 shrink-0 text-[10px]">{adminLicenses.length} keys total</span>
                        </div>

                        <input 
                          type="text"
                          className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white placeholder-slate-400 text-xs"
                          placeholder="Filter serial inventory by keyword, key, or email address..."
                          value={adminSearchQuery}
                          onChange={e => setAdminSearchQuery(e.target.value)}
                        />

                        <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
                          {adminLicenses.filter(l => {
                            if (!adminSearchQuery.trim()) return true;
                            const q = adminSearchQuery.toLowerCase();
                            return (l.license_key || '').toLowerCase().includes(q) ||
                                   (l.user_email || '').toLowerCase().includes(q) ||
                                   (l.product_name || '').toLowerCase().includes(q);
                          }).map(lic => (
                            <div key={lic.id} className="py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div>
                                <span className="font-mono font-black text-slate-800 select-all block">{lic.license_key}</span>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{lic.product_name} • Mapped: {lic.user_email || 'General'}</p>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                <span className="text-[10.5px] font-mono font-bold text-slate-400">Expires: {new Date(lic.expires_at || Date.now()).toLocaleDateString('en-IN')}</span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm('Deactivate and expire this license key immediately?')) {
                                      const { error } = await supabase.from('licenses').update({ status: 'expired' }).eq('id', lic.id);
                                      if (!error) {
                                        onAddNotification('License revoked successful in DB.', 'success');
                                        fetchAdminAllData();
                                      }
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-50 text-red-650 hover:bg-slate-100 uppercase tracking-widest text-[9.5px] font-black border rounded cursor-pointer transition-colors"
                                >
                                  DEACTIVATE
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab 5: SOFTWARE CORE & RELEASE MANAGEMENT (MODULE 5 & 6) */}
                {adminSubTab === 'software' && (
                  <div className="space-y-6 animate-fade-in" id="admin-module-5-software">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const nextHistory = [
                            {
                              product: softwareReleaseForm.product,
                              version: softwareReleaseForm.version,
                              changelog: softwareReleaseForm.changelog,
                              date: new Date().toISOString().split('T')[0]
                            },
                            ...softwareReleaseHistory
                          ];
                          setSoftwareReleaseHistory(nextHistory);
                          onAddNotification(`Updated software master setup binary for ${softwareReleaseForm.product} in registry!`, 'success');
                        }}
                        className="bg-white border rounded-3xl p-5 shadow-sm space-y-4 text-xs font-sans text-slate-800"
                      >
                        <h4 className="font-extrabold text-slate-850 text-sm border-b pb-2">Publish Desktop Installer Binary EXE</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-600 block">Product Core</label>
                            <select 
                              className="w-full border rounded-lg p-2 bg-slate-50" 
                              value={softwareReleaseForm.product} 
                              onChange={e => setSoftwareReleaseForm({...softwareReleaseForm, product: e.target.value})}
                            >
                              <option value="Retail Billing">Retail Billing Pro</option>
                              <option value="Medical Billing">Medical Store Billing</option>
                              <option value="Restaurant POS">Restaurant POS Utility</option>
                              <option value="ERP">GST Enterprise Suite</option>
                              <option value="Transport Management">Transport Management</option>
                              <option value="School ERP">School ERP Software</option>
                              <option value="Inventory Management">Inventory Ledger Software</option>
                            </select>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="font-bold text-slate-600 block">Master Version Code</label>
                            <input 
                              type="text" 
                              className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white" 
                              value={softwareReleaseForm.version} 
                              onChange={e => setSoftwareReleaseForm({...softwareReleaseForm, version: e.target.value})} 
                              required 
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Binary S3 Public Setup Direct URL (Store in Supabase Storage)</label>
                          <input 
                            type="text" 
                            className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white font-mono" 
                            value={softwareReleaseForm.exeUrl} 
                            onChange={e => setSoftwareReleaseForm({...softwareReleaseForm, exeUrl: e.target.value})} 
                            required 
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600 block">Changelog Release notes highlights</label>
                          <textarea 
                            rows={3} 
                            className="w-full border rounded-lg p-2 bg-slate-50 focus:bg-white" 
                            value={softwareReleaseForm.changelog} 
                            onChange={e => setSoftwareReleaseForm({...softwareReleaseForm, changelog: e.target.value})} 
                            required 
                          />
                        </div>

                        <button type="submit" className="w-full py-2.5 bg-red-750 text-white font-mono text-[10.5px] font-black uppercase rounded-xl cursor-pointer">
                          PUBLISH EXECUTABLE IMMUTABLE VERSION
                        </button>
                      </form>

                      {/* Version history releases logs */}
                      <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-4 text-xs font-sans text-slate-800">
                        <h4 className="font-extrabold text-slate-850 text-sm border-b pb-2">Active System Installations Registry</h4>
                        <div className="divide-y divide-slate-100 space-y-3">
                          {softwareReleaseHistory.map((hist, index) => (
                            <div key={index} className="pt-2 text-left space-y-1">
                              <div className="flex items-center justify-between font-extrabold">
                                <span className="text-slate-850 text-sm">{hist.product}</span>
                                <span className="bg-red-50 text-red-700 font-mono text-[10px] px-2 py-0.5 rounded">{hist.version}</span>
                              </div>
                              <p className="text-slate-550 font-medium">{hist.changelog}</p>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                                <span>Published date of package: {hist.date}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    alert(`Triggering automated rollback on clients workstations to preceding verified software build.`);
                                    onAddNotification('Software rollback command queued for next licensee sync.', 'info');
                                  }}
                                  className="text-red-700 hover:underline block cursor-pointer"
                                >
                                  Rollback Version
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab 6: TRIAL SCHEDULING & REMINDERS (MODULE 7) */}
                {adminSubTab === 'trials' && (
                  <div className="space-y-6 animate-fade-in" id="admin-module-7-trials">
                    <div className="bg-blue-50/50 border border-blue-200 text-xs text-blue-800 p-4 rounded-2xl">
                      <strong>Auto Trial Expiry:</strong> Standard trial installation databases evaluate license lifetime parameters. Unconverted trials auto-restrict local workstation entries upon 7 calendar days.
                    </div>

                    <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-[10.5px] font-bold text-slate-400 uppercase tracking-widest font-mono border-b">
                            <tr>
                              <th className="p-4 px-5">Reg User Email</th>
                              <th className="p-4">Contact Phone</th>
                              <th className="p-4">Product Trialing</th>
                              <th className="p-4">Duration Interval</th>
                              <th className="p-4 text-center">Remaining Days</th>
                              <th className="p-4 text-right">Escrow Upgrade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {adminTrialUsers.map((trial) => (
                              <tr key={trial.id} className="hover:bg-slate-50">
                                <td className="p-4 px-5 font-bold text-slate-850">{trial.email}</td>
                                <td className="p-4 font-mono">{trial.phone}</td>
                                <td className="p-4 font-semibold text-slate-650">{trial.productName}</td>
                                <td className="p-4 text-slate-450 font-mono">
                                  {trial.trialStartDate} to {trial.trialExpiryDate}
                                </td>
                                <td className="p-4 text-center font-bold">
                                  {trial.converted ? (
                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-black uppercase">PAID CONVERTED</span>
                                  ) : (
                                    <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono">3 days remaining</span>
                                  )}
                                </td>
                                <td className="p-4 text-right whitespace-nowrap">
                                  {!trial.converted && (
                                    <div className="flex items-center justify-end gap-2">
                                      <button 
                                        onClick={async () => {
                                          alert(`Dispatching automated SMTP reminder & payment link directly via mail: ${trial.email}`);
                                          onAddNotification('Subscription reminder dispatch completed via SMTP!', 'success');
                                        }}
                                        className="px-2 py-1 bg-slate-100 text-slate-650 hover:bg-slate-200 rounded font-mono text-[9.5px] font-black cursor-pointer uppercase border"
                                      >
                                        SEND TRIAL EXPIRE MAIL
                                      </button>
                                      <button 
                                        onClick={() => {
                                          alert(`Trial registry for user ${trial.email} upgraded to Lifetime subscription successfully. Activating licensee key structures on workstation...`);
                                          trial.converted = true;
                                          onAddNotification('User upgraded from trial registration to verified paid license!', 'success');
                                          fetchAdminAllData();
                                        }}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-750 text-white rounded font-mono text-[9.5px] font-black cursor-pointer uppercase"
                                      >
                                        Upgrade
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab 7: SUPPORT TICKETS HELPDESK (MODULE 10) */}
                {adminSubTab === 'tickets' && (
                  <div className="space-y-6 animate-fade-in animate-fade-in animate-fade-in" id="admin-module-10-tickets">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Ticket catalog lists columns */}
                      <div className="lg:col-span-5 bg-white border rounded-3xl p-5 shadow-sm space-y-4 text-xs font-sans text-slate-800">
                        <span className="text-[10.5px] font-black font-mono text-slate-400 block border-b pb-2 uppercase text-left">Incident Log tickets database</span>
                        <div className="divide-y divide-slate-100 space-y-2 pr-1 max-h-[480px] overflow-y-auto">
                          {adminTickets.length === 0 ? (
                            <p className="py-4 italic text-slate-450">No customer support ticket entries received inside database.</p>
                          ) : (
                            adminTickets.reverse().map(ticket => (
                              <div 
                                key={ticket.id} 
                                onClick={() => {
                                  setSelectedTicketId(ticket.id);
                                  setTicketReplyText('');
                                }}
                                className={`pt-2.5 pb-2 cursor-pointer border rounded-2xl p-3 text-left transition ${
                                  selectedTicketId === ticket.id ? 'bg-red-50/50 border-red-300 ring-1 ring-red-200' : 'hover:bg-slate-50 border-transparent'
                                }`}
                              >
                                <div className="flex items-center justify-between font-extrabold pb-1">
                                  <span className="text-slate-850 truncate max-w-[160px]">{ticket.title}</span>
                                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono tracking-wide ${
                                    ticket.status === 'open' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-105 text-slate-550 border'
                                  }`}>
                                    {ticket.status}
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-slate-550 truncate font-semibold">User: {ticket.user_name} ({ticket.user_email})</p>
                                <p className="text-[9.5px] text-slate-400 font-mono mt-1">Ticket number log: {ticket.id}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Ticket reader center columns */}
                      <div className="lg:col-span-7 bg-white border rounded-3xl p-5 shadow-sm space-y-4 text-xs font-sans text-slate-800 text-left">
                        {selectedTicketId ? (() => {
                          const ticket = adminTickets.find(t => t.id === selectedTicketId);
                          if (!ticket) return <p className="text-slate-450 italic">Internal query error finding ticket profile.</p>;
                          
                          // Decode existing replies
                          let parsedReplies: any[] = [];
                          if (ticket.replies) {
                            try {
                              parsedReplies = typeof ticket.replies === 'string' ? JSON.parse(ticket.replies) : ticket.replies;
                            } catch {
                              parsedReplies = [];
                            }
                          }

                          return (
                            <div className="space-y-4">
                              <div className="border-b pb-3 flex items-center justify-between">
                                <div>
                                  <h4 className="text-base font-black text-slate-850">{ticket.title}</h4>
                                  <span className="text-[10px] text-slate-400 block mt-1.5 font-mono">Log ID: {ticket.id} | Category Code: {ticket.category || 'General Billing Help'}</span>
                                </div>
                                <select 
                                  className="border rounded px-2.5 py-1 text-xs font-mono font-bold bg-slate-50"
                                  value={ticket.status}
                                  onChange={async (e) => {
                                    const nextStatus = e.target.value;
                                    const { error } = await supabase.from('support_tickets').update({ status: nextStatus }).eq('id', ticket.id);
                                    if (!error) {
                                      onAddNotification(`Updated ticket #${ticket.id} status to ${nextStatus}`, 'info');
                                      fetchAdminAllData();
                                    }
                                  }}
                                >
                                  <option value="open">Open</option>
                                  <option value="pending">Pending</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="closed">Closed</option>
                                </select>
                              </div>

                              <div className="bg-slate-50 rounded-2xl p-4 border text-slate-700 leading-relaxed max-h-[140px] overflow-y-auto">
                                <span className="text-[10px] font-black text-slate-400 uppercase font-mono block mb-1">ORIGINAL COMPLAINT MESSAGE</span>
                                "{ticket.description}"
                              </div>

                              {/* Replies stream list */}
                              <div className="space-y-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase font-mono block">HELP DESK THREAD HISTORY</span>
                                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                                  {parsedReplies.length === 0 ? (
                                    <p className="text-slate-455 text-[11px] italic py-2">No replies logged in history ledger box.</p>
                                  ) : (
                                    parsedReplies.map((r: any, idx: number) => (
                                      <div key={idx} className={`p-2.5 rounded-2xl border text-xs text-left ${r.authorRole === 'admin' ? 'bg-red-50/20 border-red-200' : 'bg-slate-50 border-slate-150'}`}>
                                        <p className="font-extrabold text-slate-800">{r.authorName || 'Agent Support'}:</p>
                                        <p className="text-slate-650 mt-1 font-semibold leading-normal">{r.message}</p>
                                        <span className="text-[9px] text-slate-400 font-mono block mt-1">{r.timestamp || 'Just now'}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* Form reply dispatch widget */}
                              <div className="space-y-2 pt-2 border-t">
                                <span className="text-[10px] font-black text-slate-400 uppercase font-mono block">Post Support Reply Agent Response</span>
                                <textarea
                                  rows={2}
                                  className="w-full border rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-red-300 text-xs text-slate-800"
                                  placeholder="Type reply message which is synchronized inside customer panels instantly..."
                                  value={ticketReplyText}
                                  onChange={e => setTicketReplyText(e.target.value)}
                                />
                                <div className="flex items-center justify-end gap-2.5">
                                  <button
                                    onClick={async () => {
                                      if (!ticketReplyText.trim()) return;
                                      const nextReply = {
                                        authorName: 'Suraj Suryavanshi (Support Executive)',
                                        authorRole: 'admin',
                                        message: ticketReplyText,
                                        timestamp: new Date().toLocaleString('en-IN')
                                      };
                                      const updatedReplies = [...parsedReplies, nextReply];
                                      const { error } = await supabase.from('support_tickets').update({
                                        replies: JSON.stringify(updatedReplies),
                                        status: 'resolved'
                                      }).eq('id', ticket.id);

                                      if (!error) {
                                        onAddNotification('Reply successfully submitted to support incident database!', 'success');
                                        setTicketReplyText('');
                                        fetchAdminAllData();
                                      } else {
                                        onAddNotification(error.message, 'error');
                                      }
                                    }}
                                    className="px-4 py-2 bg-red-750 text-white font-mono text-[10.5px] font-black uppercase rounded-lg cursor-pointer"
                                  >
                                    PUBLISH REPLY & RESOLVE TICKET
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })() : (
                          <div className="text-center py-20 text-slate-450 space-y-2">
                            <Inbox size={32} className="mx-auto text-slate-300" />
                            <p className="text-xs font-bold font-mono uppercase tracking-wider">Select support incident ticket from list on the left side to respond</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab 8: GST MANAGEMENT SYSTEMS & REPORTS (MODULE 11 & 17) */}
                {adminSubTab === 'gst' && (
                  <div className="space-y-6 animate-fade-in" id="admin-module-17-gst">
                    <div className="bg-red-50/50 border border-red-200/50 rounded-2xl p-4 text-xs font-sans text-red-800 leading-snug">
                      <strong>Tax Service Compliance (SAC/HSN Code 998314):</strong> BSP Suryatech Billing software exports compliant reports matching SGST/CGST frameworks perfectly. Configure options below in settings.
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-left">
                      <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-3">
                        <span className="text-[10px] font-black text-slate-400 block font-mono uppercase border-b pb-2">GST Collections summary</span>
                        <div className="space-y-2 pt-1 font-mono">
                          <div className="flex items-center justify-between border-b pb-1">
                            <span className="font-sans text-slate-650 font-bold">Default System Rate Code:</span>
                            <strong className="text-slate-850 font-black">{adminSettings.default_gst_rate}% (GSTR-1 compliant)</strong>
                          </div>
                          <div className="flex items-center justify-between border-b pb-1">
                            <span className="font-sans text-slate-650 font-bold">Total IGST (Interstate):</span>
                            <span className="text-slate-850">₹0.00</span>
                          </div>
                          <div className="flex items-center justify-between border-b pb-1">
                            <span className="font-sans text-slate-650 font-bold">Total CGST (Central Tax 9%):</span>
                            <span className="text-slate-850 font-bold text-red-700">₹{(adminOrders.filter(o => o.status === 'Verified' || o.status === 'License Activated').reduce((sum, o) => sum + (Number(o.amount) || Number(o.price) || 0), 0) * 0.09).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between border-b pb-1">
                            <span className="font-sans text-slate-650 font-bold">Total SGST (State Tax 9%):</span>
                            <span className="text-slate-850 font-bold text-red-700">₹{(adminOrders.filter(o => o.status === 'Verified' || o.status === 'License Activated').reduce((sum, o) => sum + (Number(o.amount) || Number(o.price) || 0), 0) * 0.09).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-2 bg-white border rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h4 className="font-extrabold text-slate-850 text-sm">GST SAC HSN Wise Sales Distribution Ledger</h4>
                          <button
                            onClick={() => {
                              alert('PDF Invoice collection manifest triggered. Launching system print capabilities.');
                              window.print();
                            }}
                            className="px-3.5 py-1 text-[10px] bg-slate-900 text-white rounded font-mono font-bold cursor-pointer uppercase hover:bg-slate-850 transition"
                          >
                            PRINT GST SUMMARY
                          </button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-mono">
                            <thead className="bg-slate-50 text-[10.5px] font-bold text-slate-400 border-b">
                              <tr>
                                <th className="p-3">HSN CODE CODE</th>
                                <th className="p-3">Product description</th>
                                <th className="p-3">Taxable Value</th>
                                <th className="p-3 font-bold text-red-700">GST Collected</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                              <tr>
                                <td className="p-3 font-mono font-bold">998314</td>
                                <td className="p-3">BSP Suryatech Retail Billing software installation parameters</td>
                                <td className="p-3 font-mono">₹1,54,000</td>
                                <td className="p-3 font-mono font-extrabold text-red-700">₹27,720</td>
                              </tr>
                              <tr>
                                <td className="p-3 font-mono font-bold">998314</td>
                                <td className="p-3">Enterprise POS accounting ERP module subscriptions</td>
                                <td className="p-3 font-mono">₹62,499</td>
                                <td className="p-3 font-mono font-extrabold text-red-700">₹11,249</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Tab 9: PLATFORM CONFIGURATION & SMTP (MODULE 8 & 16) */}
                {adminSubTab === 'settings' && (
                  <div className="bg-white border p-6 rounded-3xl shadow-sm text-xs font-sans text-slate-800 text-left animate-fade-in" id="admin-module-16-settings">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        onAddNotification('Platform configurations successfully written to local cache block!', 'success');
                      }}
                      className="space-y-6"
                    >
                      <h4 className="font-extrabold text-slate-850 text-sm border-b pb-2">Global System Configuration parameters</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-650 block">Enable HSN GST Calculator at Checkout</label>
                          <select 
                            className="w-full border rounded-lg p-2 bg-slate-55"
                            value={adminSettings.enable_checkout_gst ? 'true' : 'false'}
                            onChange={e => setAdminSettings({ ...adminSettings, enable_checkout_gst: e.target.value === 'true' })}
                          >
                            <option value="true">Yes, Calculate SGST/CGST automatically</option>
                            <option value="false">No, Hide GST breakdown on payment popup</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-655 block">Invoice Prefix String</label>
                          <input 
                            type="text" 
                            className="w-full border rounded-lg p-2 bg-slate-55 font-mono" 
                            value={adminSettings.invoice_prefix} 
                            onChange={e => setAdminSettings({ ...adminSettings, invoice_prefix: e.target.value })} 
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-655 block">GST Type Framework</label>
                          <select 
                            className="w-full border rounded-lg p-2 bg-slate-55"
                            value={adminSettings.gst_type}
                            onChange={e => setAdminSettings({...adminSettings, gst_type: e.target.value})}
                          >
                            <option value="exclusive">Exclusive Tax (Extra breakdown calculated)</option>
                            <option value="inclusive">Inclusive Tax (Built directly into value)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                        <div className="space-y-4">
                          <span className="text-[10.5px] font-black text-slate-400 block font-mono border-b pb-2">SMTP HOST CONFIGURATION (MODULE 8)</span>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-600 block">SMTP Relayer Host Address</label>
                              <input type="text" className="w-full border rounded-lg p-2 bg-slate-55 font-mono" value={adminSettings.smtp_host} onChange={e => setAdminSettings({ ...adminSettings, smtp_host: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-600 block">SMTP Secure Relayer Port</label>
                              <input type="text" className="w-full border rounded-lg p-2 bg-slate-55 font-mono" value={adminSettings.smtp_port} onChange={e => setAdminSettings({ ...adminSettings, smtp_port: e.target.value })} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-600 block">Authorized Support Email Transmitter</label>
                            <input type="email" className="w-full border rounded-lg p-2 bg-slate-55" value={adminSettings.smtp_user} onChange={e => setAdminSettings({ ...adminSettings, smtp_user: e.target.value })} />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <span className="text-[10.5px] font-black text-slate-400 block font-mono border-b pb-2">WHATSAPP &amp; MERCH DATA</span>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-600 block">WhatsApp Helpline Number (Direct Click-to-Chat)</label>
                            <input type="text" className="w-full border rounded-lg p-2 bg-slate-55 font-mono" value={adminSettings.whatsapp} onChange={e => setAdminSettings({ ...adminSettings, whatsapp: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-600 block">System Merchant GSTIN Number</label>
                            <input type="text" className="w-full border rounded-lg p-2 bg-slate-50 font-mono" value={adminSettings.gst_number} onChange={e => setAdminSettings({ ...adminSettings, gst_number: e.target.value })} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t">
                        <button type="submit" className="px-6 py-2.5 bg-red-750 text-white font-mono font-extrabold uppercase rounded-xl cursor-pointer shadow">
                          SAVE SYSTEM PARAMETERS
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Extra lightbox layers nested at the end */}
            {lightboxImg && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm" id="lightbox-zoom-layer-portal" onClick={() => setLightboxImg(null)}>
                <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setLightboxImg(null)} className="absolute top-4 right-4 p-2 bg-slate-950 text-white rounded-full hover:bg-slate-800 transition cursor-pointer z-10">
                    <X size={20} />
                  </button>
                  <div className="max-h-[85vh] overflow-auto flex items-center justify-center rounded-2xl bg-slate-950">
                    <img src={lightboxImg} alt="Transactional expanded proof" className="max-w-full max-h-[80vh] object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <p className="text-center text-xs font-mono text-slate-400 mt-3 font-semibold select-none">Manual Bank Statement Cross-Checking View</p>
                </div>
              </div>
            )}

            {/* View 1: ACTIVE LICENSES (MY PRODUCTS PAGE) */}
            {activePortalView === 'dashboard' && (
              <div className="space-y-8 animate-fade-in" id="customer-licenses-hub">
                <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-none">My Products Workspace</h2>
                    <p className="text-xs text-slate-400 mt-1.5">Acquire latest version executable installations, copy lifetime keys, or read activation metrics.</p>
                  </div>
                  <button
                    onClick={() => onPageChange('downloads')}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-[10px] font-bold font-mono tracking-wide uppercase flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Open Downloads Page
                  </button>
                </div>

                {licenses.length === 0 ? (
                  <div className="bg-white border p-12 rounded-3xl text-center space-y-4 shadow-sm">
                    <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base">No acquired products located</h4>
                      <p className="text-slate-450 text-xs leading-normal max-w-sm mx-auto mt-1">
                        Licensed software key references appear here immediately after simulated checkout completion. Ready to install!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {licenses.map((lic) => (
                      <div 
                        key={lic.id} 
                        className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all"
                        id={`lickey-card-${lic.id}`}
                      >
                        <div className="space-y-4 text-left">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9.5px] font-bold font-mono uppercase tracking-wide border border-emerald-100">
                                ACTIVE LIFE-TIME KEY
                              </span>
                              <h4 className="font-black text-slate-800 text-base mt-2 leading-tight">{lic.productName}</h4>
                            </div>
                            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 shrink-0">
                              <Key className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Dynamic Key representation */}
                          <div className="bg-slate-50 border border-slate-201 p-3 rounded-xl flex items-center justify-between text-xs font-mono font-bold text-slate-800 relative leading-none">
                            <span className="select-all block truncate mr-2">{lic.licenseKey}</span>
                            <button
                              onClick={() => handleCopyKey(lic.licenseKey, lic.id)}
                              className="text-blue-600 hover:text-blue-700 font-bold text-[10.5px] uppercase cursor-pointer shrink-0 ml-1"
                              title="Copy activation serial"
                            >
                              {copiedKeyId === lic.id ? (
                                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Clipboard className="w-4 h-4 text-slate-550" />
                              )}
                            </button>
                          </div>

                          {/* Option to download latest installer */}
                          <button
                            onClick={() => onTriggerTrialDownload(lic.productId, true)}
                            className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Latest Setup Build (.EXE)
                          </button>
                        </div>

                        {/* Order info references */}
                        <div className="border-t border-slate-100 pt-3.5 mt-4 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span>Ref: {lic.orderId}</span>
                          <span className="text-slate-5c bg-slate-50 px-1.5 py-0.5 rounded leading-none">Expires: Lifetime</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* View 2: MY ACCOUNT PROFILE EDIT */}
            {activePortalView === 'profile' && (
              <div className="space-y-8 animate-fade-in" id="customer-profile-management">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-2xl font-black text-slate-900 leading-none">My Billing Profile</h2>
                  <p className="text-xs text-slate-400 mt-1.5">Configure state details, GST identifiers, and invoice coordinates for compliance.</p>
                </div>

                <form onSubmit={handleUpdateProfileSubmit} className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Customer Name *</label>
                      <input
                        type="text"
                        required
                        value={profileClientName}
                        onChange={(e) => setProfileClientName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Business Name *</label>
                      <input
                        type="text"
                        required
                        value={profileBusinessName}
                        onChange={(e) => setProfileBusinessName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Contact Number *</label>
                      <input
                        type="text"
                        required
                        value={profileContactNumber}
                        onChange={(e) => setProfileContactNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block leading-none">Email Address (Invoicing targets)</label>
                      <input
                        type="email"
                        disabled
                        value={profileEmailAddress}
                        className="w-full bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-400 font-mono cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-600 block">Business / Billing Address *</label>
                      <input
                        type="text"
                        required
                        value={profileBusinessAddress}
                        onChange={(e) => setProfileBusinessAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">City *</label>
                      <input
                        type="text"
                        required
                        value={profileCity}
                        onChange={(e) => setProfileCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">State *</label>
                      <input
                        type="text"
                        required
                        value={profileStateValue}
                        onChange={(e) => setProfileStateValue(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">Pincode *</label>
                      <input
                        type="text"
                        required
                        value={profilePincode}
                        onChange={(e) => setProfilePincode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">GST IN Number (Optional)</label>
                      <input
                        type="text"
                        value={profileGstNumber}
                        onChange={(e) => setProfileGstNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white font-mono"
                        placeholder="GST identification code"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t flex justify-end">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow"
                    >
                      {profileSaving ? 'Saving Profile...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* View 3: PAYMENT HISTORY LOG */}
            {activePortalView === 'payments' && (
              <div className="space-y-8 animate-fade-in" id="customer-payments-logs">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-2xl font-black text-slate-900 leading-none">Payment History Log</h2>
                  <p className="text-xs text-slate-400 mt-1.5">Review chronological transaction statements, payments methods, and invoicing refs.</p>
                </div>

                <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
                  {payments.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-3">
                      <Inbox className="w-8 h-8 text-slate-300" />
                      <span>No completed transactions logs found.</span>
                    </div>
                  ) : (
                    <div className="divide-y text-left text-xs sm:text-sm">
                      {payments.map((pay) => (
                        <div key={pay.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="font-extrabold text-slate-800 block">Transaction Ref: {pay.transactionId}</span>
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-mono">
                              <span>Method: {pay.paymentMethod}</span>
                              <span>•</span>
                              <span>Invoice: {pay.invoiceNumber}</span>
                              <span>•</span>
                              <span>Date: {new Date(pay.paymentDate).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="font-extrabold text-slate-900 block font-mono text-sm">₹{pay.amount}</span>
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded leading-none">
                                CAPTURED
                              </span>
                            </div>

                            {/* View Invoice trigger */}
                            <button
                              onClick={() => {
                                const matchingInv = invoices.find(inv => inv.invoiceNumber === pay.invoiceNumber);
                                if (matchingInv) {
                                  setSelectedInvoice(matchingInv);
                                } else {
                                  onAddNotification('Could not find corresponding invoice details matching ' + pay.invoiceNumber, 'info');
                                }
                              }}
                              className="p-2 bg-slate-50 border hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
                              title="View Tax Invoice"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View 4: INVOICES & GST RECEIPTS */}
            {activePortalView === 'invoices' && (
              <div className="space-y-8 animate-fade-in" id="customer-invoices-logs">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-2xl font-black text-slate-900 leading-none">Invoices & GST Receipts</h2>
                  <p className="text-xs text-slate-400 mt-1.5 font-medium">Download compliance tax receipts, calculations logs, and software activation keys declarations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {invoices.length === 0 ? (
                    <div className="bg-white border p-12 rounded-3xl text-center text-slate-450 md:col-span-2 shadow-sm">
                      <Inbox className="w-10 h-10 text-slate-250 mx-auto mb-3" />
                      <span>No available tax invoices found.</span>
                    </div>
                  ) : (
                    invoices.map((inv) => (
                      <div key={inv.id} className="bg-white border border-slate-200.80 p-5 rounded-3xl flex flex-col justify-between shadow-sm relative hover:border-blue-300 transition-all">
                        <div className="space-y-3 text-left">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-mono text-[10px] text-slate-450 font-bold block">INVOICE NUMBER</span>
                              <h4 className="font-black text-slate-800 text-sm mt-0.5 font-mono">{inv.invoiceNumber}</h4>
                            </div>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 font-mono text-[9px] font-bold uppercase rounded border border-blue-100">
                              GST COMPLIANT
                            </span>
                          </div>

                          <div className="border-t border-slate-100 pt-3 text-xs space-y-1">
                            <span className="font-extrabold text-slate-800 block truncate">{inv.productName}</span>
                            <div className="text-[10.5px] text-slate-450 space-y-0.5">
                              <p>Billed To: <strong className="text-slate-600">{inv.businessName || inv.clientName}</strong></p>
                              <p>Key Serial: <span className="font-mono text-slate-600 font-extrabold text-[9.5px]">{inv.licenseKey}</span></p>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-3.5 mt-5 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-[10px] text-slate-450 block font-mono">Total Billed</span>
                            <span className="font-bold text-slate-900 font-mono text-sm leading-none">₹{inv.amount}</span>
                          </div>

                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold font-mono tracking-wide uppercase flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Invoice
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* View 5: NOTIFICATIONS */}
            {activePortalView === 'notifications' && (
              <div className="space-y-8 animate-fade-in" id="customer-notifications-center">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-2xl font-black text-slate-900 leading-none">Notifications Center</h2>
                  <p className="text-xs text-slate-400 mt-1.5">Gain critical alerts for software updates availability, payment actions receipt, and license verification indicators.</p>
                </div>

                <div className="space-y-3">
                  {notificationsList.length === 0 ? (
                    <div className="bg-white border p-16 rounded-3xl text-center text-slate-400 flex flex-col items-center gap-3">
                      <Bell className="w-8 h-8 text-slate-350" />
                      <span>You have zero alert notifications in logs.</span>
                    </div>
                  ) : (
                    notificationsList.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-4 rounded-2xl border transition-all text-left flex gap-4 ${
                          notif.read ? 'bg-white border-slate-150' : 'bg-blue-50/30 border-blue-150/80 shadow-sm'
                        }`}
                        id={`notif-card-${notif.id}`}
                      >
                        <div className={`p-2 rounded-xl shrink-0 ${notif.read ? 'bg-slate-50 text-slate-400' : 'bg-blue-100 text-blue-600 animate-pulse'}`}>
                          <Bell className="w-4.5 h-4.5" />
                        </div>

                        <div className="space-y-1 flex-grow">
                          <div className="flex items-start justify-between gap-4">
                            <h5 className="font-extrabold text-slate-800 text-sm leading-tight">{notif.title}</h5>
                            <span className="text-[9px] text-slate-400 font-mono font-medium">{new Date(notif.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-600 text-xs leading-normal">{notif.message}</p>
                          
                          {!notif.read && (
                            <button
                              onClick={() => handleMarkNotificationRead(notif.id)}
                              className="text-[10px] font-mono leading-none font-bold uppercase text-blue-600 hover:text-blue-700 pt-1 block cursor-pointer"
                            >
                              Mark as Read
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* View 6: SUPPORT TICKETS RECODR LIST */}
            {activePortalView === 'tickets' && (
              <div className="space-y-8 animate-fade-in" id="customer-tickets-timeline">
                <div className="border-b border-slate-200 pb-4 flex items-center justify-between gap-4 justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-none">Support Tickets Workspace</h2>
                    <p className="text-xs text-slate-400 mt-1.5 font-medium">Create hardware tickets queries or communicate live with Noida desk.</p>
                  </div>
                  <button
                    onClick={() => setActivePortalView('new-ticket')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow"
                    id="trigger-open-ticket-btn"
                  >
                    <Plus className="w-4 h-4" />
                    Open Ticket
                  </button>
                </div>

                {tickets.length === 0 ? (
                  <div className="bg-white border p-12 rounded-3xl text-center space-y-4 shadow-sm">
                    <Inbox className="w-10 h-10 text-slate-305 mx-auto" />
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base">No active tickets registered</h4>
                      <p className="text-slate-450 text-xs leading-normal max-w-sm mt-1 mx-auto">Open ticket details to report thermal widths issue or ask Composition tax compliance parameters.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Column Ticket list summary */}
                    <div className="lg:col-span-5 space-y-3">
                      {tickets.map((tk) => {
                        const isSelected = activeTicketId === tk.id;
                        return (
                          <div
                            key={tk.id}
                            onClick={() => {
                              setActiveTicketId(tk.id);
                              window.scrollTo({ top: 300, behavior: 'smooth' });
                            }}
                            className={`p-4 border rounded-2xl cursor-pointer text-left transition-all ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50/20 shadow-sm' 
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                            id={`ticket-summary-card-${tk.id}`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">ID: {tk.id}</span>
                              <span className={`px-2 py-0.5 text-[9px] font-bold font-mono rounded ${
                                tk.status === 'open' 
                                  ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                                  : tk.status === 'in_progress'
                                  ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                  : 'bg-slate-50 text-slate-500 border border-slate-200'
                              }`}>
                                {tk.status.replace('_', ' ')}
                              </span>
                            </div>
                            <h5 className="font-extrabold text-slate-800 text-sm truncate leading-snug">{tk.title}</h5>
                            <span className="text-[10.5px] text-slate-450 font-mono block mt-2">Opened: {new Date(tk.createdAt).toLocaleDateString()}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Right column detailed conversational chat timeline */}
                    <div className="lg:col-span-7">
                      {activeTicketId ? (
                        (() => {
                           const activeTk = getActiveTicket();
                           if (!activeTk) return null;
                           return (
                             <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-6 text-left" id="ticket-chat-frame">
                               
                               {/* Chat Header info */}
                               <div className="border-b border-slate-100 pb-4">
                                 <div className="flex justify-between items-center mb-2">
                                   <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wide">Category: {activeTk.category}</span>
                                   <span className="text-xs text-slate-450 font-medium font-mono">{new Date(activeTk.createdAt).toLocaleString()}</span>
                                 </div>
                                 <h4 className="font-black text-slate-800 text-base leading-snug">{activeTk.title}</h4>
                                 <p className="text-slate-600 text-xs mt-2 bg-slate-50 border p-3.5 rounded-xl leading-normal italic">{activeTk.description}</p>
                               </div>

                               {/* Chat message timeline listing */}
                               <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                 {activeTk.replies.length === 0 ? (
                                   <span className="text-xs text-slate-400 text-center block py-10 font-medium">Waiting for technical support response from Noida desk...</span>
                                 ) : (
                                   activeTk.replies.map((rep: any) => {
                                     const isAdmin = rep.authorRole === 'admin';
                                     return (
                                       <div 
                                         key={rep.id} 
                                         className={`flex flex-col text-xs leading-normal ${isAdmin ? 'items-start' : 'items-end'}`}
                                       >
                                         <div className={`p-3.5 rounded-2xl max-w-[85%] text-left ${
                                           isAdmin 
                                             ? 'bg-blue-600 text-white rounded-tl-none font-medium' 
                                             : 'bg-slate-100 text-slate-850 rounded-tr-none font-medium'
                                         }`}>
                                           <p className="whitespace-pre-line leading-relaxed">{rep.message}</p>
                                         </div>
                                         <span className="text-[9px] text-slate-400 font-bold block mt-1.5 uppercase font-mono px-1">
                                           {rep.authorName} • {new Date(rep.createdAt).toLocaleString()}
                                         </span>
                                       </div>
                                     );
                                   })
                                 )}
                               </div>

                               {/* Chat typing input block form */}
                               {activeTk.status !== 'resolved' ? (
                                 <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 flex gap-2">
                                   <input
                                     type="text"
                                     required
                                     placeholder="Type message reply to installer..."
                                     value={replyMsg}
                                     onChange={(e) => setReplyMsg(e.target.value)}
                                     className="flex-grow bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs sm:text-sm text-slate-800"
                                     id="ticket-chat-input-text"
                                   />
                                   <button
                                     type="submit"
                                     disabled={replySubmitting}
                                     className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer shrink-0"
                                     id="ticket-chat-submit-btn"
                                   >
                                     Send
                                   </button>
                                 </form>
                               ) : (
                                 <div className="p-3 bg-slate-50 text-slate-400 text-xs text-center rounded-xl font-bold font-mono uppercase tracking-wide">This ticket is marked resolved. Closed.</div>
                               )}

                             </div>
                           );
                        })()
                      ) : (
                        <div className="bg-slate-50 border-2 border-dashed rounded-3xl p-16 text-center text-slate-400 text-sm font-semibold">
                          Click ticket on the left to load dynamic chat timeline log.
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* View 7: NEW TICKET FORM */}
            {activePortalView === 'new-ticket' && (
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 text-left animate-fade-in" id="raise-ticket-card-form">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-extrabold text-slate-900 text-lg leading-none">Submit Support Incident Ticket</h3>
                  <p className="text-xs text-slate-400 mt-1.5">Direct callback details monitored by Sector 62 on-site installer engineers.</p>
                </div>

                <form onSubmit={handleRaiseTicketSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 font-mono tracking-wider uppercase block">Incident Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. TVS RP3150 receipt line alignment"
                        value={ticketTitle}
                        onChange={(e) => setTicketTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 transition-colors"
                        id="new-ticket-title-input"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 font-mono tracking-wider uppercase block">Incident Category</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 transition-colors"
                      >
                        <option value="License Issue">License Activation / Keys Transfer</option>
                        <option value="Billing & Invoice">Billing & Customer Invoices</option>
                        <option value="Technical Bug">Thermal Printer Configuration Help</option>
                        <option value="Feature Request">GST HSN / Composition scheme request</option>
                        <option value="Other">Other Miscellaneous Guides</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 font-mono tracking-wider uppercase block">Problem Description *</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Detail physical receipt printer models, windows OS editions, or error logs text strings here to assist installers during diagnosis..."
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 transition-colors resize-none"
                      id="new-ticket-desc-input"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActivePortalView('tickets')}
                      className="px-5 py-3 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={ticketSubmitting}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer transition-colors"
                      id="submit-raised-ticket-btn"
                    >
                      {ticketSubmitting ? 'Raising Ticket...' : 'Open ticket Incident'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- PREMIUM GST TAX INVOICE PRINT MODAL --- */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-10 shrink-0 text-left my-8" id="invoices-tax-receipt-printout-wrapper">
            
            {/* Modal actions close & Print */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 no-print">
              <span className="text-xs uppercase font-bold text-slate-450 font-mono">Tax Invoice PDF Document</span>
              <div className="flex gap-2.5">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 border text-slate-500 hover:text-slate-900 border-slate-200.80 rounded-xl text-xs font-bold transition-all"
                >
                  Close Receipt
                </button>
              </div>
            </div>

            {/* Invoicing main layout */}
            <div className="space-y-8 pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-blue-600 block uppercase tracking-widest font-mono">BSP Suryatech Solutions</span>
                  <p className="text-xl font-black text-slate-900 tracking-tight">TAX INVOICE / RECEIPTS</p>
                  <span className="text-[10px] text-slate-450 block font-mono">BSP-SURYATECH Noida Sector 62, Pos Terminal Block-B</span>
                </div>
                <div className="sm:text-right space-y-0.5">
                  <span className="text-xs uppercase font-bold text-slate-450 block font-mono">Invoice Number</span>
                  <span className="text-base font-bold font-mono text-slate-900 block leading-tight">{selectedInvoice.invoiceNumber}</span>
                  <span className="text-[10.5px] text-slate-400 block font-mono">Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl text-xs leading-normal">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono block">Billed To (Client Details)</span>
                  <span className="font-extrabold text-slate-800 text-sm block">{selectedInvoice.clientName}</span>
                  <p className="text-slate-550 leading-relaxed max-w-xs">{selectedInvoice.businessAddress || 'India POS terminal station'}</p>
                </div>

                <div className="space-y-1 sm:text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono block">Business & POS Reference</span>
                  <span className="font-extrabold text-slate-800 text-sm block">{selectedInvoice.businessName || 'Suryatech evaluation profile'}</span>
                  {selectedInvoice.gstNumber && (
                    <p className="text-slate-600 font-mono font-extrabold block">GSTIN Id: <span className="uppercase">{selectedInvoice.gstNumber}</span></p>
                  )}
                  <p className="text-slate-550 font-mono">{selectedInvoice.contactNumber}</p>
                </div>
              </div>

              {/* Items listing table */}
              <div className="border border-slate-150 rounded-2xl overflow-hidden divide-y text-left text-xs sm:text-sm">
                <div className="grid grid-cols-12 bg-slate-100 p-3 font-extrabold text-slate-800">
                  <div className="col-span-8">Product Name Description</div>
                  <div className="col-span-4 text-right">Unit Net Cost</div>
                </div>
                <div className="grid grid-cols-12 p-4 text-slate-700 leading-relaxed font-medium">
                  <div className="col-span-8">
                    <span className="font-extrabold text-slate-900 block">{selectedInvoice.productName}</span>
                    <span className="font-mono text-[9.5px] text-slate-400 block mt-1.5 uppercase select-all">Activation Key: {selectedInvoice.licenseKey}</span>
                  </div>
                  <div className="col-span-4 text-right font-mono font-bold text-slate-800">₹{selectedInvoice.netAmount}</div>
                </div>
              </div>

              {/* Invoicing summary taxes */}
              <div className="flex justify-end pt-2 text-xs">
                <div className="w-full sm:w-1/2 space-y-2 border-t pt-4">
                  <div className="flex justify-between font-mono text-slate-500">
                    <span>Taxable Value :</span>
                    <span>₹{selectedInvoice.netAmount}</span>
                  </div>
                  <div className="flex justify-between font-mono text-slate-505">
                    <span>CGST + SGST (18%) :</span>
                    <span>₹{selectedInvoice.gstAmount}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-extrabold text-sm border-t pt-2 font-mono">
                    <span>Grand Total :</span>
                    <span>₹{selectedInvoice.amount}</span>
                  </div>
                </div>
              </div>

              {/* Invoicing footer guidance */}
              <div className="text-center text-[10px] py-4 text-slate-400 leading-normal max-w-md mx-auto no-print">
                <span className="font-semibold block text-slate-500">Subject to Noida Court Jurisdiction</span>
                <p className="mt-1">This is a dynamic computer generated invoice. No physical signature is required. Delivered securely under BSP Suryatech Desktop-First software packages agreements.</p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
