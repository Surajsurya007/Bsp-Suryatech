import React from 'react';
import { useAdmin } from './AdminContext';
import { usePermission } from './PermissionProvider';
import { ShieldAlert, LogOut } from 'lucide-react';

interface RoleGuardProps {
  moduleId?: string;
  actionId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  moduleId, 
  actionId, 
  fallback, 
  children 
}) => {
  const { adminRole, setIsAdminMode } = useAdmin();
  const { canAccessModule, canPerformAction } = usePermission();

  const isAuthorized = (): boolean => {
    // If checking module access
    if (moduleId && !canAccessModule(moduleId)) {
      return false;
    }

    // If checking specific action access
    if (actionId && !canPerformAction(actionId)) {
      return false;
    }

    // Basic administrative guard - any administrative mode requires role !== 'customer'
    if (adminRole === 'customer') {
      return false;
    }

    return true;
  };

  if (!isAuthorized()) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[55vh] py-12 px-6 text-center animate-fade-in bg-white rounded-2xl border border-rose-100 shadow-sm">
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mb-5 shadow-inner">
          <ShieldAlert size={28} className="animate-bounce" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">Security Privilege Protection Gate</h2>
        <p className="text-sm text-slate-500 max-w-md mt-2.5">
          Your current simulated profile role (<span className="font-mono font-bold uppercase text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded">{adminRole}</span>) is not permitted to view the <span className="font-semibold text-slate-700 capitalize">"{moduleId || 'this console section'}"</span> administration module. Please use the Role Controller in the header to escalate simulated privileges.
        </p>

        <div className="flex gap-4 mt-8">
          <button
            onClick={() => setIsAdminMode(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 border transition-colors cursor-pointer"
          >
            <LogOut size={13} />
            <span>Switch to Customer Portal</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
export default RoleGuard;
