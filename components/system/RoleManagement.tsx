
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../../i18n/LanguageContext';
import { apiService } from '../../services/api';
import { Role, Permission } from '../../types';
import { toast } from '../Toast';
import { DeleteModal } from '../DeleteModal';

export const RoleManagement: React.FC = () => {
  const { t } = useTranslation();
  const [roleList, setRoleList] = useState<Role[]>([]);
  const [permList, setPermList] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
        const [roles, perms] = await Promise.all([
            apiService.getAllRoles(),
            apiService.getAllPermissions()
        ]);
        setRoleList(roles);
        setPermList(perms);
    } catch (e) {
        console.error(e);
        toast.error("Failed to load data");
    } finally {
        setLoading(false);
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !editingRole.name) return;
    try {
        if (editingRole._id) {
            await apiService.updateRoleDefinition(editingRole.name, editingRole);
        } else {
            await apiService.createRole(editingRole);
        }
        setEditingRole(null);
        fetchData(); // Refresh list
        toast.success(t.system.roles.save + " Success");
    } catch (e) {
        console.error(e);
        toast.error("Save role failed");
    }
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
        await apiService.deleteRole(roleToDelete);
        fetchData();
        setRoleToDelete(null);
    } catch (e) { console.error(e); }
  };

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permList.forEach(p => {
        const cat = p.category || 'General';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(p);
    });
    return groups;
  }, [permList]);

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl animate-fade-in min-h-[600px]">
        <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t.system.roles.title}</h3>
            <button 
                onClick={() => setEditingRole({ name: '', description: '', permissions: [] })}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-primary-700 transition-colors"
            >
                {t.system.roles.add}
            </button>
        </div>

        {loading ? <div className="text-center py-20 opacity-50">Loading...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roleList.map(role => (
                    <div key={role._id} className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative group overflow-hidden hover:border-primary-500/30 transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-lg text-slate-800 dark:text-white uppercase tracking-wider">{role.name}</h4>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingRole(role)} className="text-slate-400 hover:text-blue-500"><i className="fas fa-edit"></i></button>
                                {!['super_admin', 'user', 'bot'].includes(role.name) && (
                                    <button onClick={() => setRoleToDelete(role.name)} className="text-slate-400 hover:text-red-500"><i className="fas fa-trash"></i></button>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10 line-clamp-2">{role.description}</p>
                        <div className="text-xs text-slate-400 font-mono mb-1">Permissions ({role.permissions.length}):</div>
                        <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 5).map(p => (
                                <span key={p} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded text-[9px] font-mono border border-slate-200 dark:border-slate-800">{p}</span>
                            ))}
                            {role.permissions.length > 5 && <span className="text-[9px] text-slate-400">+{role.permissions.length - 5} more</span>}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Role Editor Modal */}
        {editingRole && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingRole._id ? t.system.roles.edit : t.system.roles.add}</h3>
                        <button onClick={() => setEditingRole(null)} className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"><i className="fas fa-times"></i></button>
                    </div>
                    <form onSubmit={handleSaveRole} className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t.system.roles.name}</label>
                                <input 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary-500" 
                                    value={editingRole.name || ''} 
                                    onChange={e => setEditingRole({...editingRole, name: e.target.value})} 
                                    disabled={!!editingRole._id}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t.system.roles.desc}</label>
                                <textarea 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary-500 h-20 resize-none" 
                                    value={editingRole.description || ''} 
                                    onChange={e => setEditingRole({...editingRole, description: e.target.value})} 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">{t.system.roles.perms}</label>
                                <div className="space-y-4">
                                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                                        <div key={category} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <h5 className="text-xs font-bold uppercase text-primary-500 mb-2">{category}</h5>
                                            <div className="grid grid-cols-2 gap-2">
                                                {perms.map(p => {
                                                    const isChecked = editingRole.permissions?.includes(p.key);
                                                    return (
                                                        <label key={p.key} className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${isChecked ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                                                            <input 
                                                                type="checkbox" 
                                                                className="accent-primary-500"
                                                                checked={isChecked || false}
                                                                onChange={e => {
                                                                    const current = editingRole.permissions || [];
                                                                    const newPerms = e.target.checked 
                                                                        ? [...current, p.key]
                                                                        : current.filter(k => k !== p.key);
                                                                    setEditingRole({...editingRole, permissions: newPerms});
                                                                }}
                                                            />
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{p.name}</div>
                                                                <div className="text-[9px] text-slate-400 font-mono truncate">{p.key}</div>
                                                            </div>
                                                        </label>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3">
                            <button type="button" onClick={() => setEditingRole(null)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800">Cancel</button>
                            <button type="submit" className="px-6 py-2 rounded-lg text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-lg">{t.system.roles.save}</button>
                        </div>
                    </form>
                </div>
            </div>,
            document.body
        )}

        <DeleteModal 
            isOpen={!!roleToDelete}
            onClose={() => setRoleToDelete(null)}
            onConfirm={confirmDeleteRole}
            title="Delete Role?"
            message="Are you sure you want to delete this role? This action cannot be undone."
            requireInput={false}
            buttonText="Delete"
        />
    </div>
  );
};
