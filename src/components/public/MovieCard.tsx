import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Movie } from "@/types";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface MovieCardProps {
  movie: Movie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  return (
    <Link to={`/public/movie/${movie.id}`}>
      <Card className="overflow-hidden transition-transform hover:scale-105 hover:shadow-lg">
        <CardHeader className="p-0">
          <div className="relative">
            <img
              src={movie.poster_url || "https://placehold.co/400x600?text=No+Image"}
              alt={movie.title}
              className="aspect-[2/3] w-full object-cover"
            />
            {movie.access_type === 'premium' && (
              <Badge className="absolute top-2 right-2">Premium</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="text-lg truncate">{movie.title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{movie.genre}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default MovieCard;