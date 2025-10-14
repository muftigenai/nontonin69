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