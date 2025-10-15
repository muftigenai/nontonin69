import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RevenueChart from "@/components/charts/RevenueChart";
import UserGrowthChart from "@/components/charts/UserGrowthChart";

const Reports = () => {
  const topMovies = [
    { rank: 1, title: "Action Movie 1", purchases: 1200, revenue: "Rp 60.000.000" },
    { rank: 2, title: "Comedy Movie 2", purchases: 950, revenue: "Rp 42.750.000" },
    { rank: 3, title: "Sci-Fi Movie 3", purchases: 800, revenue: "Rp 44.000.000" },
    { rank: 4, title: "Horror Movie 4", purchases: 750, revenue: "Rp 30.000.000" },
    { rank: 5, title: "Drama Movie 5", purchases: 600, revenue: "Rp 30.000.000" },
  ];

  const topGenres = [
    { rank: 1, genre: "Action", views: 15000 },
    { rank: 2, genre: "Comedy", views: 12000 },
    { rank: 3, genre: "Sci-Fi", views: 10000 },
  ];

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
                {topMovies.map((movie) => (
                  <TableRow key={movie.rank}>
                    <TableCell>{movie.rank}</TableCell>
                    <TableCell className="font-medium">{movie.title}</TableCell>
                    <TableCell>{movie.purchases}</TableCell>
                    <TableCell>{movie.revenue}</TableCell>
                  </TableRow>
                ))}
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
                  <TableHead>Total Penonton</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topGenres.map((genre) => (
                  <TableRow key={genre.rank}>
                    <TableCell>{genre.rank}</TableCell>
                    <TableCell className="font-medium">{genre.genre}</TableCell>
                    <TableCell>{genre.views.toLocaleString("id-ID")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;