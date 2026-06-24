import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Pencil, Trash2, ShieldCheck, User, Building2, Eye, Bell, CheckCircle2, XCircle, Mail } from "lucide-react";
import { toast } from "sonner";

interface LocalUserRow {
  id: number;
  username: string;
  displayName: string | null;
  role: "user" | "admin" | "viewer";
  isActive: boolean;
  createdAt: Date;
  lastSignedIn: Date | null;
  companyId: number | null;
}

interface CompanyRow {
  id: number;
  name: string;
  slug: string;
  sheetUrlApplicants: string;
  sheetUrlMedExpire: string;
  sheetUrlNotes: string;
  sheetUrlSR: string;
  createdAt: Date;
}

interface ViewerPermission {
  id: number;
  userId: number;
  companyId: number;
  canViewMonitoring: boolean;
  canEditMonitoring: boolean;
  canViewSafetyPerformance: boolean;
  canEditSafetyPerformance: boolean;
}

const ACCENT = { backgroundColor: "#1FFF00", color: "#0F172A" };

export default function Settings() {
  const { user: currentUser, isAdmin, isLoading: authLoading } = useLocalAuth();
  const utils = trpc.useUtils();

  // ── Data queries ─────────────────────────────────────────────────────────
  const { data: userList, isLoading: usersLoading } = trpc.users.list.useQuery(undefined, {
    enabled: !authLoading && isAdmin,
  });

  const { data: companyList, isLoading: companiesLoading } = trpc.companies.list.useQuery(undefined, {
    enabled: !authLoading && isAdmin,
  });

  // ── Active tab ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"users" | "companies" | "permissions" | "notifications">("users");

  // ── Notification Emails state ─────────────────────────────────────────────
  const { data: notifEmails, isLoading: notifLoading } = trpc.notificationEmails.list.useQuery(undefined, {
    enabled: !authLoading && isAdmin,
  });
  const [notifAddOpen, setNotifAddOpen] = useState(false);
  const [notifLabel, setNotifLabel] = useState("");
  const [notifEmail, setNotifEmail] = useState("");
  const addNotifMutation = trpc.notificationEmails.add.useMutation({
    onSuccess: () => { toast.success("Recipient added"); utils.notificationEmails.list.invalidate(); setNotifAddOpen(false); setNotifLabel(""); setNotifEmail(""); },
    onError: (err) => toast.error(err.message || "Failed to add recipient"),
  });
  const removeNotifMutation = trpc.notificationEmails.remove.useMutation({
    onSuccess: () => { toast.success("Recipient removed"); utils.notificationEmails.list.invalidate(); },
    onError: (err) => toast.error(err.message || "Failed to remove recipient"),
  });
  const toggleNotifMutation = trpc.notificationEmails.update.useMutation({
    onSuccess: () => utils.notificationEmails.list.invalidate(),
    onError: (err) => toast.error(err.message || "Failed to update recipient"),
  });
  const verifySMTPMutation = trpc.notificationEmails.verifySMTP.useMutation({
    onSuccess: (data) => {
      if (data.ok) toast.success("SMTP connection verified successfully!");
      else toast.error("SMTP connection failed. Check credentials.");
    },
    onError: () => toast.error("SMTP verification failed."),
  });

  // ── Permissions panel state ───────────────────────────────────────────────
  const [permUserId, setPermUserId] = useState<number | null>(null);
  const { data: permData, isLoading: permLoading } = trpc.viewerPermissions.getForUser.useQuery(
    { userId: permUserId! },
    { enabled: !!permUserId }
  );

  const upsertPermMutation = trpc.viewerPermissions.upsert.useMutation({
    onSuccess: () => utils.viewerPermissions.getForUser.invalidate(),
    onError: (err: { message?: string }) => toast.error(err.message || "Failed to update permission"),
  });

  // ── Create user dialog ────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin" | "viewer">("user");
  const [newCompanyId, setNewCompanyId] = useState<number | null>(null);

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("User created successfully");
      utils.users.list.invalidate();
      setCreateOpen(false);
      setNewUsername(""); setNewPassword(""); setNewDisplayName(""); setNewRole("user"); setNewCompanyId(null);
    },
    onError: (err) => toast.error(err.message || "Failed to create user"),
  });

  // ── Edit user dialog ──────────────────────────────────────────────────────
  const [editUser, setEditUser] = useState<LocalUserRow | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editRole, setEditRole] = useState<"user" | "admin" | "viewer">("user");
  const [editPassword, setEditPassword] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editCompanyId, setEditCompanyId] = useState<number | null>(null);

  const openEdit = (u: LocalUserRow) => {
    setEditUser(u);
    setEditDisplayName(u.displayName ?? "");
    setEditRole(u.role);
    setEditPassword("");
    setEditActive(u.isActive);
    setEditCompanyId(u.companyId);
  };

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("User updated");
      utils.users.list.invalidate();
      setEditUser(null);
    },
    onError: (err) => toast.error(err.message || "Failed to update user"),
  });

  // ── Delete user dialog ────────────────────────────────────────────────────
  const [deleteUser, setDeleteUser] = useState<LocalUserRow | null>(null);
  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => { toast.success("User deleted"); utils.users.list.invalidate(); setDeleteUser(null); },
    onError: (err) => toast.error(err.message || "Failed to delete user"),
  });

  // ── Create company dialog ─────────────────────────────────────────────────
  const [companyCreateOpen, setCompanyCreateOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cSlug, setCSlug] = useState("");
  const [cApplicants, setCApplicants] = useState("");
  const [cMedExpire, setCMedExpire] = useState("");
  const [cNotes, setCNotes] = useState("");
  const [cSR2, setCSR2] = useState("");
  const [cBackup, setCBackup] = useState("");
  const [cMonitoringBackup, setCMonitoringBackup] = useState("");

  const createCompanyMutation = trpc.companies.create.useMutation({
    onSuccess: () => {
      toast.success("Company created");
      utils.companies.list.invalidate();
      setCompanyCreateOpen(false);
      setCName(""); setCSlug(""); setCApplicants(""); setCMedExpire(""); setCNotes(""); setCSR2(""); setCBackup(""); setCMonitoringBackup("");
    },
    onError: (err) => toast.error(err.message || "Failed to create company"),
  });

  // ── Edit company dialog ───────────────────────────────────────────────────
  const [editCompany, setEditCompany] = useState<CompanyRow | null>(null);
  const [ecName, setEcName] = useState("");
  const [ecApplicants, setEcApplicants] = useState("");
  const [ecMedExpire, setEcMedExpire] = useState("");
  const [ecNotes, setEcNotes] = useState("");
  const [ecSR, setEcSR] = useState("");
  const [ecBackup, setEcBackup] = useState("");
  const [ecMonitoringBackup, setEcMonitoringBackup] = useState("");

  const openEditCompany = (c: CompanyRow) => {
    setEditCompany(c);
    setEcName(c.name);
    setEcApplicants(c.sheetUrlApplicants);
    setEcMedExpire(c.sheetUrlMedExpire);
    setEcNotes(c.sheetUrlNotes);
    setEcSR(c.sheetUrlSR);
    setEcBackup((c as any).sheetUrlBackup ?? "");
    setEcMonitoringBackup((c as any).sheetUrlMonitoringBackup ?? "");
  };

  const updateCompanyMutation = trpc.companies.update.useMutation({
    onSuccess: () => {
      toast.success("Company updated");
      utils.companies.list.invalidate();
      setEditCompany(null);
    },
    onError: (err) => toast.error(err.message || "Failed to update company"),
  });

  // ── Delete company dialog ─────────────────────────────────────────────────
  const [deleteCompany, setDeleteCompany] = useState<CompanyRow | null>(null);
  const deleteCompanyMutation = trpc.companies.delete.useMutation({
    onSuccess: () => { toast.success("Company deleted"); utils.companies.list.invalidate(); setDeleteCompany(null); },
    onError: (err) => toast.error(err.message || "Failed to delete company"),
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-6 py-12 text-center">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-700">Admin Access Required</h2>
          <p className="text-gray-500 mt-2">You need admin privileges to view this page.</p>
        </main>
      </div>
    );
  }

  const viewerUsers = userList?.filter((u) => u.role === "viewer") ?? [];
  const companyMap = new Map((companyList ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage companies, users, and access permissions</p>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {([
            { key: "users", label: "Users", icon: User },
            { key: "companies", label: "Companies", icon: Building2 },
            { key: "permissions", label: "Viewer Permissions", icon: Eye },
            { key: "notifications", label: "Notifications", icon: Bell },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? "border-[#1FFF00] text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── USERS TAB ──────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">{userList?.length ?? 0} user{userList?.length !== 1 ? "s" : ""}</span>
              <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 font-semibold" style={ACCENT}>
                <Plus className="w-4 h-4" /> Add User
              </Button>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {usersLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 font-semibold text-gray-600">Username</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">Display Name</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">Role</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">Company</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
                      <th className="px-6 py-3 font-semibold text-gray-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {userList?.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-800">
                          {u.username}{u.id === currentUser?.id && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                        </td>
                        <td className="px-6 py-4 text-gray-700">{u.displayName || "—"}</td>
                        <td className="px-6 py-4">
                          {u.role === "admin" ? (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-semibold"><ShieldCheck className="w-3 h-3 mr-1" /> Admin</Badge>
                          ) : u.role === "viewer" ? (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-semibold"><Eye className="w-3 h-3 mr-1" /> Viewer</Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">User</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {(u as LocalUserRow).companyId ? (companyMap.get((u as LocalUserRow).companyId!) ?? `ID ${(u as LocalUserRow).companyId}`) : "—"}
                        </td>
                        <td className="px-6 py-4">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-green-700 font-medium"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Active</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-gray-400"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />Inactive</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" className="h-8 px-3" onClick={() => openEdit(u as LocalUserRow)}>
                              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                            {u.id !== currentUser?.id && (
                              <Button size="sm" variant="outline" className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteUser(u as LocalUserRow)}>
                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {userList?.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No users found. Add your first user above.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── COMPANIES TAB ──────────────────────────────────────────────── */}
        {activeTab === "companies" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">{companyList?.length ?? 0} compan{companyList?.length !== 1 ? "ies" : "y"}</span>
              <Button onClick={() => setCompanyCreateOpen(true)} className="flex items-center gap-2 font-semibold" style={ACCENT}>
                <Plus className="w-4 h-4" /> Add Company
              </Button>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {companiesLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 font-semibold text-gray-600">Company Name</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">Slug</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">Sheet URLs</th>
                      <th className="px-6 py-3 font-semibold text-gray-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {companyList?.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-800">{c.name}</td>
                        <td className="px-6 py-4 font-mono text-gray-500 text-xs">{c.slug}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          <div className="space-y-0.5">
                            {c.sheetUrlApplicants && <div><span className="font-medium text-gray-600">Applicants:</span> configured</div>}
                            {c.sheetUrlMedExpire && <div><span className="font-medium text-gray-600">Med Expire:</span> configured</div>}
                            {c.sheetUrlNotes && <div><span className="font-medium text-gray-600">Notes:</span> configured</div>}
                            {c.sheetUrlSR && <div><span className="font-medium text-gray-600">SR:</span> configured</div>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" className="h-8 px-3" onClick={() => openEditCompany(c as unknown as CompanyRow)}>
                              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setDeleteCompany(c as CompanyRow)}>
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {companyList?.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No companies yet. Add your first company above.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── PERMISSIONS TAB ────────────────────────────────────────────── */}
        {activeTab === "permissions" && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Select a viewer to manage their company access and page permissions.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Viewer list */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-700 text-sm">Viewers</div>
                {viewerUsers.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">No viewer accounts yet.<br />Create a user with role "Viewer".</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {viewerUsers.map((u) => (
                      <li key={u.id}>
                        <button
                          onClick={() => setPermUserId(u.id)}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${permUserId === u.id ? "bg-gray-50 font-semibold" : ""}`}
                        >
                          {u.displayName || u.username}
                          <span className="block text-xs text-gray-400 font-normal">{u.username}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Permissions panel */}
              <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {!permUserId ? (
                  <div className="flex items-center justify-center h-full py-16 text-gray-400 text-sm">Select a viewer to manage permissions</div>
                ) : permLoading ? (
                  <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                ) : (
                  <div>
                    <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-700 text-sm">
                      Permissions for {viewerUsers.find((u) => u.id === permUserId)?.displayName || viewerUsers.find((u) => u.id === permUserId)?.username}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {(companyList ?? []).map((company) => {
                        const perm = (permData as ViewerPermission[] | undefined)?.find((p) => p.companyId === company.id);
                        const canViewMon = perm?.canViewMonitoring ?? false;
                        const canEditMon = perm?.canEditMonitoring ?? false;
                        const canViewSP = perm?.canViewSafetyPerformance ?? false;
                        const canEditSP = perm?.canEditSafetyPerformance ?? false;

                        const update = (patch: Partial<{ canViewMonitoring: boolean; canEditMonitoring: boolean; canViewSafetyPerformance: boolean; canEditSafetyPerformance: boolean }>) => {
                          upsertPermMutation.mutate({
                            userId: permUserId!,
                            companyId: company.id,
                            canViewMonitoring: canViewMon,
                            canEditMonitoring: canEditMon,
                            canViewSafetyPerformance: canViewSP,
                            canEditSafetyPerformance: canEditSP,
                            ...patch,
                          });
                        };

                        return (
                          <div key={company.id} className="px-6 py-4">
                            <div className="font-semibold text-gray-800 mb-3">{company.name}</div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-sm text-gray-600">View Monitoring</span>
                                <Switch checked={canViewMon} onCheckedChange={(v) => update({ canViewMonitoring: v, canEditMonitoring: v ? canEditMon : false })} disabled={upsertPermMutation.isPending} />
                              </div>
                              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-sm text-gray-600">Edit Monitoring</span>
                                <Switch checked={canEditMon} disabled={!canViewMon || upsertPermMutation.isPending} onCheckedChange={(v) => update({ canEditMonitoring: v })} />
                              </div>
                              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-sm text-gray-600">View Safety Perf.</span>
                                <Switch checked={canViewSP} onCheckedChange={(v) => update({ canViewSafetyPerformance: v, canEditSafetyPerformance: v ? canEditSP : false })} disabled={upsertPermMutation.isPending} />
                              </div>
                              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-sm text-gray-600">Edit Safety Perf.</span>
                                <Switch checked={canEditSP} disabled={!canViewSP || upsertPermMutation.isPending} onCheckedChange={(v) => update({ canEditSafetyPerformance: v })} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {(companyList ?? []).length === 0 && (
                        <div className="px-6 py-8 text-center text-gray-400 text-sm">No companies configured. Add companies first.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* ── NOTIFICATIONS TAB ─────────────────────────────────────────── */}
        {activeTab === "notifications" && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">
                  These email addresses receive a notification whenever Monitor Status is toggled On or Off on the Monitoring page.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => verifySMTPMutation.mutate()}
                  disabled={verifySMTPMutation.isPending}
                  className="flex items-center gap-2 text-sm"
                >
                  {verifySMTPMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Test SMTP
                </Button>
                <Button onClick={() => setNotifAddOpen(true)} className="flex items-center gap-2 font-semibold" style={ACCENT}>
                  <Plus className="w-4 h-4" /> Add Recipient
                </Button>
              </div>
            </div>

            {/* SMTP info card */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-700">Sending from:</span> robertk@saffhire.com via Gmail SMTP (smtp.gmail.com:587)
              </div>
            </div>

            {/* Recipients table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {notifLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : !notifEmails?.length ? (
                <div className="py-16 text-center">
                  <Bell className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                  <p className="text-sm text-gray-400">No recipients yet. Add an email address to start receiving notifications.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 font-semibold text-gray-600">Label</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">Email Address</th>
                      <th className="px-6 py-3 font-semibold text-gray-600">Status</th>
                      <th className="px-6 py-3 font-semibold text-gray-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifEmails.map((r, i) => (
                      <tr key={r.id} className={`border-t border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-6 py-3 font-medium text-gray-800">{r.label || <span className="text-gray-400 italic">—</span>}</td>
                        <td className="px-6 py-3 text-gray-600">{r.email}</td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => toggleNotifMutation.mutate({ id: r.id, isActive: !r.isActive })}
                            disabled={toggleNotifMutation.isPending}
                            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
                            style={r.isActive
                              ? { background: "#dcfce7", color: "#15803d" }
                              : { background: "#f3f4f6", color: "#6b7280" }
                            }
                          >
                            {r.isActive
                              ? <><CheckCircle2 className="w-3.5 h-3.5" /> Active</>
                              : <><XCircle className="w-3.5 h-3.5" /> Paused</>}
                          </button>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNotifMutation.mutate({ id: r.id })}
                            disabled={removeNotifMutation.isPending}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Add Notification Recipient Dialog ──────────────────────────────── */}
      <Dialog open={notifAddOpen} onOpenChange={setNotifAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Notification Recipient</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Label (optional)</Label>
              <Input placeholder="e.g. Robert K" value={notifLabel} onChange={(e) => setNotifLabel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address *</Label>
              <Input type="email" placeholder="name@example.com" value={notifEmail} onChange={(e) => setNotifEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addNotifMutation.mutate({ label: notifLabel, email: notifEmail })}
              disabled={addNotifMutation.isPending || !notifEmail}
              style={ACCENT} className="font-semibold"
            >
              {addNotifMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Recipient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create User Dialog ─────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-username">Username *</Label>
              <Input id="new-username" placeholder="e.g. jsmith" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} autoComplete="off" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-display">Display Name</Label>
              <Input id="new-display" placeholder="e.g. John Smith" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Password *</Label>
              <Input id="new-password" type="password" placeholder="Min. 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as "user" | "admin" | "viewer")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (Company Client)</SelectItem>
                  <SelectItem value="viewer">Viewer (SaffHire Employee)</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(newRole === "user") && (
              <div className="space-y-1.5">
                <Label>Assigned Company</Label>
                <Select value={newCompanyId ? String(newCompanyId) : ""} onValueChange={(v) => setNewCompanyId(v ? Number(v) : null)}>
                  <SelectTrigger><SelectValue placeholder="Select company…" /></SelectTrigger>
                  <SelectContent>
                    {(companyList ?? []).map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate({ username: newUsername, password: newPassword, displayName: newDisplayName || undefined, role: newRole, companyId: newCompanyId ?? undefined })}
              disabled={createMutation.isPending || !newUsername || !newPassword}
              style={ACCENT} className="font-semibold"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit User Dialog ───────────────────────────────────────────────── */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit User — {editUser?.username}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-display">Display Name</Label>
              <Input id="edit-display" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as "user" | "admin" | "viewer")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (Company Client)</SelectItem>
                  <SelectItem value="viewer">Viewer (SaffHire Employee)</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editRole === "user" && (
              <div className="space-y-1.5">
                <Label>Assigned Company</Label>
                <Select value={editCompanyId ? String(editCompanyId) : ""} onValueChange={(v) => setEditCompanyId(v ? Number(v) : null)}>
                  <SelectTrigger><SelectValue placeholder="Select company…" /></SelectTrigger>
                  <SelectContent>
                    {(companyList ?? []).map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="edit-password">New Password</Label>
              <Input id="edit-password" type="password" placeholder="Leave blank to keep current password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Account Active</Label>
              <Switch id="edit-active" checked={editActive} onCheckedChange={setEditActive} disabled={editUser?.id === currentUser?.id} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button
              onClick={() => updateMutation.mutate({ id: editUser!.id, displayName: editDisplayName || undefined, role: editRole, isActive: editActive, password: editPassword || undefined, companyId: editCompanyId ?? undefined })}
              disabled={updateMutation.isPending}
              style={ACCENT} className="font-semibold"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete User Confirmation ───────────────────────────────────────── */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete <strong>{deleteUser?.username}</strong>? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteUser && deleteMutation.mutate({ id: deleteUser.id })}>
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Create Company Dialog ──────────────────────────────────────────── */}
      <Dialog open={companyCreateOpen} onOpenChange={setCompanyCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Company</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Company Name *</Label>
                <Input placeholder="e.g. Driver Pipeline" value={cName} onChange={(e) => { setCName(e.target.value); setCSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")); }} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug *</Label>
                <Input placeholder="e.g. driver-pipeline" value={cSlug} onChange={(e) => setCSlug(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Applicants Sheet URL</Label>
              <Input placeholder="https://script.google.com/..." value={cApplicants} onChange={(e) => setCApplicants(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Med Expire Sheet URL</Label>
              <Input placeholder="https://script.google.com/..." value={cMedExpire} onChange={(e) => setCMedExpire(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes Sheet URL</Label>
              <Input placeholder="https://script.google.com/..." value={cNotes} onChange={(e) => setCNotes(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>SR Sheet URL</Label>
              <Input placeholder="https://script.google.com/..." value={cSR2} onChange={(e) => setCSR2(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Backup Sheet URL (Safety Performance)</Label>
              <p className="text-xs text-muted-foreground">Google Apps Script URL for the Safety Performance backup sheet. Used by the "Push Backup" button on the Safety Performance page.</p>
              <Input placeholder="https://script.google.com/..." value={cBackup} onChange={(e) => setCBackup(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Backup Sheet URL (Monitoring + Safety Performance)</Label>
              <p className="text-xs text-muted-foreground">Google Apps Script URL for the full data backup sheet. Used by the "Push to Google Sheet" button on the Dashboard Backup panel.</p>
              <Input placeholder="https://script.google.com/..." value={cMonitoringBackup} onChange={(e) => setCMonitoringBackup(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createCompanyMutation.mutate({ name: cName, slug: cSlug, sheetUrlApplicants: cApplicants, sheetUrlMedExpire: cMedExpire, sheetUrlNotes: cNotes, sheetUrlSR: cSR2, sheetUrlBackup: cBackup, sheetUrlMonitoringBackup: cMonitoringBackup })}
              disabled={createCompanyMutation.isPending || !cName || !cSlug}
              style={ACCENT} className="font-semibold"
            >
              {createCompanyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Company Dialog ────────────────────────────────────────────── */}
      <Dialog open={!!editCompany} onOpenChange={(open) => !open && setEditCompany(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Company — {editCompany?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Company Name *</Label>
              <Input value={ecName} onChange={(e) => setEcName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Applicants Sheet URL</Label>
              <Input placeholder="https://script.google.com/..." value={ecApplicants} onChange={(e) => setEcApplicants(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Med Expire Sheet URL</Label>
              <Input placeholder="https://script.google.com/..." value={ecMedExpire} onChange={(e) => setEcMedExpire(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes Sheet URL</Label>
              <Input placeholder="https://script.google.com/..." value={ecNotes} onChange={(e) => setEcNotes(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>SR Sheet URL</Label>
              <Input placeholder="https://script.google.com/..." value={ecSR} onChange={(e) => setEcSR(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Backup Sheet URL (Safety Performance)</Label>
              <p className="text-xs text-muted-foreground">Google Apps Script URL for the Safety Performance backup sheet. Used by the "Push Backup" button on the Safety Performance page.</p>
              <Input placeholder="https://script.google.com/..." value={ecBackup} onChange={(e) => setEcBackup(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Backup Sheet URL (Monitoring + Safety Performance)</Label>
              <p className="text-xs text-muted-foreground">Google Apps Script URL for the full data backup sheet. Used by the "Push to Google Sheet" button on the Dashboard Backup panel.</p>
              <Input placeholder="https://script.google.com/..." value={ecMonitoringBackup} onChange={(e) => setEcMonitoringBackup(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCompany(null)}>Cancel</Button>
            <Button
              onClick={() => updateCompanyMutation.mutate({ id: editCompany!.id, name: ecName, sheetUrlApplicants: ecApplicants, sheetUrlMedExpire: ecMedExpire, sheetUrlNotes: ecNotes, sheetUrlSR: ecSR, sheetUrlBackup: ecBackup, sheetUrlMonitoringBackup: ecMonitoringBackup })}
              disabled={updateCompanyMutation.isPending || !ecName}
              style={ACCENT} className="font-semibold"
            >
              {updateCompanyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Company Confirmation ────────────────────────────────────── */}
      <AlertDialog open={!!deleteCompany} onOpenChange={(open) => !open && setDeleteCompany(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete <strong>{deleteCompany?.name}</strong>? This will remove all associated viewer permissions.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteCompany && deleteCompanyMutation.mutate({ id: deleteCompany.id })}>
              {deleteCompanyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
