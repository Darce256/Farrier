import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient"; // Ensure you have a Supabase client setup
// Define the shape of the user object
interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  loading: boolean; // Add this line
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
  const [loading, setLoading] = useState(true); // Add this line

  // Check for existing session on mount
  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    setLoading(true); // Add this line
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      const { user } = session;
      const { data } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .single();

      if (data) {
        setUser({ id: user.id, name: data.name, email: data.email });
      }
    }
    setLoading(false); // Add this line
  };

  const login = async (email: string, password: string) => {
    const {
      data: { user },
      error,
    } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", user?.id)
      .single();
    if (data && user) {
      setUser({ id: user.id, name: data.name, email: data.email });
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const signup = async (name: string, email: string, password: string) => {
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    const { error: profileError } = await supabase
      .from("profiles")
      .insert([{ id: user?.id, name, email }]);

    if (profileError) throw profileError;

    if (user) {
      setUser({ id: user.id, name, email });
    }
  };

  const value = {
    user,
    loading, // Add this line
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
