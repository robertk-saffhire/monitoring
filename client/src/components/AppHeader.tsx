/**
 * SaffHire - Shared App Header
 *
 * Top nav with logo, a "Reports" dropdown (Monitoring + Safety Performance Reports),
 * Settings (admin only), and a Logout button.
 */

import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronDown, Settings, LogOut } from "lucide-react";
import { useLocalAuth } from "@/contexts/LocalAuthContext";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663368468239/3wvjutsFdcEUnRywyqJHNV/SaffhireLogoShirtStyle_0449b2e9.webp";

export default function AppHeader() {
  const [location, navigate] = useLocation();
  const [reportsOpen, setReportsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, isDemo, logout, canViewMonitoring, canViewSafetyPerformance } = useLocalAuth();

  const REPORTS_ITEMS = [
    canViewMonitoring ? { label: "Monitoring", href: "/" } : null,
    canViewSafetyPerformance ? { label: "Safety Performance Reports", href: "/safety-performance" } : null,
  ].filter(Boolean) as { label: string; href: string }[];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setReportsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isReportsActive =
    location === "/" || location.startsWith("/safety-performance");
  const isDashboardActive = location === "/dashboard";
  const isSettingsActive = location === "/settings";

  return (
    <header className="border-b border-border bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="focus:outline-none"
          >
            <img
              src={LOGO_URL}
              alt="SaffHire Background Screening"
              className="h-11 w-auto object-contain"
            />
          </button>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {/* Dashboard */}
            <button
              type="button"
              className={`text-sm font-semibold transition-colors relative ${
                isDashboardActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontFamily: "'Poppins', sans-serif" }}
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
              {isDashboardActive && (
                <span
                  className="absolute -bottom-[17px] left-0 right-0 h-[2px] rounded-full"
                  style={{ backgroundColor: "#1FFF00" }}
                />
              )}
            </button>

            {/* Reports dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className={`flex items-center gap-1 text-sm font-semibold transition-colors ${
                  isReportsActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                style={{ fontFamily: "'Poppins', sans-serif" }}
                onClick={() => setReportsOpen((o) => !o)}
              >
                Reports
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${reportsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Active underline indicator */}
              {isReportsActive && (
                <span
                  className="absolute -bottom-[17px] left-0 right-0 h-[2px] rounded-full"
                  style={{ backgroundColor: "#1FFF00" }}
                />
              )}

              {/* Dropdown panel */}
              {reportsOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-border rounded-lg shadow-lg overflow-hidden z-50">
                  {REPORTS_ITEMS.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                          isActive
                            ? "font-semibold text-foreground bg-secondary"
                            : "font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                        onClick={() => {
                          setReportsOpen(false);
                          navigate(item.href);
                        }}
                      >
                        {isActive && (
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
                            style={{ backgroundColor: "#1FFF00" }}
                          />
                        )}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Settings — admin only, hidden in demo mode */}
            {isAdmin && !isDemo && (
              <button
                type="button"
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors relative ${
                  isSettingsActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                style={{ fontFamily: "'Poppins', sans-serif" }}
                onClick={() => navigate("/settings")}
              >
                <Settings className="w-4 h-4" />
                Settings
                {isSettingsActive && (
                  <span
                    className="absolute -bottom-[17px] left-0 right-0 h-[2px] rounded-full"
                    style={{ backgroundColor: "#1FFF00" }}
                  />
                )}
              </button>
            )}

            {/* User display + Logout */}
            <div className="flex items-center gap-3">
              {isDemo ? (
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "#1FFF0022", color: "#16a34a", border: "1px solid #1FFF0066" }}
                >
                  Demo Mode
                </span>
              ) : (
                user && (
                  <span className="text-xs text-muted-foreground font-medium hidden lg:block">
                    {user.displayName || user.username}
                  </span>
                )
              )}
              {!isDemo && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border flex items-center gap-1.5"
                  onClick={logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </Button>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
