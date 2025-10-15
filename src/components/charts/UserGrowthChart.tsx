"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

type MonthlyUsers = {
  month: string;
  users: number;
};

const useMonthlyUserGrowth = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["monthlyUserGrowth"],
    queryFn: async () => {
      // Ambil semua pengguna yang terdaftar dalam 6 bulan terakhir
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Menggunakan tabel user_details yang memiliki created_at
      const { data, error } = await supabase
        .from("user_details")
        .select("created_at")
        .gte("created_at", sixMonthsAgo.toISOString());

      if (error) throw new Error(error.message);
      return data;
    },
  });

  const aggregatedData = useMemo(() => {
    if (!data) return [];

    const monthlyMap = new Map<string, number>();

    data.forEach(user => {
      const monthKey = format(new Date(user.created_at), "MMM yyyy", { locale: id });
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
    });

    // Urutkan berdasarkan tanggal
    const sortedKeys = Array.from(monthlyMap.keys()).sort((a, b) => {
      const dateA = new Date(a.replace(/(\w{3}) (\d{4})/, "1 $1 $2"));
      const dateB = new Date(b.replace(/(\w{3}) (\d{4})/, "1 $1 $2"));
      return dateA.getTime() - dateB.getTime();
    });

    // Hitung pertumbuhan kumulatif
    let cumulativeUsers = 0;
    return sortedKeys.map(key => {
      cumulativeUsers += monthlyMap.get(key) || 0;
      return {
        month: format(new Date(key.replace(/(\w{3}) (\d{4})/, "1 $1 $2")), "MMM", { locale: id }),
        users: cumulativeUsers,
      };
    });
  }, [data]);

  return { data: aggregatedData, isLoading, error };
};

const UserGrowthChart = () => {
  const { data, isLoading } = useMonthlyUserGrowth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Pertumbuhan Pengguna</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
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
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
              }}
            />
            <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default UserGrowthChart;