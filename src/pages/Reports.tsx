import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RevenueChart from "@/components/charts/RevenueChart";
import UserGrowthChart from "@/components/charts/UserGrowthChart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Reports = () => {
  // 1. Fetch Top Movies (using the new view)
  const { data: topMovies, isLoading: isLoadingTopMovies } = useQuery({
    queryKey: ["topMovies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movie_sales_summary")
        .select("*")
        .order("total_revenue", { ascending: false })
        .limit(5);
      if (error) throw new Error(error.message);
      return data as { title: string, total_purchases: number, total_revenue: number }[];
    },
  });

  // 2. Fetch Top Genres (simple aggregation on client side for now)
  const { data: topGenres, isLoading: isLoadingTopGenres } = useQuery({
    queryKey: ["topGenres"],
    queryFn: async () => {
      // Fetch all movies and aggregate genres based on total purchases (as a proxy for popularity)
      const { data, error } = await supabase
        .from("movie_sales_summary")
        .select("genre, total_purchases");
      
      if (error) throw new Error(error.message);

      const genreMap = new Map<string, number>();
      data.forEach(item => {
        const genres = item.genre?.split(',').map(g => g.trim()) || [];
        genres.forEach(g => {
          if (g) {
            const currentPurchases = genreMap.get(g) || 0;
            genreMap.set(g, currentPurchases + item.total_purchases);
          }
        });
      });

      const sortedGenres = Array.from(genreMap.entries())
        .map(([genre, views]) => ({ genre, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5); // Top 5 genres

      return sortedGenres;
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Laporan & Analitik</h1>
        <p className="text-muted-foreground">Analisis performa platform Anda di sini.</p>
      </div>

      {/* Charts (Still using dummy data for now) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart />
        <UserGrowthChart />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Film Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peringkat</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Pembelian</TableHead>
                  <TableHead>Pendapatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTopMovies ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : topMovies?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center">Tidak ada data penjualan.</TableCell></TableRow>
                ) : (
                  topMovies?.map((movie, index) => (
                    <TableRow key={movie.title}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{movie.title}</TableCell>
                      <TableCell>{movie.total_purchases}</TableCell>
                      <TableCell>{formatPrice(movie.total_revenue)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Genre Paling Diminati</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Peringkat</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Total Pembelian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTopGenres ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : topGenres?.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Tidak ada data genre.</TableCell></TableRow>
                ) : (
                  topGenres?.map((genre, index) => (
                    <TableRow key={genre.genre}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{genre.genre}</TableCell>
                      <TableCell>{genre.views.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;