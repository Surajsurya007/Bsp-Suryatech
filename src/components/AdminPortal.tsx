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
  Pencil,
  Check, 
  X, 
  Sparkles, 
  FileText, 
  Briefcase, 
  Gift, 
  RefreshCw,
  Send,
  CreditCard,
  Settings,
  User,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Eye,
  HelpCircle,
  Shield,
  Copy,
  Database,
  AlertTriangle
} from 'lucide-react';

import { VideoTutorial } from '../types';

interface AdminPortalProps {
  onAddNotification: (text: string, type: 'success' | 'info' | 'error') => void;
  onPageChange: (page: string) => void;
  onRefreshDownloads?: () => void;
  videos?: VideoTutorial[];
  onRefreshVideos?: () => void;
}

export default function AdminPortal({ onAddNotification, onPageChange, onRefreshDownloads, videos = [], onRefreshVideos }: AdminPortalProps) {
  // Navigation tabs: stats, customers, products, licenses, downloads, tickets, coupons, languages, videos, razorpay, supabase
  const [activeAdminTab, setActiveAdminTab] = useState<'stats' | 'customers' | 'products' | 'licenses' | 'downloads' | 'tickets' | 'coupons' | 'languages' | 'videos' | 'razorpay' | 'supabase'>('stats');

  // Unified Database Cache states
  const [stats, setStats] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [langConfigs, setLangConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Language management form states
  const [newLangCode, setNewLangCode] = useState('');
  const [newLangName, setNewLangName] = useState('');
  const [newLangFlag, setNewLangFlag] = useState('');
  const [addingLang, setAddingLang] = useState(false);

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

  // PDF manual upload states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUploadProgress, setPdfUploadProgress] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

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
  const [prodPrice, setProdPrice] = useState(1999);
  const [prodOrigPrice, setProdOrigPrice] = useState(2499);
  const [prodDesc, setProdDesc] = useState('');
  const [prodFeatures, setProdFeatures] = useState('');
  const [prodConnectedPlan, setProdConnectedPlan] = useState('');
  const [prodCategory, setProdCategory] = useState('Retail & POS Billing');
  const [prodFullDesc, setProdFullDesc] = useState('');
  const [prodSysReqs, setProdSysReqs] = useState('');
  const [prodLicenseInfo, setProdLicenseInfo] = useState('');
  const [prodDemoVideo, setProdDemoVideo] = useState('');
  const [prodGallery, setProdGallery] = useState<string[]>([]);
  const [addingProd, setAddingProd] = useState(false);

  // Product Edit states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editPrice, setEditPrice] = useState(1999);
  const [editOrigPrice, setEditOrigPrice] = useState(2499);
  const [editDesc, setEditDesc] = useState('');
  const [editFeatures, setEditFeatures] = useState('');
  const [editConnectedPlan, setEditConnectedPlan] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editFullDesc, setEditFullDesc] = useState('');
  const [editSysReqs, setEditSysReqs] = useState('');
  const [editLicenseInfo, setEditLicenseInfo] = useState('');
  const [editDemoVideo, setEditDemoVideo] = useState('');
  const [editGallery, setEditGallery] = useState<string[]>([]);
  const [updatingProd, setUpdatingProd] = useState(false);

  // Interactive link entry helper
  const [inputUrlPhoto, setInputUrlPhoto] = useState('');

  // Helper to reorder gallery photo lists
  const moveGalleryItem = (gallery: string[], index: number, direction: 'up' | 'down', setter: (g: string[]) => void) => {
    const nextIdx = direction === 'up' ? index - 1 : index + 1;
    if (nextIdx < 0 || nextIdx >= gallery.length) return;
    const list = [...gallery];
    const temp = list[index];
    list[index] = list[nextIdx];
    list[nextIdx] = temp;
    setter(list);
  };

  const deleteGalleryItem = (gallery: string[], index: number, setter: (g: string[]) => void) => {
    setter(gallery.filter((_, i) => i !== index));
  };

  const handleGalleryFileUpload = (file: File, gallery: string[], setter: (g: string[]) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setter([...gallery, reader.result]);
        onAddNotification('Screenshot file loaded and appended to gallery!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Video Management States
  const [vidTitle, setVidTitle] = useState('');
  const [vidDuration, setVidDuration] = useState('');
  const [vidYoutubeId, setVidYoutubeId] = useState('');
  const [vidThumbnail, setVidThumbnail] = useState('');
  const [vidDescription, setVidDescription] = useState('');
  const [addingVid, setAddingVid] = useState(false);

  const [editingVidId, setEditingVidId] = useState<string | null>(null);
  const [editVidTitle, setEditVidTitle] = useState('');
  const [editVidDuration, setEditVidDuration] = useState('');
  const [editVidYoutubeId, setEditVidYoutubeId] = useState('');
  const [editVidThumbnail, setEditVidThumbnail] = useState('');
  const [editVidDescription, setEditVidDescription] = useState('');
  const [updatingVid, setUpdatingVid] = useState(false);

  // Razorpay Configuration States
  const [rzpKeyId, setRzpKeyId] = useState('');
  const [rzpKeySecret, setRzpKeySecret] = useState('');
  const [rzpMode, setRzpMode] = useState<'test' | 'live'>('test');
  const [rzpCurrency, setRzpCurrency] = useState('INR');
  const [rzpEnabled, setRzpEnabled] = useState(true);
  const [rzpWebhookSecret, setRzpWebhookSecret] = useState('');
  const [savingRzp, setSavingRzp] = useState(false);

  // Helpline Configuration States
  const [helpline, setHelpline] = useState('+91 95169 16415');
  const [savingHelpline, setSavingHelpline] = useState(false);

  // Gemini Configuration States
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [savingGemini, setSavingGemini] = useState(false);

  // Supabase Configuration States
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  const [savingSupabase, setSavingSupabase] = useState(false);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseFullSchema, setSupabaseFullSchema] = useState('');
  const [loadingSupabaseSchema, setLoadingSupabaseSchema] = useState(false);

  // Hostinger Configuration States
  const [hostingerHost, setHostingerHost] = useState('');
  const [hostingerUser, setHostingerUser] = useState('');
  const [hostingerPass, setHostingerPass] = useState('');
  const [hostingerDatabase, setHostingerDatabase] = useState('');
  const [hostingerPort, setHostingerPort] = useState(3306);
  const [hostingerEnabled, setHostingerEnabled] = useState(false);
  const [savingHostinger, setSavingHostinger] = useState(false);
  const [testingHostinger, setTestingHostinger] = useState(false);
  const [migratingHostinger, setMigratingHostinger] = useState(false);

  const handleCopyStoragePolicies = () => {
    const sql = `-- Supabase Storage Row Level Security (RLS) Policies
-- Target Bucket: "app-files"

-- 1. Users can view own files
create policy "Users can view own files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);

-- 2. Users can upload to own folder
create policy "Users can upload to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);

-- 3. Users can update own files
create policy "Users can update own files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);

-- 4. Users can delete own files
create policy "Users can delete own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);`;
    navigator.clipboard.writeText(sql);
    onAddNotification('Storage SQL Security Policies copied to clipboard!', 'success');
  };

  const handleCopyDatabaseSchema = () => {
    if (supabaseFullSchema) {
      navigator.clipboard.writeText(supabaseFullSchema);
      onAddNotification('Full Supabase Database SQL Schema copied to clipboard!', 'success');
    } else {
      onAddNotification('Schema file is currently loading. Please click "Fetch Active Database SQL Schema" first!', 'info');
    }
  };

  const handleFetchSchemaManually = async () => {
    setLoadingSupabaseSchema(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/admin/supabase-schema', { headers });
      if (res.ok) {
        const data = await res.json();
        setSupabaseFullSchema(data.schema || '');
        onAddNotification('Successfully loaded database schemas! You can now copy or view it below.', 'success');
      } else {
        onAddNotification('Failed to retrieve schema file.', 'error');
      }
    } catch (err) {
      onAddNotification('Error retrieving schema file.', 'error');
    } finally {
      setLoadingSupabaseSchema(false);
    }
  };

  // Selected Customer Detail States
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleViewCustomerDetails = async (userId: string) => {
    setSelectedCustomerId(userId);
    setLoadingDetails(true);
    setCustomerDetails(null);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch(`/api/admin/customers/${userId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomerDetails(data);
      } else {
        const err = await res.json();
        onAddNotification(err.error || 'Failed to load customer details', 'error');
      }
    } catch {
      onAddNotification('Connection error fetching customer registry stats', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [statsRes, userRes, prodRes, licRes, dlRes, tkRes, cpRes, ordRes, langRes, rzpRes, helplineRes, geminiRes, supabaseRes, hostingerRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/products'),
        fetch('/api/admin/licenses', { headers }),
        fetch('/api/downloads', { headers }),
        fetch('/api/admin/tickets', { headers }),
        fetch('/api/admin/coupons', { headers }),
        fetch('/api/admin/orders', { headers }),
        fetch('/api/languages'),
        fetch('/api/admin/razorpay-config', { headers }),
        fetch('/api/helpline'),
        fetch('/api/admin/gemini-config', { headers }).catch(() => null),
        fetch('/api/admin/supabase-config', { headers }).catch(() => null),
        fetch('/api/admin/hostinger-config', { headers }).catch(() => null)
      ]);

      if (statsRes.ok && userRes.ok && prodRes.ok && licRes.ok && dlRes.ok && tkRes.ok && cpRes.ok && ordRes.ok && langRes.ok && rzpRes.ok) {
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
        setLangConfigs(await langRes.json());

        const rzpData = await rzpRes.json();
        setRzpKeyId(rzpData.keyId || '');
        setRzpKeySecret(rzpData.keySecret || '');
        setRzpMode(rzpData.mode || 'test');
        setRzpCurrency(rzpData.currency || 'INR');
        setRzpEnabled(rzpData.enabled !== false);
        setRzpWebhookSecret(rzpData.webhookSecret || '');

        if (helplineRes.ok) {
          const helplineData = await helplineRes.json();
          setHelpline(helplineData.helpline || '+91 95169 16415');
        }

        if (geminiRes && geminiRes.ok) {
          const gemConfig = await geminiRes.json();
          setGeminiApiKey(gemConfig.apiKey || '');
        }

        if (supabaseRes && supabaseRes.ok) {
          const sbConfig = await supabaseRes.json();
          setSupabaseUrl(sbConfig.url || '');
          setSupabaseAnonKey(sbConfig.anonKey || '');
          setSupabaseEnabled(!!sbConfig.enabled);
        }

        if (hostingerRes && hostingerRes.ok) {
          const hostingerConfig = await hostingerRes.json();
          setHostingerHost(hostingerConfig.host || '');
          setHostingerUser(hostingerConfig.user || '');
          setHostingerPass(hostingerConfig.pass || '');
          setHostingerDatabase(hostingerConfig.database || '');
          setHostingerPort(hostingerConfig.port || 3306);
          setHostingerEnabled(!!hostingerConfig.enabled);
        }

        onRefreshVideos?.();
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

  useEffect(() => {
    if (activeAdminTab === 'supabase' && !supabaseFullSchema) {
      handleFetchSchemaManually();
    }
  }, [activeAdminTab]);

  // Language management actions
  const handleToggleLanguage = async (code: string, currentEnabled: boolean) => {
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/languages/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code, enabled: !currentEnabled })
      });
      if (res.ok) {
        const data = await res.json();
        onAddNotification(`Language ${data.config.name} ${!currentEnabled ? 'enabled' : 'disabled'} successfully`, 'success');
        setLangConfigs(prev => prev.map(l => l.code === code ? { ...l, enabled: !currentEnabled } : l));
      } else {
        const err = await res.json();
        onAddNotification(err.error || 'Failed to toggle language', 'error');
      }
    } catch {
      onAddNotification('Connection error toggling language configuration', 'error');
    }
  };

  const handleCreateLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLangCode || !newLangName) return;

    setAddingLang(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/languages/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newLangCode.toLowerCase(),
          name: newLangName,
          flag: newLangFlag || '🇮🇳',
          enabled: true
        })
      });
      if (res.ok) {
        const data = await res.json();
        onAddNotification(`Successfully registered new language: ${data.language.name}`, 'success');
        setLangConfigs(prev => [...prev.filter(l => l.code !== data.language.code), data.language]);
        setNewLangCode('');
        setNewLangName('');
        setNewLangFlag('');
      } else {
        const err = await res.json();
        onAddNotification(err.error || 'Failed to add language', 'error');
      }
    } catch {
      onAddNotification('Network failure adding translation configuration options', 'error');
    } finally {
      setAddingLang(false);
    }
  };

  const handleUpdateGeminiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGemini(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/admin/gemini-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ apiKey: geminiApiKey })
      });
      if (res.ok) {
        onAddNotification('Gemini API Translation Key updated successfully. Dynamic translations are now fully automated!', 'success');
      } else {
        const err = await res.json();
        onAddNotification(err.error || 'Failed to update Gemini API configuration', 'error');
      }
    } catch {
      onAddNotification('Connection error updating Gemini config settings', 'error');
    } finally {
      setSavingGemini(false);
    }
  };

  const handleUpdateSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSupabase(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/admin/supabase-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url: supabaseUrl,
          anonKey: supabaseAnonKey,
          enabled: supabaseEnabled
        })
      });
      if (res.ok) {
        onAddNotification('Supabase settings updated successfully. Client-Server auth flows are now secured through Supabase!', 'success');
      } else {
        const err = await res.json();
        onAddNotification(err.error || 'Failed to update Supabase configuration', 'error');
      }
    } catch {
      onAddNotification('Connection error updating Supabase settings', 'error');
    } finally {
      setSavingSupabase(false);
    }
  };

  const handleTestSupabaseConnection = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      onAddNotification('Please enter both Supabase URL and Anon Key before running test connection.', 'info');
      return;
    }
    setTestingSupabase(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/admin/supabase-config/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url: supabaseUrl,
          anonKey: supabaseAnonKey
        })
      });
      const data = await res.json();
      if (res.ok) {
        onAddNotification(data.message || 'Supabase parameters connected! Connection verified successfully.', 'success');
      } else {
        onAddNotification(data.error || 'Failed to contact Supabase instance. Check your credentials.', 'error');
      }
    } catch {
      onAddNotification('Connection timeout or network failure reaching Supabase server.', 'error');
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleUpdateHostingerConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHostinger(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/admin/hostinger-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          host: hostingerHost,
          user: hostingerUser,
          pass: hostingerPass,
          database: hostingerDatabase,
          port: Number(hostingerPort) || 3306,
          enabled: hostingerEnabled
        })
      });
      const data = await res.json();
      if (res.ok) {
        onAddNotification('Hostinger SQL configuration updated and tables generated successfully!', 'success');
      } else {
        onAddNotification(data.error || 'Failed to update Hostinger configuration', 'error');
      }
    } catch {
      onAddNotification('Error saving Hostinger configuration attributes', 'error');
    } finally {
      setSavingHostinger(false);
    }
  };

  const handleTestHostingerConnection = async () => {
    if (!hostingerHost || !hostingerUser || !hostingerDatabase) {
      onAddNotification('Please fill in Host, User, and Database Name before testing.', 'info');
      return;
    }
    setTestingHostinger(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/admin/hostinger-config/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          host: hostingerHost,
          user: hostingerUser,
          pass: hostingerPass,
          database: hostingerDatabase,
          port: Number(hostingerPort) || 3306
        })
      });
      const data = await res.json();
      if (res.ok) {
        onAddNotification(data.message || 'Connection verified and tables configured successfully!', 'success');
      } else {
        onAddNotification(data.error || 'Failed to reach Hostinger MySQL server.', 'error');
      }
    } catch {
      onAddNotification('Network/timeout error connecting to Hostinger MySQL database.', 'error');
    } finally {
      setTestingHostinger(false);
    }
  };

  const handleReplicateToHostinger = async () => {
    if (!hostingerHost || !hostingerUser || !hostingerDatabase) {
      onAddNotification('Please fill and save Hostinger credentials before replicating data.', 'error');
      return;
    }
    if (!confirm('Are you sure you want to replicate ALL local JSON database entries and files configuration to Hostinger MySQL? This will drop and rewrite current Hostinger SQL server tables.')) {
      return;
    }
    setMigratingHostinger(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/admin/hostinger-config/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        onAddNotification(data.message || 'All records successfully published/synced to Hostinger MySQL tables!', 'success');
      } else {
        onAddNotification(data.error || 'Migration of records turned up an error.', 'error');
      }
    } catch {
      onAddNotification('Network issue publishing local database to Hostinger service.', 'error');
    } finally {
      setMigratingHostinger(false);
    }
  };

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

  const handlePdfFileChange = (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      onAddNotification('Please upload a PDF document (.pdf) only.', 'error');
      return;
    }
    setPdfFile(file);
  };

  const handleUploadPdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) {
      onAddNotification('Please select a PDF manual file first.', 'error');
      return;
    }

    setUploadingPdf(true);
    setPdfUploadProgress('Encoding PDF document...');
    const token = localStorage.getItem('bsp_token');
    try {
      const base64Data = await fileToBase64(pdfFile);
      setPdfUploadProgress('Uploading PDF user manual...');
      const res = await fetch('/api/admin/downloads/upload-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ filename: 'usr-manual.pdf', base64Data })
      });

      if (res.ok) {
        onAddNotification('User Installation PDF manual uploaded & activated!', 'success');
        setPdfFile(null);
      } else {
        const err = await res.json();
        onAddNotification(err.error || 'PDF manual upload failed', 'error');
      }
    } catch {
      onAddNotification('Network error uploading PDF manual', 'error');
    } finally {
      setUploadingPdf(false);
      setPdfUploadProgress(null);
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
          features: prodFeatures.split('\n').filter(Boolean),
          connectedPlan: prodConnectedPlan || '',
          category: prodCategory,
          fullDescription: prodFullDesc,
          systemRequirements: prodSysReqs,
          licenseInfo: prodLicenseInfo,
          demoVideoUrl: prodDemoVideo,
          gallery: prodGallery
        })
      });

      if (res.ok) {
        onAddNotification('Suryatech billing product catalog added!', 'success');
        setProdName('');
        setProdVersion('');
        setProdSize('');
        setProdDesc('');
        setProdFeatures('');
        setProdConnectedPlan('');
        setProdCategory('Retail & POS Billing');
        setProdFullDesc('');
        setProdSysReqs('');
        setProdLicenseInfo('');
        setProdDemoVideo('');
        setProdGallery([]);
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

  const handleStartEdit = (p: any) => {
    setEditingProductId(p.id);
    setEditName(p.name);
    setEditVersion(p.version);
    setEditSize(p.size);
    setEditPrice(p.price);
    setEditOrigPrice(p.originalPrice || 2499);
    setEditDesc(p.description || '');
    setEditFeatures(Array.isArray(p.features) ? p.features.join('\n') : '');
    setEditConnectedPlan(p.connectedPlan || '');
    setEditCategory(p.category || 'Retail & POS Billing');
    setEditFullDesc(p.fullDescription || p.description || '');
    setEditSysReqs(p.systemRequirements || '');
    setEditLicenseInfo(p.licenseInfo || '');
    setEditDemoVideo(p.demoVideoUrl || '');
    setEditGallery(p.gallery || []);
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
  };

  const handleUpdateProductSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editName || !editPrice || !editVersion || !editSize) {
      onAddNotification('Product name, price, version, size are all required.', 'error');
      return;
    }

    setUpdatingProd(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          version: editVersion,
          size: editSize,
          price: Number(editPrice),
          originalPrice: Number(editOrigPrice),
          description: editDesc,
          features: editFeatures.split('\n').filter(Boolean),
          connectedPlan: editConnectedPlan || '',
          category: editCategory,
          fullDescription: editFullDesc,
          systemRequirements: editSysReqs,
          licenseInfo: editLicenseInfo,
          demoVideoUrl: editDemoVideo,
          gallery: editGallery
        })
      });

      if (res.ok) {
        onAddNotification('Suryatech billing product updated successfully!', 'success');
        setEditingProductId(null);
        fetchAdminData();
      } else {
        onAddNotification('Unable to update product details', 'error');
      }
    } catch {
      onAddNotification('Network error updating product', 'error');
    } finally {
      setUpdatingProd(false);
    }
  };

  // Video Management actions
  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vidTitle || !vidYoutubeId) {
      onAddNotification('Title and YouTube URL/ID are required.', 'error');
      return;
    }

    setAddingVid(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: vidTitle,
          duration: vidDuration || '05:00 Mins',
          youtubeId: vidYoutubeId,
          thumbnail: vidThumbnail || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800',
          description: vidDescription || ''
        })
      });

      if (res.ok) {
        onAddNotification('New Tutorial Video successfully uploaded/saved!', 'success');
        setVidTitle('');
        setVidDuration('');
        setVidYoutubeId('');
        setVidThumbnail('');
        setVidDescription('');
        onRefreshVideos?.();
      } else {
        const err = await res.json();
        onAddNotification(err.error || 'Unable to upload video', 'error');
      }
    } catch {
      onAddNotification('Network error posting new video', 'error');
    } finally {
      setAddingVid(false);
    }
  };

  const handleStartEditVideo = (v: any) => {
    setEditingVidId(v.id);
    setEditVidTitle(v.title);
    setEditVidDuration(v.duration);
    setEditVidYoutubeId(v.youtubeId);
    setEditVidThumbnail(v.thumbnail || '');
    setEditVidDescription(v.description || '');
  };

  const handleCancelEditVideo = () => {
    setEditingVidId(null);
  };

  const handleUpdateVideoSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editVidTitle || !editVidYoutubeId) {
      onAddNotification('Title and YouTube ID/URL are required.', 'error');
      return;
    }

    setUpdatingVid(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editVidTitle,
          duration: editVidDuration || '05:00 Mins',
          youtubeId: editVidYoutubeId,
          thumbnail: editVidThumbnail || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800',
          description: editVidDescription || ''
        })
      });

      if (res.ok) {
        onAddNotification('Video details updated successfully!', 'success');
        setEditingVidId(null);
        onRefreshVideos?.();
      } else {
        onAddNotification('Unable to update video details', 'error');
      }
    } catch {
      onAddNotification('Network error updating video', 'error');
    } finally {
      setUpdatingVid(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tutorial video?')) return;
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onAddNotification('Tutorial video deleted from registry.', 'info');
        onRefreshVideos?.();
      }
    } catch {
      onAddNotification('Error deleting video', 'error');
    }
  };

  const handleUpdateRazorpayConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRzp(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/admin/razorpay-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          keyId: rzpKeyId,
          keySecret: rzpKeySecret,
          mode: rzpMode,
          currency: rzpCurrency,
          enabled: rzpEnabled,
          webhookSecret: rzpWebhookSecret
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRzpKeyId(data.keyId || '');
        setRzpKeySecret(data.keySecret || '');
        setRzpMode(data.mode || 'test');
        setRzpCurrency(data.currency || 'INR');
        setRzpEnabled(data.enabled !== false);
        setRzpWebhookSecret(data.webhookSecret || '');
        onAddNotification('Razorpay Payment Gateway configuration updated successfully!', 'success');
      } else {
        const err = await res.json();
        onAddNotification(err.error || 'Failed to update Razorpay configurations', 'error');
      }
    } catch {
      onAddNotification('Connection error updating Razorpay gateway parameters', 'error');
    } finally {
      setSavingRzp(false);
    }
  };

  const handleUpdateHelpline = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHelpline(true);
    const token = localStorage.getItem('bsp_token');
    try {
      const res = await fetch('/api/helpline', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ helpline })
      });
      if (res.ok) {
        const data = await res.json();
        setHelpline(data.helpline || helpline);
        onAddNotification('System Helpline Number updated successfully!', 'success');
      } else {
        const err = await res.json();
        onAddNotification(err.error || 'Failed to update helpline number', 'error');
      }
    } catch {
      onAddNotification('Connection error updating helpline number', 'error');
    } finally {
      setSavingHelpline(false);
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
        {(['stats', 'customers', 'products', 'licenses', 'downloads', 'tickets', 'coupons', 'languages', 'videos', 'razorpay', 'supabase', 'hostinger'] as const).map((tab) => (
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
            {tab === 'languages' && 'Language Manager'}
            {tab === 'videos' && 'Tutorial Videos'}
            {tab === 'razorpay' && 'Razorpay Settings'}
            {tab === 'supabase' && 'Supabase Integration'}
            {tab === 'hostinger' && 'Hostinger Database'}
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
            <div className="space-y-6 animate-fade-in" id="admin-panel-users-grid">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Merchant Client Directory</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Manage users, view profiles, track purchases, audit payments, and configure device activation keys.</p>
                </div>
                {selectedCustomerId && (
                  <button 
                    onClick={() => { setSelectedCustomerId(null); setCustomerDetails(null); }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors shrink-0"
                  >
                    ← Back to Directory List
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Column 1: Client Directory Index (Left Panel) */}
                <div className={`lg:col-span-5 space-y-4 ${selectedCustomerId ? 'hidden lg:block' : 'block'}`}>
                  <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Registered Customers ({customers.length})</span>
                    <div className="divide-y divide-slate-150 max-h-[550px] overflow-y-auto pr-1">
                      {customers.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-xs">No client accounts registered yet.</div>
                      ) : (
                        customers.map((c) => {
                          const initials = c.name ? c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
                          const isSelected = selectedCustomerId === c.id;
                          return (
                            <div 
                              key={c.id} 
                              onClick={() => handleViewCustomerDetails(c.id)}
                              className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer rounded-xl transition-all duration-200 mt-1 first:mt-0 ${
                                isSelected 
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                                  : 'hover:bg-slate-50 text-slate-755'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="min-w-0">
                                  <span className={`font-extrabold text-xs block truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>{c.name}</span>
                                  <span className={`text-[10px] block truncate mt-0.5 font-mono ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{c.email}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewCustomerDetails(c.id);
                                  }}
                                  className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                                    isSelected 
                                      ? 'bg-white/20 text-white hover:bg-white/30' 
                                      : 'bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                                  }`}
                                  title="View Customer Details"
                                  id={`customer-view-eye-${c.id}`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <span className={`text-[9px] font-mono ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                                  {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                                <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-white translate-x-0.5' : 'text-slate-350'}`} />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Profile & Purchase Inspector (Right Panel) */}
                <div className={`col-span-1 lg:col-span-7 ${!selectedCustomerId ? 'hidden lg:block' : 'block'}`}>
                  {!selectedCustomerId ? (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-16 text-center space-y-4 shadow-inner min-h-[400px] flex flex-col justify-center items-center">
                      <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                        <User className="w-7 h-7" />
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <h4 className="font-extrabold text-slate-900 text-sm">Select a Client</h4>
                        <p className="text-slate-500 text-xs leading-normal">
                          Choose a customer from the registry directory index to review complete profiles, device licenses, GST certificates, invoices, and transaction audits.
                        </p>
                      </div>
                    </div>
                  ) : loadingDetails ? (
                    <div className="bg-white border rounded-2xl p-16 text-center space-y-4 shadow-sm min-h-[400px] flex flex-col justify-center items-center">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-slate-500 text-xs font-mono font-bold uppercase tracking-wider animate-pulse">Decrypting user profile indexes & ledger timelines ...</p>
                    </div>
                  ) : customerDetails ? (
                    <div className="space-y-6 animate-fade-in">
                      
                      {/* Customer Summary Top Banner */}
                      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="min-w-0">
                              <span className="font-extrabold text-sm block leading-none truncate">{customerDetails.user.name}</span>
                              <span className="text-[10px] text-slate-400 block font-mono mt-1 truncate">{customerDetails.user.email}</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-blue-500/15 border border-blue-500/20 rounded text-[9px] font-mono uppercase text-blue-300 shrink-0 font-bold tracking-wider">
                            ID: {customerDetails.user.id}
                          </span>
                        </div>
                        <div className="border-t border-white/5 pt-3 flex flex-wrap justify-between items-center text-[10.5px] text-slate-400 gap-2">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            Born: <strong>{new Date(customerDetails.user.createdAt).toLocaleDateString()}</strong>
                          </span>
                          <span>Registered Language: <strong>{customerDetails.user.language?.toUpperCase() || 'EN'}</strong></span>
                        </div>
                      </div>

                      {/* Business & Location Profile Box */}
                      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                          Business Profile Credentials
                        </h4>
                        
                        {customerDetails.profile ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Client Legal Name</span>
                              <span className="font-extrabold text-slate-800 block">{customerDetails.profile.clientName || 'N/A'}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Trading Business/Firm</span>
                              <span className="font-extrabold text-slate-800 block">{customerDetails.profile.businessName || 'N/A'}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Primary Contact Number</span>
                              <span className="font-mono font-bold text-slate-850 block">{customerDetails.profile.contactNumber || 'N/A'}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">GST Identification Number (GSTIN)</span>
                              <span className="font-mono font-black text-blue-600 uppercase block">{customerDetails.profile.gstNumber || 'Unregistered / Regular Composition'}</span>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">Official Business Premises Address</span>
                              <span className="text-slate-650 font-medium block leading-relaxed">
                                {customerDetails.profile.businessAddress || 'N/A'}
                                {customerDetails.profile.city && `, ${customerDetails.profile.city}`}
                                {customerDetails.profile.state && `, ${customerDetails.profile.state}`}
                                {customerDetails.profile.pincode && ` - ${customerDetails.profile.pincode}`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-50 rounded-xl p-4 text-center text-slate-400 text-xs">
                            This customer has not registered any billing/business profile profile yet.
                          </div>
                        )}
                      </div>

                      {/* Purchased Software & Active Licenses Keys */}
                      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                          <Key className="w-4 h-4 text-emerald-600 shrink-0" />
                          Software Activation Licenses Keys ({customerDetails.licenses.length})
                        </h4>

                        {customerDetails.licenses.length === 0 ? (
                          <div className="bg-slate-50 rounded-xl p-4 text-center text-slate-400 text-xs">
                            No device license keys assigned to this customer yet.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-150">
                            {customerDetails.licenses.map((lic: any) => (
                              <div key={lic.id} className="py-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs first:pt-0 last:pb-0">
                                <div className="space-y-1">
                                  <span className="font-extrabold text-slate-900 block">{lic.productName}</span>
                                  <code className="text-blue-600 text-[11px] font-bold block bg-blue-50 px-2 py-0.5 rounded-md select-all w-fit font-mono">
                                    {lic.licenseKey}
                                  </code>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 md:self-center">
                                  <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono uppercase font-bold ${
                                    lic.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                                  }`}>
                                    ● {lic.status}
                                  </span>
                                  <button
                                    onClick={async () => {
                                      await handleToggleLicense(lic.id, lic.status);
                                      handleViewCustomerDetails(selectedCustomerId!);
                                    }}
                                    className={`px-2 py-1 text-[9.5px] font-mono leading-none tracking-tight font-extrabold uppercase rounded border ${
                                      lic.status === 'active'
                                        ? 'border-red-200 text-red-650 hover:bg-red-50'
                                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                  >
                                    {lic.status === 'active' ? 'Revoke' : 'Register'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Orders and Financial Billing Transactions Audit */}
                      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-blue-600 shrink-0" />
                          Order Checkout Billing flow ({customerDetails.orders.length})
                        </h4>

                        {customerDetails.orders.length === 0 ? (
                          <div className="bg-slate-50 rounded-xl p-4 text-center text-slate-400 text-xs">
                            No billing purchases checked out by this client.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-150">
                            {customerDetails.orders.map((ord: any) => (
                              <div key={ord.id} className="py-3 flex justify-between items-center gap-3 text-xs first:pt-0 last:pb-0">
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-slate-850 block">{ord.productName}</span>
                                  <span className="font-mono text-[9px] text-slate-400 block">Order Ref ID: {ord.id} | {new Date(ord.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-mono font-extrabold text-slate-900 block">₹{ord.amount}</span>
                                  <span className={`px-2 py-0.5 text-[8.5px] font-mono rounded uppercase font-bold block w-fit ml-auto mt-1 ${
                                    ord.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                  }`}>
                                    ● {ord.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Payment Invoices Ledger History */}
                      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-700 shrink-0" />
                          Razorpay Ledger Payments and Invoices ({customerDetails.payments.length})
                        </h4>

                        {customerDetails.payments.length === 0 ? (
                          <div className="bg-slate-50 rounded-xl p-4 text-center text-slate-400 text-xs">
                            No Razorpay transactions captured.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-150">
                            {customerDetails.payments.map((pay: any) => {
                              return (
                                <div key={pay.id} className="py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-800 text-xs">Txn: {pay.transactionId}</span>
                                      <span className="text-[9.5px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{pay.paymentMethod}</span>
                                    </div>
                                    <span className="font-mono text-[9px] text-slate-400 block">Invoice: {pay.invoiceNumber} | {new Date(pay.paymentDate).toLocaleDateString()}</span>
                                  </div>
                                  <div className="text-left sm:text-right shrink-0">
                                    <span className="font-mono font-extrabold text-slate-900 block font-bold">₹{pay.amount}</span>
                                    <span className="text-[9.5px] text-emerald-600 bg-emerald-50 font-bold px-1.5 py-0.5 rounded inline-block mt-0.5 uppercase tracking-wide font-mono">
                                      {pay.status}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  ) : null}
                </div>

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
                          type="number" required placeholder="₹1999" value={prodPrice}
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

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">Connect to Purchase Plan</label>
                      <select
                        value={prodConnectedPlan}
                        onChange={(e) => setProdConnectedPlan(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 px-3 py-2.5 rounded-xl text-xs text-slate-900 focus:bg-white"
                        id="prod-connected-plan-select"
                      >
                        <option value="">None (Regular Software Catalog)</option>
                        <option value="prod-billing-pro">Retail Billing Pro (Pro Plan Card)</option>
                        <option value="prod-billing-enterprise">GST Enterprise Suite (Enterprise Plan Card)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">Software Category</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 px-3 py-2.5 rounded-xl text-xs text-slate-900 focus:bg-white"
                      >
                        <option value="Retail & POS Billing">Retail & POS Billing</option>
                        <option value="ERP & Enterprise Logistics">ERP & Enterprise Logistics</option>
                        <option value="GST Suite Solutions">GST Suite Solutions</option>
                        <option value="Accounting & General ledger">Accounting & General ledger</option>
                        <option value="Healthcare & Pharmacy POS">Healthcare & Pharmacy POS</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">Full Detailed Description</label>
                      <textarea
                        rows={3} placeholder="Provide extensive marketing and technical feature checklists here..." value={prodFullDesc}
                        onChange={(e) => setProdFullDesc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 p-3 rounded-xl text-xs resize-none text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">System Requirements</label>
                      <input
                        type="text" placeholder="Windows 10+, Intel i3 Core, 4GB RAM, 200MB Storage" value={prodSysReqs}
                        onChange={(e) => setProdSysReqs(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">License Terms</label>
                      <input
                        type="text" placeholder="Lifetime offline activation key. Unlimited workstations." value={prodLicenseInfo}
                        onChange={(e) => setProdLicenseInfo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">Demo Video URL or ID</label>
                      <input
                        type="text" placeholder="https://www.youtube.com/embed/dQw4w9WgXcQ" value={prodDemoVideo}
                        onChange={(e) => setProdDemoVideo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    {/* Screenshot Gallery Manager */}
                    <div className="space-y-2 border border-slate-205/65 p-3 rounded-2xl bg-slate-50/50">
                      <label className="text-[10px] font-black text-slate-700 font-mono block uppercase">Screenshot Image Gallery Manager</label>
                      
                      <div className="flex gap-2">
                        <input
                          type="text" placeholder="Paste image URL..." value={inputUrlPhoto}
                          onChange={(e) => setInputUrlPhoto(e.target.value)}
                          className="flex-1 bg-white border border-slate-200.80 px-3 py-2 rounded-xl text-xs text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (inputUrlPhoto) {
                              setProdGallery([...prodGallery, inputUrlPhoto]);
                              setInputUrlPhoto('');
                            }
                          }}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                        >
                          Add URL
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] text-slate-400">or</span>
                        <input
                          type="file" accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleGalleryFileUpload(file, prodGallery, setProdGallery);
                            }
                          }}
                          className="text-[10px] text-slate-500 cursor-pointer"
                        />
                      </div>

                      {prodGallery.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/50 mt-2">
                          {prodGallery.map((img, i) => (
                            <div key={i} className="relative group border border-slate-200 bg-white p-1 rounded-lg">
                              <img src={img} className="w-full h-10 object-contain rounded" alt="" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded">
                                <button
                                  type="button" title="Move Left"
                                  onClick={() => moveGalleryItem(prodGallery, i, 'up', setProdGallery)}
                                  className="p-0.5 bg-slate-800 text-white rounded hover:bg-slate-700"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button" title="Move Right"
                                  onClick={() => moveGalleryItem(prodGallery, i, 'down', setProdGallery)}
                                  className="p-0.5 bg-slate-800 text-white rounded hover:bg-slate-700"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                                <button
                                  type="button" title="Delete Image"
                                  onClick={() => deleteGalleryItem(prodGallery, i, setProdGallery)}
                                  className="p-0.5 bg-red-600 text-white rounded hover:bg-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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
                      <div key={p.id} className="bg-white border rounded-2xl p-5" id={`crud-product-item-${p.id}`}>
                        {editingProductId === p.id ? (
                          <form onSubmit={(e) => handleUpdateProductSubmit(e, p.id)} className="space-y-4">
                            <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-400 font-mono uppercase">EDIT SOFTWARE DEPLOYMENT ({p.id})</span>
                              <span className="text-xs text-blue-600 font-bold uppercase font-mono">PUT Payload Ready</span>
                            </div>
                            
                            <div className="space-y-3 text-left">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 block">Product Name *</label>
                                <input
                                  type="text"
                                  required
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-800 focus:bg-white"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-600 block">Version *</label>
                                  <input
                                    type="text"
                                    required
                                    value={editVersion}
                                    onChange={(e) => setEditVersion(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-800 focus:bg-white"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-600 block">Size *</label>
                                  <input
                                    type="text"
                                    required
                                    value={editSize}
                                    onChange={(e) => setEditSize(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-800 focus:bg-white"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-600 block">Selling Price *</label>
                                  <input
                                    type="number"
                                    required
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono text-slate-800 focus:bg-white"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-600 block">Original Price *</label>
                                  <input
                                    type="number"
                                    required
                                    value={editOrigPrice}
                                    onChange={(e) => setEditOrigPrice(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono text-slate-800 focus:bg-white"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 block">Description *</label>
                                <textarea
                                  rows={2}
                                  value={editDesc}
                                  onChange={(e) => setEditDesc(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs resize-none text-slate-800 focus:bg-white"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 block">Features Bullets (One per line)</label>
                                <textarea
                                  rows={2}
                                  value={editFeatures}
                                  onChange={(e) => setEditFeatures(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs resize-none text-slate-800 focus:bg-white"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 block">Connect to Purchase Plan</label>
                                <select
                                  value={editConnectedPlan}
                                  onChange={(e) => setEditConnectedPlan(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:bg-white"
                                >
                                  <option value="">None (Regular Software Catalog)</option>
                                  <option value="prod-billing-pro">Retail Billing Pro (Pro Plan Card)</option>
                                  <option value="prod-billing-enterprise">GST Enterprise Suite (Enterprise Plan Card)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 block">Software Category</label>
                                <select
                                  value={editCategory}
                                  onChange={(e) => setEditCategory(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-800 focus:bg-white"
                                >
                                  <option value="Retail & POS Billing">Retail & POS Billing</option>
                                  <option value="ERP & Enterprise Logistics">ERP & Enterprise Logistics</option>
                                  <option value="GST Suite Solutions">GST Suite Solutions</option>
                                  <option value="Accounting & General ledger">Accounting & General ledger</option>
                                  <option value="Healthcare & Pharmacy POS">Healthcare & Pharmacy POS</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 block">Full Detailed Description</label>
                                <textarea
                                  rows={4}
                                  value={editFullDesc}
                                  onChange={(e) => setEditFullDesc(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs resize-none text-slate-800 focus:bg-white"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 block">System Requirements</label>
                                <input
                                  type="text"
                                  value={editSysReqs}
                                  onChange={(e) => setEditSysReqs(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-800 focus:bg-white"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 block">License Terms</label>
                                <input
                                  type="text"
                                  value={editLicenseInfo}
                                  onChange={(e) => setEditLicenseInfo(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-800 focus:bg-white"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 block">Demo Video URL or ID</label>
                                <input
                                  type="text"
                                  value={editDemoVideo}
                                  onChange={(e) => setEditDemoVideo(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-800 focus:bg-white"
                                />
                              </div>

                              {/* Screenshot Gallery Manager */}
                              <div className="space-y-2 border border-slate-200 p-3 rounded-2xl bg-slate-50/50">
                                <label className="text-[10px] font-black text-slate-700 font-mono block uppercase">Screenshot Image Gallery Manager</label>
                                
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Paste image URL..."
                                    value={inputUrlPhoto}
                                    onChange={(e) => setInputUrlPhoto(e.target.value)}
                                    className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-800"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (inputUrlPhoto) {
                                        setEditGallery([...editGallery, inputUrlPhoto]);
                                        setInputUrlPhoto('');
                                      }
                                    }}
                                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                                  >
                                    Add URL
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[9.5px] text-slate-400">or</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleGalleryFileUpload(file, editGallery, setEditGallery);
                                      }
                                    }}
                                    className="text-[10px] text-slate-500 cursor-pointer"
                                  />
                                </div>

                                {editGallery.length > 0 && (
                                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200 mt-2">
                                    {editGallery.map((img, i) => (
                                      <div key={i} className="relative group border border-slate-200 bg-white p-1 rounded-lg">
                                        <img src={img} className="w-full h-10 object-contain rounded" alt="" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded">
                                          <button
                                            type="button"
                                            title="Move Left"
                                            onClick={() => moveGalleryItem(editGallery, i, 'up', setEditGallery)}
                                            className="p-0.5 bg-slate-800 text-white rounded hover:bg-slate-700"
                                          >
                                            <ChevronUp className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            title="Move Right"
                                            onClick={() => moveGalleryItem(editGallery, i, 'down', setEditGallery)}
                                            className="p-0.5 bg-slate-800 text-white rounded hover:bg-slate-700"
                                          >
                                            <ChevronDown className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            title="Delete Image"
                                            onClick={() => deleteGalleryItem(editGallery, i, setEditGallery)}
                                            className="p-0.5 bg-red-650 text-white rounded hover:bg-red-500"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs rounded-xl cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={updatingProd}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                              >
                                {updatingProd ? 'Saving...' : 'Update Records'}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex justify-between gap-4 w-full text-left">
                            <div className="space-y-2">
                              <h5 className="font-extrabold text-slate-950 text-base leading-none">{p.name}</h5>
                              <span className="text-[10.5px] font-mono text-slate-450 block">ID: {p.id} • Version: {p.version} • Size: {p.size}</span>
                              <span className="text-slate-500 font-medium block leading-relaxed">{p.description}</span>
                              <div className="flex gap-1.5 flex-wrap pt-1">
                                {p.features.slice(0, 3).map((f: string, i: number) => (
                                  <span key={i} className="px-2 py-0.5 bg-slate-100 border text-slate-500 text-[9.5px] font-mono rounded font-semibold">{f}</span>
                                ))}
                                {p.connectedPlan && (
                                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-600 text-[9.5px] font-mono rounded font-semibold">
                                    Connected to: {p.connectedPlan === 'prod-billing-pro' ? 'Retail Billing Pro' : 'GST Enterprise Suite'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex flex-col justify-between items-end shrink-0">
                              <div>
                                <span className="font-mono font-extrabold text-[#2563EB] block text-base">₹{p.price}</span>
                                <span className="text-[10px] text-slate-400 line-through">₹{p.originalPrice || 2499}</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleStartEdit(p)}
                                  className="p-2 border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                                  title="Edit Product"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-2 border border-slate-200 text-slate-450 hover:text-red-650 hover:bg-red-50 rounded-lg cursor-pointer"
                                  title="Purge Software"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
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
                
                {/* Left side upload forms */}
                <div className="lg:col-span-5 space-y-6">
                  {/* EXE release form */}
                  <div className="bg-white border p-5 rounded-2xl shadow-sm space-y-4 text-xs sm:text-sm">
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

                  {/* PDF User Manual Upload Form */}
                  <div className="bg-white border p-5 rounded-2xl shadow-sm space-y-4 text-xs sm:text-sm">
                    <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">Deploy custom installation PDF user manual</h4>
                    
                    <form onSubmit={handleUploadPdf} className="space-y-3 font-sans">
                      {/* Drag and Drop / Choose File Section */}
                      <div className="space-y-1.5 rounded-xl border border-dashed border-slate-300 p-4 bg-slate-50 hover:bg-slate-100 transition-colors relative" id="pdf-drag-drop-zone">
                        <label className="text-[10px] font-bold text-slate-650 font-mono block uppercase">PDF Document Manual (.pdf) *</label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handlePdfFileChange(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                          id="pdf-file-input-field"
                        />
                        {!pdfFile ? (
                          <div 
                            className="flex flex-col items-center justify-center py-4 cursor-pointer"
                            onClick={() => document.getElementById('pdf-file-input-field')?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                handlePdfFileChange(e.dataTransfer.files[0]);
                              }
                            }}
                          >
                            <FileText className="w-8 h-8 text-red-500 mb-2 animate-pulse cursor-pointer" />
                            <p className="text-[11px] font-semibold text-slate-700 text-center font-sans">Drag and drop user manual PDF here or <span className="text-blue-600 underline">Browse files</span></p>
                            <p className="text-[9.5px] text-slate-450 text-center mt-1 font-sans">Accepts PDF user manuals up to 15 MB</p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-white border border-slate-200.80 rounded-lg p-2 mt-1">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              <div className="truncate">
                                <p className="text-xs font-bold text-slate-800 truncate leading-tight font-sans">{pdfFile.name}</p>
                                <p className="text-[9.5px] text-slate-400 font-mono">{(pdfFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPdfFile(null);
                              }}
                              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {pdfUploadProgress && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 flex items-center gap-2.5 text-[11px] text-red-700 animate-pulse font-medium">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 text-red-600" />
                          <span>{pdfUploadProgress}</span>
                        </div>
                      )}

                      <button
                        type="submit" disabled={uploadingPdf || !pdfFile}
                        className="w-full py-3 bg-slate-900 hover:bg-black disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase rounded-xl transition-colors cursor-pointer text-center block"
                        id="pdf-submit-btn"
                      >
                        {uploadingPdf ? (pdfUploadProgress || 'Uploading PDF manual...') : 'Deploy User Manual PDF'}
                      </button>
                    </form>
                  </div>
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

          {/* View 8: LANGUAGE CONFIGURATIONS AND AI MANAGEMENT */}
          {activeAdminTab === 'languages' && (
            <div className="space-y-6 animate-fade-in" id="admin-panel-languages-config">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">System-Wide Language Manager</h3>
                <p className="text-slate-500 text-xs mt-1">Configure active translation layers, enable or disable locales, and introduce new languages dynamically using Gemini LLM backend.</p>
              </div>

              {/* Gemini API Configuration Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-105 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm" id="gemini-api-config-card">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1 px-2 bg-blue-600 text-white rounded-lg text-[9.5px] font-black tracking-wider uppercase font-sans">Gemini AI</span>
                      <h4 className="font-extrabold text-slate-900 text-sm">Automated Dynamic Translation Engine</h4>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed max-w-xl">
                      Configure your **Gemini API Key** to auto-translate the entire application in real-time.
                      If no key is configured here, translations will automatically search your host environment variables (`GEMINI_API_KEY`) or fallback to English.
                    </p>
                  </div>
                  <form onSubmit={handleUpdateGeminiConfig} className="w-full md:w-auto shrink-0 flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="Paste Gemini API Key (e.g. AIzaSy...)"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      className="bg-white border border-slate-200.80 px-4 py-2.5 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={savingGemini}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-2xl transition-all shadow cursor-pointer whitespace-nowrap"
                    >
                      {savingGemini ? 'Saving...' : 'Save Key'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Panel - Add language form */}
                <div className="lg:col-span-5 bg-white border border-slate-200.80 rounded-2xl p-6 shadow-sm">
                  <h4 className="font-extrabold text-slate-900 text-sm mb-4">Add Translation Language</h4>
                  <form onSubmit={handleCreateLanguage} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">ISO Locale Code (e.g. "pa", "or") *</label>
                      <input
                        type="text" required placeholder="locale code" value={newLangCode}
                        onChange={(e) => setNewLangCode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">Language Name (e.g. Punjabi, Odia) *</label>
                      <input
                        type="text" required placeholder="language local name" value={newLangName}
                        onChange={(e) => setNewLangName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">Emoji representative Flag (e.g. 🇮🇳) *</label>
                      <input
                        type="text" placeholder="emoji flag" value={newLangFlag}
                        onChange={(e) => setNewLangFlag(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200.80 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-bold"
                      />
                    </div>

                    <button
                      type="submit" disabled={addingLang}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-xl transition-colors cursor-pointer text-center block"
                      id="language-submit-btn"
                    >
                      {addingLang ? 'Registering...' : 'Provision Language'}
                    </button>
                  </form>
                </div>

                {/* Right Panel - Active Languages */}
                <div className="lg:col-span-7 space-y-4 text-xs sm:text-sm">
                  <h4 className="font-extrabold text-slate-900 text-sm">Configured Translation Layers</h4>
                  <div className="bg-white border rounded-2xl overflow-hidden divide-y divide-slate-150 shadow-sm">
                    {langConfigs.map((lang) => (
                      <div key={lang.code} className="p-4 flex justify-between items-center gap-4 text-slate-600 font-mono" id={`language-crud-item-${lang.code}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl shrink-0">{lang.flag}</span>
                          <div className="space-y-0.5">
                            <span className="font-black text-slate-900 block text-sm tracking-wider uppercase">{lang.name}</span>
                            <span className="text-[10px] text-slate-450 block font-medium">Locale code: {lang.code}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                            lang.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-450'
                          }`}>
                            ● {lang.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                          <button
                            onClick={() => handleToggleLanguage(lang.code, lang.enabled)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg border cursor-pointer ${
                              lang.enabled 
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {lang.enabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* View 9: VIDEOS PLAYLIST MANAGER */}
          {activeAdminTab === 'videos' && (
            <div className="space-y-6 animate-fade-in" id="admin-panel-videos-crud">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">System-Wide Video Tutorials Manager</h3>
                <p className="text-slate-500 text-xs mt-1">Configure active videos, edit YouTube playback codes / full URLs, and update details shown on the help and tutorials pages.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Panel - Add video form */}
                <div className="lg:col-span-5 bg-white border border-slate-200.80 rounded-2xl p-6 shadow-sm">
                  <h4 className="font-extrabold text-slate-900 text-sm mb-4">Add Tutorial Video</h4>
                  <form onSubmit={handleAddVideo} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">Video Title *</label>
                      <input
                        type="text" required placeholder="e.g. Setting up POS printer layout" value={vidTitle}
                        onChange={(e) => setVidTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">YouTube URL or ID *</label>
                      <input
                        type="text" required placeholder="e.g. https://www.youtube.com/watch?v=... or ID" value={vidYoutubeId}
                        onChange={(e) => setVidYoutubeId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-650 font-mono block">Duration (optional)</label>
                        <input
                          type="text" placeholder="e.g. 05:30 Mins" value={vidDuration}
                          onChange={(e) => setVidDuration(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-650 font-mono block">Thumbnail URL (optional)</label>
                        <input
                          type="text" placeholder="Image URL prefix" value={vidThumbnail}
                          onChange={(e) => setVidThumbnail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-650 font-mono block">Description / Details</label>
                      <textarea
                        placeholder="Detailed guidance summary shown beside video player..." value={vidDescription}
                        onChange={(e) => setVidDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-900"
                      />
                    </div>

                    <button
                      type="submit" disabled={addingVid}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-xl transition-colors cursor-pointer text-center block"
                    >
                      {addingVid ? 'Saving video...' : 'Deploy Tutorial Video'}
                    </button>
                  </form>
                </div>

                {/* Right Panel - Active Videos list */}
                <div className="lg:col-span-7 space-y-4 text-xs sm:text-sm">
                  <h4 className="font-extrabold text-slate-900 text-sm">Active Tutorials Playlists</h4>
                  <div className="space-y-4">
                    {videos.length === 0 ? (
                      <div className="bg-white border rounded-2xl p-10 text-center text-slate-400">
                        No custom videos registered in database yet. Default fallback videos will be displayed.
                      </div>
                    ) : (
                      videos.map((vid) => (
                        <div key={vid.id} id={`crud-video-item-${vid.id}`} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-left font-sans">
                          {editingVidId === vid.id ? (
                            <form onSubmit={(e) => handleUpdateVideoSubmit(e, vid.id)} className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 block font-mono">Video Title</label>
                                <input
                                  type="text" required value={editVidTitle}
                                  onChange={(e) => setEditVidTitle(e.target.value)}
                                  className="w-full bg-slate-50 border px-3 py-2 rounded-lg text-xs font-bold text-slate-900 font-sans"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 block font-mono">YouTube URL/ID</label>
                                  <input
                                    type="text" required value={editVidYoutubeId}
                                    onChange={(e) => setEditVidYoutubeId(e.target.value)}
                                    className="w-full bg-slate-50 border px-3 py-2 rounded-lg text-xs font-mono"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 block font-mono">Play Duration</label>
                                  <input
                                    type="text" value={editVidDuration}
                                    onChange={(e) => setEditVidDuration(e.target.value)}
                                    className="w-full bg-slate-50 border px-3 py-2 rounded-lg text-xs font-bold font-sans"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 block font-mono">Thumbnail Image URL</label>
                                <input
                                  type="text" value={editVidThumbnail}
                                  onChange={(e) => setEditVidThumbnail(e.target.value)}
                                  className="w-full bg-slate-50 border px-3 py-2 rounded-lg text-xs font-sans"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 block font-mono">Description</label>
                                <textarea
                                  value={editVidDescription}
                                  onChange={(e) => setEditVidDescription(e.target.value)}
                                  rows={2}
                                  className="w-full bg-slate-50 border px-3 py-2 rounded-lg text-xs font-sans"
                                />
                              </div>

                              <div className="flex items-center gap-2 pt-2 justify-end">
                                <button
                                  type="button" onClick={handleCancelEditVideo}
                                  className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-sans"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit" disabled={updatingVid}
                                  className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer font-sans"
                                >
                                  {updatingVid ? 'Saving...' : 'Apply Details'}
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-4 items-start font-sans">
                              <div className="w-full sm:w-1/3 aspect-video rounded-xl overflow-hidden bg-slate-900 relative shrink-0 border border-slate-150">
                                <img
                                  src={vid.thumbnail}
                                  alt={vid.title}
                                  className="w-full h-full object-cover opacity-80"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="absolute bottom-2 right-2 bg-black/80 text-[10px] px-1.5 py-0.5 rounded text-white font-mono">{vid.duration}</span>
                              </div>

                              <div className="flex-1 space-y-1.5 font-sans">
                                <h5 className="font-extrabold text-slate-800 text-sm leading-snug">{vid.title}</h5>
                                <p className="text-[10px] font-mono text-slate-400 truncate">YouTube target playback: {vid.youtubeId}</p>
                                <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{vid.description}</p>
                                
                                <div className="flex items-center gap-2.5 pt-2">
                                  <button
                                    onClick={() => handleStartEditVideo(vid)}
                                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-slate-800 border-slate-250 text-[10px] font-bold uppercase tracking-wider rounded-lg border cursor-pointer font-sans"
                                  >
                                    Edit details
                                  </button>
                                  <button
                                    onClick={() => handleDeleteVideo(vid.id)}
                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 text-[10px] font-bold uppercase tracking-wider rounded-lg border cursor-pointer font-sans"
                                  >
                                    Delete Video
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View 10: RAZORPAY GATEWAY CONFIGURATION */}
          {activeAdminTab === 'razorpay' && (
            <div className="space-y-6 animate-fade-in text-slate-800 font-sans" id="admin-panel-razorpay-gateway">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span>Razorpay Gateways Integration</span>
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">Configure live merchant account profiles, toggle dynamic workspace checkouts, adjust Webhook listener secrets, and match keys instantly.</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                  rzpEnabled ? 'bg-green-150 text-green-700 border border-green-200' : 'bg-slate-150 text-slate-550 border'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${rzpEnabled ? 'bg-green-500' : 'bg-slate-405'}`} />
                  <span>{rzpEnabled ? 'Gateway Live & Online' : 'Gateway Disabled / Offline'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form fields */}
                <form onSubmit={handleUpdateRazorpayConfig} className="lg:col-span-8 bg-white border border-slate-200.80 rounded-2xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">Master Integration Parameters</span>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Enable Gateway Option</label>
                      <button
                        type="button"
                        onClick={() => setRzpEnabled(!rzpEnabled)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          rzpEnabled ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${
                          rzpEnabled ? 'left-6' : 'left-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-650 font-mono block">Razorpay API Key ID *</label>
                      <input
                        type="text"
                        required
                        placeholder="rzp_test_..."
                        value={rzpKeyId}
                        onChange={(e) => setRzpKeyId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-250 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950"
                      />
                      <p className="text-[9.5px] text-slate-450 leading-normal">Copy this directly from your Razorpay Dashboard &gt; Settings &gt; API Keys.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-650 font-mono block">Razorpay Key Secret *</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••••••••••••••"
                        value={rzpKeySecret}
                        onChange={(e) => setRzpKeySecret(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-250 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950"
                      />
                      <p className="text-[9.5px] text-slate-450 leading-normal">Securely stored inside database.json config file to keep secrets confidential.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-sans">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-650 font-mono block">Routing Mode</label>
                      <select
                        value={rzpMode}
                        onChange={(e) => setRzpMode(e.target.value as 'test' | 'live')}
                        className="w-full bg-slate-50 border border-slate-250 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 font-bold"
                      >
                        <option value="test">Sandbox Test Mode</option>
                        <option value="live">Live / Production Mode</option>
                      </select>
                      <p className="text-[9.5px] text-slate-450 leading-normal">Switches URL integration and simulation modes instantly.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-650 font-mono block">Accounting Currency Code</label>
                      <input
                        type="text"
                        required
                        placeholder="INR"
                        value={rzpCurrency}
                        onChange={(e) => setRzpCurrency(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border border-slate-250 px-3.5 py-2.5 rounded-xl text-xs font-sans font-bold text-slate-900"
                      />
                      <p className="text-[9.5px] text-slate-450 leading-normal">Standard accounting value: INR (Indian Rupee).</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-650 font-mono block">Webhook Signet Secret</label>
                      <input
                        type="text"
                        placeholder="whsec_..."
                        value={rzpWebhookSecret}
                        onChange={(e) => setRzpWebhookSecret(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-250 px-3.5 py-2.5 rounded-xl text-xs font-mono text-slate-900"
                      />
                      <p className="text-[9.5px] text-slate-450 leading-normal">Verifies transaction callbacks signature from Razorpay servers.</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex justify-end gap-3 font-sans">
                    <button
                      type="submit"
                      disabled={savingRzp}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer text-center"
                    >
                      {savingRzp ? 'Syncing Parameters...' : 'Save & Restructure Gateway'}
                    </button>
                  </div>
                </form>

                {/* Info and help side rail */}
                <div className="lg:col-span-4 space-y-6 text-slate-800 font-sans text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-inner">
                    <h4 className="text-xs font-black uppercase text-slate-850 tracking-wider flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-slate-700 font-bold" />
                      <span>Webhooks Recorders</span>
                    </h4>
                    <p className="text-xs text-slate-500 leading-normal leading-relaxed">
                      Suryatech validates capture callback signals dynamically to automatically issue license keys instantly. Add this listener configuration in your merchant settings:
                    </p>
                    <div className="space-y-2">
                      <label className="text-[9.5px] font-black text-slate-450 uppercase block font-mono">Callback Webhook Endpoint</label>
                      <div className="bg-slate-200/65 border border-slate-300 rounded-lg p-2.5 font-mono text-[10px] select-all break-all font-bold text-slate-800">
                        {window.location.origin}/api/webhooks/razorpay
                      </div>
                    </div>
                    <div className="space-y-1.5 text-slate-500 text-[11px] leading-relaxed">
                      <p className="font-extrabold text-slate-850">Events to monitor:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li><code>payment.captured</code></li>
                        <li><code>order.paid</code></li>
                        <li><code>payment.failed</code></li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-black uppercase text-blue-800 tracking-wider">Integration Health Checks</h4>
                    <p className="text-xs text-blue-650 leading-relaxed font-sans font-medium">
                      Verify connectivity to standard endpoints before launching Live networks. Click to execute a sandbox test verification ping:
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onAddNotification(`Integration health check successful! Razorpay test API endpoints are fully active and reachable: ${rzpKeyId || 'rzp_test_SURYA2026KEY'}`, 'success');
                      }}
                      className="w-full py-2.5 bg-blue-100 hover:bg-blue-150 text-blue-800 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all border border-blue-200 cursor-pointer"
                    >
                      Run Connection Health Ping
                    </button>
                  </div>
                </div>
              </div>

              {/* Helpline Settings Container */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6 border-t border-slate-200">
                <form onSubmit={handleUpdateHelpline} className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">System Helpline Configuration</span>
                    <p className="text-slate-500 text-[11px] mt-1">Configure the official helpline/sales mobile number. This value updates immediately on all pages (Footers & Sales desks).</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-650 font-mono block">Official Support Line *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 95169 16415"
                      value={helpline}
                      onChange={(e) => setHelpline(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-250 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950"
                    />
                  </div>

                  <div className="pt-4 border-t flex justify-end gap-3 font-sans">
                    <button
                      type="submit"
                      disabled={savingHelpline}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer text-center"
                    >
                      {savingHelpline ? 'Updating Helpline...' : 'Update Support Helpline'}
                    </button>
                  </div>
                </form>

                <div className="lg:col-span-4 space-y-6 text-slate-800 font-sans text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-850 tracking-wider">Helpline Visibility</h4>
                    <p className="text-slate-500 leading-normal">
                      The helpline number is dynamically bound. Once saved:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-550">
                      <li>Navigation Desk Hotlines update dynamically</li>
                      <li>Contact page phone options sync instantly</li>
                      <li>Email invoice custom headers use this phone contact</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* View 11: SUPABASE INTEGRATION PANELS */}
          {activeAdminTab === 'supabase' && (
            <div className="space-y-6 animate-fade-in text-slate-800 font-sans" id="admin-panel-supabase-gateway">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <span>Supabase Cloud Integration</span>
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Connect, orchestrate, and manage client authentication sessions securely using Supabase Auth.
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                  supabaseEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' : 'bg-slate-100 text-slate-500 border border-slate-250'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${supabaseEnabled ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                  <span>{supabaseEnabled ? 'SUPABASE ACTIVE' : 'LOCAL INTEGRATION'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <form onSubmit={handleUpdateSupabaseConfig} className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">Connection Credentials</span>
                    <p className="text-slate-500 text-[11px] mt-1">Configure your Supabase Project API URL and public anonymous service keys to activate dynamic authentication synchronization.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-650 font-mono block">Supabase Project API URL *</label>
                      <input
                        type="url"
                        required
                        placeholder="https://your-project-id.supabase.co"
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-250 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                      />
                      <span className="text-[9.5px] text-slate-400 font-medium block">Used to dispatch user tokens and sign up client records.</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-650 font-mono block">Supabase Public Anon Rest Key *</label>
                      <input
                        type="password"
                        required
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        value={supabaseAnonKey}
                        onChange={(e) => setSupabaseAnonKey(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-250 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                      />
                      <span className="text-[9.5px] text-slate-400 font-medium block">Public REST authorization token providing secure access to auth methods.</span>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 flex items-center justify-between gap-4 mt-6">
                      <div className="space-y-0.5">
                        <label className="text-xs font-extrabold text-slate-900 block">Enable Supabase Auth Sync / Connection</label>
                        <span className="text-[10px] text-slate-500 block">When active, user registrations and login credentials are routed and authenticated via Supabase.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSupabaseEnabled(!supabaseEnabled)}
                        className={`font-black uppercase text-[10.5px] tracking-wider px-4 py-2 rounded-xl border border-slate-250 transition-all cursor-pointer ${
                          supabaseEnabled ? 'bg-emerald-600 text-white border-emerald-700 font-bold' : 'bg-slate-105 text-slate-705 hover:bg-slate-100'
                        }`}
                      >
                        {supabaseEnabled ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex justify-end gap-3 font-sans">
                    <button
                      type="submit"
                      disabled={savingSupabase}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer text-center"
                    >
                      {savingSupabase ? 'Updating Config...' : 'Save & Publish Supabase Integration'}
                    </button>
                  </div>
                </form>

                {/* Info side rail */}
                <div className="lg:col-span-4 space-y-6 text-slate-800 font-sans text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-inner">
                    <h4 className="text-xs font-black uppercase text-slate-850 tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-emerald-600" />
                      <span>Why Choose Supabase Auth?</span>
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                      Supabase provides stable, secure, and bulletproof user registration and token verification out-of-the-box. Unlike other external services, there are no sandbox popup constraints:
                    </p>
                    <div className="space-y-2 text-slate-500 text-[11px] leading-relaxed">
                      <p className="font-extrabold text-slate-850">Operational details:</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-550">
                        <li>Automatic database user records validation</li>
                        <li>High performance server-authoritative state checks</li>
                        <li>Safe cross-origin requests bypasses popups blocks</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-black uppercase text-blue-800 tracking-wider">Parameters Health Ping</h4>
                    <p className="text-xs text-blue-650 leading-relaxed font-sans font-medium">
                      Ensure your Supabase project instance handles external ping requests before putting it live. Execute a safe parameter verification:
                    </p>
                    <button
                      type="button"
                      disabled={testingSupabase}
                      onClick={handleTestSupabaseConnection}
                      className="w-full py-2.5 bg-blue-100 hover:bg-blue-150 text-blue-800 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all border border-blue-200 cursor-pointer text-center"
                    >
                      {testingSupabase ? 'Testing connection...' : 'Run Parameters Health Ping'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Database Tables and Schemas Panel */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Database className="w-5 h-5 text-emerald-600 animate-pulse" />
                      <span>STEP 1: Bootstrap Supabase Database Tables & Schema</span>
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-1">
                      To prevent <code className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded font-mono font-bold">Could not find table 'public.customer_profiles' in the schema cache</code> errors, you <b>must</b> execute this SQL script under your <b>Supabase Dashboard {`->`} SQL Editor</b> to create tables.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleFetchSchemaManually}
                      className="px-4 py-2.5 bg-slate-200 hover:bg-slate-350 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-300 cursor-pointer active:scale-[0.98]"
                      disabled={loadingSupabaseSchema}
                    >
                      {loadingSupabaseSchema ? 'Loading...' : 'Reload SQL'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyDatabaseSchema}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all border border-emerald-700 cursor-pointer active:scale-[0.98] shadow-md shadow-emerald-100"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full SQL Schema</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-[10.5px] text-slate-300 leading-relaxed overflow-x-auto max-h-[350px] relative">
                  <div className="absolute right-4 top-4 z-10">
                    <span className="bg-slate-850 border border-slate-700 text-slate-400 px-2 py-1 rounded text-[9px] font-bold font-mono tracking-wide uppercase">supabase_schema.sql</span>
                  </div>
                  <pre className="text-left select-all whitespace-pre">
                    {supabaseFullSchema || 'Loading active database schema from supabase_schema.sql... Please wait.'}
                  </pre>
                </div>
              </div>

              {/* Row Level Security Storage Policies panel */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-600 animate-pulse" />
                      <span>Configure Supabase Storage RLS Policies</span>
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Execute these policies in your Supabase SQL Editor to secure index file operations for the <b>'app-files'</b> bucket.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyStoragePolicies}
                    className="flex items-center gap-1.5 self-start sm:self-center px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-blue-200 cursor-pointer active:scale-[0.98]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL Snippet</span>
                  </button>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-[10.5px] text-slate-300 leading-relaxed overflow-x-auto max-h-[350px] relative">
                  <div className="absolute right-4 top-4 z-10">
                    <span className="bg-slate-850 border border-slate-700 text-slate-400 px-2 py-1 rounded text-[9px] font-bold font-mono tracking-wide uppercase">SQL Editor Code</span>
                  </div>
                  <pre className="text-left select-all whitespace-pre">
{`create policy "Users can view own files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);

create policy "Users can upload to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);

create policy "Users can update own files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);

create policy "Users can delete own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'app-files'
  and name like (auth.uid()::text || '/%')
);`}
                  </pre>
                </div>
              </div>

            </div>
          )}

          {/* View 12: HOSTINGER INTEGRATION PANELS */}
          {activeAdminTab === 'hostinger' && (
            <div className="space-y-6 animate-fade-in text-slate-800 font-sans" id="admin-panel-hostinger-gateway">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-600" />
                    <span>Hostinger MySQL Database Integration</span>
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Synchronize, load, and persist system accounts, orders, support tickets, and license registries on your Hostinger hosting database server.
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                  hostingerEnabled ? 'bg-indigo-50 text-indigo-700 border border-indigo-250' : 'bg-slate-100 text-slate-500 border border-slate-250'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${hostingerEnabled ? 'bg-indigo-500 animate-ping' : 'bg-slate-400'}`}></span>
                  <span>{hostingerEnabled ? 'HOSTINGER SQL ACTIVE' : 'LOCAL CACHE ONLY'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <form onSubmit={handleUpdateHostingerConfig} className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">Connection Credentials</span>
                    <p className="text-slate-500 text-[11px] mt-1">Set up your Hostinger Remote MySQL hosting values to query and execute transactions against your custom database.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-650 font-mono block">Database Host Address *</label>
                      <input
                        type="text"
                        required
                        placeholder="sql.hostinger.com or IP"
                        value={hostingerHost}
                        onChange={(e) => setHostingerHost(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-250 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-650 font-mono block">Database User Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="u123456789_user"
                        value={hostingerUser}
                        onChange={(e) => setHostingerUser(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-250 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-650 font-mono block">Database Port *</label>
                      <input
                        type="number"
                        required
                        placeholder="3306"
                        value={hostingerPort}
                        onChange={(e) => setHostingerPort(Number(e.target.value) || 3306)}
                        className="w-full bg-slate-50 border border-slate-250 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-650 font-mono block">Database Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="u123456789_database"
                        value={hostingerDatabase}
                        onChange={(e) => setHostingerDatabase(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-250 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-650 font-mono block">Database Password</label>
                      <input
                        type="password"
                        placeholder="•••••••••••••••••"
                        value={hostingerPass}
                        onChange={(e) => setHostingerPass(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-250 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 flex items-center justify-between gap-4 mt-6">
                    <div className="space-y-0.5">
                      <label className="text-xs font-extrabold text-slate-900 block">Enable Hostinger MySQL Database Layer</label>
                      <span className="text-[10px] text-slate-500 block">When active, data changes are replicated dynamically onto Hostinger MySQL tables.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHostingerEnabled(!hostingerEnabled)}
                      className={`font-black uppercase text-[10.5px] tracking-wider px-4 py-2 rounded-xl border border-slate-250 transition-all cursor-pointer ${
                        hostingerEnabled ? 'bg-indigo-600 text-white border-indigo-700 font-bold' : 'bg-slate-105 text-slate-705 hover:bg-slate-100'
                      }`}
                    >
                      {hostingerEnabled ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div className="pt-4 border-t flex justify-end gap-3 font-sans">
                    <button
                      type="submit"
                      disabled={savingHostinger}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer text-center"
                    >
                      {savingHostinger ? 'Updating Config...' : 'Save & Initialize Database'}
                    </button>
                  </div>
                </form>

                {/* Info side rail */}
                <div className="lg:col-span-4 space-y-6 text-slate-800 font-sans text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-inner">
                    <h4 className="text-xs font-black uppercase text-slate-850 tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      <span>Hostinger MySQL Integration</span>
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                      Store, fetch and sync users, invoices, digital licenses, promo coupons, blog articles and customer support tickets in real-time.
                    </p>
                    <div className="space-y-2 text-slate-500 text-[11px] leading-relaxed border-t pt-3">
                      <p className="font-extrabold text-slate-850">Features Included:</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-550">
                        <li>Automatic database tables generation</li>
                        <li>Non-blocking background replication queues</li>
                        <li>Safe fallback to local DB during connection breaks</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-black uppercase text-indigo-800 tracking-wider">Health Connection Ping</h4>
                    <p className="text-xs text-indigo-650 leading-relaxed font-sans font-medium">
                      Test your credentials and connection latency. Successful test automatically builds required tables.
                    </p>
                    <button
                      type="button"
                      disabled={testingHostinger}
                      onClick={handleTestHostingerConnection}
                      className="w-full py-2.5 bg-indigo-100 hover:bg-indigo-150 text-indigo-800 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all border border-indigo-200 cursor-pointer text-center"
                    >
                      {testingHostinger ? 'Verifying...' : 'Test Connection & Schema'}
                    </button>
                  </div>

                  <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black uppercase text-rose-800 tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Replicate Local Database</span>
                    </h4>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      Publishes all currently active records and settings configurations from the sandbox <b>(users, customer profiles, invoices, product records etc.)</b> directly to Hostinger, overriding any conflicts.
                    </p>
                    <button
                      type="button"
                      disabled={migratingHostinger}
                      onClick={handleReplicateToHostinger}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all border border-rose-700 cursor-pointer text-center shadow"
                    >
                      {migratingHostinger ? 'Replicating Live Catalog...' : 'Replicate Local Data to Hostinger'}
                    </button>
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
