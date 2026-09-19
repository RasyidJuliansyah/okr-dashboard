import { PrismaClient } from "@prisma/client";
import { Request } from "express";

export interface LogAuditParams {
  userId?: string | null;
  action: string;
  entityType: "USER" | "DEPARTMENT" | "TASK" | "INITIATIVE" | "KEY_RESULT" | "SPRINT";
  entityId?: string | null;
  oldValues?: any;
  newValues?: any;
  req?: Request;
}

export async function logAudit(prisma: PrismaClient, params: LogAuditParams) {
  try {
    let ipAddress: string | null = null;
    if (params.req) {
      const forwarded = params.req.headers["x-forwarded-for"];
      if (typeof forwarded === "string") {
        ipAddress = forwarded.split(",")[0].trim();
      } else if (Array.isArray(forwarded)) {
        ipAddress = forwarded[0].trim();
      } else {
        ipAddress = params.req.socket?.remoteAddress || null;
      }
    }

    let validUserId = params.userId || null;
    if (validUserId) {
      const userExists = await prisma.user.findUnique({
        where: { id: validUserId },
        select: { id: true },
      });
      if (!userExists) validUserId = null;
    }

    await prisma.auditLog.create({
      data: {
        userId: validUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        oldValues: params.oldValues !== undefined ? JSON.parse(JSON.stringify(params.oldValues)) : undefined,
        newValues: params.newValues !== undefined ? JSON.parse(JSON.stringify(params.newValues)) : undefined,
        ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
