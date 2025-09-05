import axios from '@/lib/axios';

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

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await axios.post('/auth/login', credentials);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const registerUser = async (data: RegisterData): Promise<void> => {
  try {
    await axios.post('/auth/register', {
      name: data.fullname, // Map fullname to name for backend
      username: data.username,
      password: data.password
    });
  } catch (error: any) {
    throw error; // Let component handle the error formatting
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await axios.post('/auth/logout');
  } catch (error) {
    console.warn('Logout request failed, clearing local data anyway');
  }
};