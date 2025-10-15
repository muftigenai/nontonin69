import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { UserProfile as UserProfileType } from "@/types";

// Define the type returned by the hook, including the calculated status
type ProfileWithStatus = UserProfileType & {
    isPremiumActive: boolean;
};

export const useUserProfile = () => {
  const { user } = useAuth();

  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, full_name, avatar_url, subscription_end_date")
        .eq("id", user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
            console.warn("User profile not found for the current user.");
            return null;
        }
        throw new Error(error.message);
      }
      return data as UserProfileType;
    },
    enabled: !!user, 
  });

  // Calculate active status based on end date
  const isPremiumActive = profileData?.subscription_end_date 
    ? new Date(profileData.subscription_end_date) > new Date()
    : false;

  // Combine profile data with calculated status
  const profile = profileData ? { ...profileData, isPremiumActive } : null;

  return { profile: profile as ProfileWithStatus | null, isLoading, error };
};