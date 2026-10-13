export interface User {
  userId: string;
  name: string;
  email: string;
  role: 'Customer' | 'Admin';
  status: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  verificationCode: string;
}

export interface SendVerificationCodeResponse {
  message: string;
  email: string;
  simulatedCode?: string;
  expiresInSeconds: number;
}
