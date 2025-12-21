
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { User, PaginationData, PERM_KEYS } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { apiService } from '../services/api';
import { toast } from './Toast';
import { DeleteModal } from './DeleteModal';

interface UserProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const TIMEZONES = [
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Australia/Sydney",
  "UTC"
];

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser }) => {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [height, setHeight] = useState<string>(user.height ? user.height.toString() : '');
  const [fitnessGoal, setFitnessGoal] = useState<'cut' | 'bulk' | 'maintain'>(user.fitnessGoal || 'maintain');
  const [barkUrl, setBarkUrl] = useState(user.barkUrl || '');
  const [timezone, setTimezone] = useState(user.timezone || 'Asia/Shanghai');
  
  const [isLoading, setIsLoading] = useState(false);

  // Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Export Log State
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('');

  // Permission Request State
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [permRequest, setPermRequest] = useState({ permission: '', role: 'admin', reason: '' });
  const [requestType, setRequestType] = useState<'ROLE' | 'PERM'>('ROLE'); // Toggle state
  const [isSubmittingPerm, setIsSubmittingPerm] = useState(false);

  // Guard to prevent double fetching in React Strict Mode
  const hasFetchedRef = useRef(false);

  // Fetch latest profile data on mount to ensure settings like Bark URL are fresh
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchLatest = async () => {
      try {
        const latestUser = await apiService.getCurrentUser();
        onUpdateUser(latestUser);
      } catch (error) {
        console.error("Failed to refresh user profile:", error);
      }
    };
    fetchLatest();
  }, []);

  // Update local state when user prop changes (e.g. after refresh)
  useEffect(() => {
    setDisplayName(user.displayName);
    setHeight(user.height ? user.height.toString() : '');
    setFitnessGoal(user.fitnessGoal || 'maintain');
    setBarkUrl(user.barkUrl || '');
    setTimezone(user.timezone || 'Asia/Shanghai');
  }, [user]);

  const handleAvatarClick = () => {
    if (isUploadingAvatar) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingAvatar(true);
    try {
      // 1. Upload to Cloudinary
      const photoURL = await apiService.uploadImage(file);
      
      // 2. Update User Profile on backend
      await apiService.updateProfile(user._id, {
        photoURL
      });

      // 3. Re-fetch full user profile to ensure complete state (vip, tokens, etc.)
      const fullUser = await apiService.getCurrentUser();
      onUpdateUser(fullUser);
      
      toast.success('Avatar updated successfully.');

    } catch (error) {
      console.error(error);
      toast.error('Failed to update avatar.');
    } finally {
      setIsUploadingAvatar(false);
      // Reset input to allow selecting the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    
    setIsLoading(true);
    try {
      // Update Profile (Name, Height, Goal, Bark, Timezone)
      const payload: Partial<User> = {
        displayName,
        fitnessGoal,
        barkUrl,
        timezone
      };
      
      if (height) {
        const heightNum = parseFloat(height);
        if (!isNaN(heightNum) && heightNum > 0) {
           payload.height = heightNum;
        }
      }

      await apiService.updateProfile(user._id, payload);

      // Re-fetch full user profile
      const fullUser = await apiService.getCurrentUser();
      onUpdateUser(fullUser);

      toast.success('Identity updated successfully.');
      
    } catch (error) {
      console.error(error);
      toast.error('Failed to update identity.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    setIsChangingPassword(true);
    try {
      await apiService.changePassword(oldPassword, newPassword);
      toast.success('Access Key updated successfully.');
      setOldPassword('');
      setNewPassword('');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportLogs = async () => {
    setIsExporting(true);
    try {
      await apiService.backupLogs(exportType);
      toast.success(`Backup downloaded successfully.`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to export logs.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permRequest.reason.trim()) return;

    setIsSubmittingPerm(true);
    try {
      if (requestType === 'ROLE') {
         await apiService.submitRoleRequest(permRequest.role, permRequest.reason);
      } else {
         if (!permRequest.permission.trim()) {
             toast.error("Please select a permission key.");
             setIsSubmittingPerm(false);
             return;
         }
         await apiService.submitPermissionRequest(permRequest.permission, permRequest.reason);
      }
      
      setIsPermModalOpen(false);
      setPermRequest({ permission: '', role: 'admin', reason: '' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingPerm(false);
    }
  };

  const openPermissionModal = (type: 'ROLE' | 'PERM', defaultVal = '') => {
    setRequestType(type);
    setPermRequest({ permission: defaultVal, role: 'admin', reason: '' });
    setIsPermModalOpen(true);
  };

  const getRoleColorClass = (role?: string) => {
      switch (role) {
          case 'super_admin': return 'bg-purple-500 text-white border-purple-400';
          case 'admin': return 'bg-blue-500 text-white border-blue-400';
          case 'bot': return 'bg-slate-500 text-white border-slate-400';
          default: return 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      }
  };

  const getRoleLabel = (role?: string) => {
      if (!role) return 'User';
      // @ts-ignore
      return t.profile.roles[role] || role;
  };

  // Convert PERM_KEYS object to array for dropdown
  const availablePermissions = Object.entries(PERM_KEYS).map(([key, value]) => ({
    label: key,
    value: value
  }));

  return (
    <div className="container mx-auto px-6 py-24 pt-32 max-w-4xl animate-fade-in relative z-10">
      
      <div className="mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
        <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">
          {t.profile.title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {t.profile.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Avatar & Status */}
        <div className="col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col items-center text-center">
            
            {/* Clickable Avatar Area */}
            <div 
              className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-amber-400 to-rose-500 mb-6 relative group cursor-pointer"
              onClick={handleAvatarClick}
            >
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`} 
                alt="Avatar" 
                className={`w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-900 transition-opacity ${isUploadingAvatar ? 'opacity-50' : ''}`}
              />
              
              {/* Loading Indicator */}
              {isUploadingAvatar && (
                 <div className="absolute inset-0 flex items-center justify-center z-20">
                    <i className="fas fa-circle-notch fa-spin text-white text-3xl"></i>
                 </div>
              )}

              {/* Overlay for Edit Indication (Only show when not uploading) */}
              {!isUploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <i className="fas fa-camera text-white text-2xl"></i>
                </div>
              )}

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{user.displayName}</h2>
            <p className="text-sm font-mono text-slate-500 mb-4">{user.email}</p>
            
            <div className="flex gap-2 justify-center flex-wrap">
                <div className="inline-flex items-center px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                {t.profile.active}
                </div>
                
                {/* Role Badge */}
                {user.role && user.role !== 'user' && (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${getRoleColorClass(user.role)} bg-opacity-10 border-opacity-20`}>
                        {getRoleLabel(user.role)}
                    </div>
                )}
            </div>

            {user.vip && (
              <div className="mt-2 inline-flex items-center px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold uppercase tracking-widest border border-amber-500/20">
                 <i className="fas fa-crown mr-2"></i> {t.profile.vipBadge}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Edit Forms */}
        <div className="col-span-1 lg:col-span-2 space-y-8">
          
          {/* Identity Card */}
          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{t.profile.displayName}</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{t.profile.height}</label>
                    <input 
                      type="number" 
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g. 175"
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-slate-900 dark:text-white font-medium"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{t.profile.fitnessGoal}</label>
                    <select 
                      value={fitnessGoal}
                      onChange={(e) => setFitnessGoal(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-slate-900 dark:text-white font-medium"
                    >
                       <option value="cut">{t.profile.goals.cut}</option>
                       <option value="maintain">{t.profile.goals.maintain}</option>
                       <option value="bulk">{t.profile.goals.bulk}</option>
                    </select>
                 </div>
              </div>

              {/* Bark URL & Timezone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{t.profile.barkUrl}</label>
                <input 
                  type="text" 
                  value={barkUrl}
                  onChange={(e) => setBarkUrl(e.target.value)}
                  placeholder={t.profile.barkUrlPlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-slate-900 dark:text-white font-medium text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{t.profile.timezone}</label>
                <select 
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-slate-900 dark:text-white font-medium"
                >
                   {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                   ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{t.profile.email}</label>
                <input 
                  type="text" 
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{t.profile.uid}</label>
                <div className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-xs break-all">
                  {user._id}
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-8 py-3 bg-amber-500 text-black rounded-xl font-bold uppercase tracking-widest hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : t.profile.save}
                </button>
              </div>
            </form>
          </div>

          {/* Access Control & Permissions */}
          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
             <div className="flex items-center gap-3 mb-6">
                <i className="fas fa-key text-blue-500 text-xl"></i>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.profile.accessControl}</h3>
             </div>

             <div className="space-y-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl flex justify-between items-center">
                   <div className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{t.profile.role}</div>
                   <div className="font-bold text-slate-800 dark:text-white uppercase text-sm">{getRoleLabel(user.role)}</div>
                </div>

                <div className="flex gap-3 pt-2">
                   {user.role !== 'admin' && user.role !== 'super_admin' && (
                      <button 
                        onClick={() => openPermissionModal('ROLE', 'role:admin')} 
                        className="flex-1 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                      >
                         {t.profile.applyAdmin}
                      </button>
                   )}
                   <button 
                     onClick={() => openPermissionModal('PERM', '')}
                     className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-bold uppercase text-xs tracking-widest transition-all"
                   >
                      {t.profile.customRequest}
                   </button>
                </div>
             </div>
          </div>

          {/* Security Protocol: Change Password */}
          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
               <i className="fas fa-shield-alt text-amber-500 text-xl"></i>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.profile.security}</h3>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-6">
               <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{t.profile.oldPassword}</label>
                  <input 
                    type="password" 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-slate-900 dark:text-white font-medium"
                    placeholder="••••••••"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{t.profile.newPassword}</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-slate-900 dark:text-white font-medium"
                    placeholder="••••••••"
                  />
               </div>
               <div className="pt-2">
                 <button 
                   type="submit" 
                   disabled={isChangingPassword || !oldPassword || !newPassword}
                   className="px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all disabled:opacity-50"
                 >
                   {isChangingPassword ? <i className="fas fa-circle-notch fa-spin"></i> : t.profile.changePassword}
                 </button>
               </div>
            </form>
          </div>
          
          {/* VIP Data Management */}
          {user.vip && (
            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
               <div className="flex items-center gap-3 mb-6">
                  <i className="fas fa-database text-blue-500 text-xl"></i>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.profile.dataManagement}</h3>
               </div>
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t.profile.downloadBackup}</p>
               
               <div className="flex flex-col sm:flex-row gap-4">
                 <div className="relative flex-1">
                   <select
                      value={exportType}
                      onChange={(e) => setExportType(e.target.value)}
                      className="w-full appearance-none px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                   >
                      <option value="">Full System Backup</option>
                      <option value="posts">Posts & Journals</option>
                      <option value="photos">Photo Gallery</option>
                      <option value="todos">Tasks (Todos)</option>
                      <option value="comments">Comments</option>
                      <option value="users">Users Database</option>
                      <option value="chats">Chat History</option>
                      <option value="logs">System Logs</option>
                      <option value="fitness">Fitness Records</option>
                      <option value="audit">Audit Logs</option>
                   </select>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                     <i className="fas fa-chevron-down text-xs"></i>
                   </div>
                 </div>

                 <button 
                   onClick={handleExportLogs}
                   disabled={isExporting}
                   className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0"
                 >
                   {isExporting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-download"></i>}
                   {t.profile.exportLogs}
                 </button>
               </div>
            </div>
          )}

        </div>
      </div>

      {/* Permission Request Modal */}
      {isPermModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800 relative">
              <button 
                onClick={() => setIsPermModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                 <i className="fas fa-times text-lg"></i>
              </button>

              <div className="text-center mb-6">
                 <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-user-lock text-xl"></i>
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.profile.requestPermissionTitle}</h3>
              </div>

              <form onSubmit={handlePermSubmit} className="space-y-4">
                 
                 {/* Type Switcher */}
                 <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
                    <button
                       type="button"
                       onClick={() => { setRequestType('ROLE'); setPermRequest(p => ({...p, role: 'admin'})); }}
                       className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${requestType === 'ROLE' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' : 'text-slate-500'}`}
                    >
                       Role Upgrade
                    </button>
                    <button
                       type="button"
                       onClick={() => { setRequestType('PERM'); setPermRequest(p => ({...p, permission: ''})); }}
                       className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${requestType === 'PERM' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' : 'text-slate-500'}`}
                    >
                       Specific Permission
                    </button>
                 </div>

                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">
                        {requestType === 'ROLE' ? 'Target Role' : t.profile.permissionKey}
                    </label>
                    {requestType === 'ROLE' ? (
                        <select
                           value={permRequest.role}
                           onChange={(e) => setPermRequest({...permRequest, role: e.target.value})}
                           className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/50"
                        >
                           <option value="admin">Admin</option>
                           <option value="user">User</option>
                        </select>
                    ) : (
                        <select 
                           value={permRequest.permission}
                           onChange={(e) => setPermRequest({...permRequest, permission: e.target.value})}
                           className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/50"
                           required
                        >
                           <option value="" disabled>Select Permission Key</option>
                           {availablePermissions.map((perm) => (
                              <option key={perm.value} value={perm.value}>
                                 {perm.label} ({perm.value})
                              </option>
                           ))}
                        </select>
                    )}
                 </div>

                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">{t.profile.reasonLabel}</label>
                    <textarea 
                       value={permRequest.reason}
                       onChange={(e) => setPermRequest({...permRequest, reason: e.target.value})}
                       placeholder={t.profile.reasonPlaceholder}
                       className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-4 outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none h-32 text-slate-800 dark:text-slate-200 text-sm"
                       required
                    />
                 </div>

                 <div className="flex gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsPermModalOpen(false)}
                      className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                       {t.access.cancel}
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmittingPerm || !permRequest.reason.trim() || (requestType === 'PERM' && !permRequest.permission.trim())}
                      className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-bold text-xs uppercase shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                       {isSubmittingPerm && <i className="fas fa-circle-notch fa-spin"></i>}
                       {t.profile.submitRequest}
                    </button>
                 </div>
              </form>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};
