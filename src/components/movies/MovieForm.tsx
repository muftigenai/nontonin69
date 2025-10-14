import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { Movie } from "@/types";

const movieSchema = z.object({
  title: z.string().min(1, "Judul tidak boleh kosong"),
  description: z.string().optional(),
  genre: z.string().optional(),
  duration: z.coerce.number().positive("Durasi harus angka positif").optional().nullable(),
  release_date: z.string().optional(),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif").optional().nullable(),
  trailer_url: z.string().url("URL trailer tidak valid").optional().or(z.literal("")),
  poster_url: z.string().url("URL poster tidak valid").optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
});

type MovieFormData = z.infer<typeof movieSchema>;

interface MovieFormProps {
  movie: Movie | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const MovieForm = ({ movie, onOpenChange, onSuccess }: MovieFormProps) => {
  const queryClient = useQueryClient();
  const form = useForm<MovieFormData>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: movie?.title || "",
      description: movie?.description || "",
      genre: movie?.genre || "",
      duration: movie?.duration || undefined,
      release_date: movie?.release_date || "",
      price: movie?.price || undefined,
      trailer_url: movie?.trailer_url || "",
      poster_url: movie?.poster_url || "",
      status: movie?.status || "active",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: MovieFormData) => {
      if (movie) {
        // Update
        const { error } = await supabase.from("movies").update(data).eq("id", movie.id);
        if (error) throw new Error(error.message);
      } else {
        // Create
        const { error } = await supabase.from("movies").insert(data);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      showSuccess(`Film berhasil ${movie ? "diperbarui" : "ditambahkan"}.`);
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      onSuccess();
    },
    onError: (error) => {
      showError(`Gagal menyimpan film: ${error.message}`);
    },
  });

  const onSubmit = (data: MovieFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{movie ? "Edit Film" : "Tambah Film Baru"}</DialogTitle>
          <DialogDescription>Isi detail film di bawah ini.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto p-1 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Judul Film</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Petualangan Sherina 2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Deskripsi / Sinopsis</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tulis sinopsis singkat di sini..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="genre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Genre</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: Aksi, Komedi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="release_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Rilis</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durasi (menit)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Contoh: 120" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Harga</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Contoh: 50000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="poster_url"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>URL Poster</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trailer_url"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>URL Trailer/Video</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Status Tayang</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter className="md:col-span-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Batal
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default MovieForm;