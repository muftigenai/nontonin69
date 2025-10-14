import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MovieDetails from "./pages/MovieDetails";
import WatchMovie from "./pages/WatchMovie";
import Settings from "./pages/Settings";
import History from "./pages/History";
import Login from "./pages/Login";
import UpdatePassword from "./pages/UpdatePassword";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfilePage from "./pages/Profile";
import { AuthProvider } from "./providers/AuthProvider";
import Movies from "./pages/Movies";
import Users from "./pages/Users";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import ActivityLogPage from "./pages/ActivityLog";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/users" element={<Users />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/logs" element={<ActivityLogPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                {/* Placeholder routes from before */}
                <Route path="/movie/:id" element={<MovieDetails />} />
                <Route path="/watch/:id" element={<WatchMovie />} />
                <Route path="/history" element={<History />} />
              </Route>
            </Routes>
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;