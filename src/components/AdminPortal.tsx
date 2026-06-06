/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  IndianRupee, 
  Key, 
  Download, 
  MessageSquare, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  FileText, 
  Briefcase, 
  Gift, 
  RefreshCw,
  Send
} from 'lucide-react';

interface AdminPortalProps {
  onAddNotification: (text: string, type: 'success' | 'info' | 'error') => void;
  onPageChange: (page: string) => void;
  onRefreshDownloads?: () => void;
}

export default function AdminPortal({ onAddNotification, onPageChange, onRefreshDownloads }: AdminPortalProps) {
  // Navigation tabs: stats, customers, products, licenses, downloads, tickets, coupons, blogs, testimonials
  const [activeAdminTab, setActiveAdminTab] = useState<'stats' | 'customers' | 'products' | 'licenses' | 'downloads' | 'tickets' | 'coupons'>('stats');

  // Unified Database Cache states
  const [stats, setStats] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal active incident support chat
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminReplyMsg, setAdminReplyMsg] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Forms configurations
  // 1. Coupon Add form
  const [cpCode, setCpCode] = useState('');
  const [cpDiscount, setCpDiscount] = useState(10);
  const [cpExpires, setCpExpires] = useState('2026-12-31');
  const [addingCoupon, setAddingCoupon] = useState(false);

  // 2. Download release update form
  const [dlVersion, setDlVersion] = useState('');
  const [dlFilename, setDlFilename] = useState('');
  const [dlSize, setDlSize] = useState('');
  const [dlNotes, setDlNotes] = useState('');
  const [addingDl, setAddingDl] = useState(false);
  const [exeFile, setExeFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const b64 = (reader.result as string).split(',')[1];
        resolve(b64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleExeFileChange = (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.exe')) {
      onAddNotification('Please upload an executable (.exe) file only.', 'error');
      return;
    }
    setExeFile(file);
    setDlFilename(file.name);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    setDlSize(`${sizeInMB} MB`);
    
    // Attempt version parsing
    const match = file.name.match(/v?(\d+\.\d+\.\d+)/i) || file.name.match(/v?(\d+\.\d+)/i);
    if (match && match[1]) {
      setDlVersion(match[1]);
    } else {
      setDlVersion('1.0.0');
    }
    onAddNotification(`Selected EXE: ${file.name}. Configured form!`, 'info');
  };

  // 3. Product CRUD form
  const [prodName, setProdName] = useState('');
  const [prodVersion, setProdVersion] = useState('');
  const [prodSize, setProdSize] = useState('');
  const [prodPrice, setProdPrice] = useState(999);
  const [prodOrigPrice, setProdOrigPrice] = useState(2499);
  const [prodDesc, setProdDesc] = useState('');
  const [prodFeatures, setProdFeatures] = useState('');
  const [addingProd, setAddingProd] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [statsRes, userRes, prodRes, licRes, dlRes, tkRes, cpRes, ordRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/products'),
        fetch('/api/admin/licenses', { headers }),
        fetch('/api/downloads', { headers }),
        fetch('/api/admin/tickets', { headers }),
        fetch('/api/admin/coupons', { headers }),
        fetch('/api/admin/orders', { headers })
      ]);

      if (statsRes.ok && userRes.ok && prodRes.ok && licRes.ok && dlRes.ok && tkRes.ok && cpRes.ok && ordRes.ok) {
        setStats(await statsRes.json());
        setCustomers(await userRes.json());
        setProducts(await prodRes.json());
        setLicenses(await licRes.json());
        
        const dlData = await dlRes.json();
        setDownloads(dlData.downloads);
        onRefreshDownloads?.();

        setTickets(await tkRes.json());
        setCoupons(await cpRes.json());
        setOrders(await ordRes.json());
      } else {
        onAddNotification('Refused admin entry. Session expired.', 'error');
        onPageChange('portal');
      }
    } catch {
      onAddNotification('Connection error fetching administrative profiles registers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Actions handlers
  // 1. Coupon handling
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpCode || !cpDiscount || !cpExpires) return;

    setAddingCoupon(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: cpCode, discountPercent: cpDiscount, expiresBy: cpExpires })
      });

      if (res.ok) {
        onAddNotification('New Promo Code generated successfully!', 'success');
        setCpCode('');
        fetchAdminData();
      } else {
        const err = await res.json();
        onAddNotification(err.error || 'Failed generating coupon', 'error');
      }
    } catch {
      onAddNotification('Server communication issues', 'error');
    } finally {
      setAddingCoupon(false);
    }
  };

  const handleToggleCoupon = async (code: string) => {
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch(`/api/admin/coupons/${code}/toggle`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onAddNotification('Coupon active toggled successfully', 'success');
        fetchAdminData();
      }
    } catch {
      onAddNotification('Error updating code', 'error');
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch(`/api/admin/coupons/${code}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onAddNotification('Promo code purged.', 'success');
        fetchAdminData();
      }
    } catch {
      onAddNotification('Error purging code', 'error');
    }
  };

  // 2. Releases updates uploads
  const handleAddRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dlVersion || !dlFilename || !dlSize) return;

    setAddingDl(true);
    setUploadProgress('Preparing file data...');
    const token = localStorage.getItem('bsp_token');
    try {
      if (exeFile) {
        setUploadProgress('Compressing & encoding EXE binary...');
        const base64Data = await fileToBase64(exeFile);
        
        setUploadProgress('Uploading binary package to local server...');
        const uploadRes = await fetch('/api/admin/downloads/upload-exe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ filename: dlFilename, base64Data })
        });
        
        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          onAddNotification(errData.error || 'Binary upload failed', 'error');
          setUploadProgress(null);
          setAddingDl(false);
          return;
        }
        onAddNotification('EXE binary uploaded successfully to storage server!', 'success');
      }

      setUploadProgress('Deploying release metadata...');
      const res = await fetch('/api/admin/downloads', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          version: dlVersion, 
          filename: dlFilename, 
          fileSize: dlSize, 
          releaseNotes: dlNotes.split('\n').filter(Boolean) 
        })
      });

      if (res.ok) {
        onAddNotification('New update binary release deployed successfully!', 'success');
        setDlVersion('');
        setDlFilename('');
        setDlSize('');
        setDlNotes('');
        setExeFile(null);
        fetchAdminData();
      } else {
        onAddNotification('Error adding release updates files', 'error');
      }
    } catch {
      onAddNotification('Server network issues during upload', 'error');
    } finally {
      setAddingDl(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteRelease = async (id: string) => {
    if (!confirm('Purge this standard setup release?')) return;
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch(`/api/admin/downloads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onAddNotification('Setup release binary metadata deleted.', 'info');
        fetchAdminData();
      }
    } catch {
      onAddNotification('Error purging update metadata', 'error');
    }
  };

  // 3. License Key expirations triggers
  const handleToggleLicense = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'revoked' : 'active';
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch(`/api/admin/licenses/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        onAddNotification(`License successfully marked ${nextStatus}`, 'success');
        fetchAdminData();
      }
    } catch {
      onAddNotification('Error updating key parameters', 'error');
    }
  };

  // 4. Ticket replying
  const handleAdminSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyMsg.trim() || !selectedTicketId) return;

    setReplyLoading(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicketId}/reply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: adminReplyMsg })
      });

      if (res.ok) {
        setAdminReplyMsg('');
        fetchAdminData();
      } else {
        onAddNotification('Failed transmitting reply', 'error');
      }
    } catch {
      onAddNotification('Error transmitting chat reply line', 'error');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleToggleTicketStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'resolved' ? 'open' : 'resolved';
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch(`/api/admin/tickets/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        onAddNotification(`Ticket status updated to ${nextStatus}`, 'success');
        fetchAdminData();
      }
    } catch {
      onAddNotification('Error updating status metadata', 'error');
    }
  };

  // 5. Product creation
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodVersion || !prodSize) return;

    setAddingProd(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: prodName,
          version: prodVersion,
          size: prodSize,
          price: Number(prodPrice),
          originalPrice: Number(prodOrigPrice),
          description: prodDesc,
          features: prodFeatures.split('\n').filter(Boolean)
        })
      });

      if (res.ok) {
        onAddNotification('Suryatech billing product catalog added!', 'success');
        setProdName('');
        setProdVersion('');
        setProdSize('');
        setProdDesc('');
        setProdFeatures('');
        fetchAdminData();
      } else {
        onAddNotification('Unable to upload catalog item', 'error');
      }
    } catch {
      onAddNotification('Network error posting product', 'error');
    } finally {
      setAddingProd(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Purge this binary catalog software?')) return;
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onAddNotification('Billing system product deleted from indices.', 'info');
        fetchAdminData();
      }
    } catch {
      onAddNotification('Error purging catalog item', 'error');
    }
  };


  const getSelectedTicket = () => tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-left">
      {/* Dynamic Header details */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 leading-none flex items-center gap-2">
            <span>Suryatech Secure Administration Terminal</span>
            <span className="text-xs bg-red-100 text-red-650 border border-red-200 font-mono py-1 px-2.5 rounded uppercase tracking-wider font-extrabold shadow-inner">Corporate Desk</span>
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-medium">Control license generations, support incidents chats, coupons creation, downloads logs, and customer registries dynamically.</p>
        </div>
        <button
          onClick={fetchAdminData}
          className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer shadow transition-all active:rotate-180"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Terminal Data</span>
        </button>
      </div>

      {/* CORE ADMINISTRATIVE METRIC COUNTERS BLOCKS */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white border rounded-2xl p-4 shadow-sm" id="stat-revenue-block">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-mono">Gross Revenue</span>
            <div className="text-xl font-extrabold text-blue-600 mt-1 leading-none">₹{stats.totalRevenue}</div>
            <span className="text-[9px] text-slate-400 block mt-1.5">+15% Monthly Growth</span>
          </div>

          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-mono">Total Customers</span>
            <div className="text-xl font-extrabold text-slate-800 mt-1 leading-none">{stats.totalCustomers}</div>
            <span className="text-[9px] text-slate-450 block mt-1.5">Registered Accounts</span>
          </div>

          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-mono">Invoices / Orders</span>
            <div className="text-xl font-extrabold text-[#10B981] mt-1 leading-none">{stats.totalOrders}</div>
            <span className="text-[9px] text-slate-400 block mt-1.5">Complete Checkouts</span>
          </div>

          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-mono">Active Licenses</span>
            <div className="text-xl font-extrabold text-amber-600 mt-1 leading-none">{stats.activeLicenses}</div>
            <span className="text-[9px] text-slate-450 block mt-1.5">Offline Installations</span>
          </div>

          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-mono">EXE Software Downloads</span>
            <div className="text-xl font-extrabold text-violet-600 mt-1 leading-none">{stats.totalDownloads}</div>
            <span className="text-[9px] text-slate-450 block mt-1.5">Setup Binaries Downloads</span>
          </div>

          <div className="bg-white border rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-mono">Pending Tickets</span>
            <div className="text-xl font-extrabold text-rose-500 mt-1 leading-none">{stats.openTickets}</div>
            <span className="text-[9px] text-slate-400 block mt-1.5">Require Support Replies</span>
          </div>
        </div>
      )}

      {/* TABS ROW ROUTINGS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3" id="admin-routes-tabs">
        {(['stats', 'customers', 'products', 'licenses', 'downloads', 'tickets', 'coupons'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveAdminTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeAdminTab === tab ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
            id={`admin-tab-nav-${tab}`}
          >
            {tab === 'stats' && 'Transactions'}
            {tab === 'customers' && 'Customers Directory'}
            {tab === 'products' && 'Product Catalog'}
            {tab === 'licenses' && 'License Registry'}
            {tab === 'downloads' && 'Releases uploads'}
            {tab === 'tickets' && 'Support desk Incident'}
            {tab === 'coupons' && 'Promo Coupons'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border rounded-3xl p-16 text-center text-sm font-mono text-slate-500 shadow-sm leading-none font-bold">
          Transmitting secure database fields caches ...
        </div>
      ) : (
        <>
          {/* View 1: TRANSACTION ORDERS LIST */}
          {activeAdminTab === 'stats' && (
            <div className="space-y-4 animate-fade-in" id="admin-panel-orders-timeline">
              <h3 className="font-extrabold text-slate-900 text-lg">Acquired Orders Transaction Flow</h3>
              <div className="bg-white border border-slate-200.80 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-150">
                {orders.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">No transactions recorded.</div>
                ) : (
                  orders.map((ord) => (
                    <div key={ord.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs sm:text-sm">
                      <div className="space-y-1">
                        <span className="font-black text-slate-850 block">{ord.productName}</span>
                        <div className="flex flex-wrap gap-2 text-[10.5px] font-mono text-slate-400">
                          <span>Ref: {ord.id}</span>
                          <span>• Client: {ord.userName} ({ord.userEmail})</span>
                          {ord.couponCode && <span className="text-blue-500 font-bold">• Code: {ord.couponCode}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0">
                        <div className="text-right">
                          <span className="font-extrabold text-slate-900 block font-mono text-sm">₹{ord.amount}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{new Date(ord.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className={`px-2.5 py-1 text-[9px] font-mono leading-none tracking-wider uppercase font-bold rounded ${
                          ord.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                        }`}>
                          ● {ord.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* View 2: USERS CUSTOMER REGISTER LIST */}
          {activeAdminTab === 'customers' && (
            <div className="space-y-4 animate-fade-in" id="admin-panel-users-grid">
              <h3 className="font-extrabold text-slate-900 text-lg">Merchant Client Directory</h3>
              <div className="bg-white border rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-150 text-xs sm:text-sm">
                {customers.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">No customer accounts registered.</div>
                ) : (
                  customers.map((c) => (
                    <div key={c.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-slate-600">
                      <div>
                        <span className="font-extrabold text-slate-900 block">{c.name}</span>
                        <span className="text-[10.5px] text-slate-400 block mt-0.5 font-mono">{c.email}</span>
                      </div>
                      <span className="text-[10px] text-slate-450 block font-mono">Account Born: {new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* View 3: PRODUCT CATALOG CRUD */}
          {activeAdminTab === 'products' && (
            <div className="space-y-8 animate-fade-in" id="admin-panel-products-crud">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left product uploads creation form */}
                <div className="lg:col-span-5 bg-white border p-5 rounded-2xl shadow-sm space-y-4 text-xs sm:text-sm">
                  <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">Deploy New Billing Software</h4>
                  
                  <form onSubmit={handleAddProductSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">Product Name *</label>
                      <input
                        type="text" required placeholder="Suryatech Wholesale Gold" value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-650 font-mono block">Version *</label>
                        <input
                          type="text" required placeholder="v5.1" value={prodVersion}
                          onChange={(e) => setProdVersion(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs text-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-650 font-mono block">Size *</label>
                        <input
                          type="text" required placeholder="18.5 MB" value={prodSize}
                          onChange={(e) => setProdSize(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-650 font-mono block">Selling Price *</label>
                        <input
                          type="number" required placeholder="₹999" value={prodPrice}
                          onChange={(e) => setProdPrice(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-650 font-mono block">Original Price *</label>
                        <input
                          type="number" required placeholder="₹2499" value={prodOrigPrice}
                          onChange={(e) => setProdOrigPrice(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">Description</label>
                      <textarea
                        rows={2} placeholder="SaaS retail inventory features outlines..." value={prodDesc}
                        onChange={(e) => setProdDesc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 p-3 rounded-xl text-xs resize-none text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block font-medium">Features Bullets (One per line)</label>
                      <textarea
                        rows={3} placeholder="Thermal Printing Widths\nGSTR Forms Monthly\nIMEI Warranty logs" value={prodFeatures}
                        onChange={(e) => setProdFeatures(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 p-3 rounded-xl text-xs resize-none text-slate-900"
                      />
                    </div>

                    <button
                      type="submit" disabled={addingProd}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-xl transition-colors cursor-pointer text-center block"
                    >
                      {addingProd ? 'Uploading Product ...' : 'Deploy Product Catalog'}
                    </button>
                  </form>
                </div>

                {/* Right product catalog listings */}
                <div className="lg:col-span-7 space-y-4 text-xs sm:text-sm">
                  <h4 className="font-extrabold text-slate-900 text-sm">Deployed Software Catalogs indices</h4>
                  <div className="space-y-4">
                    {products.map((p) => (
                      <div key={p.id} className="bg-white border rounded-2xl p-5 flex justify-between gap-4" id={`crud-product-item-${p.id}`}>
                        <div className="space-y-2">
                          <h5 className="font-extrabold text-slate-950 text-base leading-none">{p.name}</h5>
                          <span className="text-[10.5px] font-mono text-slate-450 block">ID: {p.id} • Version: {p.version} • Size: {p.size}</span>
                          <span className="text-slate-500 font-medium block leading-relaxed">{p.description}</span>
                          <div className="flex gap-1.5 flex-wrap pt-1">
                            {p.features.slice(0, 3).map((f: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-100 border text-slate-500 text-[9.5px] font-mono rounded font-semibold">{f}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right flex flex-col justify-between items-end shrink-0">
                          <div>
                            <span className="font-mono font-extrabold text-[#2563EB] block text-base">₹{p.price}</span>
                            <span className="text-[10px] text-slate-400 line-through">₹{p.originalPrice || 2499}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 border border-slate-200 text-slate-450 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer max-w-xs"
                            title="Purge Software"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* View 4: LICENSES ACTIVE REGISTRY */}
          {activeAdminTab === 'licenses' && (
            <div className="space-y-4 animate-fade-in" id="admin-panel-licenses-hub">
              <h3 className="font-extrabold text-slate-900 text-lg">Acquired License Keys Registers</h3>
              <div className="bg-white border rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-150">
                {licenses.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs sm:text-sm">No activations codes key allocated.</div>
                ) : (
                  licenses.map((lic) => (
                    <div key={lic.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs sm:text-sm">
                      <div className="space-y-1">
                        <span className="font-extrabold text-slate-900 block">{lic.productName}</span>
                        <div className="font-mono text-[10.5px] text-slate-450 space-y-1">
                          <span className="block font-bold text-blue-600 text-xs tracking-wider">{lic.licenseKey}</span>
                          <span className="block">Ref Reference: {lic.id} | Order: {lic.orderId} | Owner: {lic.userEmail}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                        <span className={`px-2.5 py-1 text-[9px] font-mono uppercase font-bold rounded ${
                          lic.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-650'
                        }`}>
                          ● {lic.status}
                        </span>
                        <button
                          onClick={() => handleToggleLicense(lic.id, lic.status)}
                          className={`px-3 py-1.5 text-[10px] font-bold font-mono uppercase rounded border transition-colors cursor-pointer ${
                            lic.status === 'active' 
                              ? 'border-red-200 text-red-600 hover:bg-red-50' 
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {lic.status === 'active' ? 'Revoke Serial' : 'Authorize Serial'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* View 5: RELEASES UPLOADS CENTRE */}
          {activeAdminTab === 'downloads' && (
            <div className="space-y-8 animate-fade-in" id="admin-panel-releases-desk">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Releases upload form */}
                <div className="lg:col-span-5 bg-white border p-5 rounded-2xl shadow-sm space-y-4 text-xs sm:text-sm">
                  <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">Deploy exe version release update</h4>
                  
                  <form onSubmit={handleAddRelease} className="space-y-3">
                    {/* Drag and Drop / Choose File Section */}
                    <div className="space-y-1.5 rounded-xl border border-dashed border-slate-300 p-4 bg-slate-50 hover:bg-slate-100 transition-colors relative" id="exe-drag-drop-zone">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block uppercase">EXE Binary File (.exe) *</label>
                      <input
                        type="file"
                        accept=".exe"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleExeFileChange(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                        id="exe-file-input-field"
                      />
                      {!exeFile ? (
                        <div 
                          className="flex flex-col items-center justify-center py-4 cursor-pointer"
                          onClick={() => document.getElementById('exe-file-input-field')?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleExeFileChange(e.dataTransfer.files[0]);
                            }
                          }}
                        >
                          <Download className="w-8 h-8 text-blue-500 mb-2 animate-bounce cursor-pointer" style={{ transform: 'rotate(180deg)' }} />
                          <p className="text-[11px] font-semibold text-slate-700 text-center">Drag and drop setup.exe here or <span className="text-blue-600 underline">Browse files</span></p>
                          <p className="text-[9.5px] text-slate-450 text-center mt-1">Accepts Windows executables up to 45 MB</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-white border border-slate-200.80 rounded-lg p-2 mt-1">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 truncate leading-tight">{exeFile.name}</p>
                              <p className="text-[9.5px] text-slate-400 font-mono">{(exeFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setExeFile(null);
                              setDlFilename('');
                              setDlSize('');
                            }}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">Version code *</label>
                      <input
                        type="text" required placeholder="e.g. 4.2.2" value={dlVersion}
                        onChange={(e) => setDlVersion(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-900"
                        id="dl-version-input"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">Filename *</label>
                      <input
                        type="text" required placeholder="e.g. BSPSuryatech_BillingReader_v4.2.2_Setup.exe" value={dlFilename}
                        onChange={(e) => setDlFilename(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">File Space size *</label>
                      <input
                        type="text" required placeholder="e.g. 14.8 MB" value={dlSize}
                        onChange={(e) => setDlSize(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-900"
                      />
                    </div>

                    <div className="space-y-1 font-sans">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">Release Note Logs (One per line)</label>
                      <textarea
                        rows={3} placeholder="Fixed barcode wrap sizes.\nOptimized receipts memory loading by 40%." value={dlNotes}
                        onChange={(e) => setDlNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 p-3 rounded-xl text-xs resize-none text-slate-900"
                      />
                    </div>

                    {uploadProgress && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex items-center gap-2.5 text-[11px] text-blue-700 animate-pulse font-medium">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 text-blue-600" />
                        <span>{uploadProgress}</span>
                      </div>
                    )}

                    <button
                      type="submit" disabled={addingDl}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase rounded-xl transition-colors cursor-pointer text-center block"
                      id="dl-submit-btn"
                    >
                      {addingDl ? (uploadProgress || 'Uploading release...') : 'Deploy Update Setup'}
                    </button>
                  </form>
                </div>

                {/* Right releases listings view */}
                <div className="lg:col-span-7 space-y-4 text-xs sm:text-sm">
                  <h4 className="font-extrabold text-slate-900 text-sm">Deployed update binaries lists</h4>
                  <div className="space-y-4">
                    {downloads.map((d) => (
                      <div key={d.id} className="bg-white border rounded-2xl p-5 flex justify-between gap-4" id={`dl-crud-item-${d.id}`}>
                        <div className="space-y-2">
                          <h5 className="font-extrabold text-slate-900 text-sm">{d.filename}</h5>
                          <span className="text-[10.5px] font-mono text-slate-450 block font-bold text-blue-600">ID: {d.id} • Version: {d.version} • Size: {d.fileSize}</span>
                          <ul className="space-y-1 pt-1.5">
                            {d.releaseNotes.map((note: string, nI: number) => (
                              <li key={nI} className="text-slate-600 text-xs flex gap-1.5 items-start">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex flex-col justify-between items-end shrink-0">
                          <span className="text-[10.5px] font-mono text-emerald-600 font-bold">Downloads: {d.downloadCount}</span>
                          <button
                            onClick={() => handleDeleteRelease(d.id)}
                            className="p-2 border border-slate-200 text-slate-450 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* View 6: SUPPORT TICKETS DESK */}
          {activeAdminTab === 'tickets' && (
            <div className="space-y-8 animate-fade-in" id="admin-panel-tickets-incident">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Ticket Incidents summaries list */}
                <div className="lg:col-span-5 space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-1">Support Incidents Desk</h4>
                  {tickets.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">No support tickets incident requested.</div>
                  ) : (
                    tickets.map((t) => {
                      const isSelected = selectedTicketId === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTicketId(t.id);
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                          }}
                          className={`p-4 border rounded-2xl cursor-pointer text-left transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50/20 shadow-sm' 
                              : 'border-slate-200 bg-white hover:border-slate-355'
                          }`}
                          id={`admin-inc-ticket-${t.id}`}
                        >
                          <div className="flex justify-between items-center mb-1 text-[10px]">
                            <span className="font-mono font-bold text-slate-400">ID: {t.id}</span>
                            <span className={`px-2.5 py-0.5 font-bold font-mono rounded ${
                              t.status === 'open' 
                                ? 'bg-blue-50 text-blue-600' 
                                : t.status === 'in_progress'
                                ? 'bg-amber-50 text-amber-600'
                                : 'bg-slate-50 text-slate-500'
                            }`}>
                              {t.status.replace('_', ' ')}
                            </span>
                          </div>
                          <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm truncate leading-snug">{t.title}</h5>
                          <span className="text-[10px] text-slate-450 block mt-1">From: {t.userName} ({t.userEmail})</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Right detailed conversation timeline */}
                <div className="lg:col-span-12 xl:col-span-7">
                  {selectedTicketId ? (
                    (() => {
                      const selTk = getSelectedTicket();
                      if (!selTk) return null;
                      return (
                        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-6 text-xs sm:text-sm text-left" id="admin-chat-frame">
                          
                          <div className="border-b border-slate-100 pb-4">
                            <div className="flex justify-between items-center text-[10px] mb-2 font-mono">
                              <span className="font-bold text-slate-400">Incident: {selTk.id} • Category: {selTk.category}</span>
                              <span>{new Date(selTk.createdAt).toLocaleString()}</span>
                            </div>
                            <h4 className="font-black text-slate-850 text-base leading-snug">{selTk.title}</h4>
                            <p className="text-slate-600 text-xs bg-slate-50 border p-3.5 mt-2 rounded-xl italic leading-normal">{selTk.description}</p>
                          </div>

                          <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                            {selTk.replies.map((rep: any) => {
                              const isOperator = rep.authorRole === 'admin';
                              return (
                                <div key={rep.id} className={`flex flex-col text-xs leading-normal ${isOperator ? 'items-end' : 'items-start'}`}>
                                  <div className={`p-3 rounded-2xl max-w-[85%] text-left ${
                                    isOperator ? 'bg-indigo-650 bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none font-medium'
                                  }`}>
                                    <p className="whitespace-pre-line leading-relaxed">{rep.message}</p>
                                  </div>
                                  <span className="text-[9px] text-slate-400 block mt-1 font-mono font-bold px-1 uppercase">
                                    {rep.authorName} • {new Date(rep.createdAt).toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Chat footer replies typing block */}
                          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                            <form onSubmit={handleAdminSendReply} className="flex-grow flex gap-2">
                              <input
                                type="text" required placeholder="Type support answer to merchant client..." value={adminReplyMsg}
                                onChange={(e) => setAdminReplyMsg(e.target.value)}
                                className="flex-grow bg-slate-50 border border-slate-200.80 px-4 py-2.5 rounded-xl text-xs text-slate-900"
                                id="admin-chat-input-text"
                              />
                              <button
                                type="submit" disabled={replyLoading}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors"
                              >
                                Send
                              </button>
                            </form>
                            <button
                              onClick={() => handleToggleTicketStatus(selTk.id, selTk.status)}
                              className={`py-2 px-4 rounded-xl text-xs font-bold font-mono tracking-wide uppercase border text-center transition-colors cursor-pointer ${
                                selTk.status === 'resolved' 
                                  ? 'border-amber-200 text-slate-600 hover:bg-slate-50' 
                                  : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {selTk.status === 'resolved' ? 'Reopen Incident' : 'Resolve Incident'}
                            </button>
                          </div>

                        </div>
                      );
                    })()
                  ) : (
                    <div className="bg-slate-50 border-2 border-dashed rounded-3xl p-16 text-center text-slate-400 font-semibold text-sm">
                      Select raised support ticket incident on the left to handle and write back solutions.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* View 7: COUPONS PROMOS CRUD */}
          {activeAdminTab === 'coupons' && (
            <div className="space-y-8 animate-fade-in" id="admin-panel-coupons-desk">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Coupon creation form */}
                <div className="lg:col-span-5 bg-white border p-5 rounded-2xl shadow-sm space-y-4 text-xs sm:text-sm">
                  <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">Generate promotional code discount</h4>
                  
                  <form onSubmit={handleAddCoupon} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">Coupon code label (Capitals) *</label>
                      <input
                        type="text" required placeholder="e.g. MONSOON30" value={cpCode}
                        onChange={(e) => setCpCode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-widest text-slate-900"
                        id="coupon-code-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-650 font-mono block">Discount Percentage (%) *</label>
                        <input
                          type="number" min={5} max={90} required value={cpDiscount}
                          onChange={(e) => setCpDiscount(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-650 font-mono block">Expiration Date *</label>
                        <input
                          type="date" required value={cpExpires}
                          onChange={(e) => setCpExpires(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-900"
                        />
                      </div>
                    </div>

                    <button
                      type="submit" disabled={addingCoupon}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-xl transition-colors cursor-pointer text-center block"
                      id="coupon-submit-btn"
                    >
                      {addingCoupon ? 'Deploying code ...' : 'Deploy Promocode'}
                    </button>
                  </form>
                </div>

                {/* Right Coupons listings values */}
                <div className="lg:col-span-7 space-y-4 text-xs sm:text-sm">
                  <h4 className="font-extrabold text-slate-900 text-sm">Deployed promo coupons indices</h4>
                  <div className="bg-white border rounded-2xl overflow-hidden divide-y divide-slate-150 shadow-sm">
                    {coupons.map((cp) => (
                      <div key={cp.code} className="p-4 flex justify-between items-center gap-4 text-slate-600 font-mono" id={`coupon-crud-item-${cp.code}`}>
                        <div className="space-y-1">
                          <span className="font-black text-slate-900 block text-sm tracking-wider uppercase">{cp.code}</span>
                          <span className="text-[10px] text-slate-450 block font-medium">Discount: {cp.discountPercent}% Off • Expires By: {cp.expiresBy}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                            cp.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                          }`}>
                            ● {cp.active ? 'Active' : 'Expired'}
                          </span>
                          <button
                            onClick={() => handleToggleCoupon(cp.code)}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                          >
                            Toggle
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(cp.code)}
                            className="p-1.5 border border-slate-150 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
