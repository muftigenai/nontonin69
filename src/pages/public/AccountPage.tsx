import { useAuth } from "@/providers/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Transaction } from "@/types";
import { useState } from "react";
import EditProfileDialog from "@/components/public/EditProfileDialog";
import ChangePasswordDialog from "@/components/public/ChangePasswordDialog"; // Import komponen baru
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const AccountPage = () => {
  const { user } = useAuth();
  const { profile, isLoading: isLoadingProfile } = useUserProfile();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false); // State baru
  const navigate = useNavigate();

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["user_transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("id, created_at, description, amount, status, movies(title)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data as Transaction[];
    },
    enabled: !!user,
  });

  const getInitials = (name?: string | null) => {
    if (!name) return user?.email?.[0].toUpperCase() ?? "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
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

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Kembali</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Akun Saya</h1>
            <p className="text-muted-foreground">Kelola informasi profil dan langganan Anda.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Profile & Subscription Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profil</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                Edit Profil
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingProfile ? (
                <div className="flex flex-col items-center space-y-4">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-3xl">{getInitials(profile?.full_name)}</AvatarFallback>
                  </Avatar>
                  <h2 className="mt-4 text-2xl font-semibold">{profile?.full_name || "Pengguna Baru"}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              )}
              <Button variant="secondary" className="w-full" onClick={() => setIsPasswordDialogOpen(true)}>
                Ganti Kata Sandi
              </Button>
              <Separator />
              <div>
                <h3 className="font-semibold">Status Langganan</h3>
                {isLoadingProfile ? (
                  <div className="space-y-2 mt-2">
                      <Skeleton className="h-6 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={profile?.isPremiumActive ? 'default' : 'secondary'}>
                        {profile?.isPremiumActive ? 'Aktif' : 'Tidak Aktif'}
                      </Badge>
                    </div>
                    {profile?.isPremiumActive && profile.subscription_end_date && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Berakhir pada: {format(new Date(profile.subscription_end_date), "dd MMMM yyyy", { locale: idLocale })}
                      </p>
                    )}
                  </>
                )}
              </div>
              <Button className="w-full" asChild>
                <Link to="/subscribe">
                  {profile?.isPremiumActive ? 'Kelola Langganan' : 'Perpanjang Langganan'}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Transaction History Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Histori Transaksi</CardTitle>
              <CardDescription>Berikut adalah riwayat pembelian Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTransactions ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        </TableRow>
                      ))
                    ) : transactions?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">
                          Anda belum memiliki transaksi.
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions?.map((trx) => (
                        <TableRow key={trx.id}>
                          <TableCell>{new Date(trx.created_at).toLocaleDateString("id-ID")}</TableCell>
                          <TableCell>{trx.description || trx.movies?.title || "N/A"}</TableCell>
                          <TableCell>Rp {trx.amount.toLocaleString("id-ID")}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(trx.status)}>{trx.status}</Badge>
                          </TableCell>
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
      {isEditDialogOpen && (
        <EditProfileDialog
          profile={profile}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
      {isPasswordDialogOpen && (
        <ChangePasswordDialog
          open={isPasswordDialogOpen}
          onOpenChange={setIsPasswordDialogOpen}
        />
      )}
    </>
  );
};

export default AccountPage;