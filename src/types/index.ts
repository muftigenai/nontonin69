export type Movie = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  release_date: string | null;
  trailer_url: string | null;
  video_url: string | null;
  genre: string | null;
  duration: number | null;
  price: number | null;
  status: "active" | "inactive" | null;
  subtitle_url: string | null;
  access_type: "free" | "premium";
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

export type Transaction = {
  id: string;
  created_at: string;
  description: string | null;
  payment_method: string | null;
  amount: number;
  status: "successful" | "pending" | "failed";
  user_id: string | null; // Ditambahkan
  user_details: {
    email: string | null;
    full_name: string | null;
    subscription_status: string | null; // Ditambahkan
  } | null;
  movies: {
    title: string | null;
  } | null;
  // movie_id dihapus karena PPV dihapus
};

export type Review = {
  id: string;
  created_at: string;
  rating: number;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};