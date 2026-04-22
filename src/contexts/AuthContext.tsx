import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  user: any | null;
  session: any | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const signUp = async (email: string, password: string, displayName?: string) => {
    console.log("Mock SignUp", email, password, displayName);
  };

  const signIn = async (email: string, password: string) => {
    console.log("Mock SignIn", email, password);
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    console.log("Mock ResetPassword", email);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
