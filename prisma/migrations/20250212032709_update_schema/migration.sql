/*
  Warnings:

  - You are about to drop the column `outsider` on the `DocExternal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DocExternal" DROP COLUMN "outsider",
ADD COLUMN     "outsiderId" INTEGER,
ALTER COLUMN "docex_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "docex_dateline" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BelongTo" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "BelongTo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outsider" (
    "id" SERIAL NOT NULL,
    "belongId" INTEGER,
    "name" VARCHAR(255),

    CONSTRAINT "Outsider_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DocExternal" ADD CONSTRAINT "DocExternal_outsiderId_fkey" FOREIGN KEY ("outsiderId") REFERENCES "Outsider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outsider" ADD CONSTRAINT "Outsider_belongId_fkey" FOREIGN KEY ("belongId") REFERENCES "BelongTo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
