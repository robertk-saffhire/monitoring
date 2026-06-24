/**
 * SaffHire - Dashboard Page
 *
 * Database-only dashboard. Monitoring and Safety Performance data are loaded from Supabase.
 */

import { useMemo, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import { useAppContext } from "@/contexts/AppContext";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Shield,
  Users,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function parseDate(str: string): Date | null {
  if (!str) return null;
  const parts = str.includes("/") ? str.split("/") : str.split("-");
  if (parts.length !== 3) return null;
  if (str.includes("/")) {
    const [m, d, y] = parts;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const [first, second, third] = parts;
  if (first.length === 4) return new Date(Number(first), Number(second) - 1, Number(third));
  return new Date(Number(third), Number(first) - 1, Number(second));
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(str: string): string {
  const d = parseDate(str);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  accent?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-white border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {label}
        </span>
        <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent ? `${accent}22` : "#f3f4f6" }}>
          <span style={{ color: accent ?? "#6B7280" }}>{icon}</span>
        </span>
      </div>
      <div>
        <p className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
      {onClick && (
        <div className="flex items-center gap-1 text-xs font-semibold mt-auto" style={{ color: accent ?? "#6B7280" }}>
          View list <ChevronRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { applicants, reports } = useAppContext();
  const [, navigate] = useLocation();
  const [showMedModal, setShowMedModal] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
  const { isAdmin, selectedCompanyId } = useLocalAuth();

  const { data: myCompanies } = trpc.companyAccess.myCompanies.useQuery();
  const selectedCompany = (myCompanies as Array<{ id: number; name: string }> | undefined)?.find((c) => c.id === selectedCompanyId);
  const getCsvDataMutation = trpc.backup.getCsvData.useMutation();

  const handleDownloadCsv = async () => {
    if (!selectedCompanyId) return;
    setIsDownloadingCsv(true);
    try {
      const result = await getCsvDataMutation.mutateAsync({
        companyId: selectedCompanyId,
        companyName: selectedCompany?.name ?? "",
      });
      if (!result) throw new Error("No data returned");
      const { monitoringCsv, safetyPerformanceCsv, timestamp, companyName } = result;
      const slug = (companyName || "company").replace(/\s+/g, "-").toLowerCase();

      const monBlob = new Blob([monitoringCsv], { type: "text/csv" });
      const monUrl = URL.createObjectURL(monBlob);
      const monLink = document.createElement("a");
      monLink.href = monUrl;
      monLink.download = `${slug}-monitoring-backup-${timestamp}.csv`;
      monLink.click();
      URL.revokeObjectURL(monUrl);

      await new Promise((r) => setTimeout(r, 300));
      const spBlob = new Blob([safetyPerformanceCsv], { type: "text/csv" });
      const spUrl = URL.createObjectURL(spBlob);
      const spLink = document.createElement("a");
      spLink.href = spUrl;
      spLink.download = `${slug}-safety-performance-backup-${timestamp}.csv`;
      spLink.click();
      URL.revokeObjectURL(spUrl);

      toast.success(`Downloaded 2 CSV files — ${result.monitoringCount} monitoring rows + ${result.safetyPerformanceCount} safety reports`);
    } catch (err: unknown) {
      console.error("[CSV Download Error]", err);
      const msg = err instanceof Error ? err.message : String(err) || "Download failed";
      toast.error(msg);
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  const totalApplicants = applicants.length;
  const onMonitor = applicants.filter((a) => a.monitorStatus === "On").length;
  const offMonitor = applicants.filter((a) => a.monitorStatus === "Off").length;

  const expiringMed = useMemo(() => {
    return applicants
      .filter((a) => {
        const d = parseDate(a.medExpire);
        if (!d) return false;
        const days = daysUntil(d);
        return days >= 0 && days <= 30;
      })
      .sort((a, b) => parseDate(a.medExpire)!.getTime() - parseDate(b.medExpire)!.getTime());
  }, [applicants]);

  const totalReports = reports.length;
  const s1Complete = reports.filter((r) => r.status === "S1 Complete").length;
  const empSent = reports.filter((r) => r.status === "Emp Sent").length;
  const empComplete = reports.filter((r) => r.status === "Emp Complete").length;
  const completed = reports.filter((r) => r.status === "Completed").length;

  const followUpsDue = useMemo(() => {
    return reports
      .filter((r) => {
        const d = parseDate(r.followUpDate);
        if (!d) return false;
        const days = daysUntil(d);
        return days >= 0 && days <= 7;
      })
      .sort((a, b) => parseDate(a.followUpDate)!.getTime() - parseDate(b.followUpDate)!.getTime());
  }, [reports]);

  const monitorPieData = [
    { name: "On Monitor", value: onMonitor },
    { name: "Off Monitor", value: offMonitor },
  ];

  const reportBarData = [
    { name: "S1 Complete", count: s1Complete, fill: "#1FFF00" },
    { name: "Emp Sent", count: empSent, fill: "#3B82F6" },
    { name: "Emp Complete", count: empComplete, fill: "#F59E0B" },
    { name: "Completed", count: completed, fill: "#6B7280" },
  ];

  const PIE_COLORS = ["#1FFF00", "#E5E7EB"];
  const onPercent = totalApplicants > 0 ? Math.round((onMonitor / totalApplicants) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Live snapshot of Supabase monitoring and safety performance activity</p>
        </div>

        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Monitoring</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard icon={<Users className="w-5 h-5" />} label="Total Applicants" value={totalApplicants} accent="#1D4ED8" onClick={() => navigate("/")} />
          <KpiCard icon={<Activity className="w-5 h-5" />} label="On Monitor" value={onMonitor} sub={`${onPercent}% of total`} accent="#15a300" />
          <KpiCard icon={<CheckCircle2 className="w-5 h-5" />} label="Off Monitor" value={offMonitor} accent="#6B7280" />
          <KpiCard icon={<AlertTriangle className="w-5 h-5" />} label="Med Certs Expiring" value={expiringMed.length} sub="within 30 days — click to view" accent="#EF4444" onClick={() => setShowMedModal(true)} />
        </div>

        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>Safety Performance Reports</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <KpiCard icon={<FileText className="w-5 h-5" />} label="Total Reports" value={totalReports} accent="#1D4ED8" onClick={() => navigate("/safety-performance")} />
          <KpiCard icon={<Clock className="w-5 h-5" />} label="S1 Complete" value={s1Complete} accent="#15a300" />
          <KpiCard icon={<Activity className="w-5 h-5" />} label="Emp Sent" value={empSent} accent="#3B82F6" />
          <KpiCard icon={<CheckCircle2 className="w-5 h-5" />} label="Emp Complete" value={empComplete} accent="#F59E0B" />
          <KpiCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completed" value={completed} accent="#6B7280" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Monitor Status Split</h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={monitorPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {monitorPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} applicants`]} />
                <Legend iconType="circle" formatter={(value) => <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>Safety Report Status Breakdown</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={reportBarData} barCategoryGap="40%">
                <XAxis dataKey="name" tick={{ fontFamily: "'Poppins', sans-serif", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontFamily: "'Poppins', sans-serif", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v} reports`]} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {reportBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-[#1D4ED8]" />
              <h4 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>Database Export</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Download current Supabase Monitoring and Safety Performance data as CSV files.</p>
            <Button onClick={handleDownloadCsv} disabled={isDownloadingCsv} variant="outline" className="gap-2 text-sm font-semibold bg-white">
              <Download className="w-4 h-4" />
              {isDownloadingCsv ? "Preparing Download…" : "Download CSV Files"}
            </Button>
          </div>
        )}

        <div className="bg-white border border-border rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>Safety Report Follow-Ups Due (Next 7 Days)</h4>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/safety-performance")}>View All Reports</Button>
          </div>
          {followUpsDue.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No follow-ups due in the next 7 days.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Applicant</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">File #</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Follow Up Date</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Days Left</th>
                  </tr>
                </thead>
                <tbody>
                  {followUpsDue.map((r) => {
                    const d = parseDate(r.followUpDate)!;
                    const days = daysUntil(d);
                    return (
                      <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-foreground">{r.applicantName}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{r.fileNumber}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{r.status}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{formatDate(r.followUpDate)}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{days === 0 ? "Today" : `${days}d`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }} onClick={(e) => { if (e.target === e.currentTarget) setShowMedModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>Medical Certs Expiring Within 30 Days</h3>
                <p className="text-xs text-muted-foreground mt-1">{expiringMed.length} applicant{expiringMed.length !== 1 ? "s" : ""} found</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowMedModal(false)}>Close</Button>
            </div>
            <div className="overflow-y-auto p-6">
              {expiringMed.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No medical certificates expiring within 30 days.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Applicant</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">File #</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Med Expire</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Days Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringMed.map((a) => {
                      const d = parseDate(a.medExpire)!;
                      const days = daysUntil(d);
                      return (
                        <tr key={a.fileNumber} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-foreground">{a.name}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{a.fileNumber}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{formatDate(a.medExpire)}</td>
                          <td className="py-2.5 px-3 text-muted-foreground">{days === 0 ? "Today" : `${days}d`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
