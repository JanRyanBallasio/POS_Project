import axios from '@/lib/axios';

// Simplified user functions without authentication

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  fullname: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  data: {
    id: number;
    name: string;
    username: string;
    position_id?: number;
  };
}

// Mock login function - no actual API call since auth is disabled
export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  // Simulate successful login without API call
  return {
    success: true,
    accessToken: 'no-auth-token',
    data: {
      id: 1,
      name: 'YZY User',
      username: credentials.username,
    }
  };
};

// Mock register function - no actual API call since auth is disabled
export const registerUser = async (data: RegisterData): Promise<void> => {
  // Simulate successful registration without API call
  console.log('Registration simulated for:', data.username);
};

// Mock logout function - no actual API call since auth is disabled
export const logoutUser = async (): Promise<void> => {
  // Just clear local storage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  }
};