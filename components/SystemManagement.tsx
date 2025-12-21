
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../i18n/LanguageContext';
import { featureService } from '../services/featureService';
import { apiService } from '../services/api';
import { CloudinaryUsage, User, PaginationData, PermissionRequest, PERM_KEYS, can } from '../types';
import { toast } from './Toast';
import { DeleteModal } from './DeleteModal';

type SystemTab = 'RESOURCES' | 'USERS' | 'REQUESTS';

export const SystemManagement: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SystemTab>('RESOURCES');
  const [usageData, setUsageData] = useState<CloudinaryUsage | null>(null);
  const [loading, setLoading] = useState(true);

  // --- User Management State ---
  const [userList, setUserList] = useState<User[]>([]);
  const [userPagination, setUserPagination] = useState<PaginationData | null>(null);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const [showVipModal, setShowVipModal] = useState(false);
  const [isProcessingVip, setIsProcessingVip] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // --- Permission Requests State ---
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  
  // Reject Confirm State
  const [requestToReject, setRequestToReject] = useState<string | null>(null);

  // Library State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryImages, setLibraryImages] = useState<{ url: string, public_id: string }[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  
  // Delete State
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  useEffect(() => {
    if (activeTab === 'USERS') {
        const timer = setTimeout(() => {
            fetchUsers(1);
        }, 500);
        return () => clearTimeout(timer);
    } else if (activeTab === 'REQUESTS') {
        fetchRequests();
    }
  }, [activeTab, userSearch]);

  useEffect(() => {
    if (targetUser) {
        setSelectedRole(targetUser.role || 'user');
    }
  }, [targetUser]);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const data = await featureService.getCloudinaryUsage();
      setUsageData(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load system metrics.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page: number) => {
    setLoadingUsers(true);
    try {
      // API call: 25 items per page, sort by role, desc
      const { data, pagination } = await apiService.getUsers(page, 25, userSearch, 'role', 'desc');
      setUserList(data);
      setUserPagination(pagination);
      setUserPage(page);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Client-side sort to enforce precise display order: Super Admin > Admin > Newest User
  const displayUserList = useMemo(() => {
    const list = [...userList];
    return list.sort((a, b) => {
       const getRoleWeight = (role?: string) => {
           if (role === 'super_admin') return 100;
           if (role === 'admin') return 90;
           return 1;
       };
       const wA = getRoleWeight(a.role);
       const wB = getRoleWeight(b.role);
       
       if (wA !== wB) return wB - wA;
       
       // Sort by newest (descending ID)
       if (a._id > b._id) return -1;
       if (a._id < b._id) return 1;
       return 0;
    });
  }, [userList]);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const list = await apiService.getPermissionRequests('pending');
      setRequests(list);
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch requests");
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      await apiService.approvePermissionRequest(id);
      fetchRequests();
    } catch (e) {
      console.error(e);
    }
  };

  const confirmRejectRequest = async () => {
    if (!requestToReject) return;
    const id = requestToReject;
    try {
      await apiService.rejectPermissionRequest(id);
      setRequestToReject(null);
      fetchRequests();
    } catch (e) {
      console.error(e);
    }
  };

  // --- User Action Handlers ---
  const handleVipActionClick = () => {
    if (!targetUser) return;
    if (targetUser.role === 'bot') {
        toast.error("Operation Denied: Cannot modify Bot account.");
        return;
    }
    setShowVipModal(true);
  };

  const handleVipActionConfirm = async (secret?: string) => {
    if (!targetUser || !secret) return;
    setIsProcessingVip(true);
    try {
      await apiService.verifySecret(secret);
      if (targetUser.vip) {
         await apiService.revokeVip(targetUser.email);
         toast.success(`VIP revoked for ${targetUser.displayName}`);
      } else {
         await apiService.grantVip(targetUser.email);
         toast.success(`VIP granted to ${targetUser.displayName}`);
      }
      fetchUsers(userPage);
      setTargetUser(null);
      setShowVipModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingVip(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!targetUser) return;
    if (targetUser.role === 'bot') {
        toast.error("Operation Denied: Cannot modify Bot role.");
        return;
    }
    if (selectedRole === targetUser.role) return;
    
    setIsUpdatingRole(true);
    try {
        await apiService.updateUserRole(targetUser._id, selectedRole);
        toast.success(`Role updated to ${selectedRole}`);
        fetchUsers(userPage);
        setTargetUser(prev => prev ? ({ ...prev, role: selectedRole as any }) : null);
    } catch (e) {
        toast.error("Failed to update role");
    } finally {
        setIsUpdatingRole(false);
    }
  };

  // --- Library Handlers ---
  const handleOpenLibrary = async () => {
    setIsLibraryOpen(true);
    setLoadingLibrary(true);
    try {
        const imgs = await apiService.getRecentImages();
        setLibraryImages(imgs);
    } catch(e) {
        toast.error("Failed to load images");
    } finally {
        setLoadingLibrary(false);
    }
  };

  const confirmDeleteImage = async () => {
      if (!imageToDelete) return;
      const id = imageToDelete;
      setLibraryImages(prev => prev.filter(img => img.public_id !== id));
      setImageToDelete(null);
      try {
          await apiService.deleteCloudinaryImage(id);
          fetchUsage(); 
      } catch (e) {
          console.error(e);
          toast.error("Delete failed");
      }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading && !usageData) {
    return (
      <div className="container mx-auto px-6 py-32 flex flex-col items-center justify-center min-h-[60vh]">
        <i className="fas fa-circle-notch fa-spin text-4xl text-primary-500 mb-4"></i>
        <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">Analysing System Metrics...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-24 pt-32 max-w-7xl animate-fade-in relative z-10 min-h-screen">
      
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
        zIndexClass="z-[9999]"
      />

      <DeleteModal 
         isOpen={!!requestToReject}
         onClose={() => setRequestToReject(null)}
         onConfirm={confirmRejectRequest}
         title="Reject Request?"
         message="Are you sure you want to reject this permission request?"
         requireInput={false}
         buttonText="Reject"
      />

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
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button 
                onClick={() => setActiveTab('RESOURCES')}
                className={`px-6 py-2 rounded-lg text-sm font-bold uppercase transition-all ${activeTab === 'RESOURCES' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
                Resources
            </button>
            <button 
                onClick={() => setActiveTab('USERS')}
                className={`px-6 py-2 rounded-lg text-sm font-bold uppercase transition-all ${activeTab === 'USERS' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
                Users
            </button>
            <button 
                onClick={() => setActiveTab('REQUESTS')}
                className={`px-6 py-2 rounded-lg text-sm font-bold uppercase transition-all ${activeTab === 'REQUESTS' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
                Requests {requests.length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{requests.length}</span>}
            </button>
        </div>
      </div>

      {/* --- RESOURCES TAB --- */}
      {activeTab === 'RESOURCES' && usageData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Left Column: Overall Status */}
            <div className="lg:col-span-1 space-y-8">
                {/* Plan Card */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-500/20 transition-colors"></div>
                
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg">
                            <i className="fas fa-cloud"></i>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white">{t.system.cloudinary.title}</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">{usageData.plan} Plan</p>
                        </div>
                    </div>
                    
                    {/* Library Button */}
                    <button 
                        onClick={handleOpenLibrary}
                        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white hover:bg-blue-500 dark:hover:bg-blue-500 flex items-center justify-center transition-all shadow-sm"
                        title="Manage Image Library"
                    >
                        <i className="fas fa-images"></i>
                    </button>
                </div>

                {/* Circular Progress for Total Credits */}
                <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                            <circle 
                            cx="80" cy="80" r="70" 
                            stroke="currentColor" 
                            strokeWidth="12" 
                            fill="transparent" 
                            strokeDasharray={440} 
                            strokeDashoffset={440 - (440 * usageData.credits.used_percent) / 100} 
                            className={`transition-all duration-1000 ease-out ${
                                usageData.credits.used_percent > 80 ? 'text-red-500' : 
                                usageData.credits.used_percent > 50 ? 'text-amber-500' : 'text-emerald-500'
                            }`}
                            strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-slate-800 dark:text-white">{usageData.credits.used_percent.toFixed(1)}%</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t.system.cloudinary.credits}</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-4 text-center">
                        {usageData.credits.usage.toFixed(2)} used of {usageData.credits.limit} monthly credits
                    </p>
                </div>
                </div>

                {/* Resources Summary */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">{t.system.cloudinary.resources}</h4>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 dark:text-slate-300"><i className="fas fa-images mr-2 text-indigo-400"></i> Media Assets</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white">{formatNumber(usageData.resources)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 dark:text-slate-300"><i className="fas fa-magic mr-2 text-purple-400"></i> Derived</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white">{formatNumber(usageData.derived_resources)}</span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-3"></div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-300"><i className="fas fa-exchange-alt mr-2 text-emerald-400"></i> Requests</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white">{formatNumber(usageData.requests)}</span>
                </div>
                </div>
            </div>

            {/* Right Column: Detailed Metrics */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Storage Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                            <i className="fas fa-hdd"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white">{t.system.cloudinary.storage}</h4>
                            <p className="text-xs text-slate-500">{formatBytes(usageData.storage.usage)} Used</p>
                        </div>
                    </div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                        {usageData.storage.credits_usage.toFixed(2)} Credits
                    </span>
                </div>
                {/* Since storage often doesn't have a specific byte limit in response, we visualize credit impact */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${(usageData.storage.credits_usage / usageData.credits.usage) * 100}%` }}></div>
                </div>
                <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-slate-400">{( (usageData.storage.credits_usage / usageData.credits.usage) * 100 ).toFixed(1)}% of total usage</span>
                </div>
                </div>

                {/* Bandwidth Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                            <i className="fas fa-network-wired"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white">{t.system.cloudinary.bandwidth}</h4>
                            <p className="text-xs text-slate-500">{formatBytes(usageData.bandwidth.usage)} Consumed</p>
                        </div>
                    </div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                        {usageData.bandwidth.credits_usage.toFixed(2)} Credits
                    </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(usageData.bandwidth.credits_usage / usageData.credits.usage) * 100}%` }}></div>
                </div>
                <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-slate-400">{( (usageData.bandwidth.credits_usage / usageData.credits.usage) * 100 ).toFixed(1)}% of total usage</span>
                </div>
                </div>

                {/* Transformations Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                            <i className="fas fa-sync-alt"></i>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white">{t.system.cloudinary.transformations}</h4>
                            <p className="text-xs text-slate-500">{formatNumber(usageData.transformations.usage)} Operations</p>
                        </div>
                    </div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                        {usageData.transformations.credits_usage.toFixed(2)} Credits
                    </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(usageData.transformations.credits_usage / usageData.credits.usage) * 100}%` }}></div>
                </div>
                <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-slate-400">{( (usageData.transformations.credits_usage / usageData.credits.usage) * 100 ).toFixed(1)}% of total usage</span>
                </div>
                </div>

                {/* Objects Count (Simple Stat) */}
                <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-slate-500 flex items-center justify-center shadow-sm">
                        <i className="fas fa-cubes"></i>
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest text-sm">{t.system.cloudinary.objects}</span>
                </div>
                <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{formatNumber(usageData.objects.usage)}</span>
                </div>

            </div>
        </div>
      )}

      {/* --- USERS TAB --- */}
      {activeTab === 'USERS' && (
         <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col xl:flex-row gap-6 animate-fade-in min-h-[600px]">
            {/* User List Column - Expanded Width for Grid */}
            <div className="w-full xl:w-3/4 flex flex-col">
               <div className="relative mb-4">
                   <input 
                     type="text" 
                     value={userSearch} 
                     onChange={(e) => setUserSearch(e.target.value)}
                     placeholder="Search users..."
                     className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500/20"
                   />
                   <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
               </div>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                  {loadingUsers ? <div className="text-center py-10 opacity-50">Loading...</div> : (
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                     {displayUserList.map(u => (
                        <button
                           key={u._id}
                           onClick={() => setTargetUser(u)}
                           className={`flex flex-col items-center gap-3 p-4 rounded-xl transition-all text-center group border ${targetUser?._id === u._id ? 'bg-blue-500 text-white shadow-lg border-blue-500' : 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
                        >
                           <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm">
                              <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} className="w-full h-full object-cover"/>
                           </div>
                           <div className="w-full min-w-0">
                              <div className="font-bold truncate text-sm mb-1">{u.displayName}</div>
                              <div className={`text-[10px] truncate mb-2 ${targetUser?._id === u._id ? 'text-blue-100' : 'text-slate-400'}`}>{u.email}</div>
                              
                              <div className="flex justify-center gap-1">
                                    {u.role && u.role !== 'user' && (
                                        <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                                            u.role === 'super_admin' ? (targetUser?._id === u._id ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600') :
                                            u.role === 'admin' ? (targetUser?._id === u._id ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600') : 'bg-slate-200 text-slate-500'
                                        }`}>
                                            {u.role === 'super_admin' ? 'Super' : u.role}
                                        </span>
                                    )}
                                    {u.vip && <i className={`fas fa-crown text-xs ${targetUser?._id === u._id ? 'text-yellow-300' : 'text-amber-400'}`}></i>}
                              </div>
                           </div>
                        </button>
                     ))}
                     </div>
                  )}
               </div>
               
               {/* Pagination */}
               {userPagination && userPagination.totalPages > 1 && (
                  <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                     <button disabled={!userPagination.hasPrevPage} onClick={() => fetchUsers(userPage - 1)} className="text-slate-400 hover:text-blue-500 disabled:opacity-30"><i className="fas fa-chevron-left"></i></button>
                     <span className="text-xs font-mono text-slate-500 pt-1">Page {userPage}</span>
                     <button disabled={!userPagination.hasNextPage} onClick={() => fetchUsers(userPage + 1)} className="text-slate-400 hover:text-blue-500 disabled:opacity-30"><i className="fas fa-chevron-right"></i></button>
                  </div>
               )}
            </div>

            {/* Detail Column - Aligned Top */}
            <div className="w-full xl:w-1/4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-start relative">
               {!targetUser ? (
                  <div className="text-slate-400 text-center mt-20">
                     <i className="fas fa-user-circle text-4xl mb-4 opacity-50"></i>
                     <p>Select a user to manage.</p>
                  </div>
               ) : (
                  <div className="w-full animate-fade-in">
                     <div className="text-center mb-8">
                        <div className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden relative">
                           <img src={targetUser.photoURL || `https://ui-avatars.com/api/?name=${targetUser.displayName}`} className="w-full h-full object-cover"/>
                           {targetUser.role === 'bot' && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs font-bold text-white uppercase tracking-wider backdrop-blur-sm">Bot</div>}
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{targetUser.displayName}</h2>
                        <p className="text-sm font-mono text-slate-500 break-all">{targetUser.email}</p>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{targetUser._id}</p>
                     </div>

                     <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                           <div>
                              <div className="text-xs font-bold uppercase text-slate-400 mb-1">VIP Status</div>
                              <div className={`text-sm font-bold ${targetUser.vip ? 'text-amber-500' : 'text-slate-500'}`}>{targetUser.vip ? 'Active' : 'Inactive'}</div>
                           </div>
                           <button 
                              onClick={handleVipActionClick}
                              disabled={isProcessingVip || targetUser.role === 'bot'}
                              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${targetUser.vip ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'} disabled:opacity-50 disabled:cursor-not-allowed`}
                           >
                              {targetUser.vip ? 'Revoke' : 'Grant'}
                           </button>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                           <div className="text-xs font-bold uppercase text-slate-400 mb-2">Role</div>
                           <div className="flex gap-2">
                              <select 
                                 value={selectedRole}
                                 onChange={(e) => setSelectedRole(e.target.value)}
                                 disabled={targetUser.role === 'bot'}
                                 className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-50"
                              >
                                 <option value="user">User</option>
                                 <option value="admin">Admin</option>
                                 <option value="super_admin">Super Admin</option>
                                 <option value="bot" disabled>Bot</option>
                              </select>
                              <button 
                                 onClick={handleUpdateRole}
                                 disabled={isUpdatingRole || selectedRole === targetUser.role || targetUser.role === 'bot'}
                                 className="px-4 bg-blue-500 text-white rounded-lg font-bold text-xs uppercase hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                 Update
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>
      )}

      {/* --- REQUESTS TAB --- */}
      {activeTab === 'REQUESTS' && (
         <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl animate-fade-in min-h-[600px]">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
               {t.system.requests.title}
            </h3>
            
            {loadingRequests ? (
               <div className="text-center py-20 opacity-50">Loading...</div>
            ) : requests.length === 0 ? (
               <div className="text-center py-20 text-slate-400">
                  <i className="fas fa-check-circle text-4xl mb-4 opacity-50 text-emerald-500"></i>
                  <p>{t.system.requests.noPending}</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {requests.map(req => (
                     <div key={req._id} className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                        
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
                              <img src={req.user?.photoURL || `https://ui-avatars.com/api/?name=${req.user?.displayName || 'U'}`} className="w-full h-full object-cover"/>
                           </div>
                           <div>
                              <div className="font-bold text-slate-800 dark:text-white text-sm">{req.user?.displayName || 'Unknown'}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{req.user?.email}</div>
                           </div>
                        </div>

                        <div className="mb-4 space-y-2">
                           <div>
                              <div className="text-[10px] font-bold uppercase text-slate-400">{t.system.requests.permission}</div>
                              <div className="bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded text-xs font-mono text-slate-700 dark:text-slate-300 break-all border border-slate-100 dark:border-slate-800">
                                 {req.permission}
                              </div>
                           </div>
                           <div>
                              <div className="text-[10px] font-bold uppercase text-slate-400">{t.system.requests.reason}</div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{req.reason}"</p>
                           </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                           <button 
                              onClick={() => setRequestToReject(req._id)}
                              className="flex-1 py-2 text-red-500 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-xs font-bold uppercase transition-colors"
                           >
                              {t.system.requests.reject}
                           </button>
                           <button 
                              onClick={() => handleApproveRequest(req._id)}
                              className="flex-1 py-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-bold uppercase shadow-lg shadow-emerald-500/20 transition-colors"
                           >
                              {t.system.requests.approve}
                           </button>
                        </div>
                        
                        <div className="absolute top-4 right-4 text-[10px] text-slate-300">{new Date(req.createdAt).toLocaleDateString()}</div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      )}

      {/* --- Image Library Modal --- */}
      {isLibraryOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 relative">
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                       <i className="fas fa-images"></i>
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-slate-900 dark:text-white">Image Library</h3>
                       <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{libraryImages.length} Assets</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setIsLibraryOpen(false)}
                   className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                 >
                    <i className="fas fa-times"></i>
                 </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-black/20 custom-scrollbar">
                 {loadingLibrary ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                       <i className="fas fa-circle-notch fa-spin text-3xl mb-4 text-blue-500"></i>
                       <p className="font-mono text-xs uppercase tracking-widest">Fetching Assets...</p>
                    </div>
                 ) : libraryImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                       <i className="fas fa-folder-open text-5xl mb-4 opacity-50"></i>
                       <p>No images found in library.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                       {libraryImages.map((img) => (
                          <div key={img.public_id} className="group relative aspect-square bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700">
                             <img 
                               src={img.url} 
                               alt="Asset" 
                               className="w-full h-full object-cover" 
                               loading="lazy"
                             />
                             
                             {/* Overlay */}
                             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <button
                                   onClick={() => setImageToDelete(img.public_id)}
                                   className="w-10 h-10 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all flex items-center justify-center hover:bg-red-600 shadow-lg"
                                   title="Delete Asset"
                                >
                                   <i className="fas fa-trash-alt"></i>
                                </button>
                             </div>
                             
                             {/* ID Tag */}
                             <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur p-1 text-[9px] text-white/80 font-mono truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {img.public_id}
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              {/* Delete Modal inside Portal */}
              <DeleteModal
                isOpen={!!imageToDelete}
                onClose={() => setImageToDelete(null)}
                onConfirm={confirmDeleteImage}
                title="Delete Asset"
                message="Permanently remove this image from Cloudinary?"
                requireInput={false}
                buttonText="Delete"
                zIndexClass="z-[10000]"
              />
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};
