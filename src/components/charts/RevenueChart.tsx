"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data: { month: string; revenue: number }[] = []; // Data direset menjadi kosong

const RevenueChart = () => {
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
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
              }}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {data.length === 0 && (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            Data pendapatan belum tersedia.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueChart;