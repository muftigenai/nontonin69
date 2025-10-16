import { useAuth } from "@/providers/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ShieldOff, Loader2, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CancelSubscriptionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading: isLoadingProfile } = useUserProfile();
  const queryClient = useQueryClient();

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Pengguna tidak terautentikasi.");

      // 1. Update subscription status to 'free' AND clear end date
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ subscription_status: "free", subscription_end_date: null })
        .eq("id", user.id);
      
      if (profileError) throw new Error(profileError.message);
    },
    onSuccess: () => {
      showSuccess("Langganan Premium Anda berhasil dibatalkan. Akses premium telah dicabut.");
      // Invalidate profile query to reflect changes immediately
      queryClient.invalidateQueries({ queryKey: ["userProfile", user?.id] });
      navigate("/account");
    },
    onError: (error: Error) => {
      showError(`Gagal membatalkan langganan: ${error.message}`);
    },
  });

  const handleCancel = () => {
    if (window.confirm("Apakah Anda yakin ingin membatalkan langganan premium Anda? Anda akan kehilangan akses premium segera.")) {
      cancelSubscriptionMutation.mutate();
    }
  };

  if (!user) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-2xl font-semibold">Akses Ditolak</h2>
        <p className="mt-2 text-muted-foreground">Anda harus login untuk mengelola langganan.</p>
        <Button asChild className="mt-4"><Link to="/login">Login</Link></Button>
      </div>
    );
  }

  if (isLoadingProfile) {
    return <Skeleton className="h-64 w-full" />;
  }

  const isPremiumActive = profile?.isPremiumActive;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Kembali</span>
        </Button>
        <h1 className="text-3xl font-bold">Kelola Langganan Premium</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Langganan Anda</CardTitle>
          <CardDescription>Informasi mengenai paket premium Anda saat ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPremiumActive ? (
            <>
              <Alert variant="default" className="border-green-500 text-green-700">
                <CheckCircle className="h-4 w-4 !text-green-500" />
                <AlertTitle className="text-green-800">Status: Aktif</AlertTitle>
                <AlertDescription className="text-green-700">
                  Akses premium Anda berlaku hingga{" "}
                  <span className="font-semibold">
                    {format(new Date(profile!.subscription_end_date!), "dd MMMM yyyy", { locale: idLocale })}
                  </span>
                  .
                </AlertDescription>
              </Alert>

              <div className="pt-4">
                <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                    <ShieldOff className="h-5 w-5" /> Pembatalan Langganan
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Jika Anda membatalkan, akses premium Anda akan dicabut segera. Anda tidak akan ditagih lagi.
                </p>
                <Button 
                  variant="destructive" 
                  onClick={handleCancel} 
                  className="mt-4"
                  disabled={cancelSubscriptionMutation.isPending}
                >
                  {cancelSubscriptionMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Membatalkan...</>
                  ) : (
                    "Konfirmasi Pembatalan"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <Alert variant="default">
              <ShieldOff className="h-4 w-4" />
              <AlertTitle>Status: Tidak Aktif</AlertTitle>
              <AlertDescription>
                Anda saat ini tidak memiliki langganan premium aktif.{" "}
                <Link to="/subscribe" className="font-semibold underline">
                  Berlangganan sekarang
                </Link>{" "}
                untuk mendapatkan akses penuh.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CancelSubscriptionPage;