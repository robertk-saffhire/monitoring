/**
 * SaffHire - Safety Performance Reports Listing Page
 *
 * Design: Green accent (#1FFF00), Poppins font, white/card layout
 * Matches the original saffhiresecure.com/app/safety-performance/manual-listing
 */

import { useState, useMemo } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, ChevronUp, ChevronDown, ChevronsUpDown, Trash2, RefreshCw, Mail, Copy, Loader2, CloudUpload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocalAuth } from "@/contexts/LocalAuthContext";
import { useAppContext } from "@/contexts/AppContext";

export interface SafetyReport {
  id: number;
  applicantName: string;
  fileNumber: string;
  created: string;
  status: "S1 Complete" | "Emp Sent" | "Emp Complete" | "Completed";
  followUpDate: string;
  // Section 1 - Notes
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
  employerAttention: string;
  employerStreet: string;
  employerCityStateZip: string;
  employerPhone: string;
  employerFax: string;
  employerEmail: string;
  confFax: string;
  confEmail: string;
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
  // Section 3 - Accidents
  accidentHistory: string;
  accidentDate1: string;
  accidentLocation1: string;
  accidentInjuries1: string;
  accidentFatalities1: string;
  accidentHazmat1: string;
  accidentDate2: string;
  accidentLocation2: string;
  accidentInjuries2: string;
  accidentFatalities2: string;
  accidentHazmat2: string;
  accidentDate3: string;
  accidentLocation3: string;
  accidentInjuries3: string;
  accidentFatalities3: string;
  accidentHazmat3: string;
  otherAccidents: string;
  // Section 4 - DOT
  dotCompany: string;
  dotEmployee: string;
  dotAlcoholTestPositive: boolean;
  dotDrugTestPositive: boolean;
  dotRefusedTest: boolean;
  dotOtherViolations: boolean;
  // Section 5
  infoReceivedFrom: string;
  infoReceivedDate: string;
  lastEmailed?: Date | null;
}

