import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Film, CheckCircle, DollarSign, ArrowUpRight } from "lucide-react";
import RevenueChart from "@/components/charts/RevenueChart";
import UserGrowthChart from "@/components/charts/UserGrowthChart";

const Dashboard = () => {
  const recentTransactions = [
    { id: "TRX001", user: "John Doe", movie: "Action Movie 1", amount: "Rp 50.000", status: "Sukses" },
    { id: "TRX002", user: "Jane Smith", movie: "Comedy Movie 2", amount: "Rp 45.000", status: "Sukses" },
    { id: "TRX003", user: "Peter Jones", movie: "Sci-Fi Movie 3", amount: "Rp 55.000", status: "Sukses" },
    { id: "TRX004", user: "Mary Johnson", movie: "Horror Movie 4", amount: "Rp 40.000", status: "Sukses" },
    { id: "TRX005", user: "Chris Lee", movie: "Drama Movie 5", amount: "Rp 50.000", status: "Sukses" },
  ];

  const newMovies = [
    { title: "The Grand Adventure", genre: "Adventure", releaseDate: "2024-07-15" },
    { title: "Cybernetic Dreams", genre: "Sci-Fi", releaseDate: "2024-07-12" },
    { title: "Laugh Riot", genre: "Comedy", releaseDate: "2024-07-10" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Selamat datang kembali, Admin!</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/movies">Tambah Film Baru</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/users">Kelola Pengguna</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/reports">Lihat Laporan</Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,250</div>
            <p className="text-xs text-muted-foreground">+20.1% dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Film</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">350</div>
            <p className="text-xs text-muted-foreground">+10 dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Sukses</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,430</div>
            <p className="text-xs text-muted-foreground">+15.2% dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp 250.000.000</div>
            <p className="text-xs text-muted-foreground">+5.2% dari bulan lalu</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
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
                {recentTransactions.map((trx) => (
                  <TableRow key={trx.id}>
                    <TableCell className="font-medium">{trx.id}</TableCell>
                    <TableCell>{trx.user}</TableCell>
                    <TableCell>{trx.movie}</TableCell>
                    <TableCell>{trx.amount}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
                        {trx.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Film Baru Ditambahkan</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {newMovies.map((movie, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{movie.title}</p>
                  <p className="text-sm text-muted-foreground">{movie.genre}</p>
                </div>
                <p className="text-sm text-muted-foreground">{movie.releaseDate}</p>
              </div>
            ))}
             <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link to="/movies" className="flex w-full items-center justify-center">
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