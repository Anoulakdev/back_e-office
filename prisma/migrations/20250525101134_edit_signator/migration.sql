/*
  Warnings:

  - You are about to drop the column `signatoryCode` on the `DocExport` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DocExport" DROP CONSTRAINT "DocExport_signatoryCode_fkey";

-- AlterTable
ALTER TABLE "DocExport" DROP COLUMN "signatoryCode",
ADD COLUMN     "signatorCode" VARCHAR(255);

-- AddForeignKey
ALTER TABLE "DocExport" ADD CONSTRAINT "DocExport_signatorCode_fkey" FOREIGN KEY ("signatorCode") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;
