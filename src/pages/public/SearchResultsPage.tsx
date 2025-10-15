import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types";
import MovieCard from "@/components/public/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q");

  const { data: movies, isLoading, error } = useQuery({
    queryKey: ["search_movies", query],
    queryFn: async () => {
      if (!query) return [];
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .ilike("title", `%${query}%`) // Case-insensitive search
        .eq("status", "active");
      if (error) throw new Error(error.message);
      return data as Movie[];
    },
    enabled: !!query,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Kembali</span>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold truncate">
          Hasil Pencarian: <span className="text-primary">"{query}"</span>
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

      {error && <p className="text-center text-red-500">Gagal memuat hasil pencarian.</p>}

      {!isLoading && movies && (
        <>
          {movies.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <h2 className="text-2xl font-semibold">Tidak Ada Hasil</h2>
              <p className="mt-2 text-muted-foreground">
                Kami tidak dapat menemukan film yang cocok dengan pencarian Anda. Coba kata kunci lain.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResultsPage;