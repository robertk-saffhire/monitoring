/**
 * SaffHire - Demo Ended Page
 *
 * Shown when the demo session has expired due to inactivity (30 minutes).
 * Offers the visitor a way to restart the demo or contact SaffHire.
 */

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, RefreshCw } from "lucide-react";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663368468239/3wvjutsFdcEUnRywyqJHNV/SaffhireLogoShirtStyle_0449b2e9.webp";

export default function DemoEnded() {
  const [, navigate] = useLocation();

  const handleRestartDemo = () => {
    window.location.href = "/api/demo";
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: "#F9FAFB" }}
    >
      {/* Logo */}
      <button
        type="button"
        onClick={() => navigate("/welcome")}
        className="mb-10 focus:outline-none"
      >
        <img
          src={LOGO_URL}
          alt="SaffHire Background Screening"
          className="h-12 w-auto object-contain"
        />
      </button>

      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ backgroundColor: "#1FFF0022" }}
      >
        <Clock className="w-8 h-8" style={{ color: "#16a34a" }} />
      </div>

      {/* Heading */}
      <h1
        className="text-3xl font-extrabold text-gray-900 mb-3"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Your demo session has ended
      </h1>
      <p className="text-gray-500 text-base max-w-md mb-8">
        The demo automatically expires after 30 minutes of inactivity to keep the
        data fresh for the next visitor. You can restart it instantly — no sign-up
        required.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          className="font-bold text-base px-8 rounded-xl"
          style={{ backgroundColor: "#1FFF00", color: "#0F172A" }}
          onClick={handleRestartDemo}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Restart Demo
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="font-semibold text-base px-8 rounded-xl border-gray-300 text-gray-700"
          onClick={() => navigate("/welcome")}
        >
          Back to Overview
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <p className="text-xs text-gray-400 mt-8">
        Already have an account?{" "}
        <button
          type="button"
          className="underline hover:text-gray-600 transition-colors"
          onClick={() => navigate("/login")}
        >
          Sign in here
        </button>
      </p>
    </div>
  );
}
