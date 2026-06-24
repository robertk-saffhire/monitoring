/**
 * SaffHire - Shared App Context
 * Monitoring data now uses Supabase only.
 * No Google Sheets reads or writes are used by this context.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { SafetyReport } from "@/pages/SafetyPerformance";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { toast } from "sonner";

export interface Applicant {
  id: string;
  name: string;
  fileNumber: string;
  orderDate: string;
  monitorStatus: "On" | "Off";
  mvrStatus: string;
  medExpire: string;
  medExpireOverridden: boolean;
  notes: string;
}

interface SupabaseApplicantRow {
  id?: string | number;
  fileNumber: string;
  name: string;
  orderDate: string;
  monitorStatus: string;
  mvrStatus?: string;
  medExpire?: string;
  medExpireOverridden?: boolean;
  notes?: string;
}

interface MonitoringApplicantsResponse {
  status: string;
  source?: "supabase";
  message?: string;
  data: SupabaseApplicantRow[];
}

interface MonitoringApplicantWriteResponse {
  status: string;
  source?: "supabase";
  message?: string;
  data: SupabaseApplicantRow;
}

function formatDate(raw: unknown): string {
  if (!raw) return "";
  const str = String(raw).trim();
  if (!str) return "";
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) return str;
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const y = d.getFullYear();
    return `${m}-${day}-${y}`;
  }
  return str;
}

function normalizeMonitorStatus(raw: unknown): "On" | "Off" {
  return String(raw ?? "").trim() === "On" ? "On" : "Off";
}

function rowToApplicant(row: SupabaseApplicantRow, index: number): Applicant {
  return {
    id: String(row.id ?? index + 1),
    name: String(row.name ?? "").trim().toUpperCase(),
    fileNumber: String(row.fileNumber ?? "").trim(),
    orderDate: formatDate(row.orderDate),
    monitorStatus: normalizeMonitorStatus(row.monitorStatus),
    mvrStatus: String(row.mvrStatus ?? "").trim(),
    medExpire: row.medExpire ? formatDate(row.medExpire) : "",
    medExpireOverridden: Boolean(row.medExpireOverridden),
    notes: row.notes ?? "",
  };
}

async function fetchSupabaseApplicants(companyId: number): Promise<MonitoringApplicantsResponse> {
  const res = await fetch(`/api/monitoring/applicants?companyId=${encodeURIComponent(companyId)}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Supabase monitoring read failed: ${res.status}`);
  }
  return res.json();
}

async function patchSupabaseApplicant(
  companyId: number,
  fileNumber: string,
  body: Partial<Pick<Applicant, "monitorStatus" | "notes" | "medExpire">>
): Promise<MonitoringApplicantWriteResponse> {
  const res = await fetch(`/api/monitoring/applicants/${encodeURIComponent(fileNumber)}?companyId=${encodeURIComponent(companyId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(payload?.message ?? `Supabase monitoring write failed: ${res.status}`);
  }
  return payload;
}

interface AppContextValue {
  applicants: Applicant[];
  setApplicants: React.Dispatch<React.SetStateAction<Applicant[]>>;
  reports: SafetyReport[];
  setReports: React.Dispatch<React.SetStateAction<SafetyReport[]>>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  skipAutoRefetch: boolean;
  setSkipAutoRefetch: (skip: boolean) => void;
  writeMonitorStatus: (fileNumber: string, status: "On" | "Off", applicantName?: string) => Promise<void>;
  writeNote: (fileNumber: string, notes: string) => Promise<void>;
  writeMedExpire: (fileNumber: string, medExpire: string) => Promise<void>;
  saveSafetyReport: (data: Partial<SafetyReport>) => Promise<SafetyReport>;
  deleteSafetyReportById: (id: number) => Promise<void>;
  reportsLoading: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchTick, setFetchTick] = useState(0);
  const [skipAutoRefetch, setSkipAutoRefetch] = useState(false);

  const refetch = useCallback(() => { setSkipAutoRefetch(false); setFetchTick((t) => t + 1); }, []);

  const { isAuthenticated, isLoading: authLoading, selectedCompanyId } = useLocalAuth();

  const { data: dbReports, isLoading: reportsLoading, refetch: refetchReports } = trpc.safetyReports.list.useQuery(
    selectedCompanyId ? { companyId: selectedCompanyId } : undefined,
    { enabled: isAuthenticated && !authLoading && !!selectedCompanyId }
  );

  const upsertMutation = trpc.safetyReports.upsert.useMutation();
  const deleteReportMutation = trpc.safetyReports.delete.useMutation();

  useEffect(() => {
    if (dbReports) {
      setReports(dbReports as SafetyReport[]);
    }
  }, [dbReports]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !selectedCompanyId) {
      setLoading(false);
      return;
    }

    if (skipAutoRefetch) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSupabaseApplicants(selectedCompanyId)
      .then((result) => {
        if (cancelled) return;
        if (result.status !== "ok" || !Array.isArray(result.data)) {
          throw new Error(result.message ?? "Unexpected response from Supabase applicants table");
        }
        setApplicants(result.data.map(rowToApplicant));
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message ?? "Failed to load monitoring data from Supabase");
        setApplicants([]);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [fetchTick, isAuthenticated, authLoading, selectedCompanyId, skipAutoRefetch]);

  const replaceApplicantInState = useCallback((updated: Applicant) => {
    setApplicants((prev) => prev.map((applicant) => applicant.fileNumber === updated.fileNumber ? updated : applicant));
  }, []);

  const writeMonitorStatus = useCallback(async (fileNumber: string, status: "On" | "Off", _applicantName?: string) => {
    if (!selectedCompanyId) throw new Error("No company selected");
    const result = await patchSupabaseApplicant(selectedCompanyId, fileNumber, { monitorStatus: status });
    replaceApplicantInState(rowToApplicant(result.data, 0));
    toast.success("Monitor status updated");
  }, [replaceApplicantInState, selectedCompanyId]);

  const writeNote = useCallback(async (fileNumber: string, notes: string) => {
    if (!selectedCompanyId) throw new Error("No company selected");
    const result = await patchSupabaseApplicant(selectedCompanyId, fileNumber, { notes });
    replaceApplicantInState(rowToApplicant(result.data, 0));
    toast.success("Note updated");
  }, [replaceApplicantInState, selectedCompanyId]);

  const writeMedExpire = useCallback(async (fileNumber: string, medExpire: string) => {
    if (!selectedCompanyId) throw new Error("No company selected");
    const result = await patchSupabaseApplicant(selectedCompanyId, fileNumber, { medExpire });
    replaceApplicantInState(rowToApplicant(result.data, 0));
    toast.success("Med expire updated");
  }, [replaceApplicantInState, selectedCompanyId]);

  const saveSafetyReport = useCallback(async (data: Partial<SafetyReport>): Promise<SafetyReport> => {
    const dataWithCompany = selectedCompanyId ? { ...data, companyId: selectedCompanyId } : data;
    const saved = await upsertMutation.mutateAsync(dataWithCompany as Parameters<typeof upsertMutation.mutateAsync>[0]);
    await refetchReports();
    return saved as SafetyReport;
  }, [upsertMutation, refetchReports, selectedCompanyId]);

  const deleteSafetyReportById = useCallback(async (id: number): Promise<void> => {
    await deleteReportMutation.mutateAsync({ id });
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success("Report deleted");
  }, [deleteReportMutation]);

  return (
    <AppContext.Provider
      value={{ applicants, setApplicants, reports, setReports, loading, error, refetch, skipAutoRefetch, setSkipAutoRefetch, writeMonitorStatus, writeNote, writeMedExpire, saveSafetyReport, deleteSafetyReportById, reportsLoading }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export const useAppContext = useApp;
