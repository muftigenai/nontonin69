import React, { useRef, useState, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Subtitles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Movie } from "@/types";
import { showSuccess, showError } from "@/utils/toast";

interface VideoPlayerProps {
  movie: Movie;
}

const SAVE_INTERVAL_MS = 10000; // Simpan progres setiap 10 detik

const VideoPlayer = ({ movie }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isSubtitleEnabled, setIsSubtitleEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false); // State baru untuk melacak status fullscreen

  // --- Video Controls Logic ---

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // 1. Load initial watch progress
  useEffect(() => {
    const loadProgress = async () => {
      if (!user || !videoRef.current) return;

      const { data } = await supabase
        .from("watch_history")
        .select("progress_seconds")
        .eq("user_id", user.id)
        .eq("movie_id", movie.id)
        .single();

      if (data?.progress_seconds) {
        videoRef.current.currentTime = data.progress_seconds;
        setCurrentTime(data.progress_seconds);
        showSuccess(`Melanjutkan dari ${formatTime(data.progress_seconds)}`);
      }
    };
    loadProgress();
  }, [user, movie.id]);

  // 2. Save watch progress periodically
  const saveProgress = useCallback(async (time: number) => {
    if (!user || !movie.id) return;

    const progress_seconds = Math.floor(time);

    // Upsert (Insert or Update) watch history
    const { error } = await supabase.from("watch_history").upsert(
      {
        user_id: user.id,
        movie_id: movie.id,
        progress_seconds,
        watched_at: new Date().toISOString(),
      },
      { onConflict: "user_id, movie_id" }
    );

    if (error) {
      console.error("Gagal menyimpan progres:", error.message);
    }
  }, [user, movie.id]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (videoRef.current && isPlaying) {
        saveProgress(videoRef.current.currentTime);
      }
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      // Save final progress when component unmounts
      if (videoRef.current) {
        saveProgress(videoRef.current.currentTime);
      }
    };
  }, [isPlaying, user, saveProgress]);

  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
  }, []);

  // 3. Keyboard Controls (Spacebar for Play/Pause, 'F' for Fullscreen)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleFullscreen();
      } else if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay, toggleFullscreen]);

  // 4. Listen for fullscreen changes to update state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // For Safari

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);


  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) {
        setVolume(0);
      } else if (videoRef.current.volume === 0) {
        // Restore volume if it was 0 before muting
        videoRef.current.volume = 0.5;
        setVolume(0.5);
      }
    }
  };

  const toggleSubtitle = () => {
    if (videoRef.current) {
      const tracks = videoRef.current.textTracks;
      if (tracks.length > 0) {
        tracks[0].mode = isSubtitleEnabled ? 'hidden' : 'showing';
        setIsSubtitleEnabled(!isSubtitleEnabled);
      }
    }
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSeconds = String(seconds).padStart(2, '0');

    if (hours > 0) {
      return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${paddedMinutes}:${paddedSeconds}`;
  };

  // Prevent right-click (anti-download measure)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    showError("Fitur download dinonaktifkan.");
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black group"
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      tabIndex={0} // Make the container focusable
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={movie.video_url || movie.trailer_url || undefined}
        poster={movie.poster_url || undefined}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        className="w-full aspect-video cursor-pointer"
      >
        {movie.subtitle_url && (
          <track
            kind="subtitles"
            src={movie.subtitle_url}
            srcLang="id"
            label="Indonesia"
            default={isSubtitleEnabled}
          />
        )}
        Browser Anda tidak mendukung pemutar video.
      </video>

      {/* Custom Controls Overlay */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Play/Pause Center Button (only visible when paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-20 w-20 text-white/80 hover:text-white transition-colors"
              onClick={togglePlay}
            >
              <Play className="h-16 w-16 fill-white" />
            </Button>
          </div>
        )}

        {/* Progress Bar (Hidden when fullscreen) */}
        {!isFullscreen && (
          <div className="px-4 pb-2">
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={handleProgressChange}
              className="cursor-pointer"
            />
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-between p-4 pt-0">
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20">
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>

            {/* Time Display */}
            <span className="text-sm text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20">
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="w-20 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Subtitle Button */}
            {movie.subtitle_url && (
              <Button variant="ghost" size="icon" onClick={toggleSubtitle} className={cn("text-white hover:bg-white/20", isSubtitleEnabled ? "text-primary" : "text-white/70")}>
                <Subtitles className="h-5 w-5" />
              </Button>
            )}
            
            {/* Fullscreen Button */}
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
              <Maximize className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;