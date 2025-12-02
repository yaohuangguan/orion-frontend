

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { AuditLog, PaginationData } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

const ITEMS_PER_PAGE = 20;

export const AuditLogViewer: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const { data, pagination: pager } = await apiService.getAuditLogs(page, ITEMS_PER_PAGE);
      setLogs(data);
      setPagination(pager);
    } catch (error) {
      console.error("Failed to fetch audit logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-24 pt-32 max-w-7xl animate-fade-in">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-cyan-900/30 border border-cyan-500/30 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
           <i className="fas fa-terminal text-cyan-400 text-xl"></i>
        </div>
        <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2 tracking-wide">
          {t.auditLog.title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-mono text-sm">
          {t.auditLog.subtitle}
        </p>
      </div>

      <div className="bg-[#050914] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Decorative Lines */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-20"></div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-xs uppercase tracking-widest font-mono text-slate-400">
                <th className="p-4 pl-6">{t.auditLog.operator}</th>
                <th className="p-4">{t.auditLog.action}</th>
                <th className="p-4">{t.auditLog.target}</th>
                <th className="p-4">{t.auditLog.time}</th>
                <th className="p-4 pr-6 text-right">{t.auditLog.ip}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono text-sm">
              {loading ? (
                 [...Array(5)].map((_, i) => (
                   <tr key={i} className="animate-pulse">
                     <td className="p-4"><div className="h-4 w-24 bg-slate-800 rounded"></div></td>
                     <td className="p-4"><div className="h-4 w-32 bg-slate-800 rounded"></div></td>
                     <td className="p-4"><div className="h-4 w-20 bg-slate-800 rounded"></div></td>
                     <td className="p-4"><div className="h-4 w-32 bg-slate-800 rounded"></div></td>
                     <td className="p-4"><div className="h-4 w-24 bg-slate-800 rounded ml-auto"></div></td>
                   </tr>
                 ))
              ) : logs.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-500">
                       <i className="fas fa-search mb-2 block text-2xl opacity-50"></i>
                       {t.auditLog.noData}
                    </td>
                 </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-cyan-900/10 transition-colors group">
                    <td className="p-4 pl-6 text-white">
                      {log.operator ? (
                        <div className="flex items-center gap-3">
                           <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-700 ring-1 ring-slate-600">
                             <img src={log.operator.photoURL || `https://ui-avatars.com/api/?name=${log.operator.displayName}&background=random`} className="w-full h-full object-cover" />
                           </div>
                           <span className="font-bold text-cyan-300 group-hover:text-cyan-200">{log.operator.displayName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">System</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 group-hover:border-cyan-500/30 transition-colors">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                       {log.target}
                       {log.details && (
                         <div className="text-[10px] text-slate-600 truncate max-w-[150px] group-hover:text-slate-500">{JSON.stringify(log.details)}</div>
                       )}
                    </td>
                    <td className="p-4 text-slate-500 text-xs">
                       {formatDate(log.createdDate)}
                    </td>
                    <td className="p-4 pr-6 text-right text-slate-600 text-xs">
                       {log.ipAddress || '---'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/30">
             <button
                disabled={!pagination.hasPrevPage}
                onClick={() => fetchLogs(pagination.currentPage - 1)}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
             >
                <i className="fas fa-chevron-left mr-2"></i> {t.pagination.prev}
             </button>
             
             <span className="font-mono text-xs text-cyan-500">
               {t.pagination.page} {pagination.currentPage} / {pagination.totalPages}
             </span>

             <button
                disabled={!pagination.hasNextPage}
                onClick={() => fetchLogs(pagination.currentPage + 1)}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
             >
                {t.pagination.next} <i className="fas fa-chevron-right ml-2"></i>
             </button>
          </div>
        )}
      </div>
    </div>
  );
};