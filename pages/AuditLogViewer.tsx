import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { AuditLog, PaginationData, User } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

const ITEMS_PER_PAGE = 20;

type ViewMode = 'TIMELINE' | 'OPERATORS' | 'ACTIONS';

export const AuditLogViewer: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('TIMELINE');

  // Filters for Audit Log API
  const [filterOperator, setFilterOperator] = useState<User | null>(null);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [targetSearch, setTargetSearch] = useState('');

  // Operator List Data (for OPERATORS view)
  const [operatorList, setOperatorList] = useState<User[]>([]);
  const [operatorPagination, setOperatorPagination] = useState<PaginationData | null>(null);
  const [operatorLoading, setOperatorLoading] = useState(false);

  // Actions List (Derived or Static)
  const [uniqueActions, setUniqueActions] = useState<Set<string>>(new Set());

  // Custom Action Input State
  const [customActionSearch, setCustomActionSearch] = useState('');

  // --- Fetch Audit Logs ---
  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const { data, pagination: pager } = await apiService.getAuditLogs(page, ITEMS_PER_PAGE, {
        operator: filterOperator?._id, // Pass ID
        action: filterAction || undefined,
        target: targetSearch || undefined // Target or IP fuzzy search
      });
      setLogs(data);
      setPagination(pager);

      // Accumulate unique actions from logs for the filter list
      const acts = new Set(uniqueActions);
      data.forEach((log) => {
        if (log.action) acts.add(log.action);
      });
      setUniqueActions(acts);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch Users (Operators) ---
  const fetchOperators = async (page = 1) => {
    setOperatorLoading(true);
    try {
      const { data, pagination: pager } = await apiService.getUsers(page, 20); // 20 users per page
      setOperatorList(data);
      setOperatorPagination(pager);
    } catch (error) {
      console.error('Failed to fetch operators', error);
    } finally {
      setOperatorLoading(false);
    }
  };

  // Initial Load & Filter Changes
  useEffect(() => {
    if (viewMode === 'TIMELINE') {
      fetchLogs(1);
    } else if (viewMode === 'OPERATORS') {
      fetchOperators(1);
    }
  }, [viewMode, filterOperator, filterAction]);

  // Debounced search for target
  useEffect(() => {
    if (viewMode === 'TIMELINE') {
      const timer = setTimeout(() => {
        fetchLogs(1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [targetSearch]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const clearFilters = () => {
    setFilterOperator(null);
    setFilterAction(null);
    setTargetSearch('');
  };

  const handleCustomActionSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customActionSearch.trim()) return;
    setFilterAction(customActionSearch);
    setViewMode('TIMELINE');
    setCustomActionSearch('');
  };

  return (
    <div className="container mx-auto px-4 py-24 pt-32 max-w-7xl animate-fade-in min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <i className="fas fa-shield-alt text-cyan-400 text-xl"></i>
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-wide">
              {t.auditLog.title}
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-mono text-sm max-w-xl">
            {t.auditLog.subtitle}
          </p>
        </div>

        {/* Active Filters Display */}
        <div className="flex flex-col items-end gap-2">
          {(filterOperator || filterAction || targetSearch) && (
            <div className="flex flex-wrap items-center gap-2 justify-end">
              {filterOperator && (
                <button
                  onClick={() => setFilterOperator(null)}
                  className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs hover:bg-slate-700 flex items-center gap-2"
                >
                  <i className="fas fa-user text-cyan-400"></i> {filterOperator.displayName}{' '}
                  <i className="fas fa-times opacity-50"></i>
                </button>
              )}
              {filterAction && (
                <button
                  onClick={() => setFilterAction(null)}
                  className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs hover:bg-slate-700 flex items-center gap-2"
                >
                  <i className="fas fa-bolt text-amber-400"></i> {filterAction}{' '}
                  <i className="fas fa-times opacity-50"></i>
                </button>
              )}
              {targetSearch && (
                <button
                  onClick={() => setTargetSearch('')}
                  className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-white text-xs hover:bg-slate-700 flex items-center gap-2"
                >
                  <i className="fas fa-search text-purple-400"></i> "{targetSearch}"{' '}
                  <i className="fas fa-times opacity-50"></i>
                </button>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-red-400 hover:text-red-300 underline ml-2"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Quick Search Input */}
          <div className="relative group w-64">
            <input
              type="text"
              value={targetSearch}
              onChange={(e) => setTargetSearch(e.target.value)}
              placeholder="Search target or IP..."
              className="w-full bg-[#050914] border border-slate-700 rounded-lg px-3 py-2 pl-9 text-sm text-white focus:border-cyan-500 outline-none transition-colors"
            />
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-500"></i>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="col-span-1 space-y-6">
          <div className="bg-[#050914] border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 px-2">
              Views
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setViewMode('TIMELINE')}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${viewMode === 'TIMELINE' ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                <i className="fas fa-stream w-5 text-center"></i>
                <span className="font-bold text-sm">Live Feed</span>
              </button>
              <button
                onClick={() => setViewMode('OPERATORS')}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${viewMode === 'OPERATORS' ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                <i className="fas fa-users w-5 text-center"></i>
                <span className="font-bold text-sm">Operators</span>
              </button>
              <button
                onClick={() => setViewMode('ACTIONS')}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${viewMode === 'ACTIONS' ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                <i className="fas fa-terminal w-5 text-center"></i>
                <span className="font-bold text-sm">Commands</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-[#050914] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              System Status
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-sm font-mono text-emerald-400">Auditor Online</span>
            </div>
            <div className="space-y-3 text-sm text-slate-400 font-mono">
              <div className="flex justify-between">
                <span>Filtered Logs:</span>
                <span className="text-white">{pagination?.totalItems || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Page:</span>
                <span className="text-white">{pagination?.currentPage || 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-span-1 lg:col-span-3">
          <div className="bg-[#050914] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-[600px] flex flex-col">
            {/* Decorative Lines */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 pointer-events-none"></div>

            {/* VIEW: TIMELINE */}
            {viewMode === 'TIMELINE' && (
              <div className="flex-1 overflow-x-auto">
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
                          <td className="p-4">
                            <div className="h-4 w-24 bg-slate-800 rounded"></div>
                          </td>
                          <td className="p-4">
                            <div className="h-4 w-32 bg-slate-800 rounded"></div>
                          </td>
                          <td className="p-4">
                            <div className="h-4 w-20 bg-slate-800 rounded"></div>
                          </td>
                          <td className="p-4">
                            <div className="h-4 w-32 bg-slate-800 rounded"></div>
                          </td>
                          <td className="p-4">
                            <div className="h-4 w-24 bg-slate-800 rounded ml-auto"></div>
                          </td>
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
                                  <img
                                    src={
                                      log.operator.photoURL ||
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(log.operator.displayName)}&background=random`
                                    }
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    setFilterOperator(log.operator as User);
                                    setViewMode('TIMELINE');
                                  }}
                                  className="font-bold text-cyan-300 group-hover:text-cyan-200 hover:underline"
                                >
                                  {log.operator.displayName}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">System</span>
                            )}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => {
                                setFilterAction(log.action);
                                setViewMode('TIMELINE');
                              }}
                              className="inline-block px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white hover:border-cyan-500/50 transition-colors"
                            >
                              {log.action}
                            </button>
                          </td>
                          <td className="p-4 text-slate-400">
                            {log.target}
                            {log.details && (
                              <div className="text-[10px] text-slate-600 truncate max-w-[150px] group-hover:text-slate-500">
                                {JSON.stringify(log.details)}
                              </div>
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
            )}

            {/* VIEW: OPERATORS LIST */}
            {viewMode === 'OPERATORS' && (
              <div className="flex-1 flex flex-col">
                <div className="p-8">
                  <h3 className="text-xl font-bold text-white mb-6">User Directory</h3>
                  {operatorLoading ? (
                    <div className="text-center py-10 text-slate-500">
                      <i className="fas fa-circle-notch fa-spin mr-2"></i> Loading users...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {operatorList.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => {
                            setFilterOperator(user);
                            setViewMode('TIMELINE');
                          }}
                          className={`bg-slate-900 border p-4 rounded-xl flex items-center gap-4 transition-all hover:bg-slate-800 group text-left ${
                            filterOperator?._id === user._id
                              ? 'border-cyan-500/50 bg-cyan-900/10'
                              : 'border-slate-700 hover:border-cyan-500/30'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 overflow-hidden ring-2 ring-transparent group-hover:ring-cyan-500/30">
                            <img
                              src={
                                user.photoURL ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`
                              }
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white group-hover:text-cyan-400 truncate">
                              {user.displayName}
                            </div>
                            <div className="text-xs text-slate-500 truncate">{user.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pagination for Operators */}
                {operatorPagination && operatorPagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 p-4 mt-auto border-t border-slate-800">
                    <button
                      onClick={() => fetchOperators(operatorPagination.currentPage - 1)}
                      disabled={!operatorPagination.hasPrevPage}
                      className="text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <span className="text-xs text-slate-500 font-mono">
                      Page {operatorPagination.currentPage} of {operatorPagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchOperators(operatorPagination.currentPage + 1)}
                      disabled={!operatorPagination.hasNextPage}
                      className="text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VIEW: ACTIONS LIST */}
            {viewMode === 'ACTIONS' && (
              <div className="p-8 flex flex-col h-full">
                <h3 className="text-xl font-bold text-white mb-6">Command Center</h3>

                {/* Custom Search Box */}
                <form onSubmit={handleCustomActionSearch} className="mb-8 relative">
                  <input
                    type="text"
                    value={customActionSearch}
                    onChange={(e) => setCustomActionSearch(e.target.value)}
                    placeholder="Enter custom command or action..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder-slate-600 font-mono"
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold uppercase tracking-wide transition-colors"
                  >
                    <i className="fas fa-search mr-2"></i> Filter
                  </button>
                </form>

                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
                  Recent / Known Commands
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                  {Array.from(uniqueActions).length === 0 && (
                    <p className="text-slate-500 col-span-4 text-center">
                      No actions found in current fetched logs.
                    </p>
                  )}
                  {Array.from(uniqueActions).map((act) => (
                    <button
                      key={act}
                      onClick={() => {
                        setFilterAction(act);
                        setViewMode('TIMELINE');
                      }}
                      className={`bg-slate-900 border p-4 rounded-xl text-center transition-all hover:bg-slate-800 group flex flex-col items-center justify-center gap-3 aspect-video ${
                        filterAction === act
                          ? 'border-amber-500/50 bg-amber-900/10'
                          : 'border-slate-700 hover:border-amber-500/50'
                      }`}
                    >
                      <i className="fas fa-terminal text-2xl text-slate-600 group-hover:text-amber-400"></i>
                      <div className="font-mono font-bold text-xs text-slate-300 group-hover:text-white break-all">
                        {act}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Pagination */}
            {viewMode === 'TIMELINE' && pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/30 mt-auto">
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
      </div>
    </div>
  );
};
