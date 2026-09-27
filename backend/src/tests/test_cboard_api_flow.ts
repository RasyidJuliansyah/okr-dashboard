import assert from "node:assert";
import express from "express";
import { PrismaClient } from "@prisma/client";
import authRoutes from "../routes/auth.routes";
import departmentRoutes from "../routes/department.routes";
import * as jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-okr-bsc-dashboard-2026";

async function main() {
  console.log("Starting C-Board & Context Switcher End-to-End Test...");

  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/departments", departmentRoutes);

  const server = app.listen(0);
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const ceo = await prisma.user.findFirst({
      where: { position: { contains: "Executive" } },
    });
    assert(ceo, "CEO user must exist");

    const cto = await prisma.user.findFirst({
      where: { position: { contains: "Technology" } },
    });
    assert(cto, "CTO user must exist");

    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });
    assert(admin, "Admin user must exist");

    const adminToken = jwt.sign(
      { id: admin.id, email: admin.email, role: "ADMIN", name: admin.name },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const ctoToken = jwt.sign(
      {
        id: cto.id,
        email: cto.email,
        role: "C_LEVEL",
        originalRole: "C_LEVEL",
        name: cto.name,
        position: cto.position,
        department: "STRATEGIC",
        activeDepartment: "STRATEGIC",
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const ceoToken = jwt.sign(
      {
        id: ceo.id,
        email: ceo.email,
        role: "C_LEVEL",
        originalRole: "C_LEVEL",
        name: ceo.name,
        position: ceo.position,
        department: "STRATEGIC",
        activeDepartment: "STRATEGIC",
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 1. Admin assigns CTO to TECHDEV
    const techDept = await prisma.department.findUnique({
      where: { value: "TECHDEV" },
    });
    assert(techDept, "TECHDEV department must exist");

    const assignRes = await fetch(`${baseUrl}/api/departments/${techDept.id}/c-level`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ userId: cto.id }),
    });
    assert.strictEqual(assignRes.status, 200, "Assign C-Level should return 200");
    const assignedData: any = await assignRes.json();
    assert.strictEqual(assignedData.cLevelId, cto.id, "Dept cLevelId should equal CTO id");
    console.log("✓ Admin successfully assigned CTO as C-Board sponsor for TECHDEV");

    // 2. GET /api/departments returns cLevel
    const getDeptsRes = await fetch(`${baseUrl}/api/departments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(getDeptsRes.status, 200);
    const depts: any = await getDeptsRes.json();
    const fetchedTech = depts.find((d: any) => d.value === "TECHDEV");
    assert(fetchedTech.cLevel, "TECHDEV must have cLevel object");
    assert.strictEqual(fetchedTech.cLevel.id, cto.id, "TECHDEV cLevel id matches CTO");
    console.log("✓ GET /api/departments returns cLevel relation");

    // 3. POST /api/auth/switch-context
    const ctoSwitchRes = await fetch(`${baseUrl}/api/auth/switch-context`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ctoToken}`,
      },
      body: JSON.stringify({ department: "TECHDEV", role: "MANAGER" }),
    });
    assert.strictEqual(ctoSwitchRes.status, 200);
    const ctoSwitchData: any = await ctoSwitchRes.json();
    assert.strictEqual(ctoSwitchData.user.role, "MANAGER");
    assert.strictEqual(ctoSwitchData.user.originalRole, "C_LEVEL");
    assert.strictEqual(ctoSwitchData.user.department, "TECHDEV");
    console.log("✓ CTO switched context to TECHDEV as Manager");

    const ctoSwitchBackRes = await fetch(`${baseUrl}/api/auth/switch-context`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ctoSwitchData.token}`,
      },
      body: JSON.stringify({ department: "STRATEGIC", role: "C_LEVEL" }),
    });
    assert.strictEqual(ctoSwitchBackRes.status, 200);
    const ctoBackData: any = await ctoSwitchBackRes.json();
    assert.strictEqual(ctoBackData.user.role, "C_LEVEL");
    assert.strictEqual(ctoBackData.user.department, "STRATEGIC");
    console.log("✓ CTO switched context back to Strategic Board");

    // CEO switch universal
    const ceoSwitchRes = await fetch(`${baseUrl}/api/auth/switch-context`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ceoToken}`,
      },
      body: JSON.stringify({ department: "FINANCE", role: "MANAGER" }),
    });
    assert.strictEqual(ceoSwitchRes.status, 200);
    const ceoSwitchData: any = await ceoSwitchRes.json();
    assert.strictEqual(ceoSwitchData.user.department, "FINANCE");
    assert.strictEqual(ceoSwitchData.user.originalRole, "C_LEVEL");
    console.log("✓ CEO switched context to FINANCE with universal executive privileges");

    console.log("\nAll end-to-end C-Board & Context Switcher flows verified successfully!");
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
