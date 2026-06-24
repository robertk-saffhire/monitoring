/**
 * SaffHire - Safety Performance Submission Edit Form
 *
 * Full 5-section edit form matching saffhiresecure.com/app/safety-performance/{id}/edit
 * Design: Green accent (#1FFF00), Poppins font, white/card layout
 */

import { useState } from "react";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, Mail, Printer } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { SafetyReport } from "./SafetyPerformance";

interface EditFormData {
  // Section 1 - Admin
  applicantName: string;
  fileNumber: string;
  status: string;
  followUpDate: string;
  notes: string;
  // Section 1 - Previous Employer
  prevEmployerName: string;
  prevEmployerEmail: string;
  prevEmployerStreet: string;
  prevEmployerPhone: string;
  prevEmployerFax: string;
  prevEmployerCityStateZip: string;
  // Section 1 - Prospective Employer
  employerName: string;
  attention: string;
  employerStreet: string;
  employerCityStateZip: string;
  employerPhone: string;
  employerFax: string;
  employerEmail: string;
  confFax: string;
  confEmail: string;
  appSignature: boolean;
  // Section 2
  employedByCompany: string;
  jobTitle: string;
  fromDate: string;
  toDate: string;
  droveMotorVehicle: string;
  vehicleStraightTruck: boolean;
  vehicleTractorSemitrailer: boolean;
  vehicleBus: boolean;
  vehicleCargoTank: boolean;
  vehicleDoublesTriples: boolean;
  vehicleOther: boolean;
  // Section 3
  accidentHistory: string;
  accidents: { date: string; location: string; injuries: string; fatalities: string; hazmat: string }[];
  otherAccidents: string;
  // Section 4
  dotCompany: string;
  dotEmployee: string;
  dotAlcohol: boolean;
  dotDrug: boolean;
  dotRefused: boolean;
  dotOther: boolean;
  dotPrior: boolean;
  dotRtd: boolean;
  // Section 5
  infoReceivedFrom: string;
  infoReceivedDate: string;
}

const defaultForm = (report?: SafetyReport): EditFormData => ({
  applicantName: report?.applicantName ?? "",
  fileNumber: report?.fileNumber ?? "",
  status: report?.status ?? "S1 Complete",
  followUpDate: report?.followUpDate ?? "",
  notes: report?.notes ?? "",
  prevEmployerName: report?.prevEmployerName ?? "",
  prevEmployerEmail: report?.prevEmployerEmail ?? "",
  prevEmployerStreet: report?.prevEmployerStreet ?? "",
  prevEmployerPhone: report?.prevEmployerPhone ?? "",
  prevEmployerFax: report?.prevEmployerFax ?? "",
  prevEmployerCityStateZip: report?.prevEmployerCityStateZip ?? "",
  employerName: report?.employerName ?? "Driver Pipeline",
  attention: report?.employerAttention ?? "",
  employerStreet: report?.employerStreet ?? "1200 N. Union Bower Road",
  employerCityStateZip: report?.employerCityStateZip ?? "Irving, TX 75061",
  employerPhone: report?.employerPhone ?? "972-573-2301",
  employerFax: report?.employerFax ?? "",
  employerEmail: report?.employerEmail ?? "lmercado@driverpipeline.com",
  confFax: report?.confFax ?? "",
  confEmail: report?.confEmail ?? "",
  appSignature: false,
  employedByCompany: report?.employedByCompany ?? "",
  jobTitle: report?.jobTitle ?? "",
  fromDate: report?.fromDate ?? "",
  toDate: report?.toDate ?? "",
  droveMotorVehicle: report?.droveMotorVehicle ?? "",
  vehicleStraightTruck: report?.vehicleStraightTruck ?? false,
  vehicleTractorSemitrailer: report?.vehicleTractorSemitrailer ?? false,
  vehicleBus: report?.vehicleBus ?? false,
  vehicleCargoTank: report?.vehicleCargoTank ?? false,
  vehicleDoublesTriples: report?.vehicleDoublesTriples ?? false,
  vehicleOther: report?.vehicleOther ?? false,
  accidentHistory: report?.accidentHistory ?? "",
  accidents: [
    { date: report?.accidentDate1 ?? "", location: report?.accidentLocation1 ?? "", injuries: report?.accidentInjuries1 ?? "", fatalities: report?.accidentFatalities1 ?? "", hazmat: report?.accidentHazmat1 ?? "" },
    { date: report?.accidentDate2 ?? "", location: report?.accidentLocation2 ?? "", injuries: report?.accidentInjuries2 ?? "", fatalities: report?.accidentFatalities2 ?? "", hazmat: report?.accidentHazmat2 ?? "" },
    { date: report?.accidentDate3 ?? "", location: report?.accidentLocation3 ?? "", injuries: report?.accidentInjuries3 ?? "", fatalities: report?.accidentFatalities3 ?? "", hazmat: report?.accidentHazmat3 ?? "" },
  ],
  otherAccidents: report?.otherAccidents ?? "",
  dotCompany: report?.dotCompany ?? "",
  dotEmployee: report?.dotEmployee ?? "",
  dotAlcohol: report?.dotAlcoholTestPositive ?? false,
  dotDrug: report?.dotDrugTestPositive ?? false,
  dotRefused: report?.dotRefusedTest ?? false,
  dotOther: report?.dotOtherViolations ?? false,
  dotPrior: false,
  dotRtd: false,
  infoReceivedFrom: report?.infoReceivedFrom ?? "",
  infoReceivedDate: report?.infoReceivedDate ?? "",
});

