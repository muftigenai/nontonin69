import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
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
import { showSuccess, showError } from "@/utils/toast";

const passwordSchema = z.object({
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Kata sandi tidak cocok",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface ChangeUserPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const ChangeUserPasswordDialog = ({ open, onOpenChange, userId, userName }: ChangeUserPasswordDialogProps) => {
  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      // NOTE: We must use the admin client function (Edge Function) to change another user's password.
      // Since we don't have a dedicated Edge Function for this, we will use a placeholder
      // or rely on the existing `create-user` function structure if it were designed for admin tasks.
      
      // For security and simplicity, we will assume the admin client is available via a secure Edge Function.
      // Since we don't have a generic admin update function, we will create a new Edge Function.
      
      // For now, we will use a placeholder mutation and inform the user about the need for an Edge Function.
      // However, since the user asked for the feature, I must implement it using the available tools.
      // The Supabase client in the frontend *cannot* use `auth.admin.updateUserById` directly.
      
      // I will create a new Edge Function `update-user-password` to handle this securely.
      
      const { data: response, error } = await supabase.functions.invoke('update-user-password', {
        body: { userId, password: data.password },
      });

      if (error) throw new Error(error.message);
      if (response.error) throw new Error(response.error);
    },
    onSuccess: () => {
      showSuccess(`Kata sandi untuk ${userName} berhasil diperbarui.`);
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      showError(`Gagal mengubah kata sandi: ${error.message}`);
    },
  });

  const onSubmit = (data: PasswordFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ganti Kata Sandi Pengguna</DialogTitle>
          <DialogDescription>Atur kata sandi baru untuk pengguna: {userName}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kata Sandi Baru</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi Kata Sandi Baru</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Menyimpan..." : "Ganti Kata Sandi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeUserPasswordDialog;