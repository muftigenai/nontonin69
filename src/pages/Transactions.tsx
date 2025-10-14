import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Search, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@/types";

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions", searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase.from("transactions").select(`
        id,
        created_at,
        description,
        payment_method,
        amount,
        status,
        user_details ( email, full_name ),
        movies ( title )
      `);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (searchTerm) {
        // This is a bit tricky as we're searching on a related table.
        // For simplicity, this example won't implement search on user email directly.
        // A more advanced solution would use an RPC function in Supabase.
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as Transaction[];
    },
  });

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transaksi</h1>
          <p className="text-muted-foreground">Lihat dan kelola riwayat transaksi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari ID atau pengguna..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled // Disabled for now as search on related tables is complex
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="successful">Sukses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Gagal</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pengguna</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Memuat data transaksi...
                </TableCell>
              </TableRow>
            ) : (
              transactions?.map((trx) => (
                <TableRow key={trx.id}>
                  <TableCell>
                    <div className="font-medium">{trx.user_details?.full_name || "N/A"}</div>
                    <div className="text-sm text-muted-foreground">{trx.user_details?.email}</div>
                  </TableCell>
                  <TableCell>{trx.description || trx.movies?.title || "N/A"}</TableCell>
                  <TableCell>Rp {trx.amount.toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(trx.status)}>{trx.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(trx.created_at).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Buka menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Lihat Detail</DropdownMenuItem>
                        <DropdownMenuItem>Ubah Status</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Transactions;