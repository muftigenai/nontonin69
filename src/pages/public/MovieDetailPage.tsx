import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Tag, Star, PlayCircle, Ticket, ArrowLeft, DollarSign } from "lucide-react";
import MovieCard from "@/components/public/MovieCard";
import { Separator } from "@/components/ui/separator";
import ReviewList from "@/components/public/ReviewList";
import ReviewForm from "@/components/public/ReviewForm";
import { getYouTubeVideoId, getGoogleDriveFileId } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { showSuccess, showError } from "@/utils/toast";

const MovieDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();

  // Query untuk mengambil harga PPV default
  const { data: settings } = useQuery({
    queryKey: ["app_settings_ppv"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value")
        .eq("key", "ppv_price")
        .single();
      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return Number(data?.value) || 0;
    },
  });
  const defaultPpvPrice = settings || 0;

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

  // Tentukan harga film yang sebenarnya
  const finalMoviePrice = movie 
    ? (movie.access_type === 'premium' && (movie.price === null || movie.price === 0))
      ? defaultPpvPrice
      : movie.price
    : null;

  const { data: averageRating, isLoading: isLoadingRating } = useQuery({
    queryKey: ["movieRating", id],
    queryFn: async () => {
      if (!id) return 0;
      const { data, error } = await supabase.rpc('get_average_rating', { movie_id_input: id });
      if (error) throw new Error(error.message);
      // Round to one decimal place
      return parseFloat(data).toFixed(1);
    },
    enabled: !!id,
  });

  // Query untuk memeriksa status pembelian PPV
  const { data: hasPurchased, isLoading: isLoadingPurchaseCheck } = useQuery({
    queryKey: ["moviePurchase", id, user?.id],
    queryFn: async () => {
      if (!user || movie?.access_type !== 'premium') return false;
      
      const { count, error } = await supabase
        .from("transactions")
        .select("id", { count: 'exact' })
        .eq("user_id", user.id)
        .eq("movie_id", id)
        .eq("status", "successful")
        .limit(1);

      if (error) {
        console.error("Error checking purchase:", error);
        return false;
      }
      return (count || 0) > 0;
    },
    enabled: !!user && !!movie && movie.access_type === 'premium',
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

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!user || !movie) {
        throw new Error("Pengguna atau film tidak ditemukan.");
      }
      
      const priceToCharge = finalMoviePrice || 0;

      if (priceToCharge < 0) {
        throw new Error("Harga film tidak valid.");
      }

      // Simulasi proses pembayaran yang sukses
      const transactionData = {
        user_id: user.id,
        movie_id: movie.id,
        description: `Pembelian film: ${movie.title}`,
        payment_method: "Simulasi PPV",
        amount: priceToCharge,
        status: "successful", // Langsung sukses untuk simulasi
      };

      const { error } = await supabase.from("transactions").insert(transactionData);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess(`Pembelian film ${movie?.title} berhasil! Anda sekarang dapat menontonnya.`);
      // Invalidate purchase check query
      queryClient.invalidateQueries({ queryKey: ["moviePurchase", id, user?.id] });
      // Redirect to watch page immediately
      navigate(`/watch/${id}`);
    },
    onError: (error: Error) => {
      showError(`Gagal melakukan pembelian: ${error.message}`);
    },
  });

  const getYear = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).getFullYear();
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === 0) return "Gratis";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderPlayer = (url: string) => {
    const youtubeId = getYouTubeVideoId(url);
    const driveId = getGoogleDriveFileId(url);
    
    // Atribut sandbox yang membatasi navigasi dan pop-up, tetapi mengizinkan skrip dan fullscreen
    const sandboxAttributes = "allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox allow-fullscreen";

    if (driveId) {
      return (
        <div className="aspect-video">
          <iframe
            width="100%"
            height="100%"
            src={`https://drive.google.com/file/d/${driveId}/preview`}
            title="Google Drive Trailer"
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
            sandbox={sandboxAttributes}
            className="rounded-lg"
          ></iframe>
        </div>
      );
    }

    if (youtubeId) {
      return (
        <div className="aspect-video">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="YouTube Trailer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sandbox={sandboxAttributes}
            className="rounded-lg"
          ></iframe>
        </div>
      );
    }
    
    // Fallback for direct video URL
    return (
        <video controls className="w-full aspect-video rounded-lg">
            <source src={url} type="video/mp4" />
            Browser Anda tidak mendukung tag video.
        </video>
    );
  };

  if (isLoading || isLoadingPurchaseCheck) {
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

  // Determine access status
  const isPremium = movie.access_type === 'premium';
  const isSubscribed = profile?.subscription_status === 'premium';
  const isFree = movie.access_type === 'free';
  const canWatch = isFree || isSubscribed || hasPurchased;

  const renderActionButton = () => {
    if (!user) {
        return (
            <Button size="lg" className="flex items-center gap-2" asChild>
                <Link to="/login">
                    <PlayCircle className="h-6 w-6" />
                    <span>Login untuk Menonton</span>
                </Link>
            </Button>
        );
    }

    if (canWatch) {
        return (
            <Button size="lg" className="flex items-center gap-2" asChild>
                <Link to={`/watch/${movie.id}`}>
                    <PlayCircle className="h-6 w-6" />
                    <span>Tonton Sekarang</span>
                </Link>
            </Button>
        );
    }

    // If premium and not subscribed/purchased
    if (isPremium && !canWatch) {
        const priceText = finalMoviePrice && finalMoviePrice > 0 ? ` (${formatPrice(finalMoviePrice)})` : '';
        
        return (
            <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="flex items-center gap-2" onClick={() => purchaseMutation.mutate()} disabled={purchaseMutation.isPending}>
                    <DollarSign className="h-6 w-6" />
                    <span>{purchaseMutation.isPending ? "Memproses Pembelian..." : `Beli Film Ini${priceText}`}</span>
                </Button>
                <Button size="lg" variant="secondary" className="flex items-center gap-2" asChild>
                    <Link to="/subscribe">
                        <Ticket className="h-6 w-6" />
                        <span>Langganan Premium</span>
                    </Link>
                </Button>
            </div>
        );
    }

    return null;
  };

  return (
    <div className="space-y-8">
      <div>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Button>
      </div>

      <section className="grid grid-cols-1 items-start gap-8 md:grid-cols-3 lg:grid-cols-[1fr,2fr]">
        <img
          src={movie.poster_url || "https://placehold.co/400x600?text=No+Image"}
          alt={movie.title}
          className="aspect-[2/3] w-full rounded-lg object-cover"
        />
        <div className="md:col-span-2">
          <Badge variant={isPremium ? 'default' : 'secondary'}>
            {isPremium ? 'Premium' : 'Gratis'}
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
              {isLoadingRating ? (
                <Skeleton className="h-4 w-8" />
              ) : (
                <span>{averageRating}</span>
              )}
            </div>
            {isPremium && (
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatPrice(finalMoviePrice)}</span>
                </div>
            )}
          </div>

          <p className="mt-6 text-lg leading-relaxed">{movie.description}</p>

          <div className="mt-8">
            {renderActionButton()}
            {isPremium && !canWatch && user && (
                <p className="mt-2 text-sm text-muted-foreground">
                    Atau, tonton gratis dengan berlangganan paket premium.
                </p>
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
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="order-2 space-y-4 md:order-1">
            <ReviewList movieId={movie.id} />
          </div>
          <div className="order-1 md:order-2">
            <ReviewForm movieId={movie.id} />
          </div>
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