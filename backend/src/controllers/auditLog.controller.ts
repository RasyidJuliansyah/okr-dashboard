import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const { entityType, action, search, startDate, endDate } = req.query;

    const where: any = {};

    if (entityType && typeof entityType === "string" && entityType !== "ALL") {
      where.entityType = entityType;
    }

    if (action && typeof action === "string" && action !== "ALL") {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate && typeof startDate === "string") {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === "string") {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.trim();
      where.OR = [
        { entityId: { contains: q } },
        { action: { contains: q } },
        { user: { name: { contains: q } } },
        { user: { email: { contains: q } } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              department: true,
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
