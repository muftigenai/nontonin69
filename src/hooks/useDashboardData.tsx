import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type DashboardSummary = {
  totalUsers: number;
  totalMovies: number;
  successfulTransactions: number;
  totalRevenue: number;
};

export const useDashboardSummary = () => {
  const { data, isLoading, error } = useQuery<DashboardSummary>({
    queryKey: ["dashboardSummary"],
    queryFn: async () => {
      // 1. Total Users (from user_details view)
      const { count: userCount, error: userError } = await supabase
        .from("user_details")
        .select("*", { count: "exact", head: true });
      if (userError) throw new Error(userError.message);

      // 2. Total Movies (active)
      const { count: movieCount, error: movieError } = await supabase
        .from("movies")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      if (movieError) throw new Error(movieError.message);

      // 3. Successful Transactions & Total Revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from("transactions")
        .select("amount")
        .eq("status", "successful");
      
      if (revenueError) throw new Error(revenueError.message);

      const successfulTransactions = revenueData.length;
      const totalRevenue = revenueData.reduce((sum, trx) => sum + trx.amount, 0);

      return {
        totalUsers: userCount || 0,
        totalMovies: movieCount || 0,
        successfulTransactions,
        totalRevenue,
      };
    },
  });

  return { summary: data, isLoading, error };
};

// Hook untuk mengambil 5 transaksi terakhir
export const useRecentTransactions = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["recentTransactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          id,
          amount,
          status,
          user_details ( full_name ),
          movies ( title )
        `)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw new Error(error.message);
      return data;
    },
  });

  return { recentTransactions: data, isLoading, error };
};

// Hook untuk mengambil 3 film terbaru
export const useNewMovies = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["newMovies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select(`title, genre, release_date`)
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (error) throw new Error(error.message);
      return data;
    },
  });

  return { newMovies: data, isLoading, error };
};