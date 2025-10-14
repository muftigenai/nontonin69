import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CircleUser, Menu, Search } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { UserDetails } from "@/types";
import { navItems } from "@/config/nav";
import { cn } from "@/lib/utils";

const Header = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: userDetails } = useQuery<UserDetails | null>({
    queryKey: ["user_details"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, email, role")
        .eq("id", user.id)
        .single();
      if (error) {
        console.error("Error fetching user details:", error);
        return null;
      }
      return data;
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Buka menu navigasi</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-4 text-lg font-medium">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-accent hover:text-accent-foreground",
                    isActive && "bg-accent text-accent-foreground"
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src={userDetails?.avatar_url ?? undefined} alt="User avatar" />
                <AvatarFallback>
                  <CircleUser className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Buka menu pengguna</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{userDetails?.full_name || userDetails?.email || "Akun Saya"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">Pengaturan</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Bantuan</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>Keluar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;