import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import { logAudit } from "../utils/auditLogger";

const prisma = new PrismaClient();

export async function getAllDepartments(req: AuthRequest, res: Response) {
  try {
    const { role, id: userId } = req.user!;
    let where: any = {};

    if (req.query.all === 'true') {
      where.isActive = true;
    } else if (role === 'TEAM' || role === 'LEADER') {
      where.isActive = true;
      const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { department: true } });
      if (dbUser?.department) {
        where.value = dbUser.department;
      }
    } else if (role === 'MANAGER') {
      where.isActive = true;
      const managed = await prisma.department.findMany({ where: { managerId: userId, isActive: true }, select: { value: true } });
      const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { department: true } });
      const deptValues = new Set<string>(managed.map(d => d.value));
      if (dbUser?.department && dbUser.department.toUpperCase() !== 'STRATEGIC') deptValues.add(dbUser.department);
      if (deptValues.size > 0) {
        where.value = { in: Array.from(deptValues) };
      }
    }
    // ADMIN and C_LEVEL see all (both active and inactive)

    const depts = await prisma.department.findMany({
      where,
      orderBy: { name: "asc" },
      include: { manager: true },
    });
    return res.status(200).json(depts);
  } catch (error) {
    console.error("Get departments error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createDepartment(req: AuthRequest, res: Response) {
  try {
    const { name, value } = req.body;

    if (!name || !value) {
      return res.status(400).json({ message: "Name and value are required" });
    }

    const existing = await prisma.department.findUnique({
      where: { value: value.toUpperCase() },
    });
    if (existing) {
      return res.status(400).json({ message: "Department value already exists" });
    }

    const newDept = await prisma.department.create({
      data: {
        name,
        value: value.toUpperCase(),
        isActive: true,
      },
    });

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "CREATE",
      entityType: "DEPARTMENT",
      entityId: newDept.id,
      newValues: newDept,
      req,
    });

    return res.status(201).json(newDept);
  } catch (error) {
    console.error("Create department error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function assignManager(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { userId } = req.body; // user ID to be manager, or null / empty

    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    const oldManagerId = dept.managerId;
    const newManagerId = userId || null;

    // Update department manager
    const updatedDept = await prisma.department.update({
      where: { id },
      data: { managerId: newManagerId },
      include: { manager: true },
    });

    // If new manager assigned, set role to MANAGER
    if (newManagerId) {
      await prisma.user.update({
        where: { id: newManagerId },
        data: { role: "MANAGER" },
      });
    }

    // If old manager removed or changed, demote to TEAM if not managing any other department
    if (oldManagerId && oldManagerId !== newManagerId) {
      const otherManaged = await prisma.department.count({
        where: { managerId: oldManagerId, id: { not: id } },
      });
      if (otherManaged === 0) {
        await prisma.user.update({
          where: { id: oldManagerId },
          data: { role: "TEAM" },
        });
      }
    }

    await logAudit(prisma, {
      userId: req.user?.id,
      action: newManagerId ? "ASSIGN_MANAGER" : "REMOVE_MANAGER",
      entityType: "DEPARTMENT",
      entityId: dept.id,
      oldValues: { managerId: oldManagerId },
      newValues: { managerId: newManagerId },
      req,
    });

    return res.status(200).json(updatedDept);
  } catch (error) {
    console.error("Assign manager error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function toggleDepartmentStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    const nextStatus = typeof req.body.isActive === "boolean" ? req.body.isActive : !dept.isActive;

    const updated = await prisma.department.update({
      where: { id },
      data: { isActive: nextStatus },
      include: { manager: true },
    });

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "STATUS_CHANGE",
      entityType: "DEPARTMENT",
      entityId: dept.id,
      oldValues: { isActive: dept.isActive },
      newValues: { isActive: updated.isActive },
      req,
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Toggle department status error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateDepartment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Department name is required" });
    }

    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    const updated = await prisma.department.update({
      where: { id },
      data: { name: name.trim() },
      include: { manager: true },
    });

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "UPDATE",
      entityType: "DEPARTMENT",
      entityId: dept.id,
      oldValues: { name: dept.name },
      newValues: { name: updated.name },
      req,
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update department error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

