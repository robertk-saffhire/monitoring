/**
 * SaffHire - Public Welcome / Demo Landing Page
 *
 * A clean, branded landing page accessible to anyone at /welcome.
 * Contains a "Try Demo" CTA that redirects to /api/demo to start a demo session.
 */

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldCheck, BarChart3, FileText, ArrowRight, CheckCircle2 } from "lucide-react";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663368468239/3wvjutsFdcEUnRywyqJHNV/SaffhireLogoShirtStyle_0449b2e9.webp";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Real-Time Monitoring",
    description:
      "Track driver monitor status, Med Cert expiration dates, and order history in one live dashboard.",
  },
  {
    icon: FileText,
    title: "Safety Performance Reports",
    description:
      "Manage DOT safety performance history records, send employer verification emails, and track follow-up status.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance at a Glance",
    description:
      "Color-coded expiration alerts and KPI cards surface compliance risks before they become violations.",
  },
];

const HIGHLIGHTS = [
  "Monitor On/Off toggle synced to your data source",
  "Automated employer email with pre-filled PDF attachment",
  "Multi-company support with role-based access",
  "Google Sheets backup with one click",
];

export default function Welcome() {
  const [, navigate] = useLocation();

  const handleTryDemo = () => {
    // Navigate to the server demo endpoint which sets the session cookie
    window.location.href = "/api/demo";
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: "#F9FAFB" }}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/welcome")}
            className="focus:outline-none"
          >
            <img
              src={LOGO_URL}
              alt="SaffHire Background Screening"
              className="h-10 w-auto object-contain"
            />
          </button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300 text-gray-700 font-semibold"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
            <Button
              size="sm"
              className="font-semibold"
              style={{ backgroundColor: "#1FFF00", color: "#0F172A" }}
              onClick={handleTryDemo}
            >
              Try Demo
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-white">
        <div className="max-w-3xl">
          <span
            className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-6"
            style={{ backgroundColor: "#1FFF0022", color: "#16a34a", border: "1px solid #1FFF0066" }}
          >
            Driver Compliance Dashboard
          </span>
          <h1
            className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Background Screening,{" "}
            <span style={{ color: "#16a34a" }}>Simplified.</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
            SaffHire gives your team a single place to monitor driver compliance,
            manage safety performance records, and stay ahead of DOT requirements —
            no spreadsheets required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="font-bold text-base px-8 py-3 rounded-xl shadow-md"
              style={{ backgroundColor: "#1FFF00", color: "#0F172A" }}
              onClick={handleTryDemo}
            >
              Try the Live Demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="font-semibold text-base px-8 py-3 rounded-xl border-gray-300 text-gray-700"
              onClick={() => navigate("/login")}
            >
              Sign In to Your Account
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            No account required · Demo resets automatically · Read-only data
          </p>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-16 px-6" style={{ backgroundColor: "#F9FAFB" }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-10">
            Everything your compliance team needs
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col gap-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#1FFF0022" }}
                >
                  <f.icon className="w-5 h-5" style={{ color: "#16a34a" }} />
                </div>
                <h3 className="font-bold text-gray-800 text-sm">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-14 px-6 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-8">Built for DOT compliance teams</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#16a34a" }} />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        className="py-16 px-6 text-center"
        style={{ background: "linear-gradient(135deg, #0F172A 0%, #1e293b 100%)" }}
      >
        <h2 className="text-2xl font-bold text-white mb-3">
          See it in action — no login needed
        </h2>
        <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">
          Explore the full dashboard with live demo data. Toggle monitor statuses,
          browse safety performance records, and check the analytics dashboard.
        </p>
        <Button
          size="lg"
          className="font-bold text-base px-10 py-3 rounded-xl shadow-lg"
          style={{ backgroundColor: "#1FFF00", color: "#0F172A" }}
          onClick={handleTryDemo}
        >
          Launch Demo
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-500 text-xs text-center py-5 px-6">
        © {new Date().getFullYear()} SaffHire Background Screening. All rights reserved.
      </footer>
    </div>
  );
}
