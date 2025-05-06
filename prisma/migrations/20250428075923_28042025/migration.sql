/*
  Warnings:

  - You are about to drop the column `docexlog_file` on the `DocinLog` table. All the data in the column will be lost.
  - You are about to drop the column `docexlog_size` on the `DocinLog` table. All the data in the column will be lost.
  - You are about to drop the column `docexlog_type` on the `DocinLog` table. All the data in the column will be lost.
  - You are about to drop the column `docexlog_file` on the `DocinTracking` table. All the data in the column will be lost.
  - You are about to drop the column `docexlog_size` on the `DocinTracking` table. All the data in the column will be lost.
  - You are about to drop the column `docexlog_type` on the `DocinTracking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DocinLog" DROP COLUMN "docexlog_file",
DROP COLUMN "docexlog_size",
DROP COLUMN "docexlog_type",
ADD COLUMN     "docinlog_file" VARCHAR(255),
ADD COLUMN     "docinlog_size" INTEGER,
ADD COLUMN     "docinlog_type" VARCHAR(255);

-- AlterTable
ALTER TABLE "DocinTracking" DROP COLUMN "docexlog_file",
DROP COLUMN "docexlog_size",
DROP COLUMN "docexlog_type",
ADD COLUMN     "docinlog_file" VARCHAR(255),
ADD COLUMN     "docinlog_size" INTEGER,
ADD COLUMN     "docinlog_type" VARCHAR(255);
