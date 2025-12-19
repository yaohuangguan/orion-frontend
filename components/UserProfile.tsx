import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, PaginationData } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { apiService } from '../services/api';
import { toast } from './Toast';
import { DeleteModal } from './DeleteModal';

interface UserProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser }) => {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [height, setHeight] = useState<string>(user.height ? user.height.toString() : '');
  const [fitnessGoal, setFitnessGoal] = useState<'cut' | 'bulk' | 'maintain'>(user.fitnessGoal || 'maintain');
  
  const [isLoading, setIsLoading] = useState(false);

  // Avatar Upload State
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // --- ADMIN CONSOLE STATE ---
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminPage, setAdminPage] = useState(1);
  const [adminPagination, setAdminPagination] = useState<PaginationData | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [isProcessingVip, setIsProcessingVip] = useState(false);
  
  // VIP Verification Modal State
  const [showVipModal, setShowVipModal] = useState(false);

  // Export Log State
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('');

  // Check if current user is VIP Admin
  const isVipAdmin = user.vip && user.private_token === 'ilovechenfangting';

  // Update local state when user prop changes (e.g. after refresh)
  useEffect(() => {
    setDisplayName(user.displayName);
    setHeight(user.height ? user.height.toString() : '');
    setFitnessGoal(user.fitnessGoal || 'maintain');
  }, [user]);

  // --- ADMIN EFFECTS ---
  // Debounce search
  useEffect(() => {
    if (!isVipAdmin) return;
    const timer = setTimeout(() => {
        fetchAdminUsers(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [adminSearch]);

  const fetchAdminUsers = async (page: number) => {
    if (!isVipAdmin) return;
    setAdminLoading(true);
    try {
      // Sort by 'vip' first (backend support: sortBy='vip', order='desc')
      const { data, pagination } = await apiService.getUsers(page, 10, adminSearch, 'vip', 'desc');
      setAdminUsers(data);
      setAdminPagination(pagination);
      setAdminPage(page);
    } catch (e) {
      console.error("Admin fetch failed", e);
    } finally {
      setAdminLoading(false);
    }
  };

  const handleVipActionClick = () => {
    if (!targetUser) return;
    setShowVipModal(true);
  };

  const handleVipActionConfirm = async (secret?: string) => {
    if (!targetUser || !secret) return;
    setIsProcessingVip(true);
    
    try {
      // 1. Verify Secret
      await apiService.verifySecret(secret);
      
      // 2. Perform VIP Action
      if (targetUser.vip) {
         await apiService.revokeVip(targetUser.email);
         toast.success(`VIP revoked for ${targetUser.displayName}`);
      } else {
         await apiService.grantVip(targetUser.email);
         toast.success(`VIP granted to ${targetUser.displayName}`);
      }
      
      // 3. Refresh and Cleanup
      fetchAdminUsers(adminPage);
      setTargetUser(null);
      setShowVipModal(false);
    } catch (e: any) {
      console.error(e);
      // Ensure modal doesn't close on error so they can retry, or rely on toast
      // Usually error handling is in apiService but verifySecret might throw specific error
    } finally {
      setIsProcessingVip(false);
    }
  };

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
      // Update Profile (Name, Height, Goal)
      const payload: Partial<User> = {
        displayName,
        fitnessGoal
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

  return (
    <div className="container mx-auto px-6 py-24 pt-32 max-w-4xl animate-fade-in relative z-10">
      
      {/* Verification Modal for VIP Actions */}
      <DeleteModal 
        isOpen={showVipModal}
        onClose={() => setShowVipModal(false)}
        onConfirm={handleVipActionConfirm}
        title="Security Verification"
        message="Please enter the system secret key to authorize this privilege escalation."
        isSecret={true}
        confirmKeyword=""
        buttonText="Verify & Execute"
      />

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
            
            <div className="inline-flex items-center px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
              {t.profile.active}
            </div>
            {user.vip && (
              <div className="mt-3 inline-flex items-center px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold uppercase tracking-widest border border-amber-500/20">
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

          {/* Admin Console: Enhanced User Manager */}
          {isVipAdmin && (
             <div className="bg-rose-50/50 dark:bg-rose-900/10 backdrop-blur-md rounded-3xl p-8 border border-rose-200 dark:border-rose-900/30 flex flex-col h-[600px]">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center text-xl shadow-lg shadow-rose-500/30">
                      <i className="fas fa-crown"></i>
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-rose-800 dark:text-rose-400">{t.profile.admin}</h3>
                      <p className="text-xs text-rose-400 dark:text-rose-500/70 font-mono uppercase tracking-widest">Clearance Level: OMEGA</p>
                   </div>
                </div>
                
                {/* Search Bar */}
                <div className="mb-4 relative">
                   <input 
                     type="text" 
                     value={adminSearch}
                     onChange={(e) => setAdminSearch(e.target.value)}
                     className="w-full bg-white dark:bg-slate-950 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3 pl-10 focus:ring-2 focus:ring-rose-500/30 outline-none transition-all placeholder-rose-300 text-sm"
                     placeholder="Search agents by name or email..."
                   />
                   <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-rose-300"></i>
                </div>

                {/* Main Content Area: Split View */}
                <div className="flex-1 flex gap-4 min-h-0">
                   
                   {/* Left: User List */}
                   <div className="w-1/2 bg-white/60 dark:bg-slate-900/60 border border-rose-100 dark:border-rose-900/20 rounded-2xl overflow-y-auto custom-scrollbar p-2 space-y-2">
                      {adminLoading ? (
                         <div className="text-center py-10 text-rose-400 animate-pulse">Scanning...</div>
                      ) : adminUsers.length === 0 ? (
                         <div className="text-center py-10 text-rose-300 text-sm">No records found.</div>
                      ) : (
                         <>
                           {adminUsers.map(u => (
                              <button
                                 key={u._id}
                                 onClick={() => setTargetUser(u)}
                                 className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${
                                    targetUser?._id === u._id 
                                       ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                                       : 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm text-slate-600 dark:text-slate-300'
                                 }`}
                              >
                                 <div className={`w-8 h-8 rounded-full overflow-hidden border-2 shrink-0 ${targetUser?._id === u._id ? 'border-rose-200' : 'border-transparent group-hover:border-rose-200'}`}>
                                    <img src={u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}&background=random`} className="w-full h-full object-cover" />
                                 </div>
                                 <div className="min-w-0 flex-1">
                                    <div className="font-bold text-xs truncate flex items-center gap-1">
                                       {u.displayName}
                                       {u.vip && <i className={`fas fa-star text-[8px] ${targetUser?._id === u._id ? 'text-yellow-300' : 'text-amber-500'}`}></i>}
                                    </div>
                                    <div className={`text-[10px] truncate ${targetUser?._id === u._id ? 'text-rose-100' : 'text-slate-400'}`}>{u.email}</div>
                                 </div>
                              </button>
                           ))}
                           
                           {/* Pagination Controls inside list */}
                           {adminPagination && adminPagination.totalPages > 1 && (
                              <div className="flex justify-center gap-2 pt-2">
                                 <button disabled={!adminPagination.hasPrevPage} onClick={() => fetchAdminUsers(adminPage - 1)} className="w-8 h-8 rounded-full bg-white border border-rose-100 text-rose-400 disabled:opacity-50 flex items-center justify-center hover:bg-rose-50"><i className="fas fa-chevron-left text-xs"></i></button>
                                 <button disabled={!adminPagination.hasNextPage} onClick={() => fetchAdminUsers(adminPage + 1)} className="w-8 h-8 rounded-full bg-white border border-rose-100 text-rose-400 disabled:opacity-50 flex items-center justify-center hover:bg-rose-50"><i className="fas fa-chevron-right text-xs"></i></button>
                              </div>
                           )}
                         </>
                      )}
                   </div>

                   {/* Right: User Detail & Action */}
                   <div className="w-1/2 flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/40 border border-rose-100 dark:border-rose-900/20 rounded-2xl p-6 text-center relative overflow-hidden">
                      {!targetUser ? (
                         <div className="text-rose-300">
                            <i className="fas fa-user-astronaut text-4xl mb-4 opacity-50"></i>
                            <p className="text-xs font-mono uppercase">Select an agent to manage clearance.</p>
                         </div>
                      ) : (
                         <div className="z-10 w-full animate-fade-in">
                            <div className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white shadow-xl relative">
                               <img src={targetUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.displayName)}&background=random`} className="w-full h-full rounded-full object-cover" />
                               {targetUser.vip && (
                                  <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md text-xs">
                                     <i className="fas fa-crown"></i>
                                  </div>
                               )}
                            </div>
                            
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{targetUser.displayName}</h3>
                            <p className="text-xs text-slate-500 font-mono mb-6 break-all">{targetUser.email}</p>
                            
                            <div className="bg-rose-50 dark:bg-slate-800 rounded-xl p-3 mb-6 border border-rose-100 dark:border-slate-700">
                               <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Current Status</p>
                               <div className={`text-sm font-bold ${targetUser.vip ? 'text-amber-500' : 'text-slate-500'}`}>
                                  {targetUser.vip ? 'VIP ACCESS GRANTED' : 'STANDARD ACCESS'}
                               </div>
                            </div>

                            <button 
                              onClick={handleVipActionClick}
                              disabled={isProcessingVip}
                              className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                                 targetUser.vip 
                                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
                              }`}
                            >
                               {isProcessingVip ? <i className="fas fa-circle-notch fa-spin"></i> : targetUser.vip ? 'Revoke VIP' : 'Grant VIP'}
                            </button>
                         </div>
                      )}
                      
                      {/* Background Decor */}
                      <div className="absolute -bottom-10 -right-10 text-9xl text-rose-500 opacity-[0.03] rotate-12 pointer-events-none">
                         <i className="fas fa-fingerprint"></i>
                      </div>
                   </div>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};