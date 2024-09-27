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
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route
                path="/horses"
                element={
                  <ProtectedRoute>
                    <HorseDashboard />
                  </ProtectedRoute>
                }
              />
              {/* Add more protected routes as needed */}
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
