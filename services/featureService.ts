
import { fetchClient, API_BASE_URL } from './core';
import { toast } from '../components/Toast';
import { ChatMessage, Todo, FitnessRecord, FitnessStats, PeriodRecord, PeriodResponse, Footprint, FootprintStats, Menu, DrawResponse, DailyListResponse, DailyListType, SmartMenuResponse, CloudinaryUsage } from '../types';

export const featureService = {
  // --- Chat ---
  getPublicChatHistory: async (roomName: string): Promise<ChatMessage[]> => {
    try {
      const res = await fetchClient<any[]>(`/chat/public/${roomName}`);
      return res.map(msg => ({
        message: msg.content || msg.message,
        author: msg.user?.name || msg.user?.displayName || 'Unknown',
        userId: msg.user?.id || msg.user?._id,
        email: msg.user?.email || msg.email,
        timestamp: msg.createdDate || msg.date,
        isPrivate: false,
        room: msg.room
      }));
    } catch (e) {
      console.warn("Public chat history fetch failed", e);
      return [];
    }
  },

  getPrivateChatHistory: async (targetUserId: string): Promise<ChatMessage[]> => {
    try {
      const res = await fetchClient<any[]>(`/chat/private/${targetUserId}`);
      return res.map(msg => {
        let sender: any = {};
        let senderId = '';
        
        if (msg.user && typeof msg.user === 'object') {
            sender = msg.user;
            senderId = sender._id || sender.id;
            if (sender.id && typeof sender.id === 'object') {
                sender = sender.id;
                senderId = sender._id || sender.id;
            }
        } else if (msg.fromUser && typeof msg.fromUser === 'object') {
             sender = msg.fromUser;
             senderId = sender._id || sender.id;
        } else {
            senderId = msg.fromUserId || msg.userId || (typeof msg.user === 'string' ? msg.user : '');
        }

        let receiverId = '';
        if (msg.toUser && typeof msg.toUser === 'object') {
             receiverId = msg.toUser._id || msg.toUser.id;
        } else {
             receiverId = msg.toUserId || msg.toUser || msg.receiver;
        }

        return {
          message: msg.content || msg.message,
          timestamp: msg.createdDate || msg.date || msg.timestamp,
          author: sender.displayName || sender.name || msg.author || 'Unknown',
          userId: senderId,
          email: sender.email || msg.email,
          photoURL: sender.photoURL || msg.photoURL,
          isPrivate: true,
          receiver: receiverId
        };
      });
    } catch (e) {
      console.warn("Private chat history fetch failed", e);
      return [];
    }
  },

  // --- AI Chat History (New) ---
  getAiChatHistory: async (page = 1, limit = 20): Promise<any[]> => {
    return await fetchClient<any[]>(`/chat/ai?page=${page}&limit=${limit}`);
  },

  saveAiChatMessage: async (text: string, role: 'user' | 'ai'): Promise<any> => {
    return await fetchClient('/chat/ai/save', {
      method: 'POST',
      body: JSON.stringify({ text, role })
    });
  },

  clearAiChatHistory: async (): Promise<any> => {
    return await fetchClient('/chat/ai', {
      method: 'DELETE'
    });
  },

  // --- Second Brain (God Mode) Streaming ---
  askLifeStream: async (
    prompt: string, 
    history: { role: 'user' | 'assistant', content: string }[], 
    onChunk: (text: string) => void,
    image?: string | null
  ): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error("No auth token");

    try {
      // Updated endpoint path to include /ai prefix
      const response = await fetch(`${API_BASE_URL}/ai/ask-life/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ prompt, history, image })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    } catch (e) {
      console.error("Streaming error:", e);
      throw e;
    }
  },

  // --- Bucket List (Todos) ---
  getTodos: async (): Promise<Todo[]> => {
    try {
      return await fetchClient<Todo[]>('/todo');
    } catch (e) {
       return [];
    }
  },

  addTodo: async (todo: string, description?: string, targetDate?: string, images?: string[], type?: 'wish' | 'routine'): Promise<Todo[]> => {
    try {
      const res = await fetchClient<Todo[]>('/todo', {
        method: 'POST',
        body: JSON.stringify({ todo, description, targetDate, images, type })
      });
      toast.success('Added to the list!');
      return res;
    } catch (e) {
      throw e;
    }
  },

  updateTodo: async (id: string, updates: Partial<Todo>): Promise<Todo[]> => {
    try {
      const payload: any = { ...updates };
      return await fetchClient<Todo[]>(`/todo/done/${id}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (e) {
      throw e;
    }
  },

  deleteTodo: async (id: string): Promise<void> => {
    await fetchClient(`/todo/${id}`, {
      method: 'DELETE'
    });
    toast.success('Removed from list.');
  },

  toggleTodo: async (id: string): Promise<Todo[]> => {
    throw new Error("Use updateTodo instead"); 
  },

  // --- Hot Search & News (Unified Daily List) ---
  getDailyList: async (type: DailyListType, force = false): Promise<DailyListResponse> => {
    const params = new URLSearchParams({ type });
    if (force) params.append('force', 'true');
    return await fetchClient<DailyListResponse>(`/external/daily-list?${params.toString()}`);
  },

  // Backward compatibility methods if needed (can be removed if all components updated)
  getHotSearch: async (force = false): Promise<DailyListResponse> => {
    return featureService.getDailyList('hotsearch', force);
  },

  getFinanceNews: async (force = false): Promise<DailyListResponse> => {
    return featureService.getDailyList('finance', force);
  },

  // --- Fitness ---
  updateFitnessGoal: async (goal: 'cut' | 'bulk' | 'maintain', userId?: string): Promise<{ success: boolean, msg: string, goal: string }> => {
    return await fetchClient<{ success: boolean, msg: string, goal: string }>('/users/fitness-goal', {
      method: 'PUT',
      body: JSON.stringify({ goal, userId })
    });
  },

  getFitnessRecords: async (start?: string, end?: string): Promise<FitnessRecord[]> => {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    return await fetchClient<FitnessRecord[]>(`/fitness?${params.toString()}`);
  },

  submitFitnessRecord: async (data: FitnessRecord): Promise<FitnessRecord> => {
    const res = await fetchClient<FitnessRecord>('/fitness', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    toast.success('Fitness record saved.');
    return res;
  },

  getFitnessStats: async (days: number = 30, email?: string): Promise<FitnessStats> => {
    const params = new URLSearchParams();
    params.append('days', days.toString());
    if (email) params.append('email', email);
    return await fetchClient<FitnessStats>(`/fitness/stats?${params.toString()}`);
  },

  // --- Period / Cycle Tracker ---
  getPeriodData: async (targetUserId?: string): Promise<PeriodResponse> => {
    const q = targetUserId ? `?targetUserId=${targetUserId}` : '';
    return await fetchClient<PeriodResponse>(`/period${q}`);
  },

  savePeriodRecord: async (data: Partial<PeriodRecord>, targetUserId?: string): Promise<PeriodResponse> => {
    const body = { ...data, targetUserId };
    if (data._id) {
      return await fetchClient<PeriodResponse>(`/period/${data._id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
    } else {
      return await fetchClient<PeriodResponse>('/period', {
        method: 'POST',
        body: JSON.stringify(body)
      });
    }
  },

  deletePeriodRecord: async (id: string): Promise<void> => {
    await fetchClient(`/period/${id}`, {
      method: 'DELETE'
    });
  },

  // --- Footprint / Star Map ---
  getFootprints: async (status?: string): Promise<{ stats: FootprintStats, data: Footprint[] }> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    return await fetchClient<{ stats: FootprintStats, data: Footprint[] }>(`/footprints?${params.toString()}`);
  },

  createFootprint: async (data: Partial<Footprint>): Promise<Footprint> => {
    const res = await fetchClient<Footprint>('/footprints', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    toast.success('Footprint added!');
    return res;
  },

  updateFootprint: async (id: string, data: Partial<Footprint>): Promise<Footprint> => {
    const res = await fetchClient<Footprint>(`/footprints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    toast.success('Footprint updated!');
    return res;
  },

  deleteFootprint: async (id: string): Promise<void> => {
    await fetchClient(`/footprints/${id}`, {
      method: 'DELETE'
    });
    toast.success('Footprint deleted.');
  },

  // --- Menu / Chef's Wheel ---
  getMenus: async (category?: string): Promise<Menu[]> => {
    const q = category ? `?category=${category}` : '';
    return await fetchClient<Menu[]>(`/menu${q}`);
  },

  drawMenu: async (category?: string, cooldown = false, healthy = false): Promise<DrawResponse> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (cooldown) params.append('cooldown', 'true');
    if (healthy) params.append('healthy', 'true');
    return await fetchClient<DrawResponse>(`/menu/draw?${params.toString()}`);
  },

  createMenu: async (data: Partial<Menu>): Promise<Menu> => {
    return await fetchClient<Menu>('/menu', { method: 'POST', body: JSON.stringify(data) });
  },

  updateMenu: async (id: string, data: Partial<Menu>): Promise<Menu> => {
    return await fetchClient<Menu>(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  deleteMenu: async (id: string): Promise<void> => {
    await fetchClient(`/menu/${id}`, { method: 'DELETE' });
  },

  confirmMenu: async (id: string, mealTime?: string): Promise<any> => {
    return await fetchClient(`/menu/confirm/${id}`, { method: 'POST', body: JSON.stringify({ mealTime }) });
  },

  getSmartMenuRecommendation: async (): Promise<SmartMenuResponse> => {
    return await fetchClient<SmartMenuResponse>('/menu/recommend', { method: 'POST' });
  },

  // --- Recipe & AI ---
  getRecipeDetails: async (name: string): Promise<any[]> => {
    return await fetchClient<any[]>(`/external/recipe/detail?name=${encodeURIComponent(name)}`);
  },

  getRecipeRecommendation: async (dishName: string): Promise<any> => {
    return await fetchClient<any>('/ai/recipe-recommend', {
      method: 'POST',
      body: JSON.stringify({ dishName })
    });
  },

  // --- Cloudinary Usage ---
  getCloudinaryUsage: async (): Promise<CloudinaryUsage> => {
    return await fetchClient<CloudinaryUsage>('/cloudinary/usage');
  }
};
