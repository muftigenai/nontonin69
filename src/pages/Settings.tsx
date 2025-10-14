import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminManagement from "@/components/admin/AdminManagement";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { showSuccess, showError } from "@/utils/toast";
import React from "react";

const generalSettingsSchema = z.object({
  appName: z.string().min(1, "Nama aplikasi tidak boleh kosong"),
});

const Settings = () => {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof generalSettingsSchema>>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      appName: "",
    },
  });

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*");
      if (error) throw new Error(error.message);
      const settingsObj = data.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);
      return settingsObj;
    },
  });

  React.useEffect(() => {
    if (settings?.app_name) {
      form.setValue("appName", settings.app_name);
    }
  }, [settings, form]);

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("app_settings")
        .update({ value })
        .eq("key", key);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess("Pengaturan berhasil disimpan.");
      queryClient.invalidateQueries({ queryKey: ["app_settings"] });
    },
    onError: (error) => {
      showError(`Gagal menyimpan: ${error.message}`);
    },
  });

  const onGeneralSubmit = (values: z.infer<typeof generalSettingsSchema>) => {
    updateSettingMutation.mutate({ key: "app_name", value: values.appName });
  };

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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onGeneralSubmit)}>
                <CardHeader>
                  <CardTitle>Pengaturan Umum</CardTitle>
                  <CardDescription>Ubah nama dan logo aplikasi Anda di sini.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="appName"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="appName">Nama Aplikasi</Label>
                        <FormControl>
                          <Input id="appName" {...field} disabled={isLoadingSettings} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo</Label>
                    <Input id="logo" type="file" disabled />
                     <p className="text-sm text-muted-foreground">Fitur unggah logo belum tersedia.</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={updateSettingMutation.isPending}>
                    {updateSettingMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
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
              <Button disabled>Simpan Harga</Button>
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
              <Button disabled>Simpan Konfigurasi</Button>
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