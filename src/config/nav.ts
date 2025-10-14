import { Home, Clapperboard, Users, Receipt, LineChart, Settings, Bell } from "lucide-react";

export const navItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/movies", icon: Clapperboard, label: "Film" },
  { to: "/users", icon: Users, label: "Pengguna" },
  { to: "/transactions", icon: Receipt, label: "Transaksi" },
  { to: "/reports", icon: LineChart, label: "Laporan" },
  { to: "/settings", icon: Settings, label: "Pengaturan" },
  { to: "/logs", icon: Bell, label: "Notifikasi & Log" },
];