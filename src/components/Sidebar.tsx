import { NavLink } from "react-router-dom";
import { Bell, Clapperboard, Home, LineChart, Receipt, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/movies", icon: Clapperboard, label: "Film" },
  { to: "/transactions", icon: Receipt, label: "Transaksi" },
  { to: "/reports", icon: LineChart, label: "Laporan" },
  { to: "/users", icon: Users, label: "Manajemen Pengguna" },
  { to: "/settings", icon: Settings, label: "Pengaturan" },
  { to: "/logs", icon: Bell, label: "Notifikasi & Log" },
];

const Sidebar = () => {
  return (
    <aside className="hidden h-screen w-64 flex-col border-r bg-background p-4 sm:flex">
      <div className="mb-8 flex items-center gap-2">
        <Clapperboard className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Nontonin</h1>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;