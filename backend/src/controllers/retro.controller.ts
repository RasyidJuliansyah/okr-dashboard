import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import { logAudit } from "../utils/auditLogger";

const prisma = new PrismaClient();

export const COLUMNS = ["STOP", "START", "CONTINUE", "BLOCKER", "APPRECIATION"];
// Label kolom utk notifikasi mention & ringkasan AI (penamaan kolom DB tidak 1:1 dgn label UI).
export const COLUMN_LABEL: Record<string, string> = {
  CONTINUE: "Continue",
  STOP: "Start",
  BLOCKER: "Stop",
  START: "Action Item",
  APPRECIATION: "Notes Apresiasi Tim",
};
export const MOODS = [
  "😍", "🤣", "😁", "🤩", "🥳", "🤯", "🥵", "😣",
  "😤", "😳", "🫣", "😨", "🤔", "😵‍💫", "😴", "😷",
];
export const REACTIONS = ["👍", "🔥", "🎉", "💪", "❤️", "😂"];
export const MAX_CONTENT = 500;

export interface Actor {
  id: string;
  role: string;
  originalRole?: string | null;
  departmentIds: string[];
}

// ---- Aturan akses (pure, dites di tests/retro.test.ts) ----

const isViewerRole = (r?: string | null) => r === "ADMIN" || r === "C_LEVEL";

export function canRead(a: Actor, deptId: string): boolean {
  return isViewerRole(a.role) || isViewerRole(a.originalRole) || a.departmentIds.includes(deptId);
}

// ADMIN & C_LEVEL hanya baca (termasuk C_LEVEL yang switch-context jadi MANAGER).
// ADMIN yang impersonasi (role lain, originalRole ADMIN) bertindak sebagai role tsb.
export function canWrite(a: Actor, deptId: string): boolean {
  if (isViewerRole(a.role) || a.originalRole === "C_LEVEL") return false;
  return a.departmentIds.includes(deptId) || a.originalRole === "ADMIN";
}

export function canManage(a: Actor, deptId: string): boolean {
  return (a.role === "MANAGER" || a.role === "LEADER") && canWrite(a, deptId);
}

export function validateCard(column: unknown, content: unknown): string | null {
  if (typeof column !== "string" || !COLUMNS.includes(column)) return "Kolom tidak valid";
  if (typeof content !== "string" || !content.trim()) return "Isi kartu wajib diisi";
  if (content.trim().length > MAX_CONTENT) return `Isi kartu maksimal ${MAX_CONTENT} karakter`;
  return null;
}

// ---- Helper DB ----

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function createNotification(params: { recipientId: string; type: string; title: string; body: string; link?: string }) {
  try {
    await prisma.notification.create({ data: params });
  } catch (err) {
    console.error("Create notification error:", err);
  }
}

function handle(res: Response, error: any) {
  if (error instanceof HttpError) return res.status(error.status).json({ message: error.message });
  console.error("Retro error:", error);
  return res.status(500).json({ message: error?.message || "Terjadi kesalahan pada retro" });
}

// Departemen diambil dari DB (bukan JWT) supaya tetap benar setelah user pindah departemen.
async function loadActor(req: AuthRequest): Promise<Actor> {
  const u = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      departmentId: true,
      department: true,
      team: { select: { departmentId: true } },
      managedDepartments: { select: { id: true } },
    },
  });
  if (!u) throw new HttpError(401, "User tidak ditemukan");
  const ids = [u.departmentId, u.team?.departmentId, ...u.managedDepartments.map((d) => d.id)];
  if (!ids.some(Boolean) && u.department) {
    const d = await prisma.department.findUnique({ where: { value: u.department }, select: { id: true } });
    ids.push(d?.id);
  }
  return {
    id: req.user!.id,
    role: req.user!.role,
    originalRole: req.user!.originalRole,
    departmentIds: [...new Set(ids.filter((x): x is string => !!x))],
  };
}

// Scope mention: dept board itu sendiri + seluruh dept lain yang manager-nya sama
// (tim-tim di bawah satu manager boleh saling tag), tanpa expose seluruh organisasi.
async function getMentionScopeDeptIds(deptId: string): Promise<string[]> {
  const dept = await prisma.department.findUnique({ where: { id: deptId }, select: { managerId: true } });
  if (!dept?.managerId) return [deptId];
  const siblings = await prisma.department.findMany({
    where: { managerId: dept.managerId },
    select: { id: true },
  });
  return [...new Set([deptId, ...siblings.map((d) => d.id)])];
}

