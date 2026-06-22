import React, { useState, useEffect } from 'react';
import { useAdmin } from './AdminContext';
import { usePermission } from './PermissionProvider';
import AdminContactMessages from './AdminContactMessages';
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
  Edit,
  CheckCircle2,
  XCircle,
  Copy,
  Save,
  Clock,
  Eye,
  Printer,
  FileSpreadsheet,
  Globe,
  Lock,
  MessageSquare,
  Disc,
  Bell,
  Layers,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface AdminRoutesProps {
  onAddNotification: (text: string, type: 'success' | 'info' | 'error') => void;
}

const deserializeTicketDescription = (desc: string) => {
  if (desc && desc.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(desc);
      if (parsed && typeof parsed === 'object') {
        return {
          text: parsed.text || desc,
          priority: parsed.priority || 'medium',
          attachments: parsed.attachments || []
        };
      }
    } catch {}
  }
  return {
    text: desc || '',
    priority: 'medium',
    attachments: []
  };
};

const safeFormatDate = (dateStr: any) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return String(dateStr);
    }
    return d.toLocaleDateString();
  } catch {
    return String(dateStr);
  }
};

const safeFormatTime = (dateStr: any) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return String(dateStr);
    }
    return d.toLocaleTimeString();
  } catch {
    return String(dateStr);
  }
};

