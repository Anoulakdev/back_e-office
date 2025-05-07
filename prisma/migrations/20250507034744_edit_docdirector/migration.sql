/*
  Warnings:

  - You are about to drop the column `docexlog_file` on the `DocdtLog` table. All the data in the column will be lost.
  - You are about to drop the column `docexlog_size` on the `DocdtLog` table. All the data in the column will be lost.
  - You are about to drop the column `docexlog_type` on the `DocdtLog` table. All the data in the column will be lost.
  - You are about to drop the column `docexlog_file` on the `DocdtTracking` table. All the data in the column will be lost.
  - You are about to drop the column `docexlog_size` on the `DocdtTracking` table. All the data in the column will be lost.
  - You are about to drop the column `docexlog_type` on the `DocdtTracking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DocdtLog" DROP COLUMN "docexlog_file",
DROP COLUMN "docexlog_size",
DROP COLUMN "docexlog_type",
ADD COLUMN     "docdtlog_file" VARCHAR(255),
ADD COLUMN     "docdtlog_size" INTEGER,
ADD COLUMN     "docdtlog_type" VARCHAR(255);

-- AlterTable
ALTER TABLE "DocdtTracking" DROP COLUMN "docexlog_file",
DROP COLUMN "docexlog_size",
DROP COLUMN "docexlog_type",
ADD COLUMN     "docdtlog_file" VARCHAR(255),
ADD COLUMN     "docdtlog_size" INTEGER,
ADD COLUMN     "docdtlog_type" VARCHAR(255);
