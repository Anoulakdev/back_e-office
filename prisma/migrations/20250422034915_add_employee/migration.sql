/*
  Warnings:

  - You are about to drop the column `departmentId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `divisionId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emp_code` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `officeId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `posId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tel` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `unitId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userimg` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DocExternal" DROP CONSTRAINT "DocExternal_creatorCode_fkey";

-- DropForeignKey
ALTER TABLE "DocexLog" DROP CONSTRAINT "DocexLog_assignerCode_fkey";

-- DropForeignKey
ALTER TABLE "DocexLog" DROP CONSTRAINT "DocexLog_receiverCode_fkey";

-- DropForeignKey
ALTER TABLE "DocexTracking" DROP CONSTRAINT "DocexTracking_assignerCode_fkey";

-- DropForeignKey
ALTER TABLE "DocexTracking" DROP CONSTRAINT "DocexTracking_receiverCode_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_officeId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_posId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_unitId_fkey";

-- DropIndex
DROP INDEX "User_emp_code_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "departmentId",
DROP COLUMN "divisionId",
DROP COLUMN "email",
DROP COLUMN "emp_code",
DROP COLUMN "first_name",
DROP COLUMN "gender",
DROP COLUMN "last_name",
DROP COLUMN "officeId",
DROP COLUMN "posId",
DROP COLUMN "tel",
DROP COLUMN "unitId",
DROP COLUMN "userimg",
ADD COLUMN     "employeeId" INTEGER;

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "emp_code" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'A',
    "gender" "Gender" NOT NULL,
    "tel" VARCHAR(255),
    "email" VARCHAR(255),
    "empimg" VARCHAR(255),
    "posId" INTEGER,
    "departmentId" INTEGER,
    "divisionId" INTEGER,
    "officeId" INTEGER,
    "unitId" INTEGER,
    "createdAt" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(0) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_emp_code_key" ON "Employee"("emp_code");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_posId_fkey" FOREIGN KEY ("posId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocExternal" ADD CONSTRAINT "DocExternal_creatorCode_fkey" FOREIGN KEY ("creatorCode") REFERENCES "User"("username") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTracking" ADD CONSTRAINT "DocexTracking_assignerCode_fkey" FOREIGN KEY ("assignerCode") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexTracking" ADD CONSTRAINT "DocexTracking_receiverCode_fkey" FOREIGN KEY ("receiverCode") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexLog" ADD CONSTRAINT "DocexLog_assignerCode_fkey" FOREIGN KEY ("assignerCode") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocexLog" ADD CONSTRAINT "DocexLog_receiverCode_fkey" FOREIGN KEY ("receiverCode") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;
