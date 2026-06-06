/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
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
  Sparkles
} from 'lucide-react';

interface CustomerPortalProps {
  user: any;
  onLoginSuccess: (token: string, user: any) => void;
  onAddNotification: (text: string, type: 'success' | 'info' | 'error') => void;
  onPageChange: (page: string) => void;
  onTriggerTrialDownload: (prodId: string, isFull?: boolean) => void;
}

export default function CustomerPortal({ 
  user, 
  onLoginSuccess, 
  onAddNotification, 
  onPageChange,
  onTriggerTrialDownload
}: CustomerPortalProps) {
  // Tabs: auth, dashboard, tickets, new-ticket, profile, purchase-history, payment-history, invoices, notifications
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [activePortalView, setActivePortalView] = useState<'dashboard' | 'tickets' | 'new-ticket' | 'profile' | 'payments' | 'invoices' | 'notifications'>('dashboard');

  // Login form states
  const [loginEmail, setLoginEmail] = useState('test@gmail.com');
  const [loginPassword, setLoginPassword] = useState('surya123');
  const [authLoading, setAuthLoading] = useState(false);

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

  // Fetch Customer Portal records
  const fetchCustomerData = async () => {
    if (!user) return;
    setDataLoading(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const [licRes, ordRes, tkRes, payRes, invRes, notifRes] = await Promise.all([
        fetch('/api/customer/licenses', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/customer/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/tickets', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/customer/payment-history', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/customer/invoices', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/customer/notifications', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (licRes.ok && ordRes.ok && tkRes.ok && payRes.ok && invRes.ok && notifRes.ok) {
        setLicenses(await licRes.json());
        setOrders(await ordRes.json());
        setTickets(await tkRes.json());
        setPayments(await payRes.json());
        setInvoices(await invRes.json());
        setNotificationsList(await notifRes.json());
      }
    } catch {
      onAddNotification('Connection error fetching customer workspace records', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  // Fetch target customer profile data
  const fetchCustomerProfile = async () => {
    if (!user) return;
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/customer/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfileClientName(data.clientName || '');
        setProfileBusinessName(data.businessName || '');
        setProfileContactNumber(data.contactNumber || '');
        setProfileEmailAddress(data.emailAddress || '');
        setProfileBusinessAddress(data.businessAddress || '');
        setProfileCity(data.city || '');
        setProfileStateValue(data.state || '');
        setProfilePincode(data.pincode || '');
        setProfileGstNumber(data.gstNumber || '');
      }
    } catch {
      console.warn('Unable to load customer profile details.');
    }
  };

  useEffect(() => {
    if (user) {
      fetchCustomerData();
      fetchCustomerProfile();
    }
  }, [user]);

  // Auth Submit handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      onAddNotification('Please fill in email and password', 'error');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.token, data.user);
        onAddNotification(`Welcome back, ${data.user.name}!`, 'success');
      } else {
        const err = await res.json();
        onAddNotification(err.error || 'Authentication failed', 'error');
      }
    } catch {
      onAddNotification('Server communication failure', 'error');
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
    try {
      const res = await fetch('/api/auth/register-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: regClientName,
          businessName: regBusinessName,
          contactNumber: regContactNumber,
          email: regEmail,
          businessAddress: regBusinessAddress,
          city: regCity,
          state: regState,
          pincode: regPincode,
          gstNumber: regGstNumber,
          password: regPassword,
          confirmPassword: regConfirmPassword
        })
      });

      if (res.ok) {
        const data = await res.json();
        setOtpServerCode(data.otp);
        setOtpEmailTarget(data.email);
        setOtpSent(true);
        onAddNotification('Suryatech Authentication OTP sent! Please verify code key.', 'success');
      } else {
        const err = await res.json();
        onAddNotification(err.error || 'Registration failed', 'error');
      }
    } catch {
      onAddNotification('Server communication failure', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // OTP Verification Submission
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpValue) {
      onAddNotification('Please enter the 6-digit verification code', 'error');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmailTarget, otp: otpValue })
      });

      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.token, data.user);
        setOtpSent(false);
        setOtpValue('');
        onAddNotification('OTP verified successfully! Account created & logged in.', 'success');
      } else {
        const err = await res.json();
        onAddNotification(err.error || 'Invalid OTP code', 'error');
      }
    } catch {
      onAddNotification('Server communication failure during OTP verification', 'error');
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
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clientName: profileClientName,
          businessName: profileBusinessName,
          contactNumber: profileContactNumber,
          emailAddress: profileEmailAddress,
          businessAddress: profileBusinessAddress,
          city: profileCity,
          state: profileStateValue,
          pincode: profilePincode,
          gstNumber: profileGstNumber
        })
      });

      if (res.ok) {
        onAddNotification('Customer Profile details updated successfully!', 'success');
        fetchCustomerProfile();
        fetchCustomerData();
      } else {
        const err = await res.json();
        onAddNotification(err.error || 'Failed updating profile', 'error');
      }
    } catch {
      onAddNotification('Server communication failure updating profile details', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // Mark notification read handler
  const handleMarkNotificationRead = async (id: string) => {
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch(`/api/customer/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch {
      console.warn('Failed completing notification state read in backend server');
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
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: ticketTitle, description: ticketDescription, category: ticketCategory })
      });

      if (res.ok) {
        onAddNotification('Support ticket opened successfully!', 'success');
        setTicketTitle('');
        setTicketDescription('');
        setActivePortalView('tickets');
        fetchCustomerData();
      } else {
        const err = await res.json();
        onAddNotification(err.error || 'Could not post ticket', 'error');
      }
    } catch {
      onAddNotification('Network error posting support ticket', 'error');
    } finally {
      setTicketSubmitting(false);
    }
  };

  // Reply message submission
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMsg.trim() || !activeTicketId) return;

    setReplySubmitting(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch(`/api/tickets/${activeTicketId}/reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: replyMsg })
      });

      if (res.ok) {
        setReplyMsg('');
        fetchCustomerData();
      } else {
        onAddNotification('Could not post reply', 'error');
      }
    } catch {
      onAddNotification('Network error posting reply message', 'error');
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
        {/* Banner credentials info */}
        <div className="bg-sky-50 border border-sky-150 p-4 rounded-2xl mb-8 flex gap-3 text-left shadow-sm">
          <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-sky-800 leading-normal space-y-1">
            <span className="font-extrabold block">🇮🇳 Suryatech Sandbox Installer Gateway:</span>
            <p className="font-medium text-slate-600">
              Create a secure professional account, verify with sandbox OTP, or select <strong className="text-blue-600">Sign In</strong> with prefilled credentials: <strong className="text-slate-800">test@gmail.com / surya123</strong> to experience direct serial client setup downloads!
            </p>
          </div>
        </div>

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
              <form onSubmit={handleLoginSubmit} className="space-y-4 max-w-md mx-auto">
                <div className="text-left space-y-1">
                  <label className="text-xs font-bold text-slate-650 font-mono tracking-wider uppercase block">Customer Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      id="login-input-email"
                    />
                  </div>
                </div>

                <div className="text-left space-y-1">
                  <label className="text-xs font-bold text-slate-650 font-mono tracking-wider uppercase block">Secure Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Enter account password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      id="login-input-pass"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm tracking-wider uppercase rounded-xl transition-colors cursor-pointer block mt-6 shadow"
                  id="login-submit-button"
                >
                  {authLoading ? 'Signing In Workspace...' : 'Secure Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                <div className="text-center pb-2">
                  <h3 className="text-lg font-black text-slate-800 font-sans tracking-tight">Onboarding Registration Form</h3>
                  <p className="text-slate-450 text-[10.5px] font-mono uppercase mt-1">BSP Suryatech Secure Registration System</p>
                </div>

                {/* Grid blocks for professional information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-650 block">Client Full Name *</label>
                    <div className="relative font-sans">
                      <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Patel"
                        value={regClientName}
                        onChange={(e) => setRegClientName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-650 block">Registered Business Name *</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Patel Stores Pvt Ltd"
                        value={regBusinessName}
                        onChange={(e) => setRegBusinessName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-650 block">Contact Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 9988776655"
                        value={regContactNumber}
                        onChange={(e) => setRegContactNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-650 block">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="ramesh@company.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-650 block">Business Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="Floor, shop locator, landmark details"
                        value={regBusinessAddress}
                        onChange={(e) => setRegBusinessAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-650 block">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-650 block">State *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maharashtra"
                      value={regState}
                      onChange={(e) => setRegState(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-650 block">Pincode *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 411001"
                      value={regPincode}
                      onChange={(e) => setRegPincode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-650 block">GST IN Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA1111A1Z1"
                      value={regGstNumber}
                      onChange={(e) => setRegGstNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-650 block">Secure Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Type password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-650 block">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Confirm password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

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
                        className="bg-white border border-slate-205 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all"
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

                <form onSubmit={handleUpdateProfileSubmit} className="bg-white border border-slate-205 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-650 block">Customer Name *</label>
                      <input
                        type="text"
                        required
                        value={profileClientName}
                        onChange={(e) => setProfileClientName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-650 block">Business Name *</label>
                      <input
                        type="text"
                        required
                        value={profileBusinessName}
                        onChange={(e) => setProfileBusinessName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-650 block">Contact Number *</label>
                      <input
                        type="text"
                        required
                        value={profileContactNumber}
                        onChange={(e) => setProfileContactNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-650 block leading-none">Email Address (Invoicing targets)</label>
                      <input
                        type="email"
                        disabled
                        value={profileEmailAddress}
                        className="w-full bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-400 font-mono cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-650 block">Business / Billing Address *</label>
                      <input
                        type="text"
                        required
                        value={profileBusinessAddress}
                        onChange={(e) => setProfileBusinessAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-650 block">City *</label>
                      <input
                        type="text"
                        required
                        value={profileCity}
                        onChange={(e) => setProfileCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-650 block">State *</label>
                      <input
                        type="text"
                        required
                        value={profileStateValue}
                        onChange={(e) => setProfileStateValue(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-650 block">Pincode *</label>
                      <input
                        type="text"
                        required
                        value={profilePincode}
                        onChange={(e) => setProfilePincode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-650 block">GST IN Number (Optional)</label>
                      <input
                        type="text"
                        value={profileGstNumber}
                        onChange={(e) => setProfileGstNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white font-mono"
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
                      <label className="text-xs font-bold text-slate-650 font-mono tracking-wider uppercase block">Incident Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. TVS RP3150 receipt line alignment"
                        value={ticketTitle}
                        onChange={(e) => setTicketTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 transition-colors"
                        id="new-ticket-title-input"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-650 font-mono tracking-wider uppercase block">Incident Category</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-205 px-4 py-3 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 transition-colors"
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
                    <label className="text-xs font-bold text-slate-650 font-mono tracking-wider uppercase block">Problem Description *</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Detail physical receipt printer models, windows OS editions, or error logs text strings here to assist installers during diagnosis..."
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 p-4 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 transition-colors resize-none"
                      id="new-ticket-desc-input"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActivePortalView('tickets')}
                      className="px-5 py-3 border border-slate-200 text-slate-650 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
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
