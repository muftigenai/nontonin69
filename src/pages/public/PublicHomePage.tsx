import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types";
import MovieCard from "@/components/public/MovieCard";
import { Skeleton } from "@/components/ui/skeleton";

const PublicHomePage = () => {
  const { data: movies, isLoading, error } = useQuery({
    queryKey: ["public_movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("status", "active")
        .order("release_date", { ascending: false });
      if (error) throw new Error(error.message);
      return data as Movie[];
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Selamat Datang di Nontonin</h1>
        <p className="text-muted-foreground">Temukan film favoritmu di sini.</p>
      </div>

      {error && <p className="text-red-500">Gagal memuat film: {error.message}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {isLoading
          ? Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="aspect-[2/3] w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          : movies?.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
      </div>
      {movies?.length === 0 && !isLoading && (
        <div className="text-center py-12">
            <p className="text-muted-foreground">Belum ada film yang tersedia.</p>
        </div>
      )}
    </div>
  );
};

export default PublicHomePage;