import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";
import { UserDetails } from "@/types";

const AdminManagement = () => {
  const queryClient = useQueryClient();
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["all_user_details_for_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_details")
        .select("id, full_name, role, status, email");
      if (error) throw new Error(error.message);
      return data as UserDetails[];
    },
  });

  const admins = usersData?.filter((u) => u.role === "admin") || [];
  const nonAdmins = usersData?.filter((u) => u.role !== "admin") || [];

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess("Peran pengguna berhasil diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["all_user_details_for_admin"] });
      setAddAdminDialogOpen(false);
      setSelectedUserId(null);
    },
    onError: (error) => {
      showError(`Gagal memperbarui peran: ${error.message}`);
    },
  });

  const handleAddAdmin = () => {
    if (selectedUserId) {
      updateUserRoleMutation.mutate({ userId: selectedUserId, role: "admin" });
    }
  };

  const handleRemoveAdmin = (userId: string) => {
    updateUserRoleMutation.mutate({ userId, role: "user" });
  };

  const selectedUser = nonAdmins.find(user => user.id === selectedUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Admin</CardTitle>
        <CardDescription>Tambah atau hapus admin untuk aplikasi ini.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button onClick={() => setAddAdminDialogOpen(true)} className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            <span>Jadikan Admin</span>
          </Button>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingUsers ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Memuat data admin...</TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Belum ada admin.</TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>{admin.full_name || "N/A"}</TableCell>
                    <TableCell>{admin.email || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={admin.status === 'active' ? 'default' : 'destructive'}>{admin.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAdmin(admin.id)}
                        disabled={updateUserRoleMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={addAdminDialogOpen} onOpenChange={setAddAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jadikan Pengguna sebagai Admin</DialogTitle>
            <DialogDescription>
              Pilih pengguna dari daftar di bawah ini untuk memberinya hak akses admin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between"
                >
                  {selectedUserId
                    ? `${selectedUser?.full_name || 'Pengguna tidak dikenal'} (${selectedUser?.email || 'N/A'})`
                    : "Pilih pengguna..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Cari pengguna..." />
                  <CommandList>
                    <CommandEmpty>Pengguna tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {nonAdmins.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={`${user.full_name} ${user.email}`}
                          onSelect={() => {
                            setSelectedUserId(user.id);
                            setPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUserId === user.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {user.full_name} ({user.email})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddAdminDialogOpen(false)}>Batal</Button>
            <Button onClick={handleAddAdmin} disabled={!selectedUserId || updateUserRoleMutation.isPending}>
              {updateUserRoleMutation.isPending ? "Menyimpan..." : "Jadikan Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminManagement;