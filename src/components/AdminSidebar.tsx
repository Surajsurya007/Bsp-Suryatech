import React, { useState } from 'react';
import { useAdmin } from './AdminContext';
import { usePermission } from './PermissionProvider';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Key, 
  Settings, 
  Database, 
  Mail, 
  Download, 
  BarChart3, 
  Ticket, 
  FileSpreadsheet, 
  Bell, 
  Percent, 
  ShieldAlert, 
  Search, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  Disc,
  PlayCircle,
  HelpCircle
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const { 
    activeModule, 
    setActiveModule, 
    sidebarCollapsed, 
    setSidebarCollapsed,
    adminRole
  } = useAdmin();
  const { canAccessModule } = usePermission();
  const [filterQuery, setFilterQuery] = useState('');

  // Declare 17 modules clearly with names, descriptions and iconic representations
  const modulesList = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, category: 'Main', desc: 'Overview performance registers' },
    { id: 'customers', name: 'Customer Manager', icon: Users, category: 'CRM', desc: 'Edit corporate entities database' },
    { id: 'payments', name: 'Payments Register', icon: CreditCard, category: 'Finance', desc: 'Review gateway & escrow reference' },
    { id: 'licenses', name: 'Licenses Server', icon: Key, category: 'Core', desc: 'Generate & revoke active serials' },
    { id: 'software', name: 'Software Manager', icon: Disc, category: 'Core', desc: 'Define binary releases & changelogs' },
    { id: 'downloads', name: 'Download Center', icon: Download, category: 'Core', desc: 'Review payload downloading analytics' },
    { id: 'trials', name: 'Trial Track', icon: PlayCircle, category: 'CRM', desc: 'Offline testing environments' },
    { id: 'email-system', name: 'Email System', icon: Mail, category: 'System', desc: 'SMTP servers & notification dispatch' },
    { id: 'invoices', name: 'GST Invoices', icon: FileSpreadsheet, category: 'Finance', desc: 'CGST / SGST breakdown tax billing' },
    { id: 'tickets', name: 'Support Tickets', icon: Ticket, category: 'CRM', desc: 'Helpdesk ticketing server logs' },
    { id: 'reports', name: 'Financial Reports', icon: BarChart3, category: 'Finance', desc: 'Download quarterly GST ledgers' },
    { id: 'notifications', name: 'Internal Alerts', icon: Bell, category: 'System', desc: 'Telemetry dashboard announcements' },
    { id: 'roles-permissions', name: 'Roles & RBAC', icon: ShieldAlert, category: 'Security', desc: 'Grant granular privileges' },
    { id: 'authentication', name: 'Auth Registry', icon: Key, category: 'Security', desc: 'Brute force & session metadata' },
    { id: 'database-manager', name: 'Database Manager', icon: Database, category: 'Security', desc: 'Raw SQL schema browser console' },
    { id: 'settings', name: 'Settings Hub', icon: Settings, category: 'System', desc: 'Define backup & company address' },
    { id: 'gst-ledger', name: 'GST Ledger Control', icon: Percent, category: 'Finance', desc: 'Configure HSN 998314 registry' }
  ];

  const filteredModules = modulesList.filter(m => 
    m.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(filterQuery.toLowerCase())
  );

  // Group by category for cleaner look when expanded
  const categories = Array.from(new Set(modulesList.map(m => m.category)));

  return (
    <aside 
      id="bsp-admin-sidebar"
      className={`bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-all duration-300 select-none shrink-0 h-[calc(100vh-60px)] sticky top-[60px] z-20 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Search Modules Header */}
      {!sidebarCollapsed && (
        <div className="p-3 border-b border-slate-800/80">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search 17 Modules..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-150 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Main scrolling list of modules */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 py-3 space-y-4">
        {sidebarCollapsed ? (
          /* Mini icons layout when collapsed */
          <div className="flex flex-col items-center gap-1.5 px-2">
            {filteredModules.map((m) => {
              const allowed = canAccessModule(m.id);
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => allowed && setActiveModule(m.id)}
                  title={`${m.name} [${m.category}] ${!allowed ? '(Locked)' : ''}`}
                  disabled={!allowed}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative group cursor-pointer ${
                    !allowed ? 'text-slate-600 cursor-not-allowed opacity-40' :
                    activeModule === m.id 
                      ? 'bg-red-700 text-white shadow-md' 
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
                  }`}
                >
                  <Icon size={18} />
                  {/* Tooltip on right hover */}
                  <span className="absolute left-12 top-2 scale-0 group-hover:scale-100 px-2 py-1 bg-slate-950 border border-slate-800 text-white text-[10px] rounded shadow-lg whitespace-nowrap z-50 font-black font-mono transition-all">
                    {m.name} {!allowed && '🔒'}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          /* Grouped Categories menu when expanded */
          categories.map((cat) => {
            const catModules = filteredModules.filter(m => m.category === cat);
            if (catModules.length === 0) return null;
            
            return (
              <div key={cat} className="px-3 space-y-1">
                <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase block px-2.5 mb-1.5 font-mono">
                  {cat}
                </span>
                <div className="space-y-0.5">
                  {catModules.map((m) => {
                    const allowed = canAccessModule(m.id);
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => allowed && setActiveModule(m.id)}
                        disabled={!allowed}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-xs font-mono font-medium border cursor-pointer ${
                          !allowed 
                            ? 'text-slate-600 cursor-not-allowed border-transparent opacity-40 hover:bg-slate-950/20' 
                            : activeModule === m.id
                              ? 'bg-red-700 border-red-750 text-white shadow font-extrabold'
                              : 'hover:bg-slate-800 hover:text-slate-100 border-transparent text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={15} className="shrink-0" />
                          <span className="truncate">{m.name}</span>
                        </div>
                        {!allowed && <span className="text-[9px]">🔒</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Collapse/Expand footer utility */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between">
        {!sidebarCollapsed && (
          <div className="flex flex-col">
            <span className="text-[8px] font-bold font-mono text-slate-500 uppercase">Privilege Level</span>
            <span className="text-[10px] font-extrabold font-mono text-lime-400 uppercase tracking-widest truncate max-w-[150px]">{adminRole}</span>
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 cursor-pointer border border-slate-700 flex items-center justify-center"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
};
export default AdminSidebar;
