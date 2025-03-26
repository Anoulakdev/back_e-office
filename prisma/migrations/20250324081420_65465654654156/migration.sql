/*
  Warnings:

  - The `extype` column on the `DocExternal` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `extype` column on the `DocexLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `extype` column on the `DocexTracking` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "DocExternal" DROP COLUMN "extype",
ADD COLUMN     "extype" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "DocexLog" DROP COLUMN "extype",
ADD COLUMN     "extype" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "DocexTracking" DROP COLUMN "extype",
ADD COLUMN     "extype" INTEGER DEFAULT 1;
