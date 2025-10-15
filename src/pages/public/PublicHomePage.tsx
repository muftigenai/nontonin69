import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import GenreSection from "@/components/public/GenreSection";
import {
  Flame,
  Swords,
  Drama,
  Laugh,
  Heart,
  Ghost,
  Rocket,
  Globe,
  Users,
  Sparkles,
} from "lucide-react";

const genres = [
  { name: "Trending Sekarang", icon: Flame, key: "trending" },
  { name: "Baru Diunggah", icon: Sparkles, key: "newly_uploaded" },
  { name: "Aksi", icon: Swords, key: "aksi" },
  { name: "Drama", icon: Drama, key: "drama" },
  { name: "Komedi", icon: Laugh, key: "komedi" },
  { name: "Romantis", icon: Heart, key: "romantis" },
  { name: "Horor", icon: Ghost, key: "horor" },
  { name: "Fiksi Ilmiah", icon: Rocket, key: "fiksi ilmiah" },
  { name: "Dokumenter", icon: Globe, key: "dokumenter" },
  { name: "Keluarga", icon: Users, key: "keluarga" },
];

const PublicHomePage = () => {
  const { data: movies, isLoading, error } = useQuery({
    queryKey: ["public_movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as Movie[];
    },
  });

  const getMoviesByGenre = (genreKey: string) => {
    if (!movies) return [];
    if (genreKey === "trending" || genreKey === "newly_uploaded") {
      return movies.slice(0, 10);
    }
    return movies.filter((movie) => movie.genre?.toLowerCase().includes(genreKey));
  };

  const renderSkeletons = () => (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-8 w-48" />
          <div className="mt-4 flex space-x-4">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="w-1/6 space-y-2">
                <Skeleton className="aspect-[2/3] w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Temukan Film Favoritmu</h1>
        <p className="text-muted-foreground mt-2">Jelajahi ribuan film dari berbagai genre.</p>
      </div>

      {error && <p className="text-red-500">Gagal memuat film: {error.message}</p>}
      {isLoading && renderSkeletons()}

      {!isLoading &&
        genres.map((genre) => (
          <GenreSection
            key={genre.key}
            title={genre.name}
            icon={genre.icon}
            movies={getMoviesByGenre(genre.key)}
            genreKey={genre.key}
          />
        ))}
      
      {movies?.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Belum ada film yang tersedia.</p>
        </div>
      )}
    </div>
  );
};

export default PublicHomePage;