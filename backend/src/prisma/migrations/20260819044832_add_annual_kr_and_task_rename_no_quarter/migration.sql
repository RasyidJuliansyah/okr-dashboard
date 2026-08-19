/*
  Warnings:

  - You are about to drop the column `quarter` on the `Objective` table. All the data in the column will be lost.
  - Added the required column `year` to the `Objective` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "AnnualKeyResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objectiveId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" REAL NOT NULL,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "bscPerspective" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ON_TRACK',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AnnualKeyResult_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KrAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyResultId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raciRole" TEXT NOT NULL DEFAULT 'RESPONSIBLE',
    CONSTRAINT "KrAssignment_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "KeyResult" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "KrAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KrDepartment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyResultId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KrDepartment_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "KeyResult" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Initiative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyResultId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "ownerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" REAL NOT NULL DEFAULT 0,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "achievedValue" REAL,
    "unit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ON_TRACK',
    "kanbanStatus" TEXT NOT NULL DEFAULT 'TODO',
    "weight" REAL NOT NULL DEFAULT 1.0,
    "startDate" DATETIME,
    "dueDate" DATETIME,
    "sprintMonth" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Initiative_keyResultId_fkey" FOREIGN KEY ("keyResultId") REFERENCES "KeyResult" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Initiative_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Initiative_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiativeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "unit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ON_TRACK',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "oldValue" REAL NOT NULL,
    "newValue" REAL NOT NULL,
    "note" TEXT,
    "submittedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "reviewedBy" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskUpdate_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "managerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Department_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InitiativeUpdate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiativeId" TEXT NOT NULL,
    "oldValue" REAL NOT NULL,
    "newValue" REAL NOT NULL,
    "note" TEXT,
    "kanbanStatus" TEXT,
    "submittedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InitiativeUpdate_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KeyResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objectiveId" TEXT NOT NULL,
    "annualKeyResultId" TEXT,
    "month" TEXT,
    "monthWeight" REAL NOT NULL DEFAULT 1.0,
    "title" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "bscPerspective" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ON_TRACK',
    "isManualOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KeyResult_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "KeyResult_annualKeyResultId_fkey" FOREIGN KEY ("annualKeyResultId") REFERENCES "AnnualKeyResult" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_KeyResult" ("bscPerspective", "createdAt", "currentValue", "id", "objectiveId", "status", "targetValue", "title", "unit", "updatedAt") SELECT "bscPerspective", "createdAt", "currentValue", "id", "objectiveId", "status", "targetValue", "title", "unit", "updatedAt" FROM "KeyResult";
DROP TABLE "KeyResult";
ALTER TABLE "new_KeyResult" RENAME TO "KeyResult";
CREATE INDEX "KeyResult_annualKeyResultId_idx" ON "KeyResult"("annualKeyResultId");
CREATE INDEX "KeyResult_month_idx" ON "KeyResult"("month");
CREATE TABLE "new_Objective" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "year" TEXT NOT NULL,
    "ownerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Objective" ("createdAt", "description", "id", "ownerId", "title") SELECT "createdAt", "description", "id", "ownerId", "title" FROM "Objective";
DROP TABLE "Objective";
ALTER TABLE "new_Objective" RENAME TO "Objective";
CREATE TABLE "new_Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "managerId" TEXT,
    "leaderId" TEXT,
    "department" TEXT,
    CONSTRAINT "Team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("id", "managerId", "name") SELECT "id", "managerId", "name" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TEAM',
    "department" TEXT,
    "position" TEXT,
    "teamId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password", "role", "teamId") SELECT "createdAt", "email", "id", "name", "password", "role", "teamId" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AnnualKeyResult_objectiveId_idx" ON "AnnualKeyResult"("objectiveId");

-- CreateIndex
CREATE INDEX "AnnualKeyResult_year_idx" ON "AnnualKeyResult"("year");

-- CreateIndex
CREATE INDEX "KrAssignment_keyResultId_idx" ON "KrAssignment"("keyResultId");

-- CreateIndex
CREATE INDEX "KrAssignment_userId_idx" ON "KrAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KrAssignment_keyResultId_userId_key" ON "KrAssignment"("keyResultId", "userId");

-- CreateIndex
CREATE INDEX "KrDepartment_keyResultId_idx" ON "KrDepartment"("keyResultId");

-- CreateIndex
CREATE UNIQUE INDEX "KrDepartment_keyResultId_department_key" ON "KrDepartment"("keyResultId", "department");

-- CreateIndex
CREATE INDEX "Initiative_sprintMonth_idx" ON "Initiative"("sprintMonth");

-- CreateIndex
CREATE INDEX "TaskAssignment_taskId_idx" ON "TaskAssignment"("taskId");

-- CreateIndex
CREATE INDEX "TaskAssignment_userId_idx" ON "TaskAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_taskId_userId_key" ON "TaskAssignment"("taskId", "userId");

-- CreateIndex
CREATE INDEX "TaskUpdate_taskId_createdAt_idx" ON "TaskUpdate"("taskId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Department_value_key" ON "Department"("value");

-- CreateIndex
CREATE INDEX "InitiativeUpdate_initiativeId_createdAt_idx" ON "InitiativeUpdate"("initiativeId", "createdAt");

-- CreateIndex
CREATE INDEX "KrUpdate_keyResultId_updatedAt_idx" ON "KrUpdate"("keyResultId", "updatedAt");
