import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Movies from "./pages/Movies";
import Users from "./pages/Users";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import { AuthProvider } from "./providers/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import PublicLayout from "./pages/public/PublicLayout";
import PublicHomePage from "./pages/public/PublicHomePage";
import CategoriesPage from "./pages/public/CategoriesPage";
import LibraryPage from "./pages/public/LibraryPage";
import SubscribePage from "./pages/public/SubscribePage";
import AccountPage from "./pages/public/AccountPage";
import MovieDetailPage from "./pages/public/MovieDetailPage";
import SearchResultsPage from "./pages/public/SearchResultsPage";
import WatchMoviePage from "./pages/public/WatchMoviePage";
import CategoryDetailPage from "./pages/public/CategoryDetailPage";
import CancelSubscriptionPage from "./pages/public/CancelSubscriptionPage"; // Import halaman baru

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Public Routes now at root */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<PublicHomePage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="categories/:genreKey" element={<CategoryDetailPage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="subscribe" element={<SubscribePage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="account/cancel-subscription" element={<CancelSubscriptionPage />} /> {/* Rute pembatalan */}
              <Route path="movie/:id" element={<MovieDetailPage />} />
              <Route path="watch/:id" element={<WatchMoviePage />} />
              <Route path="search" element={<SearchResultsPage />} />
            </Route>

            {/* Admin Routes moved to /admin */}
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="movies" element={<Movies />} />
                <Route path="users" element={<Users />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;