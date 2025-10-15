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
import React, { useState } from "react";
import { Image } from "lucide-react";

const generalSettingsSchema = z.object({
  appName: z.string().min(1, "Nama aplikasi tidak boleh kosong"),
  logo_file: z.instanceof(FileList).optional(),
});

const subscriptionSettingsSchema = z.object({
  monthlyPrice: z.coerce.number().min(0, "Harga harus angka non-negatif"),
  annualPrice: z.coerce.number().min(0, "Harga harus angka non-negatif"),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema> & {
  current_logo_url?: string | null;
};

const Settings = () => {
  const queryClient = useQueryClient();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const generalForm = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: { appName: "", current_logo_url: null },
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
      generalForm.setValue("current_logo_url", settings.app_logo_url || null);
      setLogoPreview(settings.app_logo_url || null);
      subscriptionForm.setValue("monthlyPrice", Number(settings.monthly_price) || 0);
      subscriptionForm.setValue("annualPrice", Number(settings.annual_price) || 0);
    }
  }, [settings, generalForm, subscriptionForm]);

  const uploadLogo = async (fileList: FileList | undefined) => {
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `logo/app_logo.${fileExt}`; // Use a fixed name for the main logo

      // Upload file, replacing existing one (upsert: true)
      const { error: uploadError } = await supabase.storage
        .from('app_assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw new Error(`Gagal mengunggah logo: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from('app_assets').getPublicUrl(filePath);
      return urlData.publicUrl;
    }
    return null;
  };

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase.rpc('update_setting', { p_key: key, p_value: value });
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
        supabase.rpc('update_setting', { p_key: 'monthly_price', p_value: String(values.monthlyPrice) }),
        supabase.rpc('update_setting', { p_key: 'annual_price', p_value: String(values.annualPrice) }),
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

  const onGeneralSubmit = async (values: GeneralSettingsFormValues) => {
    try {
      const logoUrl = await uploadLogo(values.logo_file);
      
      const updates = [
        updateSettingMutation.mutateAsync({ key: "app_name", value: values.appName }),
      ];

      if (logoUrl) {
        updates.push(updateSettingMutation.mutateAsync({ key: "app_logo_url", value: logoUrl }));
      } else if (values.logo_file && values.logo_file.length === 0 && values.current_logo_url) {
        // If user clears the file input but there was a current URL, we keep the current URL.
        // If we wanted to allow deletion, we'd need a separate delete button/logic.
      }

      await Promise.all(updates);
      showSuccess("Pengaturan umum berhasil diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["app_settings"] });
    } catch (error: any) {
      showError(error.message);
    }
  };

  const onSubscriptionSubmit = (values: z.infer<typeof subscriptionSettingsSchema>) => {
    updateSubscriptionMutation.mutate(values);
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    } else {
      // Revert to current URL if file input is cleared
      setLogoPreview(generalForm.getValues("current_logo_url") || null);
    }
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
                  <FormField
                    control={generalForm.control}
                    name="logo_file"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <Label htmlFor="logo">Logo Aplikasi</Label>
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                            {logoPreview ? (
                              <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-contain p-1" />
                            ) : (
                              <Image className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <FormControl>
                              <Input
                                id="logo"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  onChange(e.target.files);
                                  handleLogoFileChange(e);
                                }}
                                {...fieldProps}
                                disabled={isLoadingSettings}
                              />
                            </FormControl>
                            <p className="text-sm text-muted-foreground mt-1">
                              Unggah file gambar baru untuk logo.
                            </p>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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