/**
 * LocalAuthContext — manages local username/password session state.
 * This version uses REST auth endpoints instead of tRPC for login/session checks.
 */
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export interface LocalUser {
  id: number;
  username: string;
  displayName: string | null;
  role: "user" | "admin" | "viewer";
  companyId: number | null;
  mustChangePassword: boolean;
  isDemo: boolean;
}

export interface ViewerPermission {
  id: number;
  userId: number;
  companyId: number;
  canViewMonitoring: boolean;
  canEditMonitoring: boolean;
  canViewSafetyPerformance: boolean;
  canEditSafetyPerformance: boolean;
}

interface LocalAuthContextValue {
  user: LocalUser | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isViewer: boolean;
  selectedCompanyId: number | null;
  setSelectedCompanyId: (id: number | null) => void;
  activePermission: ViewerPermission | null;
  canViewMonitoring: boolean;
  canEditMonitoring: boolean;
  canViewSafetyPerformance: boolean;
  canEditSafetyPerformance: boolean;
  mustChangePassword: boolean;
  isDemo: boolean;
  logout: () => Promise<void>;
  refetch: () => void;
}

const LocalAuthContext = createContext<LocalAuthContextValue | null>(null);
const SELECTED_COMPANY_KEY = "saffhire_selected_company_id";

export function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<LocalUser | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCompanyId, _setSelectedCompanyId] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem(SELECTED_COMPANY_KEY);
      return stored ? parseInt(stored, 10) : null;
    } catch {
      return null;
    }
  });

  const setSelectedCompanyId = (id: number | null) => {
    _setSelectedCompanyId(id);
    try {
      if (id === null) localStorage.removeItem(SELECTED_COMPANY_KEY);
      else localStorage.setItem(SELECTED_COMPANY_KEY, String(id));
    } catch {
      // Ignore localStorage errors.
    }
  };

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      const text = await response.text();
      const data = text ? JSON.parse(text) : { user: null };
      setUser(data.user ?? null);
    } catch (error) {
      console.error("[Auth] Failed to load session", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (user && user.role === "user" && user.companyId) {
      setSelectedCompanyId(user.companyId);
    }
  }, [user]);

  const { data: viewerPerms } = trpc.viewerPermissions.getForUser.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user && user.role === "viewer" }
  );

  const activePermission: ViewerPermission | null =
    user?.role === "viewer" && selectedCompanyId && viewerPerms
      ? ((viewerPerms as ViewerPermission[]).find((p) => p.companyId === selectedCompanyId) ?? null)
      : null;

  const isAdmin = user?.role === "admin";
  const isViewer = user?.role === "viewer";
  const mustChangePassword = !!user?.mustChangePassword;
  const isDemo = !!user?.isDemo;

  const canViewMonitoring = isAdmin || user?.role === "user" || (activePermission?.canViewMonitoring ?? false);
  const canEditMonitoring = isAdmin || user?.role === "user" || (activePermission?.canEditMonitoring ?? false);
  const canViewSafetyPerformance = isAdmin || user?.role === "user" || (activePermission?.canViewSafetyPerformance ?? false);
  const canEditSafetyPerformance = isAdmin || user?.role === "user" || (activePermission?.canEditSafetyPerformance ?? false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setSelectedCompanyId(null);
    setUser(null);
    navigate("/login");
  };

  const refetch = () => {
    void loadUser();
  };

  return (
    <LocalAuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        isViewer,
        mustChangePassword,
        selectedCompanyId,
        setSelectedCompanyId,
        activePermission,
        canViewMonitoring,
        canEditMonitoring,
        canViewSafetyPerformance,
        canEditSafetyPerformance,
        isDemo,
        logout,
        refetch,
      }}
    >
      {children}
    </LocalAuthContext.Provider>
  );
}

export function useLocalAuth() {
  const ctx = useContext(LocalAuthContext);
  if (!ctx) throw new Error("useLocalAuth must be used within LocalAuthProvider");
  return ctx;
}
