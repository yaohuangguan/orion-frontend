
import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { SystemResources } from './system/SystemResources';
import { UserManagement } from './system/UserManagement';
import { RoleManagement } from './system/RoleManagement';
import { PermissionManagement } from './system/PermissionManagement';
import { RequestManagement } from './system/RequestManagement';

type SystemTab = 'RESOURCES' | 'USERS' | 'ROLES' | 'PERMISSIONS' | 'REQUESTS';

export const SystemManagement: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SystemTab>('RESOURCES');

  return (
    <div className="container mx-auto px-6 py-24 pt-32 max-w-7xl animate-fade-in relative z-10 min-h-screen">
      
      {/* Header */}
      <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <i className="fas fa-cogs text-primary-500"></i>
            {t.system.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl">
            {t.system.subtitle}
          </p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex-wrap gap-1">
            <button onClick={() => setActiveTab('RESOURCES')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'RESOURCES' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>{t.system.tabs.resources}</button>
            <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'USERS' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>{t.system.tabs.users}</button>
            <button onClick={() => setActiveTab('ROLES')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'ROLES' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>{t.system.tabs.roles}</button>
            <button onClick={() => setActiveTab('PERMISSIONS')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'PERMISSIONS' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>{t.system.tabs.permissions}</button>
            <button onClick={() => setActiveTab('REQUESTS')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === 'REQUESTS' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                {t.system.tabs.requests}
            </button>
        </div>
      </div>

      {activeTab === 'RESOURCES' && <SystemResources />}
      {activeTab === 'USERS' && <UserManagement />}
      {activeTab === 'ROLES' && <RoleManagement />}
      {activeTab === 'PERMISSIONS' && <PermissionManagement />}
      {activeTab === 'REQUESTS' && <RequestManagement />}
    </div>
  );
};
