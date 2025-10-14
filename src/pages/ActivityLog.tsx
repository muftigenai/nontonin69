import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActivityLog } from "@/types";
import { Badge } from "@/components/ui/badge";

const ActivityLogPage = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["activity_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(
          `
          id,
          created_at,
          activity_type,
          description,
          profiles ( full_name )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data as ActivityLog[];
    },
  });

  const getActivityTypeBadgeVariant = (type: string) => {
    if (type.includes("failed") || type.includes("error")) return "destructive";
    if (type.includes("login") || type.includes("upload")) return "default";
    return "secondary";
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Notifikasi & Log Aktivitas</h1>
        <p className="text-muted-foreground">Menampilkan semua aktivitas penting di sistem.</p>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Pengguna</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Memuat log...
                </TableCell>
              </TableRow>
            ) : logs?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Tidak ada aktivitas yang tercatat.
                </TableCell>
              </TableRow>
            ) : (
              logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.created_at).toLocaleString("id-ID")}</TableCell>
                  <TableCell>
                    <Badge variant={getActivityTypeBadgeVariant(log.activity_type)}>
                      {log.activity_type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.description}</TableCell>
                  <TableCell>{log.profiles?.full_name || "Sistem"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ActivityLogPage;