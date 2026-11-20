import assert from "assert";
import { canRead, canWrite, canManage, validateCard, Actor, MAX_CONTENT } from "../controllers/retro.controller";

const D = "dept-a";
const actor = (role: string, deptIds: string[] = [D], originalRole: string | null = role): Actor => ({
  id: "u1",
  role,
  originalRole,
  departmentIds: deptIds,
});

// validateCard
assert.strictEqual(validateCard("STOP", "ok"), null);
assert.strictEqual(validateCard("CONTINUE", "  ok  "), null);
assert.strictEqual(validateCard("BLOCKER", "ok"), null);
assert.strictEqual(validateCard("APPRECIATION", "ok"), null);
assert.ok(validateCard("WENT_WELL", "ok"));
assert.ok(validateCard("START", "   "));
assert.ok(validateCard("START", 123));
assert.ok(validateCard("START", "x".repeat(MAX_CONTENT + 1)));
assert.strictEqual(validateCard("START", "x".repeat(MAX_CONTENT)), null);

// TEAM: baca & tulis di departemen sendiri, tidak bisa kelola
assert.ok(canRead(actor("TEAM"), D));
assert.ok(canWrite(actor("TEAM"), D));
assert.ok(!canManage(actor("TEAM"), D));
assert.ok(!canRead(actor("TEAM", ["other"]), D));
assert.ok(!canWrite(actor("TEAM", ["other"]), D));

// MANAGER & LEADER: kelola hanya departemen sendiri
assert.ok(canManage(actor("MANAGER"), D));
assert.ok(canManage(actor("LEADER"), D));
assert.ok(!canManage(actor("MANAGER", ["other"]), D));
assert.ok(!canManage(actor("LEADER", ["other"]), D));

// ADMIN & C_LEVEL: hanya baca, semua departemen
for (const r of ["ADMIN", "C_LEVEL"]) {
  assert.ok(canRead(actor(r, []), D));
  assert.ok(!canWrite(actor(r, [D]), D));
  assert.ok(!canManage(actor(r, [D]), D));
}

// C_LEVEL switch-context jadi MANAGER di departemen yang bukan miliknya: tetap baca saja
assert.ok(canRead(actor("MANAGER", [], "C_LEVEL"), D));
assert.ok(!canWrite(actor("MANAGER", [], "C_LEVEL"), D));
// ...juga di departemen yang dia kelola sendiri
assert.ok(!canWrite(actor("MANAGER", [D], "C_LEVEL"), D));
assert.ok(!canManage(actor("MANAGER", [D], "C_LEVEL"), D));

// ADMIN impersonasi MANAGER: bertindak sebagai manager
assert.ok(canWrite(actor("MANAGER", [], "ADMIN"), D));
assert.ok(canManage(actor("MANAGER", [], "ADMIN"), D));

console.log("retro.test.ts: all assertions passed");
