"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data: { month: string; users: number }[] = []; // Data direset menjadi kosong

const UserGrowthChart = () => {
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
        {data.length === 0 && (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            Data pertumbuhan pengguna belum tersedia.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserGrowthChart;