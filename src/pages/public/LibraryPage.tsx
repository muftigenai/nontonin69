import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Movie } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import LibraryMovieCard from "@/components/public/LibraryMovieCard";
import { Clapperboard, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

type FilterType = "all" | "free" | "premium";

const LibraryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");

  const { data: libraryMovies, isLoading } = useQuery({
    queryKey: ["library", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Menggunakan riwayat tonton sebagai dasar untuk koleksi
      const { data, error } = await supabase
        .from("watch_history")
        .select("movies(*)")
        .eq("user_id", user.id)
        .order("watched_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data.map((item: any) => item.movies).filter(Boolean) as Movie[];
    },
    enabled: !!user,
  });

  const filteredMovies = useMemo(() => {
    if (!libraryMovies) return [];
    if (filter === "all") return libraryMovies;
    return libraryMovies.filter((movie) => movie.access_type === filter);
  }, [libraryMovies, filter]);

  const renderSkeletons = () => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[2/3] w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
    </div>
  );

  if (!user) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-2xl font-semibold">Silakan Login</h2>
        <p className="mt-2 text-muted-foreground">Anda harus login untuk melihat koleksi film Anda.</p>
        <Button asChild className="mt-4">
          <Link to="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Kembali</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Koleksi Saya</h1>
          <p className="mt-2 text-muted-foreground">Semua film yang sudah Anda tonton atau beli.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          Semua
        </Button>
        <Button variant={filter === "free" ? "default" : "outline"} onClick={() => setFilter("free")}>
          Gratis
        </Button>
        <Button variant={filter === "premium" ? "default" : "outline"} onClick={() => setFilter("premium")}>
          Premium
        </Button>
      </div>

      {isLoading && renderSkeletons()}

      {!isLoading && filteredMovies && (
        <>
          {filteredMovies.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Clapperboard className="h-16 w-16 text-muted-foreground" />
              <h2 className="mt-4 text-2xl font-semibold">Koleksi Anda Kosong</h2>
              <p className="mt-2 text-muted-foreground">
                {filter === "all"
                  ? "Mulai tonton film untuk menambahkannya ke koleksi."
                  : `Anda tidak memiliki film ${filter} di koleksi.`}
              </p>
              <Button asChild variant="secondary" className="mt-4">
                <Link to="/">Jelajahi Film</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {filteredMovies.map((movie) => (
                <LibraryMovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LibraryPage;