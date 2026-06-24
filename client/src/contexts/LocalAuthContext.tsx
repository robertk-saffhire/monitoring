/**
 * LocalAuthContext — manages local username/password session state.
 * Wraps trpc.localAuth.me to provide the current user and helpers.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export interface LocalUser {
  id: number;
  username: string;
  displayName: string | null;
  role: "user" | "admin" | "viewer";
  /** For role=user: the company they belong to. For admin/viewer: null. */
  companyId: number | null;
  /** When true, user must change their password before accessing the dashboard */
  mustChangePassword: boolean;
  /** When true, this is the public demo account — read-only except for toggles */
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
  /** The currently selected company ID (set after company selector screen) */
  selectedCompanyId: number | null;
  setSelectedCompanyId: (id: number | null) => void;
  /** Viewer permissions for the selected company (null = no restrictions = full access) */
  activePermission: ViewerPermission | null;
  /** Whether the current user can view the Monitoring page for the selected company */
  canViewMonitoring: boolean;
  /** Whether the current user can edit data on the Monitoring page */
  canEditMonitoring: boolean;
  /** Whether the current user can view the Safety Performance page */
  canViewSafetyPerformance: boolean;
  /** Whether the current user can edit data on the Safety Performance page */
  canEditSafetyPerformance: boolean;
  /** Whether the current user must change their password before accessing the dashboard */
  mustChangePassword: boolean;
  /** Whether the current session is the public demo account */
  isDemo: boolean;
  logout: () => Promise<void>;
  refetch: () => void;
}

const LocalAuthContext = createContext<LocalAuthContextValue | null>(null);

const SELECTED_COMPANY_KEY = "saffhire_selected_company_id";

export function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();

  // Persist selectedCompanyId in localStorage so it survives navigation and page refresh
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
      if (id === null) {
        localStorage.removeItem(SELECTED_COMPANY_KEY);
      } else {
        localStorage.setItem(SELECTED_COMPANY_KEY, String(id));
      }
    } catch {
      // ignore localStorage errors
    }
  };

  const { data: user, isLoading, refetch } = trpc.localAuth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // For company users (role=user), auto-select their assigned company once loaded
  useEffect(() => {
    if (user && user.role === "user" && user.companyId) {
      setSelectedCompanyId(user.companyId);
    }
  }, [user]);

  // Fetch viewer permissions for the selected company (viewers only)
  const { data: viewerPerms } = trpc.viewerPermissions.getForUser.useQuery(
    { userId: user?.id ?? 0 },
    { enabled: !!user && user.role === "viewer" }
  );

  const activePermission: ViewerPermission | null =
    user?.role === "viewer" && selectedCompanyId && viewerPerms
      ? ((viewerPerms as ViewerPermission[]).find((p) => p.companyId === selectedCompanyId) ?? null)
      : null;

  // Admins and company users always have full access
  // Viewers use their per-company permission record
  const isAdmin = user?.role === "admin";
  const isViewer = user?.role === "viewer";
  const mustChangePassword = !!(user?.mustChangePassword);
  const isDemo = !!(user?.isDemo);

  const canViewMonitoring = isAdmin || user?.role === "user" || (activePermission?.canViewMonitoring ?? false);
  const canEditMonitoring = isAdmin || user?.role === "user" || (activePermission?.canEditMonitoring ?? false);
  const canViewSafetyPerformance = isAdmin || user?.role === "user" || (activePermission?.canViewSafetyPerformance ?? false);
  const canEditSafetyPerformance = isAdmin || user?.role === "user" || (activePermission?.canEditSafetyPerformance ?? false);

  const logoutMutation = trpc.localAuth.logout.useMutation({
    onSuccess: () => {
      setSelectedCompanyId(null);
      refetch();
      navigate("/login");
    },
  });

  const logout = async () => {
    await logoutMutation.mutateAsync();
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
