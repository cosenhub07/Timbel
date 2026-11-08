import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // In development with Expo, find the debugger host IP for real devices/emulators
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:5000`;
  }

  // Android emulator loopback fallback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return 'http://localhost:5000';
};

export const API_BASE_URL = getBaseUrl();

/**
 * Enhanced fetch wrapper for Timbel API
 */
export const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  // If body is not FormData, ensure Content-Type is json
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg = (typeof data === 'object' && data?.error) || response.statusText || 'Request failed';
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${options.method || 'GET'} ${url}:`, error.message);
    throw error;
  }
};

