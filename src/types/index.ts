export interface UserDetails {
  id: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
  role?: 'admin' | 'user';
}