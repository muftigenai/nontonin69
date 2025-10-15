import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "../ui/skeleton";

interface QrisPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess: () => void;
  amount: number;
  description: string;
}

const QrisPaymentDialog = ({ open, onOpenChange, onPaymentSuccess, amount, description }: QrisPaymentDialogProps) => {
  const [status, setStatus] = useState<'pending' | 'successful' | 'failed'>('pending');
  const [countdown, setCountdown] = useState(10);

  const { data: qrisImageUrl, isLoading: isLoadingQris } = useQuery({
    queryKey: ["app_settings_qris"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "qris_image_url")
        .single();
      
      if (error && error.code !== 'PGRST116') { // Ignore error if row not found
        throw new Error(error.message);
      }
      return data?.value || null;
    },
  });

  useEffect(() => {
    if (!open) {
      setStatus('pending');
      setCountdown(10);
      return;
    }

    if (status === 'pending') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setStatus('successful');
            onPaymentSuccess();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [open, status, onPaymentSuccess]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderStatus = () => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center justify-center gap-2 text-yellow-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Menunggu Pembayaran... ({countdown}s)</span>
          </div>
        );
      case 'successful':
        return (
          <div className="flex items-center justify-center gap-2 text-green-500">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Pembayaran Berhasil ✅️</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center justify-center gap-2 text-red-500">
            <XCircle className="h-5 w-5" />
            <span className="font-semibold">Pembayaran Gagal</span>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pembayaran QRIS Sandbox</DialogTitle>
          <DialogDescription>
            Pindai kode QR di bawah ini untuk menyelesaikan pembayaran. (Simulasi 10 detik)
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 p-4">
          <div className="w-full rounded-lg border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Pembayaran</p>
            <p className="text-3xl font-bold text-primary">{formatPrice(amount)}</p>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>

          <div className={cn("aspect-square w-48 rounded-lg border-4 border-primary p-2 bg-white flex items-center justify-center", status === 'successful' && 'opacity-50')}>
            {isLoadingQris ? (
              <Skeleton className="h-full w-full" />
            ) : qrisImageUrl ? (
              <img 
                src={qrisImageUrl} 
                alt="QRIS Code" 
                className="h-full w-full object-contain"
              />
            ) : (
              <p className="text-xs text-center text-muted-foreground">Kode QRIS tidak tersedia. Hubungi admin.</p>
            )}
          </div>

          {renderStatus()}
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={() => onOpenChange(false)} 
            variant={status === 'successful' ? 'default' : 'outline'}
            disabled={status === 'successful'}
          >
            {status === 'successful' ? 'Lanjut' : 'Batal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrisPaymentDialog;