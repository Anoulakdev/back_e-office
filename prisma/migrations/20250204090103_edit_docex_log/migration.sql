-- DropForeignKey
ALTER TABLE "DocexLog" DROP CONSTRAINT "DocexLog_departmentId_fkey";

-- AlterTable
ALTER TABLE "DocexLog" ALTER COLUMN "departmentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DocexLog" ADD CONSTRAINT "DocexLog_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
