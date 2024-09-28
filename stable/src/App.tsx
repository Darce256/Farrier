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
import HorseDashboard from "./components/pages/HorseDashboard";
import Dashboard from "./components/pages/Dashboard";
import AuthenticatedLayout from "./components/layouts/AuthenticatedLayout";
import { AuthProvider, useAuth } from "./components/Contexts/AuthProvider";
import { ReactNode } from "react";

// Protected Route component
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  if (!user) {
    // Redirect to login if user is not authenticated
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
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
              <Route path="/horses" element={<HorseDashboard />} />
              {/* Add more protected routes as needed */}
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
