import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Camera, User as UserIcon } from 'lucide-react';

interface AvatarUploadProps {
  url: string | null;
  onUpload: (filePath: string) => void;
}

export const AvatarUpload = ({ url, onUpload }: AvatarUploadProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (url) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(url);
      setAvatarUrl(data.publicUrl);
    } else {
      setAvatarUrl(null);
    }
  }, [url]);

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const session = await supabase.auth.getSession();
      const user = session.data.session?.user;
      if (!user) throw new Error('Pengguna tidak ditemukan');

      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error } = await supabase.storage.from('avatars').upload(filePath, file, {
        upsert: true,
      });

      if (error) throw error;
      return filePath;
    },
    onSuccess: (filePath) => {
      onUpload(filePath);
    },
  });

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const toastId = showLoading('Mengunggah foto profil...');
    setUploading(true);
    try {
      const files = event.target.files;
      if (!files || files.length === 0) {
        throw new Error('Anda harus memilih gambar untuk diunggah.');
      }
      const file = files[0];
      await uploadAvatarMutation.mutateAsync(file);
      showSuccess('Foto profil berhasil diperbarui.');
    } catch (error: any) {
      showError(error.message || 'Gagal mengunggah foto profil.');
    } finally {
      dismissToast(toastId);
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-32 w-32">
        <AvatarImage src={avatarUrl ?? undefined} alt="Avatar" />
        <AvatarFallback>
          <UserIcon className="h-16 w-16" />
        </AvatarFallback>
      </Avatar>
      <div>
        <Button asChild variant="outline">
          <label htmlFor="single" className="cursor-pointer flex items-center gap-2">
            <Camera className="h-4 w-4" />
            {uploading ? 'Mengunggah...' : 'Ganti Foto'}
          </label>
        </Button>
        <input
          style={{
            visibility: 'hidden',
            position: 'absolute',
          }}
          type="file"
          id="single"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
        />
      </div>
    </div>
  );
};