interface Props {
  report?: SafetyReport;
  onSave: (data: Partial<SafetyReport>) => void;
  onBack: () => void;
}

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-between px-5 py-3 text-left font-semibold text-sm rounded-t-lg transition-colors"
      style={{ backgroundColor: "#dbeafe", color: "#1e3a8a", fontFamily: "'Poppins', sans-serif" }}
      onClick={onToggle}
    >
      <span>{title}</span>
      {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-muted-foreground mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {children}
    </label>
  );
}

export default function SafetyPerformanceEdit({ report, onSave, onBack }: Props) {
  const [, navigate] = useLocation();
  const [form, setForm] = useState<EditFormData>(defaultForm(report));
  const [sections, setSections] = useState({ s1: true, s2: true, s3: true, s4: true, s5: true });

  const set = (field: keyof EditFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setAccident = (idx: number, field: string, value: string) =>
    setForm((prev) => {
      const accidents = [...prev.accidents];
      accidents[idx] = { ...accidents[idx], [field]: value };
      return { ...prev, accidents };
    });

  const toggleSection = (s: keyof typeof sections) =>
    setSections((prev) => ({ ...prev, [s]: !prev[s] }));

  const handleSave = () => {
    onSave({
      applicantName: form.applicantName,
      fileNumber: form.fileNumber,
      status: form.status as SafetyReport["status"],
      followUpDate: form.followUpDate,
      notes: form.notes,
      prevEmployerName: form.prevEmployerName,
      prevEmployerEmail: form.prevEmployerEmail,
      prevEmployerStreet: form.prevEmployerStreet,
      prevEmployerPhone: form.prevEmployerPhone,
      prevEmployerFax: form.prevEmployerFax,
      prevEmployerCityStateZip: form.prevEmployerCityStateZip,
      employerName: form.employerName,
      employerAttention: form.attention,
      employerStreet: form.employerStreet,
      employerCityStateZip: form.employerCityStateZip,
      employerPhone: form.employerPhone,
      employerFax: form.employerFax,
      employerEmail: form.employerEmail,
      confFax: form.confFax,
      confEmail: form.confEmail,
      employedByCompany: form.employedByCompany,
      jobTitle: form.jobTitle,
      fromDate: form.fromDate,
      toDate: form.toDate,
      droveMotorVehicle: form.droveMotorVehicle,
      vehicleStraightTruck: form.vehicleStraightTruck,
      vehicleTractorSemitrailer: form.vehicleTractorSemitrailer,
      vehicleBus: form.vehicleBus,
      vehicleCargoTank: form.vehicleCargoTank,
      vehicleDoublesTriples: form.vehicleDoublesTriples,
      vehicleOther: form.vehicleOther,
      accidentHistory: form.accidentHistory,
      accidentDate1: form.accidents[0]?.date ?? "",
      accidentLocation1: form.accidents[0]?.location ?? "",
      accidentInjuries1: form.accidents[0]?.injuries ?? "",
      accidentFatalities1: form.accidents[0]?.fatalities ?? "",
      accidentHazmat1: form.accidents[0]?.hazmat ?? "",
      accidentDate2: form.accidents[1]?.date ?? "",
      accidentLocation2: form.accidents[1]?.location ?? "",
      accidentInjuries2: form.accidents[1]?.injuries ?? "",
      accidentFatalities2: form.accidents[1]?.fatalities ?? "",
      accidentHazmat2: form.accidents[1]?.hazmat ?? "",
      accidentDate3: form.accidents[2]?.date ?? "",
      accidentLocation3: form.accidents[2]?.location ?? "",
      accidentInjuries3: form.accidents[2]?.injuries ?? "",
      accidentFatalities3: form.accidents[2]?.fatalities ?? "",
      accidentHazmat3: form.accidents[2]?.hazmat ?? "",
      otherAccidents: form.otherAccidents,
      dotCompany: form.dotCompany,
      dotEmployee: form.dotEmployee,
      dotAlcoholTestPositive: form.dotAlcohol,
      dotDrugTestPositive: form.dotDrug,
      dotRefusedTest: form.dotRefused,
      dotOtherViolations: form.dotOther,
      infoReceivedFrom: form.infoReceivedFrom,
      infoReceivedDate: form.infoReceivedDate,
    });
    toast.success("Safety performance report saved.");
    onBack();
  };

  const [showSendModal, setShowSendModal] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePdf = trpc.safetyPdf.generate.useMutation();

  const handleEmailFax = async () => {
    setIsGenerating(true);
    try {
      const result = await generatePdf.mutateAsync({
        applicantName: form.applicantName,
        prevEmployerName: form.prevEmployerName,
        prevEmployerStreet: form.prevEmployerStreet,
        prevEmployerCityStateZip: form.prevEmployerCityStateZip,
        prevEmployerEmail: form.prevEmployerEmail,
        prevEmployerPhone: form.prevEmployerPhone,
        prevEmployerFax: form.prevEmployerFax,
        employerName: form.employerName,
        attention: form.attention,
        employerPhone: form.employerPhone,
        employerStreet: form.employerStreet,
        employerCityStateZip: form.employerCityStateZip,
        confFax: form.confFax,
        confEmail: form.confEmail,
        employedByCompany: form.employedByCompany,
        jobTitle: form.jobTitle,
        fromDate: form.fromDate,
        toDate: form.toDate,
        droveMotorVehicle: form.droveMotorVehicle,
        vehicleStraightTruck: form.vehicleStraightTruck,
        vehicleTractorSemitrailer: form.vehicleTractorSemitrailer,
        vehicleBus: form.vehicleBus,
        vehicleCargoTank: form.vehicleCargoTank,
        vehicleDoublesTriples: form.vehicleDoublesTriples,
        vehicleOther: form.vehicleOther,
        accidents: form.accidents,
        otherAccidents: form.otherAccidents,
        dotCompany: form.dotCompany,
        dotEmployee: form.dotEmployee,
        dotAlcohol: form.dotAlcohol,
        dotDrug: form.dotDrug,
        dotRefused: form.dotRefused,
        dotOther: form.dotOther,
        dotPrior: form.dotPrior,
        dotRtd: form.dotRtd,
        infoReceivedFrom: form.infoReceivedFrom,
        infoReceivedDate: form.infoReceivedDate,
      });
      setPdfBase64(result.base64);
      // Create a blob URL for the in-modal preview
      const byteChars = atob(result.base64);
      const byteNums = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteNums], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      // Revoke any previous blob URL to avoid memory leaks
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(blobUrl);
      setShowSendModal(true);
    } catch (err) {
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfBase64) return;
    const byteChars = atob(pdfBase64);
    const byteNums = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
    const blob = new Blob([byteNums], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safety-performance-${form.fileNumber || "report"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmailPdf = () => {
    if (!pdfBase64) return;
    // Download the PDF first, then open Gmail
    handleDownloadPdf();
    const to = form.prevEmployerEmail || "";
    const subject = encodeURIComponent(`Safety Performance History Records Request — ${form.applicantName || form.fileNumber}`);
    const body = encodeURIComponent(
      `Please find attached the Safety Performance History Records Request for ${form.applicantName || "the applicant"}.\n\nPlease complete Sections 2 through 4 and return at your earliest convenience.\n\nThank you.`
    );
    window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(to)}&su=${subject}&body=${body}`, "_blank");
  };

  const handleFaxPdf = () => {
    if (!pdfBase64) return;
    handleDownloadPdf();
    toast.info("PDF downloaded. Please fax it to: " + (form.prevEmployerFax || "(fax number not on file)"));
  };

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            className="text-sm font-medium text-blue-700 hover:underline"
            onClick={onBack}
          >
            ← Back to Reports
          </button>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Safety Performance Submission
        </h2>

        <div className="space-y-6">
          {/* SECTION 1 */}
          <div className="border border-border rounded-lg overflow-hidden shadow-sm">
            <SectionHeader
              title="SECTION 1: To be Completed by Prospective Employee"
              open={sections.s1}
              onToggle={() => toggleSection("s1")}
            />
            {sections.s1 && (
              <div className="p-5 space-y-5">
                {/* Admin fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel>Applicant Name</FieldLabel>
                    <Input value={form.applicantName} onChange={(e) => set("applicantName", e.target.value)} className="border-border" />
                  </div>
                  <div>
                    <FieldLabel>File Number</FieldLabel>
                    <Input value={form.fileNumber} onChange={(e) => set("fileNumber", e.target.value)} className="border-border" />
                  </div>
                  <div>
                    <FieldLabel>Status</FieldLabel>
                    <Select value={form.status} onValueChange={(v) => set("status", v)}>
                      <SelectTrigger className="border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="S1 Complete">S1 Complete</SelectItem>
                        <SelectItem value="Emp Sent">Emp Sent</SelectItem>
                        <SelectItem value="Emp Complete">Emp Complete</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Follow Up Date</FieldLabel>
                    <Input type="date" value={form.followUpDate} onChange={(e) => set("followUpDate", e.target.value)} className="border-border" />
                  </div>
                </div>
                <div>
                  <FieldLabel>Notes</FieldLabel>
                  <textarea
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    rows={4}
                    className="w-full border border-border rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  />
                </div>
                <Button
                  type="button"
                  className="w-full font-semibold"
                  style={{ backgroundColor: "#1D4ED8", color: "#fff" }}
                  onClick={handleSave}
                >
                  Save Form
                </Button>

                {/* Previous Employer */}
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-3 mt-2" style={{ fontFamily: "'Poppins', sans-serif" }}>Previous Employer</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Name</FieldLabel>
                      <Input value={form.prevEmployerName} onChange={(e) => set("prevEmployerName", e.target.value)} className="border-border" />
                    </div>
                    <div>
                      <FieldLabel>Email</FieldLabel>
                      <Input type="email" value={form.prevEmployerEmail} onChange={(e) => set("prevEmployerEmail", e.target.value)} className="border-border" />
                    </div>
                    <div>
                      <FieldLabel>Previous Employer Street</FieldLabel>
                      <Input value={form.prevEmployerStreet} onChange={(e) => set("prevEmployerStreet", e.target.value)} className="border-border" />
                    </div>
                    <div>
                      <FieldLabel>Previous Employer Phone</FieldLabel>
                      <Input value={form.prevEmployerPhone} onChange={(e) => set("prevEmployerPhone", e.target.value)} className="border-border" />
                    </div>
                    <div>
                      <FieldLabel>Previous Employer Fax</FieldLabel>
                      <Input value={form.prevEmployerFax} onChange={(e) => set("prevEmployerFax", e.target.value)} className="border-border" />
                    </div>
                    <div>
                      <FieldLabel>Previous Employer City/State/Zip</FieldLabel>
                      <Input value={form.prevEmployerCityStateZip} onChange={(e) => set("prevEmployerCityStateZip", e.target.value)} className="border-border" />
                    </div>
                  </div>
                </div>

                {/* Prospective Employer */}
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-3 mt-2" style={{ fontFamily: "'Poppins', sans-serif" }}>Prospective Employer</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Name</FieldLabel>
                      <Input value={form.employerName} onChange={(e) => set("employerName", e.target.value)} className="border-border" />
                    </div>
                    <div>
                      <FieldLabel>Attention</FieldLabel>
                      <Input value={form.attention} onChange={(e) => set("attention", e.target.value)} className="border-border" />
                    </div>
                    <div>
                      <FieldLabel>Street</FieldLabel>
                      <Input value={form.employerStreet} onChange={(e) => set("employerStreet", e.target.value)} className="border-border" />
                    </div>
                    <div>
                      <FieldLabel>City/State/Zip</FieldLabel>
                      <Input value={form.employerCityStateZip} onChange={(e) => set("employerCityStateZip", e.target.value)} className="border-border" />
                    </div>
                    <div>
                      <FieldLabel>Phone</FieldLabel>
                      <Input value={form.employerPhone} onChange={(e) => set("employerPhone", e.target.value)} className="border-border" />
                    </div>
                    <div>
                      <FieldLabel>Fax</FieldLabel>
                      <Input value={form.employerFax} onChange={(e) => set("employerFax", e.target.value)} className="border-border" />
                    </div>
                    <div>
                      <FieldLabel>Employer Email</FieldLabel>
                      <Input type="email" value={form.employerEmail} onChange={(e) => set("employerEmail", e.target.value)} className="border-border" />
                    </div>
                    <div>
                      <FieldLabel>Confidential Fax</FieldLabel>
                      <Input value={form.confFax} onChange={(e) => set("confFax", e.target.value)} className="border-border" />
                    </div>
                    <div>
                      <FieldLabel>Confidential Email</FieldLabel>
                      <Input type="email" value={form.confEmail} onChange={(e) => set("confEmail", e.target.value)} className="border-border" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="appSignature"
                      checked={form.appSignature}
                      onChange={(e) => set("appSignature", e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="appSignature" className="text-sm text-foreground cursor-pointer">
                      I verify the name above as my signature for this document.
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2 */}
          <div className="border border-border rounded-lg overflow-hidden shadow-sm">
            <SectionHeader
              title="SECTION 2: To be Completed by Previous Employer"
              open={sections.s2}
              onToggle={() => toggleSection("s2")}
            />
            {sections.s2 && (
              <div className="p-5 space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">To Be Completed By Previous Employer</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Was the applicant employed or used by your company?</FieldLabel>
                    <Select value={form.employedByCompany} onValueChange={(v) => set("employedByCompany", v)}>
                      <SelectTrigger className="border-border"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Job Title</FieldLabel>
                    <Input value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} className="border-border" />
                  </div>
                  <div>
                    <FieldLabel>From Date</FieldLabel>
                    <Input type="date" value={form.fromDate} onChange={(e) => set("fromDate", e.target.value)} className="border-border" />
                  </div>
                  <div>
                    <FieldLabel>To Date</FieldLabel>
                    <Input type="date" value={form.toDate} onChange={(e) => set("toDate", e.target.value)} className="border-border" />
                  </div>
                  <div>
                    <FieldLabel>Did they drive a motor vehicle?</FieldLabel>
                    <Select value={form.droveMotorVehicle} onValueChange={(v) => set("droveMotorVehicle", v)}>
                      <SelectTrigger className="border-border"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <FieldLabel>Types of Vehicles Operated</FieldLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                    {[
                      { key: "vehicleStraightTruck", label: "Straight Truck" },
                      { key: "vehicleTractorSemitrailer", label: "Tractor-Semitrailer" },
                      { key: "vehicleBus", label: "Bus" },
                      { key: "vehicleCargoTank", label: "Cargo Tank" },
                      { key: "vehicleDoublesTriples", label: "Doubles/Triples" },
                      { key: "vehicleOther", label: "Other" },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form[key as keyof EditFormData] as boolean}
                          onChange={(e) => set(key as keyof EditFormData, e.target.checked)}
                          className="w-4 h-4"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3 */}
          <div className="border border-border rounded-lg overflow-hidden shadow-sm">
            <SectionHeader
              title="SECTION 3: Accident History (Previous Employer)"
              open={sections.s3}
              onToggle={() => toggleSection("s3")}
            />
            {sections.s3 && (
              <div className="p-5 space-y-4">
                <div>
                  <FieldLabel>Is there accident history for this driver?</FieldLabel>
                  <Select value={form.accidentHistory} onValueChange={(v) => set("accidentHistory", v)}>
                    <SelectTrigger className="w-48 border-border"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                    <thead className="bg-secondary">
                      <tr>
                        {["Date", "Location", "Injuries", "Fatalities", "Hazmat Spill"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-foreground border-b border-border">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {form.accidents.map((acc, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="px-2 py-2"><Input type="date" value={acc.date} onChange={(e) => setAccident(i, "date", e.target.value)} className="border-border h-8 text-xs" /></td>
                          <td className="px-2 py-2"><Input value={acc.location} onChange={(e) => setAccident(i, "location", e.target.value)} className="border-border h-8 text-xs" /></td>
                          <td className="px-2 py-2"><Input value={acc.injuries} onChange={(e) => setAccident(i, "injuries", e.target.value)} className="border-border h-8 text-xs" /></td>
                          <td className="px-2 py-2"><Input value={acc.fatalities} onChange={(e) => setAccident(i, "fatalities", e.target.value)} className="border-border h-8 text-xs" /></td>
                          <td className="px-2 py-2"><Input value={acc.hazmat} onChange={(e) => setAccident(i, "hazmat", e.target.value)} className="border-border h-8 text-xs" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <FieldLabel>Other accidents (reported to agencies or insurers)</FieldLabel>
                  <textarea
                    value={form.otherAccidents}
                    onChange={(e) => set("otherAccidents", e.target.value)}
                    rows={3}
                    className="w-full border border-border rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4 */}
          <div className="border border-border rounded-lg overflow-hidden shadow-sm">
            <SectionHeader
              title="SECTION 4: DOT Release of Information — Previous Employer"
              open={sections.s4}
              onToggle={() => toggleSection("s4")}
            />
            {sections.s4 && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Is your company subject to DOT-regulated testing?</FieldLabel>
                    <Select value={form.dotCompany} onValueChange={(v) => set("dotCompany", v)}>
                      <SelectTrigger className="border-border"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Was employee subject to DOT testing?</FieldLabel>
                    <Select value={form.dotEmployee} onValueChange={(v) => set("dotEmployee", v)}>
                      <SelectTrigger className="border-border"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <FieldLabel>In the past 2 or 3 years, has the employee:</FieldLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {[
                      { key: "dotAlcohol", label: "Alcohol test result ≥ 0.04" },
                      { key: "dotDrug", label: "Verified positive drug test" },
                      { key: "dotRefused", label: "Refused to be tested" },
                      { key: "dotOther", label: "Other DOT violations" },
                      { key: "dotPrior", label: "Prior employer reported violation" },
                      { key: "dotRtd", label: "Completed return-to-duty process" },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form[key as keyof EditFormData] as boolean}
                          onChange={(e) => set(key as keyof EditFormData, e.target.checked)}
                          className="w-4 h-4"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5 */}
          <div className="border border-border rounded-lg overflow-hidden shadow-sm">
            <SectionHeader
              title="SECTION 5: Information Received"
              open={sections.s5}
              onToggle={() => toggleSection("s5")}
            />
            {sections.s5 && (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Information Received From</FieldLabel>
                    <Input value={form.infoReceivedFrom} onChange={(e) => set("infoReceivedFrom", e.target.value)} className="border-border" />
                  </div>
                  <div>
                    <FieldLabel>Information Received Date</FieldLabel>
                    <Input type="date" value={form.infoReceivedDate} onChange={(e) => set("infoReceivedDate", e.target.value)} className="border-border" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              className="font-semibold px-8"
              style={{ backgroundColor: "#1D4ED8", color: "#fff" }}
              onClick={handleSave}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              className="font-semibold px-8"
              onClick={handleEmailFax}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating PDF..." : "Email / Fax / Send"}
            </Button>
          </div>
        </div>
      </main>

      {/* Email / Fax / Send Modal */}
      <Dialog open={showSendModal} onOpenChange={(open) => {
        setShowSendModal(open);
        if (!open && pdfBlobUrl) {
          URL.revokeObjectURL(pdfBlobUrl);
          setPdfBlobUrl(null);
        }
      }}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Send Safety Performance Form</DialogTitle>
          </DialogHeader>

          {/* PDF Preview */}
          {pdfBlobUrl && (
            <div className="w-full rounded-md border border-border overflow-hidden bg-muted" style={{ height: "60vh" }}>
              <iframe
                src={pdfBlobUrl}
                className="w-full h-full"
                title="Safety Performance PDF Preview"
                style={{ border: "none" }}
              />
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Review the filled form above, then choose how to send it:
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              className="flex-1 min-w-[160px] justify-start gap-3"
              style={{ backgroundColor: "#1D4ED8", color: "#fff" }}
              onClick={handleEmailPdf}
            >
              <Mail className="w-4 h-4" />
              Email via Gmail
              {form.prevEmployerEmail && (
                <span className="ml-auto text-xs opacity-75 truncate max-w-[140px]">{form.prevEmployerEmail}</span>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1 min-w-[160px] justify-start gap-3"
              onClick={handleFaxPdf}
            >
              <Printer className="w-4 h-4" />
              Download &amp; Fax
              {form.prevEmployerFax && (
                <span className="ml-auto text-xs text-muted-foreground truncate max-w-[140px]">{form.prevEmployerFax}</span>
              )}
            </Button>
            <Button
              variant="ghost"
              className="flex-1 min-w-[140px] justify-start gap-3 text-muted-foreground"
              onClick={handleDownloadPdf}
            >
              Download PDF only
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