export const INITIAL_REPORTS: SafetyReport[] = [
  {
    id: 64, applicantName: "BALLESTEROS, JULIAN", fileNumber: "5060",
    created: "2026-04-01", status: "S1 Complete", followUpDate: "2026-04-06",
    notes: "",
    prevEmployerName: "Cowboy Trucking", prevEmployerEmail: "gustavo@cowboytruckingdfw.com",
    prevEmployerStreet: "4555 S. Westmoreland Rd.", prevEmployerPhone: "9727809094",
    prevEmployerFax: "", prevEmployerCityStateZip: "Dallas texas 75237",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 63, applicantName: "MARTINEZ SUAREZ, ALEXANDER", fileNumber: "5045",
    created: "2026-04-02", status: "S1 Complete", followUpDate: "2026-04-08",
    notes: "NO EMPLOYMENT INFORMATION LISTED",
    prevEmployerName: "Mastec", prevEmployerEmail: "",
    prevEmployerStreet: "515 Huffines Blvd", prevEmployerPhone: "469-794-8983",
    prevEmployerFax: "", prevEmployerCityStateZip: "Lewisville, TX 75056",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 62, applicantName: "VILLAFRANCO YANEZ, DAVID", fileNumber: "4936",
    created: "2026-04-01", status: "Completed", followUpDate: "2026-04-01",
    notes: "EMAILED CLIENT COMPLETED DOT FORM",
    prevEmployerName: "Texas State Utilities", prevEmployerEmail: "AH@TSU1.COM",
    prevEmployerStreet: "3112 Wichita CT", prevEmployerPhone: "8176659000",
    prevEmployerFax: "", prevEmployerCityStateZip: "Fort Worth, TX, 76140",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 61, applicantName: "MORENO, SALVADOR", fileNumber: "4915",
    created: "2026-03-13", status: "Completed", followUpDate: "",
    notes: "duplicate",
    prevEmployerName: "Pavlov Media (CCG)", prevEmployerEmail: "",
    prevEmployerStreet: "7700 s stemmons fwy", prevEmployerPhone: "+1 (316) 992-8548",
    prevEmployerFax: "", prevEmployerCityStateZip: "corinth/tx/ 76210",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 60, applicantName: "MORENO, SALVADOR", fileNumber: "4915",
    created: "2026-03-13", status: "Completed", followUpDate: "",
    notes: "duplicate",
    prevEmployerName: "Pavlov Media (CCG)", prevEmployerEmail: "",
    prevEmployerStreet: "7700 s stemmons fwy", prevEmployerPhone: "+1 (316) 992-8548",
    prevEmployerFax: "", prevEmployerCityStateZip: "corinth/tx/ 76210",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 59, applicantName: "MORENO, SALVADOR", fileNumber: "4915",
    created: "2026-04-01", status: "S1 Complete", followUpDate: "2026-04-06",
    notes: "",
    prevEmployerName: "Pavlov Media (CCG)", prevEmployerEmail: "humanresources@pavlovmedia.com",
    prevEmployerStreet: "7700 stemmons fwy", prevEmployerPhone: "3169928548",
    prevEmployerFax: "", prevEmployerCityStateZip: "Corinth/tx/76210",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 58, applicantName: "CABRERA, JUAN", fileNumber: "4831",
    created: "2026-04-01", status: "S1 Complete", followUpDate: "2026-04-06",
    notes: "",
    prevEmployerName: "Community Waste Disposal", prevEmployerEmail: "",
    prevEmployerStreet: "2010 California Crossing", prevEmployerPhone: "972-392-9300",
    prevEmployerFax: "972-556-0820", prevEmployerCityStateZip: "Dallas, TX 75220",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 56, applicantName: "DEPAZ CRUZ, JAIME EMMANUEL", fileNumber: "4817",
    created: "2026-03-18", status: "Completed", followUpDate: "2026-03-17",
    notes: "",
    prevEmployerName: "Larrett energy services", prevEmployerEmail: "",
    prevEmployerStreet: "Chambers at", prevEmployerPhone: "9722666292",
    prevEmployerFax: "", prevEmployerCityStateZip: "76084",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 54, applicantName: "DECLUETTE, ERWIN KELLY", fileNumber: "4792",
    created: "2026-03-13", status: "Completed", followUpDate: "2026-03-13",
    notes: "",
    prevEmployerName: "Circle K Transport", prevEmployerEmail: "kdecluette@yahoo.com",
    prevEmployerStreet: "1721 Stainback Rd", prevEmployerPhone: "214 280 9811",
    prevEmployerFax: "", prevEmployerCityStateZip: "Red Oak , Texas",
    employerName: "Erwin DeCluette", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 49, applicantName: "MOSELY, COURTNEY RASHAD", fileNumber: "4732",
    created: "2026-03-18", status: "Completed", followUpDate: "2026-03-20",
    notes: "NO EMPLOYMENT INFORMATION LISTED",
    prevEmployerName: "", prevEmployerEmail: "",
    prevEmployerStreet: "", prevEmployerPhone: "",
    prevEmployerFax: "", prevEmployerCityStateZip: "",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 48, applicantName: "GARCIA, PABLO", fileNumber: "4715",
    created: "2026-04-01", status: "S1 Complete", followUpDate: "2026-04-06",
    notes: "Employer: Certified Transport",
    prevEmployerName: "Raul Hernandez", prevEmployerEmail: "certifiedtransport@yahoo.com",
    prevEmployerStreet: "642 Lloyd rd", prevEmployerPhone: "2147328714",
    prevEmployerFax: "", prevEmployerCityStateZip: "Little elm tx 75086",
    employerName: "Driver Pipeline", employerAttention: "Driver",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 46, applicantName: "CANNON, TYSHUAN JAMES", fileNumber: "4711",
    created: "2026-03-18", status: "Completed", followUpDate: "2026-03-17",
    notes: "",
    prevEmployerName: "Atlas freight inc", prevEmployerEmail: "victoria@kirafreight.com",
    prevEmployerStreet: "25448 ruff st", prevEmployerPhone: "8157705115",
    prevEmployerFax: "", prevEmployerCityStateZip: "Plainfield Illinois 60585",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 42, applicantName: "SUAREZ, AARON", fileNumber: "4604",
    created: "2026-03-18", status: "Completed", followUpDate: "2026-03-17",
    notes: "No employment records. Awaiting client response",
    prevEmployerName: "Home Depot", prevEmployerEmail: "homedepot@gmail.com",
    prevEmployerStreet: "3850 s carrier pkwy", prevEmployerPhone: "9722370025",
    prevEmployerFax: "", prevEmployerCityStateZip: "Grand Prairie Tx 75052",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 41, applicantName: "WEAVER, JOHN M.", fileNumber: "4400",
    created: "2025-12-05", status: "Completed", followUpDate: "",
    notes: "NEEDS TO BE CANCELLED BC CANDIDATE HAS NO PREVIOUS EMPLOYMENT HISTORY",
    prevEmployerName: "John Weaver", prevEmployerEmail: "jweaver@sacheer.org",
    prevEmployerStreet: "29414 hwy64", prevEmployerPhone: "2144772622",
    prevEmployerFax: "", prevEmployerCityStateZip: "Canton Tx 75103",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 39, applicantName: "RENTERIA, CARLOS J.", fileNumber: "4385",
    created: "2026-01-19", status: "Completed", followUpDate: "2026-01-02",
    notes: "",
    prevEmployerName: "JBJ TRUCKING", prevEmployerEmail: "",
    prevEmployerStreet: "HAKAMORE", prevEmployerPhone: "469-989-5860",
    prevEmployerFax: "", prevEmployerCityStateZip: "MESQUITE, TX 75149",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 38, applicantName: "RASCON, ANTHONY JOSEPH", fileNumber: "4384",
    created: "2026-01-19", status: "Completed", followUpDate: "2026-01-02",
    notes: "",
    prevEmployerName: "SHERATON DALLAS", prevEmployerEmail: "RODRIGO.VILLANUEVA@MARRIOT.COM",
    prevEmployerStreet: "400 OLIVE ST", prevEmployerPhone: "214-922-8000",
    prevEmployerFax: "", prevEmployerCityStateZip: "DALLAS, TX 75227",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 33, applicantName: "DE PAZ CRUZ, JAIME EMMANUEL", fileNumber: "4367",
    created: "2026-01-19", status: "Completed", followUpDate: "2025-12-08",
    notes: "NO PREVIOUS EMPLOYER INFORMATION. CLIENT WILL BE OOO UNTIL 12/01\n12/05- ORDER NEEDS TO BE CANCELLED BC CANDIDATE DOES NOT HAVE ANY PREVIOUS EMPLOYER INFORMATION",
    prevEmployerName: "", prevEmployerEmail: "",
    prevEmployerStreet: "", prevEmployerPhone: "",
    prevEmployerFax: "", prevEmployerCityStateZip: "",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 32, applicantName: "ANDERSON, CHAUNCY D.", fileNumber: "4341",
    created: "2026-01-19", status: "Completed", followUpDate: "2025-12-12",
    notes: "FMCSA CLEARINGHOUSE\nMEETING WITH CLIENT 12/01 TO GET SET UP WITH THE CLEARINGHOUSE\n12/05- HAD MEETING WITH CLIENT TODAY. THEY ARE WORKING ON ADDING US AS A THIRD PARTY ADMIN SO WE CAN RUN THIS ORDER ON THE CLEARINGHOUSE",
    prevEmployerName: "D1 Transporters LLC", prevEmployerEmail: "",
    prevEmployerStreet: "1801 N Hampton Rd", prevEmployerPhone: "(469)930-0202",
    prevEmployerFax: "", prevEmployerCityStateZip: "Desoto,TX, 75115",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 31, applicantName: "TRIBBLE BAKER, DOMONIQUE MIGUEL MIGUEL", fileNumber: "4329",
    created: "2026-01-19", status: "Completed", followUpDate: "2026-01-02",
    notes: "",
    prevEmployerName: "Sherwin Williams", prevEmployerEmail: "Jeromebarksdale1@gmail.com",
    prevEmployerStreet: "6420 Denton Highway", prevEmployerPhone: "+1 (682) 424-5209",
    prevEmployerFax: "", prevEmployerCityStateZip: "Fort Worth, Texas",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 29, applicantName: "ESTRADA, JOEL", fileNumber: "4255",
    created: "2025-12-11", status: "Completed", followUpDate: "2025-12-09",
    notes: "CLOSED DUE TO NO RESPONSE IN 30 DAYS",
    prevEmployerName: "Texas Dept of Transportation", prevEmployerEmail: "",
    prevEmployerStreet: "east, 2201 TX-338 Loop, Odessa, TX 79764", prevEmployerPhone: "(432) 498-4710",
    prevEmployerFax: "432-498-4656", prevEmployerCityStateZip: "Odessa, TX 79764",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 28, applicantName: "RIVAS BOLANO, DEXY BEATRIZ", fileNumber: "4266",
    created: "2025-12-05", status: "Completed", followUpDate: "2025-12-08",
    notes: "NO PREVIOUS EMPLOYER INFORMATION PROVIDED. EMAILED CLIENT\nCLIENT WILL BE OUT OF THE OFFICE UNTIL 12/01\n12/05- THIS ORDER NEEDS TO BE CANCELLED BC THE CANDIDATE DOES NOT HAVE ANY PREVIOUS EMPLOYER INFORMATION",
    prevEmployerName: "", prevEmployerEmail: "",
    prevEmployerStreet: "", prevEmployerPhone: "",
    prevEmployerFax: "", prevEmployerCityStateZip: "",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 27, applicantName: "THOMPSON, BRODERICK L.", fileNumber: "4267",
    created: "2025-12-05", status: "Completed", followUpDate: "2025-12-05",
    notes: "CLOSED DUE TO NO RESPONSE FROM EMPLOYER IN 30 DAYS",
    prevEmployerName: "PRITCHARD INDUSTRIES", prevEmployerEmail: "LAVEDA12@GMAIL.COM",
    prevEmployerStreet: "1601 W MARSHAL DR", prevEmployerPhone: "2147149714",
    prevEmployerFax: "", prevEmployerCityStateZip: "GRAND PRAIRIE, TX 75051",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 24, applicantName: "SPYKES, JIMMY LEE", fileNumber: "4231",
    created: "2025-11-10", status: "Completed", followUpDate: "2025-11-06",
    notes: "VERIFICATION COMPLETED",
    prevEmployerName: "PERMIAN ENERGY SERVICES", prevEmployerEmail: "IMCBRIDE@PERMIAN-ES.COM",
    prevEmployerStreet: "1817 CR 131", prevEmployerPhone: "(325)554-7034",
    prevEmployerFax: "", prevEmployerCityStateZip: "PERMIAN ENERGY SERVICES",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 23, applicantName: "ERCILLA HERNANDEZ, OSVALDO NONE", fileNumber: "4230",
    created: "2025-11-20", status: "Completed", followUpDate: "2025-11-19",
    notes: "CLOSED DUE TO NO RESPONSE FROM EMPLOYER IN 30 DAYS",
    prevEmployerName: "Dixie", prevEmployerEmail: "",
    prevEmployerStreet: "3095 DIXIE BLVD", prevEmployerPhone: "4374449834",
    prevEmployerFax: "", prevEmployerCityStateZip: "Odessa, TX 79766",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 21, applicantName: "ROGINS, DOUGLAS DESHAIN", fileNumber: "4160",
    created: "2025-11-04", status: "Completed", followUpDate: "2025-10-27",
    notes: "",
    prevEmployerName: "Genesis Intermodal", prevEmployerEmail: "",
    prevEmployerStreet: "8325 Forney Rd", prevEmployerPhone: "4697657039",
    prevEmployerFax: "", prevEmployerCityStateZip: "Dallas, Texas 75227",
    employerName: "Driver Pipeline", employerAttention: "Wesley Whitworth",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
  {
    id: 20, applicantName: "LEE, GLORIA L.", fileNumber: "4173",
    created: "2025-11-04", status: "Completed", followUpDate: "2025-10-27",
    notes: "",
    prevEmployerName: "Helmcamp Materials", prevEmployerEmail: "alexgloria911@gmail.com",
    prevEmployerStreet: "262 Olhlhausen Rd", prevEmployerPhone: "9039079160",
    prevEmployerFax: "", prevEmployerCityStateZip: "abilene tx 79606",
    employerName: "Driver Pipeline", employerAttention: "",
    employerStreet: "1200 N. Union Bower Road", employerCityStateZip: "Irving, TX 75061",
    employerPhone: "972-573-2301", employerFax: "",
    employerEmail: "lmercado@driverpipeline.com", confFax: "", confEmail: "",
    employedByCompany: "", jobTitle: "",
    fromDate: "", toDate: "", droveMotorVehicle: "",
    vehicleStraightTruck: false, vehicleTractorSemitrailer: false,
    vehicleBus: false, vehicleCargoTank: false,
    vehicleDoublesTriples: false, vehicleOther: false,
    accidentHistory: "",
    accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
    accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
    accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
    otherAccidents: "",
    dotCompany: "", dotEmployee: "",
    dotAlcoholTestPositive: false, dotDrugTestPositive: false,
    dotRefusedTest: false, dotOtherViolations: false,
    infoReceivedFrom: "", infoReceivedDate: "",
  },
];

type SortKey = keyof SafetyReport;

interface Props {
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onRefresh: (newReports: SafetyReport[]) => void;
}

function SortIcon({ field, sortKey, sortDir }: { field: SortKey; sortKey: SortKey | null; sortDir: "asc" | "desc" }) {
  if (sortKey !== field) return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-40" />;
  return sortDir === "asc"
    ? <ChevronUp className="w-3 h-3 ml-1 text-green-500" />
    : <ChevronDown className="w-3 h-3 ml-1 text-green-500" />;
}

export default function SafetyPerformance({ onEdit, onDelete, onRefresh }: Props) {
  const { reports, reportsLoading } = useAppContext();
  const [, navigate] = useLocation();
  const { isAdmin, isDemo, canViewSafetyPerformance, canEditSafetyPerformance, isLoading: authLoading, selectedCompanyId } = useLocalAuth();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPushingBackup, setIsPushingBackup] = useState(false);
  const fetchNewSR = trpc.data.fetchNewSRReports.useMutation();
  const pushBackupMutation = trpc.safetyReports.pushBackup.useMutation();
  const companiesQuery = trpc.companyAccess.myCompanies.useQuery();

  const handlePushBackup = async () => {
    if (!selectedCompanyId) {
      toast.error("No company selected.");
      return;
    }
    const company = companiesQuery.data?.find((c) => c.id === selectedCompanyId);
    const backupUrl = (company as any)?.sheetUrlBackup;
    if (!backupUrl) {
      toast.error("No Backup Sheet URL configured for this company. Go to Settings → Companies to add one.");
      return;
    }
    setIsPushingBackup(true);
    try {
      const result = await pushBackupMutation.mutateAsync({
        companyId: selectedCompanyId,
        backupSheetUrl: backupUrl,
      });
      toast.success(`Backup complete — ${result.count} records pushed to Google Sheets.`);
    } catch (err: any) {
      toast.error(err?.message ?? "Backup failed. Please try again.");
    } finally {
      setIsPushingBackup(false);
    }
  };

  // ── Send Email modal state ────────────────────────────────────────────────
  const [emailModalReport, setEmailModalReport] = useState<SafetyReport | null>(null);
  const [emailModalStep, setEmailModalStep] = useState<"loading" | "compose" | "sent">("loading");
  const [generatedFormUrl, setGeneratedFormUrl] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const createToken = trpc.employerForm.createToken.useMutation();
  const setLastEmailedMutation = trpc.safetyReports.setLastEmailed.useMutation();
  const generatePdfMutation = trpc.safetyReports.generatePdf.useMutation();
  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);

  const handlePrintPdf = async (report: SafetyReport) => {
    setPdfLoadingId(report.id);
    try {
      const result = await generatePdfMutation.mutateAsync({ id: report.id });
      const byteCharacters = atob(result.base64);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded.');
    } catch (err) {
      toast.error('Failed to generate PDF. Please try again.');
      console.error(err);
    } finally {
      setPdfLoadingId(null);
    }
  };

  const handleOpenEmailModal = async (report: SafetyReport) => {
    setEmailModalReport(report);
    setEmailModalStep("loading");
    setGeneratedFormUrl("");
    setApplicantEmail("");
    try {
      const result = await createToken.mutateAsync({
        safetyReportId: report.id,
        fileNumber: report.fileNumber,
        origin: window.location.origin,
      });
      setGeneratedFormUrl(result.formUrl);
      setApplicantEmail(result.applicantEmail);
      setEmailModalStep("compose");
      // Record the lastEmailed timestamp immediately when the link is generated
      setLastEmailedMutation.mutate({ id: report.id });
    } catch (err) {
      toast.error("Failed to generate form link. Please try again.");
      setEmailModalReport(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedFormUrl);
    toast.success("Link copied to clipboard!");
  };

  const emailSubject = "Safety Performance Report \u2014 Employer Information Needed";
  const emailBody = `Driver Pipeline has asked us to complete a Safety Performance report for you. Please click the link below to fill in your previous employer's information.\n\n${generatedFormUrl}`;
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(applicantEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const existingFileNumbers = reports.map((r) => r.fileNumber);
      const newRows = await fetchNewSR.mutateAsync({ existingFileNumbers, companyId: selectedCompanyId ?? undefined });
      if (newRows.length === 0) {
        toast.info("No new Safety Reports found.");
        return;
      }
      const maxId = reports.length > 0 ? Math.max(...reports.map((r) => r.id)) : 0;
      const newReports: SafetyReport[] = newRows.map((row, idx) => ({
        id: maxId + idx + 1,
        applicantName: row.applicantName ?? "",
        fileNumber: row.fileNumber,
        created: (row as { created?: string }).created || new Date().toISOString().split("T")[0],
        status: ((row as { status?: string }).status as SafetyReport["status"]) || "S1 Complete",
        followUpDate: (row as { followUpDate?: string }).followUpDate || "",
        notes: "",
        prevEmployerName: row.employerName,
        prevEmployerEmail: row.employerEmail,
        prevEmployerStreet: row.employerStreet,
        prevEmployerPhone: row.employerPhone,
        prevEmployerFax: row.employerFax,
        prevEmployerCityStateZip: row.employerCityStateZip,
        employerName: "Driver Pipeline",
        employerAttention: "",
        employerStreet: "1200 N. Union Bower Road",
        employerCityStateZip: "Irving, TX 75061",
        employerPhone: "972-573-2301",
        employerFax: "",
        employerEmail: "lmercado@driverpipeline.com",
        confFax: "",
        confEmail: "",
        employedByCompany: "",
        jobTitle: "",
        fromDate: "",
        toDate: "",
        droveMotorVehicle: "",
        vehicleStraightTruck: false,
        vehicleTractorSemitrailer: false,
        vehicleBus: false,
        vehicleCargoTank: false,
        vehicleDoublesTriples: false,
        vehicleOther: false,
        accidentHistory: "",
        accidentDate1: "", accidentLocation1: "", accidentInjuries1: "", accidentFatalities1: "", accidentHazmat1: "",
        accidentDate2: "", accidentLocation2: "", accidentInjuries2: "", accidentFatalities2: "", accidentHazmat2: "",
        accidentDate3: "", accidentLocation3: "", accidentInjuries3: "", accidentFatalities3: "", accidentHazmat3: "",
        otherAccidents: "",
        dotCompany: "",
        dotEmployee: "",
        dotAlcoholTestPositive: false,
        dotDrugTestPositive: false,
        dotRefusedTest: false,
        dotOtherViolations: false,
        infoReceivedFrom: "",
        infoReceivedDate: "",
      }));
      onRefresh(newReports);
      toast.success(`${newReports.length} new Safety Report${newReports.length > 1 ? "s" : ""} added.`);
    } catch (err) {
      toast.error("Failed to fetch new reports. Please try again.");
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reports.filter(
      (r) =>
        r.applicantName.toLowerCase().includes(q) ||
        r.fileNumber.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
    );
  }, [reports, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const confirmDelete = deleteId !== null ? reports.find((r) => r.id === deleteId) : null;

  const handleExportCSV = (report: SafetyReport) => {
    const rows = [
      ["Field", "Value"],
      ["ID", report.id],
      ["Applicant Name", report.applicantName],
      ["File Number", report.fileNumber],
      ["Created", report.created],
      ["Status", report.status],
      ["Follow Up Date", report.followUpDate],
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safety-report-${report.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported.");
  };

  // Permission guard
  if (!authLoading && !canViewSafetyPerformance) {
    return (
      <div className="min-h-screen bg-white">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-xl font-semibold text-gray-700">Access Restricted</h2>
          <p className="text-gray-500 mt-2">You do not have permission to view the Safety Performance page.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Safety Performance Reports
          </h2>
          <div className="flex items-center gap-2">
            {isAdmin && !isDemo && (
              <Button
                onClick={handlePushBackup}
                disabled={isPushingBackup}
                variant="outline"
                className="font-semibold border-orange-300 text-orange-700 hover:bg-orange-50"
                title="Push all records to the Google Sheets backup"
              >
                {isPushingBackup
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <CloudUpload className="w-4 h-4 mr-2" />}
                {isPushingBackup ? "Backing up..." : "Push Backup"}
              </Button>
            )}
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="font-semibold border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Checking..." : "Refresh"}
            </Button>
            {!isDemo && (
              <Button
                onClick={() => navigate("/safety-performance/new")}
                className="font-semibold"
                style={{ backgroundColor: "#1FFF00", color: "#000" }}
              >
                + New
              </Button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}
            >
              <SelectTrigger className="w-20 h-8 text-sm border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">entries</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Search:</span>
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-48 h-8 text-sm border-border"
              placeholder="Name, file #, status..."
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
          <table className="w-full text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("id")}>
                  <span className="flex items-center">ID <SortIcon field="id" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("applicantName")}>
                  <span className="flex items-center">Applicant Name <SortIcon field="applicantName" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("fileNumber")}>
                  <span className="flex items-center">File Number <SortIcon field="fileNumber" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("created")}>
                  <span className="flex items-center">Created <SortIcon field="created" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Operations</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("status")}>
                  <span className="flex items-center">Status <SortIcon field="status" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("followUpDate")}>
                  <span className="flex items-center">Follow Up Date <SortIcon field="followUpDate" sortKey={sortKey} sortDir={sortDir} /></span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Last Emailed</th>
                {!isDemo && <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Send Email</th>}
                {!isDemo && <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Edit</th>}
                {isAdmin && !isDemo && <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Delete</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={isDemo ? 6 : isAdmin ? 9 : 8} className="px-4 py-8 text-center text-muted-foreground">
                    No records found.
                  </td>
                </tr>
              ) : (
                paginated.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                    <td className="px-4 py-3 text-foreground">{r.id}</td>
                    <td className="px-4 py-3 text-foreground font-medium">{r.applicantName}</td>
                    <td className="px-4 py-3 text-foreground">{r.fileNumber}</td>
                    <td className="px-4 py-3 text-foreground">{r.created}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
                          onClick={() => handleExportCSV(r)}
                        >
                          <FileText className="w-3 h-3" /> CSV
                        </button>
                        <button
                          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors disabled:opacity-50"
                          onClick={() => handlePrintPdf(r)}
                          disabled={pdfLoadingId === r.id}
                        >
                          {pdfLoadingId === r.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <FileText className="w-3 h-3" />}
                          {pdfLoadingId === r.id ? '...' : 'PDF'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        r.status === "Completed" ? "bg-green-100 text-green-700" :
                        r.status === "S1 Complete" ? "bg-blue-100 text-blue-700" :
                        r.status === "Emp Sent" ? "bg-yellow-100 text-yellow-700" :
                        "bg-purple-100 text-purple-700"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{r.followUpDate || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {r.lastEmailed
                        ? new Date(r.lastEmailed).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
                        : <span className="text-gray-300">—</span>}
                    </td>
                    {canEditSafetyPerformance && !isDemo && (
                      <td className="px-4 py-3">
                        <button
                          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border border-green-400 text-green-700 hover:bg-green-50 transition-colors"
                          onClick={() => handleOpenEmailModal(r)}
                        >
                          <Mail className="w-3 h-3" /> Send Email
                        </button>
                      </td>
                    )}
                    {canEditSafetyPerformance && !isDemo && (
                      <td className="px-4 py-3">
                        <button
                          className="text-xs font-semibold px-2 py-1 rounded border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors"
                          onClick={() => onEdit(r.id)}
                        >
                          Edit
                        </button>
                      </td>
                    )}
                    {isAdmin && !isDemo && (
                      <td className="px-4 py-3">
                        <button
                          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => setDeleteId(r.id)}
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            Showing {sorted.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, sorted.length)} of {sorted.length} entries
          </span>
          <div className="flex gap-1">
            <button
              className="px-3 py-1 rounded border border-border hover:bg-muted disabled:opacity-40"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`px-3 py-1 rounded border ${p === page ? "border-green-400 bg-green-50 text-green-700 font-semibold" : "border-border hover:bg-muted"}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded border border-border hover:bg-muted disabled:opacity-40"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </main>

      {/* Send Email Modal */}
      <Dialog open={!!emailModalReport} onOpenChange={(open) => { if (!open) { setEmailModalReport(null); setEmailModalStep("loading"); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" style={{ color: "#15a300" }} />
              Send Employer Info Request
            </DialogTitle>
            {emailModalReport && (
              <DialogDescription>
                File #{emailModalReport.fileNumber} — {emailModalReport.applicantName}
              </DialogDescription>
            )}
          </DialogHeader>

          {emailModalStep === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#1FFF00" }} />
              <p className="text-sm">Generating secure form link…</p>
            </div>
          )}

          {emailModalStep === "compose" && (
            <div className="space-y-4 py-2">
              {/* To field */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">To</label>
                <input
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  placeholder="applicant@email.com"
                  type="email"
                />
              </div>

              {/* Email body preview */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Message</label>
                <div className="bg-muted/40 border border-border rounded-md px-3 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  Driver Pipeline has asked us to complete a Safety Performance report for you. Please click the link below to fill in your previous employer&apos;s information.
                  <br /><br />
                  <a
                    href={generatedFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline break-all"
                  >
                    {generatedFormUrl}
                  </a>
                </div>
              </div>

              {/* Copy link helper */}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy link to clipboard
              </button>
            </div>
          )}

          {emailModalStep === "compose" && (
            <DialogFooter className="gap-2">
              <button
                className="text-sm px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors"
                onClick={() => { setEmailModalReport(null); setEmailModalStep("loading"); }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  window.open(gmailComposeUrl, "_blank", "noopener,noreferrer");
                  toast.success("Gmail compose window opened!");
                  setTimeout(() => {
                    setEmailModalReport(null);
                    setEmailModalStep("loading");
                  }, 500);
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded text-black transition-colors"
                style={{ backgroundColor: "#1FFF00" }}
              >
                <Mail className="w-4 h-4" /> Open in Email Client
              </button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Safety Performance Report?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete && (
                <>
                  This will permanently delete report <strong>#{confirmDelete.id}</strong> for{" "}
                  <strong>{confirmDelete.applicantName}</strong> (File #{confirmDelete.fileNumber}).
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (deleteId !== null) {
                  onDelete(deleteId);
                  toast.success("Report deleted.");
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
