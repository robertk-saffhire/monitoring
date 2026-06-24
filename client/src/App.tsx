import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { LocalAuthProvider, useLocalAuth } from "./contexts/LocalAuthContext";
import Monitoring from "./pages/Monitoring";
import SafetyPerformance from "./pages/SafetyPerformance";
import SafetyPerformanceEdit from "./pages/SafetyPerformanceEdit";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import EmployerForm from "./pages/EmployerForm";
import CompanySelector from "./pages/CompanySelector";
import { useState } from "react";
import { SafetyReport } from "./pages/SafetyPerformance";
import ChangePassword from "./pages/ChangePassword";
import Welcome from "./pages/Welcome";
import DemoEnded from "./pages/DemoEnded";
import { useDemoInactivity } from "./hooks/useDemoInactivity";
import { Loader2 } from "lucide-react";

/** Redirects to /login if not authenticated, /change-password if mustChangePassword, or /select-company if no company selected */
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading, selectedCompanyId, user, mustChangePassword } = useLocalAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }
  if (!isAuthenticated) return <Redirect to="/login" />;
  // If user must change password, redirect to change password page
  if (mustChangePassword) return <Redirect to="/change-password" />;
  // If no company is selected yet, send to company selector
  // (company users have their companyId auto-selected, so this only affects admins/viewers)
  if (!selectedCompanyId && user && user.role !== "user") return <Redirect to="/select-company" />;
  return <Component />;
}

