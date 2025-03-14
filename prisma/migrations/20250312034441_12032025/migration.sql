/*
  Warnings:

  - You are about to drop the column `active` on the `DocexLog` table. All the data in the column will be lost.
  - You are about to drop the column `active` on the `DocexTracking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DocType" ADD COLUMN     "actionMax" INTEGER,
ADD COLUMN     "followMax" INTEGER;

-- AlterTable
ALTER TABLE "DocexLog" DROP COLUMN "active",
ADD COLUMN     "departmentactive" INTEGER,
ADD COLUMN     "divisionactive" INTEGER;

-- AlterTable
ALTER TABLE "DocexTracking" DROP COLUMN "active",
ADD COLUMN     "departmentactive" INTEGER,
ADD COLUMN     "divisionactive" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdById" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
