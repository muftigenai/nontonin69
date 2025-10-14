import PublicNavbar from "@/components/public/PublicNavbar";
import { Outlet } from "react-router-dom";

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;