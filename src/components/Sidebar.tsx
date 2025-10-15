import { NavLink, Link } from "react-router-dom";
import { Bell, Clapperboard, Home, LineChart, Receipt, Settings, Users, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", icon: Home, label: "Dashboard" },
  { to: "/admin/movies", icon: Clapperboard, label: "Film" },
  { to: "/admin/users", icon: Users, label: "Pengguna" },
  { to: "/admin/transactions", icon: Receipt, label: "Transaksi" },
  { to: "/admin/reports", icon: LineChart, label: "Laporan" },
  { to: "/admin/settings", icon: Settings, label: "Pengaturan" },
  { to: "/admin/logs", icon: Bell, label: "Notifikasi & Log" },
];

const Sidebar = () => {
  return (
    <aside className="hidden h-screen w-64 flex-col border-r bg-background p-4 sm:flex">
      <div className="flex flex-1 flex-col">
        <div className="mb-8 flex items-center gap-2">
          <Clapperboard className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Nontonin</h1>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
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
      </div>
      <div>
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ExternalLink className="h-5 w-5" />
          <span>Lihat Situs Publik</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;