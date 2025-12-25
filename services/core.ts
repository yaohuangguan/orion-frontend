import { toast } from '../components/Toast';

// ==================================================================================
// 1. API 地址配置逻辑
// ==================================================================================

// 定义硬编码的远程地址 (仅作为最后的兜底，防止环境变量彻底丢失)
const FALLBACK_REMOTE_API = 'https://bananaboom-api-242273127238.asia-east1.run.app/api';

/**
 * 核心逻辑：
 * 1. 优先读取启动命令或 .env 文件传入的 VITE_API_URL。
 * - 如果你运行 npm run dev:local，这里就是 http://localhost:5000/api
 * - 如果你运行 npm run dev，这里通常是 .env 里的线上地址
 * 2. 如果没有环境变量，则使用 FALLBACK_REMOTE_API 兜底。
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || FALLBACK_REMOTE_API;

console.log(`🚀 Current API Target: ${API_BASE_URL}`);

// ==================================================================================
// 2. Fetch 封装
// ==================================================================================

/**
 * 通用的 Fetch 客户端封装
 * 包含：超时控制、自动 Token 注入、统一错误处理、401 自动登出
 */
export async function fetchClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // 设置超时控制器 (15秒超时)
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000);

  try {
    // 组装 Headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // 自动注入 Auth Token
    const token = localStorage.getItem('auth_token');
    if (token) (headers as any)['x-auth-token'] = token;

    // 自动注入 Google Auth Info (如果有)
    const googleInfo = localStorage.getItem('googleInfo');
    if (googleInfo) (headers as any)['x-google-auth'] = googleInfo;

    // 🔥 发起请求：直接使用确定的 API_BASE_URL
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers
    });

    clearTimeout(id); // 请求成功返回，清除超时定时器

    // --- 标准错误处理 (处理非 2xx 响应) ---
    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `API Error ${response.status}`;

      // 尝试解析后端返回的 JSON 错误信息
      try {
        const errorJson = JSON.parse(errorBody);
        // 兼容不同的错误字段名 (msg, message, error)
        errorMessage = errorJson.msg || errorJson.message || errorJson.error || errorMessage;
      } catch (e) {
        // 如果不是 JSON，直接显示文本
        if (errorBody) errorMessage = errorBody;
      }

      // 特殊状态码处理：401 未授权 (Token 过期或无效)
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('googleInfo');
        // 触发全局事件，让 UI (如 Header) 更新状态
        window.dispatchEvent(new Event('auth:logout'));

        const displayMsg =
          errorMessage !== `API Error 401` ? errorMessage : 'Session expired. Please login again.';

        toast.error(displayMsg);
        throw new Error(displayMsg);
      }

      // 特殊状态码处理：403 无权限
      if (response.status === 403) {
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      // 其他错误直接抛出
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    // --- 成功处理 ---
    // 204 No Content 返回空对象
    if (response.status === 204) return {} as T;

    // 正常返回 JSON
    return await response.json();
  } catch (error: any) {
    clearTimeout(id); // 确保发生异常时也清除定时器

    // --- 网络层面的错误处理 ---

    // 1. 请求超时
    if (error.name === 'AbortError') {
      const msg = 'Request timed out. Server is taking too long.';
      toast.error(msg);
      throw new Error(msg);
    }

    // 2. 网络断开或无法连接服务器
    const isNetworkError =
      error.message === 'Failed to fetch' || error.message.includes('NetworkError');
    if (isNetworkError) {
      // 这里的提示更加明确，取决于当前连的是哪个环境
      const targetEnv = API_BASE_URL.includes('localhost') ? 'Localhost' : 'Remote Server';
      const msg = `Unable to connect to ${targetEnv}. Please check your connection or server status.`;

      console.error(`❌ Network Error connecting to: ${API_BASE_URL}`);
      toast.error(msg);
      throw new Error(msg);
    }

    // 3. 其他未知错误
    throw error;
  }
}
