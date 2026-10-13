import { request } from './api';
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  SendVerificationCodeResponse,
  User
} from '../types/auth';

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    localStorage.setItem('rentcar_token', res.accessToken);
    localStorage.setItem('rentcar_user', JSON.stringify(res.user));
    return res;
  },

  async sendVerificationCode(email: string, purpose: string = 'Register'): Promise<SendVerificationCodeResponse> {
    return await request<SendVerificationCodeResponse>('/auth/send-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email, purpose })
    });
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    localStorage.setItem('rentcar_token', res.accessToken);
    localStorage.setItem('rentcar_user', JSON.stringify(res.user));
    return res;
  },

  async getCurrentUser(): Promise<User> {
    return await request<User>('/users/me');
  },

  logout(): void {
    localStorage.removeItem('rentcar_token');
    localStorage.removeItem('rentcar_user');
  },

  getSavedUser(): User | null {
    const data = localStorage.getItem('rentcar_user');
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('rentcar_token');
  }
};
