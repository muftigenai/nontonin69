import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { showSuccess, showError } from "@/utils/toast";
import { PlusCircle, Edit, Trash2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Movie } from "@/types";

const movieSchema = z.object({
  title: z.string().min(1, "Judul tidak boleh kosong"),
  description: z.string().min(1, "Deskripsi tidak boleh kosong"),
  poster_url: z.string().url("URL poster tidak valid"),
  trailer_url: z.string().url("URL trailer tidak valid"),
  video_url: z.string().optional(), // Dibuat lebih fleksibel
  release_date: z.string().min(1, "Tanggal rilis tidak boleh kosong"),
  genre: z.string().min(1, "Genre tidak boleh kosong"),
  duration: z.coerce.number().min(1, "Durasi harus lebih dari 0"),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  subtitle_url: z.string().optional(), // Dibuat lebih fleksibel
  access_type: z.enum(["free", "premium"], {
    required_error: "Anda perlu memilih tipe akses.",
  }),
});

type MovieFormValues = z.infer<typeof movieSchema>;

const Movies = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: "",
      description: "",
      poster_url: "",
      trailer_url: "",
      video_url: "",
      release_date: "",
      genre: "",
      duration: 0,
      price: 0,
      subtitle_url: "",
      access_type: "free",
    },
  });

  const { data: movies, isLoading } = useQuery({
    queryKey: ["movies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("movies").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as Movie[];
    },
  });

  const filteredMovies = useMemo(() => {
    if (!movies) return [];
    return movies.filter(movie =>
      movie.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [movies, searchTerm]);

  const mutation = useMutation({
    mutationFn: async (values: MovieFormValues) => {
      const movieData = { ...values };
      const { error } = editingMovie
        ? await supabase.from("movies").update(movieData).eq("id", editingMovie.id)
        : await supabase.from("movies").insert([movieData]);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess(`Film berhasil ${editingMovie ? "diperbarui" : "ditambahkan"}.`);
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      setIsDialogOpen(false);
      setEditingMovie(null);
      form.reset();
    },
    onError: (error) => {
      showError(`Gagal: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("movies").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess("Film berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: ["movies"] });
    },
    onError: (error) => {
      showError(`Gagal menghapus: ${error.message}`);
    },
  });

  const handleAdd = () => {
    setEditingMovie(null);
    form.reset({
      title: "", description: "", poster_url: "", trailer_url: "", video_url: "",
      release_date: "", genre: "", duration: 0, price: 0, subtitle_url: "", access_type: "free"
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    form.reset({
      ...movie,
      duration: movie.duration || 0,
      price: movie.price || 0,
      subtitle_url: movie.subtitle_url || "",
      video_url: movie.video_url || "",
      access_type: movie.access_type || "free",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus film ini?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (values: MovieFormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Daftar Film</h1>
          <p className="text-muted-foreground">Kelola semua film yang tersedia di platform.</p>
        </div>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          <span>Tambah Film</span>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cari film..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Tanggal Rilis</TableHead>
              <TableHead>Tipe Akses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Memuat data film...</TableCell>
              </TableRow>
            ) : filteredMovies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  {searchTerm ? "Film tidak ditemukan." : "Belum ada film."}
                </TableCell>
              </TableRow>
            ) : (
              filteredMovies.map((movie) => (
                <TableRow key={movie.id}>
                  <TableCell className="font-medium">{movie.title}</TableCell>
                  <TableCell>{movie.genre}</TableCell>
                  <TableCell>{new Date(movie.release_date || "").toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>
                    <Badge variant={movie.access_type === 'premium' ? 'default' : 'secondary'}>
                      {movie.access_type === 'premium' ? 'Langganan' : 'Gratis'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={movie.status === 'active' ? 'default' : 'destructive'}>{movie.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Buka menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(movie)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(movie.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Hapus</span>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMovie ? "Edit Film" : "Tambah Film Baru"}</DialogTitle>
            <DialogDescription>
              {editingMovie ? "Perbarui detail film di bawah ini." : "Isi formulir di bawah ini untuk menambahkan film baru."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <Label>Judul</Label>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="genre" render={({ field }) => (
                  <FormItem>
                    <Label>Genre</Label>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <Label>Deskripsi</Label>
                  <FormControl><Textarea {...field} rows={4} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="poster_url" render={({ field }) => (
                  <FormItem>
                    <Label>URL Poster</Label>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="trailer_url" render={({ field }) => (
                  <FormItem>
                    <Label>URL Trailer</Label>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
               <FormField control={form.control} name="video_url" render={({ field }) => (
                <FormItem>
                  <Label>URL Film</Label>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="subtitle_url" render={({ field }) => (
                <FormItem>
                  <Label>URL Subtitle (Opsional)</Label>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="release_date" render={({ field }) => (
                  <FormItem>
                    <Label>Tanggal Rilis</Label>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="duration" render={({ field }) => (
                  <FormItem>
                    <Label>Durasi (menit)</Label>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <Label>Harga (Rp)</Label>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="access_type" render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipe Akses</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4">
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="free" /></FormControl>
                        <FormLabel className="font-normal">Gratis</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="premium" /></FormControl>
                        <FormLabel className="font-normal">Langganan (Premium)</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Movies;