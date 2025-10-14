import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RevenueChart = () => {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Pendapatan</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">Grafik pendapatan akan ditampilkan di sini.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;