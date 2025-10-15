import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RevenueChart from "@/components/charts/RevenueChart";
import UserGrowthChart from "@/components/charts/UserGrowthChart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const useReportData = () => {
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["allSuccessfulTransactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`amount, movies(id, title, genre)`)
        .eq("status", "successful");
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const aggregatedData = useMemo(() => {
    if (!transactions) return { topMovies: [], topGenres: [] };

    const movieStats = new Map<string, { title: string; purchases: number; revenue: number; genre: string | null }>();
    const genreStats = new Map<string, number>();

    transactions.forEach(trx => {
      const movie = trx.movies;
      if (movie) {
        // Movie Stats
        const currentMovie = movieStats.get(movie.id) || { title: movie.title || "N/A", purchases: 0, revenue: 0, genre: movie.genre };
        currentMovie.purchases += 1;
        currentMovie.revenue += trx.amount;
        movieStats.set(movie.id, currentMovie);

        // Genre Stats (using purchases as 'views' for simplicity)
        if (movie.genre) {
          const genres = movie.genre.split(',').map(g => g.trim());
          genres.forEach(g => {
            const currentViews = genreStats.get(g) || 0;
            genreStats.set(g, currentViews + 1);
          });
        }
      }
    });

    const topMovies = Array.from(movieStats.values())
      .sort((a, b) => b.purchases - a.purchases)
      .slice(0, 5)
      .map((m, index) => ({ ...m, rank: index + 1 }));

    const topGenres = Array.from(genreStats.entries())
      .map(([genre, views]) => ({ genre, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((g, index) => ({ ...g, rank: index + 1 }));

    return { topMovies, topGenres };
  }, [transactions]);

  return { data: aggregatedData, isLoading: isLoadingTransactions };
};

const Reports = () => {
  const { data, isLoading } = useReportData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Laporan & Analitik</h1>
        <p className="text-muted-foreground">Analisis performa platform Anda di sini.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart />
        <UserGrowthChart />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Film Terlaris (Berdasarkan Pembelian)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
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
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                    ))
                  ) : data?.topMovies.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Tidak ada data pembelian.</TableCell></TableRow>
                  ) : (
                    data?.topMovies.map((movie) => (
                      <TableRow key={movie.rank}>
                        <TableCell>{movie.rank}</TableCell>
                        <TableCell className="font-medium">{movie.title}</TableCell>
                        <TableCell>{movie.purchases}</TableCell>
                        <TableCell>{formatCurrency(movie.revenue)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Genre Paling Diminati (Berdasarkan Pembelian)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Peringkat</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Total Pembelian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={3}><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                    ))
                  ) : data?.topGenres.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Tidak ada data genre.</TableCell></TableRow>
                  ) : (
                    data?.topGenres.map((genre) => (
                      <TableRow key={genre.rank}>
                        <TableCell>{genre.rank}</TableCell>
                        <TableCell className="font-medium">{genre.genre}</TableCell>
                        <TableCell>{genre.views.toLocaleString("id-ID")}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;