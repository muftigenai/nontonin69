import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { showSuccess, showError } from "@/utils/toast";
import { addDays } from "date-fns";
import { useState } from "react";
import QrisPaymentDialog from "@/components/public/QrisPaymentDialog";

type SubscriptionPeriod = 'monthly' | 'annual';

const SubscribePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<{ price: number; period: SubscriptionPeriod; description: string } | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("key, value");
      if (error) throw new Error(error.message);
      return data.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);
    },
  });

  const monthlyPrice = settings?.monthly_price ? Number(settings.monthly_price) : 0;
  const annualPrice = settings?.annual_price ? Number(settings.annual_price) : 0;

  // Mutation untuk memproses pembaruan profil dan transaksi setelah pembayaran sukses
  const subscriptionMutation = useMutation({
    mutationFn: async ({ price, period }: { price: number; period: SubscriptionPeriod }) => {
      if (!user) throw new Error("Anda harus login untuk berlangganan.");

      const days = period === 'monthly' ? 30 : 365;
      const endDate = addDays(new Date(), days).toISOString();
      const description = `Langganan Premium ${period === 'monthly' ? 'Bulanan' : 'Tahunan'}`;

      // 1. Record Transaction (Status successful since this is called after successful simulation)
      const transactionData = {
        user_id: user.id,
        description: description,
        payment_method: "QRIS Sandbox",
        amount: price,
        status: "successful",
      };

      const { error: trxError } = await supabase.from("transactions").insert(transactionData);
      if (trxError) throw new Error(`Gagal membuat transaksi: ${trxError.message}`);

      // 2. Update Profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          subscription_status: "premium", 
          subscription_end_date: endDate 
        })
        .eq("id", user.id);

      if (profileError) throw new Error(`Gagal memperbarui profil: ${profileError.message}`);
    },
    onSuccess: () => {
      showSuccess("Langganan Premium berhasil diaktifkan!");
      queryClient.invalidateQueries({ queryKey: ["userProfile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setIsPaymentDialogOpen(false);
      navigate("/account");
    },
    onError: (error: Error) => {
      showError(`Gagal berlangganan: ${error.message}`);
      setIsPaymentDialogOpen(false);
    },
  });

  const handleInitiatePayment = (price: number, period: SubscriptionPeriod) => {
    if (!user) {
        showError("Anda harus login untuk memulai pembayaran.");
        navigate("/login");
        return;
    }
    const description = `Paket ${period === 'monthly' ? 'Bulanan' : 'Tahunan'}`;
    setCurrentPayment({ price, period, description });
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    if (currentPayment) {
        // Trigger the mutation to update Supabase profile and record transaction
        subscriptionMutation.mutate({ price: currentPayment.price, period: currentPayment.period });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const features = [
    "Akses semua film langganan",
    "Tonton tanpa iklan",
    "Kualitas video hingga 4K",
    "Dukungan prioritas",
  ];

  const renderPlanCard = (
    title: string,
    price: number,
    period: 'bulan' | 'tahun',
    periodKey: SubscriptionPeriod,
    isPopular: boolean = false
  ) => (
    <Card className={cn("flex flex-col", isPopular && "border-primary")}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {isLoading ? (
            <Skeleton className="h-10 w-3/4" />
          ) : (
            <span className="text-4xl font-bold">{formatPrice(price)}</span>
          )}
          <span className="text-muted-foreground">/{period}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="text-sm text-muted-foreground">
          Semua yang Anda butuhkan untuk menikmati pengalaman menonton terbaik.
        </p>
        <ul className="space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          disabled={isLoading || subscriptionMutation.isPending}
          onClick={() => handleInitiatePayment(price, periodKey)}
        >
          {subscriptionMutation.isPending ? "Memproses..." : "Pilih Paket"}
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Kembali</span>
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-4xl font-bold tracking-tight">Pilih Paket Langganan Anda</h1>
            <p className="text-muted-foreground mt-2">
              Dapatkan akses tak terbatas ke semua film langganan kami.
            </p>
          </div>
          <div className="h-8 w-8 flex-shrink-0" /> {/* Placeholder for alignment */}
        </div>
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          {renderPlanCard("Bulanan", monthlyPrice, "bulan", "monthly")}
          {renderPlanCard("Tahunan", annualPrice, "tahun", "annual", true)}
        </div>
      </div>
      
      {currentPayment && (
        <QrisPaymentDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          onPaymentSuccess={handlePaymentSuccess}
          amount={currentPayment.price}
          description={currentPayment.description}
        />
      )}
    </>
  );
};

export default SubscribePage;