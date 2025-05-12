/*
  Warnings:

  - You are about to drop the column `dtype` on the `DocType` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DocType" DROP COLUMN "dtype",
ADD COLUMN     "soptype" TEXT;
