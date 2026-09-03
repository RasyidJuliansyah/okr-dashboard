import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

const VALID_BSC_PERSPECTIVES = [
  "FINANCIAL",
  "CUSTOMER",
  "INTERNAL_PROCESS",
  "LEARNING_GROWTH",
];

// GET /api/kpis — Semua role bisa melihat master KPI
export async function getAllKpis(req: AuthRequest, res: Response) {
  try {
    const { department, bscPerspective, search } = req.query;

    const where: any = {
      status: "ACTIVE",
    };

    if (department && typeof department === "string" && department !== "ALL") {
      where.OR = [
        { department: department },
        { department: "ALL" },
        { department: null },
        { department: "" },
      ];
    }

    if (bscPerspective && typeof bscPerspective === "string") {
      where.bscPerspective = bscPerspective.toUpperCase();
    }

    if (search && typeof search === "string") {
      where.name = {
        contains: search,
      };
    }

    const kpis = await prisma.kpi.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return res.status(200).json(kpis);
  } catch (error) {
    console.error("Get KPIs error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/kpis — Admin membuat Master KPI baru
export async function createKpi(req: AuthRequest, res: Response) {
  try {
    const {
      name,
      description,
      department,
      bscPerspective,
      unit,
      defaultTarget,
    } = req.body;

    if (!name || !bscPerspective || !unit) {
      return res
        .status(400)
        .json({
          message: "Nama KPI, Aspek BSC, dan Satuan (unit) wajib diisi",
        });
    }

    if (!VALID_BSC_PERSPECTIVES.includes(bscPerspective.toUpperCase())) {
      return res.status(400).json({
        message: `Aspek BSC harus salah satu dari: ${VALID_BSC_PERSPECTIVES.join(", ")}`,
      });
    }

    const newKpi = await prisma.kpi.create({
      data: {
        name,
        description: description || null,
        department: department ? department.toUpperCase() : "ALL",
        bscPerspective: bscPerspective.toUpperCase(),
        unit,
        defaultTarget:
          defaultTarget !== undefined && defaultTarget !== null
            ? parseFloat(defaultTarget)
            : null,
      },
    });

    return res.status(201).json(newKpi);
  } catch (error) {
    console.error("Create KPI error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/kpis/:id — Admin mengedit Master KPI
export async function updateKpi(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      department,
      bscPerspective,
      unit,
      defaultTarget,
      status,
    } = req.body;

    const existing = await prisma.kpi.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "KPI tidak ditemukan" });
    }

    if (
      bscPerspective &&
      !VALID_BSC_PERSPECTIVES.includes(bscPerspective.toUpperCase())
    ) {
      return res.status(400).json({
        message: `Aspek BSC harus salah satu dari: ${VALID_BSC_PERSPECTIVES.join(", ")}`,
      });
    }

    const updated = await prisma.kpi.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(department !== undefined && {
          department: department ? department.toUpperCase() : "ALL",
        }),
        ...(bscPerspective !== undefined && {
          bscPerspective: bscPerspective.toUpperCase(),
        }),
        ...(unit !== undefined && { unit }),
        ...(defaultTarget !== undefined && {
          defaultTarget:
            defaultTarget !== null ? parseFloat(defaultTarget) : null,
        }),
        ...(status !== undefined && { status }),
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Update KPI error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE /api/kpis/:id — Admin menghapus Master KPI
export async function deleteKpi(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.kpi.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "KPI tidak ditemukan" });
    }

    const usageCount =
      (await prisma.initiativeKpi.count({ where: { kpiId: id } })) +
      (await prisma.taskKpi.count({ where: { kpiId: id } }));

    if (usageCount > 0) {
      // Soft delete jika KPI sudah digunakan oleh Inisiatif atau Task
      await prisma.kpi.update({
        where: { id },
        data: { status: "INACTIVE" },
      });
      return res
        .status(200)
        .json({
          message: "KPI dinonaktifkan karena sudah terpakai di Inisiatif/Task",
        });
    }

    await prisma.kpi.delete({ where: { id } });
    return res.status(200).json({ message: "KPI berhasil dihapus" });
  } catch (error) {
    console.error("Delete KPI error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/kpis/bulk-upload — Admin import banyak Master KPI via CSV
export async function bulkUploadKpis(req: AuthRequest, res: Response) {
  try {
    const { kpis } = req.body;

    if (!Array.isArray(kpis) || kpis.length === 0) {
      return res.status(400).json({ message: "Data kpis tidak boleh kosong" });
    }

    const results = { success: 0, updated: 0, errors: [] as any[] };

    for (const [index, item] of kpis.entries()) {
      const rowNum = index + 2;

      if (!item.name || !item.bscPerspective || !item.unit) {
        results.errors.push({
          row: rowNum,
          name: item.name || "-",
          reason: "Nama KPI, Aspek BSC, dan Unit wajib diisi",
        });
        continue;
      }

      const bscUpper = item.bscPerspective.toUpperCase();
      if (!VALID_BSC_PERSPECTIVES.includes(bscUpper)) {
        results.errors.push({
          row: rowNum,
          name: item.name,
          reason: `Aspek BSC tidak valid: ${item.bscPerspective}`,
        });
        continue;
      }

      const deptVal = item.department ? item.department.toUpperCase() : "ALL";

      try {
        const existing = await prisma.kpi.findFirst({
          where: {
            name: item.name,
            department: deptVal,
          },
        });

        if (existing) {
          await prisma.kpi.update({
            where: { id: existing.id },
            data: {
              description: item.description || existing.description,
              bscPerspective: bscUpper,
              unit: item.unit,
              defaultTarget: item.defaultTarget
                ? parseFloat(item.defaultTarget)
                : existing.defaultTarget,
              status: "ACTIVE",
            },
          });
          results.updated++;
        } else {
          await prisma.kpi.create({
            data: {
              name: item.name,
              description: item.description || null,
              department: deptVal,
              bscPerspective: bscUpper,
              unit: item.unit,
              defaultTarget: item.defaultTarget
                ? parseFloat(item.defaultTarget)
                : null,
              status: "ACTIVE",
            },
          });
          results.success++;
        }
      } catch (err) {
        console.error(`Error processing KPI row ${rowNum}:`, err);
        results.errors.push({
          row: rowNum,
          name: item.name,
          reason: "Gagal menyimpan ke database",
        });
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Bulk upload KPIs error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
