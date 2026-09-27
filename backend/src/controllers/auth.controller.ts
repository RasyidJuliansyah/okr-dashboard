import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();
const JWT_SECRET =
  process.env.JWT_SECRET || "super-secret-key-okr-bsc-dashboard-2026";

export function isCLevelUser(user: { role?: string | null; position?: string | null } | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "C_LEVEL") return true;
  const pos = (user.position || "").toUpperCase();
  return /CEO|CTO|CBO|CHIEF EXECUTIVE|CHIEF TECHNOLOGY|CHIEF BUSINESS/i.test(pos);
}

export function isCeoUser(user: { role?: string | null; position?: string | null } | null | undefined): boolean {
  if (!user) return false;
  const pos = (user.position || "").toUpperCase();
  return (user.role === "C_LEVEL" || user.role === "MANAGER") && /CEO|CHIEF EXECUTIVE/i.test(pos);
}

export async function login(req: AuthRequest, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        managedDepartments: true,
        strategicDepartments: {
          select: { id: true, name: true, value: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Akun telah dinonaktifkan. Silakan hubungi admin." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        position: user.position,
        department: user.department,
        activeDepartment: user.department,
        originalRole: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    let isDepartmentActive = true;
    if (user.department) {
      const dept = await prisma.department.findUnique({
        where: { value: user.department },
        select: { isActive: true },
      });
      if (dept) {
        isDepartmentActive = dept.isActive;
      }
    }

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        originalRole: user.role,
        position: user.position,
        teamId: user.teamId,
        department: user.department,
        activeDepartment: user.department,
        isDepartmentActive,
        managedDepartments: user.managedDepartments.map((d) => d.value),
        strategicDepartments: user.strategicDepartments,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        teamId: true,
        department: true,
        isActive: true,
        managedDepartments: {
          select: {
            value: true,
          },
        },
        strategicDepartments: {
          select: {
            id: true,
            name: true,
            value: true,
          },
        },
      },
    });

    if (!user || user.isActive === false) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    const activeDepartment = req.user.activeDepartment || user.department;
    let isDepartmentActive = true;
    if (activeDepartment) {
      const dept = await prisma.department.findUnique({
        where: { value: activeDepartment },
        select: { isActive: true },
      });
      if (dept) {
        isDepartmentActive = dept.isActive;
      }
    }

    return res.status(200).json({
      ...user,
      role: req.user.role || user.role,
      originalRole: req.user.originalRole || user.role,
      activeDepartment,
      department: activeDepartment,
      isDepartmentActive,
      managedDepartments: user.managedDepartments.map((d) => d.value),
      strategicDepartments: user.strategicDepartments,
    });
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function switchContext(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        managedDepartments: true,
        strategicDepartments: {
          select: { id: true, name: true, value: true },
        },
      },
    });

    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hanya C-Level atau Admin yang dapat switch context
    const hasCLevelAccess =
      dbUser.role === "C_LEVEL" ||
      req.user.originalRole === "C_LEVEL" ||
      dbUser.role === "ADMIN" ||
      isCLevelUser(dbUser);

    if (!hasCLevelAccess) {
      return res.status(403).json({
        message: "Hanya jajaran C-Board / C-Level yang dapat beralih konteks",
      });
    }

    const { department: targetDept, role: targetRoleParam } = req.body;

    const isCeo = isCeoUser(dbUser);
    const isAdmin = dbUser.role === "ADMIN";

    let newRole = "C_LEVEL";
    let newDept = "STRATEGIC";

    // Switch kembali ke Executive C-Board Strategic Mode
    if (
      !targetDept ||
      targetDept === "STRATEGIC" ||
      targetRoleParam === "C_LEVEL"
    ) {
      newRole = dbUser.role === "ADMIN" ? "ADMIN" : "C_LEVEL";
      newDept = "STRATEGIC";
    } else {
      // Switch ke Operational Manager Mode untuk departemen target
      const deptExists = await prisma.department.findUnique({
        where: { value: targetDept.toUpperCase() },
      });
      if (!deptExists) {
        return res
          .status(404)
          .json({ message: "Departemen target tidak ditemukan" });
      }

      // Validasi scoping: CEO/Admin bebas switch ke seluruh departemen.
      // CTO/CBO hanya bisa switch ke departemen yang mereka sponsori / kelola.
      const isSponsored = dbUser.strategicDepartments.some(
        (d) => d.value.toUpperCase() === targetDept.toUpperCase()
      );
      const isManaged = dbUser.managedDepartments.some(
        (d) => d.value.toUpperCase() === targetDept.toUpperCase()
      );

      if (!isCeo && !isAdmin && !isSponsored && !isManaged) {
        return res.status(403).json({
          message: `Anda tidak memiliki hak supervisi operasional untuk departemen ${targetDept}`,
        });
      }

      newRole = "MANAGER";
      newDept = targetDept.toUpperCase();
    }

    const originalRole =
      req.user.originalRole ||
      (dbUser.role === "ADMIN" ? "ADMIN" : "C_LEVEL");

    const token = jwt.sign(
      {
        id: dbUser.id,
        email: dbUser.email,
        role: newRole,
        name: dbUser.name,
        position: dbUser.position,
        department: newDept,
        activeDepartment: newDept,
        originalRole,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      token,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: newRole,
        originalRole,
        position: dbUser.position,
        teamId: dbUser.teamId,
        department: newDept,
        activeDepartment: newDept,
        isDepartmentActive: true,
        managedDepartments: dbUser.managedDepartments.map((d) => d.value),
        strategicDepartments: dbUser.strategicDepartments,
      },
    });
  } catch (error) {
    console.error("switchContext error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}


export async function changePassword(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "Semua bidang password harus diisi" });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Konfirmasi password baru tidak cocok" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password baru minimal 6 karakter" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Password saat ini salah" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res
      .status(200)
      .json({ message: "Password berhasil diubah. Silakan login kembali." });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
