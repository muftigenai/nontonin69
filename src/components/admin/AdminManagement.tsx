import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserDetails } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Combobox } from "@/components/ui/combobox";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "@/providers/AuthProvider";
import { X } from "lucide-react";

const AdminManagement = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["all_users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_details").select("*");
      if (error) throw new Error(error.message);
      return data as UserDetails[];
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) => {
      const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: "Sukses", description: "Peran pengguna berhasil diperbarui." });
      queryClient.invalidateQueries({ queryKey: ["all_users"] });
      setAddAdminDialogOpen(false);
      setSelectedUserId("");
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const admins = users?.filter((u) => u.role === "admin") || [];
  const regularUsers = users?.filter((u) => u.role !== "admin") || [];

  const userOptions = regularUsers.map((user) => ({
    value: user.id,
    label: user.full_name || user.email || "Pengguna Tanpa Nama",
  }));

  const handleAddAdmin = () => {
    if (selectedUserId) {
      updateUserRoleMutation.mutate({ userId: selectedUserId, role: "admin" });
    } else {
      toast({ title: "Peringatan", description: "Silakan pilih pengguna terlebih dahulu.", variant: "destructive" });
    }
  };

  const handleRemoveAdmin = (userId: string) => {
    updateUserRoleMutation.mutate({ userId, role: "user" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kelola Admin</CardTitle>
        <CardDescription>Tambah atau hapus administrator lain.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Admin Saat Ini</h3>
        {isLoading ? (
          <p>Memuat admin...</p>
        ) : admins.length > 0 ? (
          <div className="space-y-2">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={admin.avatar_url || ""} />
                    <AvatarFallback>{(admin.full_name || admin.email || "A").charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{admin.full_name}</p>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                  </div>
                </div>
                {admin.id !== currentUser?.id && (
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveAdmin(admin.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Tidak ada admin.</p>
        )}
      </CardContent>
      <CardFooter>
        <Dialog open={addAdminDialogOpen} onOpenChange={setAddAdminDialogOpen}>
          <DialogTrigger asChild>
            <Button>Tambah Admin Baru</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Admin Baru</DialogTitle>
              <DialogDescription>Pilih pengguna dari daftar di bawah untuk dijadikan admin.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Combobox
                options={userOptions}
                value={selectedUserId}
                onChange={setSelectedUserId}
                placeholder="Pilih pengguna..."
                searchPlaceholder="Cari pengguna..."
                emptyPlaceholder="Semua pengguna sudah menjadi admin."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddAdminDialogOpen(false)}>Batal</Button>
              <Button onClick={handleAddAdmin} disabled={!selectedUserId || updateUserRoleMutation.isPending}>
                {updateUserRoleMutation.isPending ? "Menyimpan..." : "Jadikan Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default AdminManagement;