async function resolveDeptId(req: AuthRequest, a: Actor, requested?: unknown): Promise<string> {
  if (typeof requested === "string" && requested) {
    if (!canRead(a, requested)) throw new HttpError(403, "Anda tidak punya akses ke retro departemen ini");
    return requested;
  }
  const active = req.user?.activeDepartment;
  if (active && active !== "STRATEGIC") {
    const d = await prisma.department.findUnique({ where: { value: active }, select: { id: true } });
    if (d && canRead(a, d.id)) return d.id;
  }
  if (a.departmentIds[0]) return a.departmentIds[0];
  throw new HttpError(400, "Akun belum terhubung ke departemen. Pilih departemen terlebih dahulu.");
}

async function boardContext(req: AuthRequest, boardId: string) {
  const a = await loadActor(req);
  const board = await prisma.retroBoard.findUnique({ where: { id: boardId } });
  if (!board) throw new HttpError(404, "Board retro tidak ditemukan");
  if (!canRead(a, board.departmentId)) throw new HttpError(403, "Anda tidak punya akses ke retro departemen ini");
  return { a, board };
}

function assertWritable(a: Actor, board: { departmentId: string; status: string }) {
  if (!canWrite(a, board.departmentId)) throw new HttpError(403, "Akses Anda hanya baca");
  if (board.status !== "OPEN") throw new HttpError(409, "Retro sudah ditutup");
}

function groupEmoji(rows: { emoji: string; userId: string }[], me: string) {
  const map = new Map<string, { emoji: string; count: number; mine: boolean }>();
  for (const r of rows) {
    const g = map.get(r.emoji) || { emoji: r.emoji, count: 0, mine: false };
    g.count++;
    g.mine ||= r.userId === me;
    map.set(r.emoji, g);
  }
  return [...map.values()];
}

// ---- Handlers ----

// GET /api/retros?sprintId=&departmentId=
export async function getBoard(req: AuthRequest, res: Response) {
  try {
    const { sprintId, departmentId } = req.query;
    if (typeof sprintId !== "string" || !sprintId) throw new HttpError(400, "sprintId wajib diisi");
    const a = await loadActor(req);
    const deptId = await resolveDeptId(req, a, departmentId);
    const department = await prisma.department.findUnique({
      where: { id: deptId },
      select: { id: true, name: true, value: true },
    });
    if (!department) throw new HttpError(404, "Departemen tidak ditemukan");

    const board = await prisma.retroBoard.findUnique({
      where: { sprintId_departmentId: { sprintId, departmentId: deptId } },
      include: {
        cards: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true } },
            reactions: { select: { emoji: true, userId: true } },
            mentions: { select: { mentionedUser: { select: { id: true, name: true } } } },
          },
        },
        moods: { select: { emoji: true, userId: true } },
      },
    });

    res.json({
      department,
      canWrite: canWrite(a, deptId),
      canManage: canManage(a, deptId),
      board: board && {
        id: board.id,
        status: board.status,
        closedAt: board.closedAt,
        createdAt: board.createdAt,
      },
      cards: (board?.cards || []).map((c) => ({
        id: c.id,
        column: c.column,
        content: c.content,
        createdAt: c.createdAt,
        author: c.user,
        reactions: groupEmoji(c.reactions, a.id),
        mentionedUsers: c.mentions.map((m) => m.mentionedUser),
      })),
      moods: groupEmoji(board?.moods || [], a.id),
      myMood: board?.moods.find((m) => m.userId === a.id)?.emoji || null,
    });
  } catch (error) {
    handle(res, error);
  }
}

// POST /api/retros { sprintId, departmentId? } — buka baru / buka ulang
export async function openBoard(req: AuthRequest, res: Response) {
  try {
    const { sprintId, departmentId } = req.body || {};
    if (typeof sprintId !== "string" || !sprintId) throw new HttpError(400, "sprintId wajib diisi");
    const a = await loadActor(req);
    const deptId = await resolveDeptId(req, a, departmentId);
    if (!canManage(a, deptId)) throw new HttpError(403, "Hanya Manager/Leader departemen ini yang bisa membuka retro");
    const sprint = await prisma.sprint.findUnique({ where: { id: sprintId }, select: { id: true } });
    if (!sprint) throw new HttpError(404, "Sprint tidak ditemukan");

    const key = { sprintId_departmentId: { sprintId, departmentId: deptId } };
    let board = await prisma.retroBoard.findUnique({ where: key });
    if (board?.status === "OPEN") return res.json(board);

    const oldStatus = board?.status || null;
    if (board) {
      board = await prisma.retroBoard.update({ where: { id: board.id }, data: { status: "OPEN", closedAt: null } });
    } else {
      try {
        board = await prisma.retroBoard.create({ data: { sprintId, departmentId: deptId, openedById: a.id } });
      } catch (e: any) {
        // Dua manager klik bersamaan: board sudah dibuat request lain.
        if (e?.code === "P2002") return res.json(await prisma.retroBoard.findUnique({ where: key }));
        throw e;
      }
    }

    await logAudit(prisma, {
      userId: a.id,
      action: oldStatus ? "RETRO_REOPEN" : "RETRO_OPEN",
      entityType: "RETRO_BOARD",
      entityId: board.id,
      oldValues: { status: oldStatus },
      newValues: { status: "OPEN", sprintId, departmentId: deptId },
      req,
    });
    res.status(oldStatus ? 200 : 201).json(board);
  } catch (error) {
    handle(res, error);
  }
}

