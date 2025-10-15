import { Movie } from "@/types";
import { Link } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import MovieCard from "./MovieCard";
import React from "react";
import { ArrowRight } from "lucide-react";

interface GenreSectionProps {
  title: string;
  icon: React.ElementType;
  movies: Movie[];
  genreKey: string;
}

const GenreSection = ({ title, icon: Icon, movies, genreKey }: GenreSectionProps) => {
  if (movies.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <Link
          to={`/categories/${genreKey}`}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          Lihat Semua <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselContent className="-ml-4">
          {movies.map((movie) => (
            <CarouselItem key={movie.id} className="basis-1/2 pl-4 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
              <MovieCard movie={movie} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="ml-12 hidden sm:flex" />
        <CarouselNext className="mr-12 hidden sm:flex" />
      </Carousel>
    </section>
  );
};

export default GenreSection;