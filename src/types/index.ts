export type Movie = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  release_date: string | null;
  trailer_url: string | null;
  genre: string | null;
  duration: number | null;
  price: number | null;
  status: "active" | "inactive" | null;
  subtitle_url: string | null;
};

export type UserDetails = {
  id: string;
  email?: string;
  created_at: string;
  role: string | null;
  full_name: string | null;
  avatar_url: string | null;
  subscription_status: string | null;
  status: string | null;
};