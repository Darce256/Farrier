import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient"; // Ensure you have a Supabase client setup
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
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      const { user } = session;
      const { data, error } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .single();

      if (data) {
        setUser({ name: data.name, email: data.email });
      }
    }
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

    if (data) {
      setUser({ name: data.name, email: data.email });
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

    const { data, error: profileError } = await supabase
      .from("profiles")
      .insert([{ id: user?.id, name, email }]);

    if (profileError) throw profileError;

    setUser({ name, email });
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
