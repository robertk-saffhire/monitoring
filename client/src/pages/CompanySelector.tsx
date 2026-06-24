/**
 * CompanySelector — shown after login when the user has access to multiple companies.
 * Admin users see all companies. Viewers see only their assigned companies.
 * Company users (role=user) are auto-redirected to their single company.
 */
import { Building2, ChevronRight, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { useLocation } from "wouter";

export default function CompanySelector() {
  const { user, setSelectedCompanyId } = useLocalAuth();
  const [, navigate] = useLocation();

  const { data: companies, isLoading } = trpc.companyAccess.myCompanies.useQuery(undefined, {
    enabled: !!user,
  });

  const handleSelect = (companyId: number) => {
    setSelectedCompanyId(companyId);
    navigate("/");
  };

  // MUST be before any conditional returns to comply with Rules of Hooks.
  // If only one company is available, auto-select it immediately.
  useEffect(() => {
    if (!isLoading && companies && companies.length === 1) {
      handleSelect(companies[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, companies]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>No Companies Assigned</CardTitle>
            <CardDescription>
              You don't have access to any companies yet. Please contact your administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (companies.length === 1) {
    // Show spinner while the useEffect auto-selects and navigates
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Select a Company</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.displayName ?? user?.username}. Choose a company to continue.
          </p>
        </div>

        <div className="space-y-3">
          {companies.map((company) => (
            <Card
              key={company.id}
              className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
              onClick={() => handleSelect(company.id)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{company.name}</p>
                    <p className="text-sm text-muted-foreground">{company.slug}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          variant="ghost"
          className="w-full mt-6 text-muted-foreground"
          onClick={() => navigate("/login")}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
