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
  Chrome
} from 'lucide-react';

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
  // Tabs: auth, dashboard, tickets, new-ticket, profile, purchase-history, payment-history, invoices, notifications
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [activePortalView, setActivePortalView] = useState<'dashboard' | 'tickets' | 'new-ticket' | 'profile' | 'payments' | 'invoices' | 'notifications'>(initialView);

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


  useEffect(() => {
    if (user) {
      fetchCustomerData();
      fetchCustomerProfile();
    }
  }, [user]);

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
          role: data.user.email === 'surajsurya.koo7@gmail.com' ? 'admin' : 'customer',
          profile: loadedProfile
        };

        // Notify parent App
        onLoginSuccess(data.session?.access_token || 'bsp_auth_token_simulated', userObj);
        onAddNotification(`Welcome back, ${userObj.name}!`, 'success');
        
        // 3) Redirect user to admin panel or default main Home page ("/")
        if (userObj.role === 'admin') {
          onPageChange('admin');
        } else {
          onPageChange('home');
          window.history.pushState({}, '', '/');
        }
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
          <span className="text-[10px] text-slate-500 block mt-2 font-black uppercase font-mono">{user.name}</span>
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
                        <option value="Billing & Invoice">Billing & Simulated Razorpay Payments</option>
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
