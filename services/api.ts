






import { BlogPost, User, Comment, Project, ResumeItem, Log, Todo, Photo, PaginatedResponse, PaginationData, AuditLog, ChatMessage, FitnessRecord, FitnessStats } from '../types';
import { toast } from '../components/Toast';

const API_BASE_URL = 'https://bananaboom-api-242273127238.asia-east1.run.app/api';

/**
 * Native fetch wrapper with error handling, timeouts, and auth headers
 */
async function fetchClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  // Increased timeout to 15s to handle potential Cloud Run cold starts
  const id = setTimeout(() => controller.abort(), 15000); 

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Inject token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      (headers as any)['x-auth-token'] = token;
    }

    // Inject Google Auth if available
    const googleInfo = localStorage.getItem('googleInfo');
    if (googleInfo) {
      (headers as any)['x-google-auth'] = googleInfo;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers,
    });
    clearTimeout(id);

    // Handle Auth Errors (Token Expired) -> 401
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('googleInfo');
      window.dispatchEvent(new Event('auth:logout'));
      toast.error('Session expired. Please login again.');
      throw new Error('Session expired. Please login again.');
    }

    // Handle Forbidden (VIP Only) -> 403
    if (response.status === 403) {
      toast.error('VIP Access Required.');
      // Do NOT logout, just throw error to be caught by caller
      throw new Error('Forbidden: VIP Access Required.');
    }

    // Handle Standard Errors (4xx, 5xx)
    if (!response.ok) {
      const errorBody = await response.text();
      let msg = `API Error ${response.status}`;
      
      // Try to parse JSON error if possible
      try {
        const errorJson = JSON.parse(errorBody);
        msg = errorJson.message || errorJson.msg || msg;
        
        // Handle specific "token not the same" error
        if (msg.includes('token') || msg.includes('expired')) {
           localStorage.removeItem('auth_token');
           localStorage.removeItem('googleInfo');
           window.dispatchEvent(new Event('auth:logout'));
        }
      } catch (e) {
        msg = errorBody || msg;
      }
      
      // Global Toast Notification for Errors
      toast.error(msg);
      throw new Error(msg);
    }

    // Handle 204 No Content (often used for DELETE)
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(id);
    // Identify abort errors specifically
    if (error.name === 'AbortError') {
      const msg = 'Request timed out. The server might be waking up.';
      toast.error(msg);
      throw new Error(msg);
    }
    // If it's a network error (not a response error which is handled above)
    if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
       toast.error('Network connection error.');
    }
    throw error;
  }
}

// Helper to convert File to Base64 Data URI (Legacy/Raw)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Helper: Client-side Image Compression (Fallback)
const compressImage = (file: File, quality = 0.7, maxWidth = 1600): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          // Canvas context failed, fallback to raw base64
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
};

// Helper: Upload to Cloudinary directly
const uploadToCloudinary = async (file: File): Promise<string> => {
  // 1. Get Public Config
  const config = await fetchClient<{cloudName: string, apiKey: string}>('/cloudinary/config');
  
  // 2. Get Secure Signature
  const signData = await fetchClient<{timestamp: number, signature: string}>('/cloudinary/signature');
  
  // 3. Construct FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', config.apiKey);
  formData.append('timestamp', signData.timestamp.toString());
  formData.append('signature', signData.signature);
  
  // 4. Post to Cloudinary (Use native fetch to avoid adding app auth headers)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error(`Cloudinary Upload Failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.secure_url;
};

// Define the featured post separately to ensure it's always included
const FEATURED_POST: BlogPost = {
  _id: 'quant-guide-vpts',
  name: 'VPTS Quant Trader Guide',
  info: 'A comprehensive interactive dashboard and guide for quantitative trading strategies, backtesting results, and market analysis tools.',
  author: 'Sam',
  tags: ['Quant', 'Trading', 'Dashboard', 'Tools'],
  date: '2024-01-15',
  createdDate: '2024-01-15',
  likes: 342,
  // Reliable finance/trading abstract image
  image: 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?q=80&w=1000&auto=format&fit=crop', 
  iframeUrl: 'https://vpts-quant-trader-guide-177446715054.us-west1.run.app/',
  isPrivate: false
};

