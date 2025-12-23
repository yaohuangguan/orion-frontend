import { toast } from '../components/Toast';

// 1. 定义硬编码的远程地址 (仅作为兜底)
const FALLBACK_REMOTE_API = 'https://bananaboom-api-242273127238.asia-east1.run.app/api';

// 2. ✅ 恢复导出 API_BASE_URL 常量 (供外部引用，保持兼容)
// 逻辑：优先相信环境变量，没有则用远程兜底
export const API_BASE_URL = import.meta.env.VITE_API_URL || FALLBACK_REMOTE_API;

// 3. 定义内部使用的动态地址 (初始值等于配置值)
let activeBaseUrl = API_BASE_URL;

console.log(`🚀 Configured API: ${API_BASE_URL}`);

/**
 * Native fetch wrapper with Auto-Failover
 */
export async function fetchClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000);

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = localStorage.getItem('auth_token');
    if (token) (headers as any)['x-auth-token'] = token;

    const googleInfo = localStorage.getItem('googleInfo');
    if (googleInfo) (headers as any)['x-google-auth'] = googleInfo;

    // 🔥 这里使用 activeBaseUrl (可能是本地，也可能是切换后的远程)
    const response = await fetch(`${activeBaseUrl}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers
    });
    clearTimeout(id);

    // --- 标准错误处理 ---
    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `API Error ${response.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.msg || errorJson.message || errorJson.error || errorMessage;
      } catch (e) {
        if (errorBody) errorMessage = errorBody;
      }

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('googleInfo');
        window.dispatchEvent(new Event('auth:logout'));
        const displayMsg =
          errorMessage !== `API Error 401` ? errorMessage : 'Session expired. Please login again.';
        toast.error(displayMsg);
        throw new Error(displayMsg);
      }

      if (response.status === 403) {
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (response.status === 204) return {} as T;
    return await response.json();
  } catch (error: any) {
    clearTimeout(id);

    // ============================================================
    // 🔥 核心逻辑：自动切换
    // ============================================================
    const isNetworkError =
      error.message === 'Failed to fetch' || error.message.includes('NetworkError');
    const isUsingLocalhost =
      activeBaseUrl.includes('localhost') || activeBaseUrl.includes('127.0.0.1');

    // 如果连本地失败了，切远程
    if (isNetworkError && isUsingLocalhost) {
      console.warn('⚠️ Localhost unavailable. Failover to Remote API.');

      // 修改内部变量，下次请求直接走远程
      activeBaseUrl = FALLBACK_REMOTE_API;

      toast.error('本地后端未响应，已自动切换至远程 API ☁️');

      // 递归重试
      return fetchClient<T>(endpoint, options);
    }
    // ============================================================

    if (error.name === 'AbortError') {
      const msg = 'Request timed out.';
      toast.error(msg);
      throw new Error(msg);
    }

    if (isNetworkError) {
      const msg = 'Network connection error. Please check your internet.';
      toast.error(msg);
      throw new Error(msg);
    }

    throw error;
  }
}
