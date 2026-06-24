import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [, navigate] = useLocation();
  const { refetch } = useLocalAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // First-run setup state
  const [setupUsername, setSetupUsername] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  const { data: hasUsersData, isLoading: checkingUsers } = trpc.localAuth.hasUsers.useQuery();

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => {
      refetch();
      if (data.mustChangePassword) {
        navigate("/change-password");
      } else {
        navigate("/select-company");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Login failed");
    },
  });

  const setupMutation = trpc.localAuth.setupAdmin.useMutation({
    onSuccess: () => {
      toast.success("Admin account created! Please log in.");
      setSetupUsername("");
      setSetupPassword("");
      setSetupConfirm("");
    },
    onError: (err) => {
      toast.error(err.message || "Setup failed");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    loginMutation.mutate({ username: username.trim(), password, rememberMe });
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPassword !== setupConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (setupPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setupMutation.mutate({ username: setupUsername.trim(), password: setupPassword });
  };

  if (checkingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const isFirstRun = !hasUsersData?.hasUsers;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663368468239/3wvjutsFdcEUnRywyqJHNV/SaffhireLogoShirtStyle_0449b2e9.webp"
            alt="SaffHire Background Screening"
            className="h-20 object-contain"
          />
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4 text-center">
            {isFirstRun ? (
              <>
                <div className="flex justify-center mb-2">
                  <ShieldCheck className="w-8 h-8" style={{ color: "#1FFF00" }} />
                </div>
                <h1 className="text-xl font-bold text-gray-900">First-Time Setup</h1>
                <p className="text-sm text-gray-500 mt-1">Create your admin account to get started</p>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold text-gray-900">Sign In</h1>
                <p className="text-sm text-gray-500 mt-1">Enter your credentials to access the dashboard </p>
              </>
            )}
          </CardHeader>

          <CardContent>
            {isFirstRun ? (
              <form onSubmit={handleSetup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="setup-username">Username</Label>
                  <Input
                    id="setup-username"
                    type="text"
                    placeholder="Choose a username"
                    value={setupUsername}
                    onChange={(e) => setSetupUsername(e.target.value)}
                    required
                    minLength={3}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="setup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="setup-password"
                      type={showSetupPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowSetupPassword((v) => !v)}
                    >
                      {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="setup-confirm">Confirm Password</Label>
                  <Input
                    id="setup-confirm"
                    type={showSetupPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={setupConfirm}
                    onChange={(e) => setSetupConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full font-semibold mt-2"
                  style={{ backgroundColor: "#1FFF00", color: "#0F172A" }}
                  disabled={setupMutation.isPending}
                >
                  {setupMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...</>
                  ) : "Create Admin Account"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {/* Remember Me */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <label
                    htmlFor="remember-me"
                    className="text-sm text-gray-600 cursor-pointer select-none"
                  >
                    Remember me for 30 days
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full font-semibold mt-2"
                  style={{ backgroundColor: "#1FFF00", color: "#0F172A" }}
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing In...</>
                  ) : "Sign In"}
                </Button>

                {/* Try Demo link */}
                <div className="text-center pt-1">
                  <span className="text-sm text-gray-500">Want to explore first?{" "}</span>
                  <a
                    href="/api/demo"
                    className="text-sm font-medium hover:underline"
                    style={{ color: "#1FFF00", filter: "brightness(0.75)" }}
                  >
                    Try the demo →
                  </a>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          SaffHire Background Screening &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
