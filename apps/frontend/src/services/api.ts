export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

const BASE_URL = '/api/v1';

// Access token chỉ sống ~15 phút. Khi hết hạn, tự dùng refresh token để xin token mới (1 lần),
// rồi gọi lại yêu cầu cũ. Nhờ vậy người dùng không bị "văng" lỗi sau 15 phút.
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('sf_refresh');
  if (!refreshToken) return false;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) return false;
        const json = await res.json();
        const tokens = json?.data?.tokens;
        if (!tokens?.access_token) return false;
        localStorage.setItem('sf_token', tokens.access_token);
        if (tokens.refresh_token) localStorage.setItem('sf_refresh', tokens.refresh_token);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

function expireSession() {
  localStorage.removeItem('sf_token');
  localStorage.removeItem('sf_refresh');
  localStorage.removeItem('sf_user');
  window.dispatchEvent(new Event('sf:auth-expired'));
}

export const apiClient = {
  async request<T>(endpoint: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
    const { params, headers, ...restOptions } = options;

    let url = `${BASE_URL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const token = localStorage.getItem('sf_token');
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        ...restOptions,
        headers: defaultHeaders,
      });

      // 401: thử làm mới token một lần rồi gọi lại. Không áp dụng cho chính các API đăng nhập/làm mới.
      if (response.status === 401 && !isRetry && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register') && !endpoint.startsWith('/auth/refresh')) {
        if (await tryRefreshToken()) {
          return this.request<T>(endpoint, options, true);
        }
        expireSession();
      }

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const data = isJson ? await response.json() : null;

      if (!response.ok) {
        const errorData = data as ApiErrorResponse | null;
        throw new ApiClientError(
          errorData?.error?.message || `Yêu cầu thất bại với mã lỗi HTTP ${response.status}`,
          response.status,
          errorData?.error?.code || 'UNKNOWN_ERROR',
          errorData?.error?.details
        );
      }

      return data as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw err;
      }
      if (err instanceof ApiClientError) {
        throw err;
      }
      throw new ApiClientError(
        err.message || 'Mất kết nối tới máy chủ ShopFlow API',
        0,
        'NETWORK_ERROR'
      );
    }
  },

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

export default apiClient;

