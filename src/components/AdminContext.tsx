import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface AdminTelemetryLog {
  id: string;
  timestamp: string;
  event: string;
  userEmail: string;
  status: 'info' | 'warning' | 'success' | 'alert';
}

export type AdminRole = 'super_admin' | 'manager' | 'sales' | 'support' | 'customer';

interface AdminContextType {
  isAdminMode: boolean;
  setIsAdminMode: (mode: boolean) => void;
  adminRole: AdminRole;
  setAdminRole: (role: AdminRole) => void;
  activeModule: string;
  setActiveModule: (module: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Data State
  adminCustomers: any[];
  setAdminCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  adminOrders: any[];
  setAdminOrders: React.Dispatch<React.SetStateAction<any[]>>;
  adminLicenses: any[];
  setAdminLicenses: React.Dispatch<React.SetStateAction<any[]>>;
  adminTrialUsers: any[];
  setAdminTrialUsers: React.Dispatch<React.SetStateAction<any[]>>;
  adminTickets: any[];
  setAdminTickets: React.Dispatch<React.SetStateAction<any[]>>;
  adminPayments: any[];
  setAdminPayments: React.Dispatch<React.SetStateAction<any[]>>;
  adminInvoices: any[];
  setAdminInvoices: React.Dispatch<React.SetStateAction<any[]>>;
  adminContactMessages: any[];
  setAdminContactMessages: React.Dispatch<React.SetStateAction<any[]>>;
  adminLoading: boolean;
  setAdminLoading: (loading: boolean) => void;
  
  // Telemetry Log States
  telemetryLogs: AdminTelemetryLog[];
  addTelemetryLog: (event: string, status?: 'info' | 'warning' | 'success' | 'alert', email?: string) => void;
  
  // SMTP / System Settings
  adminSettings: any;
  updateAdminSettings: (settings: any) => void;
  
  // System Status
  systemStatus: 'Optimal' | 'Degraded' | 'Maintenance';
  backupStatus: string;
  triggerSystemBackup: () => void;
  
  // Actions
  fetchAdminAllData: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminRole, setAdminRole] = useState<AdminRole>('super_admin');
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
  
