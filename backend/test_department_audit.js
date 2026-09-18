const assert = require("assert");

function shouldDemoteManager(oldManagerId, newManagerId, otherDeptsCount) {
  if (oldManagerId && oldManagerId !== newManagerId) {
    return otherDeptsCount === 0;
  }
  return false;
}

assert.strictEqual(shouldDemoteManager("mgr-1", null, 0), true, "Demote when unassigned and 0 other depts");
assert.strictEqual(shouldDemoteManager("mgr-1", null, 1), false, "Keep MANAGER when has 1 other dept");
assert.strictEqual(shouldDemoteManager("mgr-1", "mgr-2", 0), true, "Demote replaced manager when 0 other depts");
assert.strictEqual(shouldDemoteManager("mgr-1", "mgr-1", 0), false, "Do nothing if same manager");
assert.strictEqual(shouldDemoteManager(null, "mgr-1", 0), false, "Do nothing if dept previously had no manager");

function buildDeptWhere(role, userDept, managedValues = []) {
  const where = {};
  if (role === "TEAM" || role === "LEADER") {
    where.isActive = true;
    if (userDept) where.value = userDept;
  } else if (role === "MANAGER") {
    where.isActive = true;
    if (managedValues.length > 0) where.value = { in: managedValues };
  }
  return where;
}

const teamWhere = buildDeptWhere("TEAM", "FINANCE");
assert.strictEqual(teamWhere.isActive, true);
assert.strictEqual(teamWhere.value, "FINANCE");

const adminWhere = buildDeptWhere("ADMIN");
assert.strictEqual(adminWhere.isActive, undefined, "ADMIN sees all");

console.log("Department and Audit unit check passed.");
