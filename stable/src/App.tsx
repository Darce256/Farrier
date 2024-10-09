import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/ui/nav/Navbar";
import Home from "./components/pages/Home";
import { Footer } from "./components/ui/nav/Footer";
import LoginPage from "./components/pages/Login";
import SignUpPage from "./components/pages/Signup";
import Dashboard from "./components/pages/Dashboard";
import AuthenticatedLayout from "./components/layouts/AuthenticatedLayout";
import { AuthProvider, useAuth } from "./components/Contexts/AuthProvider";
import { ReactNode } from "react";
import Horses from "./components/pages/Horses";
import NewShoeing from "./components/pages/NewShoeing";
import Notes from "./components/pages/Notes";
import { Toaster } from "react-hot-toast";
import Inbox from "./components/pages/Inbox";
import { NotificationProvider } from "@/components/Contexts/NotificationProvider";
import Calendar from "./components/pages/Calendar";
import HorseProfile from "./components/pages/HorseProfile";
import ShoeingApprovalPanel from "./components/pages/ShoeingsApprovalPanel";
import { QueryClient, QueryClientProvider } from "react-query";
import { Spinner } from "./components/ui/spinner";
import ShoeingsApprovalPanel from "./components/pages/ShoeingsApprovalPanel";
import ProtectedRoute from "@/lib/ProtectedRoute";
import QuickBooksCallback from "@/lib/QuickbooksCallback";

function AppRoutes() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Home />
                <Footer />
              </>
            }
          />
          <Route
            path="/login"
            element={
              <>
                <Navbar />
                <LoginPage />
                <Footer />
              </>
            }
          />
          <Route
            path="/signup"
            element={
              <>
                <Navbar />
                <SignUpPage />
                <Footer />
              </>
            }
          />

          {/* Protected routes using AuthenticatedLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/horses" element={<Horses />} />
            <Route path="/new-shoeings" element={<NewShoeing />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/horses/:id" element={<HorseProfile />} />
            <Route
              path="/shoeings-approval-panel"
              element={<ShoeingsApprovalPanel />}
            />
            <Route
              path="/quickbooks-callback"
              element={<QuickBooksCallback />}
            />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  const queryClient = new QueryClient();

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <AppRoutes />
          <Toaster position="top-right" />
        </NotificationProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
