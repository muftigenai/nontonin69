import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import VideoPlayer from "@/components/public/VideoPlayer";
import { useAuth } from "@/providers/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Link } from "react-router-dom";
import { getYouTubeVideoId, getGoogleDriveFileId } from "@/lib/utils";

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

  const videoUrl = movie.video_url || movie.trailer_url;
  const youtubeId = getYouTubeVideoId(videoUrl);
  const driveId = getGoogleDriveFileId(videoUrl);

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

  const renderVideoContent = () => {
    // Atribut sandbox yang membatasi navigasi dan pop-up, tetapi mengizinkan skrip dan fullscreen
    const sandboxAttributes = "allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox allow-fullscreen";

    if (driveId) {
      // Render Google Drive iframe
      return (
        <div className="aspect-video w-full">
          <iframe
            width="100%"
            height="100%"
            src={`https://drive.google.com/file/d/${driveId}/preview`}
            title={movie.title}
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
      // Render YouTube iframe
      return (
        <div className="aspect-video w-full">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            title={movie.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            sandbox={sandboxAttributes}
            className="rounded-lg"
          ></iframe>
        </div>
      );
    );
    }
    
    // Render custom VideoPlayer for direct video URLs
    return <VideoPlayer movie={movie} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => navigate(`/movie/${movie.id}`)}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Kembali</span>
        </Button>
        <h1 className="text-2xl font-bold truncate">{movie.title}</h1>
      </div>
      
      {renderVideoContent()}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Sinopsis</h2>
        <p className="text-muted-foreground">{movie.description}</p>
      </div>
    </div>
  );
};

export default WatchMoviePage;