export const AdminRoutes: React.FC<AdminRoutesProps> = ({ onAddNotification }) => {
  const { 
    adminRole,
    activeModule, 
    setActiveModule,
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
    adminContactMessages,
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
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [adminTicketTab, setAdminTicketTab] = useState<'reply' | 'internal'>('reply');

  const handlePrintInvoice = (inv: any) => {
    const matchedCust = adminCustomers.find((c: any) => 
      (c.id && inv.userId && String(c.id) === String(inv.userId)) ||
      (c.email_address && inv.emailAddress && String(c.email_address).toLowerCase() === String(inv.emailAddress).toLowerCase()) ||
      (c.client_name && inv.client_name && String(c.client_name).toLowerCase() === String(inv.client_name).toLowerCase())
    );

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onAddNotification('Popup blocked! Please allow popups to print tax invoices.', 'error');
      return;
    }
    const net = Math.round(inv.net_amount || inv.netAmount || (inv.amount / 1.18));
    const tax = Math.round(inv.gst_amount || inv.gstAmount || (inv.amount - net));
    const cgst = Math.round(tax / 2);
    const sgst = Math.round(tax / 2);
    
    const clientName = matchedCust?.client_name || inv.clientName || inv.client_name || 'Suryatech User';
    const businessName = matchedCust?.business_name || inv.businessName || inv.business_name || 'BSP Corporate Client';
    const email = matchedCust?.email_address || inv.emailAddress || inv.email_address || 'client@bspsuryatech.in';
    const contact = matchedCust?.contact_number || inv.contactNumber || inv.contact_number || '+91 95169 16415';
    const address = matchedCust?.city ? `${matchedCust.city}, ${matchedCust.state}` : 'Corporate Address Register';
    const gstin = matchedCust?.gst_number || inv.gst_number || inv.gstNumber || 'B2C (Unregistered)';
    const licKey = inv.licenseKey || inv.license_key || 'BSPS-RETL-PRO-K93F-92JD-L03A-84Y7';

    const amountInWords = (num: number) => {
      if (num === 1) return "One Rupee Only";
      if (num === 3000) return "Three Thousand Rupees Only";
      if (num === 999) return "Nine Hundred and Ninety-Nine Rupees Only";
      return `${num} Rupees Only`;
    };

    const invoiceDate = new Date(inv.created_at || inv.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const docStr = `
      <html>
        <head>
          <title>Invoice - ${inv.invoice_number || inv.invoiceNumber || 'INV'}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .logo { font-size: 22px; font-weight: 800; color: #dc2626; letter-spacing: -0.5px; }
            .corp-details { text-align: right; font-size: 11px; color: #64748b; line-height: 1.4; }
            .inv-title { text-align: center; font-size: 16px; font-weight: 700; text-transform: uppercase; margin: 25px 0 10px 0; letter-spacing: 1px; text-decoration: underline; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 20px 0; font-size: 12px; }
            .meta-box { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc; }
            .meta-box h4 { margin: 0 0 8px 0; font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
            .meta-box p { margin: 4px 0; line-height: 1.3; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            .table th { border-bottom: 2px solid #e2e8f0; padding: 10px; text-align: left; background: #f1f5f9; color: #475569; font-weight: 700; }
            .table td { border-bottom: 1px solid #e2e8f0; padding: 10px; line-height: 1.3; }
            .totals { margin-top: 25px; display: flex; justify-content: flex-end; }
            .totals-table { width: 320px; border-collapse: collapse; font-size: 12px; }
            .totals-table td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
            .grand-total { font-size: 14px; font-weight: 800; color: #0f172a; }
            .terms { margin-top: 40px; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; line-height: 1.4; }
            .stamp { text-align: right; margin-top: 40px; font-size: 11px; }
            .stamp p { margin-top: 50px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">BSP SURYATECH</div>
              <div style="font-size: 11px; color: #475569; margin-top: 4px; font-weight: 600;">OFFLINE ENTERPRISE SOFTWARE SUITE</div>
            </div>
            <div class="corp-details">
              <strong>BSP SURYATECH SOFTWARE PRIVATE LTD</strong><br/>
              MIG-15, Sector-1, Shankar Nagar, Raipur, CG - 492004<br/>
              GSTIN: 22AAIFB7315M1ZK | PAN: AAIFB7315M<br/>
              support@bspsuryatech.in | +91 95169 16415
            </div>
          </div>

          <div class="inv-title">TAX INVOICE - ORIGINAL FOR RECIPIENT</div>

          <div class="meta-grid">
            <div class="meta-box">
              <h4>Billed To (Recipient Customer)</h4>
              <p><strong>Customer Name:</strong> ${clientName}</p>
              <p><strong>Firm/Business:</strong> ${businessName}</p>
              <p><strong>E-mail ID:</strong> ${email}</p>
              <p><strong>Contact No:</strong> ${contact}</p>
              <p><strong>Address:</strong> ${address}</p>
              <p><strong>GSTIN:</strong> ${gstin}</p>
            </div>
            <div class="meta-box">
              <h4>Invoice & Supply Details</h4>
              <p><strong>Invoice Number:</strong> <span style="color: #dc2626; font-weight: bold;">${inv.invoice_number || inv.invoiceNumber || 'INV-2026-N0'}</span></p>
              <p><strong>Date of Invoice:</strong> ${invoiceDate}</p>
              <p><strong>Order ID:</strong> ${inv.orderId || inv.order_id || 'BSP-ORD-92A3'}</p>
              <p><strong>Place of Supply:</strong> Chhattisgarh (Code 22)</p>
              <p><strong>License Serial Key:</strong> ${licKey}</p>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 45%;">PRODUCT DESCRIPTION / SERVICE COMPONENT</th>
                <th style="width: 15%; text-align: center;">HSN DETAILS</th>
                <th style="width: 15%; text-align: right;">BASE RATE (NET)</th>
                <th style="width: 20%; text-align: right;">TAXABLE TAX RATE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>
                  <strong>${inv.product_name || inv.productName || 'BSP Suryatech Retail Billing Suite'}</strong><br/>
                  <span style="font-size: 10px; color: #64748b;">Enterprise Standalone Offline Workstation Node (Single Activation Key)</span>
                </td>
                <td style="text-align: center; color: #475569;">997331</td>
                <td style="text-align: right;">₹${net.toLocaleString('en-IN')}</td>
                <td style="text-align: right;">Integrated CGST+SGST @ 18%</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <table class="totals-table">
              <tr>
                <td>Taxable Value (Base)</td>
                <td style="text-align: right;">₹${net.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Central Tax (CGST 9.0%)</td>
                <td style="text-align: right;">₹${cgst.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>State Tax (SGST 9.0%)</td>
                <td style="text-align: right;">₹${sgst.toLocaleString('en-IN')}</td>
              </tr>
              <tr class="grand-total">
                <td><strong>Invoice Total (Gross)</strong></td>
                <td style="text-align: right; color: #b91c1c;"><strong>₹${(inv.amount || 3000).toLocaleString('en-IN')}</strong></td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 15px; font-size: 11px; background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 3px solid #dc2626;">
            <strong>Total Amount in Words:</strong> ${amountInWords(inv.amount || 3000)}
          </div>

          <div class="terms">
            <strong>Terms & Conditions of Software License:</strong><br/>
            1. This tax invoice acts as physical clearance of electronic title transition for the single workstation license.<br/>
            2. Updates, support desk SLAs, and server backup access are bound by our corporate Master Services Agreement (MSA).<br/>
            3. Desktop licenses operate 100% offline; host execution hardware signatures are registered on activation registry nodes securely.<br/>
            4. All disputes are subject to Raipur, CG jurisdiction. Any code modifications are strictly prohibited.
          </div>

          <div class="stamp">
            For <strong>BSP SURYATECH SOFTWARE PRIVATE LTD</strong>
            <p>Authorized Signatory</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(docStr);
    printWindow.document.close();
  };

  const getSelectedTicketDetails = () => {
    if (!selectedTicket) return null;
    const t = adminTickets.find(tk => tk.id === selectedTicket.id);
    if (!t) {
      const unpacked = deserializeTicketDescription(selectedTicket.description);
      let parsedReplies: any[] = [];
      if (selectedTicket.replies) {
        if (Array.isArray(selectedTicket.replies)) {
          parsedReplies = selectedTicket.replies;
        } else if (typeof selectedTicket.replies === 'string') {
          try {
            parsedReplies = JSON.parse(selectedTicket.replies);
          } catch {
            parsedReplies = [];
          }
        }
      }
      return {
        ...selectedTicket,
        description: unpacked.text,
        priority: unpacked.priority || 'medium',
        attachments: unpacked.attachments || [],
        replies: parsedReplies,
        customerDetails: null
      };
    }
    
    const unpacked = deserializeTicketDescription(t.description);
    
    let parsedReplies: any[] = [];
    if (t.replies) {
      if (Array.isArray(t.replies)) {
        parsedReplies = t.replies;
      } else if (typeof t.replies === 'string') {
        try {
          parsedReplies = JSON.parse(t.replies);
        } catch {
          parsedReplies = [];
        }
      }
    }

    const clientEmail = t.user_email || t.userEmail || '';
    const customer = adminCustomers.find((c: any) => 
      (c.email_address && c.email_address.toLowerCase() === clientEmail.toLowerCase()) ||
      (c.userId && c.userId === t.user_id)
    );

    return {
      ...t,
      description: unpacked.text,
      priority: unpacked.priority || 'medium',
      attachments: unpacked.attachments || [],
      replies: parsedReplies,
      customerDetails: customer || null
    };
  };

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

  // --- DOWNLOAD CENTER DYNAMIC SOLUTIONS MANAGEMENT STATE ---
  const [adminSolutions, setAdminSolutions] = useState<any[]>([]);
  const [solutionsLoading, setSolutionsLoading] = useState(false);
  const [editingSolution, setEditingSolution] = useState<any | null>(null);
  const [isAddingSolution, setIsAddingSolution] = useState(false);
  const [solutionSearch, setSolutionSearch] = useState('');
  const [solutionSortField, setSolutionSortField] = useState<'title' | 'category' | 'displayOrder'>('displayOrder');
  const [solutionSortOrder, setSolutionSortOrder] = useState<'asc' | 'desc'>('asc');
  const [solutionSelectedIds, setSolutionSelectedIds] = useState<string[]>([]);
  const [solutionForm, setSolutionForm] = useState({
    id: '',
    title: '',
    subtitle: '',
    category: 'Billing Software',
    description: '',
    price: '₹3,000',
    features: '',
    icon: '🛍️',
    badge: 'Billing',
    badgeColor: 'emerald',
    exeUrl: '',
    mappedPlanId: 'prod-billing-pro',
    status: 'active' as 'active' | 'inactive',
    displayOrder: 10
  });

  const resetSolutionForm = () => {
    setSolutionForm({
      id: '',
      title: '',
      subtitle: '',
      category: 'Billing Software',
      description: '',
      price: '₹3,000',
      features: '',
      icon: '🛍️',
      badge: 'Billing',
      badgeColor: 'emerald',
      exeUrl: '',
      mappedPlanId: 'prod-billing-pro',
      status: 'active',
      displayOrder: 10
    });
  };

  const fetchAdminSolutions = async () => {
    setSolutionsLoading(true);
    try {
      const { data, error } = await supabase.from('solutions').select('*');
      if (data && !error && data.length > 0) {
        setAdminSolutions(data);
      } else {
        const res = await fetch('/api/solutions');
        if (res.ok) {
          const localData = await res.json();
          setAdminSolutions(localData);
        }
      }
    } catch (err) {
      console.error("Error fetching solutions:", err);
      try {
        const res = await fetch('/api/solutions');
        if (res.ok) {
          const localData = await res.json();
          setAdminSolutions(localData);
        }
      } catch (innerErr) {
        console.error("Express API fallback error:", innerErr);
      }
    } finally {
      setSolutionsLoading(false);
    }
  };

  const handleSaveSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solutionForm.title || !solutionForm.category) {
      onAddNotification("Software Title and Category are mandatory!", "error");
      return;
    }

    try {
      const payload = {
        title: solutionForm.title.trim(),
        subtitle: solutionForm.subtitle.trim(),
        category: solutionForm.category.trim(),
        description: solutionForm.description.trim(),
        price: solutionForm.price.trim() || '₹3,000',
        features: solutionForm.features.split('\n').map(f => f.trim()).filter(Boolean),
        icon: solutionForm.icon.trim() || '🛍️',
        badge: solutionForm.badge.trim() || 'Billing',
        badgeColor: solutionForm.badgeColor.trim() || 'emerald',
        exeUrl: solutionForm.exeUrl.trim(),
        mappedPlanId: solutionForm.mappedPlanId.trim() || 'prod-billing-pro',
        status: solutionForm.status,
        displayOrder: Number(solutionForm.displayOrder) || 10
      };

      if (editingSolution) {
        const localRes = await fetch(`/api/solutions/${editingSolution.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        try {
          await supabase.from('solutions').update(payload).eq('id', editingSolution.id);
        } catch (sErr) {
          console.warn("Supabase solutions write deferred:", sErr);
        }

        if (localRes.ok) {
          onAddNotification(`Software "${payload.title}" updated successfully!`, "success");
          addTelemetryLog(`Edited software details: ${editingSolution.id}`, 'success');
        } else {
          throw new Error("Local API update failed");
        }
      } else {
        const customId = solutionForm.id.trim() ? { id: solutionForm.id.trim() } : {};
        const payloadWithId = { ...payload, ...customId };

        const localRes = await fetch('/api/solutions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadWithId)
        });

        const createdLocal = localRes.ok ? await localRes.json() : null;

        try {
          const finalPayload = createdLocal ? createdLocal : payloadWithId;
          await supabase.from('solutions').insert([finalPayload]);
        } catch (sErr) {
          console.warn("Supabase solutions insert deferred:", sErr);
        }

        if (localRes.ok) {
          onAddNotification(`New software "${payload.title}" registered successfully!`, "success");
          addTelemetryLog(`Registered new software solution: ${createdLocal?.id || 'new'}`, 'success');
        } else {
          throw new Error("Local API insert failed");
        }
      }

      setEditingSolution(null);
      setIsAddingSolution(false);
      resetSolutionForm();
      fetchAdminSolutions();
      window.dispatchEvent(new CustomEvent('reload_customer_datastore'));
    } catch (err: any) {
      console.error(err);
      onAddNotification(`Error saving software: ${err.message || err}`, "error");
    }
  };

  const handleDeleteSolution = async (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const localRes = await fetch(`/api/solutions/${id}`, {
        method: 'DELETE'
      });

      try {
        await supabase.from('solutions').delete().eq('id', id);
      } catch (sErr) {
        console.warn("Supabase solutions delete deferred:", sErr);
      }

      if (localRes.ok) {
        onAddNotification(`Software "${name}" deleted successfully!`, "success");
        addTelemetryLog(`Deleted software solution: ${id}`, 'success');
        setSolutionSelectedIds(prev => prev.filter(selId => selId !== id));
        fetchAdminSolutions();
        window.dispatchEvent(new CustomEvent('reload_customer_datastore'));
      } else {
        throw new Error("Express delete failed");
      }
    } catch (err: any) {
      console.error(err);
      onAddNotification(`Error deleting software: ${err.message || err}`, "error");
    }
  };

  const handleBulkDeleteSolutions = async () => {
    if (solutionSelectedIds.length === 0) {
      onAddNotification("No software selected for bulk deletion!", "error");
      return;
    }

    if (!window.confirm(`Are you absolutely sure you want to bulk-delete ${solutionSelectedIds.length} software(s)? This cannot be undone.`)) {
      return;
    }

    try {
      const localRes = await fetch('/api/solutions/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: solutionSelectedIds })
      });

      try {
        await supabase.from('solutions').delete().in('id', solutionSelectedIds);
      } catch (sErr) {
        console.warn("Supabase solutions bulk delete deferred:", sErr);
      }

      if (localRes.ok) {
        onAddNotification(`Successfully bulk-deleted ${solutionSelectedIds.length} software(s)!`, "success");
        addTelemetryLog(`Bulk-deleted ${solutionSelectedIds.length} software solutions`, 'success');
        setSolutionSelectedIds([]);
        fetchAdminSolutions();
        window.dispatchEvent(new CustomEvent('reload_customer_datastore'));
      } else {
        throw new Error("Express bulk delete failed");
      }
    } catch (err: any) {
      console.error(err);
      onAddNotification(`Bulk delete failed: ${err.message || err}`, "error");
    }
  };

  const toggleSolutionVisibility = async (id: string, currentStatus: string, title: string) => {
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    try {
      const localRes = await fetch(`/api/solutions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      try {
        await supabase.from('solutions').update({ status: newStatus }).eq('id', id);
      } catch (sErr) {
        console.warn("Supabase visibility sync deferred:", sErr);
      }

      if (localRes.ok) {
        onAddNotification(`Software "${title}" is now ${newStatus === 'active' ? 'Visible' : 'Hidden'} in frontend Download Center!`, "success");
        addTelemetryLog(`Toggled visibility of solution ${id} to ${newStatus}`, 'success');
        fetchAdminSolutions();
        window.dispatchEvent(new CustomEvent('reload_customer_datastore'));
      } else {
        throw new Error("Visibility toggle failed");
      }
    } catch (err: any) {
      console.error(err);
      onAddNotification(`Error toggling visibility: ${err.message || err}`, 'error');
    }
  };

  // --- MODULE 5-B: MASTER SOFTWARE CATALOG STATE ---
  const [adminProducts, setAdminProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    version: 'v4.2.1',
    size: '14.8 MB',
    price: 999,
    original_price: 2499,
    features: '',
    description: '',
    download_url: '',
    connected_plan: '',
    category: 'Billing Software',
    full_description: '',
    system_requirements: 'Operating System: Windows 7 SP1, Windows 8, Windows 10, or Windows 11 (32-bit & 64-bit)\nCPU: Intel Core i3 or AMD equivalent processor (1.8Ghz minimum)\nMemory: 2 GB RAM minimum\nStorage: 100 MB free space\nDatabase: Microsoft Access or SQLite local files (Fully self-contained, auto-configured)',
    license_info: 'Single-Terminal Lifetime License Key with 1 Year of free security updates and service releases.',
    demo_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    gallery: '',
    manual_url: '',
    status: 'active',
    
    // Download Center Extras
    logo_url: '',
    thumbnail_url: '',
    banner_url: '',
    buy_now_link: '',
    learn_more_link: '',
    trial_download_url: '',
    setup_exe_url: '',
    
    // Visibility/Ordering Controls
    show_in_download_center: true,
    is_featured: false,
    is_new_arrival: false,
    is_bestseller: false,
    is_hidden: false,
    display_order: 10,
    is_pinned: false
  });

  const fetchAdminProducts = async () => {
    setProductsLoading(true);
    let success = false;
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (data && !error && data.length > 0) {
        const parsed = data.map(item => ({
          ...item,
          price: item.price ? Number(item.price) : 0,
          original_price: item.original_price ? Number(item.original_price) : 0,
          features: typeof item.features === 'string' ? JSON.parse(item.features) : (Array.isArray(item.features) ? item.features : []),
          gallery: typeof item.gallery === 'string' ? JSON.parse(item.gallery) : (Array.isArray(item.gallery) ? item.gallery : []),
        }));
        setAdminProducts(parsed);
        success = true;
      } else {
        if (error) console.error("Error fetching products from Supabase:", error);
      }
    } catch (e) {
      console.error("Supabase products fetch exception:", e);
    }

    if (!success) {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const localData = await res.json();
          const parsed = localData.map((item: any) => ({
            ...item,
            price: item.price ? Number(item.price) : 0,
            original_price: item.original_price || item.originalPrice ? Number(item.original_price || item.originalPrice) : 0,
            features: typeof item.features === 'string' ? JSON.parse(item.features) : (Array.isArray(item.features) ? item.features : []),
            gallery: typeof item.gallery === 'string' ? JSON.parse(item.gallery) : (Array.isArray(item.gallery) ? item.gallery : []),
            status: item.status || 'active'
          }));
          setAdminProducts(parsed);
        }
      } catch (localErr) {
        console.error("Local products fetch exception:", localErr);
      }
    }
    setProductsLoading(false);
  };

  const [adminCategories, setAdminCategories] = useState<any[]>([]);
  const fetchAdminCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        const sorted = data.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setAdminCategories(sorted);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleCreateCategory = async (catName: string) => {
    if (!catName.trim()) return;
    try {
      const id = 'cat-' + Math.random().toString(36).substr(2, 9);
      const newOrder = adminCategories.length > 0 ? Math.max(...adminCategories.map(c => c.displayOrder || 0)) + 1 : 1;
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: catName.trim(), displayOrder: newOrder })
      });
      if (res.ok) {
        onAddNotification(`Category "${catName}" added!`, "success");
        fetchAdminCategories();
        window.dispatchEvent(new Event('categories_updated'));
      }
    } catch (err) {
      console.error("Error creating category:", err);
    }
  };

  const handleUpdateCategory = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });
      if (res.ok) {
        onAddNotification(`Category updated!`, "success");
        fetchAdminCategories();
        window.dispatchEvent(new Event('categories_updated'));
      }
    } catch (err) {
      console.error("Error updating category:", err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category? Softwares belonging to this category will not have their categories deleted, but they won't automatically map to a dynamic header filter.")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onAddNotification("Category deleted successfully!", "success");
        fetchAdminCategories();
        window.dispatchEvent(new Event('categories_updated'));
      }
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  const handleReorderCategory = async (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= adminCategories.length) return;
    
    const reordered = [...adminCategories];
    const temp = reordered[index];
    reordered[index] = reordered[nextIndex];
    reordered[nextIndex] = temp;
    
    // Reset order index
    const updated = reordered.map((c, idx) => ({
      ...c,
      displayOrder: idx + 1
    }));
    
    setAdminCategories(updated);
    
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        fetchAdminCategories();
        window.dispatchEvent(new Event('categories_updated'));
      }
    } catch (err) {
      console.error("Error saving categories order:", err);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.id || !productForm.name) {
      onAddNotification("Software Slug ID and Product Name are mandatory!", "error");
      return;
    }

    try {
      const idVal = productForm.id.trim();
      const payload = {
        id: idVal,
        name: productForm.name.trim(),
        version: productForm.version.trim(),
        size: productForm.size.trim(),
        price: Number(productForm.price),
        original_price: productForm.original_price ? Number(productForm.original_price) : null,
        description: productForm.description.trim(),
        download_url: productForm.download_url.trim(),
        connected_plan: productForm.connected_plan.trim() || idVal,
        category: productForm.category.trim(),
        full_description: productForm.full_description.trim(),
        system_requirements: productForm.system_requirements.trim(),
        license_info: productForm.license_info.trim(),
        demo_video_url: productForm.demo_video_url.trim(),
        manual_url: productForm.manual_url.trim() || null,
        status: productForm.status,
        features: productForm.features.split('\n').map(f => f.trim()).filter(Boolean),
        gallery: productForm.gallery.split('\n').map(u => u.trim()).filter(Boolean),
        
        logoUrl: productForm.logo_url.trim() || null,
        thumbnailUrl: productForm.thumbnail_url.trim() || null,
        bannerUrl: productForm.banner_url.trim() || null,
        buyNowLink: productForm.buy_now_link.trim() || null,
        learnMoreLink: productForm.learn_more_link.trim() || null,
        trialDownloadUrl: productForm.trial_download_url.trim() || productForm.download_url.trim() || null,
        setupExeUrl: productForm.setup_exe_url.trim() || productForm.download_url.trim() || null,
        showInDownloadCenter: !!productForm.show_in_download_center,
        isFeatured: !!productForm.is_featured,
        isNewArrival: !!productForm.is_new_arrival,
        isBestseller: !!productForm.is_bestseller,
        isHidden: !!productForm.is_hidden,
        displayOrder: Number(productForm.display_order),
        isPinned: !!productForm.is_pinned
      };

      if (editingProduct) {
        // Save to local Express DB first
        const localRes = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        // Try Supabase too
        try {
          await supabase
            .from('products')
            .update(payload)
            .eq('id', editingProduct.id);
        } catch (sbError) {
          console.warn("Supabase product update sync deferred:", sbError);
        }

        if (localRes.ok) {
          onAddNotification(`Software product "${payload.name}" updated successfully in database!`, "success");
          addTelemetryLog(`Edited software product: ${payload.id}`, 'success');
        } else {
          throw new Error("Express product update API failed");
        }
      } else {
        // Create in local Express DB first
        const localRes = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        // Try Supabase too
        try {
          await supabase
            .from('products')
            .insert([payload]);
        } catch (sbError) {
          console.warn("Supabase product creation sync deferred:", sbError);
        }

        if (localRes.ok) {
          onAddNotification(`New software "${payload.name}" created successfully in database!`, "success");
          addTelemetryLog(`Created software product: ${payload.id}`, 'success');
        } else {
          throw new Error("Express product creation API failed");
        }
      }

      setEditingProduct(null);
      setIsAddingProduct(false);
      resetProductForm();
      fetchAdminProducts();

      // Trigger automatic update events in frontend
      window.dispatchEvent(new Event('products_updated'));
    } catch (err: any) {
      console.error("Error saving product:", err);
      onAddNotification(`Failed to save software product: ${err.message || err}`, "error");
    }
  };

  const handleEditProductClick = (prod: any) => {
    setEditingProduct(prod);
    setIsAddingProduct(false);
    setProductForm({
      id: prod.id,
      name: prod.name,
      version: prod.version || '',
      size: prod.size || '',
      price: prod.price || 0,
      original_price: prod.original_price || 0,
      features: Array.isArray(prod.features) ? prod.features.join('\n') : '',
      description: prod.description || '',
      download_url: prod.download_url || '',
      connected_plan: prod.connected_plan || '',
      category: prod.category || 'Billing Software',
      full_description: prod.full_description || '',
      system_requirements: prod.system_requirements || '',
      license_info: prod.license_info || '',
      demo_video_url: prod.demo_video_url || '',
      gallery: Array.isArray(prod.gallery) ? prod.gallery.join('\n') : '',
      manual_url: prod.manual_url || '',
      status: prod.status || 'active',
      logo_url: prod.logoUrl || '',
      thumbnail_url: prod.thumbnailUrl || '',
      banner_url: prod.bannerUrl || '',
      buy_now_link: prod.buyNowLink || '',
      learn_more_link: prod.learnMoreLink || '',
      trial_download_url: prod.trialDownloadUrl || prod.downloadUrl || '',
      setup_exe_url: prod.setupExeUrl || prod.downloadUrl || '',
      show_in_download_center: prod.showInDownloadCenter !== false,
      is_featured: !!prod.isFeatured,
      is_new_arrival: !!prod.isNewArrival,
      is_bestseller: !!prod.isBestseller,
      is_hidden: !!prod.isHidden,
      display_order: prod.displayOrder !== undefined ? prod.displayOrder : 10,
      is_pinned: !!prod.isPinned
    });
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!window.confirm("Are you absolutely sure you want to delete this software product? All details, pricing, downloads, and video reference links will be removed from the store page.")) {
      return;
    }

    try {
      const localRes = await fetch(`/api/products/${prodId}`, {
        method: 'DELETE'
      });

      try {
        await supabase
          .from('products')
          .delete()
          .eq('id', prodId);
      } catch (sbError) {
        console.warn("Supabase product deletion sync deferred:", sbError);
      }

      if (localRes.ok) {
        onAddNotification(`Deleted software product ID: ${prodId}`, "success");
        addTelemetryLog(`Deleted product from active catalog: ${prodId}`, 'warning');
        fetchAdminProducts();
        window.dispatchEvent(new Event('products_updated'));
      } else {
        throw new Error("Express delete products API failed");
      }
    } catch (err: any) {
      console.error(err);
      onAddNotification(`Failed to delete software: ${err.message || err}`, "error");
    }
  };

  const resetProductForm = () => {
    setProductForm({
      id: '',
      name: '',
      version: 'v4.2.1',
      size: '14.8 MB',
      price: 999,
      original_price: 2499,
      features: '',
      description: '',
      download_url: '',
      connected_plan: '',
      category: 'Billing Software',
      full_description: '',
      system_requirements: 'Operating System: Windows 7 SP1, Windows 8, Windows 10, or Windows 11 (32-bit & 64-bit)\nCPU: Intel Core i3 or AMD equivalent processor (1.8Ghz minimum)\nMemory: 2 GB RAM minimum\nStorage: 100 MB free space\nDatabase: Microsoft Access or SQLite local files (Fully self-contained, auto-configured)',
      license_info: 'Single-Terminal Lifetime License Key with 1 Year of free security updates and service releases.',
      demo_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      gallery: '',
      manual_url: '',
      status: 'active',
      logo_url: '',
      thumbnail_url: '',
      banner_url: '',
      buy_now_link: '',
      learn_more_link: '',
      trial_download_url: '',
      setup_exe_url: '',
      show_in_download_center: true,
      is_featured: false,
      is_new_arrival: false,
      is_bestseller: false,
      is_hidden: false,
      display_order: 10,
      is_pinned: false
    });
  };

  useEffect(() => {
    if (activeModule === 'software') {
      fetchAdminProducts();
      fetchAdminCategories();
    }
    if (activeModule === 'downloads') {
      fetchAdminSolutions();
    }
  }, [activeModule]);

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

  // --- DISCOUNT COUPON CAMPAIGNS STATE & IMPLEMENTATIONS ---
  const [coupons, setCoupons] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponSearch, setCouponSearch] = useState('');
  const [couponFilterStatus, setCouponFilterStatus] = useState<'all' | 'active' | 'disabled' | 'expired'>('all');
  const [couponFilterType, setCouponFilterType] = useState<'all' | 'percentage' | 'fixed'>('all');

  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  const [formCouponName, setFormCouponName] = useState('');
  const [formCouponCode, setFormCouponCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState(10);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | undefined>(undefined);
  const [formValidFrom, setFormValidFrom] = useState('');
  const [formValidTo, setFormValidTo] = useState('');
  const [formUsageLimit, setFormUsageLimit] = useState<number | undefined>(undefined);
  const [formPerUserLimit, setFormPerUserLimit] = useState<number | undefined>(undefined);
  const [formMinOrderValue, setFormMinOrderValue] = useState<number | undefined>(undefined);
  const [formApplicability, setFormApplicability] = useState<string>('all');

  const loadCouponsCampaigns = async () => {
    setCouponLoading(true);
    try {
      const token = localStorage.getItem('bsp_token') || localStorage.getItem('supabase_token') || '';
      const headers = { 'Authorization': `Bearer ${token}` };

      const resC = await fetch('/api/admin/coupons', { headers });
      if (resC.ok) {
        const cData = await resC.json();
        setCoupons(cData);
      }

      const resR = await fetch('/api/admin/coupon-redemptions', { headers });
      if (resR.ok) {
        const rData = await resR.json();
        setRedemptions(rData);
      }
    } catch (err: any) {
      console.error("Coupons loader failed:", err);
    } finally {
      setCouponLoading(false);
    }
  };

  useEffect(() => {
    if (activeModule === 'coupons') {
      loadCouponsCampaigns();
    }
  }, [activeModule]);

  const openCouponModal = (couponToEdit?: any, isDuplicate: boolean = false) => {
    if (couponToEdit) {
      setEditingCoupon(isDuplicate ? null : couponToEdit);
      setFormCouponName(couponToEdit.coupon_name || couponToEdit.name || '');
      setFormCouponCode(isDuplicate ? `${couponToEdit.coupon_code || couponToEdit.code || ''}_COPY` : (couponToEdit.coupon_code || couponToEdit.code || ''));
      setFormDescription(couponToEdit.description || '');
      setFormDiscountType(couponToEdit.discount_type || 'percentage');
      setFormDiscountValue(couponToEdit.discount_value || couponToEdit.discountPercent || 10);
      setFormMaxDiscount(couponToEdit.max_discount || undefined);
      setFormValidFrom(couponToEdit.valid_from || '');
      setFormValidTo(couponToEdit.valid_to || '');
      setFormUsageLimit(couponToEdit.usage_limit || undefined);
      setFormPerUserLimit(couponToEdit.per_user_limit || undefined);
      setFormMinOrderValue(couponToEdit.min_order_value || undefined);
      setFormApplicability(couponToEdit.applicability || 'all');
    } else {
      setEditingCoupon(null);
      setFormCouponName('');
      setFormCouponCode('');
      setFormDescription('');
      setFormDiscountType('percentage');
      setFormDiscountValue(10);
      setFormMaxDiscount(undefined);
      setFormValidFrom(new Date().toISOString().split('T')[0]);
      setFormValidTo('');
      setFormUsageLimit(undefined);
      setFormPerUserLimit(1);
      setFormMinOrderValue(undefined);
      setFormApplicability('all');
    }
    setIsCouponModalOpen(true);
  };

  const generateRandomCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'BSP';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormCouponCode(code);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCouponCode.trim()) {
      onAddNotification('Coupon Campaign Code is required.', 'error');
      return;
    }

    const payload = {
      coupon_name: formCouponName.trim() || `Campaign ${formCouponCode}`,
      coupon_code: formCouponCode.trim().toUpperCase(),
      description: formDescription.trim(),
      discount_type: formDiscountType,
      discount_value: Number(formDiscountValue) || 0,
      max_discount: formMaxDiscount ? Number(formMaxDiscount) : null,
      valid_from: formValidFrom || null,
      valid_to: formValidTo || null,
      usage_limit: formUsageLimit ? Number(formUsageLimit) : null,
      per_user_limit: formPerUserLimit ? Number(formPerUserLimit) : null,
      min_order_value: formMinOrderValue ? Number(formMinOrderValue) : null,
      status: editingCoupon ? (editingCoupon.status || 'active') : 'active',
      active: editingCoupon ? (editingCoupon.active !== false) : true,
      applicability: formApplicability
    };

    try {
      const token = localStorage.getItem('bsp_token') || localStorage.getItem('supabase_token') || '';
      const headers = { 
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${token}`
      };

      let res;
      if (editingCoupon) {
        res = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        onAddNotification(editingCoupon ? 'Coupon campaign details updated securely.' : 'New coupon campaign initialized.', 'success');
        setIsCouponModalOpen(false);
        loadCouponsCampaigns();
      } else {
        const err = await res.json().catch(() => ({}));
        onAddNotification(err.error || 'Failed to persist coupon campaign.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      onAddNotification('Transient database communication error.', 'error');
    }
  };

  const handleToggleCouponActive = async (cp: any) => {
    const targetStatus = cp.status === 'active' ? 'disabled' : 'active';
    try {
      const token = localStorage.getItem('bsp_token') || localStorage.getItem('supabase_token') || '';
      const res = await fetch(`/api/admin/coupons/${cp.id || cp.coupon_code}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: targetStatus,
          active: targetStatus === 'active'
        })
      });

      if (res.ok) {
        onAddNotification(`Coupon ${cp.coupon_code || cp.code} status set to ${targetStatus}.`, 'success');
        loadCouponsCampaigns();
      } else {
        onAddNotification('Failed to change status.', 'error');
      }
    } catch (err) {
      onAddNotification('Transient communication error.', 'error');
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete coupon campaign: "${code}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('bsp_token') || localStorage.getItem('supabase_token') || '';
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        onAddNotification(`Coupon campaign ${code} permanently terminated from registries.`, 'success');
        loadCouponsCampaigns();
      } else {
        onAddNotification('Failed to delete coupon.', 'error');
      }
    } catch (err) {
      onAddNotification('Transient communication error.', 'error');
    }
  };

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
    if (!adminReplyText || !selectedTicket) return;
    setSubmittingReply(true);
    try {
      const isInternal = adminTicketTab === 'internal';
      const replyObj = {
        id: `rep-${Date.now()}`,
        authorName: isInternal ? 'Admin (Internal Note)' : 'BSP Support desk Office',
        authorRole: 'admin',
        message: adminReplyText,
        createdAt: new Date().toISOString(),
        isInternal: isInternal
      };

      let currentReplies = [];
      if (selectedTicket.replies) {
        if (Array.isArray(selectedTicket.replies)) {
          currentReplies = selectedTicket.replies;
        } else if (typeof selectedTicket.replies === 'string') {
          try {
            currentReplies = JSON.parse(selectedTicket.replies);
          } catch {
            currentReplies = [];
          }
        }
      }

      const updatedReplies = [...currentReplies, replyObj];
      
      // Write locally
      setAdminTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, replies: JSON.stringify(updatedReplies) } : t));
      setSelectedTicket(prev => ({ ...prev, replies: updatedReplies }));

      // Write to supabase
      await supabase.from('support_tickets').update({
        replies: JSON.stringify(updatedReplies)
      }).eq('id', selectedTicket.id);

      // Create notification only for public customer reply!
      if (!isInternal) {
        const clientUserId = selectedTicket.user_id || selectedTicket.userId;
        if (clientUserId) {
          const notificationRecord = {
            id: 'notif_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            user_id: clientUserId,
            title: 'New Reply on Ticket: ' + selectedTicket.title,
            message: `BSP Support Support Executive replied: "${adminReplyText.substring(0, 60)}${adminReplyText.length > 60 ? '...' : ''}"`,
            type: 'security',
            read: false,
            created_at: new Date().toISOString()
          };
          await supabase.from('notifications').insert(notificationRecord);
        }
      }

      addTelemetryLog(`${isInternal ? 'Added internal notes' : 'Replied support desk ticket'} on: "${selectedTicket.title}"`, 'success');
      setAdminReplyText('');
      onAddNotification(isInternal ? "Internal staff note saved." : "Ticketing response successfully dispatched to client stream.", "success");
    } catch (err: any) {
      onAddNotification(`Failed: ${err.message}`, "error");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      setAdminTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
      await supabase.from('support_tickets').update({ status: newStatus }).eq('id', ticketId);
      
      // Create notification for customer
      const clientUserId = selectedTicket?.user_id || selectedTicket?.userId;
      if (clientUserId && (newStatus === 'resolved' || newStatus === 'closed')) {
        const notificationRecord = {
          id: 'notif_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          user_id: clientUserId,
          title: `Ticket ID ${ticketId} status update`,
          message: `Your Ticket: "${selectedTicket?.title}" was updated to ${newStatus.replace('_', ' ')} by technical helpdesk.`,
          type: 'security',
          read: false,
          created_at: new Date().toISOString()
        };
        await supabase.from('notifications').insert(notificationRecord);
      }

      onAddNotification(`Support ticket status updated to ${newStatus.toUpperCase()}`, "success");
      addTelemetryLog(`Ticket status updated: ID ${ticketId} to ${newStatus}`, 'info');
    } catch (e: any) {
      onAddNotification(e.message, "error");
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    await handleUpdateTicketStatus(ticketId, 'resolved');
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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

              <div 
                onClick={() => setActiveModule('contact-messages')}
                className="bg-white border p-4 rounded-2xl shadow-sm text-left hover:border-red-650 transition-all cursor-pointer relative overflow-hidden group select-none hover:shadow-md"
              >
                {adminContactMessages && adminContactMessages.filter((m: any) => m.status === 'New').length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-rose-600 rounded-full m-4.5 animate-pulse" />
                )}
                <span className="text-[10px] font-bold text-slate-500 font-mono tracking-widest block uppercase">Visitor Inquiry Inbox</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-black text-slate-800 leading-none group-hover:text-red-750 transition-colors">
                    {adminContactMessages ? adminContactMessages.filter((m: any) => m.status === 'New').length : 0} New
                  </span>
                  <span className="text-[10px] font-mono text-slate-550 font-bold bg-slate-50 border px-1 py-0.5 rounded">
                    {adminContactMessages ? adminContactMessages.length : 0} Inq
                  </span>
                </div>
                <p className="text-[9.5px] text-slate-400 mt-3 font-mono flex items-center gap-1 group-hover:text-slate-850 transition-colors">
                  <span>Open Inquiry Inbox</span>
                  <span className="text-[8px] group-hover:translate-x-1 transition-transform inline-block font-black">→</span>
                </p>
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

            {/* --- MODULE 5-B: SOFTWARE PRODUCT CATALOG MANAGER --- */}
            <div className="border-t border-slate-200 pt-6 mt-6 space-y-6" id="admin-module-5b-catalog">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Disc size={18} className="text-blue-600 animate-spin-slow" />
                    <span>Module 5-B: Software Master Product Catalog</span>
                  </h4>
                  <p className="text-xs text-slate-500">Add, edit, or configure separate softwares, pricing policies, executable download links, video demos, and screenshot galleries.</p>
                </div>
                {!isAddingProduct && !editingProduct ? (
                  <div className="flex items-center gap-2 self-start flex-wrap">
                    <button
                      onClick={() => setShowCategoryManager(prev => !prev)}
                      className={`px-4 py-2 text-xs font-extrabold rounded-lg tracking-wider flex items-center gap-1.5 shadow-sm transition cursor-pointer ${showCategoryManager ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-350'}`}
                    >
                      <Layers size={14} />
                      <span>{showCategoryManager ? "HIDE CATEGORIES" : "MANAGE CATEGORIES"}</span>
                    </button>
                    <button
                      onClick={() => {
                        resetProductForm();
                        setIsAddingProduct(true);
                        setEditingProduct(null);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-lg tracking-wider flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>CREATE NEW SOFTWARE</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsAddingProduct(false);
                      setEditingProduct(null);
                      resetProductForm();
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg tracking-wider flex items-center gap-1.5 transition cursor-pointer self-start"
                  >
                    <span>CANCEL FORM</span>
                  </button>
                )}
              </div>

              {/* Category Manager Collapsible Section */}
              {showCategoryManager && !isAddingProduct && !editingProduct && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs animate-fade-in text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
                    <div>
                      <h5 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 font-mono uppercase">
                        <Layers size={14} className="text-blue-605" />
                        <span>Dynamic Software Category Registry ({adminCategories.length})</span>
                      </h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">Define custom software solutions categories. Order determines the filter layout of the Download Center tab bar.</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        placeholder="New category name..." 
                        value={newCategoryName} 
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="p-2 border bg-white rounded-lg text-xs font-bold focus:outline-none focus:border-blue-605 w-44"
                      />
                      <button
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            handleCreateCategory(newCategoryName);
                            setNewCategoryName('');
                          }
                        }}
                        className="px-3 h-8 bg-blue-605 hover:bg-blue-700 text-white text-xs font-extrabold rounded-lg tracking-wider"
                      >
                        ADD
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs bg-white rounded-xl border border-collapse overflow-hidden shadow-sm">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-bold border-b">
                          <th className="p-2.5 font-mono text-[10px] uppercase">ID Key Slug</th>
                          <th className="p-2.5 font-mono text-[10px] uppercase">Category Name</th>
                          <th className="p-2.5 font-mono text-[10px] uppercase text-center w-24">Display Order</th>
                          <th className="p-2.5 font-mono text-[10px] uppercase text-center w-28">Priority Sorting</th>
                          <th className="p-2.5 font-mono text-[10px] uppercase text-center w-20">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminCategories.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-400">No custom categories found. Add some above to manage them!</td>
                          </tr>
                        ) : (
                          adminCategories.map((cat, idx) => (
                            <tr key={cat.id} className="border-b last:border-0 hover:bg-slate-50">
                              <td className="p-2.5 font-mono text-slate-500 text-[11px] font-bold">#{cat.id}</td>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={cat.name}
                                  onChange={(e) => {
                                    const updated = [...adminCategories];
                                    updated[idx].name = e.target.value;
                                    setAdminCategories(updated);
                                  }}
                                  onBlur={(e) => handleUpdateCategory(cat.id, e.target.value)}
                                  className="w-full bg-transparent font-extrabold text-slate-800 focus:bg-white focus:p-1 focus:border focus:rounded focus:outline-none"
                                />
                              </td>
                              <td className="p-2.5 text-center font-bold text-slate-600">{cat.displayOrder || idx + 1}</td>
                              <td className="p-2.5 text-center">
                                <div className="inline-flex gap-1">
                                  <button
                                    onClick={() => handleReorderCategory(idx, 'up')}
                                    disabled={idx === 0}
                                    className="p-1 border rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                    title="Move Up"
                                  >
                                    <ArrowUp size={11} />
                                  </button>
                                  <button
                                    onClick={() => handleReorderCategory(idx, 'down')}
                                    disabled={idx === adminCategories.length - 1}
                                    className="p-1 border rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                                    title="Move Down"
                                  >
                                    <ArrowDown size={11} />
                                  </button>
                                </div>
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                                  title="Delete Category"
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
              )}

              {/* Product Add/Edit Form section */}
              {(isAddingProduct || editingProduct) && (
                <form onSubmit={handleSaveProduct} className="bg-blue-50/50 border border-blue-200 rounded-2xl p-5 space-y-4 text-xs text-slate-800 animate-fade-in text-left">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-3 mb-2">
                    <span className="font-extrabold text-blue-900 uppercase tracking-wider font-mono">
                      {editingProduct ? '✏️ EDIT SOFTWARE CATALOG DETAILS' : '🚀 REGISTER NEW SOFTWARE PRODUCT'}
                    </span>
                    <span className="text-[10px] text-blue-600 font-medium font-mono">Real-time synchronization with database</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Column 1: Core Identifiers & Financials */}
                    <div className="space-y-3 bg-white p-4 border rounded-xl shadow-sm">
                      <h5 className="font-extrabold text-[11px] text-blue-900 border-b pb-1.5 uppercase font-mono">1. Basic Identifiers</h5>
                      
                      <div className="space-y-1">
                        <label className="font-bold text-slate-705 block">Product Slug ID (No spacing)</label>
                        <input
                          type="text"
                          placeholder="prod-billing-pro"
                          value={productForm.id}
                          onInput={(e: any) => {
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '');
                            setProductForm(p => ({ ...p, id: val }));
                          }}
                          disabled={!!editingProduct}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-blue-600 font-mono font-bold disabled:bg-slate-100 disabled:text-slate-500"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-705 block">Software Name</label>
                        <input
                          type="text"
                          placeholder="BSP Suryatech Retail Pro"
                          value={productForm.name}
                          onChange={(e) => setProductForm(p => ({ ...p, name: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-blue-600 font-sans font-bold"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-705 block">Product Category</label>
                        <select
                          value={productForm.category}
                          onChange={(e) => setProductForm(p => ({ ...p, category: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none focus:border-blue-600 font-bold"
                        >
                          <option value="Billing Software">Billing Software</option>
                          {adminCategories.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                          <option value="Custom Group">-- CUSTOM ENTY --</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Or type custom category..."
                          value={productForm.category}
                          onChange={(e) => setProductForm(p => ({ ...p, category: e.target.value }))}
                          className="w-full p-2 mt-1 border bg-white rounded-lg text-[11px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-750 block">Offer Price (₹)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="999"
                            value={productForm.price}
                            onChange={(e) => setProductForm(p => ({ ...p, price: Number(e.target.value) }))}
                            className="w-full p-2 border bg-white rounded-lg focus:outline-none font-bold text-blue-700"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-750 block">Original Price (₹)</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="2499"
                            value={productForm.original_price}
                            onChange={(e) => setProductForm(p => ({ ...p, original_price: Number(e.target.value) }))}
                            className="w-full p-2 border bg-white rounded-lg focus:outline-none text-slate-500 line-through"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-705 block">Deployment Status</label>
                        <select
                          value={productForm.status}
                          onChange={(e) => setProductForm(p => ({ ...p, status: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none font-bold"
                        >
                          <option value="active">Active (Visible)</option>
                          <option value="inactive">Archived (Hidden)</option>
                        </select>
                      </div>
                    </div>

                    {/* Column 2: Direct CTA Links */}
                    <div className="space-y-3 bg-white p-4 border rounded-xl shadow-sm">
                      <h5 className="font-extrabold text-[11px] text-blue-900 border-b pb-1.5 uppercase font-mono">2. Redirect & Download Links</h5>
                      
                      <div className="space-y-1">
                        <label className="font-bold text-slate-705 block">Buy Now Checkout Link</label>
                        <input
                          type="text"
                          placeholder="/checkout?plan=prod-billing-pro"
                          value={productForm.buy_now_link}
                          onChange={(e) => setProductForm(p => ({ ...p, buy_now_link: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-705 block">Learn More Page Link</label>
                        <input
                          type="text"
                          placeholder="/software/prod-billing-pro"
                          value={productForm.learn_more_link}
                          onChange={(e) => setProductForm(p => ({ ...p, learn_more_link: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-705 block">Trial Download Link</label>
                        <input
                          type="text"
                          placeholder="/api/downloads/setup/prod-billing-pro?version=trial"
                          value={productForm.trial_download_url}
                          onChange={(e) => setProductForm(p => ({ ...p, trial_download_url: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-755 block">Full Setup.exe Purchase Download Link</label>
                        <input
                          type="text"
                          placeholder="/api/downloads/setup/prod-billing-pro?key=full"
                          value={productForm.setup_exe_url}
                          onChange={(e) => setProductForm(p => ({ ...p, setup_exe_url: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none font-mono text-[11px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-705 block">Version Tag</label>
                          <input
                            type="text"
                            placeholder="v4.2.1"
                            value={productForm.version}
                            onChange={(e) => setProductForm(p => ({ ...p, version: e.target.value }))}
                            className="w-full p-2 border bg-white rounded-lg focus:outline-none"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-705 block">Binary Size tag</label>
                          <input
                            type="text"
                            placeholder="14.8 MB"
                            value={productForm.size}
                            onChange={(e) => setProductForm(p => ({ ...p, size: e.target.value }))}
                            className="w-full p-2 border bg-white rounded-lg focus:outline-none"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Visual Branding Assets */}
                    <div className="space-y-3 bg-white p-4 border rounded-xl shadow-sm">
                      <h5 className="font-extrabold text-[11px] text-blue-900 border-b pb-1.5 uppercase font-mono">3. Creative Branding Assets</h5>
                      
                      <div className="space-y-1">
                        <label className="font-bold text-slate-705 block">Product Logo (Emoji or hosted PNG/SVG)</label>
                        <input
                          type="text"
                          placeholder="🛍️ or https://some-cdn.com/logo.png"
                          value={productForm.logo_url}
                          onChange={(e) => setProductForm(p => ({ ...p, logo_url: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-705 block">Thumbnail Image URL</label>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/photo-..."
                          value={productForm.thumbnail_url}
                          onChange={(e) => setProductForm(p => ({ ...p, thumbnailUrl: e.target.value, thumbnail_url: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-705 block">Card Banner Image URL</label>
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/photo-..."
                          value={productForm.banner_url}
                          onChange={(e) => setProductForm(p => ({ ...p, bannerUrl: e.target.value, banner_url: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-705 block">YouTube Demo Embed URL</label>
                        <input
                          type="text"
                          placeholder="https://www.youtube.com/embed/..."
                          value={productForm.demo_video_url}
                          onChange={(e) => setProductForm(p => ({ ...p, demo_video_url: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Column 4: Controls & Priority Orders */}
                    <div className="space-y-3 bg-white p-4 border rounded-xl shadow-sm text-[11px]">
                      <h5 className="font-extrabold text-[11px] text-blue-900 border-b pb-1.5 uppercase font-mono">4. Display Controls</h5>
                      
                      <div className="space-y-2 border-b pb-2">
                        <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={productForm.show_in_download_center}
                            onChange={(e) => setProductForm(p => ({ ...p, show_in_download_center: e.target.checked }))}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span>Show in Download Center</span>
                        </label>

                        <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={productForm.is_featured}
                            onChange={(e) => setProductForm(p => ({ ...p, is_featured: e.target.checked }))}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span>Featured Product</span>
                        </label>

                        <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={productForm.is_new_arrival}
                            onChange={(e) => setProductForm(p => ({ ...p, is_new_arrival: e.target.checked }))}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span>New Arrival Badge</span>
                        </label>

                        <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={productForm.is_bestseller}
                            onChange={(e) => setProductForm(p => ({ ...p, is_bestseller: e.target.checked }))}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span>Bestseller Badge</span>
                        </label>

                        <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={productForm.is_pinned}
                            onChange={(e) => setProductForm(p => ({ ...p, is_pinned: e.target.checked }))}
                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span>Pin Content At Top</span>
                        </label>

                        <label className="flex items-center gap-2 font-bold text-red-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={productForm.is_hidden}
                            onChange={(e) => setProductForm(p => ({ ...p, is_hidden: e.target.checked }))}
                            className="rounded text-red-650 focus:ring-red-500 h-4 w-4"
                          />
                          <span>Hide from Frontend List</span>
                        </label>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-705 block">Display Order Priority (Low is high priority)</label>
                        <input
                          type="number"
                          value={productForm.display_order}
                          onChange={(e) => setProductForm(p => ({ ...p, display_order: Number(e.target.value) }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none"
                        />
                        <p className="text-[10px] text-slate-400">Default: 10. E.g., 1 appears first, 100 appears last.</p>
                      </div>
                    </div>
                  </div>

                  {/* Descriptions and Features */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-blue-200/50 pt-3 text-xs">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">Short Description</label>
                        <textarea
                          rows={2}
                          placeholder="Lightweight, ultra-fast, offline retail billing desk app with multi-terminal..."
                          value={productForm.description}
                          onChange={(e) => setProductForm(p => ({ ...p, description: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none text-[11px]"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">Screenshot Links (one URL per line)</label>
                        <textarea
                          rows={2}
                          placeholder="https://images.unsplash.com/photo-..."
                          value={productForm.gallery}
                          onChange={(e) => setProductForm(p => ({ ...p, gallery: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none font-mono text-[10px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">Bullet Features Checklist (One feature per line - MAX 5 recommended)</label>
                        <textarea
                          rows={3}
                          placeholder="GST Invoicing & Taxation&#10;Offline first DB sync&#10;Thermal receipt customization"
                          value={productForm.features}
                          onChange={(e) => setProductForm(p => ({ ...p, features: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">Full Markdown Description / HTML Overview</label>
                        <textarea
                          rows={2}
                          placeholder="Detailed overview shown on product click..."
                          value={productForm.full_description}
                          onChange={(e) => setProductForm(p => ({ ...p, full_description: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none text-[11px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block">System Requirements spec</label>
                        <textarea
                          rows={2}
                          placeholder="OS: Windows 7, 8, 10, 11 (32-bit & 64-bit)&#10;Memory: 2 GB RAM minimum"
                          value={productForm.system_requirements}
                          onChange={(e) => setProductForm(p => ({ ...p, system_requirements: e.target.value }))}
                          className="w-full p-2 border bg-white rounded-lg focus:outline-none text-[11px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block">License Policy Info</label>
                          <input
                            type="text"
                            placeholder="Single-Terminal Lifetime Key"
                            value={productForm.license_info}
                            onChange={(e) => setProductForm(p => ({ ...p, license_info: e.target.value }))}
                            className="w-full p-2 border bg-white rounded-lg focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 block">Documentation PDF Guide URL</label>
                          <input
                            type="text"
                            placeholder="/manuals/user-guide.pdf"
                            value={productForm.manual_url}
                            onChange={(e) => setProductForm(p => ({ ...p, manual_url: e.target.value }))}
                            className="w-full p-2 border bg-white rounded-lg focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-blue-200/50 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingProduct(false);
                        setEditingProduct(null);
                        resetProductForm();
                      }}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg tracking-wide hover:shadow transition cursor-pointer"
                    >
                      {editingProduct ? 'UPDATE SOFTWARE DETAILS' : 'SAVE SOFTWARE PRODUCT'}
                    </button>
                  </div>
                </form>
              )}

              {/* Products List Grid */}
              <div className="space-y-3">
                <h5 className="text-xs font-black font-mono uppercase text-slate-500">Live Configured Software Catalog Products ({adminProducts.length})</h5>

                {productsLoading ? (
                  <div className="py-8 text-center text-slate-500 font-mono text-[11px]">
                    <span className="animate-pulse">Retrieving catalog records from Supabase...</span>
                  </div>
                ) : adminProducts.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl bg-slate-50 border border-dashed text-slate-500 text-xs">
                    No custom software products registered in database. Active defaults will be shown on frontend until added here.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {adminProducts.map((p) => {
                      const sampleImagesCount = Array.isArray(p.gallery) ? p.gallery.length : 0;
                      return (
                        <div key={p.id} className="bg-slate-50 hover:bg-slate-50/80 border p-4 rounded-2xl flex flex-col justify-between hover:shadow-sm transition text-xs text-slate-800" id={`admin-product-card-${p.id}`}>
                          <div className="space-y-2.5 text-left">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                                  {p.category || 'POS Utility'}
                                </span>
                                <h4 className="text-sm font-extrabold text-slate-900 mt-1">{p.name}</h4>
                                <p className="font-mono text-[10px] text-slate-500 font-medium">Slug Target: #{p.id} • Status: <span className={p.status === 'active' ? 'text-green-650 font-bold' : 'text-red-500'}>{p.status}</span></p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-slate-555 line-through block text-[10px]">₹{p.original_price || (p.price * 2)}</span>
                                <span className="text-blue-750 font-mono font-black text-sm block">₹{p.price}</span>
                              </div>
                            </div>

                            <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">{p.description}</p>

                            <div className="bg-white p-2.5 border border-slate-200/80 rounded-xl space-y-1.5 font-mono text-[10px] text-slate-500">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-600">Binary Installer (setup.exe):</span>
                                <span className="text-slate-800 break-all font-semibold max-w-[65%] text-right">{p.download_url}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-600">Specs / Capacity:</span>
                                <span className="text-slate-800 font-semibold">{p.version} • {p.size}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-600">Video Demonstration Link:</span>
                                <span className="text-slate-800 truncate font-semibold max-w-[65%] text-right" title={p.demo_video_url}>{p.demo_video_url || 'N/A'}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-600">Screenshots/Sample Images:</span>
                                <span className="text-slate-800 font-bold">{sampleImagesCount} connected link(s)</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 mt-4">
                            <button
                              onClick={() => {
                                handleCopyText(p.download_url, `dl-p-${p.id}`);
                              }}
                              className="text-[10px] text-slate-500 font-mono hover:text-slate-800 font-bold"
                            >
                              {copiedKeyId === `dl-p-${p.id}` ? 'COPIED LINK!' : 'COPY EXE LINK'}
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditProductClick(p)}
                                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg shadow-sm transition flex items-center gap-1 text-[10px] font-extrabold cursor-pointer"
                              >
                                <Edit size={11} />
                                <span>Edit Software</span>
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 border border-red-100 rounded-lg shadow-sm transition flex items-center gap-1 text-[10px] font-extrabold cursor-pointer"
                              >
                                <Trash2 size={11} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </RoleGuard>
      )}

      {/* -------------------- MODULE 6: DOWNLOAD CENTER MONITOR & CMS -------------------- */}
      {activeModule === 'downloads' && (
        <RoleGuard moduleId="downloads">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-6">
            
            {/* Header section with status metadata */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-sm">
                  <Download size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                    Module 6: Download Center CMS Manager
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Manage downloadable software listings on the website frontpage and review telemetry insights.</p>
                </div>
              </div>

              {/* simulated role status indicator */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Privilege:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  adminRole === 'super_admin' ? 'bg-purple-50 text-purple-750 border-purple-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {adminRole === 'super_admin' ? '🛡️ Super Admin' : `${adminRole?.toUpperCase() || 'Customer'}`}
                </span>
              </div>
            </div>

            {/* Privilege Warning Banner - if not Super Admin */}
            {adminRole !== 'super_admin' && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs flex items-start gap-2.5">
                <span className="text-base select-none">⚠️</span>
                <div>
                  <span className="font-bold">Restricted View Access:</span> You are currently viewing in Read-Only Mode. 
                  <p className="mt-1 font-mono text-[11.5px] text-slate-600">
                    Only <span className="font-bold text-slate-800">Super Admin</span> can Add, Edit, Delete software listings, manage downloads, or inspect analytics. 
                    Please use the simulated Role Controller in the navigation header to switch to Super Admin mode!
                  </p>
                </div>
              </div>
            )}

            {/* CMS Form for adding/editing solutions */}
            { (isAddingSolution || editingSolution) && adminRole === 'super_admin' ? (
              <form onSubmit={handleSaveSolution} className="bg-slate-50 border rounded-2xl p-6 space-y-4 text-xs text-slate-800 animate-fade-in text-left">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center justify-between">
                  <span>{editingSolution ? `✏️ Edit Product Details: ${editingSolution.title}` : '➕ Register New Downloadable Software'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSolution(null);
                      setIsAddingSolution(false);
                      resetSolutionForm();
                    }}
                    className="text-slate-400 hover:text-slate-600 font-normal px-2 py-1 text-xs"
                  >
                    Cancel
                  </button>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Unique Software ID (Slug) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. sol-repairing"
                      disabled={!!editingSolution}
                      value={solutionForm.id}
                      onChange={e => setSolutionForm({ ...solutionForm, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      className="w-full px-3 py-2 border rounded-xl bg-white font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Direct reference in code or database.</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Software Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mobile Repair Professional"
                      value={solutionForm.title}
                      onChange={e => setSolutionForm({ ...solutionForm, title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Subtitle / Tagline *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Professional repair shops accounts management"
                      value={solutionForm.subtitle}
                      onChange={e => setSolutionForm({ ...solutionForm, subtitle: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Category *</label>
                    <select
                      value={solutionForm.category}
                      onChange={e => setSolutionForm({ ...solutionForm, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    >
                      <option value="Billing Software">Billing Software</option>
                      <option value="Enterprise ERP">Enterprise ERP</option>
                      <option value="Education ERP">Education ERP</option>
                      <option value="POS & Retail">POS & Retail</option>
                      <option value="Hospitality ERP">Hospitality ERP</option>
                      <option value="Specialized ERP">Specialized ERP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Display Price *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ₹3,000"
                      value={solutionForm.price}
                      onChange={e => setSolutionForm({ ...solutionForm, price: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Mapped Plan ID *</label>
                    <input
                      type="text"
                      placeholder="e.g. prod-billing-pro"
                      value={solutionForm.mappedPlanId}
                      onChange={e => setSolutionForm({ ...solutionForm, mappedPlanId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-white font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Display Sort Order *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 10"
                      value={solutionForm.displayOrder}
                      onChange={e => setSolutionForm({ ...solutionForm, displayOrder: parseInt(e.target.value) || 10 })}
                      className="w-full px-3 py-2 border rounded-xl bg-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Card Badge</label>
                    <input
                      type="text"
                      placeholder="e.g. New Release"
                      value={solutionForm.badge}
                      onChange={e => setSolutionForm({ ...solutionForm, badge: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Badge Color</label>
                    <select
                      value={solutionForm.badgeColor}
                      onChange={e => setSolutionForm({ ...solutionForm, badgeColor: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    >
                      <option value="emerald">emerald (Green)</option>
                      <option value="blue">blue (Blue)</option>
                      <option value="rose">rose (Red)</option>
                      <option value="amber">amber (Yellow)</option>
                      <option value="indigo">indigo (Purple)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Emoji Icon</label>
                    <input
                      type="text"
                      placeholder="e.g. 🛠️"
                      value={solutionForm.icon}
                      onChange={e => setSolutionForm({ ...solutionForm, icon: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-white text-center font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">App Visibility *</label>
                    <select
                      value={solutionForm.status}
                      onChange={e => setSolutionForm({ ...solutionForm, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    >
                      <option value="active">Active (Visible in Download Center)</option>
                      <option value="inactive">Inactive (Hidden from Download Center)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Download Executable URL (.EXE Setup File) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. https://bspsuryatech.in/downloads/repairing-setup.exe"
                    value={solutionForm.exeUrl}
                    onChange={e => setSolutionForm({ ...solutionForm, exeUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-white font-mono text-[11px] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Overview Description *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe what client-facing operations this software helps solve..."
                    value={solutionForm.description}
                    onChange={e => setSolutionForm({ ...solutionForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Feature Bullet points (One per Line) *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="e.g.&#10;Job Card & Repair workflow&#10;Spare part inventory stock depletion tracking&#10;Customer WhatsApp invoice notifications&#10;Due accounts ledger reports"
                    value={solutionForm.features}
                    onChange={e => setSolutionForm({ ...solutionForm, features: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-white font-mono focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Provide up to 8 core features, each on its own line.</p>
                </div>

                <div className="flex items-center justify-end gap-3 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSolution(null);
                      setIsAddingSolution(false);
                      resetSolutionForm();
                    }}
                    className="px-4 py-2 border rounded-xl bg-white hover:bg-slate-50 font-semibold text-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-red-650 hover:bg-red-700 font-bold text-white transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Save Listing</span>
                  </button>
                </div>
              </form>
            ) : null}

            {/* Main CMS Listings Split-Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT SIDE: LISTING TABLE */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border">
                  
                  {/* Search box */}
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search software by Title, Category..."
                      value={solutionSearch}
                      onChange={(e) => setSolutionSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 border rounded-xl text-xs bg-white focus:outline-none"
                    />
                  </div>

                  {/* Right hand CMS listings control */}
                  <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                    {adminRole === 'super_admin' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            resetSolutionForm();
                            setEditingSolution(null);
                            setIsAddingSolution(true);
                          }}
                          className="px-3 py-1.5 bg-red-650 hover:bg-red-700 text-white font-bold rounded-xl flex items-center gap-1 text-[11px] border border-red-700 transition cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>Add Software</span>
                        </button>

                        {solutionSelectedIds.length > 0 && (
                          <button
                            type="button"
                            onClick={handleBulkDeleteSolutions}
                            className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl flex items-center gap-1 text-[11px] transition cursor-pointer"
                          >
                            <Trash2 size={12} />
                            <span>Bulk Delete ({solutionSelectedIds.length})</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Software listings database inventory */}
                <div className="overflow-x-auto border rounded-2xl bg-white shadow-sm">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b text-slate-500 font-mono text-[9.5px] uppercase tracking-wider">
                        <th className="p-3 w-8">
                          {adminRole === 'super_admin' && (
                            <input
                              type="checkbox"
                              checked={adminSolutions.length > 0 && solutionSelectedIds.length === adminSolutions.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSolutionSelectedIds(adminSolutions.map(s => s.id));
                                } else {
                                  setSolutionSelectedIds([]);
                                }
                              }}
                              className="rounded border-slate-300 text-primary focus:ring-1 focus:ring-slate-350 cursor-pointer"
                            />
                          )}
                        </th>
                        <th className="p-3">Software listing details</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Map Plan / Order</th>
                        <th className="p-3">Price</th>
                        <th className="p-3 w-20 text-center">Visibility</th>
                        <th className="p-3 w-16 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {solutionsLoading ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-550 font-mono">
                            🔄 Loading software listings...
                          </td>
                        </tr>
                      ) : adminSolutions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            No downloadable software defined yet. Click "Add Software" to load.
                          </td>
                        </tr>
                      ) : (
                        adminSolutions
                          .filter(s => {
                            const q = solutionSearch.toLowerCase();
                            return !q || 
                                   (s.title || '').toLowerCase().includes(q) || 
                                   (s.category || '').toLowerCase().includes(q) ||
                                   (s.subtitle || '').toLowerCase().includes(q);
                          })
                          .sort((a, b) => (a.displayOrder ?? 10) - (b.displayOrder ?? 10))
                          .map((sol) => {
                            const isChecked = solutionSelectedIds.includes(sol.id);
                            return (
                              <tr key={sol.id} className="hover:bg-slate-50/70 transition">
                                <td className="p-3">
                                  {adminRole === 'super_admin' && (
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setSolutionSelectedIds(prev => prev.filter(x => x !== sol.id));
                                        } else {
                                          setSolutionSelectedIds(prev => [...prev, sol.id]);
                                        }
                                      }}
                                      className="rounded border-slate-300 cursor-pointer"
                                    />
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-xl select-none">{sol.icon || '📦'}</span>
                                    <div>
                                      <div className="font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                                        <span>{sol.title}</span>
                                        {sol.badge && (
                                          <span className={`px-1.5 py-0.2 text-[8px] font-bold rounded uppercase border shrink-0 ${
                                            sol.badgeColor === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                            sol.badgeColor === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            sol.badgeColor === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            sol.badgeColor === 'indigo' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                                          }`}>
                                            {sol.badge}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-500 line-clamp-1">{sol.subtitle}</div>
                                      <div className="text-[9px] text-slate-400 font-mono mt-0.5">{sol.id}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-slate-600 text-[10.5px]">
                                  {sol.category}
                                </td>
                                <td className="p-3">
                                  <div className="font-mono text-[9.5px] text-slate-700 font-semibold">{sol.mappedPlanId || '-'}</div>
                                  <div className="text-[9.5px] text-slate-400">Order: {sol.displayOrder ?? 10}</div>
                                </td>
                                <td className="p-3 font-semibold text-slate-800">
                                  {sol.price}
                                </td>
                                <td className="p-3 text-center">
                                  {adminRole === 'super_admin' ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleSolutionVisibility(sol.id, sol.status || 'active', sol.title)}
                                      className={`px-2 py-0.5 text-[9.5px] font-bold rounded-full border transition cursor-pointer ${
                                        sol.status === 'inactive'
                                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                                      }`}
                                    >
                                      {sol.status === 'inactive' ? 'Hidden' : 'Visible'}
                                    </button>
                                  ) : (
                                    <span className={`px-2 py-0.5 text-[9.5px] font-bold rounded-full border ${
                                      sol.status === 'inactive'
                                        ? 'bg-slate-100 text-slate-405 border-slate-150'
                                        : 'bg-emerald-50/50 text-emerald-650 border-emerald-100'
                                    }`}>
                                      {sol.status === 'inactive' ? 'Hidden' : 'Visible'}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {adminRole === 'super_admin' ? (
                                      <>
                                        <button
                                          onClick={() => {
                                            setEditingSolution(sol);
                                            setSolutionForm({
                                              id: sol.id,
                                              title: sol.title || '',
                                              subtitle: sol.subtitle || '',
                                              category: sol.category || 'Billing Software',
                                              description: sol.description || '',
                                              price: sol.price || '₹3,000',
                                              features: (sol.features || []).join('\n'),
                                              icon: sol.icon || '🛍️',
                                              badge: sol.badge || '',
                                              badgeColor: sol.badgeColor || 'emerald',
                                              exeUrl: sol.exeUrl || '',
                                              mappedPlanId: sol.mappedPlanId || 'prod-billing-pro',
                                              status: (sol.status || 'active') as 'active' | 'inactive',
                                              displayOrder: sol.displayOrder ?? 10
                                            });
                                            setIsAddingSolution(false);
                                          }}
                                          className="p-1 hover:bg-slate-100 rounded text-blue-650 transition cursor-pointer"
                                          title="Edit listings parameters"
                                        >
                                          <Edit size={13} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteSolution(sol.id, sol.title)}
                                          className="p-1 hover:bg-slate-100 rounded text-red-650 transition cursor-pointer"
                                          title="Delete listings"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-[9.5px] text-slate-400 font-mono italic">Locked</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RIGHT SIDE: TELEMETRY & ANALYTICS MONITOR */}
              <div className="lg:col-span-4 space-y-4">
                {adminRole === 'super_admin' ? (
                  <div className="space-y-4 animate-fade-in text-left">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                      📊 Telemetry Insights
                    </h4>
                    
                    <div className="bg-slate-50 border p-4 rounded-xl">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block font-mono">GLOBAL DOWNLOAD COUNTS</span>
                      <span className="text-2xl font-black text-slate-800 mt-1 block leading-none">1,420 pulls</span>
                      <p className="text-[9.5px] text-slate-500 mt-2 font-light">Includes Retail Pro as dominant component (82%).</p>
                    </div>

                    <div className="bg-slate-50 border p-4 rounded-xl">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block font-mono">CDN CACHE EFFICIENCY</span>
                      <span className="text-2xl font-black text-emerald-655 mt-1 block leading-none">99.82% HIT</span>
                      <p className="text-[9.5px] text-slate-500 mt-2 font-light">Cloudflare backup nodes Raipur sync operational.</p>
                    </div>

                    <div className="bg-slate-50 border p-4 rounded-xl">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest block font-mono">CLIENT DESKTOP CRASHES</span>
                      <span className="text-2xl font-black text-slate-850 mt-1 block leading-none">0.00% Zero</span>
                      <p className="text-[9.5px] text-slate-500 mt-2 font-light">Handshake crash telemetry matches active licenses.</p>
                    </div>

                    <div className="p-4 bg-slate-950 text-white rounded-xl font-mono text-xs space-y-2">
                       <h4 className="text-[10px] text-slate-455 font-black uppercase tracking-wider">Client pull activity telemetry stream:</h4>
                       <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                         <div className="text-slate-355 text-[10.5px] flex items-center justify-between border-b border-rose-950 pb-1">
                           <span>📥 IP 223.185.94.102 • Downloaded 'Suryatech_Billing_v4.2.2.exe'</span>
                           <span className="text-slate-500 font-light text-[9px]">Raipur • 2 min ago</span>
                         </div>
                         <div className="text-slate-355 text-[10.5px] flex items-center justify-between border-b border-rose-950 pb-1">
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
                ) : (
                  <div className="bg-slate-50 border border-dashed rounded-2xl p-6 text-center select-none flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 mb-3 shadow-inner text-xs">
                      🔒
                    </div>
                    <h4 className="text-xs font-bold text-slate-700">Analytics Panel Locked</h4>
                    <p className="text-[10px] text-slate-405 max-w-[200px] mt-1.5 leading-relaxed">
                      CDN cache ratios, telemetry pulls streams, and client crashes metrics are guarded. Elevate to <span className="font-semibold text-slate-650">Super Admin</span> in the header role controller to unlock.
                    </p>
                  </div>
                )}
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
                    <th className="p-3 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[11.5px]">
                  {adminInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">No GST transaction invoices recorded yet. Clear escrow orders in Module 1 to populate ledger.</td>
                    </tr>
                  ) : (
                    adminInvoices.map((inv, idx) => {
                      const net = inv.net_amount || (inv.amount / 1.18);
                      const tax = inv.gst_amount || (inv.amount - net);
                      const matchedCustomer = adminCustomers.find((c: any) => 
                        (c.id && inv.userId && String(c.id) === String(inv.userId)) ||
                        (c.email_address && inv.emailAddress && String(c.email_address).toLowerCase() === String(inv.emailAddress).toLowerCase()) ||
                        (c.client_name && inv.client_name && String(c.client_name).toLowerCase() === String(inv.client_name).toLowerCase())
                      );
                      
                      return (
                        <tr key={inv.id || idx} className="hover:bg-slate-50">
                          <td className="p-3">
                            <span className="font-black text-rose-850">{inv.invoice_number || inv.invoiceNumber}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">ID Ref: {inv.id}</span>
                          </td>
                          <td className="p-3">
                            <div className="font-sans font-semibold text-slate-800 leading-none">{inv.client_name || inv.clientName}</div>
                            <span className="text-[10px] text-rose-700 bg-rose-50 border px-1 rounded block w-fit mt-1 font-mono">{inv.gst_number || inv.gstNumber || (matchedCustomer && matchedCustomer.gst_number) || 'B2C CUSTOMER'}</span>
                          </td>
                          <td className="p-3 text-slate-500 truncate max-w-[150px] font-sans">{inv.product_name || inv.productName || 'Retail Billing Standard'}</td>
                          <td className="p-3 text-right text-slate-650">₹{Math.round(net).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-rose-700 font-bold">₹{Math.round(tax).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-slate-800 font-black text-[12.5px]">₹{(inv.amount || 3000).toLocaleString('en-IN')}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setShowInvoiceDetailsModal(true);
                              }}
                              className="p-1 px-2.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 font-sans text-[11px] font-semibold border"
                              title="View & Print Customer Profile Invoice"
                            >
                              <Eye size={12} className="text-rose-600" />
                              <span>View & Print</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Profile Invoice Modal with Print Capability */}
            {showInvoiceDetailsModal && selectedInvoice && (() => {
              const net = Math.round(selectedInvoice.net_amount || selectedInvoice.netAmount || (selectedInvoice.amount / 1.18));
              const tax = Math.round(selectedInvoice.gst_amount || selectedInvoice.gstAmount || (selectedInvoice.amount - net));
              const cgst = Math.round(tax / 2);
              const sgst = Math.round(tax / 2);

              const matchedCustomer = adminCustomers.find((c: any) => 
                (c.id && selectedInvoice.userId && String(c.id) === String(selectedInvoice.userId)) ||
                (c.email_address && selectedInvoice.emailAddress && String(c.email_address).toLowerCase() === String(selectedInvoice.emailAddress).toLowerCase()) ||
                (c.client_name && selectedInvoice.client_name && String(c.client_name).toLowerCase() === String(selectedInvoice.client_name).toLowerCase())
              );

              return (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col font-sans">
                    
                    {/* Header */}
                    <div className="p-5 px-6 border-b flex items-center justify-between bg-slate-900 text-white rounded-t-3xl">
                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base tracking-tight leading-none">
                          Tax Invoice & Profile Registry View
                        </h4>
                        <p className="text-[10px] text-slate-350 font-mono mt-1">
                          Invoice ID: {selectedInvoice.invoice_number || selectedInvoice.invoiceNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintInvoice(selectedInvoice)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Printer size={13} />
                          <span>Print / PDF</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowInvoiceDetailsModal(false);
                            setSelectedInvoice(null);
                          }}
                          className="p-1.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-slate-300 hover:text-white"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Content Body */}
                    <div className="p-6 overflow-y-auto space-y-6 bg-slate-50 flex-1">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* LEFT COLUMN: THE INVOICE SCHEMATIC REPLICA */}
                        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 text-slate-800 relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-black tracking-widest px-3 py-1 font-mono rounded-bl-lg uppercase">
                            ORIGINAL RECIPIENT
                          </div>
                          
                          {/* Corporate Branding Header */}
                          <div className="flex justify-between items-start border-b pb-4">
                            <div>
                              <span className="font-black text-rose-700 tracking-tight text-sm">BSP SURYATECH</span>
                              <div className="text-[9px] text-slate-400 font-mono uppercase mt-0.5 tracking-wider font-bold">SOFTWARE SOLUTIONS</div>
                            </div>
                            <div className="text-right text-[10px] text-slate-500 leading-normal">
                              <span className="font-extrabold text-slate-800">BSP SURYATECH PRIVATE LTD</span><br />
                              Shankar Nagar, Raipur (CG) 492004<br />
                              GSTIN: 22AAIFB7315M1ZK
                            </div>
                          </div>

                          <div className="border-b pb-4 grid grid-cols-2 gap-4 text-[11px] leading-relaxed">
                            <div>
                              <span className="text-[9px] text-slate-400 font-black tracking-wider uppercase block">INVOICED TO</span>
                              <strong className="text-slate-800 text-xs block mt-0.5">{selectedInvoice.client_name || selectedInvoice.clientName}</strong>
                              <span className="text-slate-600 block">{selectedInvoice.businessName || selectedInvoice.business_name || (matchedCustomer && matchedCustomer.business_name) || "Individual POS Client"}</span>
                              <span className="text-slate-500 block truncate">{selectedInvoice.emailAddress || selectedInvoice.email_address || (matchedCustomer && matchedCustomer.email_address) || "client@suryatech.in"}</span>
                              <span className="text-[10px] text-rose-800 font-bold bg-rose-50 px-1 border border-rose-200 rounded mt-1 inline-block">
                                GSTIN: {selectedInvoice.gst_number || selectedInvoice.gstNumber || (matchedCustomer && matchedCustomer.gst_number) || "B2C UNREGISTERED"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-black tracking-wider uppercase block">INVOICE METADATA</span>
                              <div className="mt-1 space-y-1 text-slate-600">
                                <div><strong className="text-slate-700">Invoice No:</strong> <span className="font-mono text-rose-700 font-bold">{selectedInvoice.invoice_number || selectedInvoice.invoiceNumber}</span></div>
                                <div><strong className="text-slate-700">Dated:</strong> {new Date(selectedInvoice.created_at || selectedInvoice.createdAt).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</div>
                                <div><strong className="text-slate-700">Order ID:</strong> <span className="font-mono text-xs">{selectedInvoice.orderId || "BSP-ORD-SLOT"}</span></div>
                                <div><strong className="text-slate-700">Place of Supply:</strong> CG (Code 22)</div>
                              </div>
                            </div>
                          </div>

                          {/* Line items table */}
                          <div className="space-y-2">
                            <span className="text-[9px] text-slate-400 font-black tracking-wider uppercase block">TAXABLE SERVICE COMPONENTS</span>
                            <div className="border rounded-xl overflow-hidden">
                              <table className="w-full text-left text-[11px] font-mono">
                                <thead className="bg-slate-50 border-b">
                                  <tr className="text-slate-500">
                                    <th className="p-2 pl-3">ITEM DESCRIPTION</th>
                                    <th className="p-2 text-center">HSN</th>
                                    <th className="p-2 text-right">BASE RATE</th>
                                    <th className="p-2 pr-3 text-right">GST</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="bg-white">
                                    <td className="p-2.5 pl-3 font-semibold text-slate-800">
                                      {selectedInvoice.product_name || selectedInvoice.productName || 'BSP Retail POS License'}
                                    </td>
                                    <td className="p-2.5 text-center text-slate-500">997331</td>
                                    <td className="p-2.5 text-right text-slate-650">₹{Math.round(net).toLocaleString('en-IN')}</td>
                                    <td className="p-2.5 pr-3 text-right text-rose-700 font-bold">18%</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* CGST, SGST Summary */}
                          <div className="flex justify-end pt-2">
                            <div className="w-64 space-y-1.5 font-mono text-[11px] text-slate-600">
                              <div className="flex justify-between border-b pb-1">
                                <span>Taxable Val (Base):</span>
                                <span className="text-slate-800 font-medium">₹{Math.round(net).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>CGST (9.0%):</span>
                                <span>₹{cgst.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between border-b pb-1.5">
                                <span>SGST (9.0%):</span>
                                <span>₹{sgst.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between text-xs font-black text-rose-800 bg-rose-50/50 p-1 px-2 rounded-lg border border-rose-100">
                                <span>Gross Bill Total:</span>
                                <span className="text-sm">₹{(selectedInvoice.amount || 3000).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>

                          {/* License key display */}
                          <div className="bg-slate-50 p-3 rounded-xl border flex flex-col gap-1 text-[11px] font-mono">
                            <span className="text-[9px] text-slate-400 font-black tracking-wider uppercase block">ACTIVATED LICENSE SERIAL KEY</span>
                            <div className="flex items-center gap-1.5 text-rose-800 font-black bg-rose-50 p-1.5 px-2 rounded w-fit border border-rose-100">
                              <span>🔑</span>
                              <span>{selectedInvoice.licenseKey || selectedInvoice.license_key || 'BSPS-RETL-PRO-K93F-92JD-L03A-84Y7'}</span>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: RECIPIENT CLIENT PROFILE DETAILS */}
                        <div className="lg:col-span-5 space-y-5">
                          <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                            <h5 className="font-extrabold text-xs sm:text-sm text-slate-800 uppercase tracking-tight flex items-center gap-1.5 border-b pb-3">
                              <span className="p-1 px-1.5 bg-rose-100 text-rose-700 rounded-lg text-[10px]">👤</span>
                              <span>Complete Recipient Profile Details</span>
                            </h5>

                            <div className="space-y-3.5 text-xs">
                              <div className="grid grid-cols-3 py-1 border-b">
                                <span className="text-slate-400 font-medium col-span-1">Client ID:</span>
                                <span className="text-slate-800 font-bold font-mono col-span-2">{selectedInvoice.userId || 'BSP-CL-USER'}</span>
                              </div>
                              
                              <div className="grid grid-cols-3 py-1 border-b">
                                <span className="text-slate-400 font-medium col-span-1">Full Name:</span>
                                <span className="text-slate-800 font-black col-span-2">{selectedInvoice.client_name || selectedInvoice.clientName}</span>
                              </div>

                              <div className="grid grid-cols-3 py-1 border-b">
                                <span className="text-slate-400 font-medium col-span-1">Registered Email:</span>
                                <span className="text-slate-800 font-bold col-span-2 break-all">{selectedInvoice.emailAddress || selectedInvoice.email_address || (matchedCustomer && matchedCustomer.email_address) || "surajsurya.koo7@gmail.com"}</span>
                              </div>

                              <div className="grid grid-cols-3 py-1 border-b">
                                <span className="text-slate-400 font-medium col-span-1">Contact Phone:</span>
                                <span className="text-slate-800 font-semibold col-span-2">{selectedInvoice.contactNumber || selectedInvoice.contact_number || (matchedCustomer && matchedCustomer.contact_number) || "+91 95169 16415"}</span>
                              </div>

                              <div className="grid grid-cols-3 py-1 border-b">
                                <span className="text-slate-400 font-medium col-span-1">Business Name:</span>
                                <span className="text-slate-800 col-span-2 font-medium">{selectedInvoice.businessName || selectedInvoice.business_name || (matchedCustomer && matchedCustomer.business_name) || "Surya Enterprise Solutions Raipur"}</span>
                              </div>

                              <div className="grid grid-cols-3 py-1 border-b">
                                <span className="text-slate-400 font-medium col-span-1">GSTIN Number:</span>
                                <span className="text-rose-700 font-bold font-mono col-span-2 bg-rose-50 border border-rose-100 px-1 py-0.5 rounded w-fit">
                                  {selectedInvoice.gst_number || selectedInvoice.gstNumber || (matchedCustomer && matchedCustomer.gst_number) || "B2C UNREGISTERED"}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 py-1 border-b">
                                <span className="text-slate-400 font-medium col-span-1">Core Address:</span>
                                <span className="text-slate-700 col-span-2 leading-tight">
                                  {matchedCustomer?.city ? `${matchedCustomer.city}, ${matchedCustomer.state}, India` : 'Raipur, Chhattisgarh, 492001'}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 py-1 border-b">
                                <span className="text-slate-400 font-medium col-span-1">Registration Date:</span>
                                <span className="text-slate-650 col-span-2 font-mono">
                                  {matchedCustomer?.created_at ? new Date(matchedCustomer.created_at).toLocaleDateString() : '21-Jun-2026'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick SLA Helpdesk Support status box */}
                          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-inner space-y-2 text-xs">
                            <div className="flex items-center gap-2 text-rose-400 font-extrabold text-[11px] uppercase tracking-wider">
                              <span>🛡️</span>
                              <span>Licensed System Handshake</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed text-[11px]">
                              This client is fully registered in our administrative master database. Hardware nodes can securely authenticate offline setups against these active credentials using license handshake handovers.
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Footer buttons */}
                    <div className="p-4 px-6 border-t flex justify-end gap-2 bg-slate-100">
                      <button
                        onClick={() => {
                          setShowInvoiceDetailsModal(false);
                          setSelectedInvoice(null);
                        }}
                        className="p-1.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Close View Dialog
                      </button>
                    </div>

                  </div>
                </div>
              );
            })()}

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
                <span className="text-[9.5px] font-bold text-slate-500 font-mono tracking-widest block uppercase p-3 border-b bg-white">SUPPORT TICKETS POOL</span>
                <div className="divide-y bg-white">
                  {filteredTickets.length === 0 ? (
                    <p className="p-4 text-center text-xs text-slate-400 font-mono">No active ticket issues open.</p>
                  ) : (
                    filteredTickets.map((t, idx) => {
                      const unpacked = deserializeTicketDescription(t.description);
                      const priority = unpacked.priority || 'medium';
                      return (
                        <div 
                          key={t.id || idx}
                          onClick={() => setSelectedTicket(t)}
                          className={`p-3.5 text-left cursor-pointer transition-colors ${
                            selectedTicket && selectedTicket.id === t.id 
                              ? 'bg-rose-50 border-r-4 border-red-700' 
                              : 'hover:bg-slate-55 bg-white border-b border-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[9px] font-mono mb-1 gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-500 uppercase">{t.category}</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1 py-0.2 rounded text-[8px] font-black uppercase ${
                                priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-105 text-slate-600'
                              }`}>{priority}</span>
                              <span className={`px-1 py-0.2 rounded text-[8px] font-black uppercase ${
                                t.status === 'open' ? 'bg-blue-105 text-blue-700' :
                                t.status === 'in_progress' ? 'bg-amber-100 text-amber-900' :
                                t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-slate-205 text-slate-700'
                              }`}>{t.status.replace('_', ' ')}</span>
                            </div>
                          </div>
                          <h4 className="text-xs font-sans font-black text-slate-800 leading-tight line-clamp-1">{t.title}</h4>
                          <span className="text-[9.5px] text-slate-433 mt-1.5 block font-mono truncate leading-none">{t.userEmail || t.user_email}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat Thread Right */}
              <div className="lg:col-span-2 border rounded-2xl bg-white p-5 flex flex-col justify-between min-h-[500px]">
                {(() => {
                  const activeTk = getSelectedTicketDetails();
                  if (!activeTk) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400 font-mono">
                        <MessageSquare size={28} className="mb-2 text-slate-300" />
                        <span>Select an unresolved support ticket from the list to launch SLA workspace.</span>
                      </div>
                    );
                  }

                  const custInfo = activeTk.customerDetails;

                  return (
                    <div className="space-y-4 flex flex-col flex-1 text-xs">
                      
                      {/* Rich Action & Status Header */}
                      <div className="border-b pb-3 flex items-start justify-between flex-wrap gap-3">
                        <div className="space-y-1 max-w-[70%]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-mono text-slate-400 block tracking-widest uppercase font-bold">ID: {activeTk.id}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                              activeTk.priority === 'urgent' ? 'bg-red-50 text-red-600 border border-red-100' :
                              activeTk.priority === 'high' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                              activeTk.priority === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              'bg-slate-50 text-slate-600 border border-slate-200'
                            }`}>
                              {activeTk.priority} priority
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Category: {activeTk.category}</span>
                          </div>
                          <h3 className="text-sm font-sans font-black text-slate-900 leading-tight">{activeTk.title}</h3>
                          <span className="text-[11px] font-mono text-slate-550 block font-bold leading-none">
                            Sender: {activeTk.user_name || activeTk.userName || 'Unknown'} ({activeTk.user_email || activeTk.userEmail})
                          </span>
                        </div>

                        {/* Interactive Status Selector & Solved quick buttons */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className="flex items-center gap-1">
                            <label className="text-[9px] font-bold text-slate-400 font-mono uppercase">Status:</label>
                            <select
                              value={activeTk.status}
                              onChange={(e) => handleUpdateTicketStatus(activeTk.id, e.target.value)}
                              className="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-[10px] font-black uppercase text-slate-800 focus:outline-none"
                            >
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>
                          
                          <div className="flex gap-1">
                            {activeTk.status !== 'resolved' && activeTk.status !== 'closed' ? (
                              <button 
                                onClick={() => handleUpdateTicketStatus(activeTk.id, 'resolved')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-mono text-[9px] uppercase tracking-wide rounded cursor-pointer transition-colors"
                              >
                                Solve Ticket
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleUpdateTicketStatus(activeTk.id, 'open')}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold font-mono text-[9px] uppercase tracking-wide rounded cursor-pointer transition-colors"
                              >
                                Reopen
                              </button>
                            )}
                            {(activeTk.status !== 'closed') && (
                              <button 
                                onClick={() => handleUpdateTicketStatus(activeTk.id, 'closed')}
                                className="px-2 py-1 bg-slate-700 hover:bg-slate-800 text-white font-bold font-mono text-[9px] uppercase tracking-wide rounded cursor-pointer transition-colors"
                              >
                                Close
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Customer Profile CRM Widget */}
                      <div className="bg-slate-100/50 border border-slate-200 p-3 rounded-2xl space-y-1.5 text-[10.5px]">
                        <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider block uppercase">CRM CLIENT CONTACT PROFILE</span>
                        {custInfo ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-mono leading-normal">
                            <div>
                              <span className="font-bold text-slate-500">FullName:</span> {custInfo.client_name || custInfo.clientName}
                            </div>
                            <div>
                              <span className="font-bold text-slate-500">Business:</span> {custInfo.business_name || custInfo.businessName}
                            </div>
                            <div>
                              <span className="font-bold text-slate-500">Contact #:</span> {custInfo.contact_number || custInfo.contactNumber}
                            </div>
                            <div>
                              <span className="font-bold text-slate-450">GSTIN:</span> {custInfo.gst_number || custInfo.gstNumber || 'N/A'}
                            </div>
                            <div className="sm:col-span-2">
                              <span className="font-bold text-slate-500">Address:</span> {custInfo.city || 'N/A'}, {custInfo.state || 'N/A'} 
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-450 italic font-mono text-[9.5px]">No matching CRM client profile found in local registries. Displaying verified email: {activeTk.user_email || activeTk.userEmail}</p>
                        )}
                      </div>

                      {/* Messages Stream */}
                      <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[300px] p-3 bg-slate-50 rounded-xl font-mono">
                        
                        {/* Initial client raise text */}
                        <div className="bg-white border p-3 rounded-xl space-y-2 shadow-sm text-left">
                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <span className="font-extrabold text-blue-700 uppercase">Original Raising Query</span>
                            <span>{safeFormatDate(activeTk.created_at || activeTk.createdAt)} {safeFormatTime(activeTk.created_at || activeTk.createdAt)}</span>
                          </div>
                          <p className="text-slate-750 leading-relaxed italic whitespace-pre-wrap">{activeTk.description}</p>
                          
                          {/* Client attachments if any */}
                          {activeTk.attachments && activeTk.attachments.length > 0 && (
                            <div className="border-t pt-2 mt-2">
                              <span className="text-[8.5px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">SECURE ATTACHMENTS</span>
                              <div className="flex flex-wrap gap-2">
                                {activeTk.attachments.map((file: any, fidx: number) => (
                                  <a
                                    key={fidx}
                                    href={file.data}
                                    download={file.name}
                                    className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded text-red-700 text-[10px] font-bold transition-all"
                                  >
                                    <FileText size={10} className="text-red-500 shrink-0" />
                                    <span className="max-w-[150px] truncate">{file.name}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Conversational timeline stream */}
                        {activeTk.replies.map((r: any, idx: number) => {
                          const isNote = r.isInternal || r.isInternalNote;
                          return (
                            <div 
                              key={r.id || idx} 
                              className={`p-3 rounded-xl border space-y-1.5 ${
                                isNote 
                                  ? 'bg-amber-50 border-amber-200 text-slate-800 ml-6 text-left border-dashed'
                                  : r.authorRole === 'admin' 
                                    ? 'bg-red-50 border-rose-100 text-slate-800 ml-6 text-left' 
                                    : 'bg-white border-slate-100 text-slate-700 mr-6 text-left'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[9px] text-slate-450 border-b pb-1">
                                <span className={`font-black ${isNote ? 'text-amber-700' : 'text-slate-600'}`}>
                                  {r.authorName} {isNote ? '[INTERNAL NOTE]' : `[${r.authorRole.toUpperCase()}]`}
                                </span>
                                <span>{safeFormatDate(r.createdAt || r.created_at)} {safeFormatTime(r.createdAt || r.created_at)}</span>
                              </div>
                              <p className="leading-relaxed leading-normal whitespace-pre-wrap">{r.message}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Typing response console with Reply vs Internal tabs */}
                      <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-2">
                        <div className="flex gap-2 border-b pb-1.5">
                          <button
                            type="button"
                            onClick={() => setAdminTicketTab('reply')}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                              adminTicketTab === 'reply' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            Reply to Customer (App Notification Triggered)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminTicketTab('internal')}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                              adminTicketTab === 'internal' ? 'bg-amber-500 text-white' : 'text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            Staff Internal Note
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            required
                            placeholder={
                              adminTicketTab === 'internal' 
                                ? "Write technical notes or private reminders visible ONLY inside the admin team console..."
                                : "Write public resolution update visible to customer..."
                            }
                            value={adminReplyText}
                            onChange={(e) => setAdminReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendTicketReply()}
                            className="flex-grow p-2.5 bg-white border rounded-xl text-slate-800 text-xs focus:outline-none focus:border-red-650 font-mono"
                          />
                          <button 
                            type="button"
                            onClick={handleSendTicketReply}
                            disabled={submittingReply}
                            className={`px-4 py-2.5 rounded-xl font-black uppercase shrink-0 cursor-pointer text-[10px] tracking-wider text-white transition-colors ${
                              adminTicketTab === 'internal' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-950 hover:bg-slate-800'
                            }`}
                          >
                            {submittingReply ? 'SAVING...' : adminTicketTab === 'internal' ? 'SAVE NOTE' : 'DISPATCH'}
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })()}
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

      {/* -------------------- DISCOUNT COUPON CAMPAIGNS MANAGER -------------------- */}
      {activeModule === 'coupons' && (
        <RoleGuard moduleId="coupons">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-coupons">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Percent size={20} className="text-[#2563EB]" />
                  <span>Module 19: Discount Coupon Campaigns</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">Configure active promotional discounts, customer acquisition incentives, and special cart overrides.</p>
              </div>
              <button
                onClick={() => openCouponModal()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
              >
                <Plus size={14} />
                <span>Initialize Campaign</span>
              </button>
            </div>

            {/* STATS SECTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 border p-4.5 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Campaigns</span>
                <div className="text-2xl font-black text-slate-800">{coupons.length}</div>
                <p className="text-[9.5px] text-slate-500 font-mono text-left">Registered promo codes</p>
              </div>
              <div className="bg-slate-50 border p-4.5 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Active Campaigns</span>
                <div className="text-2xl font-black text-emerald-600">
                  {coupons.filter(c => c.status === 'active' || c.active === true).length}
                </div>
                <p className="text-[9.5px] text-slate-500 font-mono text-left">Live on checkout panels</p>
              </div>
              <div className="bg-slate-50 border p-4.5 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Redemptions</span>
                <div className="text-2xl font-black text-blue-600">{redemptions.length}</div>
                <p className="text-[9.5px] text-slate-500 font-mono text-left">Successful checkout uses</p>
              </div>
              <div className="bg-slate-50 border p-4.5 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Developer Override</span>
                <div className="text-lg font-black text-indigo-600 font-mono">
                  SURYA001
                </div>
                <p className="text-[9.5px] text-slate-500 font-mono text-left">Forces cart charge to ₹1.00</p>
              </div>
            </div>

            {/* SEARCH AND FILTERS */}
            <div className="bg-slate-50 p-4 border rounded-2xl flex flex-col md:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search campaigns by code or name..."
                  value={couponSearch}
                  onChange={e => setCouponSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border rounded-xl text-xs font-bold outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={couponFilterStatus}
                  onChange={e => setCouponFilterStatus(e.target.value as any)}
                  className="px-3 py-2 bg-white border rounded-xl text-xs font-bold outline-none"
                >
                  <option value="all">Status: All</option>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                  <option value="expired">Expired</option>
                </select>
                <select
                  value={couponFilterType}
                  onChange={e => setCouponFilterType(e.target.value as any)}
                  className="px-3 py-2 bg-white border rounded-xl text-xs font-bold outline-none"
                >
                  <option value="all">Type: All Discounts</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Price</option>
                </select>
                <button
                  type="button"
                  onClick={loadCouponsCampaigns}
                  className="p-2 bg-white border hover:bg-slate-50 rounded-xl transition-all cursor-pointer flex items-center justify-center text-slate-700"
                  title="Reload campaigns"
                >
                  <RefreshCw size={14} className={couponLoading ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* TABS VIEW: CAMPAIGNS VS REDEMPTIONS */}
            <div className="space-y-4">
              <div className="border-b flex gap-4">
                <button 
                  className="py-2.5 border-b-2 border-blue-600 text-xs font-black text-slate-800 uppercase tracking-wider"
                >
                  Campaign Configurations
                </button>
              </div>

              {couponLoading ? (
                <div className="py-20 text-center font-mono text-xs text-slate-400">
                  <RefreshCw className="animate-spin inline-block mr-2 text-slate-500" size={14} />
                  Loading coupon campaign databases...
                </div>
              ) : (
                <div className="border rounded-2xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4.5">Campaign Code</th>
                        <th className="py-3 px-4">Title / Scope</th>
                        <th className="py-3 px-4">Discount Applied</th>
                        <th className="py-3 px-4">Validity Range</th>
                        <th className="py-3 px-4">Usage Tracker</th>
                        <th className="py-3 px-4">Limits & Floor</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4.5 text-right font-mono">Actions Console</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {coupons
                        .filter(c => {
                          const code = (c.coupon_code || c.code || '').toUpperCase();
                          const name = (c.coupon_name || c.name || '').toLowerCase();
                          const desc = (c.description || '').toLowerCase();
                          const matchesSearch = code.includes(couponSearch.toUpperCase()) || name.includes(couponSearch.toLowerCase()) || desc.includes(couponSearch.toLowerCase());
                          
                          let matchesStatus = true;
                          const isAct = c.status === 'active' || c.active === true;
                          if (couponFilterStatus === 'active') matchesStatus = isAct;
                          else if (couponFilterStatus === 'disabled') matchesStatus = c.status === 'disabled';
                          else if (couponFilterStatus === 'expired') matchesStatus = c.status === 'expired';

                          let matchesType = true;
                          if (couponFilterType === 'percentage') matchesType = c.discount_type === 'percentage';
                          else if (couponFilterType === 'fixed') matchesType = c.discount_type === 'fixed';

                          return matchesSearch && matchesStatus && matchesType;
                        })
                        .map(cp => {
                          const isActive = cp.status === 'active' || cp.active === true;
                          const codeStr = cp.coupon_code || cp.code || '';
                          const isSpecial = codeStr === 'SURYA001';
                          
                          return (
                            <tr key={cp.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 px-4.5 font-bold font-mono">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2.5 py-1 rounded-lg text-[11px] uppercase tracking-wider font-extrabold border ${isSpecial ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                                    {codeStr}
                                  </span>
                                  <button
                                    onClick={() => handleCopyText(codeStr, cp.id)}
                                    className="p-1 hover:bg-slate-200 rounded text-slate-450 transition-colors cursor-pointer"
                                    title="Copy Promo Code"
                                  >
                                    <Copy size={11} />
                                  </button>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-extrabold text-slate-800">{cp.coupon_name || cp.name || 'Unnamed Campaigns'}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{cp.description || 'No description listed'}</div>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                                {isSpecial ? (
                                  <span className="text-violet-700 font-extrabold">₹1.00 Override ⭐</span>
                                ) : cp.discount_type === 'percentage' ? (
                                  <div>
                                    <span className="text-rose-600">{cp.discount_value || cp.discountPercent}% OFF</span>
                                    {cp.max_discount && <div className="text-[9px] text-slate-400 font-normal mt-0.5">Max: ₹{cp.max_discount}</div>}
                                  </div>
                                ) : (
                                  <span className="text-emerald-600">₹{cp.discount_value} OFF</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                                <div>From: {cp.valid_from || 'Anytime'}</div>
                                <div className="mt-0.5">To: {cp.valid_to || 'Never Expire'}</div>
                              </td>
                              <td className="py-3.5 px-4 font-mono">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-800">{cp.used_count || 0}</span>
                                  <span className="text-slate-400">/</span>
                                  <span className="text-slate-400 text-[10px]">{cp.usage_limit || '∞'}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                                <div>Min Order: ₹{cp.min_order_value || '0'}</div>
                                <div className="mt-0.5">Per User: {cp.per_user_limit || '∞'}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : cp.status === 'expired' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : cp.status === 'expired' ? 'bg-amber-400' : 'bg-slate-400'}`}></span>
                                  <span>{cp.status || (cp.active ? 'active' : 'disabled')}</span>
                                </span>
                              </td>
                              <td className="py-3.5 px-4.5 text-right font-mono whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => handleToggleCouponActive(cp)}
                                    className={`px-2 py-1 border rounded-lg text-[9.5px] font-black uppercase tracking-wide transition-all cursor-pointer ${isActive ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'}`}
                                  >
                                    {isActive ? 'Disable' : 'Enable'}
                                  </button>
                                  <button
                                    onClick={() => openCouponModal(cp, true)}
                                    className="p-1 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg cursor-pointer"
                                    title="Duplicate Campaign"
                                  >
                                    <Copy size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openCouponModal(cp)}
                                    className="p-1 hover:bg-slate-100 text-blue-600 border border-slate-200 rounded-lg cursor-pointer animate-none"
                                    title="Edit Campaign"
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCoupon(cp.id || cp.coupon_code || cp.code, cp.coupon_code || cp.code)}
                                    className="p-1 hover:bg-red-50 text-red-600 border border-slate-200 rounded-lg cursor-pointer"
                                    title="Delete Campaign"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* REDEMPTION LOGS VIEW */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest font-sans flex items-center gap-1.5 mb-3.5">
                <FileText size={15} className="text-slate-500" />
                <span>Campaign Redemptions Ledger Records</span>
              </h4>

              {redemptions.length === 0 ? (
                <div className="p-8 border border-dashed rounded-2xl text-center text-xs font-mono text-slate-400">
                  No promotional redemptions currently recorded on full-stack client checkouts.
                </div>
              ) : (
                <div className="border rounded-2xl bg-white overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-mono text-[9px] text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-4">Redemption Time</th>
                        <th className="py-2.5 px-4">Applied Promo Code</th>
                        <th className="py-2.5 px-4">Client email</th>
                        <th className="py-2.5 px-4">Order Reference</th>
                        <th className="py-2.5 px-4 text-right">Discount Benefit Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                      {redemptions.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 text-slate-400">
                            {new Date(r.redeemed_at || r.redeemedAt || '').toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="py-2 px-4 uppercase font-bold text-slate-900">{r.coupon_id}</td>
                          <td className="py-2 px-4 text-slate-600 font-sans">{r.user_id || 'unknown@bspsuryatech.in'}</td>
                          <td className="py-2 px-4">
                            <span className="bg-slate-50 border px-1.5 py-0.5 rounded text-[10px] text-slate-500">{r.order_id}</span>
                          </td>
                          <td className="py-2 px-4 text-right font-bold text-emerald-600">
                            {r.coupon_id === 'SURYA001' ? (
                              <span className="text-violet-700">Bill Overridden ⭐</span>
                            ) : (
                              <span>-₹{r.discount_amount || r.discountValue || 0}</span>
                            )}
                          </td>
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

      {/* Initialize / Edit Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-slate-950/65 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
          <div className="bg-white border rounded-3xl w-full max-w-xl shadow-2xl p-6 md:p-8 space-y-6 text-left my-8 scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-widest font-sans">
                  {editingCoupon ? 'Modify Campaign configurations' : 'Initialize Promotion campaign'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Secure registration of coupon parameters on standard checkout flow rules.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block uppercase tracking-wide text-[10px]">Campaign Code <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold font-mono text-slate-800 uppercase tracking-wider outline-none focus:border-blue-500"
                      placeholder="e.g. EXTRA50"
                      value={formCouponCode}
                      onChange={e => setFormCouponCode(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, ''))}
                      disabled={!!editingCoupon}
                      required
                    />
                    {!editingCoupon && (
                      <button
                        type="button"
                        onClick={generateRandomCouponCode}
                        className="px-3 bg-slate-100 hover:bg-slate-200 border rounded-xl text-[10px] font-bold text-slate-600 transition-all cursor-pointer whitespace-nowrap"
                      >
                        Random
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block uppercase tracking-wide text-[10px]">Campaign Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-blue-500"
                    placeholder="e.g. Festival Launch"
                    value={formCouponName}
                    onChange={e => setFormCouponName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block uppercase tracking-wide text-[10px]">Campaign Description</label>
                <textarea
                  rows={2}
                  className="w-full bg-slate-50 border p-2.5 rounded-xl font-medium text-slate-800 outline-none focus:border-blue-500 text-xs text-left"
                  placeholder="Provide parameters context for customers support reference..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block uppercase tracking-wide text-[10px]">Discount Type</label>
                  <select
                    className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold outline-none focus:border-blue-500"
                    value={formDiscountType}
                    onChange={e => {
                      const type = e.target.value as 'percentage' | 'fixed';
                      setFormDiscountType(type);
                    }}
                  >
                    <option value="percentage">Percentage OFF (%)</option>
                    <option value="fixed">Fixed Price Amount (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block uppercase tracking-wide text-[10px]">Discount Value</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold font-mono text-slate-800 outline-none focus:border-blue-500"
                    placeholder="e.g. 20"
                    value={formDiscountValue}
                    onChange={e => setFormDiscountValue(Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block uppercase tracking-wide text-[10px]">Max Discount Cap (₹) <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold font-mono text-slate-800 outline-none focus:border-blue-500"
                    placeholder="e.g. 1000"
                    value={formMaxDiscount || ''}
                    onChange={e => setFormMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block uppercase tracking-wide text-[10px]">Min Purchase Cart Floor (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold font-mono text-slate-800 outline-none focus:border-blue-500"
                    placeholder="e.g. 499"
                    value={formMinOrderValue || ''}
                    onChange={e => setFormMinOrderValue(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block uppercase tracking-wide text-[10px]">Valid Action From Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border p-2.5 rounded-xl font-medium font-mono text-slate-800 outline-none focus:border-blue-500"
                    value={formValidFrom}
                    onChange={e => setFormValidFrom(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block uppercase tracking-wide text-[10px]">Expiry End Date</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border p-2.5 rounded-xl font-medium font-mono text-slate-800 outline-none focus:border-blue-500"
                    value={formValidTo}
                    onChange={e => setFormValidTo(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block uppercase tracking-wide text-[10px]">Campaign Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold font-mono text-slate-800 outline-none focus:border-blue-500"
                    placeholder="e.g. 500 (Blank for infinite)"
                    value={formUsageLimit || ''}
                    onChange={e => setFormUsageLimit(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700 block uppercase tracking-wide text-[10px]">User Frequency Cap</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold font-mono text-slate-800 outline-none focus:border-blue-500"
                    placeholder="e.g. 1"
                    value={formPerUserLimit || ''}
                    onChange={e => setFormPerUserLimit(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-700 block uppercase tracking-wide text-[10px]">App Solution Applicability</label>
                <select
                  className="w-full bg-slate-50 border p-2.5 rounded-xl font-bold outline-none focus:border-blue-500"
                  value={formApplicability}
                  onChange={e => setFormApplicability(e.target.value)}
                >
                  <option value="all">Apply to All Products & plans</option>
                  <option value="monthly">Exclusive to Monthly billing packages (Keywords Match)</option>
                  <option value="annual">Exclusive to Annual billing packages (Keywords Match)</option>
                </select>
              </div>

              {formCouponCode.toUpperCase() === 'SURYA001' && (
                <div className="p-3 bg-slate-900 border border-slate-700 rounded-2xl text-slate-100 space-y-1 animate-pulse">
                  <span className="font-extrabold text-[10px] text-blue-400 uppercase tracking-widest block font-mono">⚡ SYSTEM CRITICAL CORE OVERRIDE DETECTED</span>
                  <p className="text-[10px] text-slate-300 font-mono leading-normal">
                    You have selected code <strong className="text-white">SURYA001</strong>. This code is bound dynamically inside our core secure payment validation pipeline: implementing checkout bypass forcing actual payable amount to <strong className="text-yellow-400">exactly ₹1.00</strong> regardless of plan selection.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t justify-end">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-205 text-slate-750 font-extrabold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-md cursor-pointer animate-none"
                >
                  {editingCoupon ? 'Update Campaign' : 'Initialize Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- MODULE 18: CONTACT MESSAGES INBOX -------------------- */}
      {activeModule === 'contact-messages' && (
        <RoleGuard moduleId="contact-messages">
          <div className="space-y-6 animate-fade-in text-left bg-white p-6 border rounded-2xl shadow-sm" id="admin-module-18">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b pb-4">
              <Mail size={17} className="text-red-750" />
              <span>Module 18: Inquiry Inbox Administration Ledger</span>
            </h3>
            <AdminContactMessages />
          </div>
        </RoleGuard>
      )}

    </div>
  );
};
export default AdminRoutes;
