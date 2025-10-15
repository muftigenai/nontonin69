import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Film, CheckCircle, DollarSign, ArrowUpRight } from "lucide-react";
import RevenueChart from "@/components/charts/RevenueChart";
import UserGrowthChart from "@/components/charts/UserGrowthChart";
import { useDashboardSummary, useRecentTransactions, useNewMovies } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { summary, isLoading: isLoadingSummary } = useDashboardSummary();
  const { recentTransactions, isLoading: isLoadingTransactions } = useRecentTransactions();
  const { newMovies, isLoading: isLoadingNewMovies } = useNewMovies();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderSummaryCard = (title: string, value: number | string, icon: React.ElementType) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {React.createElement(icon, { className: "h-4 w-4 text-muted-foreground" })}
      </CardContent>
      <CardContent>
        {isLoadingSummary ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">Data dari database</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang kembali, Admin!</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/admin/movies">Tambah Film Baru</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/admin/users">Kelola Pengguna</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/admin/reports">Lihat Laporan</Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {renderSummaryCard("Total Pengguna", summary?.totalUsers.toLocaleString("id-ID") || "0", Users)}
        {renderSummaryCard("Total Film Aktif", summary?.totalMovies.toLocaleString("id-ID") || "0", Film)}
        {renderSummaryCard("Transaksi Sukses", summary?.successfulTransactions.toLocaleString("id-ID") || "0", CheckCircle)}
        {renderSummaryCard("Total Pendapatan", formatCurrency(summary?.totalRevenue || 0), DollarSign)}
      </div>

      {/* Charts (Still using mock data, will update next) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart />
        <UserGrowthChart />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>5 Transaksi Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Film</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTransactions ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Memuat transaksi...</TableCell></TableRow>
                ) : recentTransactions?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Tidak ada transaksi terbaru.</TableCell></TableRow>
                ) : (
                  recentTransactions?.map((trx: any) => (
                    <TableRow key={trx.id}>
                      <TableCell className="font-medium truncate max-w-[100px]">{trx.id.substring(0, 8)}...</TableCell>
                      <TableCell>{trx.user_details?.full_name || "N/A"}</TableCell>
                      <TableCell>{trx.movies?.title || "N/A"}</TableCell>
                      <TableCell>{formatCurrency(trx.amount)}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-1 text-xs ${trx.status === 'successful' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {trx.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Film Baru Ditambahkan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {isLoadingNewMovies ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : newMovies?.length === 0 ? (
              <p className="text-muted-foreground text-sm">Tidak ada film baru.</p>
            ) : (
              newMovies?.map((movie: any, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{movie.title}</p>
                    <p className="text-sm text-muted-foreground">{movie.genre}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{new Date(movie.release_date).toLocaleDateString("id-ID")}</p>
                </div>
              ))
            )}
             <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link to="/admin/movies" className="flex w-full items-center justify-center">
                Lihat Semua Film <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;