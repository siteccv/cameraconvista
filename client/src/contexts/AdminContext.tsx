import { createContext, useContext, useState, type ReactNode } from "react";

interface AdminContextValue {
  adminPreview: boolean;
  setAdminPreview: (value: boolean) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminPreview, setAdminPreview] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <AdminContext.Provider
      value={{ adminPreview, setAdminPreview, isAuthenticated, setIsAuthenticated }}
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
