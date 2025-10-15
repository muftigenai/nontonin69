import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const subscriptionSettingsSchema = z.object({
  monthlyPrice: z.coerce.number().min(0, "Harga harus angka non-negatif"),
  annualPrice: z.coerce.number().min(0, "Harga harus angka non-negatif"),
});

const Settings = () => {
  const queryClient = useQueryClient();

  const generalForm = useForm<z.infer<typeof generalSettingsSchema>>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: { appName: "" },
  });

  const subscriptionForm = useForm<z.infer<typeof subscriptionSettingsSchema>>({
    resolver: zodResolver(subscriptionSettingsSchema),
    defaultValues: { monthlyPrice: 0, annualPrice: 0 },
  });

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*");
      if (error) throw new Error(error.message);
      return data.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);
    },
  });

  React.useEffect(() => {
    if (settings) {
      generalForm.setValue("appName", settings.app_name || "");
      subscriptionForm.setValue("monthlyPrice", Number(settings.monthly_price) || 0);
      subscriptionForm.setValue("annualPrice", Number(settings.annual_price) || 0);
    }
  }, [settings, generalForm, subscriptionForm]);

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase.from("app_settings").update({ value }).eq("key", key);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess("Pengaturan berhasil disimpan.");
      queryClient.invalidateQueries({ queryKey: ["app_settings"] });
    },
    onError: (error) => showError(`Gagal menyimpan: ${error.message}`),
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (values: z.infer<typeof subscriptionSettingsSchema>) => {
      const updates = [
        supabase.from("app_settings").update({ value: String(values.monthlyPrice) }).eq("key", "monthly_price"),
        supabase.from("app_settings").update({ value: String(values.annualPrice) }).eq("key", "annual_price"),
      ];
      const results = await Promise.all(updates);
      results.forEach(({ error }) => {
        if (error) throw new Error(`Gagal memperbarui harga: ${error.message}`);
      });
    },
    onSuccess: () => {
      showSuccess("Harga langganan berhasil disimpan.");
      queryClient.invalidateQueries({ queryKey: ["app_settings"] });
    },
    onError: (error: Error) => showError(error.message),
  });

  const onGeneralSubmit = (values: z.infer<typeof generalSettingsSchema>) => {
    updateSettingMutation.mutate({ key: "app_name", value: values.appName });
  };

  const onSubscriptionSubmit = (values: z.infer<typeof subscriptionSettingsSchema>) => {
    updateSubscriptionMutation.mutate(values);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola pengaturan aplikasi dan akun Anda.</p>
      </div>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Umum</TabsTrigger>
          <TabsTrigger value="subscription">Langganan</TabsTrigger>
          <TabsTrigger value="payment">Pembayaran</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card>
            <Form {...generalForm}>
              <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)}>
                <CardHeader>
                  <CardTitle>Pengaturan Umum</CardTitle>
                  <CardDescription>Ubah nama dan logo aplikasi Anda di sini.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={generalForm.control}
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
            <Form {...subscriptionForm}>
              <form onSubmit={subscriptionForm.handleSubmit(onSubscriptionSubmit)}>
                <CardHeader>
                  <CardTitle>Pengaturan Langganan</CardTitle>
                  <CardDescription>Atur harga untuk paket langganan premium.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={subscriptionForm.control}
                    name="monthlyPrice"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Harga Bulanan (Rp)</Label>
                        <FormControl>
                          <Input type="number" {...field} disabled={isLoadingSettings} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subscriptionForm.control}
                    name="annualPrice"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Harga Tahunan (Rp)</Label>
                        <FormControl>
                          <Input type="number" {...field} disabled={isLoadingSettings} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={updateSubscriptionMutation.isPending}>
                    {updateSubscriptionMutation.isPending ? "Menyimpan..." : "Simpan Harga"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
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
      </Tabs>
    </div>
  );
};

export default Settings;