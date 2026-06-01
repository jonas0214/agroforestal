export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'client';
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
