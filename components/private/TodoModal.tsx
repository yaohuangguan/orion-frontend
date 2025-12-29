import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../../i18n/LanguageContext';
import { Todo, User, BarkConfig } from '../../types';
import { apiService } from '../../services/api';
import { toast } from '../Toast';
import { R2ImageSelectorModal } from '../R2ImageSelectorModal';
import {
  getBarkIcons,
  getBarkLevels,
  getBarkSounds,
  getRecurrenceOptions
} from '../../constants/TodoConstants';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  todo: Partial<Todo> & { bark?: BarkConfig & { call?: string } };
  setTodo: React.Dispatch<
    React.SetStateAction<Partial<Todo> & { bark?: BarkConfig & { call?: string } }>
  >;
  onSave: () => void;
  isProcessing: boolean;
  isTesting: boolean;
  onTest: () => void;
  onDelete?: () => void;
  isEditing: boolean;
  user?: User | null;
  availableUsers: User[];
}

export const TodoModal: React.FC<TodoModalProps> = ({
  isOpen,
  onClose,
  todo,
  setTodo,
  onSave,
  isProcessing,
  isTesting,
  onTest,
  onDelete,
  isEditing,
  user,
  availableUsers
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barkImageInputRef = useRef<HTMLInputElement>(null);
  const barkIconInputRef = useRef<HTMLInputElement>(null);
  const notifyDropdownRef = useRef<HTMLDivElement>(null);

  const [isNotifyDropdownOpen, setIsNotifyDropdownOpen] = useState(false);
  const [isR2ModalOpen, setIsR2ModalOpen] = useState(false);
  const [r2Target, setR2Target] = useState<'icon' | 'image' | 'evidence' | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifyDropdownRef.current && !notifyDropdownRef.current.contains(event.target as Node)) {
        setIsNotifyDropdownOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!isOpen) return null;

  const toLocalISOString = (dateInput: Date | string) => {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localTime = new Date(date.getTime() - tzOffset);
    return localTime.toISOString().slice(0, 16);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'icon' | 'image' | 'evidence'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const folder = target === 'evidence' ? 'todo' : 'bark';
      const url = await apiService.uploadImage(file, { folder });

      if (target === 'evidence') {
        setTodo((prev) => ({ ...prev, images: [...(prev.images || []), url] }));
      } else if (target === 'icon') {
        setTodo((prev) => ({ ...prev, bark: { ...prev.bark, icon: url } }));
      } else {
        setTodo((prev) => ({ ...prev, bark: { ...prev.bark, image: url } }));
      }
      toast.success('Uploaded successfully');
    } catch (e) {
      toast.error('Upload failed');
    } finally {
      e.target.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent, target: 'icon' | 'image' | 'evidence') => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          e.stopPropagation();
          try {
            const folder = target === 'evidence' ? 'todo' : 'bark';
            const url = await apiService.uploadImage(file, { folder });
            if (target === 'evidence') {
              setTodo((prev) => ({ ...prev, images: [...(prev.images || []), url] }));
            } else if (target === 'icon') {
              setTodo((prev) => ({ ...prev, bark: { ...prev.bark, icon: url } }));
            } else {
              setTodo((prev) => ({ ...prev, bark: { ...prev.bark, image: url } }));
            }
            toast.success('Pasted successfully');
          } catch (e) {
            toast.error('Upload failed');
          }
          return;
        }
      }
    }
  };

  const handleR2Select = (url: string) => {
    if (r2Target === 'icon') {
      setTodo((prev) => ({ ...prev, bark: { ...prev.bark, icon: url } }));
    } else if (r2Target === 'image') {
      setTodo((prev) => ({ ...prev, bark: { ...prev.bark, image: url } }));
    } else if (r2Target === 'evidence') {
      setTodo((prev) => ({ ...prev, images: [...(prev.images || []), url] }));
    }
    setIsR2ModalOpen(false);
    setR2Target(null);
  };

  const removeImage = (index: number) => {
    const newImages = [...(todo.images || [])];
    newImages.splice(index, 1);
    setTodo((prev) => ({ ...prev, images: newImages }));
  };

  const toggleNotifyUser = (uid: string) => {
    setTodo((prev) => {
      const current = (prev.notifyUsers as string[]) || [];
      if (current.includes(uid)) {
        return { ...prev, notifyUsers: current.filter((id) => id !== uid) };
      } else {
        return { ...prev, notifyUsers: [...current, uid] };
      }
    });
  };

  const BARK_LEVELS = getBarkLevels(t);
  const BARK_SOUNDS = getBarkSounds(t);
  const BARK_ICONS = getBarkIcons(t);
  const RECURRENCE_OPTIONS = getRecurrenceOptions(t);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <R2ImageSelectorModal
        isOpen={isR2ModalOpen}
        onClose={() => setIsR2ModalOpen(false)}
        onSelect={handleR2Select}
      />

      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-pink-50 to-white">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-display font-bold text-slate-800">
              {isEditing ? t.privateSpace.bucketList.edit : t.privateSpace.bucketList.add}
            </h3>
            {todo.type === 'routine' && todo._id && (
              <button
                onClick={onTest}
                disabled={isTesting}
                className="text-[10px] font-bold uppercase bg-amber-100 text-amber-600 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-amber-200 transition-colors disabled:opacity-50"
              >
                {isTesting ? (
                  <i className="fas fa-circle-notch fa-spin"></i>
                ) : (
                  <i className="fas fa-bolt"></i>
                )}
                {isTesting
                  ? t.privateSpace.bucketList.config.testing
                  : t.privateSpace.bucketList.config.test}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTodo((prev) => ({ ...prev, type: 'wish' }))}
              className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${todo.type === 'wish' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}
            >
              {t.privateSpace.bucketList.types.wish}
            </button>
            <button
              onClick={() =>
                setTodo((prev) => ({
                  ...prev,
                  type: 'routine',
                  isActive: prev.isActive === undefined ? true : prev.isActive,
                  remindAt: prev.remindAt || new Date().toISOString()
                }))
              }
              className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${todo.type === 'routine' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}
            >
              {t.privateSpace.bucketList.types.routine}
            </button>
          </div>

          <input
            type="text"
            value={todo.todo}
            onChange={(e) => setTodo((prev) => ({ ...prev, todo: e.target.value }))}
            placeholder={t.privateSpace.bucketList.placeholder}
            className="w-full text-2xl font-bold text-slate-800 placeholder:text-slate-300 outline-none border-b border-transparent focus:border-pink-300 transition-all bg-transparent"
            autoFocus
          />

          {todo.type === 'wish' ? (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  {t.privateSpace.bucketList.status}
                </label>
                <div className="flex bg-slate-100 rounded-xl p-1">
                  {(['todo', 'in_progress', 'done'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setTodo((prev) => ({ ...prev, status: st }))}
                      className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                        todo.status === st
                          ? 'bg-white text-rose-500 shadow-sm'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {t.privateSpace.bucketList.tabs[st]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  {t.privateSpace.bucketList.targetDate}
                </label>
                <input
                  type="date"
                  value={
                    todo.targetDate ? new Date(todo.targetDate).toISOString().split('T')[0] : ''
                  }
                  onChange={(e) => setTodo((prev) => ({ ...prev, targetDate: e.target.value }))}
                  className="w-full bg-slate-100 border-none rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-pink-200 outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                <i className="fas fa-cog"></i> {t.privateSpace.bucketList.config.bark}
              </h4>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    {t.privateSpace.bucketList.routine.startTime}
                  </label>
                  <input
                    type="datetime-local"
                    value={todo.remindAt ? toLocalISOString(todo.remindAt) : ''}
                    onChange={(e) => {
                      const localDate = new Date(e.target.value);
                      if (!isNaN(localDate.getTime()))
                        setTodo((prev) => ({ ...prev, remindAt: localDate.toISOString() }));
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    {t.privateSpace.bucketList.routine.rule}
                  </label>
                  {todo.recurrence &&
                  !RECURRENCE_OPTIONS.some((opt) => opt.value === todo.recurrence) ? (
                    <input
                      type="text"
                      value={todo.recurrence}
                      onChange={(e) => setTodo((prev) => ({ ...prev, recurrence: e.target.value }))}
                      placeholder="输入 Cron 规则 (例如: 0 9 * * 1-5)"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-200 outline-none"
                    />
                  ) : (
                    <select
                      value={todo.recurrence || ''}
                      onChange={(e) => setTodo((prev) => ({ ...prev, recurrence: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-200 outline-none appearance-none"
                    >
                      {RECURRENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {todo.recurrence && (
                    <p className="text-[9px] text-slate-400 mt-1 italic">
                      {RECURRENCE_OPTIONS.find((o) => o.value === todo.recurrence)?.desc ||
                        '使用高级 Cron 语法。'}
                    </p>
                  )}
                </div>
              </div>

              <label className="flex items-center justify-between gap-2 p-2 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Status: {todo.isActive !== false ? 'Active' : 'Paused'}
                </span>
                <div
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${todo.isActive !== false ? 'bg-green-500' : 'bg-slate-300'}`}
                  onClick={() => setTodo((prev) => ({ ...prev, isActive: !prev.isActive }))}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${todo.isActive !== false ? 'translate-x-5' : 'translate-x-0.5'}`}
                  ></div>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-red-500 rounded border-slate-300"
                  checked={todo.bark?.call === '1'}
                  onChange={(e) =>
                    setTodo((prev) => ({
                      ...prev,
                      bark: { ...prev.bark, call: e.target.checked ? '1' : '0' }
                    }))
                  }
                />
                <span className="text-xs font-bold text-slate-600">
                  {t.privateSpace.bucketList.config.callMode}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    {t.privateSpace.bucketList.sounds.label}
                  </label>
                  <select
                    value={todo.bark?.sound || ''}
                    onChange={(e) =>
                      setTodo((prev) => ({
                        ...prev,
                        bark: { ...prev.bark, sound: e.target.value }
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none"
                  >
                    {BARK_SOUNDS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    {t.privateSpace.bucketList.priority.label}
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-white rounded-lg border border-slate-200 p-1">
                    {BARK_LEVELS.map((lvl) => (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() =>
                          setTodo((prev) => ({
                            ...prev,
                            bark: { ...prev.bark, level: lvl.value as any }
                          }))
                        }
                        className={`py-1.5 rounded text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${todo.bark?.level === lvl.value ? (lvl.value === 'critical' ? 'bg-red-600 text-white' : lvl.value === 'timeSensitive' ? 'bg-red-500 text-white' : lvl.value === 'passive' ? 'bg-slate-500 text-white' : 'bg-blue-500 text-white') : 'text-slate-400 hover:bg-slate-50'}`}
                        title={lvl.desc}
                      >
                        <i className={`fas ${lvl.icon}`}></i>
                        <span>{lvl.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div onPaste={(e) => handlePaste(e, 'icon')} className="group">
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    {t.privateSpace.bucketList.config.icon}
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-2 custom-scrollbar">
                    {BARK_ICONS.map((icon, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setTodo((prev) => ({ ...prev, bark: { ...prev.bark, icon: icon.value } }))
                        }
                        className={`w-8 h-8 rounded-lg border shrink-0 overflow-hidden transition-all ${todo.bark?.icon === icon.value ? 'ring-2 ring-primary-500 border-primary-500' : 'border-slate-200 opacity-70 hover:opacity-100'}`}
                        title={icon.label}
                      >
                        <img
                          src={icon.value}
                          className="w-full h-full object-cover"
                          alt={icon.label}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="w-9 h-9 rounded bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      {todo.bark?.icon ? (
                        <img
                          src={todo.bark.icon}
                          className="w-full h-full object-contain"
                          alt="Icon"
                        />
                      ) : (
                        <i className="fas fa-image text-slate-300"></i>
                      )}
                    </div>
                    <input
                      type="text"
                      value={todo.bark?.icon || ''}
                      onChange={(e) =>
                        setTodo((prev) => ({
                          ...prev,
                          bark: { ...prev.bark, icon: e.target.value }
                        }))
                      }
                      placeholder="Icon URL..."
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-800 outline-none focus:border-blue-300"
                    />
                    <button
                      onClick={() => barkIconInputRef.current?.click()}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 text-xs border border-slate-200"
                    >
                      <i className="fas fa-upload"></i>
                    </button>
                    <button
                      onClick={() => {
                        setR2Target('icon');
                        setIsR2ModalOpen(true);
                      }}
                      className="px-2 py-1 bg-orange-50 hover:bg-orange-100 rounded text-orange-600 text-xs border border-orange-200"
                    >
                      <i className="fas fa-database"></i>
                    </button>
                    <input
                      type="file"
                      ref={barkIconInputRef}
                      hidden
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'icon')}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    {t.privateSpace.bucketList.config.url}
                  </label>
                  <input
                    type="text"
                    value={todo.bark?.url || ''}
                    onChange={(e) =>
                      setTodo((prev) => ({ ...prev, bark: { ...prev.bark, url: e.target.value } }))
                    }
                    placeholder={t.privateSpace.bucketList.config.urlPlaceholder}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-300"
                  />
                </div>
              </div>
              <div
                className="border-t border-slate-100 pt-4"
                onPaste={(e) => handlePaste(e, 'image')}
              >
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  {t.privateSpace.bucketList.config.image}
                </label>
                <div className="flex gap-2 items-center">
                  <div className="w-12 h-9 rounded bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {todo.bark?.image ? (
                      <img
                        src={todo.bark.image}
                        className="w-full h-full object-cover"
                        alt="Push"
                      />
                    ) : (
                      <i className="fas fa-image text-slate-300"></i>
                    )}
                  </div>
                  <input
                    type="text"
                    value={todo.bark?.image || ''}
                    onChange={(e) =>
                      setTodo((prev) => ({
                        ...prev,
                        bark: { ...prev.bark, image: e.target.value }
                      }))
                    }
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-300"
                    placeholder="https://..."
                  />
                  <button
                    onClick={() => barkImageInputRef.current?.click()}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 text-xs border border-slate-200"
                  >
                    <i className="fas fa-upload"></i>
                  </button>
                  <button
                    onClick={() => {
                      setR2Target('image');
                      setIsR2ModalOpen(true);
                    }}
                    className="px-2 py-1 bg-orange-50 hover:bg-orange-100 rounded text-orange-600 text-xs border border-orange-200"
                  >
                    <i className="fas fa-database"></i>
                  </button>
                  <input
                    type="file"
                    ref={barkImageInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'image')}
                  />
                </div>
              </div>
              {user?.role === 'super_admin' && (
                <div className="relative pt-4 border-t border-slate-100" ref={notifyDropdownRef}>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    {t.privateSpace.bucketList.notify.label}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNotifyDropdownOpen(!isNotifyDropdownOpen)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-left flex justify-between items-center outline-none hover:border-slate-300 text-slate-800"
                  >
                    <span
                      className={todo.notifyUsers?.length ? 'text-slate-800' : 'text-slate-400'}
                    >
                      {todo.notifyUsers && todo.notifyUsers.length > 0
                        ? `${todo.notifyUsers.length} Selected`
                        : t.privateSpace.bucketList.notify.select}
                    </span>
                    <i
                      className={`fas fa-chevron-down text-xs text-slate-400 transition-transform ${isNotifyDropdownOpen ? 'rotate-180' : ''}`}
                    ></i>
                  </button>
                  {isNotifyDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {availableUsers.map((u) => {
                        const isSelected = ((todo.notifyUsers as string[]) || []).includes(u._id);
                        return (
                          <button
                            key={u._id}
                            type="button"
                            onClick={() => toggleNotifyUser(u._id)}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}`}
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 bg-white'}`}
                            >
                              {isSelected && (
                                <i className="fas fa-check text-white text-[10px]"></i>
                              )}
                            </div>
                            <img
                              src={
                                u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`
                              }
                              alt={u.displayName}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="text-xs font-bold truncate flex-1 text-left">
                              {u.displayName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
              {t.privateSpace.bucketList.description}
            </label>
            <textarea
              value={todo.description}
              onChange={(e) => setTodo((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-800 min-h-[120px] focus:ring-2 focus:ring-pink-200 outline-none resize-none placeholder-slate-400"
              placeholder="..."
            />
          </div>

          <div onPaste={(e) => handlePaste(e, 'evidence')}>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold uppercase text-slate-400">
                {t.privateSpace.bucketList.evidence}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="text-xs font-bold text-pink-500 hover:bg-pink-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                >
                  <i className="fas fa-camera"></i> {t.privateSpace.bucketList.uploadEvidence}
                </button>
                <button
                  onClick={() => {
                    setR2Target('evidence');
                    setIsR2ModalOpen(true);
                  }}
                  className="text-xs font-bold text-orange-500 hover:bg-orange-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                >
                  <i className="fas fa-database"></i> R2
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'evidence')}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {todo.images?.map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-square relative group rounded-xl overflow-hidden shadow-sm bg-slate-100"
                >
                  <img src={img} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <i className="fas fa-times text-[10px]"></i>
                  </button>
                </div>
              ))}
              {todo.images?.length === 0 && (
                <div className="col-span-3 h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 text-xs">
                  No photos yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          {isEditing && onDelete ? (
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-600 text-xs font-bold uppercase px-2 transition-colors"
            >
              {t.privateSpace.bucketList.delete}
            </button>
          ) : (
            <div></div>
          )}
          <button
            onClick={onSave}
            disabled={isProcessing || !todo.todo}
            className="px-8 py-3 bg-rose-500 text-white font-bold rounded-xl shadow-lg hover:bg-rose-600 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isProcessing && <i className="fas fa-circle-notch fa-spin"></i>}
            {isEditing ? t.privateSpace.bucketList.update : t.privateSpace.bucketList.save}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