// Fallback data in case the real API is cold or restricted in this environment
const MOCK_BLOGS: BlogPost[] = [
  {
    _id: '1',
    name: 'The Evolution of Frontend Architecture',
    info: 'Why we moved from Monoliths to Micro-frontends and back to Modular Monoliths with Next.js.',
    author: 'Sam',
    tags: ['Architecture', 'Next.js', 'React'],
    date: '2023-10-24',
    createdDate: '2023-10-24',
    likes: 156,
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop',
    content: '<p>In the rapidly evolving landscape of frontend development...</p>',
    isPrivate: false
  },
  {
    _id: '2',
    name: 'Designing for Thinking Agents',
    info: 'Exploring the UX patterns required when interfacing with reasoning models like Gemini 3 Pro.',
    author: 'Sam',
    tags: ['AI', 'UX', 'Gemini'],
    date: '2023-11-15',
    createdDate: '2023-11-15',
    likes: 92,
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop',
    content: '<p>As AI models become more capable...</p>',
    isPrivate: false
  }
];

export const apiService = {
  // --- Auth & Subscription ---
  subscribe: async (email: string): Promise<any> => {
    const res = await fetchClient('/auth/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    toast.success('Subscribed successfully!');
    return res;
  },

  // --- Users ---
  login: async (email: string, password: string): Promise<{ token: string, user?: User }> => {
    try {
      const response = await fetchClient<{ token: string, user?: User }>('/users/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      toast.success('Welcome back!');
      return response;
    } catch (error) {
      throw error;
    }
  },

  register: async (displayName: string, email: string, password: string, passwordConf: string): Promise<{ token: string, user?: User }> => {
    try {
      const response = await fetchClient<{ token: string, user?: User }>('/users', {
        method: 'POST',
        body: JSON.stringify({ 
          displayName, 
          email, 
          password, 
          passwordConf 
        }),
      });
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      toast.success('Registration successful! Welcome aboard.');
      return response;
    } catch (error) {
      throw error;
    }
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<any> => {
    return await fetchClient('/users/password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword })
    });
  },

  resetPasswordBySecret: async (email: string, newPassword: string, secretKey: string): Promise<any> => {
    return await fetchClient('/users/reset-by-secret', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword, secretKey })
    });
  },

  grantVip: async (email: string): Promise<any> => {
    return await fetchClient('/users/grant-vip', {
      method: 'PUT',
      body: JSON.stringify({ email })
    });
  },

  backupLogs: async (type?: string): Promise<void> => {
    const token = localStorage.getItem('auth_token');
    const urlEndpoint = type ? `${API_BASE_URL}/backup?type=${type}` : `${API_BASE_URL}/backup`;

    const response = await fetch(urlEndpoint, {
      method: 'GET',
      headers: {
        'x-auth-token': token || '',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Backup failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `backup-${type || 'full'}-${new Date().toISOString().split('T')[0]}.json`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      return await fetchClient<User>('/users/profile');
    } catch (error) {
      console.warn("Auth check failed:", error);
      localStorage.removeItem('auth_token'); // Ensure clean state
      throw error;
    }
  },

  logout: async () => {
    try {
      await fetchClient('/users/logout', { method: 'POST' }).catch(() => {});
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('googleInfo');
      toast.info('You have been logged out.');
    }
  },

  changeUsername: async (id: string, newDisplayName: string): Promise<any> => {
    const res = await fetchClient(`/users/changeusername/${id}`, {
      method: 'POST',
      body: JSON.stringify({ newDisplayName })
    });
    toast.success('Username updated.');
    return res;
  },

  // NEW: Update Profile (Name & Avatar)
  updateProfile: async (id: string, data: { displayName?: string, photoURL?: string }): Promise<User> => {
    return await fetchClient<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // NEW: Helper to upload image (Public for components)
  uploadImage: async (file: File): Promise<string> => {
    try {
      return await uploadToCloudinary(file);
    } catch (e) {
      console.warn('Cloudinary upload failed, falling back to compression:', e);
      try {
        const compressed = await compressImage(file);
        toast.info('Using local compression fallback.');
        return compressed;
      } catch (compressError) {
         return await fileToBase64(file);
      }
    }
  },

  // --- Audit Logs ---
  getAuditLogs: async (page: number = 1, limit: number = 20, operator?: string, action?: string): Promise<{ data: AuditLog[], pagination: PaginationData }> => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (operator) queryParams.append('operator', operator);
    if (action) queryParams.append('action', action);

    const response = await fetchClient<PaginatedResponse<AuditLog>>(`/audit?${queryParams.toString()}`);
    
    // Adapt backend pagination structure
    const backendPagination = response.pagination as any;
    const pagination: PaginationData = {
      currentPage: backendPagination.currentPage,
      totalPages: backendPagination.totalPages,
      totalItems: backendPagination.totalPosts || 0,
      itemsPerPage: limit,
      hasNextPage: backendPagination.currentPage < backendPagination.totalPages,
      hasPrevPage: backendPagination.currentPage > 1
    };

    return { data: response.data, pagination };
  },

  // --- Posts ---
  getPosts: async (page: number = 1, limit: number = 10, search: string = '', tag: string = ''): Promise<{ data: BlogPost[], pagination: PaginationData }> => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) queryParams.append('q', search);
      if (tag) queryParams.append('tag', tag);

      const response = await fetchClient<PaginatedResponse<BlogPost>>(`/posts?${queryParams.toString()}`);
      
      let posts = response.data || [];
      // Filter out duplicate featured post if it comes from backend
      posts = posts.filter(p => p._id !== FEATURED_POST._id);

      // Inject Feature Post on Page 1 if no search query active (optional choice, keeping it simpler for now)
      // Only inject if no search query to avoid messing up search results
      if (page === 1 && !search && !tag) {
         posts = [FEATURED_POST, ...posts];
      }

      const backendPagination = response.pagination as any;
      const pagination: PaginationData = {
        currentPage: backendPagination.currentPage,
        totalPages: backendPagination.totalPages,
        totalItems: backendPagination.totalPosts || 0, // Backend sends totalPosts
        itemsPerPage: backendPagination.perPage || limit, // Backend sends perPage
        hasNextPage: backendPagination.currentPage < backendPagination.totalPages,
        hasPrevPage: backendPagination.currentPage > 1
      };

      return { data: posts, pagination };
    } catch (e) {
      console.warn('API unavailable, falling back to mock');
      return {
        data: [FEATURED_POST, ...MOCK_BLOGS],
        pagination: { 
          currentPage: 1, 
          totalPages: 1, 
          totalItems: MOCK_BLOGS.length + 1, 
          itemsPerPage: 10, 
          hasNextPage: false, 
          hasPrevPage: false 
        }
      };
    }
  },

  getPrivatePosts: async (page: number = 1, limit: number = 10, search: string = '', tag: string = ''): Promise<{ data: BlogPost[], pagination: PaginationData }> => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) queryParams.append('q', search);
      if (tag) queryParams.append('tag', tag);

      const response = await fetchClient<PaginatedResponse<BlogPost>>(`/posts/private/posts?${queryParams.toString()}`);
      
      const backendPagination = response.pagination as any;
      const pagination: PaginationData = {
        currentPage: backendPagination.currentPage,
        totalPages: backendPagination.totalPages,
        totalItems: backendPagination.totalPosts || 0,
        itemsPerPage: backendPagination.perPage || limit,
        hasNextPage: backendPagination.currentPage < backendPagination.totalPages,
        hasPrevPage: backendPagination.currentPage > 1
      };

      return { data: response.data, pagination };
    } catch (error) {
      console.error("Failed to fetch private blogs (safely handled):", error);
      return {
        data: [],
        pagination: { 
          currentPage: 1, 
          totalPages: 1, 
          totalItems: 0, 
          itemsPerPage: limit, 
          hasNextPage: false, 
          hasPrevPage: false 
        }
      };
    }
  },

  getPostById: async (id: string): Promise<BlogPost | undefined> => {
    if (id === FEATURED_POST._id) return FEATURED_POST;
    try {
      const result = await fetchClient<BlogPost[]>(`/posts/${id}`);
      return result[0];
    } catch (e) {
      return [FEATURED_POST, ...MOCK_BLOGS].find(b => b._id === id);
    }
  },

  createPost: async (postData: any): Promise<void> => {
    await fetchClient('/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
    toast.success('Entry successfully logged.');
  },
  
  updatePost: async (id: string, postData: any): Promise<void> => {
    await fetchClient(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData)
    });
    toast.success('Entry successfully updated.');
  },

  deletePost: async (id: string, secretKey?: string): Promise<void> => {
    const options: RequestInit = { method: 'DELETE' };
    if (secretKey) {
      options.body = JSON.stringify({ secretKey });
    }
    await fetchClient(`/posts/${id}`, options);
    toast.success('Log deleted successfully.');
  },

  likePost: async (id: string): Promise<void> => {
    if (id === FEATURED_POST._id) return;
    await fetchClient(`/posts/likes/${id}/add`, { method: 'POST' });
  },

  unlikePost: async (id: string): Promise<void> => {
    if (id === FEATURED_POST._id) return;
    await fetchClient(`/posts/likes/${id}/remove`, { method: 'POST' });
  },

  // --- Photos ---
  getPhotos: async (): Promise<Photo[]> => {
    try {
      return await fetchClient<Photo[]>('/photos');
    } catch (e) {
      // Fallback if endpoint is not ready
      return [];
    }
  },

  addPhoto: async (fileOrUrl: File | string, name: string, date?: string): Promise<Photo[]> => {
    let url = '';
    if (typeof fileOrUrl !== 'string') {
      try {
        // PRIORITY: Cloudinary Upload
        url = await uploadToCloudinary(fileOrUrl);
      } catch (e) {
        console.warn('Cloudinary upload failed, falling back to compression:', e);
        try {
          // BACKUP: Compressed Base64
          url = await compressImage(fileOrUrl);
          toast.info('Using local compression fallback.');
        } catch (compressError) {
           // LAST RESORT: Raw Base64
           console.error('Compression failed:', compressError);
           url = await fileToBase64(fileOrUrl);
        }
      }
    } else {
      url = fileOrUrl;
    }
    
    // Calls POST /api/photos
    // CHANGED: Use createdDate instead of date for backend compatibility
    const res = await fetchClient<Photo[]>('/photos', {
      method: 'POST',
      body: JSON.stringify({ url, name, createdDate: date }) 
    });
    return res;
  },

  updatePhoto: async (id: string, name?: string, fileOrUrl?: File | string, date?: string): Promise<Photo[]> => {
    const payload: any = {};
    if (name) payload.name = name;
    // CHANGED: Use createdDate instead of date for backend compatibility
    if (date) payload.createdDate = date; 
    
    if (fileOrUrl) {
      if (typeof fileOrUrl !== 'string') {
        try {
           payload.url = await uploadToCloudinary(fileOrUrl);
        } catch (e) {
           console.warn('Cloudinary upload failed (update), falling back:', e);
           try {
             payload.url = await compressImage(fileOrUrl);
             toast.info('Using local compression fallback.');
           } catch (compressError) {
             payload.url = await fileToBase64(fileOrUrl);
           }
        }
      } else {
        payload.url = fileOrUrl;
      }
    }

    // Calls PUT /api/photos/:id
    const res = await fetchClient<Photo[]>(`/photos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    toast.success('Photo updated successfully');
    return res;
  },

  reorderPhotos: async (newOrderIds: string[]): Promise<Photo[]> => {
    return await fetchClient<Photo[]>('/photos/reorder', {
      method: 'PUT',
      body: JSON.stringify({ newOrderIds })
    });
  },

  deletePhoto: async (id: string): Promise<Photo[]> => {
    // Calls DELETE /api/photos/:id
    const res = await fetchClient<Photo[]>(`/photos/${id}`, {
      method: 'DELETE'
    });
    toast.success('Photo removed');
    return res;
  },

  // Kept for backward compatibility if needed, redirects to addPhoto
  uploadPhoto: async (file: File, caption: string, location?: string): Promise<Photo> => {
    const photos = await apiService.addPhoto(file, caption);
    return photos[0]; // Return the first one for compatibility
  },

  // --- Comments ---
  getComments: async (postId: string): Promise<Comment[]> => {
    try {
      const response = await fetchClient<any>(`/comments/${postId}`);
      if (Array.isArray(response)) return response;
      if (response && Array.isArray(response.data)) return response.data;
      return [];
    } catch (error: any) {
      if (error.message && (error.message.includes('Not found') || error.message.includes('404'))) {
        return [];
      }
      return [];
    }
  },

  addComment: async (postId: string, user: User, comment: string, photoURL?: string): Promise<Comment[]> => {
    const res = await fetchClient<any>(`/comments/${postId}?user_id=${user._id}`, {
      method: 'POST',
      body: JSON.stringify({ user, comment, photoURL })
    });
    toast.success('Message transmitted.');
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    // If backend returns a single object or something else, default to [] or trust caller to refetch
    return Array.isArray(res) ? res : [];
  },

  getReplies: async (commentId: string): Promise<Comment[]> => {
    const res = await fetchClient<any>(`/comments/reply/${commentId}`);
    return Array.isArray(res) ? res : [];
  },

  addReply: async (commentId: string, user: User, reply: string, targetUser: any, photoURL?: string): Promise<Comment[]> => {
    const res = await fetchClient<any>(`/comments/reply/${commentId}`, {
      method: 'POST',
      body: JSON.stringify({ user, reply, photoURL, targetUser })
    });
    toast.success('Reply transmitted.');
    return Array.isArray(res) ? res : [];
  },

  // --- Chat ---
  getPublicChatHistory: async (roomName: string): Promise<ChatMessage[]> => {
    try {
      const res = await fetchClient<any[]>(`/chat/public/${roomName}`);
      return res.map(msg => ({
        message: msg.content || msg.message, // Use content
        author: msg.user?.name || msg.user?.displayName || 'Unknown',
        userId: msg.user?.id || msg.user?._id,
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
      return res.map(msg => ({
        message: msg.content || msg.message, // Use content
        author: msg.user?.name || msg.user?.displayName || 'Unknown',
        userId: msg.user?.id || msg.user?._id,
        timestamp: msg.createdDate || msg.date,
        isPrivate: true,
        receiver: msg.toUser 
      }));
    } catch (e) {
      console.warn("Private chat history fetch failed", e);
      return [];
    }
  },

  // --- Todos ---
  getTodos: async (): Promise<Todo[]> => {
    try {
      return await fetchClient<Todo[]>('/todo');
    } catch (e) {
       return [];
    }
  },

  addTodo: async (todo: string): Promise<Todo[]> => {
    try {
      const res = await fetchClient<Todo[]>('/todo', {
        method: 'POST',
        body: JSON.stringify({ todo })
      });
      toast.success('Task added.');
      return res;
    } catch (e) {
      throw e;
    }
  },

  toggleTodo: async (id: string): Promise<Todo[]> => {
    try {
      return await fetchClient<Todo[]>(`/todo/done/${id}`, {
        method: 'POST'
      });
    } catch (e) {
      throw e;
    }
  },

  // --- Homepage & Projects ---
  getProjects: async (): Promise<Project[]> => {
    return await fetchClient<Project[]>('/home/projects');
  },

  getLogs: async (): Promise<Log[]> => {
    return await fetchClient<Log[]>('/home/logs');
  },

  getHomeLikes: async (): Promise<any> => {
    return await fetchClient('/home/likes');
  },

  // --- Resume ---
  getResume: async (): Promise<ResumeItem[]> => {
    return await fetchClient<ResumeItem[]>('/resume');
  },

  // --- Fitness ---
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
  }
};
