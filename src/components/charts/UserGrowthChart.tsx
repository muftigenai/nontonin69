import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const UserGrowthChart = () => {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Pertumbuhan Pengguna</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">Grafik pertumbuhan pengguna akan ditampilkan di sini.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserGrowthChart;