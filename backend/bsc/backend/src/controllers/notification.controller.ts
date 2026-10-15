import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

// GET /api/notifications — Ambil notifikasi milik user yang sedang login
export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const { id: userId } = req.user!;
    const { unread } = req.query as { unread?: string };

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: userId,
        ...(unread === "true" ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });

    return res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/notifications/:id/read — Tandai satu notifikasi sebagai sudah dibaca
export async function markNotificationRead(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { id: userId } = req.user!;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notifikasi tidak ditemukan" });
    }

    if (notification.recipientId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/notifications/read-all — Tandai semua notifikasi sebagai sudah dibaca
export async function markAllNotificationsRead(
  req: AuthRequest,
  res: Response,
) {
  try {
    const { id: userId } = req.user!;

    await prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });

    return res
      .status(200)
      .json({ message: "Semua notifikasi ditandai dibaca" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
