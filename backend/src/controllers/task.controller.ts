import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

async function createNotification(params: {
  recipientId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}) {
  try {
    await prisma.notification.create({ data: params });
  } catch (err) {
    console.error("Create notification error:", err);
  }
}

// POST /api/tasks/cross-dept — Buat Task Lintas Departemen
export async function createCrossDeptTask(req: AuthRequest, res: Response) {
  try {
    const {
      title,
      description,
      targetDept,
      initiativeId,
      assignedTeamMemberId,
      startDate,
      finishDate,
      link,
      targetValue,
      unit,
    } = req.body;

    const { id: userId, name: userName } = req.user!;
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { department: true },
    });
    const userDept = dbUser?.department || null;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Judul task wajib diisi" });
    }
    if (!targetDept || !targetDept.trim()) {
      return res.status(400).json({ message: "Departemen tujuan wajib dipilih" });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        targetDept: targetDept.trim(),
        creatorDept: userDept || null,
        creatorId: userId,
        isCrossDept: true,
        initiativeId: initiativeId || null,
        assignedTeamMemberId: assignedTeamMemberId || null,
        startDate: startDate ? new Date(startDate) : null,
        finishDate: finishDate ? new Date(finishDate) : null,
        link: link ? link.trim() : null,
        targetValue: targetValue !== undefined && targetValue !== null ? parseFloat(targetValue) : 1,
        currentValue: 0,
        unit: unit || null,
        status: "ON_TRACK",
        kanbanStatus: "TODO",
        weight: 1.0,
        assignedBy: userId,
        ...(assignedTeamMemberId && {
          assignments: {
            create: {
              userId: assignedTeamMemberId,
            },
          },
        }),
      },
      include: {
        creator: {
          select: { id: true, name: true, department: true, role: true },
        },
        assignedTeamMember: {
          select: { id: true, name: true, department: true, role: true },
        },
        assignments: {
          include: { user: { select: { id: true, name: true } } },
        },
        initiative: {
          select: { id: true, title: true, team: true },
        },
        comments: {
          include: { user: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    const targetDeptUsers = await prisma.user.findMany({
      where: {
        OR: [
          { department: targetDept.trim(), role: { in: ["LEADER", "MANAGER"] } },
          {
            managedDepartments: {
              some: { value: targetDept.trim() },
            },
          },
        ],
      },
      select: { id: true },
    });

    const notifiedUserIds = new Set<string>();

    for (const u of targetDeptUsers) {
      if (u.id !== userId) {
        notifiedUserIds.add(u.id);
        await createNotification({
          recipientId: u.id,
          type: "CROSS_DEPT_TASK_CREATED",
          title: "Tugas Lintas Departemen Baru",
          body: `${userName || "Seseorang"} (${userDept || "Lintas Dept"}) menugaskan: "${title.trim()}" ke departemen ${targetDept}`,
          link: "/team/my-work",
        });
      }
    }

    if (assignedTeamMemberId && assignedTeamMemberId !== userId && !notifiedUserIds.has(assignedTeamMemberId)) {
      await createNotification({
        recipientId: assignedTeamMemberId,
        type: "CROSS_DEPT_TASK_ASSIGNED",
        title: "Tugas Lintas Departemen Ditugaskan ke Anda",
        body: `${userName || "Seseorang"} (${userDept || "Lintas Dept"}) menugaskan: "${title.trim()}"`,
        link: "/team/my-work",
      });
    }

    return res.status(201).json(task);
  } catch (error) {
    console.error("Create cross dept task error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}


// GET /api/tasks/cross-dept — Ambil daftar task lintas departemen
export async function getCrossDeptTasks(req: AuthRequest, res: Response) {
  try {
    const { type, dept, status } = req.query as {
      type?: "incoming" | "outgoing" | "all";
      dept?: string;
      status?: string;
    };
    const { id: userId, role } = req.user!;
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { department: true },
    });
    const userDept = dbUser?.department || null;

    let where: any = {
      isCrossDept: true,
    };

    if (status) {
      where.kanbanStatus = status;
    }

    const isAdminOrCLevel = ["ADMIN", "C_LEVEL"].includes(role);

    if (type === "incoming") {
      if (isAdminOrCLevel && dept) {
        where.targetDept = dept;
      } else if (!isAdminOrCLevel) {
        where.OR = [
          { targetDept: userDept || "" },
          { assignedTeamMemberId: userId },
          { assignments: { some: { userId } } },
        ];
      }
    } else if (type === "outgoing") {
      if (isAdminOrCLevel && dept) {
        where.creatorDept = dept;
      } else if (!isAdminOrCLevel) {
        where.OR = [
          { creatorId: userId },
          ...(userDept && ["MANAGER", "LEADER"].includes(role) ? [{ creatorDept: userDept }] : []),
        ];
      }
    } else {
      if (!isAdminOrCLevel) {
        where.OR = [
          { creatorId: userId },
          { creatorDept: userDept || "" },
          { targetDept: userDept || "" },
          { assignedTeamMemberId: userId },
          { assignments: { some: { userId } } },
        ];
      } else if (dept) {
        where.OR = [
          { targetDept: dept },
          { creatorDept: dept },
        ];
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, department: true, role: true },
        },
        assignedTeamMember: {
          select: { id: true, name: true, department: true, role: true },
        },
        assignments: {
          include: { user: { select: { id: true, name: true } } },
        },
        initiative: {
          select: { id: true, title: true, team: true },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, role: true, department: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Get cross dept tasks error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/tasks/:id — Detail task
export async function getTaskById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, department: true, role: true },
        },
        assignedTeamMember: {
          select: { id: true, name: true, department: true, role: true },
        },
        assignments: {
          include: { user: { select: { id: true, name: true } } },
        },
        initiative: {
          select: { id: true, title: true, team: true },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, role: true, department: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task tidak ditemukan" });
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error("Get task by id error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/tasks/:id/status — Update status lifecycle task lintas departemen
// Lifecycle: TODO -> IN_PROGRESS <-> NEED_INFO -> RESOLVED -> CLOSED
export async function updateCrossDeptStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status: targetStatus } = req.body;
    const { id: userId, role } = req.user!;
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { department: true },
    });
    const userDept = dbUser?.department || null;

    const validStatuses = ["TODO", "IN_PROGRESS", "NEED_INFO", "RESOLVED", "CLOSED"];
    if (!targetStatus || !validStatuses.includes(targetStatus)) {
      return res.status(400).json({
        message: `Status tidak valid. Harus salah satu dari: ${validStatuses.join(", ")}`,
      });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        creator: true,
        assignedTeamMember: true,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task tidak ditemukan" });
    }

    const isCreator = task.creatorId === userId;
    const isCreatorManager =
      role === "MANAGER" &&
      task.creatorDept &&
      userDept === task.creatorDept;
    const isAdmin = role === "ADMIN";

    if (targetStatus === "CLOSED") {
      if (!isCreator && !isCreatorManager && !isAdmin) {
        return res.status(403).json({
          message:
            "Hanya pembuat tugas (requester) atau Admin/Manager asal yang berhak menutup (Close) tugas ini",
        });
      }
    }

    if (
      (task.kanbanStatus === "CLOSED" || task.kanbanStatus === "RESOLVED") &&
      (targetStatus === "TODO" || targetStatus === "IN_PROGRESS")
    ) {
      if (!isCreator && !isCreatorManager && !isAdmin) {
        return res.status(403).json({
          message:
            "Hanya pembuat tugas (requester) atau Admin/Manager asal yang berhak membuka kembali (Reopen) tugas ini",
        });
      }
    }

    let generalStatus = task.status;
    if (targetStatus === "CLOSED" || targetStatus === "RESOLVED") {
      generalStatus = "DONE";
    } else {
      generalStatus = "ON_TRACK";
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        kanbanStatus: targetStatus,
        status: generalStatus,
      },
      include: {
        creator: {
          select: { id: true, name: true, department: true, role: true },
        },
        assignedTeamMember: {
          select: { id: true, name: true, department: true, role: true },
        },
        comments: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (targetStatus === "NEED_INFO" && task.creatorId && task.creatorId !== userId) {
      await createNotification({
        recipientId: task.creatorId,
        type: "CROSS_DEPT_NEED_INFO",
        title: "Klarifikasi Diperlukan untuk Tugas Lintas Dept",
        body: `Tugas "${task.title}" membutuhkan informasi tambahan. Silakan beri klarifikasi di kolom diskusi.`,
        link: "/team/my-work",
      });
    } else if (targetStatus === "RESOLVED" && task.creatorId && task.creatorId !== userId) {
      await createNotification({
        recipientId: task.creatorId,
        type: "CROSS_DEPT_RESOLVED",
        title: "Tugas Lintas Departemen Selesai Dikerjakan",
        body: `Tugas "${task.title}" telah diselesaikan. Silakan verifikasi dan Close tugas ini.`,
        link: "/team/my-work",
      });
    } else if (targetStatus === "CLOSED" && task.assignedTeamMemberId && task.assignedTeamMemberId !== userId) {
      await createNotification({
        recipientId: task.assignedTeamMemberId,
        type: "CROSS_DEPT_CLOSED",
        title: "Tugas Lintas Departemen Ditutup",
        body: `Tugas "${task.title}" telah diverifikasi dan resmi ditutup (Closed) oleh pembuat tugas.`,
        link: "/team/my-work",
      });
    }

    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Update cross dept status error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/tasks/:id/reassign — Reassign task oleh M/P level departemen target
export async function reassignCrossDeptTask(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { assignedTeamMemberId } = req.body;
    const { id: userId, role } = req.user!;
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { department: true },
    });
    const userDept = dbUser?.department || null;

    if (!assignedTeamMemberId) {
      return res.status(400).json({ message: "Anggota tim target wajib dipilih" });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!task) {
      return res.status(404).json({ message: "Task tidak ditemukan" });
    }

    const isCreator = task.creatorId === userId;
    const isAdmin = role === "ADMIN";
    const isTargetDeptLeaderOrManager =
      ["MANAGER", "LEADER"].includes(role) &&
      task.targetDept &&
      userDept === task.targetDept;

    let isTargetDeptManager = false;
    if (role === "MANAGER" && task.targetDept) {
      const managedDept = await prisma.department.findFirst({
        where: { managerId: userId, value: task.targetDept },
      });
      if (managedDept) isTargetDeptManager = true;
    }

    if (!isAdmin && !isCreator && !isTargetDeptLeaderOrManager && !isTargetDeptManager) {
      return res.status(403).json({
        message:
          "Hanya Leader/Manager departemen target atau Admin yang berhak mendisposisikan (Reassign) tugas ini",
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: assignedTeamMemberId },
      select: { id: true, name: true, department: true },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "User tujuan tidak ditemukan" });
    }

    await prisma.$transaction([
      prisma.taskAssignment.deleteMany({ where: { taskId: id } }),
      prisma.taskAssignment.create({
        data: {
          taskId: id,
          userId: assignedTeamMemberId,
        },
      }),
      prisma.task.update({
        where: { id },
        data: {
          assignedTeamMemberId,
        },
      }),
    ]);

    const updated = await prisma.task.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, department: true, role: true },
        },
        assignedTeamMember: {
          select: { id: true, name: true, department: true, role: true },
        },
        assignments: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (assignedTeamMemberId !== userId) {
      await createNotification({
        recipientId: assignedTeamMemberId,
        type: "CROSS_DEPT_TASK_ASSIGNED",
        title: "Tugas Lintas Departemen Didisposisikan ke Anda",
        body: `Anda ditugaskan mengerjakan: "${task.title}"`,
        link: "/team/my-work",
      });
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Reassign cross dept task error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/tasks/:id/comments — Ambil komentar task
export async function getTaskComments(req: AuthRequest, res: Response) {
  try {
    const { id: taskId } = req.params;

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, role: true, department: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json(comments);
  } catch (error) {
    console.error("Get task comments error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/tasks/:id/comments — Tambah komentar/klarifikasi (Q&A saat NEED_INFO)
export async function addTaskComment(req: AuthRequest, res: Response) {
  try {
    const { id: taskId } = req.params;
    const { message, attachmentLink } = req.body;
    const { id: userId, name: userName } = req.user!;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Pesan komentar tidak boleh kosong" });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { creator: true, assignedTeamMember: true },
    });

    if (!task) {
      return res.status(404).json({ message: "Task tidak ditemukan" });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId,
        message: message.trim(),
        attachmentLink: attachmentLink ? attachmentLink.trim() : null,
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, department: true },
        },
      },
    });

    const recipientId =
      task.creatorId === userId
        ? task.assignedTeamMemberId
        : task.creatorId;

    if (recipientId && recipientId !== userId) {
      await createNotification({
        recipientId,
        type: "TASK_COMMENT_ADDED",
        title: `Pesan Baru pada Task: ${task.title}`,
        body: `${userName || "Seseorang"}: "${message.trim().slice(0, 80)}${message.length > 80 ? "..." : ""}"`,
        link: "/team/my-work",
      });
    }

    return res.status(201).json(comment);
  } catch (error) {
    console.error("Add task comment error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
