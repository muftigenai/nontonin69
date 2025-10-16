import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, UserX, UserCheck, PlusCircle, Edit } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { UserDetails } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const userFormSchema = z.object({
  full_name: z.string().min(1, "Nama lengkap tidak boleh kosong"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["user", "admin"], { required_error: "Peran harus dipilih" }),
});

const editRoleSchema = z.object({
  role: z.enum(["user", "admin"], { required_error: "Peran harus dipilih" }),
});

type UserFormValues = z.infer<typeof userFormSchema>;
type EditRoleFormValues = z.infer<typeof editRoleSchema>;

const Users = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDetails | null>(null);

  const addUserForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { full_name: "", email: "", password: "", role: "user" },
  });

  const editRoleForm = useForm<EditRoleFormValues>({
    resolver: zodResolver(editRoleSchema),
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", searchTerm],
    queryFn: async () => {
      let query = supabase.from("user_details").select("*");
      if (searchTerm) {
        query = query.ilike("email", `%${searchTerm}%`);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as UserDetails[];
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const { data, error } = await supabase.functions.invoke('create-user', { body: values });
      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      showSuccess("Pengguna baru berhasil ditambahkan.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsAddUserDialogOpen(false);
      addUserForm.reset();
    },
    onError: (error: Error) => showError(`Gagal menambahkan pengguna: ${error.message}`),
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess("Status pengguna berhasil diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => showError(`Gagal memperbarui status: ${error.message}`),
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      showSuccess("Peran pengguna berhasil diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsEditRoleDialogOpen(false);
    },
    onError: (error) => showError(`Gagal memperbarui peran: ${error.message}`),
  });

  const handleToggleBlock = (user: UserDetails) => {
    const newStatus = user.status === "active" ? "blocked" : "active";
    updateUserStatusMutation.mutate({ userId: user.id, status: newStatus });
  };

  const handleEditRole = (user: UserDetails) => {
    setEditingUser(user);
    editRoleForm.setValue("role", user.role === "admin" ? "admin" : "user");
    setIsEditRoleDialogOpen(true);
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  const onAddUserSubmit = (values: UserFormValues) => addUserMutation.mutate(values);
  const onEditRoleSubmit = (values: EditRoleFormValues) => {
    if (editingUser) {
      updateUserRoleMutation.mutate({ userId: editingUser.id, role: values.role });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pengguna</h1>
          <p className="text-muted-foreground">Kelola pengguna terdaftar di sini.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari berdasarkan email..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsAddUserDialogOpen(true)} className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            <span>Tambah Pengguna</span>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pengguna</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead>Langganan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Daftar</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center">Memuat data pengguna...</TableCell></TableRow>
            ) : (
              users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name || "Tanpa Nama"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={user.role === "admin" ? "default" : "outline"}>{user.role}</Badge></TableCell>
                  <TableCell><Badge variant={user.subscription_status === "premium" ? "default" : "secondary"}>{user.subscription_status}</Badge></TableCell>
                  <TableCell><Badge variant={user.status === "active" ? "outline" : "destructive"}>{user.status === "active" ? "Aktif" : "Diblokir"}</Badge></TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Buka menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRole(user)}><Edit className="mr-2 h-4 w-4" /> Edit Peran</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleBlock(user)}>
                          {user.status === "active" ? (<><UserX className="mr-2 h-4 w-4" /> Blokir</>) : (<><UserCheck className="mr-2 h-4 w-4" /> Aktifkan</>)}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Tambah Pengguna Baru</DialogTitle><DialogDescription>Isi detail di bawah ini untuk membuat akun baru.</DialogDescription></DialogHeader>
          <Form {...addUserForm}>
            <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4">
              <FormField control={addUserForm.control} name="full_name" render={({ field }) => (<FormItem><FormLabel>Nama Lengkap</FormLabel><FormControl><Input placeholder="Contoh: John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={addUserForm.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="contoh@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={addUserForm.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={addUserForm.control} name="role" render={({ field }) => (<FormItem><FormLabel>Peran</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Pilih peran pengguna" /></SelectTrigger></FormControl><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>Batal</Button>
                <Button type="submit" disabled={addUserMutation.isPending}>{addUserMutation.isPending ? "Menambahkan..." : "Tambah Pengguna"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Peran Pengguna</DialogTitle><DialogDescription>Ubah peran untuk {editingUser?.full_name || editingUser?.email}.</DialogDescription></DialogHeader>
          <Form {...editRoleForm}>
            <form onSubmit={editRoleForm.handleSubmit(onEditRoleSubmit)} className="space-y-4">
              <FormField control={editRoleForm.control} name="role" render={({ field }) => (<FormItem><FormLabel>Peran</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Pilih peran baru" /></SelectTrigger></FormControl><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>Batal</Button>
                <Button type="submit" disabled={updateUserRoleMutation.isPending}>{updateUserRoleMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;