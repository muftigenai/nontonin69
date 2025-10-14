import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showSuccess, showError } from "@/utils/toast";

const movieSchema = z.object({
  title: z.string().min(1, "Judul tidak boleh kosong"),
  description: z.string().optional(),
  genre: z.string().optional(),
  duration: z.coerce.number().positive("Durasi harus angka positif").optional(),
  release_date: z.string().optional(),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif").optional(),
  video_url: z.string().url("URL video tidak valid").optional(),
  poster_url: z.string().url("URL poster tidak valid").optional(),
});

type MovieFormValues = z.infer<typeof movieSchema>;

interface MovieFormProps {
  setOpen: (open: boolean) => void;
  initialData?: any;
}

const MovieForm = ({ setOpen, initialData }: MovieFormProps) => {
  const queryClient = useQueryClient();
  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: initialData || {},
  });

  const mutation = useMutation({
    mutationFn: async (values: MovieFormValues) => {
      if (initialData) {
        const { error } = await supabase.from("movies").update(values).eq("id", initialData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("movies").insert([values]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      showSuccess(`Film berhasil ${initialData ? 'diperbarui' : 'ditambahkan'}!`);
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      setOpen(false);
    },
    onError: (error) => {
      showError(`Terjadi kesalahan: ${error.message}`);
    },
  });

  const onSubmit = (data: MovieFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
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
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea placeholder="Sinopsis singkat film..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Add other fields here: genre, duration, release_date, price, video_url, poster_url */}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </form>
    </Form>
  );
};

export default MovieForm;