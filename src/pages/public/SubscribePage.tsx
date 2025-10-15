import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SubscribePage = () => {
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
    period: string,
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
        <Button className="w-full" disabled={isLoading}>
          Pilih Paket
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Pilih Paket Langganan Anda</h1>
        <p className="text-muted-foreground mt-2">
          Dapatkan akses tak terbatas ke semua film langganan kami.
        </p>
      </div>
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        {renderPlanCard("Bulanan", monthlyPrice, "bulan")}
        {renderPlanCard("Tahunan", annualPrice, "tahun", true)}
      </div>
    </div>
  );
};

export default SubscribePage;