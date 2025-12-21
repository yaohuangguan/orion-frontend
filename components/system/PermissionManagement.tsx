
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../../i18n/LanguageContext';
import { apiService } from '../../services/api';
import { Permission } from '../../types';
import { toast } from '../Toast';
import { DeleteModal } from '../DeleteModal';

export const PermissionManagement: React.FC = () => {
  const { t } = useTranslation();
  const [permList, setPermList] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPerm, setEditingPerm] = useState<Partial<Permission> | null>(null);
  const [permToDelete, setPermToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
        const data = await apiService.getAllPermissions();
        setPermList(data);
    } catch (e) {
        console.error(e);
        toast.error("Failed to load permissions");
    } finally {
        setLoading(false);
    }
  };

  const handleSavePerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerm || !editingPerm.key || !editingPerm.name) return;
    try {
        if (editingPerm._id) {
            await apiService.updatePermission(editingPerm.key, editingPerm);
        } else {
            await apiService.createPermission(editingPerm);
        }
        setEditingPerm(null);
        fetchPermissions();
        toast.success(t.system.permissions.save + " Success");
    } catch (e) {
        console.error(e);
        toast.error("Save permission failed");
    }
  };

  const confirmDeletePerm = async () => {
    if (!permToDelete) return;
    try {
        await apiService.deletePermission(permToDelete);
        fetchPermissions();
        setPermToDelete(null);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl animate-fade-in min-h-[600px]">
        <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-700 pb-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t.system.permissions.title}</h3>
            <button 
                onClick={() => setEditingPerm({ key: '', name: '', description: '', category: 'General' })}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-primary-700 transition-colors"
            >
                {t.system.permissions.add}
            </button>
        </div>

        {loading ? <div className="text-center py-20 opacity-50">Loading...</div> : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                    <thead className="text-xs uppercase text-slate-400 bg-slate-50 dark:bg-slate-800">
                        <tr>
                            <th className="px-4 py-3 rounded-tl-lg">{t.system.permissions.key}</th>
                            <th className="px-4 py-3">{t.system.permissions.name}</th>
                            <th className="px-4 py-3">{t.system.permissions.category}</th>
                            <th className="px-4 py-3">{t.system.permissions.desc}</th>
                            <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {permList.map(perm => (
                            <tr key={perm._id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800 dark:text-white">{perm.key}</td>
                                <td className="px-4 py-3">{perm.name}</td>
                                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider">{perm.category}</span></td>
                                <td className="px-4 py-3 text-xs opacity-80">{perm.description}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => setEditingPerm(perm)} className="text-blue-500 hover:text-blue-600 mr-3"><i className="fas fa-edit"></i></button>
                                    {perm.key !== '*' && (
                                        <button onClick={() => setPermToDelete(perm.key)} className="text-red-500 hover:text-red-600"><i className="fas fa-trash"></i></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* Editor Modal */}
        {editingPerm && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingPerm._id ? t.system.permissions.edit : t.system.permissions.add}</h3>
                        <button onClick={() => setEditingPerm(null)} className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"><i className="fas fa-times"></i></button>
                    </div>
                    <form onSubmit={handleSavePerm} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t.system.permissions.key}</label>
                            <input 
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary-500 font-mono text-sm uppercase" 
                                value={editingPerm.key || ''} 
                                onChange={e => setEditingPerm({...editingPerm, key: e.target.value.toUpperCase()})} 
                                disabled={!!editingPerm._id}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t.system.permissions.name}</label>
                            <input 
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary-500" 
                                value={editingPerm.name || ''} 
                                onChange={e => setEditingPerm({...editingPerm, name: e.target.value})} 
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t.system.permissions.category}</label>
                            <input 
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary-500" 
                                value={editingPerm.category || ''} 
                                onChange={e => setEditingPerm({...editingPerm, category: e.target.value})} 
                                placeholder="General"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t.system.permissions.desc}</label>
                            <textarea 
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary-500 h-20 resize-none" 
                                value={editingPerm.description || ''} 
                                onChange={e => setEditingPerm({...editingPerm, description: e.target.value})} 
                            />
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setEditingPerm(null)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800">Cancel</button>
                            <button type="submit" className="px-6 py-2 rounded-lg text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-lg">{t.system.permissions.save}</button>
                        </div>
                    </form>
                </div>
            </div>,
            document.body
        )}

        <DeleteModal 
            isOpen={!!permToDelete}
            onClose={() => setPermToDelete(null)}
            onConfirm={confirmDeletePerm}
            title="Delete Permission?"
            message="Are you sure? Removing a permission may affect roles relying on it."
            requireInput={false}
            buttonText="Delete"
        />
    </div>
  );
};
