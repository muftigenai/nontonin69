import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import GenreSection from "@/components/public/GenreSection";
import { useAuth } from "@/providers/AuthProvider";
import {
  Flame,
  Sparkles,
  Swords,
  Heart,
  Laugh,
  Ghost,
  Gem,
  Star,
} from "lucide-react";
import { useMemo } from "react";

const genres = [
  { name: "Aksi", icon: Swords, key: "aksi" },
  { name: "Romantis", icon: Heart, key: "romantis" },
  { name: "Komedi", icon: Laugh, key: "komedi" },
  { name: "Horor", icon: Ghost, key: "horor" },
];

const CategoriesPage = () => {
  const { user } = useAuth();

  const { data: movies, isLoading: isLoadingMovies, error } = useQuery({
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

  const { data: watchHistory, isLoading: isLoadingWatchHistory } = useQuery({
    queryKey: ["watch_history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("watch_history")
        .select("movies(*)")
        .eq("user_id", user.id)
        .order("watched_at", { ascending: false })
        .limit(12);
      if (error) throw new Error(error.message);
      return data.map((item: any) => item.movies).filter(Boolean) as Movie[];
    },
    enabled: !!user,
  });

  const trendingMovies = useMemo(() => movies?.slice(0, 12) || [], [movies]);
  const newMovies = useMemo(() => movies?.slice(0, 12) || [], [movies]);
  const premiumMovies = useMemo(() => movies?.filter(m => m.access_type === 'premium') || [], [movies]);
  
  const getMoviesByGenre = (genreKey: string) => {
    return movies?.filter((movie) => movie.genre?.toLowerCase().includes(genreKey)) || [];
  };

  const renderSkeletons = () => (
    <div className="space-y-12">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-8 w-56" />
          <div className="mt-4 flex space-x-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="w-1/2 flex-shrink-0 sm:w-1/3 md:w-1/4 lg:w-1/5 xl:w-1/6">
                <Skeleton className="aspect-[2/3] w-full" />
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
        <h1 className="text-4xl font-bold tracking-tight">Jelajahi Kategori Film</h1>
        <p className="text-muted-foreground mt-2">Temukan film berdasarkan kategori yang Anda sukai.</p>
      </div>

      {error && <p className="text-red-500">Gagal memuat film: {error.message}</p>}
      {isLoadingMovies && renderSkeletons()}

      {!isLoadingMovies && movies && (
        <>
          {user && !isLoadingWatchHistory && watchHistory && watchHistory.length > 0 && (
            <GenreSection
              title="⭐ Rekomendasi Untukmu"
              icon={Star}
              movies={watchHistory}
              genreKey="rekomendasi"
            />
          )}

          <GenreSection
            title="🔥 Trending Sekarang"
            icon={Flame}
            movies={trendingMovies}
            genreKey="trending"
          />

          <GenreSection
            title="🆕 Film Terbaru"
            icon={Sparkles}
            movies={newMovies}
            genreKey="terbaru"
          />
          
          <GenreSection
            title="💰 Film Premium"
            icon={Gem}
            movies={premiumMovies}
            genreKey="premium"
          />

          <div>
            <h2 className="text-3xl font-bold mb-4">🎭 Berdasarkan Genre</h2>
            <div className="space-y-12">
              {genres.map((genre) => (
                <GenreSection
                  key={genre.key}
                  title={genre.name}
                  icon={genre.icon}
                  movies={getMoviesByGenre(genre.key)}
                  genreKey={genre.key}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoriesPage;