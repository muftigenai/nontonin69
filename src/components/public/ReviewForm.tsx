import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import StarRatingInput from "./StarRatingInput";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Review } from "@/types";
import React from "react";

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

  // Query untuk mengambil ulasan pengguna yang sudah ada
  const { data: existingReview, isLoading: isLoadingExistingReview } = useQuery({
    queryKey: ["userReview", movieId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment")
        .eq("movie_id", movieId)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw new Error(error.message);
      return data as Pick<Review, 'id' | 'rating' | 'comment'> | null;
    },
    enabled: !!user && !!movieId,
  });

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  // Set default values once the existing review is loaded
  React.useEffect(() => {
    if (existingReview) {
      form.reset({
        rating: existingReview.rating,
        comment: existingReview.comment || "",
      });
    } else {
      form.reset({
        rating: 0,
        comment: "",
      });
    }
  }, [existingReview, form]);

  const mutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      if (!user) throw new Error("Anda harus login untuk memberikan ulasan.");
      
      if (existingReview) {
        // UPDATE existing review
        const { error } = await supabase
          .from("reviews")
          .update({
            rating: data.rating,
            comment: data.comment,
            // We don't update created_at, but we could add an updated_at column if needed
          })
          .eq("id", existingReview.id);
        
        if (error) throw new Error(error.message);
        return "updated";
      } else {
        // INSERT new review
        const { error } = await supabase.from("reviews").insert({
          ...data,
          movie_id: movieId,
          user_id: user.id,
        });
        if (error) throw new Error(error.message);
        return "inserted";
      }
    },
    onSuccess: (action) => {
      showSuccess(`Ulasan Anda berhasil di${action === "updated" ? "perbarui" : "kirim"}.`);
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["reviews", movieId] });
      queryClient.invalidateQueries({ queryKey: ["movieRating", movieId] });
      queryClient.invalidateQueries({ queryKey: ["userReview", movieId, user?.id] });
    },
    onError: (error: Error) => {
      showError(`Gagal memproses ulasan: ${error.message}`);
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

  if (isLoadingExistingReview) {
    return <Card><CardContent className="p-6 text-center text-muted-foreground">Memeriksa ulasan...</CardContent></Card>;
  }

  const isEditing = !!existingReview;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Ulasan Anda" : "Tulis Ulasan Anda"}</CardTitle>
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
              {mutation.isPending ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Kirim Ulasan"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;