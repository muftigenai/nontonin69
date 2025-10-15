"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

type RevenueData = {
  month: string;
  revenue: number;
};

const fetchRevenueData = async (): Promise<RevenueData[]> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("created_at, amount")
    .eq("status", "successful")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const monthlyRevenueMap = new Map<string, number>();

  data.forEach(trx => {
    const date = new Date(trx.created_at);
    // Format: Jan 24, Feb 24, etc.
    const monthKey = format(date, "MMM yy", { locale: id });
    
    const currentRevenue = monthlyRevenueMap.get(monthKey) || 0;
    monthlyRevenueMap.set(monthKey, currentRevenue + trx.amount);
  });

  // Convert map to array of objects
  const chartData = Array.from(monthlyRevenueMap.entries()).map(([month, revenue]) => ({
    month,
    revenue,
  }));

  return chartData;
};

const RevenueChart = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["revenueChartData"],
    queryFn: fetchRevenueData,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Pendapatan per Bulan</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Pendapatan per Bulan</CardTitle></CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-red-500">
          Gagal memuat data pendapatan: {error.message}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pendapatan per Bulan</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12} 
              tickFormatter={(value) => `Rp${(value / 1000000).toFixed(1)}Jt`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
              }}
              formatter={(value) => [new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value as number), "Pendapatan"]}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {data?.length === 0 && (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            Data pendapatan belum tersedia.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueChart;