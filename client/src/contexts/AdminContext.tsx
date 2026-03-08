import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface AdminContextValue {
  adminPreview: boolean;
  setAdminPreview: (value: boolean) => void;
  deviceView: "desktop" | "mobile";
  setDeviceView: (value: "desktop" | "mobile") => void;
  forceMobileLayout: boolean;
  setForceMobileLayout: (value: boolean) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminPreview, setAdminPreview] = useState(false);
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [forceMobileLayout, setForceMobileLayout] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkSession = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/admin/check-session", { credentials: "include" });
      const data = await response.json();
      setIsAuthenticated(data.authenticated);
      return data.authenticated;
    } catch {
      setIsAuthenticated(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/admin/logout", {});
    } catch {
    }
    setIsAuthenticated(false);
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <AdminContext.Provider
      value={{ adminPreview, setAdminPreview, deviceView, setDeviceView, forceMobileLayout, setForceMobileLayout, isAuthenticated, setIsAuthenticated, logout, checkSession }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
