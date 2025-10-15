import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";

type UserProfile = {
  id: string;
  role: "admin" | "user" | null;
  full_name: string | null;
  avatar_url: string | null;
};

export const useUserProfile = () => {
  const { user } = useAuth();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, full_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
            console.warn("User profile not found for the current user.");
            return null;
        }
        throw new Error(error.message);
      }
      return data as UserProfile;
    },
    enabled: !!user, 
  });

  return { profile, isLoading, error };
};