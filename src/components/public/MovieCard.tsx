import { Card, CardContent } from "@/components/ui/card";
import { Movie } from "@/types";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Star, PlayCircle } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface MovieCardProps {
  movie: Movie;
}

const getGenreBadgeClass = (genre: string | null) => {
  const g = genre?.toLowerCase() || "";
  if (g.includes("aksi")) return "bg-red-600 hover:bg-red-700 text-white";
  if (g.includes("romantis")) return "bg-pink-500 hover:bg-pink-600 text-white";
  if (g.includes("horor")) return "bg-purple-800 hover:bg-purple-900 text-white";
  if (g.includes("dokumenter")) return "bg-sky-500 hover:bg-sky-600 text-white";
  return "bg-secondary text-secondary-foreground";
};

const MovieCard = ({ movie }: MovieCardProps) => {
  const posterUrl = movie.poster_url || "https://placehold.co/400x600?text=No+Image";

  return (
    <Link to={`/movie/${movie.id}`} className="group relative block overflow-hidden rounded-lg">
      <Card className="overflow-hidden transition-transform duration-300 ease-in-out group-hover:scale-105">
        <div className="relative">
          <img
            src={posterUrl}
            alt={movie.title}
            className="aspect-[2/3] w-full object-cover transition-all duration-300 group-hover:brightness-50"
          />
          {movie.access_type === "premium" && (
            <Badge className="absolute top-2 right-2 border border-black/20">Langganan</Badge>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="truncate font-semibold">{movie.title}</h3>
          <Badge variant="outline" className={cn("mt-1 text-xs", getGenreBadgeClass(movie.genre))}>
            {movie.genre}
          </Badge>
        </CardContent>
      </Card>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-4 text-center text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="flex items-center gap-1">
          <Star className="h-5 w-5 text-yellow-400" fill="currentColor" />
          <span className="text-lg font-bold">4.5</span>
        </div>
        <h3 className="my-2 text-lg font-bold">{movie.title}</h3>
        <Button size="sm" className="mt-4" variant={movie.access_type === 'premium' ? 'default' : 'secondary'}>
          <PlayCircle className="mr-2 h-4 w-4" />
          {movie.access_type === 'premium' ? 'Langganan' : 'Tonton Sekarang'}
        </Button>
      </div>
    </Link>
  );
};

export default MovieCard;