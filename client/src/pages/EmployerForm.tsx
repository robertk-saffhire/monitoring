/**
 * Public employer info form — accessible via a one-time token link.
 * No authentication required. Applicants fill in their previous employer's
 * contact information and submit it back to the dashboard.
 */

import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function EmployerForm() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = trpc.employerForm.getByToken.useQuery(
    { token: token ?? "" },
    { enabled: !!token, retry: false }
  );

  const [form, setForm] = useState({
    employerName: "",
    employerStreet: "",
    employerPhone: "",
    employerFax: "",
    employerCityStateZip: "",
    employerEmail: "",
    employerAttention: "",
  });

  const [prefilled, setPrefilled] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Pre-fill form when data loads
  if (data && !prefilled) {
    const d = data.existingData;
    if (d) {
      setForm({
        employerName: d.employerName || "",
        employerStreet: d.employerStreet || "",
        employerPhone: d.employerPhone || "",
        employerFax: d.employerFax || "",
        employerCityStateZip: d.employerCityStateZip || "",
        employerEmail: d.employerEmail || "",
        employerAttention: d.employerAttention || "",
      });
    }
    setPrefilled(true);
  }

  const submitMutation = trpc.employerForm.submit.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast.error(err.message || "Failed to submit. Please try again."),
  });

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    submitMutation.mutate({ token, ...form });
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#1FFF00" }} />
          <p className="text-sm font-medium">Loading form…</p>
        </div>
      </div>
    );
  }

  // ── Error / expired ───────────────────────────────────────────────────────
  if (error || !data) {
    const msg = (error as { message?: string })?.message ?? "This form link is invalid or has expired.";
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-lg border-red-200">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-700">Link Unavailable</CardTitle>
            <CardDescription>{msg}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-lg border-green-200">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2" style={{ color: "#15a300" }} />
            <CardTitle style={{ color: "#15a300" }}>Thank You!</CardTitle>
            <CardDescription className="text-base mt-1">
              Your employer information has been submitted successfully. You may close this window.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold text-gray-900 mb-1"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Previous Employer Information
          </h1>
          <p className="text-sm text-gray-500">
            File #{data.fileNumber} — Please fill in your previous employer's contact details below.
          </p>
        </div>

        <Card className="shadow-md">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="employerName">Employer Name <span className="text-red-500">*</span></Label>
                <Input
                  id="employerName"
                  value={form.employerName}
                  onChange={handleChange("employerName")}
                  placeholder="Company name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="employerAttention">Attention (Contact Person)</Label>
                <Input
                  id="employerAttention"
                  value={form.employerAttention}
                  onChange={handleChange("employerAttention")}
                  placeholder="HR Manager, Safety Director, etc."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="employerStreet">Street Address</Label>
                <Input
                  id="employerStreet"
                  value={form.employerStreet}
                  onChange={handleChange("employerStreet")}
                  placeholder="123 Main St"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="employerCityStateZip">City / State / ZIP</Label>
                <Input
                  id="employerCityStateZip"
                  value={form.employerCityStateZip}
                  onChange={handleChange("employerCityStateZip")}
                  placeholder="Dallas, TX 75201"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="employerPhone">Phone</Label>
                  <Input
                    id="employerPhone"
                    value={form.employerPhone}
                    onChange={handleChange("employerPhone")}
                    placeholder="(555) 000-0000"
                    type="tel"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="employerFax">Fax</Label>
                  <Input
                    id="employerFax"
                    value={form.employerFax}
                    onChange={handleChange("employerFax")}
                    placeholder="(555) 000-0000"
                    type="tel"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="employerEmail">Email</Label>
                <Input
                  id="employerEmail"
                  value={form.employerEmail}
                  onChange={handleChange("employerEmail")}
                  placeholder="hr@company.com"
                  type="email"
                />
              </div>

              <Button
                type="submit"
                className="w-full font-semibold"
                style={{ backgroundColor: "#1FFF00", color: "#111" }}
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</>
                ) : (
                  "Submit Employer Information"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          SaffHire Background Screening — Secure Form
        </p>
      </div>
    </div>
  );
}
