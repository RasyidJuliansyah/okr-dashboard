import assert from "assert";
import { calculateProgressPercent, calculateAutoStatus, getTargetPrefix } from "../utils/progress";

// AT_LEAST
assert.strictEqual(calculateProgressPercent(50, 100, "AT_LEAST"), 50);
assert.strictEqual(calculateProgressPercent(120, 100, "AT_LEAST"), 100);
assert.strictEqual(calculateProgressPercent(0, 100, "AT_LEAST"), 0);

// AT_MOST
assert.strictEqual(calculateProgressPercent(800, 1000, "AT_MOST"), 100);
assert.strictEqual(calculateProgressPercent(1000, 1000, "AT_MOST"), 100);
assert.strictEqual(calculateProgressPercent(1200, 1000, "AT_MOST"), 80);
assert.strictEqual(calculateProgressPercent(1500, 1000, "AT_MOST"), 50);
assert.strictEqual(calculateProgressPercent(2000, 1000, "AT_MOST"), 0);

// EXACT
assert.strictEqual(calculateProgressPercent(10, 10, "EXACT"), 100);
assert.strictEqual(calculateProgressPercent(9, 10, "EXACT"), 90);
assert.strictEqual(calculateProgressPercent(11, 10, "EXACT"), 90);

// Auto status
assert.strictEqual(calculateAutoStatus(100), "ON_TRACK");
assert.strictEqual(calculateAutoStatus(80), "ON_TRACK");
assert.strictEqual(calculateAutoStatus(79), "AT_RISK");
assert.strictEqual(calculateAutoStatus(50), "AT_RISK");
assert.strictEqual(calculateAutoStatus(49), "OFF_TRACK");

console.log("Progress tests passed.");
