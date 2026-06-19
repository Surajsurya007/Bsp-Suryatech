import React, { useState } from 'react';
import { useAdmin, AdminRole } from './AdminContext';
import { usePermission } from './PermissionProvider';
import { 
  Building2, 
  ShieldCheck, 
  Database, 
  Bell, 
  HelpCircle, 
  LogOut, 
  Settings,
  ChevronDown,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface AdminHeaderProps {
  user: any;
  onLogout: () => void;
  onAddNotification?: (text: string, type: 'success' | 'info' | 'error') => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  user, 
  onLogout,
  onAddNotification 
}) => {
  const { 
    setIsAdminMode, 
    adminRole, 
    setAdminRole,
    backupStatus,
    triggerSystemBackup,
    systemStatus,
    telemetryLogs,
    activeModule
  } = useAdmin();

  const { getRoleBadgeColor } = usePermission();
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [showNotificationOverlay, setShowNotificationOverlay] = useState(false);

  // Available roles for testing simulations
  const rolesArray: { value: AdminRole; label: string; desc: string }[] = [
    { value: 'super_admin', label: '👑 Super Admin', desc: 'Full core administrative system coverage' },
    { value: 'manager', label: '💼 Manager', desc: 'Business controls, no raw database query' },
    { value: 'sales', label: '📊 Sales Agent', desc: 'Manage payments, customers & GST reports' },
    { value: 'support', label: '🛠️ Support Agent', desc: 'Access active support desk tickets & trial leads' }
  ];

  const handleRoleSwap = (role: AdminRole) => {
    setAdminRole(role);
    setShowRoleSelect(false);
    if (onAddNotification) {
      onAddNotification(`Role changed simulated: Swapped permissions level to ${role.toUpperCase()} successfully.`, 'info');
    }
  };

  const getStatusColor = () => {
    switch (systemStatus) {
      case 'Optimal':
        return 'bg-emerald-500';
      case 'Degraded':
        return 'bg-amber-500';
      case 'Maintenance':
        return 'bg-red-500';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white h-[60px] flex items-center justify-between px-6 sticky top-0 z-30 select-none">
      {/* Brand logo details */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-red-750 border border-red-700/60 rounded-xl flex items-center justify-center text-white shadow-md shadow-red-950/20">
          <Building2 size={18} />
        </div>
        <div>
          <span className="font-sans font-black tracking-tight text-[15px] block leading-none text-white">
            BJP SURYATECH <span className="text-red-500">ERP</span>
          </span>
          <span className="text-[9.5px] font-mono text-slate-400 block mt-0.5 tracking-widest uppercase">
            Backend Control Registry
          </span>
        </div>
      </div>

      {/* Role Switcher & System Telemetry */}
      <div className="flex items-center gap-5">
        
        {/* System Heartbeat Pings */}
        <div className="hidden lg:flex items-center gap-2 border-r border-slate-800 pr-5 h-8">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
            <span className={`w-2 h-2 ${getStatusColor()} rounded-full inline-block animate-ping`} />
            <span className="font-extrabold uppercase text-slate-300">CLOUD SYNC: {systemStatus}</span>
          </div>
          <button 
            title="Update cloud registry"
            onClick={triggerSystemBackup}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg shrink-0 transition-colors cursor-pointer"
          >
            <RefreshCw size={11} className={backupStatus === 'Backup in progress...' ? 'animate-spin' : ''} />
          </button>
          <span className="text-[9.5px] font-mono text-slate-500 truncate max-w-[170px]" title={backupStatus}>
            {backupStatus}
          </span>
        </div>

        {/* Dynamic ROLE CONTROLLER - Simulation tool specifically for super admin */}
        {user?.email?.trim().toLowerCase() === 'surajsurya.koo7@gmail.com' && (
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl cursor-all-scroll hover:border-slate-700 transition" onClick={() => setShowRoleSelect(!showRoleSelect)}>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Simulate Privileges:</span>
              <span className={`px-2 py-0.5 border text-[10px] font-black uppercase font-mono rounded ${getRoleBadgeColor(adminRole)}`}>
                {adminRole.replace('_', ' ')}
              </span>
              <ChevronDown size={12} className="text-slate-400" />
            </div>

            {showRoleSelect && (
              <div className="absolute top-10 right-0 bg-slate-950 border border-slate-800 rounded-2xl w-64 shadow-2xl p-2.5 z-50 text-left space-y-1 text-slate-100 animate-fade-in animate-duration-150">
                <span className="text-[9px] font-black text-slate-500 uppercase block px-2.5 py-1 tracking-widest font-mono">
                  Select Simulation Level
                </span>
                {rolesArray.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => handleRoleSwap(r.value)}
                    className={`w-full flex flex-col px-3 py-1.5 rounded-xl text-left border cursor-pointer hover:bg-slate-900 transition-colors ${
                      adminRole === r.value 
                        ? 'border-red-900 bg-red-950/20 text-red-100'
                        : 'border-transparent text-slate-350 hover:text-white'
                    }`}
                  >
                    <span className="text-[11.5px] font-mono font-bold">{r.label}</span>
                    <span className="text-[8.5px] text-slate-555 leading-none mt-0.5">{r.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* System Activity Log Quick View */}
        <div className="relative">
          <button 
            onClick={() => setShowNotificationOverlay(!showNotificationOverlay)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition relative cursor-pointer"
          >
            <Bell size={15} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-600 rounded-full" />
          </button>

          {showNotificationOverlay && (
            <div className="absolute top-11 right-0 bg-slate-950 border border-slate-800 text-slate-150 rounded-2xl w-80 shadow-2xl p-3.5 z-50 space-y-3.5 animate-fade-in text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-black font-mono uppercase text-slate-305 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-red-500" />
                  <span>Admin Telemetry Stream</span>
                </h4>
                <span className="text-[8.5px] font-mono text-slate-500 uppercase font-black">Latest 3 Logged events</span>
              </div>
              <div className="space-y-2">
                {telemetryLogs.slice(0, 3).map((l) => (
                  <div key={l.id} className="text-[10px] font-mono border-b border-slate-900 pb-1.5 last:border-b-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-extrabold text-[9px]">{new Date(l.timestamp).toLocaleTimeString()}</span>
                      <span className={`text-[8px] uppercase tracking-wider font-extrabold ${
                        l.status === 'success' ? 'text-lime-400' :
                        l.status === 'warning' ? 'text-amber-500' :
                        l.status === 'alert' ? 'text-red-500' : 'text-blue-400'
                      }`}>{l.status}</span>
                    </div>
                    <p className="text-slate-200 truncate leading-none mt-0.5" title={l.event}>{l.event}</p>
                    <span className="text-[8.5px] text-slate-500 font-medium block truncate max-w-[240px] leading-none">{l.userEmail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Logoff / Customer Gate */}
        <div className="flex items-center gap-3 border-l border-slate-800 pl-5">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[11.5px] font-bold text-slate-205 max-w-[130px] truncate leading-none">
              {user?.name || 'Administrator'}
            </span>
            <span className="text-[8.5px] font-mono font-bold text-slate-500 mt-0.5 truncate max-w-[130px]">
              {user?.email}
            </span>
          </div>
          <button
            onClick={() => {
              setIsAdminMode(false);
              if (onAddNotification) onAddNotification("Switched back to standard customer portal successfully.", "info");
            }}
            title="Exit Admin Controls"
            className="px-3.5 py-1.5 bg-red-900/30 hover:bg-red-800/40 text-red-200 hover:text-white border border-red-800/50 rounded-xl text-[10.5px] font-mono font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
          >
            EXIT ADMIN
          </button>
        </div>

      </div>
    </header>
  );
};
export default AdminHeader;
