import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Film, CheckCircle, DollarSign, ArrowUpRight } from "lucide-react";
import RevenueChart from "@/components/charts/RevenueChart";
import UserGrowthChart from "@/components/charts/UserGrowthChart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  // 1. Fetch Summary Data
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: async () => {
      // Total Users (from user_details view)
      const { count: userCount, error: userError } = await supabase.from("user_details").select("*", { count: 'exact', head: true });
      if (userError) console.error("Error fetching user count:", userError);

      // Total Movies
      const { count: movieCount, error: movieError } = await supabase.from("movies").select("*", { count: 'exact', head: true });
      if (movieError) console.error("Error fetching movie count:", movieError);

      // Total Successful Transactions & Revenue
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("amount")
        .eq("status", "successful");
      
      if (transactionError) console.error("Error fetching transactions:", transactionError);

      const successfulTransactionCount = transactionData?.length || 0;
      const totalRevenue = transactionData?.reduce((sum, trx) => sum + trx.amount, 0) || 0;

      return {
        totalUsers: userCount || 0,
        totalMovies: movieCount || 0,
        successfulTransactions: successfulTransactionCount,
        totalRevenue: totalRevenue,
      };
    },
  });

  // 2. Fetch Recent Transactions
  const { data: recentTransactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["recentTransactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          id,
          created_at,
          amount,
          status,
          user_details ( full_name ),
          movies ( title )
        `)
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) throw new Error(error.message);
      return data as Transaction[];
    },
  });

  // 3. Fetch New Movies
  const { data: newMovies, isLoading: isLoadingNewMovies } = useQuery({
    queryKey: ["newMovies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("title, genre, release_date")
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (error) throw new Error(error.message);
      return data as { title: string, genre: string | null, release_date: string | null }[];
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "successful":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const renderSummaryCard = (title: string, value: number | string, Icon: React.ElementType) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoadingSummary ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">+0% dari bulan lalu</p>
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
        {renderSummaryCard("Total Pengguna", summary?.totalUsers.toLocaleString("id-ID") || "...", Users)}
        {renderSummaryCard("Total Film", summary?.totalMovies.toLocaleString("id-ID") || "...", Film)}
        {renderSummaryCard("Transaksi Sukses", summary?.successfulTransactions.toLocaleString("id-ID") || "...", CheckCircle)}
        {renderSummaryCard("Total Pendapatan", formatPrice(summary?.totalRevenue || 0), DollarSign)}
      </div>

      {/* Charts (Still using dummy data for now) */}
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
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : recentTransactions?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Tidak ada transaksi terbaru.</TableCell></TableRow>
                ) : (
                  recentTransactions?.map((trx) => (
                    <TableRow key={trx.id}>
                      <TableCell className="font-medium truncate max-w-[100px]">{trx.id}</TableCell>
                      <TableCell>{trx.user_details?.full_name || "N/A"}</TableCell>
                      <TableCell>{trx.movies?.title || "N/A"}</TableCell>
                      <TableCell>{formatPrice(trx.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(trx.status)}>
                          {trx.status}
                        </Badge>
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
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : newMovies?.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada film baru.</p>
            ) : (
              newMovies?.map((movie, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{movie.title}</p>
                    <p className="text-sm text-muted-foreground">{movie.genre}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{new Date(movie.release_date || "").toLocaleDateString("id-ID")}</p>
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