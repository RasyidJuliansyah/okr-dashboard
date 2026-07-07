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
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    // Clean existing data
    await prisma.user.deleteMany({});
    await prisma.team.deleteMany({});
    console.log('Seeding database...');
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('password123', saltRounds);
    // Create Team first (managerId will be updated later)
    const team = await prisma.team.create({
        data: {
            name: 'Product & Tech',
        },
    });
    // Create Users
    const admin = await prisma.user.create({
        data: {
            name: 'System Admin',
            email: 'admin@company.com',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });
    const manager = await prisma.user.create({
        data: {
            name: 'Jane Manager',
            email: 'manager@company.com',
            password: hashedPassword,
            role: 'MANAGER',
            teamId: team.id,
        },
    });
    // Update team with managerId
    await prisma.team.update({
        where: { id: team.id },
        data: { managerId: manager.id },
    });
    const clevel = await prisma.user.create({
        data: {
            name: 'Alice CEO',
            email: 'clevel@company.com',
            password: hashedPassword,
            role: 'C_LEVEL',
        },
    });
    const employee = await prisma.user.create({
        data: {
            name: 'John Employee',
            email: 'employee@company.com',
            password: hashedPassword,
            role: 'EMPLOYEE',
            teamId: team.id,
        },
    });
    console.log('Seeding finished successfully:');
    console.log({
        admin: admin.email,
        manager: manager.email,
        clevel: clevel.email,
        employee: employee.email,
        team: team.name,
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
