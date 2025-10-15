"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

type UserGrowthData = {
  month: string;
  users: number;
};

const fetchUserGrowthData = async (): Promise<UserGrowthData[]> => {
  // Mengambil data dari view user_details yang mencakup created_at dari auth.users
  const { data, error } = await supabase
    .from("user_details")
    .select("created_at")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const monthlyUserCountMap = new Map<string, number>();
  let cumulativeUsers = 0;

  data.forEach(user => {
    const date = new Date(user.created_at);
    const monthKey = format(date, "MMM yy", { locale: id });
    
    // Hitung jumlah pengguna baru per bulan
    const currentCount = monthlyUserCountMap.get(monthKey) || 0;
    monthlyUserCountMap.set(monthKey, currentCount + 1);
  });

  // Hitung pertumbuhan kumulatif
  const chartData: UserGrowthData[] = [];
  
  // Sort keys to ensure chronological order
  const sortedKeys = Array.from(monthlyUserCountMap.keys()).sort((a, b) => {
    const dateA = new Date(a.replace(' ', ' 20')); // Simple hack for sorting 'MMM yy'
    const dateB = new Date(b.replace(' ', ' 20'));
    return dateA.getTime() - dateB.getTime();
  });

  sortedKeys.forEach(month => {
    const newUsers = monthlyUserCountMap.get(month) || 0;
    cumulativeUsers += newUsers;
    chartData.push({ month, users: cumulativeUsers });
  });

  return chartData;
};

const UserGrowthChart = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["userGrowthChartData"],
    queryFn: fetchUserGrowthData,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Pertumbuhan Pengguna</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Pertumbuhan Pengguna</CardTitle></CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-red-500">
          Gagal memuat data pertumbuhan: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pertumbuhan Pengguna</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
              }}
              formatter={(value) => [value, "Total Pengguna"]}
            />
            <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        {data?.length === 0 && (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            Data pertumbuhan pengguna belum tersedia.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserGrowthChart;