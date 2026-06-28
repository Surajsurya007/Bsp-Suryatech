import React, { useState, useMemo, useEffect } from 'react';
import { 
  useAdmin 
} from './AdminContext';
import { supabase } from '../supabaseClient';
import { 
  Mail, 
  Trash2, 
  Eye, 
  Check, 
  X, 
  Search, 
  Filter, 
  Download, 
  User, 
  Phone, 
  Clock, 
  ArrowRight, 
  FileText, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  Calendar, 
  ShieldAlert, 
  MapPin, 
  History 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminContactMessages() {
  const { 
    adminContactMessages, 
    setAdminContactMessages, 
    addTelemetryLog 
  } = useAdmin();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [topicFilter, setTopicFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, WEEK, MONTH
  
  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Selected single message for detailed view
  const [activeMessage, setActiveMessage] = useState<any | null>(null);

  // Auto clean selections on filter change
  useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm, statusFilter, topicFilter, dateFilter]);

  // Handle outside messages sync trigger on standard user form dispatches
  useEffect(() => {
    const handleSyncRequest = () => {
      const cached = localStorage.getItem('bsp_contact_messages');
      if (cached) {
        try {
          const list = JSON.parse(cached);
          setAdminContactMessages(list);
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener('bsp_new_contact_message', handleSyncRequest);
    return () => window.removeEventListener('bsp_new_contact_message', handleSyncRequest);
  }, [setAdminContactMessages]);

  // Date validation helper
  const isWithinDays = (dateStr: string, days: number) => {
    try {
      const date = new Date(dateStr);
      const diffTime = Math.abs(new Date().getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= days;
    } catch {
      return false;
    }
  };

  // Filter and Search Logic
  const filteredMessages = useMemo(() => {
    if (!adminContactMessages) return [];
    
    return adminContactMessages.filter((msg: any) => {
      // 1. Text Search matching name, email, refId, phone, topic, description
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        msg.id?.toLowerCase().includes(searchLower) ||
        msg.full_name?.toLowerCase().includes(searchLower) ||
        msg.email?.toLowerCase().includes(searchLower) ||
        msg.phone?.toLowerCase().includes(searchLower) ||
        msg.topic_category?.toLowerCase().includes(searchLower) ||
        msg.message_description?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // 2. Status filter
      if (statusFilter !== 'ALL' && msg.status !== statusFilter) return false;

      // 3. Topic category filter
      if (topicFilter !== 'ALL' && msg.topic_category !== topicFilter) return false;

      // 4. Date filter
      if (dateFilter === 'TODAY') {
        const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        if (msg.submission_date !== todayStr) return false;
      } else if (dateFilter === 'WEEK') {
        if (!isWithinDays(msg.created_at || msg.submission_date, 7)) return false;
      } else if (dateFilter === 'MONTH') {
        if (!isWithinDays(msg.created_at || msg.submission_date, 30)) return false;
      }

      return true;
    });
  }, [adminContactMessages, searchTerm, statusFilter, topicFilter, dateFilter]);

  // Get dynamic statistics for status highlights
  const stats = useMemo(() => {
    const list = adminContactMessages || [];
    const todayStr = new Date().toLocaleDateString('en-CA');
    
    return {
      total: list.length,
      new: list.filter((m: any) => m.status === 'New').length,
      replied: list.filter((m: any) => m.status === 'Replied').length,
      closed: list.filter((m: any) => m.status === 'Closed').length,
      today: list.filter((m: any) => m.submission_date === todayStr).length
    };
  }, [adminContactMessages]);

  const uniqueTopics = useMemo(() => {
    if (!adminContactMessages) return [];
    const topics = adminContactMessages.map((m: any) => m.topic_category).filter(Boolean);
    return Array.from(new Set(topics)) as string[];
  }, [adminContactMessages]);

  // Bulk / Row status transitions
  const updateMessageInStorageAndDB = async (msgId: string, updates: Partial<any>) => {
    const freshList = adminContactMessages.map((m: any) => {
      if (m.id === msgId) {
        // Parse history
        let hist = [];
        try {
          hist = m.status_history ? (typeof m.status_history === 'string' ? JSON.parse(m.status_history) : m.status_history) : [];
        } catch {
          hist = [];
        }
        
        if (updates.status && m.status !== updates.status) {
          hist.push({
            status: updates.status,
            timestamp: new Date().toISOString(),
            note: `Updated on Admin Console`
          });
        }

        const nextM = {
          ...m,
          ...updates,
          status_history: typeof m.status_history === 'string' ? JSON.stringify(hist) : hist
        };

        // If active message is being edited sync live
        if (activeMessage && activeMessage.id === msgId) {
          setActiveMessage(nextM);
        }

        return nextM;
      }
      return m;
    });

    setAdminContactMessages(freshList);
    localStorage.setItem('bsp_contact_messages', JSON.stringify(freshList));

    // Try DB Sync
    try {
      const targetRecord = freshList.find((m: any) => m.id === msgId);
      if (targetRecord) {
        // format history to string for database consistency if required
        const payload = {
          ...targetRecord,
          status_history: typeof targetRecord.status_history === 'object' ? JSON.stringify(targetRecord.status_history) : targetRecord.status_history
        };
        
        // 1. Backend API Sync
        try {
          await fetch(`/api/contact-messages/${msgId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
          });
        } catch (apiErr) {
          console.warn("Could not sync message update to backend API:", apiErr);
        }

        // 2. Supabase Sync
        try {
          await supabase.from('contact_messages').upsert([payload]);
        } catch (sbErr) {
          console.warn("Could not sync message update to Supabase:", sbErr);
        }
      }
    } catch (dbErr: any) {
      console.warn("DB update skipped or errored:", dbErr);
    }
  };

  // Mark single as read on click
  const handleOpenDetails = async (msg: any) => {
    setActiveMessage(msg);
    if (msg.status === 'New') {
      addTelemetryLog(`Admin opened unread message ${msg.id}. Transitioned to 'Read'`, 'info');
      await updateMessageInStorageAndDB(msg.id, { status: 'Read' });
    }
  };

  const handleUpdateStatusSingle = async (msgId: string, nextStatus: 'New' | 'Read' | 'Replied' | 'Closed') => {
    addTelemetryLog(`Admin set status of message ${msgId} to ${nextStatus}`, 'success');
    await updateMessageInStorageAndDB(msgId, { status: nextStatus });
  };

  const handleDeleteSingle = async (msgId: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete inquiry record ${msgId}?`)) return;

    const remaining = adminContactMessages.filter((m: any) => m.id !== msgId);
    setAdminContactMessages(remaining);
    localStorage.setItem('bsp_contact_messages', JSON.stringify(remaining));
    addTelemetryLog(`Deleted contact inbox message ${msgId}`, 'alert');

    if (activeMessage?.id === msgId) {
      setActiveMessage(null);
    }

    // 1. Delete from Backend API
    try {
      await fetch(`/api/contact-messages/${msgId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (apiErr) {
      console.warn("Could not delete message from backend API:", apiErr);
    }

    // 2. Delete from Supabase
    try {
      await supabase.from('contact_messages').delete().eq('id', msgId);
    } catch (e) {
      console.warn(e);
    }
  };

  // Bulk Operators
  const handleBulkMarkStatus = async (status: 'Read' | 'Replied' | 'Closed') => {
    if (selectedIds.length === 0) return;
    
    addTelemetryLog(`Admin configured bulk status of ${selectedIds.length} messages to '${status}'`, 'success');
    
    let list = [...adminContactMessages];
    for (const msgId of selectedIds) {
      list = list.map((m: any) => {
        if (m.id === msgId) {
          let hist = [];
          try {
            hist = m.status_history ? (typeof m.status_history === 'string' ? JSON.parse(m.status_history) : m.status_history) : [];
          } catch {
            hist = [];
          }
          hist.push({
            status,
            timestamp: new Date().toISOString(),
            note: `Bulk changed via Admin Control Dashboard`
          });
          return {
            ...m,
            status,
            status_history: typeof m.status_history === 'string' ? JSON.stringify(hist) : hist
          };
        }
        return m;
      });
    }

    setAdminContactMessages(list);
    localStorage.setItem('bsp_contact_messages', JSON.stringify(list));
    setSelectedIds([]);

    // DB Bulk update
    for (const msgId of selectedIds) {
      const item = list.find((m: any) => m.id === msgId);
      if (item) {
        const payload = {
          ...item,
          status_history: typeof item.status_history === 'object' ? JSON.stringify(item.status_history) : item.status_history
        };
        
        // 1. Backend API Sync
        try {
          await fetch(`/api/contact-messages/${msgId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
          });
        } catch (apiErr) {
          console.warn("Could not sync bulk message update to backend API:", apiErr);
        }

        // 2. Supabase Sync
        try {
          await supabase.from('contact_messages').upsert([payload]);
        } catch (e) {
          console.warn(e);
        }
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete these ${selectedIds.length} selected inquiries?`)) return;

    addTelemetryLog(`Bulk deleted ${selectedIds.length} messages from database`, 'alert');
    const remaining = adminContactMessages.filter((m: any) => !selectedIds.includes(m.id));
    setAdminContactMessages(remaining);
    localStorage.setItem('bsp_contact_messages', JSON.stringify(remaining));
    
    if (activeMessage && selectedIds.includes(activeMessage.id)) {
      setActiveMessage(null);
    }

    // 1. Delete from Backend API
    try {
      await fetch('/api/contact-messages/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ids: selectedIds })
      });
    } catch (apiErr) {
      console.warn("Could not bulk delete from backend API:", apiErr);
    }

    // 2. Delete from Supabase
    try {
      await supabase.from('contact_messages').delete().in('id', selectedIds);
    } catch (e) {
      console.warn(e);
    }
    
    setSelectedIds([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredMessages.map((m: any) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Exporters
  const handleExportCSV = () => {
    const listToExport = filteredMessages.length > 0 ? filteredMessages : adminContactMessages;
    if (listToExport.length === 0) {
      alert("No data available to export.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Reference ID,Full Name,Email,Mobile Number,Topic Category,Message Preview,Date,Time,IP Address,Status\n";

    listToExport.forEach((m: any) => {
      const cleanDesc = (m.message_description || '').replace(/"/g, '""').replace(/\n/g, ' ');
      const cleanName = (m.full_name || '').replace(/"/g, '""');
      const cleanEmail = (m.email || '').replace(/"/g, '""');
      const cleanTopic = (m.topic_category || '').replace(/"/g, '""');
      
      csvContent += `"${m.id}","${cleanName}","${cleanEmail}","${m.phone || ''}","${cleanTopic}","${cleanDesc}","${m.submission_date || ''}","${m.submission_time || ''}","${m.ip_address || ''}","${m.status || ''}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BSP_Contact_Messages_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addTelemetryLog(`Exported ${listToExport.length} contact records to CSV`, 'info');
  };

  const handleExportExcel = () => {
    // Generate real formatted TSV so Excel parses it seamlessly without encoding warnings
    const listToExport = filteredMessages.length > 0 ? filteredMessages : adminContactMessages;
    if (listToExport.length === 0) {
      alert("No data available.");
      return;
    }

    let excelContent = "Reference ID\tFull Name\tEmail\tMobile\tTopic\tMessage\tDate\tTime\tIP Address\tStatus\n";
    listToExport.forEach((m: any) => {
      const cleanDesc = (m.message_description || '').replace(/\s+/g, ' ');
      excelContent += `${m.id}\t${m.full_name}\t${m.email}\t${m.phone || ''}\t${m.topic_category}\t${cleanDesc}\t${m.submission_date || ''}\t${m.submission_time || ''}\t${m.ip_address || ''}\t${m.status}\n`;
    });

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `BSP_Contact_Messages_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addTelemetryLog(`Exported ${listToExport.length} contact records to Excel`, 'info');
  };

  const handleExportPDF = () => {
    // Open printable HTML frame with tabular summaries
    const listToExport = filteredMessages.length > 0 ? filteredMessages : adminContactMessages;
    if (listToExport.length === 0) {
      alert("No messages to print.");
      return;
    }

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert("Please allow popups to export printable PDF ledger reports.");
      return;
    }

    const html = `
      <html>
        <head>
          <title>BSP Suryatech Contact Messages Report Ledger</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
            h1 { font-size: 20px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 5px; }
            .meta { font-size: 11px; color: #64748b; margin-bottom: 30px; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 11px; text-align: left; }
            th { background-color: #f1f5f9; padding: 10px; font-weight: bold; border: 1px solid #cbd5e1; }
            td { padding: 10px; border: 1px solid #cbd5e1; vertical-align: top; }
            .status { font-weight: bold; text-transform: uppercase; font-size: 9px; }
          </style>
        </head>
        <body>
          <h1>BSP Suryatech Contact Messages Ledger</h1>
          <div class="meta">Exported At: ${new Date().toLocaleString()} | Count: ${listToExport.length} Records</div>
          <table>
            <thead>
              <tr>
                <th style="width: 120px;">Ref ID</th>
                <th style="width: 140px;">Customer Inquirer</th>
                <th style="width: 130px;">Contact Coordinates</th>
                <th>Topic Category</th>
                <th>Description Preview</th>
                <th style="width: 80px;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${listToExport.map((m: any) => `
                <tr>
                  <td><strong>${m.id}</strong><br/>${m.submission_date}</td>
                  <td>${m.full_name}</td>
                  <td>${m.email}<br/>${m.phone}</td>
                  <td>${m.topic_category}</td>
                  <td>${m.message_description}</td>
                  <td><span class="status">${m.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWin.document.write(html);
    printWin.document.close();
    addTelemetryLog(`Triggered PDF printable ledger for ${listToExport.length} messages`, 'info');
  };

  // Status History parser
  const getStatusHistoryList = (msg: any) => {
    let list = [];
    if (msg.status_history) {
      try {
        list = typeof msg.status_history === 'string' ? JSON.parse(msg.status_history) : msg.status_history;
      } catch {
        list = [];
      }
    }
    if (list.length === 0) {
      // fallback
      list = [
        { status: 'New', timestamp: msg.created_at || new Date().toISOString(), note: 'Inquiry received' }
      ];
    }
    return list;
  };

  return (
    <div className="space-y-6" id="admin-contact-messages-dashboard">
      
      {/* 1. Dashboard Widget Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5" id="contact-messages-widgets">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-left hover:border-slate-750 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black tracking-widest uppercase font-mono">Total Inquiries</span>
            <Mail size={14} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5 font-mono">{stats.total}</div>
          <p className="text-[9px] text-slate-400 mt-1 font-mono">Total received lines</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-left hover:border-rose-900 transition-all relative overflow-hidden">
          {stats.new > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-rose-600 animate-ping rounded-full m-3" />}
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black tracking-widest uppercase font-mono">New Inbox</span>
            <AlertCircle size={14} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-500 mt-1.5 font-mono">{stats.new}</div>
          <p className="text-[9px] text-slate-400 mt-1 font-mono">Awaiting direct reply</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-left hover:border-emerald-950 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black tracking-widest uppercase font-mono">Replied</span>
            <Check size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500 mt-1.5 font-mono">{stats.replied}</div>
          <p className="text-[9px] text-slate-400 mt-1 font-mono">Processed & resolved</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-left hover:border-slate-800 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black tracking-widest uppercase font-mono">Closed</span>
            <X size={14} className="text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-300 mt-1.5 font-mono">{stats.closed}</div>
          <p className="text-[9px] text-slate-400 mt-1 font-mono">Assigned archived</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-left hover:border-blue-900 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black tracking-widest uppercase font-mono">Today's Load</span>
            <Clock size={14} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 mt-1.5 font-mono">{stats.today}</div>
          <p className="text-[9px] text-slate-400 mt-1 font-mono">Dispatched today</p>
        </div>

      </div>

      {/* 2. Controls & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3.5" id="inbox-toolbar-panel">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          
          {/* Search bar input */}
          <div className="relative w-full lg:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 pointer-events-none">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by ID, Name, Email coordinates, messages details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-red-700"
              id="admin-contact-search-input"
            />
          </div>

          {/* Action trigger exports */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-350 border border-slate-800 hover:text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Download standard CSV spreadsheet file"
            >
              <Download size={12} />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-350 border border-slate-800 hover:text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Download Microsoft Excel binary.xls spreadsheet file"
            >
              <Download size={12} />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-350 border border-slate-800 hover:text-white rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Generate printable PDF Ledger reports"
            >
              <FileText size={12} />
              <span>Print/PDF</span>
            </button>
          </div>

        </div>

        {/* Filters Selectors Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-slate-400 text-xs font-mono border-t border-slate-800">
          
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-white cursor-pointer hover:border-slate-700 focus:outline-none"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="New">New Inbox</option>
              <option value="Read">Read Check</option>
              <option value="Replied">Replied Action</option>
              <option value="Closed">Closed Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500">Topic:</span>
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-white cursor-pointer hover:border-slate-700 focus:outline-none max-w-[200px]"
            >
              <option value="ALL">ALL TOPICS</option>
              {uniqueTopics.map(top => (
                <option key={top} value={top}>{top}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-500">Received Frame:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-white cursor-pointer hover:border-slate-700 focus:outline-none"
            >
              <option value="ALL">ALL DATES</option>
              <option value="TODAY">TODAY SUBMISSIONS</option>
              <option value="WEEK">LAST 7 DAYS</option>
              <option value="MONTH">LAST 30 DAYS</option>
            </select>
          </div>

          {(searchTerm || statusFilter !== 'ALL' || topicFilter !== 'ALL' || dateFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setTopicFilter('ALL');
                setDateFilter('ALL');
              }}
              className="text-[9px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase border border-red-900 px-2 py-0.5 rounded-md hover:bg-red-950/20 cursor-pointer"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-[10px] text-slate-500 font-bold">
            Showing <span className="text-white">{filteredMessages.length}</span> of {stats.total} total cases
          </div>

        </div>
      </div>

      {/* 3. Bulk Actions Ribbon bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-950/40 border border-red-900 text-slate-300 rounded-xl flex items-center justify-between text-xs font-mono"
            id="admin-bulk-ribbon"
          >
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
              <span>Selected <strong className="text-white font-extrabold">{selectedIds.length}</strong> inquiries of filtered batch</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleBulkMarkStatus('Read')}
                className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-red-900 hover:text-white rounded transition-colors text-[10px] uppercase font-bold cursor-pointer"
              >
                Mark Read
              </button>
              <button 
                onClick={() => handleBulkMarkStatus('Replied')}
                className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-red-900 hover:text-white rounded transition-colors text-[10px] uppercase font-bold cursor-pointer"
              >
                Mark Replied
              </button>
              <button 
                onClick={() => handleBulkMarkStatus('Closed')}
                className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-red-900 hover:text-white rounded transition-colors text-[10px] uppercase font-bold cursor-pointer"
              >
                Mark Closed
              </button>
              <button 
                onClick={handleBulkDelete}
                className="px-2.5 py-1 bg-red-700/80 hover:bg-red-700 text-white rounded transition-colors text-[10px] uppercase font-black flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={10} />
                <span>Delete Selected</span>
              </button>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-slate-500 hover:text-slate-350 p-1 cursor-pointer"
                title="Cancel Selection"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Table view registry */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden" id="inquiries-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[9px] font-black tracking-widest text-slate-500 uppercase font-mono">
                <th className="py-4 px-4 w-12 text-center">
                  <button 
                    onClick={() => {
                      if (selectedIds.length === filteredMessages.length) {
                        handleSelectAll(false);
                      } else {
                        handleSelectAll(true);
                      }
                    }}
                    className="p-1 focus:outline-none text-slate-400 hover:text-white inline-flex items-center justify-center cursor-pointer"
                  >
                    {selectedIds.length === filteredMessages.length && filteredMessages.length > 0 ? (
                      <CheckSquare size={14} className="text-red-650" />
                    ) : (
                      <Square size={14} />
                    )}
                  </button>
                </th>
                <th className="py-4 px-3 w-36">Reference ID</th>
                <th className="py-4 px-3">Full Name</th>
                <th className="py-4 px-3">Contact Coordinates</th>
                <th className="py-4 px-3">Topic Category</th>
                <th className="py-4 px-3">Message Preview</th>
                <th className="py-4 px-4 text-center w-28">Status</th>
                <th className="py-4 px-4 text-right w-44">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-bold">
                    <Mail size={24} className="mx-auto mb-2 text-slate-600 block" />
                    No contact messages found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg: any) => {
                  const isSelected = selectedIds.includes(msg.id);
                  const isNew = msg.status === 'New';
                  
                  return (
                    <tr 
                      key={msg.id} 
                      className={`hover:bg-slate-850/60 transition-colors ${
                        isNew ? 'bg-blue-950/10 font-extrabold' : ''
                      } ${isSelected ? 'bg-red-950/10' : ''}`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectRow(msg.id, e.target.checked)}
                          className="w-3.5 h-3.5 accent-red-600 rounded bg-slate-950 border-slate-800 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="text-white hover:text-red-400 transition-colors cursor-pointer" onClick={() => handleOpenDetails(msg)}>
                            {msg.id}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5" title={msg.created_at || ''}>
                            {msg.submission_date}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-slate-500 shrink-0" />
                          <span className="truncate max-w-[120px] inline-block" title={msg.full_name}>{msg.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div className="flex flex-col space-y-0.5 text-[11px]">
                          <span className="text-slate-400 block truncate max-w-[150px]" title={msg.email}>{msg.email}</span>
                          <span className="text-[10px] text-slate-500 block">{msg.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-400 shrink-0 text-[10.5px] max-w-[140px] truncate block" title={msg.topic_category}>
                          {msg.topic_category}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-[190px]">
                        <p className="text-[11px] text-slate-400 truncate" title={msg.message_description}>
                          {msg.message_description}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {msg.status === 'New' && (
                          <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-wide inline-flex items-center gap-1">
                            <span className="w-1 h-1 bg-blue-405 rounded-full animate-ping" />
                            <span>New</span>
                          </span>
                        )}
                        {msg.status === 'Read' && (
                          <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/25 text-purple-400 rounded-full text-[9px] font-black uppercase tracking-wide inline-flex items-center gap-1">
                            <span>Read</span>
                          </span>
                        )}
                        {msg.status === 'Replied' && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-wide inline-flex items-center gap-1">
                            <span>Replied</span>
                          </span>
                        )}
                        {msg.status === 'Closed' && (
                          <span className="px-2 py-0.5 bg-slate-500/10 border border-slate-700 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-wide inline-flex items-center gap-1">
                            <span>Closed</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetails(msg)}
                            className="p-1.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="Open Message Deep Details"
                          >
                            <Eye size={12} />
                          </button>
                          
                          {/* Toggle Status Actions */}
                          <select
                            value={msg.status}
                            onChange={(e) => handleUpdateStatusSingle(msg.id, e.target.value as any)}
                            className="bg-slate-950 border border-slate-800 px-1.5 py-1 text-[10px] rounded text-slate-400 hover:text-white cursor-pointer focus:outline-none"
                          >
                            <option value="New">Set New</option>
                            <option value="Read">Set Read</option>
                            <option value="Replied">Set Replied</option>
                            <option value="Closed">Set Closed</option>
                          </select>

                          <button
                            onClick={() => handleDeleteSingle(msg.id)}
                            className="p-1.5 bg-slate-950 border border-slate-850 hover:border-red-900 text-slate-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                            title="Delete Record Inquiry"
                          >
                            <Trash2 size={12} />
                          </button>
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

      {/* 5. Inquirer Deep detail Slide drawer/Modal */}
      <AnimatePresence>
        {activeMessage && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" id="messages-modal-portal">
            
            {/* Backdrop element */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveMessage(null)}
              className="absolute inset-0 bg-slate-950 cursor-pointer"
            />

            {/* Direct Slide Card Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto flex flex-col font-mono text-left"
            >
              
              {/* Card Header drawer */}
              <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest font-mono">CUSTOMER INQUIRY CARD</span>
                  <h3 className="text-sm font-black text-white font-mono tracking-widest block">{activeMessage.id}</h3>
                </div>
                <button
                  onClick={() => setActiveMessage(null)}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-850 rounded-xl cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Card Body drawer scrollable */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto font-mono text-xs text-slate-300">
                
                {/* Section Quick Status overview */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase block font-black">CURRENT ASSIGNED STATUS</span>
                    <span className="text-white text-xs font-bold font-mono">Archived queue index</span>
                  </div>
                  <div>
                    {activeMessage.status === 'New' && (
                      <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/40 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-wide">
                        New
                      </span>
                    )}
                    {activeMessage.status === 'Read' && (
                      <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/40 text-purple-400 rounded-lg text-[10px] font-black uppercase tracking-wide">
                        Read
                      </span>
                    )}
                    {activeMessage.status === 'Replied' && (
                      <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-wide">
                        Replied
                      </span>
                    )}
                    {activeMessage.status === 'Closed' && (
                      <span className="px-3 py-1 bg-slate-550/10 border border-slate-705 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-wide">
                        Closed
                      </span>
                    )}
                  </div>
                </div>

                {/* Section Submitter Profile detail */}
                <div className="space-y-3.5">
                  <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase flex items-center gap-1.5 font-mono">
                    <User size={11} className="text-red-500" />
                    <span>Inquirer Profile Coordinates</span>
                  </span>
                  
                  <div className="grid grid-cols-1 gap-2.5 bg-slate-950 p-4.5 border border-slate-800 rounded-xl">
                    <div>
                      <span className="text-slate-500 text-[9px] block">Full Authorized Name</span>
                      <span className="text-white font-extrabold uppercase text-[12.5px] block">{activeMessage.full_name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-850">
                      <div>
                        <span className="text-slate-500 text-[9px] block">Business Contact Email</span>
                        <a href={`mailto:${activeMessage.email}`} className="text-blue-400 underline font-black block break-all text-[11px]">{activeMessage.email}</a>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[9px] block">Mobile Digit Phone</span>
                        <a href={`tel:${activeMessage.phone}`} className="text-slate-200 hover:text-white font-black block text-[11px]">{activeMessage.phone}</a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Topic category block */}
                <div className="space-y-3">
                  <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
                    <FileText size={11} className="text-blue-500" />
                    <span>Inquiry Topic Category</span>
                  </span>
                  <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl font-mono text-white text-xs font-black">
                    {activeMessage.topic_category}
                  </div>
                </div>

                {/* Section Message Description */}
                <div className="space-y-3">
                  <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase flex items-center gap-1.5 font-mono">
                    <Mail size={11} className="text-purple-500" />
                    <span>Inquiry Description Text</span>
                  </span>
                  <div className="bg-slate-950 p-5 border border-slate-800 rounded-xl text-slate-300 font-sans text-xs sm:text-xs leading-relaxed whitespace-pre-wrap select-text selection:bg-red-800 selection:text-white shadow-inner">
                    {activeMessage.message_description}
                  </div>
                </div>

                {/* Telemetry metadata tracers */}
                <div className="space-y-3">
                  <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase flex items-center gap-1.5 font-mono">
                    <ShieldAlert size={11} className="text-amber-500" />
                    <span>System Metadata Tracer Telemetry</span>
                  </span>
                  <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2.5 font-mono text-[10px] text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Raipur Form Submission Date:</span>
                      <span className="text-slate-200 font-extrabold">{activeMessage.submission_date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Raipur Form Submission Time:</span>
                      <span className="text-slate-200 font-extrabold">{activeMessage.submission_time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Server Captured IP Host Tracer:</span>
                      <div className="flex items-center gap-1">
                        <MapPin size={8} className="text-emerald-500" />
                        <span className="text-slate-200 font-extrabold">{activeMessage.ip_address || '103.241.12.92'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status transitions chronological log */}
                <div className="space-y-3">
                  <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase flex items-center gap-1.5 font-mono">
                    <History size={11} className="text-emerald-500" />
                    <span>Chronological Status History Logs</span>
                  </span>
                  
                  <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl font-mono text-[11px] space-y-3.5">
                    {getStatusHistoryList(activeMessage).map((h: any, i: number) => (
                      <div key={i} className="flex gap-2.5 text-left text-[11px] relative">
                        {i < getStatusHistoryList(activeMessage).length - 1 && (
                          <span className="absolute left-[3.5px] top-[14px] bottom-[-20px] w-[1px] bg-slate-800" />
                        )}
                        <span className="w-2.5 h-2.5 bg-rose-700/80 border border-slate-900 rounded-full shrink-0 block mt-1.5" />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-450 text-[10px]">
                            <span className="font-extrabold text-slate-200 uppercase">{h.status}</span>
                            <span>•</span>
                            <span>{new Date(h.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-500 text-[10px]">{h.note || 'Status recorded on ledger log.'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Card Footer actions drawer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <span className="text-[9px] text-slate-550 uppercase font-black mr-auto block font-mono">ADMIN QUICK DISPATCH CONTROL</span>
                
                <button
                  onClick={() => handleUpdateStatusSingle(activeMessage.id, 'Replied')}
                  disabled={activeMessage.status === 'Replied'}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-700 cursor-pointer text-white font-extrabold text-[9.5px] uppercase tracking-wider rounded-lg border border-transparent shadow"
                >
                  Mark Replied
                </button>
                <button
                  onClick={() => handleUpdateStatusSingle(activeMessage.id, 'Closed')}
                  disabled={activeMessage.status === 'Closed'}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 cursor-pointer text-slate-200 font-extrabold text-[9.5px] uppercase tracking-wider rounded-lg border border-slate-700"
                >
                  Mark Closed
                </button>
                <button
                  onClick={() => handleDeleteSingle(activeMessage.id)}
                  className="p-2 bg-red-950 hover:bg-red-900 text-red-405 hover:text-red-300 rounded-lg border border-red-900/60 transition-all cursor-pointer"
                  title="Permanent Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
