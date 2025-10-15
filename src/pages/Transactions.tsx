import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Search, Download, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Transaction } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/utils/toast";

const Transactions = () => {
  const queryClient = useQueryClient();
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
        user_id,
        user_details ( email, full_name, subscription_status ),
        movies ( title )
      `);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (searchTerm) {
        // Search on ID or description
        query = query.or(`id.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as Transaction[];
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (userId: string) => {
      // 1. Update subscription status to 'free' in profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ subscription_status: "free" })
        .eq("id", userId);
      
      if (profileError) throw new Error(profileError.message);

      // 2. Log activity (optional, but good practice)
      // Note: We don't have an activity log table defined here, so we skip logging for simplicity.
    },
    onSuccess: () => {
      showSuccess("Langganan pengguna berhasil dibatalkan. Akses premium telah dicabut.");
      // Invalidate transactions and user data (which includes profiles)
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      showError(`Gagal membatalkan langganan: ${error.message}`);
    },
  });

  const handleCancelSubscription = (userId: string, userName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin membatalkan langganan premium untuk ${userName}? Tindakan ini akan mencabut akses premium mereka segera.`)) {
      cancelSubscriptionMutation.mutate(userId);
    }
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
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
              placeholder="Cari ID atau deskripsi..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
          <Button variant="outline" className="flex items-center gap-2" disabled>
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
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : transactions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Tidak ada data transaksi.
                </TableCell>
              </TableRow>
            ) : (
              transactions?.map((trx) => {
                // Check if the transaction description contains "langganan" (case-insensitive)
                const isSubscriptionTransaction = trx.description?.toLowerCase().includes("langganan");
                // Check if the user currently has a premium subscription status
                const isPremiumActive = trx.user_details?.subscription_status === 'premium';
                const userName = trx.user_details?.full_name || trx.user_details?.email || "Pengguna";

                // We only show the cancel button if:
                // 1. It was a successful subscription transaction (or just a successful transaction)
                // 2. The user currently holds a premium status (to prevent canceling an already free account)
                const showCancelButton = isSubscriptionTransaction && isPremiumActive && trx.user_id && trx.status === 'successful';

                return (
                  <TableRow key={trx.id}>
                    <TableCell>
                      <div className="font-medium">{trx.user_details?.full_name || "N/A"}</div>
                      <div className="text-sm text-muted-foreground">{trx.user_details?.email}</div>
                    </TableCell>
                    <TableCell>{trx.description || trx.movies?.title || "N/A"}</TableCell>
                    <TableCell>{formatPrice(trx.amount)}</TableCell>
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
                          {showCancelButton && (
                            <>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleCancelSubscription(trx.user_id!, userName)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Batalkan Langganan
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Transactions;