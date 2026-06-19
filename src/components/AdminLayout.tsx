import React from 'react';
import { useAdmin } from './AdminContext';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface AdminLayoutProps {
  user: any;
  onLogout: () => void;
  onAddNotification?: (text: string, type: 'success' | 'info' | 'error') => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  user, 
  onLogout, 
  onAddNotification,
  children 
}) => {
  const { sidebarCollapsed } = useAdmin();

  return (
    <div id="bsp-admin-viewport" className="min-h-screen bg-slate-950 flex flex-col font-sans select-none antialiased text-slate-800">
      {/* Top Fixed ERP Header Navbar */}
      <AdminHeader 
        user={user} 
        onLogout={onLogout} 
        onAddNotification={onAddNotification} 
      />

      <div className="flex flex-1 flex-row relative">
        {/* Left Collapsible Module Navigation Sidebar */}
        <AdminSidebar />

        {/* Scrollable Main Content panel viewport */}
        <main 
          id="bsp-admin-content-viewport"
          className="flex-1 overflow-x-hidden overflow-y-auto px-4 md:px-8 py-6 bg-slate-50 min-h-[calc(100vh-60px)] shadow-inner transition-all duration-300 relative text-left"
        >
          <div className="max-w-7xl mx-auto w-full animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
export default AdminLayout;
