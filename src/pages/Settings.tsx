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
  ppvPrice: z.coerce.number().min(0, "Harga harus angka non-negatif"),
});

const paymentSettingsSchema = z.object({
  qris_file: z.instanceof(FileList).optional(),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema> & {
  current_logo_url?: string | null;
};

type PaymentSettingsFormValues = z.infer<typeof paymentSettingsSchema> & {
  current_qris_url?: string | null;
};

const Settings = () => {
  const queryClient = useQueryClient();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [qrisPreview, setQrisPreview] = useState<string | null>(null);

  const generalForm = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: { appName: "", current_logo_url: null },
  });

  const subscriptionForm = useForm<z.infer<typeof subscriptionSettingsSchema>>({
    resolver: zodResolver(subscriptionSettingsSchema),
    defaultValues: { monthlyPrice: 0, annualPrice: 0, ppvPrice: 0 },
  });

  const paymentForm = useForm<PaymentSettingsFormValues>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: { current_qris_url: null },
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
      subscriptionForm.setValue("ppvPrice", Number(settings.ppv_price) || 0);
      paymentForm.setValue("current_qris_url", settings.qris_image_url || null);
      setQrisPreview(settings.qris_image_url || null);
    }
  }, [settings, generalForm, subscriptionForm, paymentForm]);

  const uploadFile = async (fileList: FileList | undefined, path: string, bucket: string) => {
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${path}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw new Error(`Gagal mengunggah file: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
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
      queryClient.invalidateQueries({ queryKey: ["app_settings"] });
    },
    onError: (error) => showError(`Gagal menyimpan: ${error.message}`),
  });

  const onGeneralSubmit = async (values: GeneralSettingsFormValues) => {
    try {
      const logoUrl = await uploadFile(values.logo_file, 'logo/app_logo', 'app_assets');
      await updateSettingMutation.mutateAsync({ key: "app_name", value: values.appName });
      if (logoUrl) {
        await updateSettingMutation.mutateAsync({ key: "app_logo_url", value: logoUrl });
      }
      showSuccess("Pengaturan umum berhasil diperbarui.");
    } catch (error: any) {
      showError(error.message);
    }
  };

  const onSubscriptionSubmit = async (values: z.infer<typeof subscriptionSettingsSchema>) => {
    try {
      await Promise.all([
        updateSettingMutation.mutateAsync({ p_key: 'monthly_price', p_value: String(values.monthlyPrice) }),
        updateSettingMutation.mutateAsync({ p_key: 'annual_price', p_value: String(values.annualPrice) }),
        updateSettingMutation.mutateAsync({ p_key: 'ppv_price', p_value: String(values.ppvPrice) }),
      ]);
      showSuccess("Harga langganan berhasil disimpan.");
    } catch (error: any) {
      showError(error.message);
    }
  };

  const onPaymentSubmit = async (values: PaymentSettingsFormValues) => {
    try {
      const qrisUrl = await uploadFile(values.qris_file, 'qris/payment_qris', 'app_assets');
      if (qrisUrl) {
        await updateSettingMutation.mutateAsync({ key: "qris_image_url", value: qrisUrl });
        showSuccess("Gambar QRIS berhasil diperbarui.");
      } else {
        showError("Pilih file gambar QRIS untuk diunggah.");
      }
    } catch (error: any) {
      showError(error.message);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, setPreview: React.Dispatch<React.SetStateAction<string | null>>, currentUrl: string | null) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(currentUrl);
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
                  <FormField control={generalForm.control} name="appName" render={({ field }) => (<FormItem><Label>Nama Aplikasi</Label><FormControl><Input {...field} disabled={isLoadingSettings} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={generalForm.control} name="logo_file" render={({ field }) => (
                    <FormItem>
                      <Label>Logo Aplikasi</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                          {logoPreview ? <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-contain p-1" /> : <Image className="h-8 w-8 text-muted-foreground" />}
                        </div>
                        <div className="flex-1">
                          <FormControl>
                            <Input 
                              type="file" 
                              accept="image/*" 
                              ref={field.ref}
                              name={field.name}
                              onBlur={field.onBlur}
                              onChange={(e) => { 
                                field.onChange(e.target.files); 
                                handleFileChange(e, setLogoPreview, generalForm.getValues("current_logo_url")); 
                              }} 
                              disabled={isLoadingSettings} 
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground mt-1">Unggah file gambar baru untuk logo.</p>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
                <CardFooter><Button type="submit" disabled={updateSettingMutation.isPending}>{updateSettingMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}</Button></CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
        <TabsContent value="subscription">
          <Card>
            <Form {...subscriptionForm}>
              <form onSubmit={subscriptionForm.handleSubmit(onSubscriptionSubmit)}>
                <CardHeader><CardTitle>Pengaturan Langganan & PPV</CardTitle><CardDescription>Atur harga untuk paket langganan premium dan harga default Pay Per View (PPV).</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={subscriptionForm.control} name="monthlyPrice" render={({ field }) => (<FormItem><Label>Harga Bulanan (Rp)</Label><FormControl><Input type="number" {...field} disabled={isLoadingSettings} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={subscriptionForm.control} name="annualPrice" render={({ field }) => (<FormItem><Label>Harga Tahunan (Rp)</Label><FormControl><Input type="number" {...field} disabled={isLoadingSettings} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={subscriptionForm.control} name="ppvPrice" render={({ field }) => (<FormItem><Label>Harga Default Pay Per View (Rp)</Label><FormControl><Input type="number" {...field} disabled={isLoadingSettings} /></FormControl><FormMessage /></FormItem>)} />
                </CardContent>
                <CardFooter><Button type="submit" disabled={updateSettingMutation.isPending}>{updateSettingMutation.isPending ? "Menyimpan..." : "Simpan Harga"}</Button></CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
        <TabsContent value="payment">
          <Card>
            <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)}>
                <CardHeader>
                  <CardTitle>Gateway Pembayaran</CardTitle>
                  <CardDescription>Unggah gambar QRIS yang akan ditampilkan kepada pengguna saat melakukan pembayaran.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField control={paymentForm.control} name="qris_file" render={({ field }) => (
                    <FormItem>
                      <Label>Gambar QRIS</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                          {qrisPreview ? <img src={qrisPreview} alt="QRIS Preview" className="h-full w-full object-contain p-1" /> : <Image className="h-12 w-12 text-muted-foreground" />}
                        </div>
                        <div className="flex-1">
                          <FormControl>
                            <Input 
                              type="file" 
                              accept="image/*" 
                              ref={field.ref}
                              name={field.name}
                              onBlur={field.onBlur}
                              onChange={(e) => { 
                                field.onChange(e.target.files); 
                                handleFileChange(e, setQrisPreview, paymentForm.getValues("current_qris_url")); 
                              }} 
                              disabled={isLoadingSettings} 
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground mt-1">Unggah gambar QRIS statis Anda di sini.</p>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                </CardContent>
                <CardFooter><Button type="submit" disabled={updateSettingMutation.isPending}>{updateSettingMutation.isPending ? "Menyimpan..." : "Simpan Gambar QRIS"}</Button></CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;