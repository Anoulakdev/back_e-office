/*
  Warnings:

  - You are about to drop the column `docex_dateline` on the `DocExternal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DocExternal" DROP COLUMN "docex_dateline";

-- AlterTable
ALTER TABLE "DocexLog" ADD COLUMN     "dateline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DocexTracking" ADD COLUMN     "dateline" TIMESTAMP(3);
