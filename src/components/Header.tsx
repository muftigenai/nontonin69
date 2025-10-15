import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { Link, NavLink } from "react-router-dom";
import { Clapperboard, Home, LineChart, Menu, Receipt, Settings, Users, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";

const navItems = [
  { to: "/admin", icon: Home, label: "Dashboard" },
  { to: "/admin/movies", icon: Clapperboard, label: "Film" },
  { to: "/admin/users", icon: Users, label: "Pengguna" },
  { to: "/admin/transactions", icon: Receipt, label: "Transaksi" },
  { to: "/admin/reports", icon: LineChart, label: "Laporan" },
  { to: "/admin/settings", icon: Settings, label: "Pengaturan" },
];

const Header = () => {
  const { signOut, user } = useAuth();

  const getInitials = () => {
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "A";
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:justify-end">
      {/* Mobile Navigation Menu */}
      <div className="sm:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Buka menu navigasi</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col pt-12">
            <nav className="grid gap-4">
              <Link to="/admin" className="group mb-4 flex items-center gap-2 text-lg font-semibold">
                <Clapperboard className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                <span className="font-bold">Nontonin</span>
              </Link>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/admin"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                      isActive && "bg-muted text-primary"
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-auto">
              <Separator className="my-4" />
              <Link
                to="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              >
                <ExternalLink className="h-5 w-5" />
                Lihat Situs Publik
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* User Avatar Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email ?? ""} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Pengaturan</DropdownMenuItem>
          <DropdownMenuItem>Dukungan</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>Keluar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default Header;