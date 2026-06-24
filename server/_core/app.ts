import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerDemoRoute } from "../demoRoute";
import { appRouter } from "../routers";
import { createContext } from "./context";
import {
  createApplicantAuditLog,
  getActiveNotificationEmails,
  getApplicantByFileNumber,
  getApplicants,
  getViewerPermissionsForUser,
  upsertApplicant,
} from "../db";
import { getLocalUserFromCookie } from "../localSession";
import { sendMonitorStatusEmail } from "../emailSender";

function parseCompanyId(req: Request): number | null {
  const rawCompanyId = Array.isArray(req.query.companyId) ? req.query.companyId[0] : req.query.companyId;
  const bodyCompanyId = typeof req.body?.companyId === "number" || typeof req.body?.companyId === "string" ? req.body.companyId : undefined;
  const value = rawCompanyId ?? bodyCompanyId;
  if (value === undefined || value === null || value === "") return null;
  const companyId = Number(value);
  return Number.isFinite(companyId) && companyId > 0 ? companyId : null;
}

async function requireMonitoringAccess(req: Request, res: Response, companyId: number, edit: boolean) {
  const user = await getLocalUserFromCookie(req as { cookies?: Record<string, string> });
  if (!user) {
    res.status(401).json({ status: "error", message: "Login required" });
    return null;
  }

  if (user.role === "admin") return user;

  if (user.role === "user") {
    if (user.companyId === null || user.companyId === companyId) return user;
    res.status(403).json({ status: "error", message: "Company access denied" });
    return null;
  }

  const permissions = await getViewerPermissionsForUser(user.id);
  const permission = permissions.find((p) => p.companyId === companyId);
  const allowed = edit ? permission?.canEditMonitoring : permission?.canViewMonitoring;
  if (!allowed) {
    res.status(403).json({ status: "error", message: edit ? "Monitoring edit access denied" : "Monitoring view access denied" });
    return null;
  }

  return user;
}

function normalizeApplicantForApi(row: any, index = 0) {
  return {
    id: String(row.id ?? index + 1),
    fileNumber: row.fileNumber,
    name: row.applicantName,
    orderDate: row.orderDate,
    monitorStatus: row.monitorStatus,
    mvrStatus: row.mvrStatus,
    medExpire: row.medExpire ?? "",
    medExpireOverridden: row.medExpireOverridden,
    notes: row.notes,
  };
}

export function createApiApp() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true, app: "saffhire-monitoring", runtime: "api" });
  });

  app.get("/api/monitoring/applicants", async (req, res) => {
    try {
      const companyId = parseCompanyId(req);
      if (!companyId) {
        res.status(400).json({ status: "error", message: "Valid companyId is required" });
        return;
      }

      const user = await requireMonitoringAccess(req, res, companyId, false);
      if (!user) return;

      const rows = await getApplicants(companyId);
      const data = rows.map((row, index) => normalizeApplicantForApi(row, index));

      res.status(200).json({
        status: "ok",
        source: "supabase",
        data,
        message: data.length > 0 ? "Loaded from Supabase applicants table" : "No Supabase applicants found. Import the CSV backup into Supabase.",
      });
    } catch (error) {
      console.error("[monitoring/applicants] Supabase read failed:", error);
      res.status(500).json({ status: "error", message: "Failed to load Supabase applicants" });
    }
  });

  app.patch("/api/monitoring/applicants/:fileNumber", async (req, res) => {
    try {
      const companyId = parseCompanyId(req);
      if (!companyId) {
        res.status(400).json({ status: "error", message: "Valid companyId is required" });
        return;
      }

      const user = await requireMonitoringAccess(req, res, companyId, true);
      if (!user) return;

      const fileNumber = String(req.params.fileNumber ?? "").trim();
      if (!fileNumber) {
        res.status(400).json({ status: "error", message: "fileNumber is required" });
        return;
      }

      const existing = await getApplicantByFileNumber(fileNumber, companyId);
      if (!existing) {
        res.status(404).json({ status: "error", message: "Applicant not found" });
        return;
      }

      const next = {
        monitorStatus: existing.monitorStatus,
        notes: existing.notes,
        medExpire: existing.medExpire,
        medExpireOverridden: existing.medExpireOverridden,
      };
      const changes: { fieldName: "monitorStatus" | "notes" | "medExpire"; oldValue: string | null; newValue: string | null }[] = [];

      if (Object.prototype.hasOwnProperty.call(req.body, "monitorStatus")) {
        const monitorStatus = String(req.body.monitorStatus).trim();
        if (monitorStatus !== "On" && monitorStatus !== "Off") {
          res.status(400).json({ status: "error", message: "monitorStatus must be On or Off" });
          return;
        }
        if (monitorStatus !== existing.monitorStatus) {
          next.monitorStatus = monitorStatus as "On" | "Off";
          changes.push({ fieldName: "monitorStatus", oldValue: existing.monitorStatus, newValue: monitorStatus });
        }
      }

      if (Object.prototype.hasOwnProperty.call(req.body, "notes")) {
        const notes = String(req.body.notes ?? "");
        if (notes !== existing.notes) {
          next.notes = notes;
          changes.push({ fieldName: "notes", oldValue: existing.notes, newValue: notes });
        }
      }

      if (Object.prototype.hasOwnProperty.call(req.body, "medExpire")) {
        const medExpire = String(req.body.medExpire ?? "").trim();
        const normalizedMedExpire = medExpire || null;
        if ((existing.medExpire ?? null) !== normalizedMedExpire) {
          next.medExpire = normalizedMedExpire;
          next.medExpireOverridden = Boolean(normalizedMedExpire);
          changes.push({ fieldName: "medExpire", oldValue: existing.medExpire ?? null, newValue: normalizedMedExpire });
        }
      }

      if (changes.length === 0) {
        res.status(200).json({ status: "ok", source: "supabase", data: normalizeApplicantForApi(existing) });
        return;
      }

      const updated = await upsertApplicant({
        companyId,
        fileNumber: existing.fileNumber,
        applicantName: existing.applicantName,
        orderDate: existing.orderDate,
        monitorStatus: next.monitorStatus,
        mvrStatus: existing.mvrStatus,
        medExpire: next.medExpire,
        medExpireOverridden: next.medExpireOverridden,
        notes: next.notes,
      });

      await Promise.all(changes.map((change) => createApplicantAuditLog({
        companyId,
        applicantId: existing.id,
        fieldName: change.fieldName,
        oldValue: change.oldValue,
        newValue: change.newValue,
        changedBy: user.id,
      })));

      const monitorChange = changes.find((change) => change.fieldName === "monitorStatus");
      if (monitorChange && (next.monitorStatus === "On" || next.monitorStatus === "Off")) {
        try {
          const recipients = await getActiveNotificationEmails();
          if (recipients.length > 0) {
            await sendMonitorStatusEmail({
              newStatus: next.monitorStatus,
              applicantName: existing.applicantName || existing.fileNumber,
              fileNumber: existing.fileNumber,
              changedBy: user.displayName ?? user.username,
              recipients: recipients.map((recipient) => recipient.email),
            });
          }
        } catch (emailErr) {
          console.error("[monitoring/applicants] Failed to send monitor notification:", emailErr);
        }
      }

      res.status(200).json({ status: "ok", source: "supabase", data: normalizeApplicantForApi(updated) });
    } catch (error) {
      console.error("[monitoring/applicants] Supabase write failed:", error);
      res.status(500).json({ status: "error", message: "Failed to update Supabase applicant" });
    }
  });

  registerOAuthRoutes(app);
  registerDemoRoute(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  return app;
}
