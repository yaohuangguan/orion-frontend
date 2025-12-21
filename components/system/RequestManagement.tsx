
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { apiService } from '../../services/api';
import { PermissionRequest } from '../../types';
import { toast } from '../Toast';
import { DeleteModal } from '../DeleteModal';

export const RequestManagement: React.FC = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestToReject, setRequestToReject] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const list = await apiService.getPermissionRequests('pending');
      setRequests(list);
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch requests");
    } finally {
      setLoading(false);
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

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl animate-fade-in min-h-[600px]">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
            {t.system.requests.title}
        </h3>
        
        {loading ? (
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

        <DeleteModal 
            isOpen={!!requestToReject}
            onClose={() => setRequestToReject(null)}
            onConfirm={confirmRejectRequest}
            title="Reject Request?"
            message="Are you sure you want to reject this permission request?"
            requireInput={false}
            buttonText="Reject"
        />
    </div>
  );
};
