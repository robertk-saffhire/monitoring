/**
 * SaffHire Monitoring Dashboard - Monitoring Page
 *
 * Design System:
 * - Accent: Bright green (#1FFF00) for interactive elements and status badges
 * - Font: Poppins for all text
 * - Background: White (#FFFFFF) with light gray cards (#F9FAFB)
 * - Border: #E5E7EB (light gray)
 * - Foreground: #1F2937 (dark gray)
 * - Muted: #6B7280
 */

import { useState, useMemo, useEffect } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useAppContext, Applicant } from "@/contexts/AppContext";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, RefreshCw, AlertCircle, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface EditState {
  [key: string]: {
    monitorStatus: "On" | "Off";
    medExpire: string;
    notes: string;
  };
}

export default function Monitoring() {
  const { applicants, setApplicants, loading, error, refetch, skipAutoRefetch, setSkipAutoRefetch, writeMonitorStatus, writeNote, writeMedExpire } = useAppContext();
  const { canViewMonitoring, canEditMonitoring, isDemo, isLoading: authLoading, selectedCompanyId } = useLocalAuth();
  // In demo mode: toggles work but text inputs (Med Expire, Notes) and Save are disabled
  const demoTextDisabled = isDemo;
  const { data: myCompanies } = trpc.companyAccess.myCompanies.useQuery();
  const selectedCompanyName = (myCompanies as Array<{ id: number; name: string }> | undefined)?.find((c) => c.id === selectedCompanyId)?.name ?? "";

  const [statusFilter, setStatusFilter] = useState<"All" | "On" | "Off">("All");
  const [searchTerm, setSearchTerm] = useState("");
  // Initialize activeSearch from localStorage, or empty string
  const [activeSearch, setActiveSearch] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("monitoringLastSearch") || "";
    }
    return "";
  });
  const [pageSize, setPageSize] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [editState, setEditState] = useState<EditState>({});
  const [sortField, setSortField] = useState<"fileNumber" | "orderDate" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Persist activeSearch to localStorage whenever it changes
  useEffect(() => {
    if (activeSearch !== "") {
      localStorage.setItem("monitoringLastSearch", activeSearch);
    }
  }, [activeSearch]);

  // When applicants data refreshes, re-apply the active search to keep the filtered view
  useEffect(() => {
    if (activeSearch !== "") {
      setCurrentPage(1);
    }
  }, [applicants, activeSearch]);

  const handleSort = (field: "fileNumber" | "orderDate") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: "fileNumber" | "orderDate" }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3.5 h-3.5 ml-1" style={{ color: "#1FFF00" }} />
      : <ArrowDown className="w-3.5 h-3.5 ml-1" style={{ color: "#1FFF00" }} />;
  };

  const handleMonitorStatusChange = async (id: string, newStatus: "On" | "Off") => {
    const applicant = applicants.find((a) => a.id === id);
    if (!applicant) return;

    // Optimistically update local state immediately
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, monitorStatus: newStatus } : a))
    );
    // Clear any pending edit for this field so getStatus() reflects the live value
    setEditState((prev) => {
      const next = { ...prev };
      if (next[id]) {
        const { monitorStatus: _ms, ...rest } = next[id];
        next[id] = rest as EditState[string];
      }
      return next;
    });

    // In demo mode: show a friendly notice and skip the actual write
    if (demoTextDisabled) {
      toast.info("Demo mode — toggle changes are not saved to the data source.", { duration: 3000 });
      return;
    }

    // Auto-save to the sheet
    setSavingIds((prev) => new Set(prev).add(id));
    try {
      await writeMonitorStatus(applicant.fileNumber, newStatus, applicant.name);
    } catch {
      toast.error(`Failed to save monitor status for ${applicant.name}. Please try again.`);
      // Revert on failure
      setApplicants((prev) =>
        prev.map((a) => (a.id === id ? { ...a, monitorStatus: applicant.monitorStatus } : a))
      );
    } finally {
      setSavingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleMedExpireChange = (id: string, value: string) => {
    setEditState((prev) => ({
      ...prev,
      [id]: { ...prev[id], medExpire: value },
    }));
  };

  const handleNotesChange = (id: string, value: string) => {
    setEditState((prev) => ({
      ...prev,
      [id]: { ...prev[id], notes: value },
    }));
  };

  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const handleSave = async (applicant: Applicant) => {

    
    const edits = editState[applicant.id];
    const newStatus = edits?.monitorStatus ?? applicant.monitorStatus;
    const statusChanged = newStatus !== applicant.monitorStatus;

    // Optimistically update local state
    if (edits) {
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === applicant.id
            ? {
                ...a,
                monitorStatus: edits.monitorStatus ?? a.monitorStatus,
                medExpire: edits.medExpire ?? a.medExpire,
                notes: edits.notes ?? a.notes,
              }
            : a
        )
      );
      setEditState((prev) => {
        const next = { ...prev };
        delete next[applicant.id];
        return next;
      });
    }

    // Determine what changed
    const newNotes = edits?.notes ?? applicant.notes;
    const notesChanged = newNotes !== applicant.notes;
    const newMedExpire = edits?.medExpire ?? applicant.medExpire;
    const medExpireChanged = newMedExpire !== applicant.medExpire;

    // Sync changes to data sources
    if (statusChanged || notesChanged || medExpireChanged) {
      setSavingIds((prev) => new Set(prev).add(applicant.id));
      try {
        await Promise.all([
          statusChanged ? writeMonitorStatus(applicant.fileNumber, newStatus, applicant.name) : Promise.resolve(),
          notesChanged ? writeNote(applicant.fileNumber, newNotes) : Promise.resolve(),
          medExpireChanged ? writeMedExpire(applicant.fileNumber, newMedExpire) : Promise.resolve(),
        ]);
        toast.success(`Saved ${applicant.name}`);
      } catch {
        toast.error(`Failed to save ${applicant.name}. Please try again.`);
      } finally {
        setSavingIds((prev) => { const s = new Set(prev); s.delete(applicant.id); return s; });
      }
    } else {
      toast.success(`Saved ${applicant.name}`);
    }
  };



  const handleExportCSV = () => {
    const headers = ["Applicant Name", "File Number", "Order Date", "Monitor Status", "MVR Status", "Med Expire", "Notes"];
    const rows = applicants.map((a) => [
      a.name,
      a.fileNumber,
      a.orderDate,
      editState[a.id]?.monitorStatus ?? a.monitorStatus,
      a.mvrStatus || "-",
      (editState[a.id]?.medExpire ?? a.medExpire) || "",
      (editState[a.id]?.notes ?? a.notes) || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "saffhire-monitoring.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully.");
  };

  const getStatus = (a: Applicant) => editState[a.id]?.monitorStatus ?? a.monitorStatus;
  const getMedExpire = (a: Applicant) => editState[a.id]?.medExpire ?? a.medExpire;
  const getNotes = (a: Applicant) => editState[a.id]?.notes ?? a.notes;

  /** Returns a color based on how close the Med Expire date is to today */
  const getMedExpireColor = (dateStr: string): string | undefined => {
    if (!dateStr) return undefined;
    // Parse MM-DD-YYYY or other common formats
    let d: Date;
    const parts = dateStr.split(/[-\/]/);
    if (parts.length === 3) {
      // Try MM-DD-YYYY first
      const [a, b, c] = parts.map(Number);
      if (c > 1000) {
        d = new Date(c, a - 1, b); // MM-DD-YYYY
      } else {
        d = new Date(a, b - 1, c); // YYYY-MM-DD
      }
    } else {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffMs = d.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) return "#dc2626"; // red
    if (diffDays <= 60) return "#ea580c"; // orange
    return "#15a300"; // green (has a date but not expiring soon)
  };

  const filteredData = useMemo(() => {
    const filtered = applicants.filter((a) => {
      const matchesStatus = statusFilter === "All" || a.monitorStatus === statusFilter;
      const matchesSearch =
        a.name.toLowerCase().includes(activeSearch.toLowerCase()) ||
        a.fileNumber.includes(activeSearch);
      return matchesStatus && matchesSearch;
    });

    if (!sortField) return filtered;

    return [...filtered].sort((a, b) => {
      let valA: string | number = a[sortField];
      let valB: string | number = b[sortField];

      if (sortField === "fileNumber") {
        // Stable numeric sort: extract leading digits, fall back to full string for ties.
        // This handles purely numeric file numbers (e.g. "5060") as well as
        // alphanumeric ones (e.g. "5060A") without collapsing non-numeric values to 0.
        const numA = parseInt(valA as string, 10);
        const numB = parseInt(valB as string, 10);
        const aIsNum = !isNaN(numA);
        const bIsNum = !isNaN(numB);
        if (aIsNum && bIsNum) {
          // Both numeric — compare as numbers; break ties with full string
          if (numA !== numB) return sortDir === "asc" ? numA - numB : numB - numA;
          // Tie-break on full string to keep sort stable
          return sortDir === "asc"
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        // Non-numeric or mixed — fall through to string comparison below
      } else if (sortField === "orderDate") {
        // Date sort: parse MM-DD-YYYY format
        const parseDate = (d: string) => {
          if (!d) return 0;
          const parts = d.split("-");
          if (parts.length === 3) return new Date(`${parts[2]}-${parts[0]}-${parts[1]}`).getTime();
          return new Date(d).getTime() || 0;
        };
        valA = parseDate(valA as string);
        valB = parseDate(valB as string);
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [statusFilter, activeSearch, applicants, sortField, sortDir]);

  const itemsPerPage = parseInt(pageSize);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Permission guard — show access denied for viewers without access
  if (!authLoading && !canViewMonitoring) {
    return (
      <div className="min-h-screen bg-white">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-xl font-semibold text-gray-700">Access Restricted</h2>
          <p className="text-gray-500 mt-2">You do not have permission to view the Monitoring page.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold text-foreground mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Monitoring
            </h2>
            <p className="text-base text-muted-foreground">
              Manage and track {selectedCompanyName ? `${selectedCompanyName} ` : ""}monitoring status
              {!loading && !error && (
                <span className="ml-2 text-sm text-muted-foreground">— {applicants.length} applicants</span>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 shrink-0 mt-1"
            onClick={() => { localStorage.removeItem("monitoringLastSearch"); refetch(); setSearchTerm(""); setActiveSearch(""); setStatusFilter("All"); setCurrentPage(1); toast.info("Refreshing data…"); }}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#1FFF00" }} />
            <span className="text-sm font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>Loading applicants…</span>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-5 py-4 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">Failed to load applicant data</p>
              <p className="text-xs text-red-500 mt-0.5">{error}</p>
            </div>
            <Button size="sm" variant="outline" className="ml-auto border-red-300 text-red-600" onClick={refetch}>Retry</Button>
          </div>
        )}

        {/* Main content — only shown when loaded */}
        {!loading && !error && (<>

        {/* Controls */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Status Filter</label>
              <Select value={statusFilter} onValueChange={(v: "All" | "On" | "Off") => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full border-border transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="On">On</SelectItem>
                  <SelectItem value="Off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Show</label>
              <Select value={pageSize} onValueChange={(v) => { setPageSize(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full border-border transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-foreground mb-2 block">Search {activeSearch !== "" && <span className="text-xs text-green-600 font-normal">(Locked)</span>}</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search by name or file number..."
                  value={activeSearch !== "" ? activeSearch : searchTerm}
                  onChange={(e) => {
                    if (activeSearch === "") {
                      setSearchTerm(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && activeSearch === "") {
                      setActiveSearch(searchTerm);
                      setCurrentPage(1);
                    }
                  }}
                  disabled={activeSearch !== ""}
                  className="flex-1 border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    if (activeSearch === "") {
                      setActiveSearch(searchTerm);
                      setCurrentPage(1);
                    }
                  }}
                  disabled={activeSearch !== ""}
                  className="shrink-0"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 transition-colors"
              onClick={handleExportCSV}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>

          </div>
        </div>

        {/* Data Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-foreground">Applicant Name</th>
                  <th
                    className="px-5 py-4 text-left text-sm font-semibold text-foreground cursor-pointer select-none hover:bg-secondary/60 transition-colors"
                    onClick={() => handleSort("fileNumber")}
                  >
                    <span className="inline-flex items-center">
                      File Number <SortIcon field="fileNumber" />
                    </span>
                  </th>
                  <th
                    className="px-5 py-4 text-left text-sm font-semibold text-foreground cursor-pointer select-none hover:bg-secondary/60 transition-colors"
                    onClick={() => handleSort("orderDate")}
                  >
                    <span className="inline-flex items-center">
                      Order Date <SortIcon field="orderDate" />
                    </span>
                  </th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-foreground">Monitor Status</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-foreground">MVR</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-foreground">Med Expire</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-foreground">Notes</th>
                  <th className="px-5 py-4 text-left text-sm font-semibold text-foreground">Save</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground text-sm">
                      No applicants found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((applicant, index) => (
                    <tr
                      key={applicant.id}
                      className={`border-b border-border transition-colors duration-150 ${
                        index % 2 === 0 ? "bg-white" : "bg-secondary/20"
                      }`}
                    >
                      <td className="px-5 py-4 text-sm font-medium text-foreground">{applicant.name}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{applicant.fileNumber}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{applicant.orderDate}</td>
                      <td className="px-5 py-4">
                        <Select
                          value={getStatus(applicant)}
                          onValueChange={(v) => canEditMonitoring && handleMonitorStatusChange(applicant.id, v as "On" | "Off")}
                          disabled={!canEditMonitoring}
                        >
                          <SelectTrigger className="w-20 h-8 border-0 bg-transparent p-0 focus:ring-0 shadow-none">
                            <SelectValue>
                              <span
                                className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold"
                                style={
                                  getStatus(applicant) === "On"
                                    ? { backgroundColor: "rgba(31,255,0,0.15)", color: "#15a300" }
                                    : { backgroundColor: "#F3F4F6", color: "#6B7280" }
                                }
                              >
                                {getStatus(applicant)}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="On">On</SelectItem>
                            <SelectItem value="Off">Off</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        <a
                          href={`https://saffhiresecure.com/app/client/driverpipeline/mvr/${applicant.fileNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 border-border transition-colors"
                          >
                            Create MVR
                          </Button>
                        </a>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <Input
                            type="text"
                            placeholder="MM/DD/YYYY"
                            value={getMedExpire(applicant)}
                            onChange={(e) => handleMedExpireChange(applicant.id, e.target.value)}
                            className="h-8 text-xs border-border transition-colors w-32"
                            style={getMedExpire(applicant) ? { color: getMedExpireColor(getMedExpire(applicant)), fontWeight: 600 } : undefined}
                            disabled={!canEditMonitoring || demoTextDisabled}
                            readOnly={!canEditMonitoring || demoTextDisabled}
                          />
                          {applicant.medExpireOverridden && (
                            <span title="Date manually overridden" className="inline-flex shrink-0">
                              <Pencil className="w-3 h-3" style={{ color: "#f59e0b" }} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Input
                          type="text"
                          placeholder={canEditMonitoring && !demoTextDisabled ? "Add note..." : "—"}
                          value={getNotes(applicant)}
                          onChange={(e) => handleNotesChange(applicant.id, e.target.value)}
                          className="h-8 text-xs border-border transition-colors"
                          disabled={!canEditMonitoring || demoTextDisabled}
                          readOnly={!canEditMonitoring || demoTextDisabled}
                        />
                      </td>
                      <td className="px-5 py-4">
                        {canEditMonitoring && !demoTextDisabled && (
                          <Button
                            size="sm"
                            className="font-semibold transition-all duration-200 flex items-center gap-1.5"
                            style={{ backgroundColor: "#1FFF00", color: "#0F172A" }}
                            onClick={() => handleSave(applicant)}
                            disabled={savingIds.has(applicant.id)}
                          >
                            {savingIds.has(applicant.id) ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Saving</>
                            ) : "Save"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredData.length === 0 ? 0 : startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} results
          </p>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="transition-colors"
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  style={
                    currentPage === pageNum
                      ? { backgroundColor: "#1FFF00", color: "#0F172A" }
                      : {}
                  }
                  className="transition-colors"
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="text-muted-foreground px-1">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className="transition-colors"
                >
                  {totalPages}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="transition-colors"
            >
              Next
            </Button>
          </div>
        </div>
        </>)}
      </main>


    </div>
  );
}
