import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/ui/nav/Navbar";
import Home from "./components/pages/Home";
import { Footer } from "./components/ui/nav/Footer";
import LoginPage from "./components/pages/Login";
import SignUpPage from "./components/pages/Signup";
import Dashboard from "./components/pages/Dashboard";
import AuthenticatedLayout from "./components/layouts/AuthenticatedLayout";
import { AuthProvider } from "./components/Contexts/AuthProvider";
import Horses from "./components/pages/Horses";
import NewShoeing from "./components/pages/NewShoeing";
import Notes from "./components/pages/Notes";
import { Toaster } from "react-hot-toast";
import Inbox from "./components/pages/Inbox";
import { NotificationProvider } from "@/components/Contexts/NotificationProvider";
import Calendar from "./components/pages/Calendar";
import HorseProfile from "./components/pages/HorseProfile";
import { QueryClient, QueryClientProvider } from "react-query";
import ShoeingsApprovalPanel from "./components/pages/ShoeingsApprovalPanel";
import ProtectedRoute from "@/lib/ProtectedRoute";
import QuickBooksCallback from "@/lib/QuickbooksCallback";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";
import EULA from "./components/pages/EULA";
import PrivacyPolicy from "./components/pages/PrivacyPolicy";
import ForgotPassword from "@/components/pages/ForgotPassword";
import ResetPassword from "@/components/pages/ResetPassword";
import NewCustomer from "./components/pages/NewCustomer";
import EditHorse from "@/components/pages/EditHorse";

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

          <Route
            path="/eula"
            element={
              <>
                <Navbar />
                <EULA />
                <Footer />
              </>
            }
          />

          <Route
            path="/privacy-policy"
            element={
              <>
                <Navbar />
                <PrivacyPolicy />
                <Footer />
              </>
            }
          />

          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes using AuthenticatedLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard"
              element={
                <ProtectedAdminRoute>
                  <Dashboard />
                </ProtectedAdminRoute>
              }
            />
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
            <Route path="/customers/new" element={<NewCustomer />} />
            <Route path="/customers/edit/:id" element={<NewCustomer />} />
            <Route
              path="/horses/edit/:id"
              element={
                <AuthenticatedLayout>
                  <EditHorse />
                </AuthenticatedLayout>
              }
            />
            <Route
              path="/horses/new"
              element={
                <AuthenticatedLayout>
                  <EditHorse />
                </AuthenticatedLayout>
              }
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