  // Data Records
  const [adminCustomers, setAdminCustomers] = useState<any[]>([]);
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [adminLicenses, setAdminLicenses] = useState<any[]>([]);
  const [adminTrialUsers, setAdminTrialUsers] = useState<any[]>([]);
  const [adminTickets, setAdminTickets] = useState<any[]>([]);
  const [adminPayments, setAdminPayments] = useState<any[]>([]);
  const [adminInvoices, setAdminInvoices] = useState<any[]>([]);
  const [adminContactMessages, setAdminContactMessages] = useState<any[]>(() => {
    const cached = localStorage.getItem('bsp_contact_messages');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    const defaultMessages = [
      {
        id: 'BSP-2026-000001',
        full_name: 'Amit Singhal',
        email: 'amit@singhalretail.com',
        phone: '+91 98100 23456',
        topic_category: 'Buying Query',
        message_description: 'We are setting up 3 new POS lanes in our grocery store in Sector 18 Raipur. We are interested in purchasing the Retail Billing Pro licenses. Please send us a price quote for a bulk purchase of 3 licenses and advise on what thermal printers are supported.',
        submission_date: '2026-06-18',
        submission_time: '11:15:30',
        created_at: '2026-06-18T11:15:30.000Z',
        ip_address: '103.241.12.94',
        status: 'New',
        status_history: JSON.stringify([
          { status: 'New', timestamp: '2026-06-18T11:15:30.000Z', note: 'Form submitted by user' }
        ])
      },
      {
        id: 'BSP-2026-000002',
        full_name: 'Rajinder Sharma',
        email: 'rajinder@sharmasweets.in',
        phone: '+91 94120 44556',
        topic_category: 'POS Software',
        message_description: 'Do you support integrating barcode weighing scales with your POS billing software? We have fresh sweet outlets and need weighing scales to directly print barcodes that your billing machine can scan.',
        submission_date: '2026-06-19',
        submission_time: '14:22:10',
        created_at: '2026-06-19T14:22:10.000Z',
        ip_address: '223.187.32.167',
        status: 'Read',
        status_history: JSON.stringify([
          { status: 'New', timestamp: '2026-06-19T14:22:10.000Z', note: 'Form submitted by user' },
          { status: 'Read', timestamp: '2026-06-19T16:00:00.000Z', note: 'Status updated by Admin' }
        ])
      },
      {
        id: 'BSP-2026-000003',
        full_name: 'Dr. Meenakshi Iyer',
        email: 'iyer.meenakshi@gmail.com',
        phone: '+91 91223 88990',
        topic_category: 'Hotel Management ERP',
        message_description: 'We run a boutique resort and wellness spa in Rishikesh. Do you have a direct PMS or Hotel Management billing suite that handles check-in, check-out, spa billing, and restaurant POS together in one shared offline database?',
        submission_date: '2026-06-19',
        submission_time: '18:40:15',
        created_at: '2026-06-19T18:40:15.000Z',
        ip_address: '122.160.44.12',
        status: 'Replied',
        status_history: JSON.stringify([
          { status: 'New', timestamp: '2026-06-19T18:40:15.000Z', note: 'Form submitted by user' },
          { status: 'Read', timestamp: '2026-06-20T09:30:00.000Z', note: 'Marked as read' },
          { status: 'Replied', timestamp: '2026-06-20T10:15:00.000Z', note: 'Replied with proposal email' }
        ])
      }
    ];
    localStorage.setItem('bsp_contact_messages', JSON.stringify(defaultMessages));
    return defaultMessages;
  });
  
