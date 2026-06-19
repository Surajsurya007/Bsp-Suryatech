import React, { useState, useEffect } from 'react';
import { useAdmin } from './AdminContext';
import { usePermission } from './PermissionProvider';
import { RoleGuard } from './RoleGuard';
import { supabase } from '../supabaseClient';
import { 
  BarChart, 
  Users, 
  CreditCard, 
  Key, 
  Settings, 
  Database, 
  Mail, 
  Download, 
  FileText, 
  Ticket, 
  Activity, 
  Shield, 
  Percent,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Clock,
  Eye,
  FileSpreadsheet,
  Globe,
  Lock,
  MessageSquare,
  Disc,
  Bell
} from 'lucide-react';

interface AdminRoutesProps {
  onAddNotification: (text: string, type: 'success' | 'info' | 'error') => void;
}

export const AdminRoutes: React.FC<AdminRoutesProps> = ({ onAddNotification }) => {
  const { 
    activeModule, 
    searchQuery,
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
    adminSettings,
    updateAdminSettings,
    telemetryLogs,
    addTelemetryLog,
    adminLoading,
    fetchAdminAllData
  } = useAdmin();

  const { canPerformAction, getRoleBadgeColor } = usePermission();

  // Selected sub-item details
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Forms states
  const [newCustomer, setNewCustomer] = useState({ client_name: '', business_name: '', email_address: '', contact_number: '', gst_number: '', state: '', city: '' });
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const [newLicenseEmail, setNewLicenseEmail] = useState('');
  const [newLicenseProduct, setNewLicenseProduct] = useState('BSP Suryatech Retail Billing Pro');
  const [newLicenseType, setNewLicenseType] = useState('1 Year License');
  const [generatedLicense, setGeneratedLicense] = useState('');

  // Module 5 (Software release form)
  const [newVersion, setNewVersion] = useState({ name: 'Pharmacy Plus POS', version: 'v1.4.0', size: '38.4 MB', changelog: 'Optimized stock alert formulas', downloadUrl: 'https://bspsuryatech.in/hosted/pharmacy-setup.exe' });
  const [softwareReleases, setSoftwareReleases] = useState<any[]>([
    { id: '1', name: 'BSP Suryatech Retail Billing Pro', version: 'v4.2.2', size: '42.1 MB', changelog: 'Stable build, fast receipt layouts', status: 'Stable', downloadUrl: 'https://bspsuryatech.in/downloads/setup-pro.exe' },
    { id: '2', name: 'BSP Suryatech GST Enterprise Suite', version: 'v2.1.0', size: '108.5 MB', changelog: 'Multi-device GST ledger compilation', status: 'Stable', downloadUrl: 'https://bspsuryatech.in/downloads/gst-setup.exe' }
  ]);

  // Module 8 email composer
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailDraftStatus, setEmailDraftStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Module 11 PDF Report export logic simulator
  const [reportType, setReportType] = useState('quarterly-gst');
  const [generatingReport, setGeneratingReport] = useState(false);

  // Module 15 Database Manager Raw SQL box
  const [rawSqlInput, setRawSqlInput] = useState('SELECT * FROM public.customer_profiles LIMIT 10;');
  const [rawSqlResult, setRawSqlResult] = useState<any | null>(null);
  const [sqlRunning, setSqlRunning] = useState(false);

  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Function to copy text helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    onAddNotification("Key Copied successfully!", "success");
    setTimeout(() => setCopiedKeyId(null), 1500);
  };

  // Create an administrative user profile direct
  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.client_name || !newCustomer.email_address) {
      onAddNotification("Name and Email are required.", "error");
      return;
    }
    try {
      addTelemetryLog(`Provisioning new database client record for: ${newCustomer.client_name}`, 'info');
      const mockId = `cl-${Math.floor(Math.random() * 90000) + 10000}`;
      const fullRecord = {
        id: mockId,
        user_id: `user-${mockId}`,
        client_name: newCustomer.client_name,
        business_name: newCustomer.business_name || 'BSP Associate Member',
        email_address: newCustomer.email_address,
        contact_number: newCustomer.contact_number || '+91 99999 99999',
        gst_number: newCustomer.gst_number || 'NA',
        state: newCustomer.state || 'Chhattisgarh',
        city: newCustomer.city || 'Raipur',
        created_at: new Date().toISOString()
      };

      // Push to local context
      setAdminCustomers(prev => [fullRecord, ...prev]);
      
      // Attempt supabase insert
      await supabase.from('customer_profiles').insert([{
        user_id: fullRecord.user_id,
        client_name: fullRecord.client_name,
        business_name: fullRecord.business_name,
        email_address: fullRecord.email_address,
        contact_number: fullRecord.contact_number,
        gst_number: fullRecord.gst_number,
        state: fullRecord.state,
        city: fullRecord.city
      }]);

      onAddNotification(`Corporate entity profile "${newCustomer.client_name}" indexed successfully!`, "success");
      addTelemetryLog(`Corporate entity "${newCustomer.client_name}" saved directly.`, 'success');
      setNewCustomer({ client_name: '', business_name: '', email_address: '', contact_number: '', gst_number: '', state: '', city: '' });
      setShowAddCustomer(false);
    } catch (err: any) {
      onAddNotification(`Failed saving record: ${err.message}`, "error");
    }
  };

  // Generate License Server key matching
  const handleGenerateLicenseKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLicenseEmail) {
      onAddNotification("Please enter recipient email.", "error");
      return;
    }
    try {
      const segments = [
        Math.random().toString(36).substring(2, 6).toUpperCase(),
        Math.random().toString(36).substring(2, 6).toUpperCase(),
        Math.random().toString(36).substring(2, 6).toUpperCase(),
        Math.random().toString(36).substring(2, 6).toUpperCase()
      ];
      const newlyKey = `BSP-${newLicenseProduct.includes("Enterprise") ? "ENT" : "RTL"}-${segments.join('-')}`;
      setGeneratedLicense(newlyKey);

      const mockId = `lic-${Date.now()}`;
      const fullLic = {
        id: mockId,
        user_id: `user-${mockId}`,
        user_email: newLicenseEmail,
        order_id: `ord-${Math.floor(Math.random() * 90000)}`,
        product_id: newLicenseProduct.includes("Enterprise") ? "prod-billing-enterprise" : "prod-billing-pro",
        product_name: newLicenseProduct,
        license_key: newlyKey,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
      };

      setAdminLicenses(prev => [fullLic, ...prev]);

      // Direct write to Supabase licenses if allowed
      await supabase.from('licenses').insert([{
        user_id: fullLic.user_id,
        user_email: fullLic.user_email,
        order_id: fullLic.order_id,
        product_id: fullLic.product_id,
        product_name: fullLic.product_name,
        license_key: fullLic.license_key,
        status: fullLic.status,
        expires_at: fullLic.expires_at
      }]);

      addTelemetryLog(`License Key "${newlyKey}" issued to: ${newLicenseEmail}`, 'success');
      onAddNotification(`Active license key created is now live!`, "success");
    } catch (err: any) {
      onAddNotification(`Failed to issue license: ${err.message}`, "error");
    }
  };

  // Revoke license handler
  const handleRevokeLicense = async (licId: string, keyVal: string) => {
    if (!canPerformAction('revoke_license')) {
      onAddNotification("Restricted: Manager or Super Admin role only.", "error");
      return;
    }
    if (!window.confirm(`Are you absolutely sure you want to revoke key: ${keyVal}? This will cut offline device sync immediately!`)) return;

    try {
      setAdminLicenses(prev => prev.map(l => l.id === licId ? { ...l, status: 'revoked' } : l));
      await supabase.from('licenses').update({ status: 'revoked' }).eq('id', licId);
      addTelemetryLog(`Revoked active serial: ${keyVal} abruptly.`, 'warning');
      onAddNotification("License revoked successfully.", "success");
    } catch (err: any) {
      onAddNotification(`Failed: ${err.message}`, "error");
    }
  };

  // Approve Bank offline payment referenced
  const handleApproveEscrowPayment = async (orderId: string, email: string, amount: number) => {
    if (!canPerformAction('approve_payment')) {
      onAddNotification("Unauthorized: Sales or Admin role only.", "error");
      return;
    }
    try {
      setAdminOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Verified' } : o));
      await supabase.from('orders').update({ status: 'Verified' }).eq('id', orderId);
      
      // Also generate a key automatically
      const newlyKey = `BSP-AUTO-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await supabase.from('licenses').insert([{
        user_id: `usr-${orderId}`,
        user_email: email,
        order_id: orderId,
        product_id: 'prod-billing-pro',
        product_name: 'BSP Suryatech Retail Billing Pro',
        license_key: newlyKey,
        status: 'active',
        expires_at: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
      }]);

      // Write payment success record
      await supabase.from('payments').insert([{
        order_id: orderId,
        user_id: `usr-${orderId}`,
        invoice_number: `INV-26-${Math.floor(Math.random() * 90000)}`,
        amount: amount,
        payment_method: 'Manual Bank Escrow',
        transaction_id: `UTR-${Math.floor(Math.random() * 9000000000)}`,
        status: 'captured'
      }]);

      onAddNotification(`Escrow references approved! Order ${orderId} verified & auto-license generated.`, "success");
      addTelemetryLog(`Escrow verification success for account ${email}. Paid ₹${amount}`, 'success');
      fetchAdminAllData();
    } catch (err: any) {
      onAddNotification(`Error: ${err.message}`, "error");
    }
  };

  // Reject/Prune pending order
  const handleRejectEscrowPayment = async (orderId: string) => {
    try {
      setAdminOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'failed' } : o));
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId);
      onAddNotification(`Escrow order rejected and marked as failed.`, "info");
      addTelemetryLog(`Escrow order rejected: ${orderId}`, 'warning');
    } catch (e: any) {
      onAddNotification(e.message, "error");
    }
  };

  // Module 10 replies ticket
  const handleSendTicketReply = async () => {
    if (!adminReplyText) return;
    setSubmittingReply(true);
    try {
      const replyObj = {
        id: `rep-${Date.now()}`,
        authorName: 'BSP Support desk Office',
        authorRole: 'admin',
        message: adminReplyText,
        createdAt: new Date().toISOString()
      };

      const updatedReplies = [...(selectedTicket.replies || []), replyObj];
      
      // Write locally
      setAdminTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, replies: updatedReplies } : t));
      setSelectedTicket(prev => ({ ...prev, replies: updatedReplies }));

      // Write to supabase
      await supabase.from('support_tickets').update({
        replies: updatedReplies
      }).eq('id', selectedTicket.id);

      addTelemetryLog(`Replied support desk ticket: "${selectedTicket.title}"`, 'success');
      setAdminReplyText('');
      onAddNotification("Ticketing reply sent successfully.", "success");
    } catch (err: any) {
      onAddNotification(`Failed: ${err.message}`, "error");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      setAdminTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'resolved' } : t));
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: 'resolved' }));
      }
      await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', ticketId);
      onAddNotification(`Support ticket resolved. Email trigger sent to lead source.`, "success");
      addTelemetryLog(`Support ticket resolved: ID ${ticketId}`, 'success');
    } catch (e: any) {
      onAddNotification(e.message, "error");
    }
  };

  // Module 5 version release publisher
  const handlePublishVersion = (e: React.FormEvent) => {
    e.preventDefault();
    const rel = {
      id: `${Date.now()}`,
      name: newVersion.name,
      version: newVersion.version,
      size: newVersion.size,
      changelog: newVersion.changelog,
      status: 'Stable',
      downloadUrl: newVersion.downloadUrl
    };
    setSoftwareReleases(prev => [rel, ...prev]);
    addTelemetryLog(`Deployed binary release payload version: ${newVersion.version} for ${newVersion.name}`, 'success');
    onAddNotification(`Binary update ${newVersion.version} deployed to client portals!`, "success");
    setNewVersion({ name: 'Pharmacy Plus POS', version: '', size: '', changelog: '', downloadUrl: '' });
  };

  // Module 8 email transmitter
  const handleSendMassEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject || !emailBody) {
      onAddNotification("Subject and content are required.", "error");
      return;
    }
    setEmailDraftStatus('sending');
    setTimeout(() => {
      setEmailDraftStatus('sent');
      addTelemetryLog(`Broadcasted update announcement to ${adminCustomers.length || 10} subscribers.`, 'success');
      onAddNotification(`Mass transmission completed via SMTP: ${emailSubject}`, "success");
      setEmailSubject('');
      setEmailBody('');
      setTimeout(() => setEmailDraftStatus('idle'), 3000);
    }, 2000);
  };

  // Module 11 PDF template generator
  const handleTriggerReportGeneration = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingReport(true);
    addTelemetryLog(`Generating analytical invoice CSV & PDF logs matching: ${reportType}`, 'info');
    setTimeout(() => {
      setGeneratingReport(false);
      onAddNotification(`Export completed! ${reportType.toUpperCase()} spreadsheet processed successfully.`, "success");
      addTelemetryLog(`Analytical summary PDF generated size 2.1 MB.`, 'success');
    }, 2000);
  };

  // Module 15 SQL box runner
  const handleExecuteRawSql = () => {
    if (!canPerformAction('raw_sql_execution')) {
      onAddNotification("Security Failure: Strict write permissions blocked for manager levels.", "error");
      return;
    }
    setSqlRunning(true);
    addTelemetryLog(`Executing Raw SQL statement directly...`, 'warning');
    setTimeout(() => {
      setSqlRunning(false);
      setRawSqlResult({
        columns: ['id', 'user_id', 'client_name', 'business_name', 'email_address', 'gst_number', 'created_at'],
        rows: adminCustomers.slice(0, 3).map(c => [
          c.id, c.user_id, c.client_name, c.business_name, c.email_address, c.gst_number, c.created_at
        ]),
        execution_time_ms: 12.4,
        status: 'SUCCESS 200 OK'
      });
      addTelemetryLog(`Raw SQL execution completed successfully directly in 12.4ms.`, 'success');
      onAddNotification("Direct Supabase raw query processed successfully.", "success");
    }, 1200);
  };

  // Prune helper
  const handleDeleteCustomerProfile = async (id: string, name: string) => {
    if (!canPerformAction('delete_customer')) {
      onAddNotification("Unauthorised: Delete action requiring manager level role.", "error");
      return;
    }
    if (!window.confirm(`Prune corporate entities list? Clicking OK will delete client "${name}"`)) return;
    try {
      setAdminCustomers(prev => prev.filter(c => c.id !== id));
      await supabase.from('customer_profiles').delete().eq('id', id);
      addTelemetryLog(`Deleted customer profile index: ${name}`, 'warning');
      onAddNotification("Corporate client pruned successfully.", "success");
    } catch (e: any) {
      onAddNotification(e.message, "error");
    }
  };

  // Filter lists based on the unified search bar on the sidebar
  const filteredCustomers = adminCustomers.filter(c => 
    Object.values(c).some(val => String(val).toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const filteredLicenses = adminLicenses.filter(l => 
    Object.values(l).some(val => String(val).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredOrders = adminOrders.filter(o => 
    Object.values(o).some(val => String(val).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTickets = adminTickets.filter(t => 
    Object.values(t).some(val => String(val).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div id="bsp-admin-routes-panel" className="space-y-6">
      
      {/* -------------------- MODULE 1: DASHBOARD OVERVIEW -------------------- */}
      {activeModule === 'dashboard' && (
        <RoleGuard moduleId="dashboard">
          <div className="space-y-6 animate-fade-in" id="admin-module-1">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none flex items-center gap-2">
                  <BarChart size={18} className="text-red-650" />
                  <span>BSP Suryatech Administrative Hub</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1.5">Consolidated cockpit showing trial pipelines, escrow verification buffers, support SLA loads, and active software deployments.</p>
              </div>
              <button 
                onClick={fetchAdminAllData}
                disabled={adminLoading}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-mono text-[10.5px] font-black tracking-wider rounded-xl border border-slate-800 shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={12} className={adminLoading ? 'animate-spin' : ''} />
                <span>SYNC ALL DATA REGISTERS</span>
              </button>
            </div>

            {/* Quick KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border p-4 rounded-2xl shadow-sm text-left">
                <span className="text-[10px] font-bold text-slate-500 font-mono tracking-widest block uppercase">Quarterly Indian Revenue</span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-2xl font-black text-slate-800 leading-none">₹{adminPayments.reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString('en-IN')}</span>
                  <span className="text-[10.5px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-mono">+12.4%</span>
                </div>
                <p className="text-[10px] text-slate-455 mt-2.5 font-mono">From {adminPayments.length || 5} capture nodes</p>
              </div>

              <div className="bg-white border p-4 rounded-2xl shadow-sm text-left">
                <span className="text-[10px] font-bold text-slate-500 font-mono tracking-widest block uppercase">Escrow Queue Buffer</span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-2xl font-black text-amber-600 leading-none">{adminOrders.filter(o => o.status === 'Pending Verification').length || 0} Open</span>
                  <span className="text-[10.5px] font-mono text-amber-500 font-bold bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">Action Req</span>
                </div>
                <p className="text-[10px] text-slate-455 mt-2.5 font-mono">Awaiting UTR check verify</p>
              </div>

              <div className="bg-white border p-4 rounded-2xl shadow-sm text-left">
                <span className="text-[10px] font-bold text-slate-500 font-mono tracking-widest block uppercase">Administered Licenses</span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-2xl font-black text-slate-800 leading-none">{adminLicenses.length || 0} Serials</span>
                  <span className="text-[10.5px] font-bold text-slate-500 font-mono bg-slate-100 border px-1.5 py-0.5 rounded">Deploy node</span>
                </div>
                <p className="text-[10px] text-slate-455 mt-2.5 font-mono">{adminLicenses.filter(l => l.status === 'active').length || 0} active offline devices</p>
              </div>

              <div className="bg-white border p-4 rounded-2xl shadow-sm text-left">
                <span className="text-[10px] font-bold text-slate-500 font-mono tracking-widest block uppercase">Support Helpdesk Load</span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-2xl font-black text-red-650 leading-none">{adminTickets.filter(t => t.status === 'open').length || 0} Unresolved</span>
                  <span className="text-[10.5px] font-mono text-red-600 font-bold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">SLA Desk</span>
                </div>
                <p className="text-[10px] text-slate-455 mt-2.5 font-mono">Avg ticket response time: 24m</p>
              </div>
            </div>

            {/* Quick tables / activity list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Escrow approvals card */}
              <div className="bg-white border rounded-2xl p-5 shadow-sm lg:col-span-2 text-left space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-xs font-black font-mono uppercase text-slate-800">Pending Bank Escrow Approvals</h3>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[9.5px] font-bold font-mono">Module 3 Priority</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b text-slate-400">
                        <th className="py-2 text-left">ORDER ID</th>
                        <th className="py-2 text-left">CUSTOMER / EMAIL</th>
                        <th className="py-2 text-left">PRODUCT</th>
                        <th className="py-2 text-right">PRICE</th>
                        <th className="py-2 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {adminOrders.filter(o => o.status === 'Pending Verification').length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400 text-[11px]">All payment escrows cleared. No items pending validation.</td>
                        </tr>
                      ) : (
                        adminOrders.filter(o => o.status === 'Pending Verification').slice(0, 4).map((o, idx) => (
                          <tr key={o.id || idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 text-slate-700 font-extrabold">{o.id}</td>
                            <td className="py-2.5 text-slate-600 leading-none font-medium">
                              <div>{o.customerName || 'Anonymous'}</div>
                              <span className="text-[10px] text-slate-433 font-light block mt-0.5">{o.userEmail}</span>
                            </td>
                            <td className="py-2.5 text-slate-600 text-[11px] font-light max-w-[120px] truncate">{o.productName || 'Billing Setup'}</td>
                            <td className="py-2.5 text-slate-800 text-right font-black">₹{(o.amount || 3000).toLocaleString('en-IN')}</td>
                            <td className="py-2.5 text-right space-x-1.5 shrink-0">
                              <button 
                                onClick={() => handleApproveEscrowPayment(o.id, o.userEmail, o.amount || 3000)}
                                className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-250 cursor-pointer rounded font-black text-[10px]"
                              >
                                APPROVE
                              </button>
                              <button 
                                onClick={() => handleRejectEscrowPayment(o.id)}
                                className="px-2 py-0.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-250 cursor-pointer rounded font-black text-[10px]"
                              >
                                SKP
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status / logs console right */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 shadow-lg text-left text-white flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-black font-mono tracking-widest text-slate-433 uppercase">TELEMETRY Handshake Logs</span>
                    <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />
                  </div>
                  
                  <div className="space-y-3 max-h-[220px] overflow-y-auto scrollbar-thin">
                    {telemetryLogs.slice(0, 5).map((l, idx) => (
                      <div key={l.id || idx} className="text-[10.5px] font-mono leading-none border-b border-slate-900 pb-2 last:border-b-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-extrabold">{new Date(l.timestamp).toLocaleTimeString()}</span>
                          <span className={`text-[8.5px] font-black uppercase tracking-wider px-1 border rounded ${
                            l.status === 'success' ? 'bg-lime-950/20 text-lime-400 border-lime-900' :
                            l.status === 'warning' ? 'bg-amber-950/20 text-amber-400 border-amber-900' :
                            l.status === 'alert' ? 'bg-red-950/20 text-red-400 border-red-900' : 'bg-slate-900 text-indigo-400 border-indigo-900'
                          }`}>{l.status}</span>
                        </div>
                        <p className="text-slate-200 mt-1 line-clamp-1">{l.event}</p>
                        <span className="text-[9px] text-slate-500 block truncate">{l.userEmail}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Heartbeat check: OK</span>
                  <span>Port Ingress: SSL 3000</span>
                </div>
              </div>

            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 2: CUSTOMER MANAGEMENT -------------------- */}
      {activeModule === 'customers' && (
        <RoleGuard moduleId="customers">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Users size={17} className="text-red-650" />
                  <span>Module 2: Corporate Customer Profiles</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">Configure company profiles, index offline clients with GSTIN credentials, search corporate users.</p>
              </div>
              <button 
                onClick={() => setShowAddCustomer(!showAddCustomer)}
                className="px-3.5 py-1.5 bg-red-750 hover:bg-red-700 text-white text-xs font-black tracking-wide rounded-xl shadow cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>INDEX NEW CLIENT</span>
              </button>
            </div>

            {/* Quick Customer Addition Form */}
            {showAddCustomer && (
              <form onSubmit={handleAddCustomerSubmit} className="bg-slate-50 p-4 border rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3 animate-fade-in text-slate-800 text-xs">
                <div className="space-y-1 text-left">
                  <label className="font-bold text-slate-600 block">Client Contact Name *</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Suraj Suryavanshi"
                    value={newCustomer.client_name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, client_name: e.target.value }))}
                    className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-red-650"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="font-bold text-slate-600 block">Corporate Business Name</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Suryatech Agencies Pvt Ltd"
                    value={newCustomer.business_name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, business_name: e.target.value }))}
                    className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-red-650"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="font-bold text-slate-600 block">Email Address *</label>
                  <input 
                    type="email" 
                    placeholder="E.g., suraj@gmail.com"
                    value={newCustomer.email_address}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email_address: e.target.value }))}
                    className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-red-650"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="font-bold text-slate-600 block flex justify-between">
                    <span>GSTIN Number</span>
                    <span className="text-[10px] text-slate-400 font-light">15 Char</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="E.g., 22AAAAA0000A1Z5"
                    value={newCustomer.gst_number}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, gst_number: e.target.value.toUpperCase() }))}
                    className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-red-650 font-mono"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="font-bold text-slate-600 block">Contact Phone</label>
                  <input 
                    type="text" 
                    placeholder="+91 99999 99999"
                    value={newCustomer.contact_number}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, contact_number: e.target.value }))}
                    className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-red-650"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="font-bold text-slate-600 block">Billing State</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Chhattisgarh"
                    value={newCustomer.state}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-red-650"
                  />
                </div>
                <div className="col-span-1 md:col-span-2 flex items-end gap-2 text-right">
                  <button type="submit" className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition">Save Index Profile</button>
                  <button type="button" onClick={() => setShowAddCustomer(false)} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition">Cancel</button>
                </div>
              </form>
            )}

            {/* Customers Table list */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-500 font-bold">
                    <th className="p-3">CLIENT ID</th>
                    <th className="p-3 font-extrabold">CLIENT DETAILS</th>
                    <th className="p-3">BUSINESS ENTITY / GSTIN</th>
                    <th className="p-3">CONTACT</th>
                    <th className="p-3">PLACE OF SUPPLY</th>
                    <th className="p-3 text-right">REMOVE</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">No matching search, or customer profiles directory is empty.</td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c, idx) => (
                      <tr key={c.id || idx} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-850 font-bold">{c.id}</td>
                        <td className="p-3">
                          <div className="font-sans font-extrabold text-slate-800 text-[12.5px] leading-tight">{c.client_name}</div>
                          <span className="text-[10px] text-slate-500 font-light mt-0.5 block">{c.email_address}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-sans font-medium text-slate-700">{c.business_name}</div>
                          <span className="text-[9.5px] font-black text-rose-700 bg-rose-50 border px-1 rounded block w-fit mt-1 font-mono tracking-wider">{c.gst_number || 'UNREGISTERED/B2C'}</span>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{c.contact_number || '+91 95169 16415'}</td>
                        <td className="p-3 text-slate-500 font-normal">{c.city}, {c.state}</td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => handleDeleteCustomerProfile(c.id, c.client_name)}
                            className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer inline-block"
                            title="Delete profile"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 3: PAYMENT MANAGEMENT -------------------- */}
      {activeModule === 'payments' && (
        <RoleGuard moduleId="payments">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-3">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <CreditCard size={17} className="text-red-650" />
              <span>Module 3: Bank Payment & Escrow Clearance Register</span>
            </h3>

            {/* List payments */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-500">
                    <th className="p-3 text-left">TRANSACTION REFERENCE</th>
                    <th className="p-3 text-left">INVOICE NUMBER</th>
                    <th className="p-3 text-left">PAYMENT TYPE</th>
                    <th className="p-3 text-right">COLLECTION AMOUNT</th>
                    <th className="p-3 text-center">GATEWAY CAPTURE</th>
                    <th className="p-3 text-right">DATE STAMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {adminPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">No finalized payment collection records loaded. Check escrows list in Module 1.</td>
                    </tr>
                  ) : (
                    adminPayments.map((p, idx) => (
                      <tr key={p.id || p.transaction_id || idx} className="hover:bg-slate-50">
                        <td className="p-3">
                          <span className="font-black text-slate-800">{p.transaction_id || 'MOCK-TXN-ID'}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Order association: {p.order_id}</span>
                        </td>
                        <td className="p-3 text-slate-650 font-bold">{p.invoice_number}</td>
                        <td className="p-3 text-slate-500 py-1.5 uppercase tracking-wide">{p.payment_method || 'Online Card'}</td>
                        <td className="p-3 text-right font-black text-slate-800 text-[13px]">₹{(p.amount || 3000).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded font-black text-[9px] bg-emerald-50 text-emerald-800 border-emerald-100 border">CAPTURED</span>
                        </td>
                        <td className="p-3 text-right text-slate-455">{new Date(p.payment_date || p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 4: LICENSE MANAGEMENT -------------------- */}
      {activeModule === 'licenses' && (
        <RoleGuard moduleId="licenses">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-4">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <Key size={17} className="text-red-650" />
              <span>Module 4: Global Offline Device License Registry</span>
            </h3>

            {/* Quick Generator */}
            <form onSubmit={handleGenerateLicenseKeySubmit} className="bg-slate-50 p-4 border rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-slate-800">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Recipient Email Address *</label>
                <input 
                  type="email" 
                  placeholder="E.g., client@retailer.com"
                  value={newLicenseEmail}
                  onChange={(e) => setNewLicenseEmail(e.target.value)}
                  className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-red-650"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Product Plan Target</label>
                <select 
                  value={newLicenseProduct}
                  onChange={(e) => setNewLicenseProduct(e.target.value)}
                  className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-red-650 font-bold"
                >
                  <option value="BSP Suryatech Retail Billing Pro">BSP Suryatech Retail Billing Pro</option>
                  <option value="BSP Suryatech GST Enterprise Suite">BSP Suryatech GST Enterprise Suite</option>
                  <option value="BSP Restaurant POS Special Edition">BSP Restaurant POS Special Edition</option>
                  <option value="BSP Pharmacy Plus ERP Suite">BSP Pharmacy Plus ERP Suite</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Expiration Term Duration</label>
                <select 
                  value={newLicenseType}
                  onChange={(e) => setNewLicenseType(e.target.value)}
                  className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-red-650 font-bold"
                >
                  <option value="30 Days Trial">30 Days Trial</option>
                  <option value="1 Year License">1 Year License</option>
                  <option value="3 Years Extended Suite">3 Years Extended Suite</option>
                  <option value="Lifetime Offline Standard License">Lifetime Offline Standard License</option>
                </select>
              </div>

              <div className="flex items-end text-right">
                <button type="submit" className="w-full py-2 bg-red-750 text-white rounded-lg font-black hover:bg-red-700 hover:shadow shadow-md transition cursor-pointer">
                  PROVISION KEY
                </button>
              </div>
            </form>

            {generatedLicense && (
              <div className="bg-emerald-50 border border-emerald-150 p-3.5 rounded-xl flex items-center justify-between text-slate-800 text-xs animate-fade-in font-mono">
                <div>
                  <span className="font-bold text-slate-500 uppercase block text-[9.5px]">GENERATED DEPLOYMENT SERIAL KEY</span>
                  <div className="text-[13.5px] font-black text-emerald-850 tracking-widest mt-1 uppercase select-all">{generatedLicense}</div>
                </div>
                <button 
                  onClick={() => handleCopyText(generatedLicense, 'copy-lic')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10.5px] font-black tracking-wider shadow cursor-pointer transition flex items-center gap-1.5"
                >
                  {copiedKeyId === 'copy-lic' ? 'COPIED!' : 'COPY TO CLIPBOARD'}
                </button>
              </div>
            )}

            {/* List Licenses */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-500 font-bold text-[10.5px]">
                    <th className="p-3">LICENSE SERIAL KEY</th>
                    <th className="p-3">RECIPIENT EMAIL</th>
                    <th className="p-3">CONNECTED HARDWARE SUITE</th>
                    <th className="p-3 text-center">DEVICE STATUS</th>
                    <th className="p-3 text-left">EXPIRATION TARGET</th>
                    <th className="p-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[11px]">
                  {filteredLicenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">No active serials indexed. Use search/form parameters above to generate one.</td>
                    </tr>
                  ) : (
                    filteredLicenses.map((l, idx) => (
                      <tr key={l.id || idx} className="hover:bg-slate-50">
                        <td className="p-3">
                          <span className="font-black text-slate-800 leading-none select-all tracking-wider block font-mono text-[11.5px]">{l.license_key}</span>
                          <span className="text-[9.5px] text-slate-400 block mt-1">Issued association: {l.id}</span>
                        </td>
                        <td className="p-3 font-medium text-slate-650">{l.user_email || 'client-terminal@retail.com'}</td>
                        <td className="p-3 text-slate-500 truncate max-w-[170px]" title={l.product_name}>{l.product_name}</td>
                        <td className="p-3 text-center py-1">
                          <span className={`px-2 py-0.5 rounded font-black text-[9px] border inline-block ${
                            l.status === 'active' 
                              ? 'bg-lime-50 text-lime-800 border-lime-150' 
                              : 'bg-rose-50 text-rose-800 border-rose-150'
                          }`}>
                            {l.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-slate-555 font-light" title={l.expires_at}>{new Date(l.expires_at).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          {l.status === 'active' && (
                            <button 
                              onClick={() => handleRevokeLicense(l.id, l.license_key)}
                              className="px-2 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-extrabold text-[9.5px] rounded cursor-pointer transition"
                            >
                              REVOKE
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 5: SOFTWARE MANAGEMENT -------------------- */}
      {activeModule === 'software' && (
        <RoleGuard moduleId="software">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-5">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <Disc size={17} className="text-red-650" />
              <span>Module 5: Offline Binary Release Publisher</span>
            </h3>

            {/* Version release publisher form */}
            <form onSubmit={handlePublishVersion} className="bg-slate-50 p-4 border rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-slate-800">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Product Suite Module</label>
                <input 
                  type="text" 
                  placeholder="E.g., Billing Retail Pro"
                  value={newVersion.name}
                  onChange={(e) => setNewVersion(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-red-650 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Release tag (Version)</label>
                <input 
                  type="text" 
                  placeholder="E.g., v4.2.3"
                  value={newVersion.version}
                  onChange={(e) => setNewVersion(prev => ({ ...prev, version: e.target.value }))}
                  className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-red-650 font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Binary payload file size</label>
                <input 
                  type="text" 
                  placeholder="E.g., 45.2 MB"
                  value={newVersion.size}
                  onChange={(e) => setNewVersion(prev => ({ ...prev, size: e.target.value }))}
                  className="w-full p-2 border bg-white rounded-lg focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Direct CDN download URL</label>
                <input 
                  type="text" 
                  placeholder="E.g., https://bspsuryatech.in/hosted.exe"
                  value={newVersion.downloadUrl}
                  onChange={(e) => setNewVersion(prev => ({ ...prev, downloadUrl: e.target.value }))}
                  className="w-full p-2 border bg-white rounded-lg focus:outline-none"
                />
              </div>
              <div className="col-span-1 md:col-span-3 space-y-1">
                <label className="font-bold text-slate-600 block">Changelogs & Fixes metadata</label>
                <textarea 
                  rows={2}
                  placeholder="Summary of bugs patched (thermal formatting fixes, CGST accounting modules, local backup optimizations)..."
                  value={newVersion.changelog}
                  onChange={(e) => setNewVersion(prev => ({ ...prev, changelog: e.target.value }))}
                  className="w-full p-2 border bg-white rounded-lg focus:outline-none"
                />
              </div>
              <div className="col-span-1 flex items-end">
                <button type="submit" className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-lg tracking-wider hover:shadow transition cursor-pointer">
                  PUBLISH UPDATE
                </button>
              </div>
            </form>

            {/* List release histories */}
            <div className="space-y-3">
              <h4 className="text-xs font-black font-mono uppercase text-slate-500">Live Production Installer Builds</h4>
              <div className="space-y-2.5">
                {softwareReleases.map((r, idx) => (
                  <div key={r.id || idx} className="bg-slate-50 border p-3 rounded-xl flex items-start justify-between text-xs text-slate-800 font-mono">
                    <div className="space-y-1 max-w-[70%]">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-black text-slate-800 text-[13px]">{r.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border font-extrabold text-[9px] uppercase">{r.status}</span>
                      </div>
                      <p className="text-slate-555 leading-normal mt-1"><span className="font-extrabold text-slate-600">Patch notes:</span> {r.changelog}</p>
                      <span className="text-[10px] text-slate-433 font-light block mt-0.5">Size tag: {r.size} • Version release payload: {r.version}</span>
                    </div>
                    <button 
                      onClick={() => handleCopyText(r.downloadUrl, `url-${r.id}`)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] border rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer font-bold shrink-0"
                    >
                      <Copy size={11} />
                      <span>{copiedKeyId === `url-${r.id}` ? 'COPIED URL!' : 'COPY CDN URL'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 6: DOWNLOAD CENTER MONITOR -------------------- */}
      {activeModule === 'downloads' && (
        <RoleGuard moduleId="downloads">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-6">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <Download size={17} className="text-red-650" />
              <span>Module 6: Offline Binary Download Analytics Center</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-slate-50 border p-4 rounded-xl">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block font-mono">GLOBAL DOWNLOAD COUNTS</span>
                <span className="text-2xl font-black text-slate-800 mt-2 block leading-none">1,420 pulls</span>
                <p className="text-[9.5px] text-slate-500 mt-2 font-light">Includes Retail Pro as dominant component (82%).</p>
              </div>
              <div className="bg-slate-50 border p-4 rounded-xl">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block font-mono">CDN CACHE EFFICIENCY</span>
                <span className="text-2xl font-black text-emerald-605 mt-2 block leading-none">99.82% HIT</span>
                <p className="text-[9.5px] text-slate-500 mt-2 font-light">Cloudflare backup nodes Raipur sync operational.</p>
              </div>
              <div className="bg-slate-50 border p-4 rounded-xl">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block font-mono">CLIENT DESKTOP CRASHES</span>
                <span className="text-2xl font-black text-slate-850 mt-2 block leading-none">0.00% Zero</span>
                <p className="text-[9.5px] text-slate-500 mt-2 font-light">Handshake crash telemetry matches active licenses.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 text-white rounded-xl font-mono text-xs space-y-2">
              <h4 className="text-[10px] text-slate-455 font-black uppercase tracking-wider">Client pull activity telemetry stream:</h4>
              <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                <div className="text-slate-355 text-[10.5px] flex items-center justify-between border-b border-slate-900 pb-1">
                  <span>📥 IP 223.185.94.102 • Downloaded 'Suryatech_Billing_v4.2.2.exe'</span>
                  <span className="text-slate-500 font-light text-[9px]">Raipur • 2 min ago</span>
                </div>
                <div className="text-slate-355 text-[10.5px] flex items-center justify-between border-b border-slate-900 pb-1">
                  <span>📥 IP 103.88.243.15 • Downloaded 'Restaurant_POS_v1.0.5.exe'</span>
                  <span className="text-slate-500 font-light text-[9px]">Bilaspur • 15 min ago</span>
                </div>
                <div className="text-slate-355 text-[10.5px] flex items-center justify-between pb-1">
                  <span>📥 IP 223.189.2.44 • Downloaded 'GST_Enterprise_v2.1.0.exe'</span>
                  <span className="text-slate-500 font-light text-[9px]">Durg • 42 min ago</span>
                </div>
              </div>
            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 7: TRIAL ENVIRONMENT TRACKER -------------------- */}
      {activeModule === 'trials' && (
        <RoleGuard moduleId="trials">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-7">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <Clock size={17} className="text-red-650" />
              <span>Module 7: Client Trial Testing Environments</span>
            </h3>

            {/* Trial pipeline summary */}
            <div className="overflow-x-auto text-xs font-mono text-left">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-500 font-bold">
                    <th className="p-3">TRIAL ID / MACHINE</th>
                    <th className="p-3">LEAD CLIENT NAME</th>
                    <th className="p-3">PHONE CONTACT</th>
                    <th className="p-3 text-left">ACTIVATED TERM</th>
                    <th className="p-3">TARGET SOLUTION</th>
                    <th className="p-3 text-center">CONVERSION STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[11px]">
                  {adminTrialUsers.map((t, idx) => (
                    <tr key={t.id || idx} className="hover:bg-slate-50">
                      <td className="p-3">
                        <span className="font-extrabold text-slate-800">{t.id}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{t.deviceId || 'WIN-POS-ANIKET'}</span>
                      </td>
                      <td className="p-3">
                        <div className="font-sans font-extrabold leading-none">{t.name}</div>
                        <span className="text-[9.5px] text-slate-500 block mt-1">{t.email}</span>
                      </td>
                      <td className="p-3 text-slate-650 font-medium">{t.phone}</td>
                      <td className="p-3 text-slate-555 font-light">{new Date(t.activatedAt).toLocaleDateString()}</td>
                      <td className="p-3 text-slate-500">{t.product}</td>
                      <td className="p-3 text-center">
                        {t.converted ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-805 border border-emerald-150 rounded font-black text-[9px] uppercase inline-block">PAID CONVERTED</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-705 border border-orange-150 rounded font-black text-[9px] uppercase inline-block">OFFLINE PIPELINE</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 8: SMTP EMAIL SYSTEM -------------------- */}
      {activeModule === 'email-system' && (
        <RoleGuard moduleId="email-system">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-8">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <Mail size={17} className="text-red-650" />
              <span>Module 8: SMTP Mail Dispatch Console & Newsletter Hub</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-slate-800">
              
              {/* Email Broadcast Composer */}
              <form onSubmit={handleSendMassEmail} className="space-y-4 max-w-xl text-left border p-5 rounded-2xl bg-slate-50">
                <span className="text-[9.5px] text-slate-500 font-mono tracking-widest block uppercase font-bold">BROADCAST UPDATE BROADCASTER TOOL</span>
                
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-600 block">Outbound Recipients Category</label>
                  <select className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-red-650 font-bold">
                    <option value="all">Segment: All Registered Customers ({adminCustomers.length || 10})</option>
                    <option value="active-lic">Segment: Active Licensed Retailers Only</option>
                    <option value="lead-trials">Segment: Lead Testing Trial Pipe Leads</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-600 block">Dispatch Message Subject *</label>
                  <input 
                    type="text" 
                    placeholder="E.g., BSP Suryatech Software Hub Release Deployment alert"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full p-2.5 border bg-white rounded-lg focus:outline-none focus:border-red-650"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-600 block">Broadcast Rich-Text HTML Payload</label>
                  <textarea 
                    rows={4}
                    placeholder="Hello BSP Suryatech valued partner, direct offline installation updates are accessible now..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full p-2.5 border bg-white rounded-lg focus:outline-none focus:border-red-650 font-mono"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={emailDraftStatus === 'sending'}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold tracking-wide shadow cursor-pointer transition flex items-center justify-center gap-1.5"
                >
                  {emailDraftStatus === 'sending' ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>SMTP BROADCASTING TRANSMISSION LIVE...</span>
                    </>
                  ) : emailDraftStatus === 'sent' ? (
                    <span>EMAILS TRANSMITTED SUCCESS!</span>
                  ) : (
                    <span>BULK TRANSMIT CAMPAIGN</span>
                  )}
                </button>
              </form>

              {/* Server configurations specs */}
              <div className="space-y-4 text-left font-mono">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block font-mono">SMTP CONFIGURATION PROFILE</span>
                <div className="p-4 bg-slate-950 text-white rounded-2xl grid grid-cols-2 gap-3.5 box-border">
                  <div>
                    <span className="text-slate-500 text-[9px] block">SMTP ENDPOINT OUT</span>
                    <span className="text-amber-400 font-extrabold">{adminSettings.smtp_host}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[9px] block">SECURE HANDSHAKE SSL</span>
                    <span className="text-emerald-400 font-extrabold">Port {adminSettings.smtp_port} (SSL/TLS)</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[9px] block">AUTHENTICATED TRANSMITTER</span>
                    <span className="text-slate-300 truncate block border-b border-transparent hover:border-slate-800" title={adminSettings.smtp_user}>{adminSettings.smtp_user}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[9px] block">WEEKLY TRANSMISSION METRICS</span>
                    <span className="text-slate-350">142 pull messages</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border rounded-2xl space-y-2">
                  <span className="font-extrabold text-slate-700 block text-[11.5px]">SMTP Queue Heartbeat Logs:</span>
                  <div className="text-[10px] text-slate-500 space-y-1">
                    <p className="border-b pb-1">✅ test@gmail.com - Dispatch code 250 Accepted (1.2s)</p>
                    <p className="border-b pb-1">✅ viren.patel@gmail.com - Dispatch code 250 Accepted (0.9s)</p>
                    <p className="pb-1">✅ support@bspsuryatech.in - SMTP Auth test success</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 9: GST INVOICE MANAGEMENT -------------------- */}
      {activeModule === 'invoices' && (
        <RoleGuard moduleId="invoices">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-9">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <FileText size={17} className="text-red-650" />
              <span>Module 9: Unified tax-compliant Invoices Ledger</span>
            </h3>

            <div className="overflow-x-auto text-xs font-mono text-left">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-500 font-bold text-[10.5px]">
                    <th className="p-3">INVOICE NUMBER</th>
                    <th className="p-3">RECIPIENT CLIENT / GSTIN</th>
                    <th className="p-3">CONNECTED PRODUCT SUITE</th>
                    <th className="p-3 text-right">NET (BASE) PRICE</th>
                    <th className="p-3 text-right">GST (18% TAX)</th>
                    <th className="p-3 text-right font-black">GROSS PRICE COMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[11.5px]">
                  {adminInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">No GST transaction invoices recorded yet. Clear escrow orders in Module 1 to populate ledger.</td>
                    </tr>
                  ) : (
                    adminInvoices.map((inv, idx) => {
                      const net = inv.net_amount || (inv.amount / 1.18);
                      const tax = inv.gst_amount || (inv.amount - net);
                      return (
                        <tr key={inv.id || idx} className="hover:bg-slate-50">
                          <td className="p-3">
                            <span className="font-black text-rose-850">{inv.invoice_number}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">ID Ref: {inv.id}</span>
                          </td>
                          <td className="p-3">
                            <div className="font-sans font-semibold text-slate-800 leading-none">{inv.client_name}</div>
                            <span className="text-[10px] text-rose-700 bg-rose-50 border px-1 rounded block w-fit mt-1">{inv.gst_number || 'B2C CUSTOMER'}</span>
                          </td>
                          <td className="p-3 text-slate-500 truncate max-w-[150px]">{inv.product_name || 'Retail Billing Standard'}</td>
                          <td className="p-3 text-right text-slate-650">₹{Math.round(net).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-rose-700 font-bold">₹{Math.round(tax).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-slate-800 font-black text-[12.5px]">₹{(inv.amount || 3000).toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 10: SUPPORT TICKETS DESK -------------------- */}
      {activeModule === 'tickets' && (
        <RoleGuard moduleId="tickets">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-10">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <Ticket size={17} className="text-red-650" />
              <span>Module 10: support desk Ticketing Workspace / SLA Helpdesk</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Tickets List Left */}
              <div className="lg:col-span-1 border rounded-2xl overflow-hidden bg-slate-50 flex flex-col max-h-[550px] overflow-y-auto">
                <span className="text-[9.5px] font-bold text-slate-500 font-mono tracking-widest block uppercase p-3 border-b bg-white">OPEN TICKETS POOL</span>
                <div className="divide-y">
                  {filteredTickets.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400 font-mono">No active ticket issues open.</p>
                  ) : (
                    filteredTickets.map((t, idx) => (
                      <div 
                        key={t.id || idx}
                        onClick={() => setSelectedTicket(t)}
                        className={`p-3.5 text-left cursor-pointer transition-colors ${
                          selectedTicket && selectedTicket.id === t.id 
                            ? 'bg-rose-50 border-r-4 border-red-750' 
                            : 'hover:bg-slate-100 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                          <span className="font-extrabold text-slate-500 uppercase">{t.category}</span>
                          <span className={`px-1 rounded text-[8.5px] font-black uppercase ${
                            t.status === 'open' ? 'bg-amber-100 text-amber-800 border-amber-150 border' : 'bg-slate-200 text-slate-700'
                          }`}>{t.status}</span>
                        </div>
                        <h4 className="text-xs font-sans font-black text-slate-800 leading-tight line-clamp-1">{t.title}</h4>
                        <span className="text-[9.5px] text-slate-433 mt-1.5 block font-mono truncate leading-none">{t.userEmail}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Thread Right */}
              <div className="lg:col-span-2 border rounded-2xl bg-white p-5 flex flex-col justify-between min-h-[400px]">
                {selectedTicket ? (
                  <div className="space-y-4 flex flex-col flex-1 text-xs">
                    
                    {/* Header */}
                    <div className="border-b pb-3 flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <div className="text-[10px] font-mono text-slate-400 block tracking-widest uppercase">TICKET WORKSPACE ID: {selectedTicket.id}</div>
                        <h3 className="text-sm font-sans font-black text-slate-800 leading-tight mt-1">{selectedTicket.title}</h3>
                        <span className="text-[11px] font-mono text-slate-500 mt-0.5 block font-extrabold">Client: {selectedTicket.userName} ({selectedTicket.userEmail})</span>
                      </div>
                      <div className="space-x-1.5 flex shrink-0">
                        {selectedTicket.status !== 'resolved' && (
                          <button 
                            onClick={() => handleCloseTicket(selectedTicket.id)}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-150 font-black font-mono text-[10px] rounded-lg cursor-pointer"
                          >
                            SOLVED/CLOSE
                          </button>
                        )}
                        <span className={`px-2 py-1 rounded font-black text-[9.5px] font-mono uppercase ${selectedTicket.status === 'resolved' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-700'}`}>
                          {selectedTicket.status}
                        </span>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[300px] p-2 bg-slate-50 rounded-xl font-mono">
                      {/* Initial query */}
                      <div className="bg-white border p-3 rounded-xl space-y-1.5 shadow-sm text-left">
                        <div className="flex items-center justify-between text-[10px] text-slate-433">
                          <span className="font-extrabold text-blue-700">Client Statement Context</span>
                          <span>{new Date(selectedTicket.created_at || selectedTicket.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed italic">{selectedTicket.description}</p>
                      </div>

                      {/* Replies */}
                      {(selectedTicket.replies || []).map((r: any, idx: number) => (
                        <div 
                          key={r.id || idx} 
                          className={`p-3 rounded-xl border space-y-1 ${
                            r.authorRole === 'admin' 
                              ? 'bg-red-50 border-rose-100 text-slate-800 ml-6 text-left' 
                              : 'bg-white border-slate-100 text-slate-700 mr-6 text-left'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-black text-slate-600">{r.authorName} [{r.authorRole.toUpperCase()}]</span>
                            <span>{new Date(r.createdAt || r.created_at).toLocaleTimeString()}</span>
                          </div>
                          <p className="leading-relaxed leading-normal">{r.message}</p>
                        </div>
                      ))}
                    </div>

                    {/* Input Reply Box */}
                    {selectedTicket.status !== 'resolved' ? (
                      <div className="pt-2 flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Type support reply or solution coupon..."
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendTicketReply()}
                          className="flex-1 p-2.5 border bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:border-red-650"
                        />
                        <button 
                          onClick={handleSendTicketReply}
                          disabled={submittingReply}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black shrink-0 cursor-pointer"
                        >
                          {submittingReply ? 'SENDING...' : 'REPLY'}
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 text-center bg-emerald-50 text-emerald-800 rounded-xl font-mono border border-emerald-150">
                        This customer ticket thread is resolved and locked for compliance.
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 font-mono">
                    <MessageSquare size={28} className="mb-2 text-slate-300" />
                    <span>Select an unresolved support ticket from the list to launch SLA workspace.</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 11: REPORTS EXTRACTOR -------------------- */}
      {activeModule === 'reports' && (
        <RoleGuard moduleId="reports">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-11">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <FileSpreadsheet size={17} className="text-red-650" />
              <span>Module 11: Business & GST Audit reports dispatch CLI</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-slate-800">
              <form onSubmit={handleTriggerReportGeneration} className="bg-slate-50 border p-5 rounded-2xl space-y-4">
                <span className="text-[9.5px] font-bold text-slate-500 font-mono tracking-widest block uppercase">DDR COMPLIANCE REPORTS COMPILER</span>
                
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-600 block">Required Audit Document Type</label>
                  <select 
                    value={reportType} 
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-red-650 font-bold"
                  >
                    <option value="quarterly-gst">CGST / SGST breakdown quarterly ledger (HSN 998314)</option>
                    <option value="lic-issuance">License Server issuance logs & Device Mac index list</option>
                    <option value="order-history">Razorpay verified payments ledger report</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-600 block">Financial Fiscal Year Quarter</label>
                  <select className="w-full p-2 border bg-white rounded-lg font-semibold">
                    <option value="q1-26">FY 2026 - Q1 (April 2026 - June 2026) [CURRENT]</option>
                    <option value="q4-25">FY 2025 - Q4 (January 2026 - March 2026)</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={generatingReport}
                  className="w-full py-2.5 bg-red-750 hover:bg-red-700 text-white font-black rounded-xl cursor-pointer shadow transition-all flex items-center justify-center gap-1.5"
                >
                  {generatingReport ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>COMPILING DATA LEDGERS...</span>
                    </>
                  ) : (
                    <span>EXPORT AUDIT SPREADSHEET</span>
                  )}
                </button>
              </form>

              <div className="space-y-4 font-mono text-xs">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block font-mono">FINANCIAL AUDIT AUDITOR MEMORANDUM</span>
                <p className="text-slate-500 leading-relaxed font-light">According to Indian GST regulation, BSP Suryatech transactions match software payload deployment code HSN 998314 corresponding to offline POS licensing servers. CGST and SGST equal 9% individually inside Chhattisgarh billing states, and IGST 18% inside export states.</p>
                <div className="bg-slate-50 border p-4.5 rounded-xl text-[10.5px]">
                  <span className="font-extrabold text-slate-700 block mb-1">Exported Reports registry (Latest 48hr):</span>
                  <div className="text-slate-500 space-y-1">
                    <p>📄 Q1_2026_GST_Breakdown.csv - Exported Today by super_admin</p>
                    <p>📄 License_Serials_Fingerprints.csv - Exported Today by super_admin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 12: INTERNAL NOTIFICATIONS -------------------- */}
      {activeModule === 'notifications' && (
        <RoleGuard moduleId="notifications">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-12">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <Bell size={17} className="text-red-650" />
              <span>Module 12: Telemetry Alerts & Internal Dashboard Announcements</span>
            </h3>

            <div className="space-y-4 max-w-xl text-xs text-slate-800 font-mono">
              <p className="text-slate-555 font-light">Internal notifications registry manages server handshake alerts and custom notification broadcasts to client platforms.</p>
              
              <div className="p-4 bg-slate-950 text-white rounded-2xl space-y-3.5 shadow-lg">
                <span className="text-[9.5px] text-slate-500 tracking-widest block uppercase font-bold border-b border-slate-900 pb-1.5">TELEMETRY ANNALS</span>
                <div className="space-y-2 max-h-[180px] overflow-y-auto">
                  {telemetryLogs.map((l, idx) => (
                    <div key={l.id || idx} className="text-[10.5px] border-b border-slate-900 pb-1.5 last:border-0">
                      <div className="flex justify-between font-extrabold text-slate-433 text-[9px]">
                        <span>{new Date(l.timestamp).toLocaleDateString()} {new Date(l.timestamp).toLocaleTimeString()}</span>
                        <span className="text-red-400 font-black">{l.status.toUpperCase()}</span>
                      </div>
                      <p className="text-slate-100 mt-0.5 leading-none">{l.event}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 13: ROLES & PRIVILEGES (RBAC) -------------------- */}
      {activeModule === 'roles-permissions' && (
        <RoleGuard moduleId="roles-permissions">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-13">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <Shield size={17} className="text-red-650" />
              <span>Module 13: Role Based Access Control (RBAC) Rules Console</span>
            </h3>

            <div className="space-y-4 text-xs text-slate-800">
              <p className="text-slate-500 font-mono">The following matrix maps permitted active tasks across simulated employee roles and account profiles.</p>
              
              {/* Privileges Matrix Grid visual */}
              <div className="overflow-x-auto font-mono text-[11px]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b bg-slate-50 font-bold text-slate-500">
                      <th className="p-3">ADMIN ROLE TERMINAL</th>
                      <th className="p-3">CRM CLIENT LIST</th>
                      <th className="p-3">ESCROW PAYMENT</th>
                      <th className="p-3">LICENSE REVOCATION</th>
                      <th className="p-3">RAW SUPABASE SQL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-3 font-extrabold text-purple-750">crown super_admin</td>
                      <td className="p-3 text-emerald-600 font-black">✅ ENABLED</td>
                      <td className="p-3 text-emerald-600 font-black">✅ ENABLED</td>
                      <td className="p-3 text-emerald-600 font-black">✅ ENABLED</td>
                      <td className="p-3 text-emerald-600 font-black">✅ ENABLED</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-extrabold text-blue-700">manager</td>
                      <td className="p-3 text-emerald-600 font-black">✅ ENABLED</td>
                      <td className="p-3 text-emerald-600 font-black">✅ ENABLED</td>
                      <td className="p-3 text-emerald-600 font-black">✅ ENABLED</td>
                      <td className="p-3 text-rose-600 font-black">🔒 RESTRICTED</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-extrabold text-emerald-700">sales</td>
                      <td className="p-3 text-emerald-600 font-black">✅ ENABLED</td>
                      <td className="p-3 text-emerald-600 font-black">✅ ENABLED</td>
                      <td className="p-3 text-rose-600 font-black">🔒 RESTRICTED</td>
                      <td className="p-3 text-rose-600 font-black">🔒 RESTRICTED</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-extrabold text-amber-700">support</td>
                      <td className="p-3 text-emerald-600 font-black">✅ ENABLED</td>
                      <td className="p-3 text-rose-600 font-black">🔒 RESTRICTED</td>
                      <td className="p-3 text-rose-600 font-black">🔒 RESTRICTED</td>
                      <td className="p-3 text-rose-600 font-black">🔒 RESTRICTED</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 14: AUTHENTICATION REGISTRY -------------------- */}
      {activeModule === 'authentication' && (
        <RoleGuard moduleId="authentication">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-14">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <Lock size={17} className="text-red-650" />
              <span>Module 14: JWT Handshake & Auth Session Registry</span>
            </h3>

            <div className="space-y-4 font-mono text-xs text-slate-800">
              <p className="text-slate-500">Security authentication log monitoring JWT expiry timestamps to avoid brute force.</p>
              
              <div className="p-4 bg-slate-50 border rounded-2xl max-w-xl text-left space-y-2">
                <span className="font-extrabold text-slate-700 block text-[11.5px]">Active Session telemetry:</span>
                <div className="text-[10px] text-slate-500 space-y-1 leading-normal">
                  <p>🔐 surajsurya.koo7@gmail.com - Chhattisgarh IP 223.185.94.102 (Active super_admin RFC Jwt)</p>
                  <p>🔐 test@gmail.com - Raipur IP 103.88.243.15 (Active customer Jwt)</p>
                  <p className="text-red-500">⚠️ Blocked brute-force attempt - IP 45.92.122.94 (Suspicious origin pruned • 2h ago)</p>
                </div>
              </div>
            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 15: DATABASE MANAGER -------------------- */}
      {activeModule === 'database-manager' && (
        <RoleGuard moduleId="database-manager">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-15">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <Database size={17} className="text-red-650" />
              <span>Module 15: Raw Supabase Relational Database Explorer</span>
            </h3>

            <div className="space-y-4 font-mono text-xs text-slate-800">
              <p className="text-slate-555">Execute query handshakes directly. Only accessible by crowning super_admin roles.</p>
              
              <div className="space-y-2 max-w-2xl text-left text-slate-800">
                <label className="font-bold text-slate-600 block">PostgreSQL Terminal Query:</label>
                <textarea 
                  rows={3}
                  value={rawSqlInput}
                  onChange={(e) => setRawSqlInput(e.target.value)}
                  className="w-full p-3.5 bg-slate-950 font-mono text-[11.5px] text-lime-400 rounded-xl focus:outline-none border border-slate-900 shadow shadow-inner"
                />
                
                <div className="flex gap-2.5">
                  <button 
                    onClick={handleExecuteRawSql}
                    disabled={sqlRunning}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-black tracking-wide shadow cursor-pointer transition-colors"
                  >
                    {sqlRunning ? 'RUNNING STATEMENT...' : 'EXECUTE STATEMENT'}
                  </button>
                  <button 
                    onClick={() => setRawSqlInput('SELECT * FROM public.customer_profiles LIMIT 10;')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border rounded-lg font-medium cursor-pointer transition-colors"
                  >
                    Load Schema Template
                  </button>
                </div>
              </div>

              {rawSqlResult && (
                <div className="p-4 bg-slate-950 text-white rounded-2xl space-y-3 animate-fade-in shadow-inner max-w-3xl overflow-x-auto border border-slate-900">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-900 pb-2">
                    <span className="font-extrabold uppercase text-lime-450">{rawSqlResult.status}</span>
                    <span>Handshake runtime: {rawSqlResult.execution_time_ms} ms</span>
                  </div>
                  
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-900">
                        {rawSqlResult.columns.map((col: string, idx: number) => (
                          <th key={idx} className="py-1 px-2 uppercase text-[9.5px] font-black tracking-wider">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {rawSqlResult.rows.map((row: any[], rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-slate-900/30 text-slate-200">
                          {row.map((val: any, cIdx: number) => (
                            <td key={cIdx} className="py-1.5 px-2 select-all max-w-[120px] truncate" title={String(val)}>{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 16: SETTINGS HUB -------------------- */}
      {activeModule === 'settings' && (
        <RoleGuard moduleId="settings">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-16">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <Settings size={17} className="text-red-650" />
              <span>Module 16: BSP Corporate System Configuration Hub</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-slate-850">
              
              {/* Business config forms */}
              <div className="space-y-4 text-left p-5 border rounded-2xl bg-slate-50 shadow-sm max-w-xl">
                <span className="text-[9.5px] font-bold text-slate-500 font-mono tracking-widest block uppercase">MERCHANT METADATA DESK</span>
                
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Merchant Org Name</label>
                  <input 
                    type="text" 
                    value={adminSettings.company_name}
                    onChange={(e) => updateAdminSettings({ company_name: e.target.value })}
                    className="w-full p-2 border bg-white rounded-lg font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">System Owner Contact</label>
                  <input 
                    type="text" 
                    value={adminSettings.owner}
                    onChange={(e) => updateAdminSettings({ owner: e.target.value })}
                    className="w-full p-2 border bg-white rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">GSTIN Registration</label>
                  <input 
                    type="text" 
                    value={adminSettings.gst_number}
                    onChange={(e) => updateAdminSettings({ gst_number: e.target.value.toUpperCase() })}
                    className="w-full p-2 border bg-white rounded-lg font-mono tracking-wide focus:border-red-650"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Business Address</label>
                  <textarea 
                    rows={2}
                    value={adminSettings.business_address}
                    onChange={(e) => updateAdminSettings({ business_address: e.target.value })}
                    className="w-full p-2 border bg-white rounded-lg leading-relaxed text-slate-700"
                  />
                </div>
              </div>

              {/* CRM setups whatsapp webhooks right */}
              <div className="space-y-5 text-left font-mono text-xs">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block font-mono">ERP WEBHOOK HANDSHAKE ENDPOINTS</span>
                <p className="text-slate-500 font-light leading-relaxed">System automates WhatsApp notification webhooks securely with client purchase records. Outbound API Rate: {adminSettings.api_rate_limit} pulls/minute.</p>
                
                <div className="p-4 bg-slate-950 text-white rounded-2xl space-y-3 shadow-inner">
                  <div>
                    <span className="text-slate-500 text-[9px] block">WHATSAPP WEBHOOK INSTANCE</span>
                    <span className="text-lime-400 font-extrabold">{adminSettings.whatsapp}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[9px] block">DATABASE POOL MAX SIZE</span>
                    <span className="text-amber-400 font-extrabold">{adminSettings.db_pool_size} handlers active</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 17: GST LEDGER CONTROL -------------------- */}
      {activeModule === 'gst-ledger' && (
        <RoleGuard moduleId="gst-ledger">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-17">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <Percent size={17} className="text-red-650" />
              <span>Module 17: Indian HSN 998314 GST Ledger Control</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs text-slate-800">
              <div className="bg-slate-50 border p-4.5 rounded-xl text-left space-y-1.5">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase">DEFAULT GST INTEGRATION RATE</span>
                <div className="text-xl font-black text-rose-800">{adminSettings.default_gst_rate}% TAX</div>
                <p className="text-[9px] text-slate-500">CGST (9%) + SGST (9%) split inside state supply lines.</p>
              </div>

              <div className="bg-slate-50 border p-4.5 rounded-xl text-left space-y-1.55">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase">HSN DESCRIPTION CODE</span>
                <div className="text-xl font-black text-slate-800">HSN-998314</div>
                <p className="text-[9px] text-slate-500">Classification matching Information Technology POS design services.</p>
              </div>

              <div className="bg-slate-50 border p-4.5 rounded-xl text-left space-y-1.5">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase font-mono">Ledger state calculations</span>
                <div className="text-xl font-black text-emerald-600">STATE RECONCILED</div>
                <p className="text-[9px] text-slate-500 font-mono">Chhattisgarh local state supply matches CGST.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border rounded-2xl space-y-3.5 max-w-xl text-left text-xs font-mono text-slate-800">
              <span className="font-extrabold text-slate-705 block text-[11px]">Auto Tax breakdown Ledger (Latest 18% calculation):</span>
              <div className="space-y-2 leading-relaxed text-slate-500">
                <p className="border-b pb-1.5">₹3,000 transaction Gross invoice equals:<br/>
                  Net Base Solution value: ₹2,542.37<br/>
                  Indian CGST (9% Raipur local): ₹228.81<br/>
                  Indian SGST (9% Raipur local): ₹228.81
                </p>
              </div>
            </div>
          </div>
        </RoleGuard>
      )}

    </div>
  );
};
export default AdminRoutes;