// POST /api/retros/:id/close
export async function closeBoard(req: AuthRequest, res: Response) {
  try {
    const { a, board } = await boardContext(req, req.params.id);
    if (!canManage(a, board.departmentId)) throw new HttpError(403, "Hanya Manager/Leader departemen ini yang bisa menutup retro");
    if (board.status === "CLOSED") return res.json(board);

    const updated = await prisma.retroBoard.update({
      where: { id: board.id },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    await logAudit(prisma, {
      userId: a.id,
      action: "RETRO_CLOSE",
      entityType: "RETRO_BOARD",
      entityId: board.id,
      oldValues: { status: board.status },
      newValues: { status: "CLOSED", sprintId: board.sprintId, departmentId: board.departmentId },
      req,
    });
    res.json(updated);
  } catch (error) {
    handle(res, error);
  }
}

// GET /api/retros/mentionable-users?departmentId=
export async function getMentionableUsers(req: AuthRequest, res: Response) {
  try {
    const { departmentId } = req.query;
    if (typeof departmentId !== "string" || !departmentId) throw new HttpError(400, "departmentId wajib diisi");
    const a = await loadActor(req);
    if (!canRead(a, departmentId)) throw new HttpError(403, "Anda tidak punya akses ke retro departemen ini");
    const scopeDeptIds = await getMentionScopeDeptIds(departmentId);
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [{ departmentId: { in: scopeDeptIds } }, { team: { departmentId: { in: scopeDeptIds } } }],
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    res.json(users);
  } catch (error) {
    handle(res, error);
  }
}

// GET /api/retros/:id/history
export async function getHistory(req: AuthRequest, res: Response) {
  try {
    const { board } = await boardContext(req, req.params.id);
    const logs = await prisma.auditLog.findMany({
      where: { entityType: "RETRO_BOARD", entityId: board.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, action: true, createdAt: true, user: { select: { id: true, name: true } } },
    });
    res.json(logs);
  } catch (error) {
    handle(res, error);
  }
}


// POST /api/retros/:id/cards { column, content }
export async function addCard(req: AuthRequest, res: Response) {
  try {
    const { a, board } = await boardContext(req, req.params.id);
    assertWritable(a, board);
    const { column, content, mentions } = req.body || {};
    const err = validateCard(column, content);
    if (err) throw new HttpError(400, err);

    // Mentions dibatasi ke scope manager board (tim-tim di bawah manager yang sama),
    // id di luar scope diabaikan diam-diam (tidak error keras ke client).
    let mentionIds: string[] = [];
    if (Array.isArray(mentions) && mentions.length) {
      const scopeDeptIds = await getMentionScopeDeptIds(board.departmentId);
      const validUsers = await prisma.user.findMany({
        where: {
          id: { in: mentions.filter((m: unknown) => typeof m === "string") },
          isActive: true,
          OR: [{ departmentId: { in: scopeDeptIds } }, { team: { departmentId: { in: scopeDeptIds } } }],
        },
        select: { id: true },
      });
      mentionIds = [...new Set(validUsers.map((u) => u.id))];
    }

    const card = await prisma.retroCard.create({
      data: {
        boardId: board.id,
        userId: a.id,
        column,
        content: content.trim(),
        mentions: mentionIds.length
          ? { create: mentionIds.map((mentionedUserId) => ({ mentionedUserId })) }
          : undefined,
      },
      include: { mentions: { select: { mentionedUser: { select: { id: true, name: true } } } } },
    });

    const columnLabel = COLUMN_LABEL[column] || column;
    for (const mentionedUserId of mentionIds) {
      if (mentionedUserId === a.id) continue;
      await createNotification({
        recipientId: mentionedUserId,
        type: "RETRO_CARD_MENTION",
        title: "Disebut di Retro Sprint",
        body: `Anda disebut di kartu "${columnLabel}": "${content.trim().slice(0, 120)}"`,
      });
    }

    res.status(201).json({ ...card, mentionedUsers: card.mentions.map((m) => m.mentionedUser) });
  } catch (error) {
    handle(res, error);
  }
}

// DELETE /api/retros/cards/:cardId — pemilik kartu atau Manager/Leader
export async function deleteCard(req: AuthRequest, res: Response) {
  try {
    const card = await prisma.retroCard.findUnique({ where: { id: req.params.cardId } });
    if (!card) throw new HttpError(404, "Kartu tidak ditemukan");
    const { a, board } = await boardContext(req, card.boardId);
    assertWritable(a, board);
    if (card.userId !== a.id && !canManage(a, board.departmentId)) {
      throw new HttpError(403, "Hanya penulis kartu atau Manager/Leader yang bisa menghapus");
    }
    await prisma.retroCard.delete({ where: { id: card.id } });
    res.json({ success: true });
  } catch (error) {
    handle(res, error);
  }
}

// PUT /api/retros/:id/mood { emoji }
export async function setMood(req: AuthRequest, res: Response) {
  try {
    const { a, board } = await boardContext(req, req.params.id);
    assertWritable(a, board);
    const { emoji } = req.body || {};
    if (!MOODS.includes(emoji)) throw new HttpError(400, "Emoji mood tidak valid");
    const mood = await prisma.retroMood.upsert({
      where: { boardId_userId: { boardId: board.id, userId: a.id } },
      create: { boardId: board.id, userId: a.id, emoji },
      update: { emoji },
    });
    res.json(mood);
  } catch (error) {
    handle(res, error);
  }
}

// POST /api/retros/cards/:cardId/reactions { emoji } — toggle
export async function toggleReaction(req: AuthRequest, res: Response) {
  try {
    const { emoji } = req.body || {};
    if (!REACTIONS.includes(emoji)) throw new HttpError(400, "Emoji reaksi tidak valid");
    const card = await prisma.retroCard.findUnique({ where: { id: req.params.cardId } });
    if (!card) throw new HttpError(404, "Kartu tidak ditemukan");
    const { a, board } = await boardContext(req, card.boardId);
    assertWritable(a, board);

    const { count } = await prisma.retroReaction.deleteMany({ where: { cardId: card.id, userId: a.id, emoji } });
    if (count) return res.json({ active: false });
    await prisma.retroReaction.create({ data: { cardId: card.id, userId: a.id, emoji } }).catch((e) => {
      if (e?.code !== "P2002") throw e; // double-click: sudah ada
    });
    res.json({ active: true });
  } catch (error) {
    handle(res, error);
  }
}

// Kolom sumber ringkasan Action Item: Continue, Start (key STOP), Stop (key BLOCKER).
const AI_SUMMARY_COLUMNS = ["CONTINUE", "STOP", "BLOCKER"];

// POST /api/retros/:id/ai-summary — ringkasan Claude dari kartu Continue/Start/Stop
// utk bantu isi Action Item. Tidak disimpan ke DB.
// ponytail: skip cache/history ringkasan (YAGNI); tambah tabel kalau nanti perlu riwayat.
export async function getAiSummary(req: AuthRequest, res: Response) {
  try {
    const { board } = await boardContext(req, req.params.id);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new HttpError(503, "Ringkasan AI sedang tidak tersedia");

    const cards = await prisma.retroCard.findMany({
      where: { boardId: board.id, column: { in: AI_SUMMARY_COLUMNS } },
      orderBy: { createdAt: "asc" },
      select: { column: true, content: true },
    });
    if (!cards.length) throw new HttpError(400, "Belum ada kartu Continue/Start/Stop untuk diringkas");

    const grouped = AI_SUMMARY_COLUMNS.map((col) => {
      const items = cards.filter((c) => c.column === col).map((c) => `- ${c.content}`).join("\n");
      return items ? `${COLUMN_LABEL[col]}:\n${items}` : null;
    }).filter(Boolean).join("\n\n");

    const prompt = `Berikut catatan retrospektif sprint tim (bahasa Indonesia):\n\n${grouped}\n\nBuat ringkasan singkat maksimal 3 poin action item yang konkret dan bisa ditindaklanjuti tim, berdasarkan pola di catatan Continue/Start/Stop di atas. Jawab hanya dengan daftar poin, tanpa pembuka/penutup.`;

    let response: Awaited<ReturnType<typeof fetch>>;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        }),
      }) as any;
    } catch (e) {
      console.error("Anthropic fetch error:", e);
      throw new HttpError(503, "Ringkasan AI sedang tidak tersedia");
    }

    if (!response.ok) {
      console.error("Anthropic API error:", response.status, await response.text().catch(() => ""));
      throw new HttpError(503, "Ringkasan AI sedang tidak tersedia");
    }
    const data: any = await response.json();
    const summary = data?.content?.[0]?.text?.trim();
    if (!summary) throw new HttpError(503, "Ringkasan AI sedang tidak tersedia");

    res.json({ summary });
  } catch (error) {
    handle(res, error);
  }
}

