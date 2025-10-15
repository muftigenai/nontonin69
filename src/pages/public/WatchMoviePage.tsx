import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import VideoPlayer from "@/components/public/VideoPlayer";
import { useAuth } from "@/providers/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
// Hapus import getYouTubeVideoId, getGoogleDriveFileId karena kita memprioritaskan VideoPlayer kustom

const WatchMoviePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading: isLoadingProfile } = useUserProfile();

  const { data: movie, isLoading: isLoadingMovie, error } = useQuery({
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

  const isLoading = isLoadingMovie || isLoadingProfile;

  // Check access rights
  const hasAccess = movie?.access_type === 'free' || profile?.subscription_status === 'premium';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (error || !movie) {
    return <div className="text-center text-red-500">Film tidak ditemukan atau terjadi kesalahan: {error?.message}</div>;
  }

  if (!user) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-2xl font-semibold">Akses Ditolak</h2>
        <p className="mt-2 text-muted-foreground">Anda harus login untuk menonton film ini.</p>
        <Button asChild className="mt-4">
          <Link to="/login">Login</Link>
        </Button>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-2xl font-semibold">Akses Premium Dibutuhkan</h2>
        <p className="mt-2 text-muted-foreground">Film ini hanya tersedia untuk pelanggan premium.</p>
        <Button asChild className="mt-4">
          <Link to="/subscribe">Lihat Paket Langganan</Link>
        </Button>
      </div>
    );
  }

  const videoUrl = movie.video_url; // Hanya gunakan video_url utama

  // Ensure we have a video source
  if (!videoUrl) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-2xl font-semibold">Video Tidak Tersedia</h2>
        <p className="mt-2 text-muted-foreground">Maaf, tautan video untuk film ini tidak ditemukan.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Detail Film
        </Button>
      </div>
    );
  }

  // Render custom VideoPlayer for direct video URLs (Supabase Storage)
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => navigate(`/movie/${movie.id}`)}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Kembali</span>
        </Button>
        <h1 className="text-2xl font-bold truncate">{movie.title}</h1>
      </div>
      
      <VideoPlayer movie={movie} />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Sinopsis</h2>
        <p className="text-muted-foreground">{movie.description}</p>
      </div>
    </div>
  );
};

export default WatchMoviePage;