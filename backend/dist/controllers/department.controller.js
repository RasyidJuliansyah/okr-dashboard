"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDepartments = getAllDepartments;
exports.createDepartment = createDepartment;
exports.assignManager = assignManager;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getAllDepartments(req, res) {
    try {
        const { role, id: userId } = req.user;
        let where = {};
        if (role === 'TEAM' || role === 'LEADER') {
            const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { department: true } });
            if (dbUser?.department) {
                where.value = dbUser.department;
            }
        }
        else if (role === 'MANAGER') {
            const managed = await prisma.department.findMany({ where: { managerId: userId }, select: { value: true } });
            const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { department: true } });
            const deptValues = new Set(managed.map(d => d.value));
            if (dbUser?.department)
                deptValues.add(dbUser.department);
            if (deptValues.size > 0) {
                where.value = { in: Array.from(deptValues) };
            }
        }
        // ADMIN and C_LEVEL see all
        const depts = await prisma.department.findMany({
            where,
            orderBy: { name: "asc" },
            include: { manager: true },
        });
        return res.status(200).json(depts);
    }
    catch (error) {
        console.error("Get departments error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function createDepartment(req, res) {
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
            },
        });
        return res.status(201).json(newDept);
    }
    catch (error) {
        console.error("Create department error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
async function assignManager(req, res) {
    try {
        const { id } = req.params;
        const { userId } = req.body; // user ID to be manager
        const dept = await prisma.department.findUnique({ where: { id } });
        if (!dept) {
            return res.status(404).json({ message: "Department not found" });
        }
        // Update department manager
        const updatedDept = await prisma.department.update({
            where: { id },
            data: { managerId: userId || null },
            include: { manager: true },
        });
        // If userId is provided, ensure their role is MANAGER
        if (userId) {
            await prisma.user.update({
                where: { id: userId },
                data: { role: "MANAGER" },
            });
        }
        return res.status(200).json(updatedDept);
    }
    catch (error) {
        console.error("Assign manager error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
