import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { AvatarUpload } from '@/components/profile/AvatarUpload';

const profileFormSchema = z.object({
  full_name: z.string().min(2, { message: 'Nama lengkap harus diisi.' }),
  date_of_birth: z.date().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfilePage = () => {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || '',
        date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth) : undefined,
      });
    }
  }, [profile, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user) throw new Error('Pengguna tidak ditemukan');
      const { error } = await supabase.from('profiles').update({
        full_name: values.full_name,
        date_of_birth: values.date_of_birth ? format(values.date_of_birth, 'yyyy-MM-dd') : null,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Profil berhasil diperbarui.');
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error) => {
      showError(`Gagal memperbarui profil: ${error.message}`);
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (avatar_url: string) => {
      if (!user) throw new Error('Pengguna tidak ditemukan');
      const { error } = await supabase.from('profiles').update({ avatar_url }).eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user_details'] });
    },
    onError: (error) => {
      showError(`Gagal memperbarui foto profil: ${error.message}`);
    },
  });

  const handlePasswordReset = async () => {
    if (!user?.email) {
      showError('Email pengguna tidak ditemukan.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) {
      showError(`Gagal mengirim email reset: ${error.message}`);
    } else {
      showSuccess('Email untuk reset kata sandi telah dikirim. Silakan periksa kotak masuk Anda.');
    }
  };

  if (isLoading) {
    return <div>Memuat profil...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Pengaturan Profil</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Foto Profil</CardTitle>
            </CardHeader>
            <CardContent>
              <AvatarUpload
                url={profile?.avatar_url}
                onUpload={(filePath) => updateAvatarMutation.mutate(filePath)}
              />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Biodata Diri</CardTitle>
              <CardDescription>Perbarui informasi pribadi Anda di sini.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama lengkap Anda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <Input value={user?.email || ''} disabled />
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Lahir</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pilih tanggal</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Keamanan Akun</CardTitle>
              <CardDescription>Kelola pengaturan keamanan akun Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Kata Sandi</h3>
                  <p className="text-sm text-muted-foreground">Ubah kata sandi Anda secara berkala untuk keamanan.</p>
                </div>
                <Button variant="outline" onClick={handlePasswordReset}>
                  Reset Kata Sandi
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;