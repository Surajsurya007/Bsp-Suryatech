import React from 'react';
import { useAdmin } from './AdminContext';
import { usePermission } from './PermissionProvider';
import { AdminLayout } from './AdminLayout';
import { AdminRoutes } from './AdminRoutes';

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
  onAddNotification: (text: string, type: 'success' | 'info' | 'error') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, 
  onLogout, 
  onAddNotification 
}) => {
  const { adminLoading } = useAdmin();

  return (
    <div id="bsp-admin-dashboard-container" className="animate-fade-in relative">
      {/* 
        Fully self-contained professional ERP layout wrapper:
        Injects the left collapsing menu sidebar, top control header with simulation tools,
        and dynamically renders the permitted visual modules out of all 17 admin sections.
      */}
      <AdminLayout 
        user={user} 
        onLogout={onLogout} 
        onAddNotification={onAddNotification}
      >
        {adminLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[45vh] font-mono text-xs text-slate-500 py-12">
            <div className="w-10 h-10 border-4 border-slate-350 border-t-red-650 rounded-full animate-spin mb-4" />
            <span className="font-extrabold pb-1">RETRIEVING BUSINESS DATASTORES...</span>
            <span className="text-[10px] text-slate-400">Communicating with secure Supabase cloud servers</span>
          </div>
        ) : (
          <div className="text-slate-800 animate-fade-in" id="admin-routes-render-box">
            <AdminRoutes onAddNotification={onAddNotification} />
          </div>
        )}
      </AdminLayout>
    </div>
  );
};
export default AdminDashboard;