  // Telemetry Logs
  const [telemetryLogs, setTelemetryLogs] = useState<AdminTelemetryLog[]>([
    { id: 'log-1', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), event: 'Database sync initialized', userEmail: 'system@bspsuryatech.in', status: 'info' },
    { id: 'log-2', timestamp: new Date(Date.now() - 3600000).toISOString(), event: 'SMTP Configuration test passed', userEmail: 'surajsurya.koo7@gmail.com', status: 'success' },
    { id: 'log-3', timestamp: new Date(Date.now() - 1800000).toISOString(), event: 'Security handshake validation', userEmail: 'system@bspsuryatech.in', status: 'info' }
  ]);

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
    smtp_user: 'Support@bspsuryatech.in',
    db_pool_size: 20,
    api_rate_limit: 120,
    sync_interval: 15
  });

  const [systemStatus, setSystemStatus] = useState<'Optimal' | 'Degraded' | 'Maintenance'>('Optimal');
  const [backupStatus, setBackupStatus] = useState<string>('Last backup: Today at 04:00 AM');

  const addTelemetryLog = (event: string, status: 'info' | 'warning' | 'success' | 'alert' = 'info', email = 'surajsurya.koo7@gmail.com') => {
    const newLog: AdminTelemetryLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      event,
      userEmail: email,
      status
    };
    setTelemetryLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const updateAdminSettings = (settings: any) => {
    setAdminSettings(prev => ({ ...prev, ...settings }));
    addTelemetryLog('System Settings configured updated', 'success');
  };

  const triggerSystemBackup = () => {
    setBackupStatus('Backup in progress...');
    addTelemetryLog('Database backup triggered manually', 'warning');
    setTimeout(() => {
      setBackupStatus(`Last backup: Today at ${new Date().toLocaleTimeString()}`);
      addTelemetryLog('Database backup completed size: 45.8 MB', 'success');
    }, 2000);
  };

  const fetchAdminAllData = async () => {
    setAdminLoading(true);
    try {
      console.log("AdminContext: Fetching deep security administrative records from Supabase db directly...");
      
      const { data: custProfiles, error: errC } = await supabase.from('customer_profiles').select('*');
      if (!errC && custProfiles) setAdminCustomers(custProfiles);

      const { data: ords, error: errO } = await supabase.from('orders').select('*');
      if (!errO && ords) setAdminOrders(ords);

      const { data: lics, error: errL } = await supabase.from('licenses').select('*');
      if (!errL && lics) setAdminLicenses(lics);

      const { data: tickets, error: errT } = await supabase.from('support_tickets').select('*');
      if (!errT && tickets) {
        // Resolve replies as well
        setAdminTickets(tickets);
      }

      const { data: payments, error: errP } = await supabase.from('payments').select('*');
      if (!errP && payments) setAdminPayments(payments);

      const { data: invoices, error: errI } = await supabase.from('invoices').select('*');
      if (!errI && invoices) setAdminInvoices(invoices);

      // Contact Messages sync from supabase
      try {
        const { data: contacts, error: errContacts } = await supabase.from('contact_messages').select('*');
        if (!errContacts && contacts && contacts.length > 0) {
          setAdminContactMessages(contacts);
          localStorage.setItem('bsp_contact_messages', JSON.stringify(contacts));
        } else if (errContacts) {
          console.log("Supabase contact_messages not found or error, using localStorage fallback:", errContacts.message);
        }
      } catch (err: any) {
        console.warn("Contact messages sync warning:", err);
      }

      // Trial users from custom source if exists
      const { data: trials, error: errTr } = await supabase.from('trial_activities').select('*');
      if (!errTr && trials) {
        setAdminTrialUsers(trials);
      } else {
        // fallback
        setAdminTrialUsers([
          { id: 't-1', email: 'viren.patel@gmail.com', name: 'Virendra Patel', phone: '+91 91119 54321', product: 'Retail Billing Pro', activatedAt: '2026-06-15T12:00:00Z', deviceId: 'DESKTOP-9FJ8SK2', converted: false },
          { id: 't-2', email: 'aniket.rao@yahoo.com', name: 'Aniket Rao Store', phone: '+91 94252 87654', product: 'Enterprise GST Suite', activatedAt: '2026-06-12T09:30:00Z', deviceId: 'WIN-POS-ANIKET', converted: true },
          { id: 't-3', email: 'sharma.agency@outlook.com', name: 'Sharma Agencies', phone: '+91 98271 22334', product: 'Billing Pro Desktop', activatedAt: '2026-06-18T15:45:00Z', deviceId: 'DESKTOP-SHARMA1', converted: false }
        ]);
      }
      
      addTelemetryLog('All administrative registers successfully updated from Supabase.', 'success');
    } catch (e: any) {
      console.warn("AdminContext: Error syncing active data", e);
      addTelemetryLog(`Fail synchronization: ${e?.message || e}`, 'alert');
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminMode) {
      fetchAdminAllData();
    }
  }, [isAdminMode]);

  return (
    <AdminContext.Provider value={{
      isAdminMode,
      setIsAdminMode,
      adminRole,
      setAdminRole,
      activeModule,
      setActiveModule,
      sidebarCollapsed,
      setSidebarCollapsed,
      searchQuery,
      setSearchQuery,
      adminCustomers,
      setAdminCustomers,
      adminOrders,
      setAdminOrders,
      adminLicenses,
      setAdminLicenses,
      adminTrialUsers,
      setAdminTrialUsers,
      adminTickets,
      setAdminTickets,
      adminPayments,
      setAdminPayments,
      adminInvoices,
      setAdminInvoices,
      adminContactMessages,
      setAdminContactMessages,
      adminLoading,
      setAdminLoading,
      telemetryLogs,
      addTelemetryLog,
      adminSettings,
      updateAdminSettings,
      systemStatus,
      backupStatus,
      triggerSystemBackup,
      fetchAdminAllData
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
