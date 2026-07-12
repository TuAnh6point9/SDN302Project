import axios from 'axios';
import Constants from 'expo-constants';

// Tự suy ra LAN IP của máy dev từ Expo host (điện thoại không thấy localhost).
// Override bằng biến môi trường khi cần: EXPO_PUBLIC_API_URL=http://192.168.1.10:5000
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:5000` : 'http://localhost:5000';
}

export const API_BASE_URL = resolveBaseUrl();

// Ảnh upload lưu dạng đường dẫn tương đối "/uploads/..." trên backend
export function resolveImageUrl(path?: string): string | undefined {
  if (!path) return undefined;
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// AsyncStorage là async nên giữ token trong biến module, AuthContext set khi login/khởi động
let authToken: string | null = null;
export function setAuthToken(token: string | null) {
  authToken = token;
}

apiClient.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}

export default apiClient;
