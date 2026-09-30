import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { AuthRequest } from "../middleware/auth.middleware";
import { logAudit } from "../utils/auditLogger";

const prisma = new PrismaClient();

const VALID_ROLES = ["ADMIN", "C_LEVEL", "MANAGER", "LEADER", "TEAM"];

async function getValidDepartmentValues(): Promise<string[]> {
  const depts = await prisma.department.findMany({
    select: { value: true },
  });
  return depts.map((d) => d.value);
}

// GET /api/users
export async function getAllUsers(req: AuthRequest, res: Response) {
  try {
    const { department, role, teamId, includeInactive } = req.query;
    const where: any = {};
    if (department) where.department = department as string;
    if (role) where.role = role as string;
    if (teamId) where.teamId = teamId as string;
    if (includeInactive !== "true") {
      where.isActive = true;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        teamId: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/users (Create Employee)
export async function createEmployee(req: AuthRequest, res: Response) {
  try {
    const { name, email, position, department, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    let normalizedDept: string | null = null;
    let teamId = req.body.teamId || null;

    if (department) {
      normalizedDept = department.trim().toUpperCase();
      const validDepts = await getValidDepartmentValues();
      if (!validDepts.includes(normalizedDept as string)) {
        return res.status(400).json({
          message: `Department tidak valid: ${department}. Pilihan valid: ${validDepts.join(", ")}`,
        });
      }

      if (!teamId) {
        const team = await prisma.team.findFirst({
          where: { department: normalizedDept },
        });
        if (team) {
          teamId = team.id;
        }
      }
    }

    if (role && !VALID_ROLES.includes(role.toUpperCase())) {
      return res.status(400).json({
        message: `Role must be one of: ${VALID_ROLES.join(", ")}`,
      });
    }

    const targetRole = role ? role.toUpperCase() : "TEAM";

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (!existingUser.isActive) {
        const reactivated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name,
            position: position || null,
            department: normalizedDept,
            teamId,
            role: targetRole,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            position: true,
            teamId: true,
            isActive: true,
            createdAt: true,
          },
        });

        if (targetRole === "LEADER" && teamId) {
          await prisma.team.update({
            where: { id: teamId },
            data: { leaderId: reactivated.id },
          });
        }

        await logAudit(prisma, {
          userId: req.user?.id,
          action: "STATUS_CHANGE",
          entityType: "USER",
          entityId: reactivated.id,
          newValues: reactivated,
          req,
        });

        return res.status(200).json(reactivated);
      }
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash("SkollaEdu", 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        position: position || null,
        department: normalizedDept,
        teamId,
        role: targetRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        teamId: true,
        createdAt: true,
      },
    });

    if (targetRole === "LEADER" && teamId) {
      await prisma.team.update({
        where: { id: teamId },
        data: { leaderId: newUser.id },
      });
    }

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "CREATE",
      entityType: "USER",
      entityId: newUser.id,
      newValues: newUser,
      req,
    });

    return res.status(201).json(newUser);
  } catch (error) {
    console.error("Create employee error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/users/:id (Update Employee)
export async function updateEmployee(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, position, department, role } = req.body;

    let normalizedDept: string | null | undefined = undefined;
    let newTeamId: string | null | undefined =
      req.body.teamId !== undefined ? req.body.teamId : undefined;

    if (department !== undefined) {
      if (department) {
        normalizedDept = department.trim().toUpperCase();
        const validDepts = await getValidDepartmentValues();
        if (!validDepts.includes(normalizedDept as string)) {
          return res.status(400).json({
            message: `Department tidak valid: ${department}. Pilihan valid: ${validDepts.join(", ")}`,
          });
        }

        if (newTeamId === undefined) {
          const team = await prisma.team.findFirst({
            where: { department: normalizedDept },
          });
          newTeamId = team ? team.id : null;
        }
      } else {
        normalizedDept = null;
        if (newTeamId === undefined) {
          newTeamId = null;
        }
      }
    }

    if (role && !VALID_ROLES.includes(role.toUpperCase())) {
      return res.status(400).json({
        message: `Role must be one of: ${VALID_ROLES.join(", ")}`,
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newRole = role !== undefined ? role.toUpperCase() : user.role;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(position !== undefined && { position: position || null }),
        ...(normalizedDept !== undefined && { department: normalizedDept }),
        ...(newTeamId !== undefined && { teamId: newTeamId }),
        ...(role !== undefined && { role: newRole }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        teamId: true,
        createdAt: true,
      },
    });

    const effectiveTeamId = updated.teamId;
    if (newRole === "LEADER" && effectiveTeamId) {
      await prisma.team.update({
        where: { id: effectiveTeamId },
        data: { leaderId: user.id },
      });
    } else if (
      user.role === "LEADER" &&
      (newRole !== "LEADER" ||
        (normalizedDept !== undefined && normalizedDept !== user.department))
    ) {
      await prisma.team.updateMany({
        where: {
          leaderId: user.id,
          ...(effectiveTeamId ? { id: { not: effectiveTeamId } } : {}),
        },
        data: { leaderId: null },
      });
    }

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "UPDATE",
      entityType: "USER",
      entityId: user.id,
      oldValues: {
        name: user.name,
        position: user.position,
        department: user.department,
        teamId: user.teamId,
        role: user.role,
      },
      newValues: {
        name: updated.name,
        position: updated.position,
        department: updated.department,
        teamId: updated.teamId,
        role: updated.role,
      },
      req,
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update employee error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE /api/users/:id (Delete Employee -> Soft delete)
export async function deleteEmployee(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ponytail: soft-delete keeps FK historical integrity (audit logs, tasks, initiatives) intact; add permanent purge when data retention policy drafted
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "STATUS_CHANGE",
      entityType: "USER",
      entityId: user.id,
      oldValues: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
      },
      newValues: {
        isActive: false,
      },
      req,
    });

    return res.status(200).json({ message: "Pegawai berhasil dinonaktifkan" });
  } catch (error) {
    console.error("Delete employee error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/users/:id/department (Legacy/Compatibility)
export async function updateUserDepartment(req: AuthRequest, res: Response) {
  return updateEmployee(req, res);
}

// POST /api/users/bulk-upload
export async function bulkUploadEmployees(req: AuthRequest, res: Response) {
  try {
    const { employees } = req.body;

    if (!Array.isArray(employees) || employees.length === 0) {
      return res
        .status(400)
        .json({ message: "Data employees tidak boleh kosong" });
    }

    const results = { success: 0, updated: 0, errors: [] as any[] };
    const hashedPassword = await bcrypt.hash("SkollaEdu", 10);
    const validDepts = await getValidDepartmentValues();
    const allTeams = await prisma.team.findMany({
      select: { id: true, department: true },
    });
    const teamMap = new Map<string, string>();
    allTeams.forEach((t) => {
      if (t.department) teamMap.set(t.department.toUpperCase(), t.id);
    });

    for (const [index, emp] of employees.entries()) {
      const rowNum = index + 2; // baris ke-2 (baris 1 = header)

      if (!emp.name || !emp.email) {
        results.errors.push({
          row: rowNum,
          email: emp.email,
          reason: "Name dan Email wajib diisi",
        });
        continue;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emp.email)) {
        results.errors.push({
          row: rowNum,
          email: emp.email,
          reason: "Format email tidak valid",
        });
        continue;
      }

      let empDept: string | null = null;
      if (emp.department) {
        empDept = emp.department.trim().toUpperCase();
        if (!validDepts.includes(empDept as string)) {
          results.errors.push({
            row: rowNum,
            email: emp.email,
            reason: `Department tidak valid: ${emp.department}`,
          });
          continue;
        }
      }

      const resolvedTeamId = empDept ? teamMap.get(empDept) || null : null;

      if (emp.role && !VALID_ROLES.includes(emp.role.toUpperCase())) {
        results.errors.push({
          row: rowNum,
          email: emp.email,
          reason: `Role tidak valid: ${emp.role}`,
        });
        continue;
      }

      try {
        const existing = await prisma.user.findUnique({
          where: { email: emp.email },
        });

        if (existing) {
          await prisma.user.update({
            where: { email: emp.email },
            data: {
              name: emp.name,
              position: emp.position || null,
              department: empDept,
              ...(resolvedTeamId !== null ? { teamId: resolvedTeamId } : {}),
              ...(emp.role && { role: emp.role.toUpperCase() }),
              isActive: true,
            },
          });
          results.updated++;
        } else {
          await prisma.user.create({
            data: {
              name: emp.name,
              email: emp.email,
              password: hashedPassword,
              role: emp.role ? emp.role.toUpperCase() : "TEAM",
              position: emp.position || null,
              department: empDept,
              teamId: resolvedTeamId,
            },
          });
          results.success++;
        }
      } catch (err) {
        console.error(`Error processing row ${rowNum}:`, err);
        results.errors.push({
          row: rowNum,
          email: emp.email,
          reason: "Gagal menyimpan ke database",
        });
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Bulk upload error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/teams — Admin ambil semua team dengan leader & department
export async function getTeams(req: AuthRequest, res: Response) {
  try {
    const teams = await prisma.team.findMany({
      include: {
        leader: {
          select: { id: true, name: true, email: true },
        },
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return res.status(200).json(teams);
  } catch (error) {
    console.error("Get teams error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/teams/:id — Admin update leader & department sebuah Team
export async function updateTeam(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { leaderId, department } = req.body;

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Jika leaderId dikirim, pastikan user tersebut ada dan role-nya LEADER
    if (leaderId) {
      const leaderUser = await prisma.user.findUnique({
        where: { id: leaderId },
      });
      if (!leaderUser || leaderUser.role !== "LEADER") {
        return res
          .status(400)
          .json({ message: "User tidak ditemukan atau bukan LEADER" });
      }
    }

    const updated = await prisma.team.update({
      where: { id },
      data: {
        ...(leaderId !== undefined && { leaderId: leaderId || null }),
        ...(department !== undefined && { department: department || null }),
      },
      include: {
        leader: { select: { id: true, name: true } },
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update team error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/teams/:id/members — Ambil member dari tim tertentu
export async function getTeamMembers(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user!;

    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      return res.status(404).json({ message: "Tim tidak ditemukan" });
    }

    // LEADER: hanya bisa melihat member tim yang dipimpinnya / tim miliknya / tim di departemennya
    if (role === "LEADER") {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true, department: true },
      });
      const isAllowed =
        team.leaderId === userId ||
        team.id === dbUser?.teamId ||
        (dbUser?.department && team.department === dbUser.department);
      if (!isAllowed) {
        return res
          .status(403)
          .json({ message: "Forbidden: Bukan tim yang Anda pimpin" });
      }
    }

    const members = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { teamId: id },
          ...(team.department ? [{ department: team.department }] : []),
        ],
      },
      select: { id: true, name: true, email: true, role: true, position: true },
      orderBy: { name: "asc" },
    });

    return res.status(200).json(members);
  } catch (error) {
    console.error("Get team members error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/users/:id/reset-password — Admin reset password user ke SkollaEdu
export async function resetUserPassword(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const hashedPassword = await bcrypt.hash("SkollaEdu", 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    await logAudit(prisma, {
      userId: req.user?.id,
      action: "RESET_PASSWORD",
      entityType: "USER",
      entityId: user.id,
      oldValues: { email: user.email },
      req,
    });

    return res.status(200).json({
      message: `Password untuk ${user.name} berhasil direset ke 'SkollaEdu'`,
    });
  } catch (error) {
    console.error("Reset user password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
