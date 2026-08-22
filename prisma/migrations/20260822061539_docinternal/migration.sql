-- AlterTable
ALTER TABLE "DocInternal" ADD COLUMN     "departure_type" INTEGER DEFAULT 1,
ADD COLUMN     "fromDepartmentId" INTEGER,
ADD COLUMN     "fromDivisionId" INTEGER;

-- AddForeignKey
ALTER TABLE "DocInternal" ADD CONSTRAINT "DocInternal_fromDepartmentId_fkey" FOREIGN KEY ("fromDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocInternal" ADD CONSTRAINT "DocInternal_fromDivisionId_fkey" FOREIGN KEY ("fromDivisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
