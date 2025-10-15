import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types";
import MovieCard from "@/components/public/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";

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
};

const CategoryDetailPage = () => {
  const { genreKey } = useParams<{ genreKey: string }>();
  const navigate = useNavigate();

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

  const filteredMovies = useMemo(() => {
    if (!movies || !genreKey) return [];
    
    switch (genreKey) {
      case "trending":
      case "newly_uploaded":
        return movies; // For simplicity, show all movies as they are already sorted by new
      case "premium":
        return movies.filter(m => m.access_type === 'premium');
      // "recently-watched" would require a separate query, not handled here for now.
      default:
        return movies.filter((movie) =>
          movie.genre?.toLowerCase().includes(genreKey.toLowerCase())
        );
    }
  }, [movies, genreKey]);

  const pageTitle = genreKey ? categoryTitles[genreKey] || genreKey.charAt(0).toUpperCase() + genreKey.slice(1) : "Kategori";

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

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-center text-red-500">Gagal memuat film.</p>}

      {!isLoading && filteredMovies && (
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