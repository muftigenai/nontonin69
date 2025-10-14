import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MovieForm from "@/components/movies/MovieForm";
import DeleteConfirmationDialog from "@/components/movies/DeleteConfirmationDialog";
import { showSuccess, showError } from "@/utils/toast";

const Movies = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setFormOpen] = useState(false);
  const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);

  const { data: movies, isLoading } = useQuery({
    queryKey: ['movies'],
    queryFn: async () => {
      const { data, error } = await supabase.from("movies").select("*").order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("movies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess("Film berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      setConfirmDeleteOpen(false);
    },
    onError: (error) => {
      showError(`Gagal menghapus film: ${error.message}`);
    },
  });

  const handleEdit = (movie: any) => {
    setSelectedMovie(movie);
    setFormOpen(true);
  };

  const handleDelete = (movie: any) => {
    setSelectedMovie(movie);
    setConfirmDeleteOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedMovie(null);
    setFormOpen(true);
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Manajemen Film</h1>
        <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" /> Tambah Film
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedMovie ? "Edit Film" : "Tambah Film Baru"}</DialogTitle>
            </DialogHeader>
            <MovieForm setOpen={setFormOpen} initialData={selectedMovie} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4}>Memuat data...</TableCell></TableRow>
              ) : (
                movies?.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell>{movie.title}</TableCell>
                    <TableCell>{movie.genre || "-"}</TableCell>
                    <TableCell>{movie.status}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleDelete(movie)}>Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={() => selectedMovie && deleteMutation.mutate(selectedMovie.id)}
      />
    </div>
  );
};

export default Movies;