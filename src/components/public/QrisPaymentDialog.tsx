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

// QRIS Dummy SVG Data URL
const QRIS_DUMMY_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMjAgMjBoMTYwdjE2MEgyMFoiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzIyMjIiIHN0cm9rZS13aWR0aD0iOCIvPjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMjIyMiIvPjxyZWN0IHg9IjEzMCIgeT0iMzAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzIyMjIiLz48cmVjdCB4PSIzMCIgeT0iMTMwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiMyMjIyIi8+PHJlY3QgeD0iMTMwIiB5PSIxMzAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzIyMjIiLz48cmVjdCB4PSI4MCIgeT0iNzAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzIyMjIiLz48cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzIyMjIiLz48cmVjdCB4PSIxNTAiIHk9IjUwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIi8+PHJlY3QgeD0iNTAiIHk9IjE1MCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjIyMiIvPjxyZWN0IHg9IjE1MCIgeT0iMTUwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIi8+PHJlY3QgeD0iMTAwIiB5PSIxMDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzIyMjIiLz48cmVjdCB4PSI4MCIgeT0iMTAwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIi8+PHJlY3QgeD0iMTAwIiB5PSI4MCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjIyMiIvPjxyZWN0IHg9IjEyMCIgeT0iODAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzIyMjIiLz48cmVjdCB4PSI4MCIgeT0iMTIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIiIvPjxyZWN0IHg9IjEyMCIgeT0iMTIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIiIvPjxyZWN0IHg9IjE0MCIgeT0iMTAwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIiIvPjxyZWN0IHg9IjE0MCIgeT0iMTIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIiIvPjxyZWN0IHg9IjEwMCIgeT0iMTQwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIiIvPjxyZWN0IHg9IjEyMCIgeT0iMTQwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIiIvPjxyZWN0IHg9IjE0MCIgeT0iMTQwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIiIvPjxyZWN0IHg9IjE2MCIgeT0iMTQwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIiIvPjxyZWN0IHg9IjE2MCIgeT0iMTIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIiIvPjxyZWN0IHg9IjE2MCIgeT0iMTAwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIiIvPjxyZWN0IHg9IjE2MCIgeT0iODAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzIyMjIiLz48cmVjdCB4PSI4MCIgeT0iMTYwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIi8+PHJlY3QgeD0iMTAwIiB5PSIxNjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzIyMjIiLz48cmVjdCB4PSIxMjAiIHk9IjE2MCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjIyMiIvPjxyZWN0IHg9IjE0MCIgeT0iMTYwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIi8+PHJlY3QgeD0iMTYwIiB5PSIxNjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzIyMjIiLz48cmVjdCB4PSIyMCIgeT0iODAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzIyMjIiLz48cmVjdCB4PSIyMCIgeT0iMTAwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIi8+PHJlY3QgeD0iMjAiIHk9IjEyMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjIyMiIvPjxyZWN0IHg9IjIwIiB5PSIxNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzIyMjIiLz48cmVjdCB4PSIyMCIgeT0iMTYwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIiIvPjxyZWN0IHg9IjQwIiB5PSIyMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjIyMiIvPjxyZWN0IHg9IjYwIiB5PSIyMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjIyMiIvPjxyZWN0IHg9IjgwIiB5PSIyMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjIyMiIvPjxyZWN0IHg9IjEwMCIgeT0iMjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzIyMjIiLz48cmVjdCB4PSIxMjAiIHk9IjIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiMyMjIyIi8+PHJlY3QgeD0iMTQwIiB5PSIyMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjIyMiIvPjxyZWN0IHg9IjE2MCIgeT0iMjAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzIyMjIiLz48L3N2Zz4=";

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

    // Start countdown only if status is pending
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

          {/* Dummy QR Code using Data URL */}
          <div className={cn("aspect-square w-48 rounded-lg border-4 border-primary p-2 bg-white", status === 'successful' && 'opacity-50')}>
            <img 
              src={QRIS_DUMMY_SVG} 
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
            // Tombol Batal harus selalu aktif kecuali saat mutasi sedang berjalan (di SubscribePage)
            // Di sini, kita hanya menonaktifkannya jika status sudah sukses, agar pengguna diarahkan ke akun.
            disabled={status === 'successful'}
          >
            {status === 'successful' ? 'Lanjut ke Akun' : 'Batal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrisPaymentDialog;