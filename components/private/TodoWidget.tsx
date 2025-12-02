
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { Todo } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';

export const TodoWidget: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const data = await apiService.getTodos();
      setTodos(data);
    } catch (error) {
      console.error('Failed to fetch todos', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    // Optimistic update
    const tempId = Date.now().toString();
    const tempTodo: Todo = { _id: tempId, todo: newTodo, done: false, timestamp: Date.now() };
    setTodos([tempTodo, ...todos]);
    setNewTodo('');

    try {
      const updatedList = await apiService.addTodo(newTodo);
      setTodos(updatedList);
    } catch (error) {
      console.error('Failed to add todo', error);
      fetchTodos(); // Revert on error
    }
  };

  const handleToggle = async (id: string) => {
    // Optimistic update
    setTodos(todos.map(t => t._id === id ? { ...t, done: !t.done } : t));

    try {
      const updatedList = await apiService.toggleTodo(id);
      setTodos(updatedList);
    } catch (error) {
      console.error('Failed to toggle todo', error);
      fetchTodos();
    }
  };

  // Calculate undone tasks for badge
  const undoneCount = todos.filter(t => !t.done).length;

  return (
    <div className={`bg-pink-100 rounded-3xl shadow-lg border border-pink-200 transition-all duration-300 relative overflow-hidden ${isOpen ? 'h-96' : 'h-16'}`}>
      {/* Decorative bg */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-pink-200 rounded-bl-full -mr-4 -mt-4 z-0 pointer-events-none"></div>

      {/* Header / Toggle Bar */}
      <div 
        className="h-16 px-5 flex items-center justify-between cursor-pointer relative z-10 hover:bg-pink-200/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-pink-300 text-white' : 'bg-white text-pink-400'}`}>
            <span className="text-lg">✨</span>
          </div>
          <h3 className="text-lg font-bold text-pink-900">
            {t.privateSpace.tasks}
            {undoneCount > 0 && !isOpen && (
              <span className="ml-2 text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full">{undoneCount}</span>
            )}
          </h3>
        </div>
        
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-pink-400 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-white' : 'bg-white/50'}`}>
           <i className="fas fa-chevron-down text-xs"></i>
        </div>
      </div>

      {/* Expandable Content */}
      <div className={`flex flex-col h-[calc(100%-4rem)] px-5 pb-5 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <form onSubmit={handleAdd} className="relative mb-4 z-10 shrink-0">
          <input 
            type="text" 
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder={t.privateSpace.newTask}
            className="w-full bg-white border border-pink-200 rounded-xl py-2.5 pl-4 pr-10 focus:ring-2 focus:ring-pink-400 outline-none text-sm text-slate-700 placeholder:text-pink-300 transition-all"
          />
          <button 
            type="submit" 
            disabled={!newTodo.trim()}
            className="absolute right-1.5 top-1.5 w-7 h-7 flex items-center justify-center bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 shadow-md"
          >
            <i className="fas fa-plus text-[10px]"></i>
          </button>
        </form>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar z-10">
          {isLoading ? (
            <div className="text-center py-4 text-pink-400 text-xs">Loading...</div>
          ) : todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-pink-300 pb-4">
              <i className="fas fa-check-circle text-2xl mb-2 opacity-50"></i>
              <span className="text-xs">{t.privateSpace.caughtUp}</span>
            </div>
          ) : (
            todos.map((todo) => (
              <div 
                key={todo._id} 
                className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/60 transition-colors cursor-pointer border border-transparent hover:border-pink-200"
                onClick={() => handleToggle(todo._id)}
              >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${todo.done ? 'bg-pink-400 border-pink-400' : 'bg-white border-pink-200 group-hover:border-pink-400'}`}>
                  {todo.done && <i className="fas fa-check text-white text-[10px]"></i>}
                </div>
                <span className={`flex-1 text-sm font-medium truncate transition-all ${todo.done ? 'text-pink-400/70 line-through' : 'text-pink-900'}`}>
                  {todo.todo}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
