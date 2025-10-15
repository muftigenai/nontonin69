import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Review } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface ReviewListProps {
  movieId: string;
}

const ReviewList = ({ movieId }: ReviewListProps) => {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", movieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, profiles(full_name, avatar_url)")
        .eq("movie_id", movieId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as Review[];
    },
  });

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return <p className="text-muted-foreground">Belum ada rating untuk film ini.</p>;
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="flex gap-4">
          <Avatar>
            <AvatarImage src={review.profiles?.avatar_url || undefined} />
            <AvatarFallback>{getInitials(review.profiles?.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{review.profiles?.full_name || "Anonim"}</p>
              <span className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString("id-ID")}
              </span>
            </div>
            <div className="flex items-center gap-1 my-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;