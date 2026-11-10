import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

// GET /api/roadmap/domains - Get complete 3-level tree
export async function getRoadmapTree(req: AuthRequest, res: Response) {
  try {
    const domains = await prisma.roadmapDomain.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        epics: {
          orderBy: { sortOrder: "asc" },
          include: {
            features: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    const enriched = domains.map((d) => ({
      ...d,
      epics: d.epics.map((epic) => {
        let minStart = epic.startDate;
        let maxEnd = epic.endDate;
        let totalProgress = 0;

        if (epic.features.length > 0) {
          epic.features.forEach((f) => {
            if (f.startDate && (!minStart || new Date(f.startDate) < new Date(minStart))) {
              minStart = f.startDate;
            }
            if (f.endDate && (!maxEnd || new Date(f.endDate) > new Date(maxEnd))) {
              maxEnd = f.endDate;
            }
            totalProgress += f.progressPercent || 0;
          });
        }

        const avgProgress = epic.features.length > 0 ? Math.round(totalProgress / epic.features.length) : 0;

        return {
          ...epic,
          computedStartDate: minStart || epic.startDate,
          computedEndDate: maxEnd || epic.endDate,
          computedProgress: avgProgress,
        };
      }),
    }));

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Domain CRUD
export async function createDomain(req: AuthRequest, res: Response) {
  try {
    const { name, code, color, sortOrder } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: "name & code required" });
    const domain = await prisma.roadmapDomain.create({
      data: { name, code, color: color || "#0e97d6", sortOrder: Number(sortOrder) || 0 },
    });
    res.status(201).json({ success: true, data: domain });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateDomain(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, code, color, sortOrder } = req.body;
    const domain = await prisma.roadmapDomain.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(color !== undefined && { color }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });
    res.json({ success: true, data: domain });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteDomain(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.roadmapDomain.delete({ where: { id } });
    res.json({ success: true, message: "Domain deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Epic CRUD
export async function createEpic(req: AuthRequest, res: Response) {
  try {
    const { domainId, title, description, startDate, endDate, status, sortOrder } = req.body;
    if (!domainId || !title) return res.status(400).json({ success: false, message: "domainId & title required" });
    const epic = await prisma.roadmapEpic.create({
      data: {
        domainId,
        title,
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || "PLANNED",
        sortOrder: Number(sortOrder) || 0,
      },
      include: { features: true },
    });
    res.status(201).json({ success: true, data: epic });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateEpic(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { domainId, title, description, startDate, endDate, status, sortOrder } = req.body;
    const epic = await prisma.roadmapEpic.update({
      where: { id },
      data: {
        ...(domainId !== undefined && { domainId }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status !== undefined && { status }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
      include: { features: true },
    });
    res.json({ success: true, data: epic });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteEpic(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.roadmapEpic.delete({ where: { id } });
    res.json({ success: true, message: "Epic deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Feature CRUD
export async function createFeature(req: AuthRequest, res: Response) {
  try {
    const { epicId, title, description, startDate, endDate, progressPercent, status, picName, sortOrder } = req.body;
    if (!epicId || !title) return res.status(400).json({ success: false, message: "epicId & title required" });
    const feature = await prisma.roadmapFeature.create({
      data: {
        epicId,
        title,
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        progressPercent: typeof progressPercent === "number" ? Math.min(100, Math.max(0, progressPercent)) : 0,
        status: status || "PLANNED",
        picName: picName || null,
        sortOrder: Number(sortOrder) || 0,
      },
    });
    res.status(201).json({ success: true, data: feature });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateFeature(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { epicId, title, description, startDate, endDate, progressPercent, status, picName, sortOrder } = req.body;
    const feature = await prisma.roadmapFeature.update({
      where: { id },
      data: {
        ...(epicId !== undefined && { epicId }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(progressPercent !== undefined && {
          progressPercent: Math.min(100, Math.max(0, Number(progressPercent))),
        }),
        ...(status !== undefined && { status }),
        ...(picName !== undefined && { picName }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
      },
    });
    res.json({ success: true, data: feature });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function patchFeatureDates(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { startDate, endDate, progressPercent } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "startDate & endDate required" });
    }

    const feature = await prisma.roadmapFeature.update({
      where: { id },
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        ...(progressPercent !== undefined && {
          progressPercent: Math.min(100, Math.max(0, Number(progressPercent))),
        }),
      },
    });
    res.json({ success: true, data: feature });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function deleteFeature(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.roadmapFeature.delete({ where: { id } });
    res.json({ success: true, message: "Feature deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Seed initial Skolla Q4 2026 - Q1 2027 roadmap
export async function seedRoadmap(req: AuthRequest, res: Response) {
  try {
    const count = await prisma.roadmapDomain.count();
    if (count > 0 && !req.query.force) {
      return res.json({ success: true, message: "Roadmap already seeded", count });
    }
    if (req.query.force) {
      await prisma.roadmapFeature.deleteMany({});
      await prisma.roadmapEpic.deleteMany({});
      await prisma.roadmapDomain.deleteMany({});
    }

    const d1 = await prisma.roadmapDomain.create({
      data: { name: "School Experience", code: "SCHOOL_EXP", color: "#010571", sortOrder: 1 }
    });
    const d2 = await prisma.roadmapDomain.create({
      data: { name: "Assessment & Learning", code: "ASSESS_LEARN", color: "#0e97d6", sortOrder: 2 }
    });
    const d3 = await prisma.roadmapDomain.create({
      data: { name: "Admission & Finance", code: "ADM_FINANCE", color: "#f2ca17", sortOrder: 3 }
    });

    const e1 = await prisma.roadmapEpic.create({
      data: {
        domainId: d1.id,
        title: "Presensi & Absensi",
        description: "Presensi digital harian QR dan per mata pelajaran",
        startDate: new Date("2026-10-21"),
        endDate: new Date("2027-02-05"),
        status: "IN_PROGRESS",
        sortOrder: 1,
      }
    });
    await prisma.roadmapFeature.createMany({
      data: [
        {
          epicId: e1.id,
          title: "Absen QR Code (Siswa & Guru)",
          description: "Scan QR code presensi harian kelas",
          startDate: new Date("2026-10-21"),
          endDate: new Date("2026-12-04"),
          progressPercent: 90,
          status: "IN_PROGRESS",
          picName: "Team School",
          sortOrder: 1,
        },
        {
          epicId: e1.id,
          title: "Absen Per Mata Pelajaran",
          description: "Presensi detail per jam pelajaran",
          startDate: new Date("2026-11-23"),
          endDate: new Date("2027-02-04"),
          progressPercent: 40,
          status: "IN_PROGRESS",
          picName: "Team School",
          sortOrder: 2,
        }
      ]
    });

    const e2 = await prisma.roadmapEpic.create({
      data: {
        domainId: d2.id,
        title: "Try Out (Rebuild TO)",
        description: "Engine Try Out dan simulasi ujian kapasitas besar",
        startDate: new Date("2026-10-21"),
        endDate: new Date("2027-02-15"),
        status: "IN_PROGRESS",
        sortOrder: 1,
      }
    });
    await prisma.roadmapFeature.createMany({
      data: [
        {
          epicId: e2.id,
          title: "Rebuild TO Engine (Sekolah Percontohan)",
          description: "Uji coba engine di sekolah percontohan",
          startDate: new Date("2026-10-21"),
          endDate: new Date("2027-01-15"),
          progressPercent: 75,
          status: "IN_PROGRESS",
          picName: "Core Eng",
          sortOrder: 1,
        },
        {
          epicId: e2.id,
          title: "Rebuild TO Peluncuran Umum",
          description: "Rilis engine TO ke semua sekolah mitra",
          startDate: new Date("2027-01-11"),
          endDate: new Date("2027-02-10"),
          progressPercent: 20,
          status: "PLANNED",
          picName: "Core Eng",
          sortOrder: 2,
        }
      ]
    });

    const e3 = await prisma.roadmapEpic.create({
      data: {
        domainId: d3.id,
        title: "PPDB & Pembayaran",
        description: "Penerimaan siswa baru 3 fase dan pembayaran SPP online",
        startDate: new Date("2026-10-29"),
        endDate: new Date("2027-08-05"),
        status: "PLANNED",
        sortOrder: 1,
      }
    });
    await prisma.roadmapFeature.createMany({
      data: [
        {
          epicId: e3.id,
          title: "Admission Form & Seleksi 3 Fase",
          description: "Alur pendaftaran, tes seleksi, dan pengumuman",
          startDate: new Date("2027-02-21"),
          endDate: new Date("2027-08-05"),
          progressPercent: 10,
          status: "PLANNED",
          picName: "Admission Eng",
          sortOrder: 1,
        },
        {
          epicId: e3.id,
          title: "Pembayaran Gateway v1",
          description: "Integrasi VA, QRIS dan autodebet",
          startDate: new Date("2027-02-21"),
          endDate: new Date("2027-08-05"),
          progressPercent: 10,
          status: "PLANNED",
          picName: "FinTech Team",
          sortOrder: 2,
        }
      ]
    });

    const domains = await prisma.roadmapDomain.findMany({
      include: { epics: { include: { features: true } } },
    });
    res.json({ success: true, message: "Roadmap seeded", data: domains });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
