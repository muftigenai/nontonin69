import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminManagement from "@/components/admin/AdminManagement";

const Settings = () => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola pengaturan aplikasi dan akun Anda.</p>
      </div>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Umum</TabsTrigger>
          <TabsTrigger value="subscription">Langganan</TabsTrigger>
          <TabsTrigger value="payment">Pembayaran</TabsTrigger>
          <TabsTrigger value="admins">Admin</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Umum</CardTitle>
              <CardDescription>Ubah nama dan logo aplikasi Anda di sini.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="appName">Nama Aplikasi</Label>
                <Input id="appName" defaultValue="Nontonin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
                <Input id="logo" type="file" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Simpan Perubahan</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Langganan</CardTitle>
              <CardDescription>Atur harga untuk paket langganan premium.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyPrice">Harga Bulanan (Rp)</Label>
                <Input id="monthlyPrice" type="number" defaultValue="99000" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="annualPrice">Harga Tahunan (Rp)</Label>
                <Input id="annualPrice" type="number" defaultValue="999000" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Simpan Harga</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="payment">
           <Card>
            <CardHeader>
              <CardTitle>Gateway Pembayaran</CardTitle>
              <CardDescription>Konfigurasi kunci API untuk integrasi pembayaran.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input id="apiKey" type="password" placeholder="••••••••••••••••••••" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Simpan Konfigurasi</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="admins">
           <AdminManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;