function Router() {
  const { reports, setReports, saveSafetyReport, deleteSafetyReportById } = useAppContext();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading, selectedCompanyId, user, mustChangePassword, isDemo } = useLocalAuth();

  // Auto-expire demo session after 30 minutes of inactivity
  useDemoInactivity(isDemo);

  const handleEdit = (id: number) => {
    setEditingId(id);
    navigate(`/safety-performance/${id}/edit`);
  };

  const handleSave = async (data: Partial<SafetyReport>) => {
    if (editingId !== null) {
      const existing = reports.find((r) => r.id === editingId);
      if (existing) {
        await saveSafetyReport({ ...existing, ...data });
      }
    }
    setEditingId(null);
    navigate("/safety-performance");
  };

  const handleBack = () => {
    navigate("/safety-performance");
  };

  const handleDelete = async (id: number) => {
    await deleteSafetyReportById(id);
  };

  const editingReport = reports.find((r) => r.id === editingId);

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public welcome / landing page */}
      <Route path="/welcome" component={Welcome} />

      {/* Demo ended page — shown after inactivity expiry */}
      <Route path="/demo-ended" component={DemoEnded} />

      {/* Public demo access — redirects to the server which sets a demo session cookie */}
      <Route path="/demo">
        {() => {
          window.location.href = "/api/demo";
          return null;
        }}
      </Route>

      {/* Public route — allow access even if a demo session is active so real users can log in */}
      <Route path="/login">
        {isAuthenticated && !isDemo ? <Redirect to="/select-company" /> : <Login />}
      </Route>

      {/* Forced password change — shown when mustChangePassword is true */}
      <Route path="/change-password">
        {!isAuthenticated ? <Redirect to="/login" /> : <ChangePassword />}
      </Route>

      {/* Company selector — shown after login */}
      <Route path="/select-company">
        {!isAuthenticated ? <Redirect to="/login" /> : mustChangePassword ? <Redirect to="/change-password" /> : <CompanySelector />}
      </Route>

      {/* Protected routes */}
      <Route path="/" component={() => <ProtectedRoute component={Monitoring} />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/settings">
        {() => isDemo ? <Redirect to="/" /> : <ProtectedRoute component={Settings} />}
      </Route>

      <Route path="/safety-performance">
        {() =>
          !isAuthenticated ? (
            <Redirect to="/login" />
          ) : mustChangePassword ? (
            <Redirect to="/change-password" />
          ) : !selectedCompanyId && user && user.role !== "user" ? (
            <Redirect to="/select-company" />
          ) : (
            <SafetyPerformance
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRefresh={async (newReports) => {
                // Save each new report to the DB
                for (const r of newReports) {
                  const { id: _id, ...rest } = r as SafetyReport;
                  await saveSafetyReport(rest);
                }
              }}
            />
          )
        }
      </Route>

      <Route path="/safety-performance/new">
        {() =>
          !isAuthenticated ? (
            <Redirect to="/login" />
          ) : mustChangePassword ? (
            <Redirect to="/change-password" />
          ) : isDemo ? (
            <Redirect to="/safety-performance" />
          ) : !selectedCompanyId && user && user.role !== "user" ? (
            <Redirect to="/select-company" />
          ) : (
            <SafetyPerformanceEdit
              onSave={async (data) => {
                await saveSafetyReport({
                  applicantName: data.applicantName ?? "",
                  fileNumber: data.fileNumber ?? "",
                  created: new Date().toISOString().split("T")[0],
                  status: data.status ?? "S1 Complete",
                  followUpDate: data.followUpDate ?? "",
                  notes: data.notes ?? "",
                  prevEmployerName: data.prevEmployerName ?? "",
                  prevEmployerEmail: data.prevEmployerEmail ?? "",
                  prevEmployerStreet: data.prevEmployerStreet ?? "",
                  prevEmployerPhone: data.prevEmployerPhone ?? "",
                  prevEmployerFax: data.prevEmployerFax ?? "",
                  prevEmployerCityStateZip: data.prevEmployerCityStateZip ?? "",
                  employerName: data.employerName ?? "",
                  employerAttention: data.employerAttention ?? "",
                  employerStreet: data.employerStreet ?? "",
                  employerCityStateZip: data.employerCityStateZip ?? "",
                  employerPhone: data.employerPhone ?? "",
                  employerFax: data.employerFax ?? "",
                  employerEmail: data.employerEmail ?? "",
                  confFax: data.confFax ?? "",
                  confEmail: data.confEmail ?? "",
                  employedByCompany: data.employedByCompany ?? "",
                  jobTitle: data.jobTitle ?? "",
                  fromDate: data.fromDate ?? "",
                  toDate: data.toDate ?? "",
                  droveMotorVehicle: data.droveMotorVehicle ?? "",
                  vehicleStraightTruck: data.vehicleStraightTruck ?? false,
                  vehicleTractorSemitrailer: data.vehicleTractorSemitrailer ?? false,
                  vehicleBus: data.vehicleBus ?? false,
                  vehicleCargoTank: data.vehicleCargoTank ?? false,
                  vehicleDoublesTriples: data.vehicleDoublesTriples ?? false,
                  vehicleOther: data.vehicleOther ?? false,
                  accidentHistory: data.accidentHistory ?? "",
                  accidentDate1: data.accidentDate1 ?? "",
                  accidentLocation1: data.accidentLocation1 ?? "",
                  accidentInjuries1: data.accidentInjuries1 ?? "",
                  accidentFatalities1: data.accidentFatalities1 ?? "",
                  accidentHazmat1: data.accidentHazmat1 ?? "",
                  accidentDate2: data.accidentDate2 ?? "",
                  accidentLocation2: data.accidentLocation2 ?? "",
                  accidentInjuries2: data.accidentInjuries2 ?? "",
                  accidentFatalities2: data.accidentFatalities2 ?? "",
                  accidentHazmat2: data.accidentHazmat2 ?? "",
                  accidentDate3: data.accidentDate3 ?? "",
                  accidentLocation3: data.accidentLocation3 ?? "",
                  accidentInjuries3: data.accidentInjuries3 ?? "",
                  accidentFatalities3: data.accidentFatalities3 ?? "",
                  accidentHazmat3: data.accidentHazmat3 ?? "",
                  otherAccidents: data.otherAccidents ?? "",
                  dotCompany: data.dotCompany ?? "",
                  dotEmployee: data.dotEmployee ?? "",
                  dotAlcoholTestPositive: data.dotAlcoholTestPositive ?? false,
                  dotDrugTestPositive: data.dotDrugTestPositive ?? false,
                  dotRefusedTest: data.dotRefusedTest ?? false,
                  dotOtherViolations: data.dotOtherViolations ?? false,
                  infoReceivedFrom: data.infoReceivedFrom ?? "",
                  infoReceivedDate: data.infoReceivedDate ?? "",
                });
                navigate("/safety-performance");
              }}
              onBack={handleBack}
            />
          )
        }
      </Route>

      <Route path="/safety-performance/:id/edit">
        {() =>
          !isAuthenticated ? (
            <Redirect to="/login" />
          ) : mustChangePassword ? (
            <Redirect to="/change-password" />
          ) : isDemo ? (
            <Redirect to="/safety-performance" />
          ) : !selectedCompanyId && user && user.role !== "user" ? (
            <Redirect to="/select-company" />
          ) : (
            <SafetyPerformanceEdit
              report={editingReport}
              onSave={handleSave}
              onBack={handleBack}
            />
          )
        }
      </Route>

      {/* Public employer info form — no auth required */}
      <Route path="/employer-form/:token" component={EmployerForm} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LocalAuthProvider>
          <AppProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AppProvider>
        </LocalAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
