import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Tag, Star, PlayCircle, Ticket } from "lucide-react";
import MovieCard from "@/components/public/MovieCard";
import { Separator } from "@/components/ui/separator";

const MovieDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: movie, isLoading, error } = useQuery({
    queryKey: ["movie", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw new Error(error.message);
      return data as Movie;
    },
    enabled: !!id,
  });

  const { data: similarMovies, isLoading: isLoadingSimilar } = useQuery({
    queryKey: ["similarMovies", movie?.genre, id],
    queryFn: async () => {
      if (!movie?.genre) return [];
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("genre", movie.genre)
        .neq("id", id) // Exclude the current movie
        .limit(6);
      if (error) throw new Error(error.message);
      return data as Movie[];
    },
    enabled: !!movie?.genre,
  });

  const getYear = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).getFullYear();
  };

  const renderPlayer = (url: string) => {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
      return (
        <div className="aspect-video">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          ></iframe>
        </div>
      );
    }
    return (
        <video controls className="w-full aspect-video rounded-lg">
            <source src={url} type="video/mp4" />
            Browser Anda tidak mendukung tag video.
        </video>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Skeleton className="col-span-1 aspect-[2/3] w-full rounded-lg" />
          <div className="col-span-2 space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <div className="flex space-x-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">Gagal memuat detail film: {error.message}</div>;
  }

  if (!movie) {
    return <div className="text-center">Film tidak ditemukan.</div>;
  }

  return (
    <div className="space-y-12">
      <section className="grid grid-cols-1 items-start gap-8 md:grid-cols-3 lg:grid-cols-[1fr,2fr]">
        <img
          src={movie.poster_url || "https://placehold.co/400x600?text=No+Image"}
          alt={movie.title}
          className="aspect-[2/3] w-full rounded-lg object-cover"
        />
        <div className="md:col-span-2">
          <Badge variant={movie.access_type === 'premium' ? 'default' : 'secondary'}>
            {movie.access_type === 'premium' ? 'Premium' : 'Gratis'}
          </Badge>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">{movie.title}</h1>
          
          <div className="mt-4 flex flex-wrap items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{getYear(movie.release_date)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{movie.duration || "N/A"} menit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4" />
              <span>{movie.genre || "N/A"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
              <span>4.5</span>
            </div>
          </div>

          <p className="mt-6 text-lg leading-relaxed">{movie.description}</p>

          <div className="mt-8">
            {movie.access_type === 'free' ? (
              <Button size="lg" className="flex items-center gap-2">
                <PlayCircle className="h-6 w-6" />
                <span>Tonton Sekarang</span>
              </Button>
            ) : (
              <Button size="lg" className="flex items-center gap-2">
                <Ticket className="h-6 w-6" />
                <span>Beli Sekarang (Rp {movie.price?.toLocaleString('id-ID') || 'N/A'})</span>
              </Button>
            )}
          </div>
        </div>
      </section>

      {movie.trailer_url && (
        <section>
          <h2 className="text-3xl font-bold">Trailer</h2>
          <Separator className="my-4" />
          {renderPlayer(movie.trailer_url)}
        </section>
      )}

      <section>
        <h2 className="text-3xl font-bold">Ulasan Penonton</h2>
        <Separator className="my-4" />
        <div className="rounded-lg border bg-muted p-8 text-center">
          <p className="text-muted-foreground">Fitur ulasan akan segera hadir!</p>
        </div>
      </section>

      {similarMovies && similarMovies.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold">Rekomendasi Film Serupa</h2>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {isLoadingSimilar 
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[2/3] w-full" />)
              : similarMovies.map(m => <MovieCard key={m.id} movie={m} />)
            }
          </div>
        </section>
      )}
    </div>
  );
};

export default MovieDetailPage;