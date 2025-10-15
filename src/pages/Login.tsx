import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useAuth } from "@/providers/AuthProvider";
import { Navigate } from "react-router-dom";
import AppIcon from "@/components/AppIcon";

const Login = () => {
  const { session } = useAuth();

  if (session) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="mb-8 flex items-center gap-2">
            <AppIcon className="h-10 w-10" />
            <h1 className="text-4xl font-bold">Nontonin</h1>
        </div>
      <div className="w-full max-w-md">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          theme="dark"
          socialLayout="horizontal"
        />
      </div>
    </div>
  );
};

export default Login;