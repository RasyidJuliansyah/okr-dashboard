"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = getAllUsers;
exports.createEmployee = createEmployee;
exports.updateEmployee = updateEmployee;
exports.deleteEmployee = deleteEmployee;
exports.updateUserDepartment = updateUserDepartment;
exports.bulkUploadEmployees = bulkUploadEmployees;
exports.getTeams = getTeams;
exports.updateTeam = updateTeam;
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
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
async function getAllUsers(req, res) {
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
    }
    catch (error) {
        console.error("Get users error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
// POST /api/users (Create Employee)
async function createEmployee(req, res) {
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
    }
    catch (error) {
        console.error("Create employee error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
// PATCH /api/users/:id (Update Employee)
async function updateEmployee(req, res) {
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
    }
    catch (error) {
        console.error("Update employee error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
// DELETE /api/users/:id (Delete Employee)
async function deleteEmployee(req, res) {
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
                message: "Pegawai tidak dapat dihapus karena masih terdaftar dalam RACI Assignment Key Result.",
            });
        }
        await prisma.user.delete({ where: { id } });
        return res.status(200).json({ message: "Pegawai berhasil dihapus" });
    }
    catch (error) {
        console.error("Delete employee error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
// PATCH /api/users/:id/department (Legacy/Compatibility)
async function updateUserDepartment(req, res) {
    return updateEmployee(req, res);
}
// POST /api/users/bulk-upload
async function bulkUploadEmployees(req, res) {
    try {
        const { employees } = req.body;
        if (!Array.isArray(employees) || employees.length === 0) {
            return res
                .status(400)
                .json({ message: "Data employees tidak boleh kosong" });
        }
        const results = { success: 0, updated: 0, errors: [] };
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
            if (emp.department &&
                !VALID_DEPARTMENTS.includes(emp.department.toUpperCase())) {
                results.errors.push({
                    row: rowNum,
                    email: emp.email,
                    reason: `Department tidak valid: ${emp.department}`,
                });
                continue;
            }
            if (emp.role &&
                !VALID_ROLES.includes(emp.role.toUpperCase())) {
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
                }
                else {
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
            }
            catch (err) {
                console.error(`Error processing row ${rowNum}:`, err);
                results.errors.push({
                    row: rowNum,
                    email: emp.email,
                    reason: "Gagal menyimpan ke database",
                });
            }
        }
        return res.status(200).json(results);
    }
    catch (error) {
        console.error("Bulk upload error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
// GET /api/teams — Admin ambil semua team dengan leader & department
async function getTeams(req, res) {
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
    }
    catch (error) {
        console.error("Get teams error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
// PATCH /api/teams/:id — Admin update leader & department sebuah Team
async function updateTeam(req, res) {
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
    }
    catch (error) {
        console.error("Update team error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
