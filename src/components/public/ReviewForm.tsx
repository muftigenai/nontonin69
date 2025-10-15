import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import StarRatingInput from "./StarRatingInput";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const reviewSchema = z.object({
  rating: z.number().min(1, "Rating harus diisi").max(5),
  comment: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  movieId: string;
}

const ReviewForm = ({ movieId }: ReviewFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      if (!user) throw new Error("Anda harus login untuk memberikan ulasan.");
      const { error } = await supabase.from("reviews").insert({
        ...data,
        movie_id: movieId,
        user_id: user.id,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess("Ulasan Anda berhasil dikirim.");
      queryClient.invalidateQueries({ queryKey: ["reviews", movieId] });
      form.reset();
    },
    onError: (error: Error) => {
      showError(`Gagal mengirim ulasan: ${error.message}`);
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    mutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="text-center text-muted-foreground">
        <a href="/login" className="underline">Login</a> untuk memberikan ulasan.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tulis Ulasan Anda</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating Anda</FormLabel>
                  <FormControl>
                    <StarRatingInput value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Komentar (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Bagaimana pendapat Anda tentang film ini?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Mengirim..." : "Kirim Ulasan"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;