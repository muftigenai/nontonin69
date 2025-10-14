import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useEffect } from 'react';
import { Clapperboard } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && session) {
      navigate('/');
    }
  }, [session, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (session) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="mb-8 flex items-center gap-2">
            <Clapperboard className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">Nontonin</h1>
        </div>
      <div className="w-full max-w-md rounded-lg border p-6">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']}
          theme="dark"
          localization={{
            variables: {
              sign_in: {
                email_label: 'Alamat Email',
                password_label: 'Kata Sandi',
                button_label: 'Masuk',
                social_provider_text: 'Masuk dengan {{provider}}',
                link_text: 'Sudah punya akun? Masuk',
              },
              sign_up: {
                email_label: 'Alamat Email',
                password_label: 'Kata Sandi',
                button_label: 'Daftar',
                social_provider_text: 'Daftar dengan {{provider}}',
                link_text: 'Belum punya akun? Daftar',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;