import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

const VALID_DEPARTMENTS = [
  "STRATEGIC",
  "FINANCE",
  "BUSINESS",
  "B2S",
  "B2B_EXPANSION",
  "B2B_CORPORATION",
  "B2C",
  "PRODUCT_SERVICE",
  "SERVICE_ACCOUNT",
  "TECHDEV",
  "TECHOPS",
  "EDUCATION",
  "SSC",
  "DESIGN",
  "DATA",
  "HR",
];

const VALID_ROLES = ["ADMIN", "C_LEVEL", "MANAGER", "LEADER", "TEAM"];

// GET /api/users
export async function getAllUsers(req: AuthRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({
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

    if (department && !VALID_DEPARTMENTS.includes(department)) {
      return res.status(400).json({
        message: `Department must be one of: ${VALID_DEPARTMENTS.join(", ")}`,
      });
    }

    if (role && !VALID_ROLES.includes(role.toUpperCase())) {
      return res.status(400).json({
        message: `Role must be one of: ${VALID_ROLES.join(", ")}`,
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash("SkollaEdu", 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        position: position || null,
        department: department || null,
        role: role ? role.toUpperCase() : "TEAM",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        createdAt: true,
      },
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

    if (department && !VALID_DEPARTMENTS.includes(department)) {
      return res.status(400).json({
        message: `Department must be one of: ${VALID_DEPARTMENTS.join(", ")}`,
      });
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

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(position !== undefined && { position: position || null }),
        ...(department !== undefined && { department: department || null }),
        ...(role !== undefined && { role: role.toUpperCase() }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        createdAt: true,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update employee error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE /api/users/:id (Delete Employee)
export async function deleteEmployee(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check RACI assignment
    const assignmentCount = await prisma.krAssignment.count({
      where: { userId: id },
    });

    if (assignmentCount > 0) {
      return res.status(400).json({
        message:
          "Pegawai tidak dapat dihapus karena masih terdaftar dalam RACI Assignment Key Result.",
      });
    }

    await prisma.user.delete({ where: { id } });

    return res.status(200).json({ message: "Pegawai berhasil dihapus" });
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

      if (
        emp.department &&
        !VALID_DEPARTMENTS.includes(emp.department.toUpperCase())
      ) {
        results.errors.push({
          row: rowNum,
          email: emp.email,
          reason: `Department tidak valid: ${emp.department}`,
        });
        continue;
      }

      if (
        emp.role &&
        !VALID_ROLES.includes(emp.role.toUpperCase())
      ) {
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
              department: emp.department ? emp.department.toUpperCase() : null,
              ...(emp.role && { role: emp.role.toUpperCase() }),
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
              department: emp.department ? emp.department.toUpperCase() : null,
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
      const leaderUser = await prisma.user.findUnique({ where: { id: leaderId } });
      if (!leaderUser || leaderUser.role !== "LEADER") {
        return res.status(400).json({ message: "User tidak ditemukan atau bukan LEADER" });
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

    // LEADER: hanya bisa melihat member tim yang dipimpinnya / tim miliknya / tim di departemennya
    if (role === 'LEADER') {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { teamId: true, department: true }
      });
      const team = await prisma.team.findUnique({ where: { id } });
      const isAllowed = team && (
        team.leaderId === userId ||
        team.id === dbUser?.teamId ||
        (dbUser?.department && team.department === dbUser.department)
      );
      if (!isAllowed) {
        return res.status(403).json({ message: 'Forbidden: Bukan tim yang Anda pimpin' });
      }
    }

    const members = await prisma.user.findMany({
      where: { teamId: id },
      select: { id: true, name: true, email: true, role: true, position: true },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(members);
  } catch (error) {
    console.error('Get team members error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

