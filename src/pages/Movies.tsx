import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Search } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import MovieForm from "@/components/movies/MovieForm";
import DeleteConfirmationDialog from "@/components/movies/DeleteConfirmationDialog";
import { Movie } from "@/types";

const Movies = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch movies
  const { data: movies, isLoading } = useQuery({
    queryKey: ["movies", searchTerm],
    queryFn: async () => {
      let query = supabase.from("movies").select("*").order("created_at", { ascending: false });
      if (searchTerm) {
        query = query.ilike("title", `%${searchTerm}%`);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (movieId: string) => {
      const { error } = await supabase.from("movies").delete().eq("id", movieId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess("Film berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      setIsDeleteConfirmOpen(false);
      setSelectedMovie(null);
    },
    onError: (error) => {
      showError(`Gagal menghapus film: ${error.message}`);
    },
  });

  const handleAdd = () => {
    setSelectedMovie(null);
    setIsFormOpen(true);
  };

  const handleEdit = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsFormOpen(true);
  };

  const handleDelete = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedMovie) {
      deleteMutation.mutate(selectedMovie.id);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Film</h1>
          <p className="text-muted-foreground">Kelola daftar film di sini.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari berdasarkan judul..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            <span>Tambah Film</span>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Poster</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : (
              movies?.map((movie) => (
                <TableRow key={movie.id}>
                  <TableCell>
                    <img
                      src={movie.poster_url || "/placeholder.svg"}
                      alt={movie.title}
                      className="h-16 w-12 rounded-md object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{movie.title}</TableCell>
                  <TableCell>{movie.genre}</TableCell>
                  <TableCell>{movie.price ? `Rp ${movie.price.toLocaleString("id-ID")}` : "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        movie.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {movie.status === "active" ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Buka menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(movie)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(movie)} className="text-red-500">
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isFormOpen && (
        <MovieForm
          movie={selectedMovie}
          onOpenChange={setIsFormOpen}
          onSuccess={() => {
            setIsFormOpen(false);
            setSelectedMovie(null);
          }}
        />
      )}

      <DeleteConfirmationDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default Movies;