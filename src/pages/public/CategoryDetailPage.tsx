import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types";
import MovieCard from "@/components/public/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider"; // Import useAuth

const categoryTitles: { [key: string]: string } = {
  trending: "Trending Sekarang",
  newly_uploaded: "Baru Diunggah",
  aksi: "Aksi",
  drama: "Drama",
  komedi: "Komedi",
  romantis: "Romantis",
  horor: "Horor",
  "fiksi ilmiah": "Fiksi Ilmiah",
  dokumenter: "Dokumenter",
  keluarga: "Keluarga",
  premium: "Film Premium",
  "recently-watched": "Baru Saja Ditonton",
  rekomendasi: "Rekomendasi Untukmu", // Tambahkan ini juga
};

const CategoryDetailPage = () => {
  const { genreKey } = useParams<{ genreKey: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // Gunakan useAuth

  // Query untuk semua film aktif (digunakan untuk genre umum)
  const { data: allMovies, isLoading: isLoadingAllMovies, error: errorAllMovies } = useQuery({
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

  // Query untuk riwayat tontonan (digunakan untuk "recently-watched")
  const { data: watchHistory, isLoading: isLoadingWatchHistory } = useQuery({
    queryKey: ["watch_history_full", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("watch_history")
        .select("movies(*)")
        .eq("user_id", user.id)
        .order("watched_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data.map((item: any) => item.movies).filter(Boolean) as Movie[];
    },
    enabled: !!user && genreKey === "recently-watched",
  });

  const { filteredMovies, isLoading } = useMemo(() => {
    if (genreKey === "recently-watched") {
      return { filteredMovies: watchHistory || [], isLoading: isLoadingWatchHistory };
    }

    const movies = allMovies || [];
    let filtered: Movie[] = [];

    switch (genreKey) {
      case "trending":
      case "newly_uploaded":
        filtered = movies;
        break;
      case "premium":
        filtered = movies.filter(m => m.access_type === 'premium');
        break;
      default:
        filtered = movies.filter((movie) =>
          movie.genre?.toLowerCase().includes(genreKey?.toLowerCase() || "")
        );
        break;
    }
    return { filteredMovies: filtered, isLoading: isLoadingAllMovies };
  }, [allMovies, watchHistory, genreKey, isLoadingAllMovies, isLoadingWatchHistory]);

  const pageTitle = genreKey ? categoryTitles[genreKey] || genreKey.charAt(0).toUpperCase() + genreKey.slice(1) : "Kategori";

  if (errorAllMovies) {
    return <p className="text-center text-red-500">Gagal memuat film: {errorAllMovies.message}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Kembali</span>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold truncate">
          Kategori: <span className="text-primary">{pageTitle}</span>
        </h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {filteredMovies.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <h2 className="text-2xl font-semibold">Tidak Ada Film</h2>
              <p className="mt-2 text-muted-foreground">
                Belum ada film yang tersedia untuk kategori ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {filteredMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryDetailPage;