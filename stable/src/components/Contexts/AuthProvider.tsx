import React, { createContext, useContext, useState, useEffect } from "react";

// Define the shape of the user object
interface User {
  name: string;
  email: string;
  image?: string;
}

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    // Here you would typically check if the user is already logged in
    // For example, by checking a token in localStorage or making an API call
    const token = localStorage.getItem("authToken");
    if (token) {
      // Validate the token with your backend
      // If valid, set the user
      // This is a placeholder implementation
      setUser({ name: "John Doe", email: "john@example.com" });
    }
  };

  const login = async (email: string, password: string) => {
    // Implement your login logic here
    // This could involve making an API call to your backend
    // On success, update the user state
    // This is a placeholder implementation
    setUser({ name: "John Doe", email });
    localStorage.setItem("authToken", "sample-token");
  };

  const logout = async () => {
    // Implement your logout logic here
    // This could involve clearing tokens from localStorage and/or making an API call
    setUser(null);
    localStorage.removeItem("authToken");
  };

  const signup = async (name: string, email: string, password: string) => {
    // Implement your signup logic here
    // This could involve making an API call to your backend
    // On success, you might want to automatically log the user in
    // This is a placeholder implementation
    setUser({ name, email });
    localStorage.setItem("authToken", "sample-token");
  };

  const value = {
    user,
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
