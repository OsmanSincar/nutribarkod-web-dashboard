const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

type ApiSuccess<T> = T & {
  status: 'success';
  message?: string;
  detail?: unknown;
};

type ApiError = {
  status: 'error';
  message: string;
  detail?: unknown;
};

type ApiResult<T> = ApiSuccess<T> | ApiError;

interface AuthCondition {
  id?: string | number;
  title: string;
  type?: string;
}

interface AuthResponse {
  user_id: number;
  full_name: string;
  age?: string;
  height?: string;
  weight?: string;
  gender?: string;
  goal?: string;
  conditions?: AuthCondition[];
}

interface AnalyzeResponse {
  [key: string]: unknown;
  product_name?: string;
  productName?: string;
  ingredients?: string;
  ai_comment?: string;
  aiComment?: string;
  score?: number;
  nutriScore?: string;
  calories?: string | number;
  sugar?: string | number;
  protein?: string | number;
  fat?: string | number;
  image_url?: string;
  imageUrl?: string;
  brand?: string;
  missingFields?: string[];
  infoQuality?: string;
}

interface HistoryResponse {
  history: unknown[];
}

interface BasicSuccessResponse {
  [key: string]: unknown;
}

function getErrorMessage(
  data: { detail?: unknown; message?: unknown },
  fallbackMessage: string
) {
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    const firstError = data.detail[0] as { msg?: unknown };
    if (typeof firstError.msg === 'string') return firstError.msg;
  }
  if (typeof data.message === 'string') return data.message;
  return fallbackMessage;
}

async function requestJson<T>(
  url: string,
  init?: RequestInit,
  fallbackMessage = 'Sunucuya bağlanılamadı.'
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, init);
    const data = (await response.json().catch(() => ({}))) as Partial<
      ApiSuccess<T>
    > & { detail?: unknown; message?: unknown };

    if (!response.ok) {
      return {
        status: 'error',
        detail: data.detail,
        message: getErrorMessage(data, fallbackMessage),
      };
    }

    return {
      ...data,
      status: 'success',
    } as ApiSuccess<T>;
  } catch {
    return {
      status: 'error',
      message: fallbackMessage,
    };
  }
}

export const registerUser = async (
  fullName: string,
  email: string,
  password: string
) => {
  return requestJson<AuthResponse>(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, password }),
  });
};

export const loginUser = async (email: string, password: string) => {
  return requestJson<AuthResponse>(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName: '' }),
  });
};

export const analyzeBarcode = async (userId: number, barcode: string) => {
  return requestJson<AnalyzeResponse>(
    `${API_BASE_URL}/api/analyze`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, barcode }),
    },
    'Python sunucusuna bağlanılamadı.'
  );
};

export const getHistory = async (userId: number) => {
  return requestJson<HistoryResponse>(
    `${API_BASE_URL}/api/user/history/${userId}`
  );
};

export const deleteHistoryItem = async (
  userId: number,
  historyId: string | number
) => {
  return requestJson<BasicSuccessResponse>(
    `${API_BASE_URL}/api/user/history/${userId}/${encodeURIComponent(String(historyId))}`,
    { method: 'DELETE' },
    'Geçmiş kaydı silinemedi.'
  );
};

export const syncConditionsToBackend = async (
  userId: number | null,
  conditions: { title: string; type?: string }[]
) => {
  if (!userId) return { status: 'error', message: 'Kullanıcı bulunamadı.' };

  return requestJson<BasicSuccessResponse>(
    `${API_BASE_URL}/api/user/sync-conditions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        conditions: conditions.map((condition) => ({
          title: condition.title,
          type: condition.type || 'general',
        })),
      }),
    }
  );
};

export const updatePersonalInfo = async (
  userId: number,
  info: {
    age?: string;
    height?: string;
    weight?: string;
    gender?: string;
  }
) => {
  return requestJson<BasicSuccessResponse>(
    `${API_BASE_URL}/api/user/personal-info`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ...info }),
    }
  );
};

export const updatePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
) => {
  return requestJson<BasicSuccessResponse>(
    `${API_BASE_URL}/api/user/update-password`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        current_password: currentPassword,
        new_password: newPassword,
      }),
    }
  );
};
