import apiClient from './apiClient';

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UserData {
  email: string;
  username: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post('/api/v1/auth/login', { email, password });
  return response.data;
};

export const register = async (username: string, email: string, password: string): Promise<LoginResponse> => {
  const response = await apiClient.post('/api/v1/auth/register', { username, email, password });
  return response.data;
};

export const getCurrentUser = async (): Promise<UserData> => {
  const response = await apiClient.get('/api/v1/auth/me');
  return response.data;
};