import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 30000, // 30s default — generous for normal API calls
  headers: { 'Content-Type': 'application/json' },
});

// Hunt generation involves Overpass + ORS + Weather — give it more time
api.interceptors.request.use(async (config) => {
  if (config.url?.includes('/hunts/generate')) {
    config.timeout = 90000; // 90 seconds for generation
  }
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.isTimeout = true;
        error.userMessage = 'Request timed out. Please check your internet connection.';
      } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        error.isNetworkError = true;
        error.userMessage = 'No internet connection. Please check your network settings.';
      } else {
        error.isNetworkError = true;
        error.userMessage = 'Connection failed. Please check your internet connection.';
      }
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const { data } = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'}/auth/refresh`,
          { refreshToken },
        );
        await SecureStore.setItemAsync('accessToken', data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        // Will redirect to login via auth state change
      }
    }
    return Promise.reject(error);
  },
);

export default api;
