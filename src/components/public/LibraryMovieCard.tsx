import { Card, CardContent } from "@/components/ui/card";
import { Movie } from "@/types";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { PlayCircle } from "lucide-react";
import { Badge } from "../ui/badge";

interface LibraryMovieCardProps {
  movie: Movie;
}

const LibraryMovieCard = ({ movie }: LibraryMovieCardProps) => {
  return (
    <Card className="overflow-hidden">
      <Link to={`/movie/${movie.id}`}>
        <img
          src={movie.poster_url || "https://placehold.co/400x600?text=No+Image"}
          alt={movie.title}
          className="aspect-[2/3] w-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </Link>
      <CardContent className="space-y-2 p-3">
        <h3 className="truncate font-semibold">{movie.title}</h3>
        <div className="flex items-center justify-between">
          {/* Status (Selesai / Belum ditonton) belum tersedia */}
          <Badge variant="outline">Ditonton</Badge>
        </div>
        <Button asChild size="sm" className="w-full">
          <Link to={`/movie/${movie.id}`}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Tonton Lagi
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default LibraryMovieCard;