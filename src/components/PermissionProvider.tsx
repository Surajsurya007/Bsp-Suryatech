import React, { createContext, useContext } from 'react';
import { useAdmin, AdminRole } from './AdminContext';

interface PermissionContextType {
  canAccessModule: (moduleId: string) => boolean;
  canPerformAction: (actionId: string) => boolean;
  getRoleBadgeColor: (role: AdminRole) => string;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { adminRole } = useAdmin();

  // Route/Module access permissions map
  const canAccessModule = (moduleId: string): boolean => {
    switch (adminRole) {
      case 'super_admin':
        return true; // Full access to all 17 modules
        
      case 'manager':
        // Managers can access everything except raw database query execution or security credentials console
        return moduleId !== 'database-manager' && moduleId !== 'roles-permissions';
        
      case 'sales':
        // Customers, Payments, Orders/Escrow, GST, Invoice, Reports, Software Management
        return [
          'dashboard',
          'customers',
          'payments',
          'orders',
          'gst',
          'invoices',
          'reports',
          'software',
          'contact-messages'
        ].includes(moduleId);
        
      case 'support':
        // Tickets, Customers, Trial Users, Download Center, Notifications, Software
        return [
          'dashboard',
          'tickets',
          'customers',
          'trials',
          'downloads',
          'notifications',
          'software',
          'contact-messages'
        ].includes(moduleId);
        
      case 'customer':
      default:
        return false; // Customers cannot access any admin modules
    }
  };

  // Granular action-level permissions
  const canPerformAction = (actionId: string): boolean => {
    if (adminRole === 'super_admin') return true;

    // Actions list:
    // 'delete_customer', 'revoke_license', 'approve_payment', 'raw_sql_execution', 'change_gst_rate', 'reply_ticket'
    switch (actionId) {
      case 'raw_sql_execution':
      case 'change_roles':
        return adminRole === 'super_admin';
        
      case 'revoke_license':
      case 'delete_customer':
        return ['super_admin', 'manager'].includes(adminRole);
        
      case 'approve_payment':
      case 'generate_invoice':
        return ['super_admin', 'manager', 'sales'].includes(adminRole);
        
      case 'reply_ticket':
      case 'update_ticket':
        return ['super_admin', 'manager', 'support'].includes(adminRole);
        
      default:
        return false;
    }
  };

  const getRoleBadgeColor = (role: AdminRole): string => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'sales':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'support':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'customer':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <PermissionContext.Provider value={{
      canAccessModule,
      canPerformAction,
      getRoleBadgeColor
    }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};
