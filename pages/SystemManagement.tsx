import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { SystemResources } from '../components/system/SystemResources';
import { UserManagement } from '../components/system/UserManagement';
import { RoleManagement } from '../components/system/RoleManagement';
import { PermissionManagement } from '../components/system/PermissionManagement';
import { RequestManagement } from '../components/system/RequestManagement';
import { PERM_KEYS, can } from '../types';
import { AccessRestricted } from '../components/AccessRestricted';
import { apiService } from '../services/api';

type SystemTab = 'RESOURCES' | 'USERS' | 'ROLES' | 'PERMISSIONS' | 'REQUESTS';

export const SystemManagement: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SystemTab>('RESOURCES');

  // We need to fetch current user permissions again or assume they are passed/contextual.
  // For simplicity here, we assume a mechanism like `apiService.getCurrentUser` cached or passed down.
  // In a real app, use the `useOutletContext` or global state.
  // For this component, we'll re-fetch briefly or rely on the `ProtectedRoute` wrapper having done the high-level check.
  // But granular tab checks need user info.
  // Let's use a local user state fetched on mount to be safe for granular checks.
  const [user, setUser] = useState<any>(null);

  React.useEffect(() => {
    apiService
      .getCurrentUser()
      .then(setUser)
      .catch(() => {});
  }, []);

  const renderTabContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'RESOURCES':
        return <SystemResources />;
      case 'USERS':
        return can(user, PERM_KEYS.USER_MANAGE) ? (
          <UserManagement />
        ) : (
          <AccessRestricted permission={PERM_KEYS.USER_MANAGE} />
        );
      case 'ROLES':
        return can(user, PERM_KEYS.ROLE_MANAGE) ? (
          <RoleManagement />
        ) : (
          <AccessRestricted permission={PERM_KEYS.ROLE_MANAGE} />
        );
      case 'PERMISSIONS':
        return can(user, PERM_KEYS.PERM_MANAGE) ? (
          <PermissionManagement />
        ) : (
          <AccessRestricted permission={PERM_KEYS.PERM_MANAGE} />
        );
      case 'REQUESTS':
        // Usually handled by role management or user management permissions, or a specific one.
        // Let's use USER_MANAGE as a proxy or if strict, add REQUEST_MANAGE.
        return can(user, PERM_KEYS.USER_MANAGE) ? (
          <RequestManagement />
        ) : (
          <AccessRestricted permission={PERM_KEYS.USER_MANAGE} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-6 py-24 pt-32 max-w-7xl animate-fade-in relative z-10 min-h-screen">
      {/* Header */}
      <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <i className="fas fa-cogs text-primary-500"></i>
            {t.system.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl">{t.system.subtitle}</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('RESOURCES')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'RESOURCES' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            {t.system.tabs.resources}
          </button>
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'USERS' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            {t.system.tabs.users}
          </button>
          <button
            onClick={() => setActiveTab('ROLES')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'ROLES' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            {t.system.tabs.roles}
          </button>
          <button
            onClick={() => setActiveTab('PERMISSIONS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'PERMISSIONS' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            {t.system.tabs.permissions}
          </button>
          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'REQUESTS' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            {t.system.tabs.requests}
          </button>
        </div>
      </div>

      {renderTabContent()}
    </div>
  );
};
