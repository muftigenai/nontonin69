import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setStatus('pending');
      setCountdown(10);
      return;
    }

    if (status === 'pending') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Simulate successful payment after countdown
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

          {/* Dummy QR Code */}
          <div className={cn("aspect-square w-48 rounded-lg border-4 border-primary p-2 bg-white", status === 'successful' && 'opacity-50')}>
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QRIS_logo.png" 
              alt="QRIS Code" 
              className="h-full w-full object-contain"
            />
          </div>

          {renderStatus()}
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={() => onOpenChange(false)} 
            variant={status === 'successful' ? 'default' : 'outline'}
            disabled={status === 'pending'}
          >
            {status === 'successful' ? 'Lanjut ke Akun' : 'Batal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrisPaymentDialog;