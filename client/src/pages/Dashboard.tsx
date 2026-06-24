/**
 * SaffHire - Dashboard Page
 *
 * Live KPI cards, charts, expiring med certs list, and upcoming follow-ups.
 * All data sourced from shared AppContext (Monitoring applicants + Safety Reports).
 */

import { useState, useMemo } from "react";
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
  FileText,
  Users,
  ChevronRight,
  X,
  CloudUpload,
  Download,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── helpers ────────────────────────────────────────────────────────────────

function parseDate(str: string): Date | null {
  if (!str) return null;
  // Supports MM/DD/YYYY and YYYY-MM-DD
  const parts = str.includes("/") ? str.split("/") : str.split("-");
  if (parts.length !== 3) return null;
  if (str.includes("/")) {
    const [m, d, y] = parts;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const [y, m, d] = parts;
  return new Date(Number(y), Number(m) - 1, Number(d));
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

// ─── sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
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
        <span
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: accent ? `${accent}22` : "#f3f4f6" }}
        >
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

// ─── main component ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { applicants, reports } = useAppContext();
  const [, navigate] = useLocation();
  const [showMedModal, setShowMedModal] = useState(false);
  const { isAdmin, selectedCompanyId } = useLocalAuth();

  // ── Backup state ──
  const [backupSheetUrl, setBackupSheetUrl] = useState("");
  const [isPushingToSheet, setIsPushingToSheet] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);

  const { data: myCompanies } = trpc.companyAccess.myCompanies.useQuery();
  const selectedCompany = (myCompanies as Array<{ id: number; name: string; sheetUrlMonitoringBackup?: string }> | undefined)
    ?.find((c) => c.id === selectedCompanyId);

  const pushToSheetMutation = trpc.backup.pushToSheet.useMutation();

  // Memoize monitoringRows to prevent a new array reference on every render,
  // which would cause the getCsvData query key to change and refetch() to return stale data.
  const monitoringRows = useMemo(
    () =>
      applicants.map((a) => ({
        fileNumber: a.fileNumber,
        name: a.name,
        orderDate: a.orderDate,
        monitorStatus: a.monitorStatus,
        mvrStatus: a.mvrStatus ?? "",
        medExpire: a.medExpire ?? "",
        notes: a.notes ?? "",
      })),
    [applicants]
  );

  const trpcUtils = trpc.useUtils();

  const handlePushToSheet = async () => {
    const url = backupSheetUrl.trim() || selectedCompany?.sheetUrlMonitoringBackup || "";
    if (!url) {
      toast.error("Please enter a Backup Sheet URL first, or configure one in Settings → Companies.");
      return;
    }
    if (!selectedCompanyId) return;
    setIsPushingToSheet(true);
    try {
      const result = await pushToSheetMutation.mutateAsync({
        companyId: selectedCompanyId,
        sheetUrl: url,
        monitoringRows,
      });
      toast.success(
        `Backup complete — ${result.monitoringCount} monitoring rows + ${result.safetyPerformanceCount} safety reports pushed to Google Sheet (${result.timestamp})`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Backup push failed";
      toast.error(msg);
    } finally {
      setIsPushingToSheet(false);
    }
  };

  const getCsvDataMutation = trpc.backup.getCsvData.useMutation();

  const handleDownloadCsv = async () => {
    if (!selectedCompanyId) return;
    setIsDownloadingCsv(true);
    try {
      const result = await getCsvDataMutation.mutateAsync({
        companyId: selectedCompanyId,
        companyName: selectedCompany?.name ?? "",
        monitoringRows,
      });
      if (!result) throw new Error("No data returned");
      const { monitoringCsv, safetyPerformanceCsv, timestamp, companyName } = result;
      const slug = companyName.replace(/\s+/g, "-").toLowerCase();

      // Download Monitoring CSV
      const monBlob = new Blob([monitoringCsv], { type: "text/csv" });
      const monUrl = URL.createObjectURL(monBlob);
      const monLink = document.createElement("a");
      monLink.href = monUrl;
      monLink.download = `${slug}-monitoring-backup-${timestamp}.csv`;
      monLink.click();
      URL.revokeObjectURL(monUrl);

      // Short delay then download Safety Performance CSV
      await new Promise((r) => setTimeout(r, 300));
      const spBlob = new Blob([safetyPerformanceCsv], { type: "text/csv" });
      const spUrl = URL.createObjectURL(spBlob);
      const spLink = document.createElement("a");
      spLink.href = spUrl;
      spLink.download = `${slug}-safety-performance-backup-${timestamp}.csv`;
      spLink.click();
      URL.revokeObjectURL(spUrl);

      toast.success(
        `Downloaded 2 CSV files — ${result.monitoringCount} monitoring rows + ${result.safetyPerformanceCount} safety reports`
      );
    } catch (err: unknown) {
      console.error("[CSV Download Error]", err);
      const msg = err instanceof Error ? err.message : String(err) ?? "Download failed";
      toast.error(msg);
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Monitoring stats ──
  const totalApplicants = applicants.length;
  const onMonitor = applicants.filter((a) => a.monitorStatus === "On").length;
  const offMonitor = applicants.filter((a) => a.monitorStatus === "Off").length;
  const activeMvrs = applicants.filter((a) => !!a.mvrStatus).length;

  const expiringMed = useMemo(() => {
    return applicants
      .filter((a) => {
        const d = parseDate(a.medExpire);
        if (!d) return false;
        const days = daysUntil(d);
        return days >= 0 && days <= 30;
      })
      .sort((a, b) => {
        const da = parseDate(a.medExpire)!;
        const db = parseDate(b.medExpire)!;
        return da.getTime() - db.getTime();
      });
  }, [applicants]);

  // ── Safety Report stats ──
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
      .sort((a, b) => {
        const da = parseDate(a.followUpDate)!;
        const db = parseDate(b.followUpDate)!;
        return da.getTime() - db.getTime();
      });
  }, [reports]);

  // ── Chart data ──
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

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Live snapshot of monitoring and safety performance activity
          </p>
        </div>

        {/* ── Section: Monitoring ── */}
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Monitoring
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard
            icon={<Users className="w-5 h-5" />}
            label="Total Applicants"
            value={totalApplicants}
            accent="#1D4ED8"
            onClick={() => navigate("/")}
          />
          <KpiCard
            icon={<Activity className="w-5 h-5" />}
            label="On Monitor"
            value={onMonitor}
            sub={`${Math.round((onMonitor / totalApplicants) * 100)}% of total`}
            accent="#15a300"
          />
          <KpiCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Off Monitor"
            value={offMonitor}
            accent="#6B7280"
          />
          <KpiCard
            icon={<AlertTriangle className="w-5 h-5" />}
            label="Med Certs Expiring"
            value={expiringMed.length}
            sub="within 30 days — click to view"
            accent="#EF4444"
            onClick={() => setShowMedModal(true)}
          />
        </div>

        {/* ── Section: Safety Performance ── */}
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Safety Performance Reports
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <KpiCard
            icon={<FileText className="w-5 h-5" />}
            label="Total Reports"
            value={totalReports}
            accent="#1D4ED8"
            onClick={() => navigate("/safety-performance")}
          />
          <KpiCard icon={<Clock className="w-5 h-5" />} label="S1 Complete" value={s1Complete} accent="#15a300" />
          <KpiCard icon={<Activity className="w-5 h-5" />} label="Emp Sent" value={empSent} accent="#3B82F6" />
          <KpiCard icon={<CheckCircle2 className="w-5 h-5" />} label="Emp Complete" value={empComplete} accent="#F59E0B" />
          <KpiCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completed" value={completed} accent="#6B7280" />
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Monitor Status Donut */}
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Monitor Status Split
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={monitorPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {monitorPieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} applicants`]} />
                <Legend
                  iconType="circle"
                  formatter={(value) => (
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Safety Report Status Bar */}
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <h4 className="text-sm font-bold text-foreground mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Safety Report Status Breakdown
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={reportBarData} barCategoryGap="40%">
                <XAxis
                  dataKey="name"
                  tick={{ fontFamily: "'Poppins', sans-serif", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontFamily: "'Poppins', sans-serif", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(v) => [`${v} reports`]} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {reportBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Backup Panel (admin only) ── */}
        {isAdmin && (
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-[#1D4ED8]" />
              <h4 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Data Backup
              </h4>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Back up all Monitoring and Safety Performance data on demand. Choose Google Sheets (cloud) or CSV download (local), or both.
            </p>

            {/* Sheet URL input — pre-filled from company settings if configured */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-foreground mb-1">Backup Sheet URL</label>
              <input
                type="url"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                placeholder={selectedCompany?.sheetUrlMonitoringBackup || "Paste your Google Apps Script Web App URL here…"}
                value={backupSheetUrl}
                onChange={(e) => setBackupSheetUrl(e.target.value)}
              />
              {selectedCompany?.sheetUrlMonitoringBackup && !backupSheetUrl && (
                <p className="text-xs text-muted-foreground mt-1">
                  Using URL configured in Settings → Companies. Enter a URL above to override.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handlePushToSheet}
                disabled={isPushingToSheet}
                className="gap-2 text-sm font-semibold"
                style={{ backgroundColor: "#1D4ED8", color: "#fff" }}
              >
                <CloudUpload className="w-4 h-4" />
                {isPushingToSheet ? "Pushing to Sheet…" : "Push to Google Sheet"}
              </Button>
              <Button
                onClick={handleDownloadCsv}
                disabled={isDownloadingCsv}
                variant="outline"
                className="gap-2 text-sm font-semibold bg-white"
              >
                <Download className="w-4 h-4" />
                {isDownloadingCsv ? "Preparing Download…" : "Download CSV Files"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              <strong>Push to Google Sheet</strong> creates a new timestamped tab in your backup sheet with all current data.
              {" "}<strong>Download CSV</strong> saves two files to your computer — one for Monitoring, one for Safety Performance.
            </p>
          </div>
        )}

        {/* ── Follow-Ups Due (next 7 days) ── */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Safety Report Follow-Ups Due (Next 7 Days)
            </h4>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => navigate("/safety-performance")}
            >
              View All Reports
            </Button>
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
                        <td className="py-2.5 px-3">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: r.status === "S1 Complete" ? "rgba(31,255,0,0.15)" : "#F3F4F6",
                              color: r.status === "S1 Complete" ? "#15a300" : "#6B7280",
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{formatDate(r.followUpDate)}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className="font-semibold text-xs"
                            style={{ color: days <= 2 ? "#EF4444" : days <= 5 ? "#F59E0B" : "#15a300" }}
                          >
                            {days === 0 ? "Today" : `${days}d`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Expiring Med Certs Modal ── */}
      {showMedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowMedModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Medical Certs Expiring Within 30 Days
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {expiringMed.length} {expiringMed.length === 1 ? "applicant" : "applicants"} require attention
                </p>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
                onClick={() => setShowMedModal(false)}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1">
              {expiringMed.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No medical certs expiring in the next 30 days.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-secondary border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground">Applicant</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground">File #</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground">Monitor</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground">Expiry Date</th>
                      <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground">Days Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringMed.map((a) => {
                      const d = parseDate(a.medExpire)!;
                      const days = daysUntil(d);
                      const urgency =
                        days <= 5
                          ? { bg: "#FEF2F2", text: "#EF4444" }
                          : days <= 14
                          ? { bg: "#FFFBEB", text: "#D97706" }
                          : { bg: "#F0FDF4", text: "#15a300" };
                      return (
                        <tr
                          key={a.id}
                          className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="py-3 px-5 font-medium text-foreground">{a.name}</td>
                          <td className="py-3 px-5 text-muted-foreground">{a.fileNumber}</td>
                          <td className="py-3 px-5">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                              style={{
                                backgroundColor: a.monitorStatus === "On" ? "rgba(31,255,0,0.15)" : "#F3F4F6",
                                color: a.monitorStatus === "On" ? "#15a300" : "#6B7280",
                              }}
                            >
                              {a.monitorStatus}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-muted-foreground">{formatDate(a.medExpire)}</td>
                          <td className="py-3 px-5">
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold"
                              style={{ backgroundColor: urgency.bg, color: urgency.text }}
                            >
                              {days === 0 ? "Today" : days === 1 ? "1 day" : `${days} days`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-border flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Color coding: <span className="text-red-500 font-semibold">Red</span> = ≤5 days, <span className="text-amber-600 font-semibold">Amber</span> = ≤14 days, <span className="text-green-600 font-semibold">Green</span> = ≤30 days
              </p>
              <Button
                size="sm"
                className="font-semibold"
                style={{ backgroundColor: "#1D4ED8", color: "#fff" }}
                onClick={() => { setShowMedModal(false); navigate("/"); }}
              >
                Go to Monitoring
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
