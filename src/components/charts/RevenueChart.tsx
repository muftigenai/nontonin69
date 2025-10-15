"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

type MonthlyRevenue = {
  month: string;
  revenue: number;
};

const useMonthlyRevenue = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["monthlyRevenue"],
    queryFn: async () => {
      // Ambil semua transaksi sukses dari 6 bulan terakhir
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from("transactions")
        .select("created_at, amount")
        .eq("status", "successful")
        .gte("created_at", sixMonthsAgo.toISOString());

      if (error) throw new Error(error.message);
      return data;
    },
  });

  const aggregatedData = useMemo(() => {
    if (!data) return [];

    const monthlyMap = new Map<string, number>();

    data.forEach(trx => {
      const monthKey = format(new Date(trx.created_at), "MMM yyyy", { locale: id });
      const currentRevenue = monthlyMap.get(monthKey) || 0;
      monthlyMap.set(monthKey, currentRevenue + trx.amount);
    });

    // Urutkan berdasarkan tanggal
    const sortedKeys = Array.from(monthlyMap.keys()).sort((a, b) => {
      const dateA = new Date(a.replace(/(\w{3}) (\d{4})/, "1 $1 $2"));
      const dateB = new Date(b.replace(/(\w{3}) (\d{4})/, "1 $1 $2"));
      return dateA.getTime() - dateB.getTime();
    });

    return sortedKeys.map(key => ({
      month: format(new Date(key.replace(/(\w{3}) (\d{4})/, "1 $1 $2")), "MMM", { locale: id }),
      revenue: monthlyMap.get(key) || 0,
    }));
  }, [data]);

  return { data: aggregatedData, isLoading, error };
};

const RevenueChart = () => {
  const { data, isLoading } = useMonthlyRevenue();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Pendapatan per Bulan</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
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
              tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
              }}
              formatter={(value: number) => [new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value), "Pendapatan"]}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;