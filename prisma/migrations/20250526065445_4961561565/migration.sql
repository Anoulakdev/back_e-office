-- AlterTable
ALTER TABLE "DocExport" ADD COLUMN     "exporterCode" VARCHAR(255);

-- AddForeignKey
ALTER TABLE "DocExport" ADD CONSTRAINT "DocExport_exporterCode_fkey" FOREIGN KEY ("exporterCode") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;
