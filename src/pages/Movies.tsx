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

// Skema baru: menggunakan FileList untuk semua media
const movieSchema = z.object({
  title: z.string().min(1, "Judul tidak boleh kosong"),
  description: z.string().min(1, "Deskripsi tidak boleh kosong"),
  poster_file: z.instanceof(FileList).optional(),
  trailer_file: z.instanceof(FileList).optional(),
  video_file: z.instanceof(FileList).optional(),
  release_date: z.string().min(1, "Tanggal rilis tidak boleh kosong"),
  genre: z.string().min(1, "Genre tidak boleh kosong"),
  duration: z.coerce.number().min(1, "Durasi harus lebih dari 0"),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  subtitle_url: z.string().optional(),
  access_type: z.enum(["free", "premium"], {
    required_error: "Anda perlu memilih tipe akses.",
  }),
});

type MovieFormValues = z.infer<typeof movieSchema> & {
  current_poster_url?: string | null;
  current_trailer_url?: string | null;
  current_video_url?: string | null;
};

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
      poster_file: undefined,
      trailer_file: undefined,
      video_file: undefined,
      current_poster_url: null,
      current_trailer_url: null,
      current_video_url: null,
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

  const uploadFile = async (fileList: FileList | undefined, currentUrl: string | null, folder: string) => {
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('posters') // Menggunakan bucket 'posters' untuk semua media
        .upload(filePath, file);

      if (uploadError) throw new Error(`Gagal mengunggah ${folder}: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from('posters').getPublicUrl(filePath);
      return urlData.publicUrl;
    }
    return currentUrl;
  };

  const mutation = useMutation({
    mutationFn: async (values: MovieFormValues) => {
      const { poster_file, trailer_file, video_file, current_poster_url, current_trailer_url, current_video_url, ...rest } = values;

      // 1. Upload Poster
      const posterUrlToSave = await uploadFile(poster_file, current_poster_url, 'posters');
      if (!editingMovie && !posterUrlToSave) {
        throw new Error("Poster film harus diunggah.");
      }

      // 2. Upload Trailer
      const trailerUrlToSave = await uploadFile(trailer_file, current_trailer_url, 'trailers');

      // 3. Upload Video
      const videoUrlToSave = await uploadFile(video_file, current_video_url, 'videos');

      const movieData = { 
        ...rest, 
        poster_url: posterUrlToSave,
        trailer_url: trailerUrlToSave,
        video_url: videoUrlToSave,
      };

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
      title: "", description: "", poster_file: undefined, current_poster_url: null, 
      trailer_file: undefined, current_trailer_url: null, video_file: undefined, current_video_url: null,
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
      access_type: movie.access_type || "free",
      // Set current URLs for preservation if no new file is uploaded
      current_poster_url: movie.poster_url,
      current_trailer_url: movie.trailer_url,
      current_video_url: movie.video_url,
      // Reset file inputs
      poster_file: undefined,
      trailer_file: undefined,
      video_file: undefined,
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

  const currentPosterUrl = form.watch("current_poster_url");
  const posterFile = form.watch("poster_file");
  const previewUrl = posterFile && posterFile.length > 0 ? URL.createObjectURL(posterFile[0]) : currentPosterUrl;

  const renderMediaUploadField = (
    fieldName: "poster_file" | "trailer_file" | "video_file",
    label: string,
    accept: string,
    currentUrlKey: "current_poster_url" | "current_trailer_url" | "current_video_url",
    previewType: "image" | "video" | "none" = "none"
  ) => {
    const currentUrl = form.watch(currentUrlKey);
    const fileList = form.watch(fieldName);
    const file = fileList && fileList.length > 0 ? fileList[0] : null;
    const previewSource = file ? URL.createObjectURL(file) : currentUrl;

    return (
      <FormField control={form.control} name={fieldName} render={({ field: { value, onChange, ...fieldProps } }) => (
        <FormItem className="md:col-span-2">
          <Label>{label}</Label>
          <div className="flex items-center gap-4">
            {previewType === "image" && (
              <div className="aspect-[2/3] w-24 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                {previewSource ? (
                  <img src={previewSource} alt={`${label} Preview`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No Image
                  </div>
                )}
              </div>
            )}
            {previewType === "video" && previewSource && (
              <div className="aspect-video w-48 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                <video controls src={previewSource} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <FormControl>
                <Input
                  type="file"
                  accept={accept}
                  onChange={(e) => {
                    onChange(e.target.files);
                  }}
                  {...fieldProps}
                />
              </FormControl>
              <p className="text-sm text-muted-foreground mt-1">
                {editingMovie && currentUrl && !file ? `File saat ini akan dipertahankan.` : `Unggah file ${label.toLowerCase()}.`}
              </p>
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )} />
    );
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
              
              {/* Media Upload Fields */}
              {renderMediaUploadField("poster_file", "Poster Film", "image/*", "current_poster_url", "image")}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderMediaUploadField("trailer_file", "File Trailer", "video/*", "current_trailer_url", "video")}
                {renderMediaUploadField("video_file", "File Film Utama", "video/*", "current_video_url", "video")}
              </div>

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