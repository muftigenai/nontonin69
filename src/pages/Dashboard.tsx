import StatCard from "@/components/StatCard";
import RevenueChart from "@/components/charts/RevenueChart";
import UserGrowthChart from "@/components/charts/UserGrowthChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Film, Users, DollarSign, CreditCard, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button asChild><Link to="/movies">Tambah Film Baru</Link></Button>
          <Button variant="outline" asChild><Link to="/users">Kelola Pengguna</Link></Button>
          <Button variant="outline" asChild><Link to="/reports">Lihat Laporan</Link></Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Pengguna" value="1,250" icon={Users} />
        <StatCard title="Total Film" value="150" icon={Film} />
        <StatCard title="Transaksi Sukses" value="5,320" icon={CreditCard} />
        <StatCard title="Total Pendapatan (Bulan Ini)" value="Rp 120.5M" icon={DollarSign} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RevenueChart />
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Transaksi Terakhir</CardTitle>
            <CardDescription>
              Ada 5 transaksi baru bulan ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for recent transactions */}
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Pengguna A</p>
                  <p className="text-sm text-muted-foreground">
                    Membeli "Film X"
                  </p>
                </div>
                <div className="ml-auto font-medium">+Rp 50.000</div>
              </div>
               <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Pengguna B</p>
                  <p className="text-sm text-muted-foreground">
                    Membeli "Film Y"
                  </p>
                </div>
                <div className="ml-auto font-medium">+Rp 50.000</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;